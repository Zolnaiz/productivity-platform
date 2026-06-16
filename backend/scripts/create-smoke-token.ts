import { createHmac } from 'crypto';
import { config } from 'dotenv';

config();

const base64Url = (value: Buffer | string) =>
  Buffer.from(value).toString('base64url');

const sign = (payload: Record<string, unknown>, secret: string) => {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
const now = Math.floor(Date.now() / 1000);
const token = sign(
  {
    sub: process.env.SMOKE_USER_ID || '22222222-2222-4222-8222-000000000001',
    email: process.env.SMOKE_USER_EMAIL || 'owner@example.com',
    role: process.env.SMOKE_USER_ROLE || 'admin',
    organizationId: process.env.SMOKE_ORGANIZATION_ID || '11111111-1111-4111-8111-000000000001',
    permissions: ['operations:read', 'operations:write'],
    iat: now,
    exp: now + 60 * 60 * 8,
  },
  secret,
);

console.log(token);
