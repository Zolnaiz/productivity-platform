import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { configureRequestHandling } from '../app-config';
import { OrganizationsService } from '../organizations/organizations.service';
import { MAILER } from '../shared/mail/mailer';
import { MetricsService } from '../shared/metrics/metrics.service';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { hashInvitationToken } from './invitation-token';
import { passwordResetMail } from './password-reset-mail';

/**
 * UC-07 password reset, through the real controller, DTO validation, error
 * filter and throttler. Only the database (an in-memory users table) and the
 * mail transport (a recorder) are replaced.
 */
interface Row {
  id: string;
  email: string;
  isActive: boolean;
  language?: string;
  password: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
}

describe('password reset over HTTP', () => {
  let app: INestApplication;
  let users: Row[];
  let sent: Array<{ to: string; subject: string; body: string }>;

  const fakeUsers = {
    findByEmail: async (email: string) => users.find((u) => u.email === email) ?? null,
    setResetToken: async (id: string, hash: string, expires: Date) => {
      const row = users.find((u) => u.id === id)!;
      row.resetPasswordToken = hash;
      row.resetPasswordExpires = expires;
    },
    findByResetToken: async (hash: string) =>
      users.find((u) => u.resetPasswordToken === hash) ?? null,
    // Mirrors the conditional UPDATE: only matches while the token is in place and live.
    completePasswordReset: async (id: string, hash: string, password: string) => {
      await new Promise((resolve) => setImmediate(resolve));
      const row = users.find((u) => u.id === id)!;
      if (row.resetPasswordToken !== hash || !row.resetPasswordExpires || row.resetPasswordExpires <= new Date()) {
        return false;
      }
      row.password = password;
      row.resetPasswordToken = null;
      row.resetPasswordExpires = null;
      return true;
    },
  };

  /** Issuance is detached from the response; let it finish before reading the mail. */
  const settle = () => new Promise((resolve) => setImmediate(resolve));

  const tokenFromMail = () => {
    const match = sent[sent.length - 1].body.match(/reset-password\/([\w-]+)/);
    return match![1];
  };

  // A fresh application per test: the throttler's counters live in the app.
  beforeEach(async () => {
    sent = [];
    users = [{ id: 'u1', email: 'bat@example.com', isActive: true, password: 'old-password' }];
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 1000 }] })],
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: UsersService, useValue: fakeUsers },
        { provide: OrganizationsService, useValue: {} },
        { provide: JwtService, useValue: {} },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'APP_BASE_URL' ? 'https://app.test' : undefined),
          },
        },
        {
          provide: MAILER,
          useValue: { send: async (m: never) => void sent.push(m), describe: () => 'test' },
        },
        MetricsService,
      ],
    }).compile();

    app = configureRequestHandling(
      moduleRef.createNestApplication({ logger: false }),
      moduleRef.get(MetricsService)
    );
    await app.init();
  });

  afterEach(() => app.close());

  const forgot = (email: string) =>
    request(app.getHttpServer()).post('/api/auth/forgot-password').send({ email });
  const reset = (token: string, password = 'NewPassword1') =>
    request(app.getHttpServer()).post('/api/auth/reset-password').send({ token, password });

  it('emails a link and stores only the hash of the token', async () => {
    expect((await forgot('bat@example.com')).status).toBe(201);

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('bat@example.com');
    const token = tokenFromMail();
    expect(users[0].resetPasswordToken).toBe(hashInvitationToken(token));
    expect(users[0].resetPasswordToken).not.toContain(token);
    const ttl = users[0].resetPasswordExpires!.getTime() - Date.now();
    expect(ttl).toBeGreaterThan(59 * 60_000);
    expect(ttl).toBeLessThanOrEqual(60 * 60_000);
  });

  it('answers identically for an unknown, an inactive and a known address (no enumeration)', async () => {
    users.push({ id: 'u2', email: 'off@example.com', isActive: false, password: 'x' });

    const bodies = [];
    for (const email of ['nobody@example.com', 'off@example.com', 'bat@example.com']) {
      const response = await forgot(email);
      expect(response.status).toBe(201);
      bodies.push({ status: response.status, data: response.body.data });
    }

    expect(bodies[0]).toEqual(bodies[1]);
    expect(bodies[1]).toEqual(bodies[2]);
    expect(sent.map((m) => m.to)).toEqual(['bat@example.com']);
  });

  it('sets the new password with a valid token', async () => {
    await forgot('bat@example.com');
    await reset(tokenFromMail()).expect(200);

    expect(users[0].password).toBe('NewPassword1');
    expect(users[0].resetPasswordToken).toBeNull();
  });

  it('refuses a token a second time (single use)', async () => {
    await forgot('bat@example.com');
    const token = tokenFromMail();
    await reset(token).expect(200);

    const again = await reset(token, 'Another1234').expect(400);
    expect(
      again.body.errorCode ?? again.body.error?.errorCode ?? JSON.stringify(again.body)
    ).toContain('PASSWORD_RESET_INVALID');
    expect(users[0].password).toBe('NewPassword1');
  });

  it('refuses a wrong token', async () => {
    await forgot('bat@example.com');
    const response = await reset('not-the-token').expect(400);
    expect(JSON.stringify(response.body)).toContain('PASSWORD_RESET_INVALID');
    expect(users[0].password).toBe('old-password');
  });

  it('refuses an expired token with the same answer as a wrong one', async () => {
    await forgot('bat@example.com');
    const token = tokenFromMail();
    users[0].resetPasswordExpires = new Date(Date.now() - 1000);

    const response = await reset(token).expect(400);
    expect(JSON.stringify(response.body)).toContain('PASSWORD_RESET_INVALID');
    expect(users[0].password).toBe('old-password');
  });

  it('refuses a token for a deactivated account', async () => {
    await forgot('bat@example.com');
    const token = tokenFromMail();
    users[0].isActive = false;

    await reset(token).expect(400);
  });

  it('does not mail twice inside the cooldown, and a new request replaces the old token', async () => {
    await forgot('bat@example.com');
    const first = tokenFromMail();
    await forgot('bat@example.com');
    expect(sent).toHaveLength(1);

    // Cooldown over: age the stored expiry, request again.
    users[0].resetPasswordExpires = new Date(Date.now() + 30 * 60_000);
    await forgot('bat@example.com');
    expect(sent).toHaveLength(2);
    await reset(first).expect(400);
    await reset(tokenFromMail()).expect(200);
  });

  it('rejects a short new password and a malformed address before touching anything', async () => {
    await forgot('bat@example.com');
    await reset(tokenFromMail(), '123').expect(400);
    expect((await forgot('not-an-email')).status).toBe(400);
  });

  it('lets only one of two concurrent requests with the same token succeed', async () => {
    await forgot('bat@example.com');
    const token = tokenFromMail();

    const [a, b] = await Promise.all([reset(token, 'FirstWins1'), reset(token, 'SecondWins1')]);

    expect([a.status, b.status].sort()).toEqual([200, 400]);
    expect(['FirstWins1', 'SecondWins1']).toContain(users[0].password);
  });

  it('answers before the mail is sent (no timing difference from SMTP)', async () => {
    let release!: () => void;
    const slowMail = new Promise<void>((resolve) => (release = resolve));
    const mailer = app.get(MAILER);
    const original = mailer.send;
    mailer.send = async (m: never) => {
      await slowMail;
      sent.push(m);
    };

    const response = await request(app.getHttpServer()).post('/api/auth/forgot-password').send({ email: 'bat@example.com' });
    expect(response.status).toBe(201);
    expect(sent).toHaveLength(0);

    release();
    await settle();
    await settle();
    expect(sent).toHaveLength(1);
    mailer.send = original;
  });

  it('rate-limits forgot-password per client', async () => {
    const statuses = [];
    for (let i = 0; i < 7; i += 1) {
      statuses.push((await forgot('nobody@example.com')).status);
    }
    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it('sends the Mongolian template by default and the English one for an English user', () => {
    const mn = passwordResetMail('mn', 'TOKEN', 'https://app.test/');
    expect(mn).toMatchInlineSnapshot(`
      {
        "body": "Таны бүртгэлийн нууц үгийг сэргээх хүсэлт ирлээ.

      Шинэ нууц үг тохируулахын тулд энэ холбоосыг нээнэ үү:
      https://app.test/reset-password/TOKEN

      Холбоос 1 цагийн дотор, зөвхөн нэг удаа ажиллана.

      Хэрэв та хүсэлт илгээгээгүй бол энэ захидлыг үл тоож болно. Нууц үг өөрчлөгдөхгүй.",
        "subject": "Нууц үг сэргээх",
      }
    `);
    const en = passwordResetMail('en', 'TOKEN', '');
    expect(en.body).toContain('TOKEN');
  });
});
