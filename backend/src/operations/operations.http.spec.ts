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
import { Project } from './entities/project.entity';
import { WorkTask } from './entities/task.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { WorkLog } from './entities/work-log.entity';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

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
  Attachment,
];

const repositoryMock = () => ({
  find: jest.fn(async () => []),
  findOne: jest.fn(async () => ({ id: 'p1', organizationId: 'org-1' })),
  create: jest.fn((value) => value),
  save: jest.fn(async (value) => ({ id: 'p1', ...value })),
  softRemove: jest.fn(async (value) => value),
  softDelete: jest.fn(async () => ({ affected: 1 })),
  count: jest.fn(async () => 0),
  createQueryBuilder: jest.fn(),
});

describe('operations API over HTTP', () => {
  let app: INestApplication;
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
      controllers: [OperationsController],
      providers: [
        OperationsService,
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
        ...entities.map((entity) => ({ provide: getRepositoryToken(entity), useValue: repositoryMock() })),
      ],
    }).compile();

    app = configureRequestHandling(moduleRef.createNestApplication(), moduleRef.get(MetricsService));
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
