import { CanActivate, ExecutionContext, INestApplication, Injectable } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { configureRequestHandling } from '../app-config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../shared/constants';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { MetricsService } from '../shared/metrics/metrics.service';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationsController } from '../organizations/organizations.controller';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { AuditLogService } from './audit-log.service';
import { AuditLogEntry } from './entities/audit-log-entry.entity';

/**
 * The audit trail, written and read through the wired application.
 *
 * The interceptor spec proves the interceptor builds the right entry. This
 * proves it is actually attached: a real request through a real controller
 * leaves a row, and reading the trail is guarded like anything else.
 *
 * `OrganizationsController` stands in as the thing being changed. Nothing in
 * it knows the audit log exists — which is the point. A route added tomorrow
 * is covered without anybody remembering to cover it.
 */

let currentUser: { id: string; role: UserRole; organizationId?: string; firstName?: string } | null = null;

@Injectable()
class StubAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (!currentUser) return false;

    context.switchToHttp().getRequest().user = currentUser;
    return true;
  }
}

describe('audit log over HTTP', () => {
  let app: INestApplication;
  let saved: AuditLogEntry[];
  let entries: { create: jest.Mock; save: jest.Mock; find: jest.Mock };

  const signedInAs = (role: UserRole) => {
    currentUser = { id: 'u1', role, organizationId: 'org-1', firstName: 'Bat' };
  };

  beforeAll(async () => {
    saved = [];
    entries = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => {
        saved.push(value);
        return { id: `entry-${saved.length}`, createdAt: new Date(), ...value };
      }),
      find: jest.fn(async () => saved),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuditLogController, OrganizationsController],
      providers: [
        AuditLogService,
        OrganizationsService,
        PermissionsGuard,
        MetricsService,
        { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
        { provide: getRepositoryToken(AuditLogEntry), useValue: entries },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(async () => ({ id: 'org-1', name: 'MPC' })),
            create: jest.fn((value) => value),
            save: jest.fn(async (value) => value),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(StubAuthGuard)
      .compile();

    // Silenced: the refusals below are expected and each logs at ERROR.
    app = configureRequestHandling(
      moduleRef.createNestApplication({ logger: false }),
      moduleRef.get(MetricsService),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    saved.length = 0;
    entries.save.mockClear();
    signedInAs(UserRole.ORGANIZATION_ADMIN);
  });

  describe('writing the trail', () => {
    it('records a change nobody asked it to record', async () => {
      await request(app.getHttpServer())
        .patch('/api/organizations/my-organization')
        .send({ address: 'Ulaanbaatar' })
        .expect(200);

      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({
        organizationId: 'org-1',
        actorId: 'u1',
        actorName: 'Bat',
        actorRole: UserRole.ORGANIZATION_ADMIN,
        module: 'organizations',
        action: 'updated',
        method: 'PATCH',
        statusCode: 200,
      });
    });

    it('records nothing for a read', async () => {
      await request(app.getHttpServer()).get('/api/organizations/my-organization').expect(200);

      expect(saved).toHaveLength(0);
    });

    it('records nothing for a change that was refused', async () => {
      // A refused request changed nothing, so there is nothing to record.
      signedInAs(UserRole.VIEWER);

      await request(app.getHttpServer())
        .patch('/api/organizations/my-organization')
        .send({ address: 'Ulaanbaatar' })
        .expect(403);

      expect(saved).toHaveLength(0);
    });

    it('records what was changed, end to end', async () => {
      await request(app.getHttpServer())
        .patch('/api/organizations/my-organization')
        .send({ address: 'Ulaanbaatar' })
        .expect(200);

      // Through the real pipe and guard stack: the entry says which field was
      // changed and to what, which is the first thing a reader asks.
      expect(saved[0].changes).toEqual({ fields: ['address'], values: { address: 'Ulaanbaatar' } });
    });

    it('cannot be sent a secret to record in the first place', async () => {
      // The validation pipe refuses a field the route does not declare, so a
      // credential never reaches the interceptor on a route like this one.
      // Redaction is the second line, tested where a body does reach it.
      await request(app.getHttpServer())
        .patch('/api/organizations/my-organization')
        .send({ address: 'Ulaanbaatar', password: 'Secret123' })
        .expect(400);

      expect(saved).toHaveLength(0);
    });
  });

  describe('reading the trail', () => {
    it.each([
      [UserRole.ORGANIZATION_ADMIN, 200],
      [UserRole.ADMIN, 403],
      [UserRole.MANAGER, 403],
      [UserRole.USER, 403],
      [UserRole.VIEWER, 403],
    ])('answers %s with %i', async (role, status) => {
      signedInAs(role);

      await request(app.getHttpServer()).get('/api/audit-log').expect(status);
    });

    it('returns only this organization, newest first', async () => {
      await request(app.getHttpServer()).get('/api/audit-log').expect(200);

      expect(entries.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-1' },
          order: { createdAt: 'DESC' },
        }),
      );
    });

    it('refuses a limit that would return the whole table', async () => {
      await request(app.getHttpServer()).get('/api/audit-log?limit=100000').expect(400);
    });

    it('caps the page even when the service is called directly', async () => {
      const service = app.get(AuditLogService);

      await service.findForOrganization('org-1', 100000);

      expect(entries.find).toHaveBeenLastCalledWith(expect.objectContaining({ take: 500 }));
    });
  });

  describe('what is deliberately not here', () => {
    it.each([
      ['post', '/api/audit-log'],
      ['patch', '/api/audit-log/entry-1'],
      ['delete', '/api/audit-log/entry-1'],
    ])('has no %s %s', async (method, path) => {
      // An entry that can be written, edited or removed by a client is not
      // evidence of anything.
      await request(app.getHttpServer())[method as 'get'](path).expect(404);
    });
  });
});
