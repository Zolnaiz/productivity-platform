import { createHmac } from 'crypto';
import { config } from 'dotenv';

config();

type SmokeResult = {
  name: string;
  ok: boolean;
  status?: number;
  detail?: string;
};

const apiBaseUrl = process.env.SMOKE_API_URL || 'http://127.0.0.1:3000/api';
const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
const organizationId = process.env.SMOKE_ORGANIZATION_ID || '11111111-1111-4111-8111-000000000001';
const smokeUserEmail = process.env.SMOKE_USER_EMAIL || 'owner@example.com';
const smokeUserPassword = process.env.SMOKE_USER_PASSWORD || 'Password123';

const base64Url = (value: Buffer | string) => Buffer.from(value).toString('base64url');

const signToken = () => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      sub: process.env.SMOKE_USER_ID || '22222222-2222-4222-8222-000000000001',
      email: smokeUserEmail,
      role: process.env.SMOKE_USER_ROLE || 'organization_admin',
      organizationId,
      permissions: ['operations:read', 'operations:write'],
      iat: now,
      exp: now + 60 * 60,
    }),
  );
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
};

const readJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const request = async (path: string, token?: string, init?: RequestInit) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const body = await readJson(response);
  return { response, body };
};

const unwrapData = (body: any) => (body && typeof body === 'object' && 'data' in body ? body.data : body);

const summarizeBody = (body: unknown) => {
  if (!body) return 'empty response';
  if (typeof body === 'string') return body.slice(0, 160);
  return JSON.stringify(body).slice(0, 240);
};

async function main() {
  const smokeToken = signToken();
  let loginToken: string | undefined;
  const results: SmokeResult[] = [];

  try {
    const { response, body } = await request('/health');
    results.push({
      name: 'health endpoint',
      ok: response.status === 200,
      status: response.status,
      detail: summarizeBody(body),
    });
  } catch (error) {
    results.push({
      name: 'health endpoint',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const { response, body } = await request('/projects');
    results.push({
      name: 'projects requires auth',
      ok: response.status === 401,
      status: response.status,
      detail: summarizeBody(body),
    });
  } catch (error) {
    results.push({
      name: 'projects requires auth',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const { response, body } = await request('/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify({
        email: smokeUserEmail,
        password: smokeUserPassword,
      }),
    });
    const data = unwrapData(body);
    loginToken = data?.access_token;
    results.push({
      name: 'login with seeded owner',
      ok: response.status === 200 && typeof loginToken === 'string',
      status: response.status,
      detail: summarizeBody(body),
    });
  } catch (error) {
    results.push({
      name: 'login with seeded owner',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  const token = loginToken || smokeToken;
  const tokenLabel = loginToken ? 'login token' : 'smoke token';

  try {
    const { response, body } = await request('/projects', smokeToken);
    results.push({
      name: 'projects with smoke token',
      ok: response.status === 200,
      status: response.status,
      detail: summarizeBody(body),
    });
  } catch (error) {
    results.push({
      name: 'projects with smoke token',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const { response, body } = await request('/operations/summary', token);
    results.push({
      name: `operations summary with ${tokenLabel}`,
      ok: response.status === 200,
      status: response.status,
      detail: summarizeBody(body),
    });
  } catch (error) {
    results.push({
      name: 'operations summary with smoke token',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  let createdProjectId: string | undefined;

  try {
    const { response, body } = await request('/projects', token, {
      method: 'POST',
      body: JSON.stringify({
        name: `Smoke project ${Date.now()}`,
        description: 'Created by runtime smoke test',
        priority: 'medium',
        status: 'planned',
        progress: 0,
      }),
    });
    const data = unwrapData(body);
    createdProjectId = data?.id;
    results.push({
      name: `create project with ${tokenLabel}`,
      ok: response.status === 201 && typeof createdProjectId === 'string',
      status: response.status,
      detail: summarizeBody(body),
    });
  } catch (error) {
    results.push({
      name: 'create project with smoke token',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  if (createdProjectId) {
    try {
      const { response, body } = await request(`/projects/${createdProjectId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          progress: 35,
          status: 'active',
        }),
      });
      const data = unwrapData(body);
      results.push({
        name: `update project with ${tokenLabel}`,
        ok: response.status === 200 && data?.progress === 35 && data?.status === 'active',
        status: response.status,
        detail: summarizeBody(body),
      });
    } catch (error) {
      results.push({
        name: 'update project with smoke token',
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const { response, body } = await request(`/projects/${createdProjectId}`, token, {
        method: 'DELETE',
      });
      const data = unwrapData(body);
      results.push({
        name: `delete project with ${tokenLabel}`,
        ok: response.status === 200 && data?.deleted === true,
        status: response.status,
        detail: summarizeBody(body),
      });
    } catch (error) {
      results.push({
        name: 'delete project with smoke token',
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /*
    Every page's first request, read once as the signed-in owner.

    The notification inbox and the departments page answered every request
    with a 500 on a real database for weeks while every unit test passed: the
    specs mock the repositories, so a column the database does not have is
    invisible to them. Reading each route against the real thing is the only
    check that sees it. Reads only, so this is safe against a live system;
    a refusal (401/403/404) is the route working, a 5xx is not.
  */
  const readRoutes = [
    '/auth/me',
    '/users',
    '/users/profile/me',
    '/users/profile/permissions',
    '/organizations/my-organization',
    '/tasks',
    '/work-logs',
    '/time-entries',
    '/daily-goals',
    '/five-s-layouts',
    '/five-s-layout',
    '/audit-templates',
    '/audit-runs',
    '/departments',
    '/five-s-guidelines',
    '/assessment-templates',
    '/assessment-responses',
    '/expenses',
    '/notifications',
    '/notifications/unread-count',
    '/ideas',
    '/operations/monthly-report',
    '/operations/monthly-closes',
    `/operations/period-report?from=${new Date().getUTCFullYear()}-01&to=${new Date().getUTCFullYear()}-06`,
    '/auth/invitations',
    // Asked of the running API because that is where the store is.
    '/attachments/check',
  ];

  for (const path of readRoutes) {
    try {
      const { response, body } = await request(path, token);
      results.push({
        name: `read ${path} with ${tokenLabel}`,
        ok: response.status < 500,
        status: response.status,
        detail: response.status < 500 ? undefined : summarizeBody(body),
      });
    } catch (error) {
      results.push({
        name: `read ${path}`,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /*
    The write paths, against the real database. Only when SMOKE_WRITES=true:
    they leave records behind, which is right on CI's throwaway database and
    wrong on anybody's live one. The reads above found the broken inbox; a
    column missing from a table that is only ever written would hide from
    them, so each thing people save is saved once here.
  */
  if (process.env.SMOKE_WRITES === 'true' && loginToken) {
    const write = async (name: string, path: string, method: string, body: unknown, expect: (status: number, data: any) => boolean) => {
      try {
        const { response, body: raw } = await request(path, token, {
          method,
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const data = unwrapData(raw);
        const ok = expect(response.status, data);
        results.push({ name, ok, status: response.status, detail: ok ? undefined : summarizeBody(raw) });
        return data;
      } catch (error) {
        results.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
        return undefined;
      }
    };

    const me = unwrapData((await request('/auth/me', token)).body);
    const ownerId: string | undefined = me?.id ?? me?.user?.id;
    const today = new Date().toISOString().slice(0, 10);

    const task = await write('write: create a task for somebody', '/tasks', 'POST',
      { title: `Smoke task ${Date.now()}`, assigneeId: ownerId, dueDate: today, estimatedHours: 1 },
      (status, data) => status === 201 && typeof data?.id === 'string');
    if (task?.id) {
      await write('write: finishing a task dates it', `/tasks/${task.id}`, 'PATCH', { status: 'done' },
        (status, data) => status === 200 && typeof data?.completedAt === 'string');
      await write('write: work cannot go to somebody outside the organization', `/tasks/${task.id}`, 'PATCH',
        { assigneeId: '00000000-0000-4000-8000-000000000000' }, (status) => status === 400);
    }

    await write('write: a day written up with its time', '/work-logs/daily', 'POST',
      { summary: 'Smoke write-up', hours: 1, logDate: today },
      (status, data) => status === 201 && data?.timeEntry?.workLogId === data?.workLog?.id);
    await write('write: a clock entry', '/time-entries', 'POST', { hours: 0.5, workDate: today, note: 'Smoke' },
      (status) => status === 201);
    await write('write: a daily goal', '/daily-goals', 'POST', { title: 'Smoke goal', date: today },
      (status) => status === 201);
    await write('write: an expense', '/expenses', 'POST', { title: 'Smoke expense', amount: 1000, expenseDate: today },
      (status) => status === 201);

    // An idea put in and taken up raises the work it calls for.
    const idea = await write('write: an idea', '/ideas', 'POST', { title: `Smoke idea ${Date.now()}`, area: 'Smoke area' },
      (status, data) => status === 201 && data?.status === 'submitted');
    if (idea?.id) {
      await write('write: an idea taken up becomes a task', `/ideas/${idea.id}/review`, 'PATCH',
        { status: 'approved', note: 'Smoke' }, (status, data) => status === 200 && typeof data?.taskId === 'string');
    }

    const department = await write('write: a department', '/departments', 'POST', { name: `Smoke ${Date.now()}` },
      (status, data) => status === 201 && typeof data?.id === 'string');
    if (department?.id) {
      await write('write: retire the department', `/departments/${department.id}`, 'DELETE', undefined,
        (status) => status === 200);
    }

    // Walked against a real area, so the server writes its first score and
    // layer clock onto the zone - which the plan save below must take back.
    const walked = unwrapData((await request('/five-s-layouts', token)).body);
    const zoneId = Array.isArray(walked) ? walked[0]?.zones?.[0]?.id : undefined;
    const templates = unwrapData((await request('/audit-templates', token)).body);
    if (Array.isArray(templates) && templates[0]?.id) {
      await write('write: an audit run', '/audit-runs', 'POST',
        { templateId: templates[0].id, location: 'Smoke area', score: 90, answers: [], ...(zoneId ? { zoneId, tier: 1 } : {}) },
        (status) => status === 201);
    }

    const layouts = unwrapData((await request('/five-s-layouts', token)).body);
    if (Array.isArray(layouts) && layouts[0]?.id) {
      await write('write: keep a version of the floor plan', `/five-s-layouts/${layouts[0].id}/versions`, 'POST',
        { label: 'Smoke' }, (status) => status === 200 || status === 201);

      // The plan sent back exactly as it was read, as the editor sends it.
      // Whatever the server writes onto a zone - an audit's layer clocks, a
      // first score - has to be accepted back; when it was not, no audited
      // plan could be saved and nothing said so.
      const plan = layouts[0];
      await write('write: save the floor plan as it was read', `/five-s-layouts/${plan.id}`, 'PATCH', {
        name: plan.name,
        site: plan.site,
        floor: plan.floor ?? '',
        scale: plan.scale,
        backgroundImage: plan.backgroundImage ?? '',
        backgroundOpacity: plan.backgroundOpacity,
        showGrid: plan.showGrid,
        zones: plan.zones,
        objects: plan.objects,
        corners: plan.corners ?? [],
        walls: plan.walls ?? [],
        openings: plan.openings ?? [],
        roomLabels: plan.roomLabels ?? [],
        baseUpdatedAt: plan.updatedAt,
      }, (status) => status === 200);
    }

    await write('write: mark the inbox read', '/notifications/read-all', 'PATCH', {}, (status) => status === 200);

    const last = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
    await write('write: close last month', '/operations/monthly-closes', 'POST', { month: last },
      (status, data) => (status === 201 || status === 200) && Boolean(data?.closed));
    await write('write: reopen it', `/operations/monthly-closes/${last}`, 'DELETE', undefined,
      (status, data) => status === 200 && data?.closed === null);
  }

  // A user record must never carry what would let somebody else into the account.
  try {
    const { body } = await request('/users', token);
    const listed = unwrapData(body);
    const people = Array.isArray(listed) ? listed : (listed?.data ?? []);
    const leaked = people.flatMap((person: Record<string, unknown>) =>
      ['password', 'resetPasswordToken', 'verificationToken'].filter((field) => field in person),
    );
    results.push({
      name: 'user list carries no password or reset token',
      ok: leaked.length === 0,
      detail: leaked.length ? `exposed: ${[...new Set(leaked)].join(', ')}` : undefined,
    });
  } catch (error) {
    results.push({
      name: 'user list carries no password or reset token',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  for (const result of results) {
    const marker = result.ok ? 'PASS' : 'FAIL';
    const status = result.status ? ` status=${result.status}` : '';
    console.log(`${marker} ${result.name}${status}`);
    if (result.detail) {
      console.log(`  ${result.detail}`);
    }
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
