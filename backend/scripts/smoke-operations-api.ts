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
const organizationId = process.env.SMOKE_ORGANIZATION_ID || 'demo-org';

const base64Url = (value: Buffer | string) => Buffer.from(value).toString('base64url');

const signToken = () => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      sub: process.env.SMOKE_USER_ID || 'demo-owner',
      email: process.env.SMOKE_USER_EMAIL || 'owner@example.com',
      role: process.env.SMOKE_USER_ROLE || 'admin',
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

const request = async (path: string, token?: string) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const body = await readJson(response);
  return { response, body };
};

const summarizeBody = (body: unknown) => {
  if (!body) return 'empty response';
  if (typeof body === 'string') return body.slice(0, 160);
  return JSON.stringify(body).slice(0, 240);
};

async function main() {
  const token = signToken();
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
    const { response, body } = await request('/projects', token);
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
      name: 'operations summary with smoke token',
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
