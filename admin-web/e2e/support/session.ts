import { expect, type Page } from '@playwright/test';

/** The API the live tests run against. */
export const apiUrl = process.env.E2E_API_URL || 'http://localhost:3000/api';

/**
 * Headers for the calls a test makes to the API itself: to find a record to
 * open, or to clean up one it made.
 *
 * The page keeps its access token in memory, where no script can read it - and
 * so no test either. The test signs in once more as the same person instead.
 * Without the `X-Session-Cookie` header the API hands the tokens back in the
 * answer, as it does for the phone, and leaves the browser's session cookie
 * alone.
 */
export const apiHeaders = async (page: Page, email: string, password: string) => {
  const response = await page.request.post(`${apiUrl}/auth/login`, { data: { email, password } });
  expect(response.ok(), `signing in as ${email} for the test's own API calls`).toBe(true);
  const body = await response.json();
  return { authorization: `Bearer ${(body.data ?? body).access_token}` };
};

/** The first area of the first floor plan, as the QR code on its label would open it. */
export const firstZone = async (page: Page, headers: Record<string, string>) => {
  const response = await page.request.get(`${apiUrl}/five-s-layouts`, { headers });
  const plan = (await response.json()).data[0];
  return { planId: plan.id as string, zoneId: plan.zones[0].id as string };
};
