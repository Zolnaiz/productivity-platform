import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

/**
 * The real application - every module, guard, pipe and filter - against a
 * real PostgreSQL, for the use-case acceptance tests. Only the clocks that
 * would fire on their own (schedulers) are switched off, and the rate limit
 * is raised so twenty-two scenarios in a row are not refused as abuse; the
 * password-reset throttle is tested on its own in the unit suite.
 */
export const useCaseEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST ??= 'localhost';
  process.env.DB_PORT ??= '5432';
  process.env.DB_USERNAME ??= 'postgres';
  process.env.DB_PASSWORD ??= 'postgres';
  process.env.DB_DATABASE ??= 'pp_uc';
  process.env.DB_MIGRATIONS_RUN = 'true';
  process.env.DB_SYNCHRONIZE = 'false';
  process.env.JWT_SECRET ??= 'use-case-tests-only-secret';
  process.env.ENABLE_AUDIT_SCHEDULER = 'false';
  process.env.ENABLE_MONTH_CLOSE = 'false';
  process.env.ENABLE_DAILY_REMINDERS = 'true';
  process.env.RATE_LIMIT_LIMIT = '100000';
  process.env.MAIL_TRANSPORT = 'log';
  process.env.ALLOW_PUBLIC_OPERATIONS = 'false';
};

export const bootApp = async (): Promise<INestApplication> => {
  useCaseEnv();
  // Imported after the environment is set: the config module reads it on import.
  const { AppModule } = await import('../../src/app.module');
  const { configureRequestHandling } = await import('../../src/app-config');
  const { MetricsService } = await import('../../src/shared/metrics/metrics.service');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = configureRequestHandling(moduleRef.createNestApplication({ logger: false }), moduleRef.get(MetricsService));
  await app.init();
  return app;
};

export type Client = ReturnType<typeof clientFor>;

/** Requests as one signed-in person; bodies come back unwrapped from the response envelope. */
export const clientFor = (app: INestApplication, token?: string) => {
  const server = app.getHttpServer();
  const auth = (req: request.Test) => (token ? req.set('Authorization', `Bearer ${token}`) : req);
  return {
    token,
    get: (path: string) => auth(request(server).get(`/api${path}`)),
    post: (path: string, body?: object) => auth(request(server).post(`/api${path}`)).send(body ?? {}),
    patch: (path: string, body?: object) => auth(request(server).patch(`/api${path}`)).send(body ?? {}),
    put: (path: string, body?: object) => auth(request(server).put(`/api${path}`)).send(body ?? {}),
    del: (path: string) => auth(request(server).delete(`/api${path}`)),
  };
};

/** What the response envelope carries. */
export const data = <T = any>(response: request.Response): T => response.body?.data ?? response.body;

/** The error code of a refusal, wherever the filter put it. */
export const errorCode = (response: request.Response): string | undefined =>
  response.body?.errorCode ?? response.body?.error?.errorCode ?? response.body?.data?.errorCode;

export interface Team {
  owner: Client;
  manager: Client;
  employee: Client;
  ownerId: string;
  managerId: string;
  employeeId: string;
  anonymous: Client;
}

/**
 * A fresh organization per run: an owner who registered it, a manager and an
 * employee who joined by invitation. Unique addresses, so the suite can run
 * again on the same database.
 */
export const buildTeam = async (app: INestApplication): Promise<Team> => {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const anonymous = clientFor(app);
  const password = 'Password123';

  const registered = await anonymous.post('/auth/register', {
    firstName: 'Owner',
    lastName: 'Test',
    email: `owner.${stamp}@uc.test`,
    password,
    organizationName: `UC Org ${stamp}`,
  });
  if (registered.status !== 201) throw new Error(`register failed: ${registered.status} ${JSON.stringify(registered.body)}`);
  const ownerAuth = data(registered);
  const owner = clientFor(app, ownerAuth.access_token);

  const join = async (role: string, firstName: string) => {
    const email = `${role}.${stamp}@uc.test`;
    const issued = await owner.post('/auth/invitations', { email, role });
    if (issued.status !== 201) throw new Error(`invite failed: ${issued.status} ${JSON.stringify(issued.body)}`);
    const { token } = data(issued);
    const accepted = await anonymous.post(`/auth/invitations/token/${token}/accept`, { firstName, lastName: 'Test', password });
    if (accepted.status !== 201) throw new Error(`accept failed: ${accepted.status} ${JSON.stringify(accepted.body)}`);
    const login = await anonymous.post('/auth/login', { email, password });
    const body = data(login);
    return { client: clientFor(app, body.access_token), id: body.user.id as string, email };
  };

  const manager = await join('manager', 'Manager');
  const employee = await join('user', 'Employee');

  return {
    owner,
    manager: manager.client,
    employee: employee.client,
    ownerId: ownerAuth.user.id,
    managerId: manager.id,
    employeeId: employee.id,
    anonymous,
  };
};

/** Today on the organization's calendar (Asia/Ulaanbaatar), YYYY-MM-DD. */
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ulaanbaatar' }).format(new Date());

/** The Monday of this week, YYYY-MM-DD. */
export const thisMonday = () => {
  const day = new Date(`${today()}T00:00:00Z`);
  const offset = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - offset * 86400000).toISOString().slice(0, 10);
};

export const previousMonth = () => {
  const [year, month] = today().split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  return date.toISOString().slice(0, 7);
};

/** A plan as the editor sends it back: the editable fields only, never the server's own. */
export const layoutBody = (plan: any, zones: unknown[]) => ({
  name: plan.name,
  site: plan.site,
  floor: plan.floor ?? '',
  scale: plan.scale,
  zones,
  objects: plan.objects ?? [],
  corners: plan.corners ?? [],
  walls: plan.walls ?? [],
  openings: plan.openings ?? [],
  roomLabels: plan.roomLabels ?? [],
});
