import { CanActivate, ExecutionContext, INestApplication, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { configureRequestHandling } from '../app-config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../shared/constants';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { MetricsService } from '../shared/metrics/metrics.service';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * The users API as a client actually meets it.
 *
 * Every other spec here builds a guard or a DTO by hand. That proves each
 * piece works; it does not prove the pieces are wired together, and the
 * defects this file exists to catch all live in the wiring:
 *
 * - `forbidNonWhitelisted` is what turns `PATCH /users/:id` with a `role` into
 *   a refusal rather than a dropped field, and it is configured in the
 *   application rather than on the DTO. The escalation this closed went
 *   through exactly this request.
 * - `profile/me` has to be matched before `:id`, or reading your own profile
 *   becomes a lookup for a user called "profile".
 * - A guard that throws has to reach the client as a 403 carrying its
 *   `errorCode`, through the exception filter and the response interceptor.
 *
 * The signed-in caller is supplied by a stub for `JwtAuthGuard`, so there is
 * no token to mint — everything after authentication is the real thing,
 * configured by the same function `main.ts` calls.
 */

/** The person the request is made as; each test sets it before calling. */
let currentUser: { id: string; role: UserRole; organizationId: string } | null = null;

@Injectable()
class StubAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (!currentUser) return false;

    context.switchToHttp().getRequest().user = currentUser;
    return true;
  }
}

const member = (over: Partial<User> = {}) =>
  ({
    id: 'u1',
    firstName: 'Bat',
    lastName: 'Dorj',
    email: 'bat@example.com',
    role: UserRole.USER,
    organizationId: 'org-1',
    isActive: true,
    ...over,
  }) as User;

describe('users API over HTTP', () => {
  let app: INestApplication;
  let repository: { findOne: jest.Mock; save: jest.Mock; createQueryBuilder: jest.Mock };

  const signedInAs = (role: UserRole, id = 'admin-1') => {
    currentUser = { id, role, organizationId: 'org-1' };
  };

  beforeAll(async () => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        PermissionsGuard,
        { provide: getRepositoryToken(User), useValue: repository },
        // The real one: it has no dependencies, and a stub missing a method
        // throws inside the interceptor's `finalize`, which swallows the
        // response rather than failing loudly.
        MetricsService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(StubAuthGuard)
      .compile();

    app = configureRequestHandling(moduleRef.createNestApplication(), moduleRef.get(MetricsService));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository.save.mockImplementation(async (value) => value);
    repository.findOne.mockResolvedValue(member());
    signedInAs(UserRole.ORGANIZATION_ADMIN);
  });

  describe('editing a member', () => {
    it('accepts the details a member may have changed', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/users/u1')
        .send({ firstName: 'Bataa', position: 'Инженер' })
        .expect(200);

      expect(response.body.data).toMatchObject({ firstName: 'Bataa', position: 'Инженер' });
    });

    it.each(['role', 'organizationId', 'isActive', 'password'])(
      'refuses a request carrying %s outright',
      async (field) => {
        const body: Record<string, unknown> = { firstName: 'Bataa' };
        body[field] = field === 'isActive' ? false : 'super_admin';

        await request(app.getHttpServer()).patch('/api/users/u1').send(body).expect(400);

        // Refused before the service saw it — not accepted and then filtered.
        expect(repository.save).not.toHaveBeenCalled();
      },
    );

    it('does not let an ordinary member promote themselves', async () => {
      // The request that made every account one step from super admin.
      //
      // It is refused at the guard rather than the pipe, because Nest runs
      // guards before validation — so an ordinary member never reaches the
      // body check at all. Either refusal closes it; the ordering means the
      // route is shut to them whatever they send.
      signedInAs(UserRole.USER, 'u1');
      repository.findOne.mockResolvedValue(member({ id: 'u1' }));

      await request(app.getHttpServer())
        .patch('/api/users/u1')
        .send({ role: 'super_admin' })
        .expect(403);

      await request(app.getHttpServer()).patch('/api/users/u1').send({ firstName: 'Bataa' }).expect(403);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('still refuses the role field from somebody who may edit members', async () => {
      // An organization admin passes the guard, so this one reaches the pipe —
      // which is the lock that has to hold for the route to be safe at all.
      await request(app.getHttpServer())
        .patch('/api/users/u1')
        .send({ role: 'super_admin' })
        .expect(400);

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('route matching', () => {
    it('reads your own profile rather than a member called "profile"', async () => {
      signedInAs(UserRole.VIEWER, 'u1');
      repository.findOne.mockResolvedValue(member({ id: 'u1', role: UserRole.VIEWER }));

      const response = await request(app.getHttpServer()).get('/api/users/profile/me').expect(200);

      expect(response.body.data.id).toBe('u1');
      expect(repository.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
    });

    it('answers what you are allowed to do, whatever your role', async () => {
      signedInAs(UserRole.VIEWER, 'u1');
      repository.findOne.mockResolvedValue(member({ id: 'u1', role: UserRole.VIEWER }));

      const response = await request(app.getHttpServer()).get('/api/users/profile/permissions').expect(200);

      expect(response.body.data.permissions).toContain('zones:read');
      expect(response.body.data.permissions).not.toContain('projects:delete');
    });
  });

  describe('what each role may reach', () => {
    const listing = () => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
    });

    it.each([
      [UserRole.ORGANIZATION_ADMIN, 200],
      [UserRole.ADMIN, 200],
      [UserRole.MANAGER, 200],
      [UserRole.USER, 403],
      [UserRole.VIEWER, 403],
    ])('answers the member list for %s with %i', async (role, status) => {
      repository.createQueryBuilder.mockReturnValue(listing());
      signedInAs(role);

      await request(app.getHttpServer()).get('/api/users').expect(status);
    });

    // A POST answers 201 when it succeeds; the refusals are what this is for.
    it.each([
      [UserRole.ORGANIZATION_ADMIN, 201],
      [UserRole.MANAGER, 403],
      [UserRole.USER, 403],
    ])('answers a deactivation for %s with %i', async (role, status) => {
      signedInAs(role);

      await request(app.getHttpServer()).post('/api/users/u1/deactivate').expect(status);
    });

    it('names the permission it wanted when it refuses', async () => {
      signedInAs(UserRole.VIEWER);

      const response = await request(app.getHttpServer()).get('/api/users').expect(403);

      // The client translates this code; it never shows the English text.
      expect(response.body).toMatchObject({ errorCode: expect.any(String) });
    });

    it('refuses a request with nobody signed in', async () => {
      currentUser = null;

      await request(app.getHttpServer()).get('/api/users').expect(403);
    });
  });

  describe('changing a role', () => {
    it('refuses a role that is not one of the roles', async () => {
      await request(app.getHttpServer())
        .post('/api/users/u1/change-role')
        .send({ role: 'root' })
        .expect(400);
    });

    it('refuses to reach above the caller, even with the permission to try', async () => {
      await request(app.getHttpServer())
        .post('/api/users/u1/change-role')
        .send({ role: 'super_admin' })
        .expect(403);
    });

    it('grants a role below the caller', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/u1/change-role')
        .send({ role: 'manager' })
        .expect(201);

      expect(response.body.data.role).toBe(UserRole.MANAGER);
    });
  });

  describe('the member list query', () => {
    it('refuses a page size that would return the whole table', async () => {
      await request(app.getHttpServer()).get('/api/users?limit=5000').expect(400);
    });

    it('refuses an unknown filter rather than ignoring it', async () => {
      await request(app.getHttpServer()).get('/api/users?sortBy=password').expect(400);
    });

    it('reads page and limit as numbers off the query string', async () => {
      const builder = listingBuilder();
      repository.createQueryBuilder.mockReturnValue(builder);

      await request(app.getHttpServer()).get('/api/users?page=3&limit=5').expect(200);

      expect(builder.skip).toHaveBeenCalledWith(10);
      expect(builder.take).toHaveBeenCalledWith(5);
    });
  });

  it('has no endpoint that creates a user', async () => {
    // An invitation is the only way into an organization.
    await request(app.getHttpServer()).post('/api/users').send({ email: 'x@example.com' }).expect(404);
  });
});

function listingBuilder() {
  const builder = {
    leftJoinAndSelect: jest.fn(() => builder),
    where: jest.fn(() => builder),
    andWhere: jest.fn(() => builder),
    skip: jest.fn(() => builder),
    take: jest.fn(() => builder),
    orderBy: jest.fn(() => builder),
    getCount: jest.fn(async () => 0),
    getMany: jest.fn(async () => []),
  };

  return builder;
}
