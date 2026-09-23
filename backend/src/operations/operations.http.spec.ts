import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { configureRequestHandling } from '../app-config';
import { UserRole } from '../shared/constants';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { MetricsService } from '../shared/metrics/metrics.service';
import { AssessmentResponse } from './entities/assessment-response.entity';
import { AssessmentTemplate } from './entities/assessment-template.entity';
import { Attachment } from './entities/attachment.entity';
import { AuditRun } from './entities/audit-run.entity';
import { AuditTemplate } from './entities/audit-template.entity';
import { DailyGoal } from './entities/daily-goal.entity';
import { ExpenseItem } from './entities/expense.entity';
import { FiveSLayout } from './entities/five-s-layout.entity';
import { Department } from './entities/department.entity';
import { FiveSGuideline } from './entities/five-s-guideline.entity';
import { User } from '../users/entities/user.entity';
import { MAILER, LoggingMailer } from '../shared/mail/mailer';
import { Notification } from './entities/notification.entity';
import { Project } from './entities/project.entity';
import { WorkTask } from './entities/task.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { WorkLog } from './entities/work-log.entity';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * What the operations API lets each role do, over HTTP.
 *
 * `route-permissions.spec.ts` checks that every route names a permission.
 * This checks the request is actually refused — through the real guard pair,
 * the real exception filter, and the configuration `main.ts` uses.
 *
 * Two things here are only visible at this level. The first is that
 * `OperationsAuthGuard` and `PermissionsGuard` have to compose: the first
 * reads the role off the token, the second decides. The second is the
 * development switch `ALLOW_PUBLIC_OPERATIONS`, where there is no role to
 * check at all — the auth guard marks the request it let through and the
 * permission guard honours the mark. Getting that wrong either shuts
 * development out of its own API or, far worse, lets the mark be set by
 * something other than the auth guard.
 */

const entities = [
  Project,
  WorkTask,
  WorkLog,
  TimeEntry,
  AuditTemplate,
  AuditRun,
  AssessmentTemplate,
  AssessmentResponse,
  ExpenseItem,
  DailyGoal,
  FiveSLayout,
  Department,
  FiveSGuideline,
  User,
  Attachment,
  Notification,
];

const repositoryMock = () => ({
  find: jest.fn(async () => []),
  // Loosely typed on purpose: a route that needs a richer row — a plan with
  // a zone on it — replaces this in its own `beforeEach`.
  findOne: jest.fn(async (): Promise<Record<string, unknown>> => ({ id: 'p1', organizationId: 'org-1' })),
  create: jest.fn((value) => value),
  save: jest.fn(async (value) => ({ id: 'p1', ...value })),
  softRemove: jest.fn(async (value) => value),
  softDelete: jest.fn(async () => ({ affected: 1 })),
  count: jest.fn(async () => 0),
  // Marking a notification read is an update scoped by recipient, so the
  // mock has to answer one.
  update: jest.fn(async () => ({ affected: 1 })),
  createQueryBuilder: jest.fn(),
});

describe('operations API over HTTP', () => {
  let app: INestApplication;
  const repositories = new Map<unknown, ReturnType<typeof repositoryMock>>();
  let allowPublicOperations = false;

  /** Stands in for a signed token; the guard verifies, so this is its payload. */
  const tokenFor = (role: UserRole) => ({
    sub: 'u1',
    role,
    organizationId: 'org-1',
  });

  let verified: ReturnType<typeof tokenFor> | null = null;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OperationsController, NotificationsController],
      providers: [
        OperationsService,
        // Telling somebody is part of raising work now, so the service cannot
        // be built without it.
        NotificationsService,
        OperationsAuthGuard,
        PermissionsGuard,
        MetricsService,
        {
          provide: JwtService,
          useValue: {
            verify: () => {
              if (!verified) throw new Error('bad token');
              return verified;
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'ALLOW_PUBLIC_OPERATIONS' ? allowPublicOperations : undefined),
          },
        },
        // What a deployment with no mail server runs: notifications reach the
        // inbox, and nothing is sent anywhere.
        { provide: MAILER, useValue: new LoggingMailer() },
        // Kept by entity so a test can say what one of them answers; the
        // red-tag routes need a plan with a zone on it rather than the
        // generic row every other route is happy with.
        ...entities.map((entity) => {
          const mock = repositoryMock();
          repositories.set(entity, mock);

          return { provide: getRepositoryToken(entity), useValue: mock };
        }),
      ],
    }).compile();

    // Silenced: every refusal in this file is an expected one, and the
    // exception filter logs each at ERROR. Left on, a passing verification run
    // scrolls past dozens of stack traces that mean the tests worked.
    app = configureRequestHandling(moduleRef.createNestApplication({ logger: false }), moduleRef.get(MetricsService));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    allowPublicOperations = false;
    verified = null;
  });

  const as = (role: UserRole) => {
    verified = tokenFor(role);
    return 'Bearer pretend-token';
  };

  describe('deleting a project', () => {
    it.each([
      [UserRole.ORGANIZATION_ADMIN, 200],
      [UserRole.ADMIN, 200],
      [UserRole.MANAGER, 403],
      [UserRole.USER, 403],
      [UserRole.VIEWER, 403],
    ])('answers %s with %i', async (role, status) => {
      await request(app.getHttpServer())
        .delete('/api/projects/p1')
        .set('Authorization', as(role))
        .expect(status);
    });
  });

  describe('marking an area cleaned from the floor', () => {
    beforeEach(() => {
      repositories.get(FiveSLayout)?.findOne.mockResolvedValue({
        id: 'l1',
        organizationId: 'org-1',
        zones: [{ id: 'z1', code: 'A01' }],
      });
    });

    it.each([
      [UserRole.MANAGER, 201],
      [UserRole.USER, 201],
      // Read-only stays read-only, even for a date.
      [UserRole.VIEWER, 403],
    ])('answers %s with %i', async (role, status) => {
      await request(app.getHttpServer())
        .post('/api/five-s-layouts/l1/zones/z1/cleaned')
        .set('Authorization', as(role))
        .expect(status);
    });

    it('takes no body, so it cannot be used to write anything else', async () => {
      await request(app.getHttpServer())
        .post('/api/five-s-layouts/l1/zones/z1/cleaned')
        .set('Authorization', as(UserRole.USER))
        .send({ lastCleanedAt: '2020-01-01', ownerName: 'Somebody else' })
        .expect(201);

      const saved = repositories.get(FiveSLayout)?.save.mock.calls[0][0] as Record<string, any>;
      expect(saved.zones[0].lastCleanedAt).not.toBe('2020-01-01');
      expect(saved.zones[0].ownerName).toBeUndefined();
    });
  });

  describe('departments, which everybody reads and administrators change', () => {
    beforeEach(() => {
      repositories.get(Department)?.find.mockResolvedValue([]);
      repositories.get(Department)?.findOne.mockResolvedValue({
        id: 'd1',
        name: 'Warehouse',
        organizationId: 'org-1',
      });
    });

    it.each([
      [UserRole.ORGANIZATION_ADMIN, 200],
      [UserRole.ADMIN, 200],
      [UserRole.MANAGER, 200],
      [UserRole.USER, 200],
      // Including a viewer: a zone page that cannot name the department
      // answerable for an area is a worse answer than one that can.
      [UserRole.VIEWER, 200],
    ])('lets %s read the list, answering %i', async (role, status) => {
      await request(app.getHttpServer())
        .get('/api/departments')
        .set('Authorization', as(role))
        .expect(status);
    });

    it.each([
      [UserRole.ORGANIZATION_ADMIN, 201],
      [UserRole.ADMIN, 201],
      // A line manager runs their shift; they do not redraw the organization.
      [UserRole.MANAGER, 403],
      [UserRole.USER, 403],
      [UserRole.VIEWER, 403],
    ])('answers %s creating one with %i', async (role, status) => {
      await request(app.getHttpServer())
        .post('/api/departments')
        .set('Authorization', as(role))
        .send({ name: 'Maintenance' })
        .expect(status);
    });

    it('refuses a department with no name rather than storing a blank card', async () => {
      await request(app.getHttpServer())
        .post('/api/departments')
        .set('Authorization', as(UserRole.ADMIN))
        .send({ focusArea: 'Keeps the presses running' })
        .expect(400);
    });

    it('refuses a field the route does not declare', async () => {
      // `memberCount` in particular: how many people are in a department is
      // counted from the people, never sent by a client.
      await request(app.getHttpServer())
        .post('/api/departments')
        .set('Authorization', as(UserRole.ADMIN))
        .send({ name: 'Maintenance', memberCount: 99 })
        .expect(400);
    });
  });

  describe('the layers a plan is audited in', () => {
    const plan = {
      name: 'Ground floor',
      site: 'Plant',
      scale: '1 square = 1 metre',
      zones: [],
      objects: [],
    };

    beforeEach(() => {
      repositories.get(FiveSLayout)?.findOne.mockResolvedValue({
        id: 'l1',
        organizationId: 'org-1',
        zones: [],
        objects: [],
      });
    });

    it('stores what an organization says its layers are', async () => {
      // They were read by the scheduler and stored nowhere, so every plant ran
      // on the built-in defaults whatever it had typed.
      await request(app.getHttpServer())
        .patch('/api/five-s-layouts/l1')
        .set('Authorization', as(UserRole.MANAGER))
        .send({
          ...plan,
          auditTiers: [
            { tier: 1, name: 'Ээлжийн ахлагч', role: UserRole.USER, frequency: 'daily' },
            { tier: 2, name: 'Хэлтсийн дарга', role: UserRole.MANAGER, frequency: 'monthly' },
          ],
        })
        .expect(200);

      // The last call, not the first: these mocks are shared across the file
      // and an earlier test's save would otherwise be the one inspected.
      const calls = repositories.get(FiveSLayout)?.save.mock.calls ?? [];
      const saved = calls[calls.length - 1][0] as Record<string, any>;
      expect(saved.auditTiers).toHaveLength(2);
      expect(saved.auditTiers[1]).toMatchObject({ name: 'Хэлтсийн дарга', frequency: 'monthly' });
    });

    it('refuses a layer asking for a role nobody has', async () => {
      // "supervisor" is not one of this platform's roles, so a layer asking
      // for it would silently match nobody and its checks would land on the
      // area's owner for ever.
      await request(app.getHttpServer())
        .patch('/api/five-s-layouts/l1')
        .set('Authorization', as(UserRole.MANAGER))
        .send({
          ...plan,
          auditTiers: [{ tier: 1, name: 'Shift lead', role: 'supervisor', frequency: 'daily' }],
        })
        .expect(400);
    });

    it('refuses a rhythm nobody audits on', async () => {
      await request(app.getHttpServer())
        .patch('/api/five-s-layouts/l1')
        .set('Authorization', as(UserRole.MANAGER))
        .send({
          ...plan,
          auditTiers: [{ tier: 1, name: 'Operator', frequency: 'hourly' }],
        })
        .expect(400);
    });

    it('still accepts a plan from a client that has never heard of layers', async () => {
      await request(app.getHttpServer())
        .patch('/api/five-s-layouts/l1')
        .set('Authorization', as(UserRole.MANAGER))
        .send(plan)
        .expect(200);
    });
  });

  describe('red-tagging from the floor', () => {
    beforeEach(() => {
      repositories.get(FiveSLayout)?.findOne.mockResolvedValue({
        id: 'l1',
        organizationId: 'org-1',
        zones: [{ id: 'z1', code: 'A01', redTags: [], redTagCount: 0 }],
      });
    });

    it.each([
      [UserRole.ORGANIZATION_ADMIN, 201],
      [UserRole.ADMIN, 201],
      [UserRole.MANAGER, 201],
      [UserRole.USER, 201],
      // A viewer is read-only by definition; everybody who can record
      // anything can red-tag, because the person who finds the clutter is
      // usually the person working next to it.
      [UserRole.VIEWER, 403],
    ])('answers %s with %i', async (role, status) => {
      await request(app.getHttpServer())
        .post('/api/five-s-layouts/l1/zones/z1/red-tags')
        .set('Authorization', as(role))
        .send({ title: 'Unowned pallet' })
        .expect(status);
    });

    it('refuses a tag with no title rather than storing an empty one', async () => {
      await request(app.getHttpServer())
        .post('/api/five-s-layouts/l1/zones/z1/red-tags')
        .set('Authorization', as(UserRole.USER))
        .send({ disposition: 'Find the owner' })
        .expect(400);
    });

    it('refuses a field the route does not declare', async () => {
      // Notably `status` and `closedAt`: a tag that arrives already closed is
      // a tag that was never raised.
      await request(app.getHttpServer())
        .post('/api/five-s-layouts/l1/zones/z1/red-tags')
        .set('Authorization', as(UserRole.USER))
        .send({ title: 'Pallet', status: 'disposed' })
        .expect(400);
    });
  });

  describe('somebody’s own inbox', () => {
    it('is readable by every role that can sign in, including a viewer', async () => {
      // A viewer is told when an audit they have to walk is due; an inbox
      // nobody can read is a notification nobody receives.
      await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', as(UserRole.VIEWER))
        .expect(200);
    });

    it('is refused without a token, like everything else', async () => {
      await request(app.getHttpServer()).get('/api/notifications').expect(401);
    });

    it('can be marked read by the person reading it', async () => {
      await request(app.getHttpServer())
        .patch('/api/notifications/n1/read')
        .set('Authorization', as(UserRole.VIEWER))
        .expect(200);
    });

    it('takes no user id, so one inbox cannot be addressed as another', async () => {
      // The routes are scoped to the caller by construction rather than by a
      // check somebody has to remember to write.
      await request(app.getHttpServer())
        .get('/api/notifications/u2')
        .set('Authorization', as(UserRole.ADMIN))
        .expect(404);
    });
  });

  describe('a viewer walking the plant', () => {
    it('may read the areas', async () => {
      await request(app.getHttpServer())
        .get('/api/five-s-layout')
        .set('Authorization', as(UserRole.VIEWER))
        .expect(200);
    });

    it('may not move them', async () => {
      await request(app.getHttpServer())
        .patch('/api/five-s-layout')
        .set('Authorization', as(UserRole.VIEWER))
        .send({ zones: [] })
        .expect(403);
    });

    it('may not record an audit', async () => {
      await request(app.getHttpServer())
        .post('/api/audit-runs')
        .set('Authorization', as(UserRole.VIEWER))
        .send({ templateId: '11111111-1111-4111-8111-111111111111', score: 90 })
        .expect(403);
    });
  });

  describe('the audit templates the whole plant is scored against', () => {
    it('are not rewritable by an ordinary member', async () => {
      await request(app.getHttpServer())
        .patch('/api/assessment-templates/t1')
        .set('Authorization', as(UserRole.USER))
        .send({ title: 'Rewritten' })
        .expect(403);
    });

    it('are rewritable by an administrator', async () => {
      await request(app.getHttpServer())
        .patch('/api/assessment-templates/t1')
        .set('Authorization', as(UserRole.ADMIN))
        .send({ title: 'Rewritten' })
        .expect(200);
    });
  });

  describe('a member doing their own work', () => {
    it('may record a work log', async () => {
      await request(app.getHttpServer())
        .post('/api/work-logs')
        .set('Authorization', as(UserRole.USER))
        .send({ logDate: '2026-09-14', hours: 8, summary: 'Line 2 changeover' })
        .expect(201);
    });

    it('may raise an audit run', async () => {
      await request(app.getHttpServer())
        .post('/api/audit-runs')
        .set('Authorization', as(UserRole.USER))
        .send({ templateId: '11111111-1111-4111-8111-111111111111', score: 90 })
        .expect(201);
    });

    it('may not create a project', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', as(UserRole.USER))
        .send({ name: 'New line' })
        .expect(403);
    });
  });

  describe('with no token at all', () => {
    it('refuses every route', async () => {
      await request(app.getHttpServer()).get('/api/projects').expect(401);
      await request(app.getHttpServer()).delete('/api/projects/p1').expect(401);
    });

    it('lets development through when the switch is on', async () => {
      // The auth guard marks the request; the permission guard reads the mark
      // rather than the flag, so the switch is interpreted in one place.
      allowPublicOperations = true;

      await request(app.getHttpServer()).get('/api/projects').expect(200);
      await request(app.getHttpServer()).delete('/api/projects/p1').expect(200);
    });

    it('does not let a client set that mark itself', async () => {
      // The mark is a property the guard writes on the request object. A body
      // or query carrying the same name must not become it.
      await request(app.getHttpServer())
        .post('/api/projects?anonymousOperations=true')
        .send({ name: 'New line', anonymousOperations: true })
        .expect(401);
    });
  });

  it('refuses a role nobody recognises', async () => {
    verified = { sub: 'u1', role: 'root' as UserRole, organizationId: 'org-1' };

    await request(app.getHttpServer())
      .get('/api/projects')
      .set('Authorization', 'Bearer pretend-token')
      .expect(403);
  });
});
