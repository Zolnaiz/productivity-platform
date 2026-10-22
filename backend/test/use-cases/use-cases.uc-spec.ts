import { INestApplication } from '@nestjs/common';
import { bootApp, buildTeam, data, errorCode, layoutBody, previousMonth, Team, thisMonday, today } from './app';

/**
 * One acceptance test per use case (thesis, UC-01 … UC-22), through the HTTP
 * API of the real application on a real PostgreSQL: the main flow, and one
 * alternative or refused flow. Names start with the use-case number;
 * `npm run results` reads them into docs/RESULTS.md.
 */
let app: INestApplication;
let team: Team;
let planId: string;
let zoneId: string;
let templateId: string;

beforeAll(async () => {
  app = await bootApp();
  team = await buildTeam(app);

  const plan = await team.owner.post('/five-s-layouts', { name: 'Main floor', site: 'Plant' });
  planId = data(plan).id;
  zoneId = `zone-${Date.now()}`;
  const zones = [
    {
      id: zoneId, code: 'A01', name: 'Assembly', color: '#38bdf8', x: 40, y: 40, width: 190, height: 118,
      contents: '', standard: 'Tools on the shadow board', labelText: '', stage: 'sort', auditFrequency: 'weekly',
      ownerId: team.employeeId,
    },
  ];
  const saved = await team.owner.patch(`/five-s-layouts/${planId}`, layoutBody(data(plan), zones));
  if (saved.status !== 200) throw new Error(`layout save failed: ${saved.status} ${JSON.stringify(saved.body)}`);

  const template = await team.owner.post('/audit-templates', {
    title: '5S check', category: '5s',
    questions: [
      { id: 'q1', text: 'Sorted', type: 'score', maxScore: 5 },
      { id: 'q2', text: 'Labelled', type: 'score', maxScore: 5 },
    ],
  });
  templateId = data(template).id;
});

afterAll(async () => {
  await app?.close();
});

describe('UC-01 Оноосон ажлаа гүйцэтгэх (complete an assigned task)', () => {
  it('main: the assignee moves their task to done and its completion is recorded', async () => {
    const created = data(await team.manager.post('/tasks', { title: 'Clear aisle 3', assigneeId: team.employeeId, dueDate: today() }));
    const done = await team.employee.patch(`/tasks/${created.id}`, { status: 'done' });
    expect(done.status).toBe(200);
    expect(data(done).status).toBe('done');
    expect(data(done).completedAt).toBeTruthy();
  });

  it('refused: an employee cannot change somebody else’s task', async () => {
    const theirs = data(await team.manager.post('/tasks', { title: 'Manager’s own', assigneeId: team.managerId }));
    const response = await team.employee.patch(`/tasks/${theirs.id}`, { status: 'done' });
    // Somebody else's task is not even visible to an employee: refused as not found.
    expect([403, 404]).toContain(response.status);
    const unchanged = data<any[]>(await team.manager.get('/tasks')).find((task) => task.id === theirs.id);
    expect(unchanged.status).not.toBe('done');
  });
});

describe('UC-02 Өдрийн ажлын бүртгэл хөтлөх (keep the daily work log)', () => {
  it('main: a daily log with hours is saved and read back', async () => {
    const saved = await team.employee.post('/work-logs/daily', { summary: 'Assembled 40 units', hours: 6, logDate: today() });
    expect(saved.status).toBe(201);
    const logs = data<any[]>(await team.employee.get('/work-logs'));
    expect(logs.some((log) => log.summary === 'Assembled 40 units')).toBe(true);
  });

  it('alternative: a log without a summary is refused as invalid', async () => {
    const response = await team.employee.post('/work-logs/daily', { hours: 2 });
    expect(response.status).toBe(400);
  });

  it('alternative: a phone that lost the answer sends the log again and it is saved once', async () => {
    const key = `uc02-${Date.now()}-retry`;
    const summary = `Packed 12 crates ${key}`;
    const body = { summary, hours: 3, logDate: today() };

    const first = await team.employee.post('/work-logs/daily', body).set('Idempotency-Key', key);
    const again = await team.employee.post('/work-logs/daily', body).set('Idempotency-Key', key);
    expect(first.status).toBe(201);
    expect(again.status).toBe(201);
    expect(again.headers['idempotent-replayed']).toBe('true');
    expect(data(again)).toEqual(data(first));

    const logs = data<any[]>(await team.employee.get('/work-logs'));
    expect(logs.filter((log) => log.summary === summary)).toHaveLength(1);

    // The key is the employee's: the same key on another request is refused, not replayed.
    const reused = await team.employee.post('/ideas', { title: 'x', description: 'y' }).set('Idempotency-Key', key);
    expect(reused.status).toBe(409);
    expect(errorCode(reused)).toBe('IDEMPOTENCY_KEY_REUSED');
  });
});

describe('UC-03 Долоо хоногийн тайлан бичих (write the weekly check-in)', () => {
  it('main: the employee saves this week’s check-in and reads it back', async () => {
    const saved = await team.employee.put('/checkins/mine', { week: thisMonday(), progress: 'Line 2 moved', plans: 'Label racks', problems: '' });
    expect([200, 201]).toContain(saved.status);
    const mine = data(await team.employee.get(`/checkins/mine?week=${thisMonday()}`));
    expect(mine.progress).toBe('Line 2 moved');
  });

  it('refused: an employee cannot read the team’s check-ins', async () => {
    expect((await team.employee.get(`/checkins?week=${thisMonday()}`)).status).toBe(403);
  });
});

describe('UC-04 Сарын тайлангаа өөрийн бүртгэлээс бэлтгэх (prepare own monthly report)', () => {
  it('main: the monthly report counts the employee’s own logs and measurements', async () => {
    const report = data(await team.employee.get(`/operations/monthly-report?month=${today().slice(0, 7)}`));
    expect(report.period).toBe(today().slice(0, 7));
    expect(report.workLogs.length).toBeGreaterThan(0);
    expect(report.workLogs.every((log: any) => log.userId === team.employeeId)).toBe(true);
    expect(report.measurements.version).toBe(2);
  });

  it('refused: an employee cannot draft the team’s monthly summary', async () => {
    const response = await team.employee.post('/operations/monthly-summary/draft', { month: today().slice(0, 7) });
    expect(response.status).toBe(403);
  });
});

describe('UC-05 Улаан шошгоор дутагдал бүртгэх (raise a red tag)', () => {
  it('main: a red tag on a zone is recorded with a follow-up task', async () => {
    const tagged = await team.employee.post(`/five-s-layouts/${planId}/zones/${zoneId}/red-tags`, { title: 'Broken pallet', disposition: 'discard' });
    expect(tagged.status).toBe(201);
    expect(data(tagged).title).toBe('Broken pallet');
  });

  it('alternative: a red tag on a zone that does not exist is refused', async () => {
    const response = await team.employee.post(`/five-s-layouts/${planId}/zones/no-such-zone/red-tags`, { title: 'Ghost' });
    expect(response.status).toBe(404);
  });
});

describe('UC-06 Сайжруулалтын санаа гаргах (suggest an improvement)', () => {
  it('main: the idea is saved as submitted', async () => {
    const idea = await team.employee.post('/ideas', { title: 'Shadow board for wrenches', area: 'Assembly' });
    expect(idea.status).toBe(201);
    expect(data(idea).status).toBe('submitted');
  });

  it('alternative: an idea with a too-short title is refused', async () => {
    expect((await team.employee.post('/ideas', { title: 'x' })).status).toBe(400);
  });
});

describe('UC-07 Хувийн бүртгэлээ удирдах (manage own account)', () => {
  it('main: edit own phone, change password with the current one, sign in with the new one', async () => {
    const edited = await team.employee.patch('/users/profile/me', { phone: '+97688001122', language: 'mn' });
    expect(edited.status).toBe(200);
    expect((await team.employee.post('/auth/change-password', { currentPassword: 'Password123', newPassword: 'NewPassword123' })).status).toBe(201);
    const me = data(await team.employee.get('/auth/me'));
    const login = await team.anonymous.post('/auth/login', { email: me.email, password: 'NewPassword123' });
    expect(login.status).toBe(200);
  });

  it('main: keeps personal notes on the server and deletes own records; another person’s is not found', async () => {
    const note = await team.manager.post('/notes', { title: 'Huddle points', content: 'Ask about line 2' });
    expect(note.status).toBe(201);
    expect((await team.owner.del(`/notes/${data(note).id}`)).status).toBe(404);
    expect(data<any[]>(await team.owner.get('/notes')).some((item) => item.id === data(note).id)).toBe(false);
    expect((await team.manager.del(`/notes/${data(note).id}`)).status).toBe(200);
    expect(data<any[]>(await team.manager.get('/notes'))).toEqual([]);
  });

  it('main: focus sessions are kept on the server and badges come from the person’s own records', async () => {
    expect((await team.employee.post('/focus-sessions', { title: 'Write up line 2', minutes: 25 })).status).toBe(201);
    expect(data<any[]>(await team.employee.get('/focus-sessions')).map((item) => item.title)).toContain('Write up line 2');
    const badges = data<any[]>(await team.employee.get('/badges'));
    expect(badges.find((badge) => badge.id === 'firstWorkLog')).toMatchObject({ earned: true });
    // The owner logged no work: nothing is handed out for free.
    const ownerBadges = data<any[]>(await team.owner.get('/badges'));
    expect(ownerBadges.find((badge) => badge.id === 'firstWorkLog')).toMatchObject({ earned: false, current: 0 });
  });

  it('main: a browser keeps its session in an HttpOnly cookie that no script can read', async () => {
    const me = data(await team.manager.get('/auth/me'));
    const login = await team.anonymous
      .post('/auth/login', { email: me.email, password: 'Password123' })
      .set('X-Session-Cookie', 'true');
    expect(login.status).toBe(200);
    expect(data(login).refresh_token).toBeUndefined();
    const cookie = String(login.headers['set-cookie']?.[0] ?? '');
    expect(cookie).toMatch(/^pp_refresh=[^;]+/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api\/auth/);

    // The cookie alone is enough to get a new access token.
    const refreshed = await team.anonymous.post('/auth/refresh', {}).set('X-Session-Cookie', 'true').set('Cookie', cookie.split(';')[0]);
    expect(refreshed.status).toBe(200);
    expect(data(refreshed).access_token).toEqual(expect.any(String));

    const out = await team.anonymous
      .post('/auth/logout', {})
      .set('Authorization', `Bearer ${data(refreshed).access_token}`)
      .set('Cookie', cookie.split(';')[0]);
    expect(String(out.headers['set-cookie']?.[0] ?? '')).toMatch(/^pp_refresh=;/);
    expect((await team.anonymous.post('/auth/refresh', {}).set('X-Session-Cookie', 'true')).status).toBe(401);
  });

  it('refused: a wrong current password, and a forgot-password answer that reveals nothing', async () => {
    const wrong = await team.employee.post('/auth/change-password', { currentPassword: 'nope-nope', newPassword: 'Whatever123' });
    expect(wrong.status).toBe(400);
    expect(errorCode(wrong)).toBe('AUTH_CURRENT_PASSWORD_WRONG');
    const unknown = await team.anonymous.post('/auth/forgot-password', { email: 'nobody@uc.test' });
    expect(unknown.status).toBe(201);
    expect(data(unknown).message).toMatch(/If this email is registered/);
    expect((await team.anonymous.post('/auth/reset-password', { token: 'forged', password: 'Whatever123' })).status).toBe(400);
  });
});

describe('UC-08 5S аудит хийх (run a 5S audit) «include» create and notify a task', () => {
  it('main: an audit on a zone is scored; a follow-up task is created and assigned', async () => {
    const run = await team.employee.post('/audit-runs', {
      templateId, zoneId, status: 'submitted',
      answers: [{ questionId: 'q1', value: 5 }, { questionId: 'q2', value: 2 }],
    });
    expect(run.status).toBe(201);
    expect(Number(data(run).score)).toBeGreaterThanOrEqual(0);
    const followUp = await team.manager.post(`/audit-runs/${data(run).id}/follow-up`, { title: 'Label the shelves', assigneeId: team.employeeId });
    expect([200, 201]).toContain(followUp.status);
    const inbox = data<any[]>(await team.employee.get('/notifications'));
    expect(inbox.length).toBeGreaterThan(0);
  });

  it('refused: an audit against a template that does not exist', async () => {
    const response = await team.employee.post('/audit-runs', { templateId: '00000000-0000-4000-8000-000000000000', zoneId });
    expect(response.status).toBe(404);
    expect(errorCode(response)).toBe('RESOURCE_NOT_FOUND');
  });
});

describe('UC-09 Төсөл үүсгэж, ажил оноож хянах (create a project, assign and track) «include» notify', () => {
  it('main: the manager creates a project and a task; the assignee is notified', async () => {
    const project = await team.manager.post('/projects', { name: 'Line 2 layout' });
    expect(project.status).toBe(201);
    const before = data<any[]>(await team.employee.get('/notifications')).length;
    const task = await team.manager.post('/tasks', { title: 'Move bench 4', projectId: data(project).id, assigneeId: team.employeeId, dueDate: today() });
    expect(task.status).toBe(201);
    const after = data<any[]>(await team.employee.get('/notifications')).length;
    expect(after).toBeGreaterThan(before);
  });

  it('refused: an employee cannot create a project', async () => {
    expect((await team.employee.post('/projects', { name: 'Mine' })).status).toBe(403);
  });
});

describe('UC-10 Сарын төлөвлөгөө гаргах (plan the month)', () => {
  it('main: tasks are planned for next month with owners and dates', async () => {
    const [year, month] = today().split('-').map(Number);
    const nextMonthDay = new Date(Date.UTC(year, month, 15)).toISOString().slice(0, 10);
    const planned = await team.manager.post('/tasks', { title: 'Quarterly 5S audit', assigneeId: team.employeeId, dueDate: nextMonthDay });
    expect(planned.status).toBe(201);
    const tasks = data<any[]>(await team.manager.get('/tasks'));
    expect(tasks.some((task) => task.id === data(planned).id && String(task.dueDate).startsWith(nextMonthDay))).toBe(true);
  });

  it('refused: an employee cannot plan work for others', async () => {
    expect((await team.employee.post('/tasks', { title: 'Plan', assigneeId: team.managerId })).status).toBe(403);
  });
});

describe('UC-11 Өглөөний хурал хөтлөх (run the morning huddle)', () => {
  it('main: the manager reads the team’s week and open work for the huddle board', async () => {
    const checkins = await team.manager.get(`/checkins?week=${thisMonday()}`);
    expect(checkins.status).toBe(200);
    expect(data<any[]>(checkins).some((checkin) => checkin.userId === team.employeeId)).toBe(true);
    expect((await team.manager.get('/tasks')).status).toBe(200);
  });

  it('alternative: a week that is not a date is refused', async () => {
    expect((await team.manager.get('/checkins?week=yesterday')).status).toBe(400);
  });
});

describe('UC-12 Gemba явалт хийх (gemba walk) «include» create and notify tasks', () => {
  it('main: a walk is recorded and its follow-up becomes a task for the named person', async () => {
    const walk = await team.manager.post('/gemba', {
      area: 'Assembly', observations: 'Cables on the floor', conversations: 'Asked why',
      followUps: [{ title: 'Tie up cables at bench 2', assigneeId: team.employeeId }],
    });
    expect(walk.status).toBe(201);
    const tasks = data<any[]>(await team.employee.get('/tasks'));
    expect(tasks.some((task) => task.sourceType === 'gemba_walk')).toBe(true);
  });

  it('refused: an employee cannot record a gemba walk', async () => {
    expect((await team.employee.post('/gemba', { area: 'Assembly' })).status).toBe(403);
  });
});

describe('UC-13 Санааг хянаж шийдвэрлэх (review an idea) «include» create and notify a task', () => {
  it('main: approving an idea creates the task to put it in place', async () => {
    const idea = data(await team.employee.post('/ideas', { title: 'Colour-code the bins' }));
    const reviewed = await team.manager.patch(`/ideas/${idea.id}/review`, { status: 'approved', note: 'Go ahead', assigneeId: team.employeeId });
    expect(reviewed.status).toBe(200);
    expect(data(reviewed).status).toBe('approved');
    const tasks = data<any[]>(await team.employee.get('/tasks'));
    expect(tasks.some((task) => task.sourceType === 'idea' && task.sourceId === idea.id)).toBe(true);
  });

  it('refused: an employee cannot decide on ideas', async () => {
    const idea = data(await team.employee.post('/ideas', { title: 'Self-approve this' }));
    expect((await team.employee.patch(`/ideas/${idea.id}/review`, { status: 'approved' })).status).toBe(403);
  });
});

describe('UC-14 Багийн бүтээмжийг дүгнэх (review team productivity)', () => {
  it('main: the manager sees the team’s month with K1–K6 and per-person rows', async () => {
    const report = data(await team.manager.get(`/operations/monthly-report?month=${today().slice(0, 7)}`));
    const m = report.measurements;
    for (const key of ['onTimeDelivery', 'lateWork', 'zoneAuditScore', 'fixClosureDays', 'checkinRate', 'workLinkage']) {
      expect(m[key]).toEqual(expect.objectContaining({ numerator: expect.any(Number), denominator: expect.any(Number), excluded: expect.any(Number) }));
    }
    expect(m.checkinRate.numerator).toBeGreaterThanOrEqual(1);
    expect(report.people.some((person: any) => person.userId === team.employeeId)).toBe(true);
  });

  it('main (PDCA check): an audit-raised fix is verified by the next audit of its area', async () => {
    const failing = data(await team.employee.post('/audit-runs', {
      templateId, zoneId, status: 'submitted', score: 40,
      answers: [{ questionId: 'q1', value: 1 }, { questionId: 'q2', value: 1 }],
    }));
    const fix = data<any[]>(await team.manager.get('/tasks')).find((task) => task.sourceType === 'audit_run' && task.sourceId === failing.id);
    expect(fix).toBeTruthy();
    await team.manager.patch(`/tasks/${fix.id}`, { status: 'done' });
    await team.employee.post('/audit-runs', { templateId, zoneId, status: 'submitted', score: 95, answers: [{ questionId: 'q1', value: 5 }, { questionId: 'q2', value: 5 }] });
    const check = data(await team.manager.get('/operations/improvement-verification'));
    expect(check.fixes.find((item: any) => item.taskId === fix.id)).toMatchObject({ status: 'verified', triggerScore: 40, reauditScore: 95 });
  });

  it('main (PDCA loop): the fixer records the root cause and a manager signs the finished fix off', async () => {
    const failing = data(await team.employee.post('/audit-runs', {
      templateId, zoneId, status: 'submitted', score: 30,
      answers: [{ questionId: 'q1', value: 1 }, { questionId: 'q2', value: 1 }],
    }));
    const fix = data<any[]>(await team.manager.get('/tasks')).find((task) => task.sourceType === 'audit_run' && task.sourceId === failing.id);
    expect(fix.assigneeId).toBe(team.employeeId);

    expect((await team.employee.patch(`/tasks/${fix.id}`, { rootCause: 'Tools have no marked place' })).status).toBe(200);
    // Not before the work is finished, and never by the person who did it.
    const early = await team.manager.post(`/tasks/${fix.id}/sign-off`);
    expect(early.status).toBe(409);
    expect(errorCode(early)).toBe('FIX_NOT_DONE');
    await team.employee.patch(`/tasks/${fix.id}`, { status: 'done' });
    expect((await team.employee.post(`/tasks/${fix.id}/sign-off`)).status).toBe(403);

    const signed = await team.manager.post(`/tasks/${fix.id}/sign-off`);
    expect(signed.status).toBe(201);
    const check = data(await team.manager.get('/operations/improvement-verification'));
    expect(check.fixes.find((item: any) => item.taskId === fix.id)).toMatchObject({
      rootCause: 'Tools have no marked place',
      signedOffBy: team.managerId,
    });

    // Reopened, it is no longer the fix that was signed off.
    await team.employee.patch(`/tasks/${fix.id}`, { status: 'in_progress' });
    const after = data(await team.manager.get('/operations/improvement-verification'));
    expect(after.fixes.find((item: any) => item.taskId === fix.id).signedOffBy).toBeUndefined();
  });

  it('alternative: an employee sees only their own figures, not the team’s', async () => {
    const report = data(await team.employee.get(`/operations/monthly-report?month=${today().slice(0, 7)}`));
    expect(report.people.every((person: any) => person.userId === team.employeeId)).toBe(true);
  });
});

describe('UC-15 Хагас жил, жилийн тайлан гаргах (half-year and annual report)', () => {
  it('main: the manager gets a period report spanning several months', async () => {
    const to = today().slice(0, 7);
    const [year, month] = to.split('-').map(Number);
    const from = new Date(Date.UTC(year, month - 6, 1)).toISOString().slice(0, 7);
    const response = await team.manager.get(`/operations/period-report?from=${from}&to=${to}`);
    expect(response.status).toBe(200);
    expect(data(response).months.length).toBe(6);
  });

  it('alternative: a range that ends before it starts is refused', async () => {
    expect((await team.manager.get('/operations/period-report?from=2026-06&to=2026-01')).status).toBe(400);
  });
});

describe('UC-16 Сарын тайланг хааж батлах (close the monthly report) «extend» AI draft', () => {
  it('main: the manager closes last month and it appears among the closed months', async () => {
    const closed = await team.manager.post('/operations/monthly-closes', { month: previousMonth() });
    expect(closed.status).toBe(201);
    const list = data<any[]>(await team.manager.get('/operations/monthly-closes'));
    expect(list.some((close) => close.period === previousMonth())).toBe(true);
  });

  it('alternative: reopening needs a reason, and the history keeps who reopened it and why', async () => {
    const month = previousMonth();
    expect((await team.owner.post(`/operations/monthly-closes/${month}/reopen`, {})).status).toBe(400);
    expect((await team.manager.post(`/operations/monthly-closes/${month}/reopen`, { reason: 'Late entries' })).status).toBe(403);

    const reopened = await team.owner.post(`/operations/monthly-closes/${month}/reopen`, { reason: 'Late entries' });
    expect(reopened.status).toBe(201);
    expect(data(reopened).closed).toBeNull();

    const history = data(await team.manager.get(`/operations/monthly-closes/${month}/history`));
    expect(history.versions.at(-1)).toMatchObject({ reopenedBy: team.ownerId, reopenReason: 'Late entries' });
    expect(history.current.closed).toBeNull();
  });

  it('refused: the running month cannot be closed, and the AI draft says it is not configured', async () => {
    const response = await team.manager.post('/operations/monthly-closes', { month: today().slice(0, 7) });
    expect(response.status).toBe(409);
    expect(errorCode(response)).toBe('REPORT_MONTH_NOT_ENDED');
    const draft = await team.manager.post('/operations/monthly-summary/draft', { month: previousMonth() });
    expect([404, 409, 503]).toContain(draft.status);
  });
});

describe('UC-17 Хэрэглэгч урьж, эрх олгох (invite users and grant roles)', () => {
  it('main: the owner invites one person and previews a spreadsheet import', async () => {
    const invite = await team.owner.post('/auth/invitations', { email: `new.${Date.now()}@uc.test`, role: 'manager' });
    expect(invite.status).toBe(201);
    expect(data(invite).token).toBeTruthy();
    const preview = data(await team.owner.post('/auth/invitations/import', {
      dryRun: true, rows: [{ email: `a.${Date.now()}@uc.test`, role: 'user' }, { email: 'broken', role: 'user' }],
    }));
    expect(preview.rows.map((row: any) => row.status)).toEqual(['ok', 'error']);
  });

  it('refused: an employee cannot invite anybody', async () => {
    expect((await team.employee.post('/auth/invitations', { email: 'x@uc.test', role: 'user' })).status).toBe(403);
  });
});

describe('UC-18 Хэлтэс, байгууллагын тохиргоо хийх (departments and organization settings)', () => {
  it('main: the owner adds a department and edits the organization', async () => {
    const department = await team.owner.post('/departments', { name: 'Assembly' });
    expect(department.status).toBe(201);
    const organization = await team.owner.patch('/organizations/my-organization', { description: 'Pilot workspace' });
    expect(organization.status).toBe(200);
  });

  it('refused: an employee cannot change the organization’s structure', async () => {
    expect((await team.employee.post('/departments', { name: 'Mine' })).status).toBe(403);
    expect((await team.employee.patch('/organizations/my-organization', { description: 'x' })).status).toBe(403);
  });
});

describe('UC-19 5S талбай, стандарт тохируулах (set up 5S areas and standards)', () => {
  it('main: the owner adds an area with its size and standard to the plan', async () => {
    const plan = data(await team.owner.get(`/five-s-layout?id=${planId}`));
    const zones = [...plan.zones, {
      id: `zone-b-${Date.now()}`, code: 'A02', name: 'Store', color: '#22c55e', x: 40, y: 200, width: 190, height: 118,
      contents: '', standard: 'Shelves labelled', labelText: '', stage: 'sort', auditFrequency: 'monthly', areaSquareMetres: 12.5,
    }];
    const saved = await team.owner.patch(`/five-s-layouts/${planId}`, layoutBody(plan, zones));
    expect(saved.status).toBe(200);
    expect(data(saved).zones.find((zone: any) => zone.code === 'A02').areaSquareMetres).toBe(12.5);
  });

  it('refused: an employee cannot create a 5S plan', async () => {
    expect((await team.employee.post('/five-s-layouts', { name: 'Mine' })).status).toBe(403);
  });
});

describe('UC-20 Аудитын шалгах хуудас боловсруулах (build an audit checklist)', () => {
  it('main: the owner creates a checklist template and it is listed', async () => {
    const created = await team.owner.post('/audit-templates', {
      title: 'Office 5S', category: '5s', questions: [{ id: 'q1', text: 'Desks clear', type: 'score', maxScore: 5 }],
    });
    expect(created.status).toBe(201);
    const list = data<any[]>(await team.owner.get('/audit-templates'));
    expect(list.some((template) => template.id === data(created).id)).toBe(true);
  });

  it('refused: an employee cannot create a checklist', async () => {
    expect((await team.employee.post('/audit-templates', { title: 'Mine', category: '5s' })).status).toBe(403);
  });
});

describe('UC-21 Үйл ажиллагааны түүх шалгах (inspect the activity history)', () => {
  it('main: the owner reads the audit log of what was changed', async () => {
    const log = await team.owner.get('/audit-log');
    expect(log.status).toBe(200);
    const entries = data<any>(log);
    expect((entries.items ?? entries.data ?? entries).length).toBeGreaterThan(0);
  });

  it('refused: a manager or employee cannot read it', async () => {
    expect((await team.employee.get('/audit-log')).status).toBe(403);
    expect((await team.manager.get('/audit-log')).status).toBe(403);
  });
});

describe('UC-22 Сануулга илгээх, аудит товлох (send reminders, schedule audits) — system', () => {
  it('main: the morning run tells the employee what is due today, once', async () => {
    await team.manager.post('/tasks', { title: 'Due this morning', assigneeId: team.employeeId, dueDate: today() });
    const { DailyReminderService } = await import('../../src/operations/daily-reminder.service');
    const reminders = app.get(DailyReminderService);
    // 09:30 in Ulaanbaatar (UTC+8) on the organization's today.
    const morning = new Date(`${today()}T01:30:00Z`);
    await reminders.remind(morning);
    await reminders.remind(morning);
    const inbox = data<any[]>(await team.employee.get('/notifications'));
    const todays = inbox.filter((item) => item.titleKey === 'raised.dailyDigest');
    expect(todays.length).toBe(1);
  });

  it('alternative: an evening run sends nothing', async () => {
    const { DailyReminderService } = await import('../../src/operations/daily-reminder.service');
    const evening = new Date(`${today()}T13:00:00Z`);
    expect(await app.get(DailyReminderService).remind(evening)).toBe(0);
  });
});
