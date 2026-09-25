import { CanActivate, ExecutionContext, INestApplication, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { configureRequestHandling } from '../app-config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../shared/constants';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { MetricsService } from '../shared/metrics/metrics.service';
import { Organization } from './entities/organization.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

/**
 * The organization API, which is deliberately two routes.
 *
 * The module it replaced was fully written, role-decorated and unregistered,
 * and contained a way into an organization that bypassed invitations
 * altogether. The tests that matter most here are therefore about what is
 * *absent*: no listing, no `:id`, no second way to add a member.
 */

let currentUser: { id: string; role: UserRole; organizationId?: string } | null = null;

@Injectable()
class StubAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (!currentUser) return false;

    context.switchToHttp().getRequest().user = currentUser;
    return true;
  }
}

describe('organizations API over HTTP', () => {
  let app: INestApplication;
  let repository: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  const signedInAs = (role: UserRole, organizationId = 'org-1') => {
    currentUser = { id: 'u1', role, organizationId };
  };

  /** A signed-in account that belongs to no organization yet. */
  const signedInWithNoOrganization = (role: UserRole) => {
    currentUser = { id: 'u1', role };
  };

  beforeAll(async () => {
    repository = { findOne: jest.fn(), save: jest.fn(), create: jest.fn((value) => value) };

    const moduleRef = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        OrganizationsService,
        PermissionsGuard,
        MetricsService,
        { provide: getRepositoryToken(Organization), useValue: repository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(StubAuthGuard)
      .compile();

    // Silenced: the refusals below are the point, and each logs at ERROR.
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
    jest.clearAllMocks();
    repository.save.mockImplementation(async (value) => value);
    repository.findOne.mockResolvedValue({ id: 'org-1', name: 'MPC', isActive: true });
    signedInAs(UserRole.ORGANIZATION_ADMIN);
  });

  describe('reading your own organization', () => {
    it('answers every signed-in member, whatever their role', async () => {
      signedInAs(UserRole.VIEWER);

      const response = await request(app.getHttpServer())
        .get('/api/organizations/my-organization')
        .expect(200);

      expect(response.body.data.name).toBe('MPC');
    });

    it('reads it by the id on the token, never one from the request', async () => {
      signedInAs(UserRole.VIEWER, 'org-7');

      await request(app.getHttpServer()).get('/api/organizations/my-organization').expect(200);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'org-7' } });
    });

    it('does not return the members along with it', async () => {
      // The previous version loaded `relations: ['users']`, so a request for
      // the workspace name answered with every account in the organization.
      await request(app.getHttpServer()).get('/api/organizations/my-organization').expect(200);

      expect(repository.findOne).toHaveBeenCalledWith(expect.not.objectContaining({ relations: expect.anything() }));
    });

    it('says so when an account belongs to no organization', async () => {
      signedInWithNoOrganization(UserRole.VIEWER);

      const response = await request(app.getHttpServer())
        .get('/api/organizations/my-organization')
        .expect(401);

      expect(response.body.errorCode).toBe('AUTH_ORGANIZATION_REQUIRED');
    });
  });

  describe('editing your own organization', () => {
    it.each([
      [UserRole.ORGANIZATION_ADMIN, 200],
      [UserRole.ADMIN, 403],
      [UserRole.MANAGER, 403],
      [UserRole.USER, 403],
      [UserRole.VIEWER, 403],
    ])('answers %s with %i', async (role, status) => {
      signedInAs(role);

      await request(app.getHttpServer())
        .patch('/api/organizations/my-organization')
        .send({ address: 'Ulaanbaatar' })
        .expect(status);
    });

    it.each(['isActive', 'features', 'id', 'organizationId'])(
      'refuses a request carrying %s',
      async (field) => {
        const body: Record<string, unknown> = { address: 'Ulaanbaatar' };
        body[field] = field === 'isActive' ? false : 'anything';

        await request(app.getHttpServer())
          .patch('/api/organizations/my-organization')
          .send(body)
          .expect(400);

        expect(repository.save).not.toHaveBeenCalled();
      },
    );

    it('keeps the settings an organization owns', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/organizations/my-organization')
        .send({ settings: { timezone: 'Asia/Ulaanbaatar', language: 'mn' } })
        .expect(200);

      expect(response.body.data.settings).toMatchObject({ timezone: 'Asia/Ulaanbaatar' });
    });

    it('refuses a name another organization already has', async () => {
      repository.findOne
        .mockResolvedValueOnce({ id: 'org-1', name: 'MPC' })
        .mockResolvedValueOnce({ id: 'org-2', name: 'Taken' });

      const response = await request(app.getHttpServer())
        .patch('/api/organizations/my-organization')
        .send({ name: 'Taken' })
        .expect(409);

      expect(response.body.errorCode).toBe('AUTH_ORGANIZATION_TAKEN');
    });
  });

  describe('what is deliberately not here', () => {
    it.each([
      ['get', '/api/organizations'],
      ['get', '/api/organizations/org-2'],
      ['post', '/api/organizations'],
      ['patch', '/api/organizations/org-2'],
      ['delete', '/api/organizations/org-1'],
      ['post', '/api/organizations/org-1/invite-user'],
      ['post', '/api/organizations/org-1/remove-user/u2'],
      ['get', '/api/organizations/org-1/users'],
      ['get', '/api/organizations/org-1/stats'],
    ])('has no %s %s', async (method, path) => {
      // `invite-user` created an account with a generated password and handed
      // it back, and moved a member of another organization into the caller's.
      // The rest were cross-tenant CRUD nothing asked for.
      await request(app.getHttpServer())[method as 'get'](path).expect(404);
    });
  });
});
