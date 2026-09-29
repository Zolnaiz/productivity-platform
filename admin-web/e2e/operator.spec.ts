import { expect, test } from '@playwright/test';
import { everyMenuPage } from './support/menu';

/**
 * The application as somebody on the floor sees it.
 *
 * Every page in an operator's menu, against the real server: none may show
 * an error or a raw id where a name belongs. They did - eight screens asked
 * for the staff list, which an operator may not read, and named nobody. The
 * staff list may be refused once per sign-in; the people directory answers
 * after that.
 *
 * Uses the seed's operator (`npm run seed` in backend), so it runs only with
 * E2E_LIVE_API=true, like the live suite.
 */
test.skip(process.env.E2E_LIVE_API !== 'true', 'needs the API and the seed; set E2E_LIVE_API=true');

test('an operator opens every page in their menu without an error or a bare id', async ({ page }) => {
  test.setTimeout(180_000);
  const refused: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      refused.push(`${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`);
    }
  });

  await page.addInitScript(() => localStorage.setItem('app-language', 'en'));
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(process.env.E2E_OPERATOR_EMAIL || 'operator@example.com');
  await page.locator('input[type="password"]').fill(process.env.E2E_PASSWORD || 'Password123');
  await page.locator('input[type="password"]').press('Enter');
  await expect(page).toHaveURL(/\/dashboard$/);

  const links = await everyMenuPage(page);
  expect(links.length).toBeGreaterThan(5);

  const problems: string[] = [];
  for (const link of links) {
    await page.goto(link);
    await page.waitForLoadState('networkidle');
    const text = await page.locator('main').innerText();
    const shown =
      text.match(/.{0,50}(Something went wrong|could not|failed|not have access).{0,50}/i) ??
      text.match(/.{0,30}[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}.{0,30}/i);
    if (shown) problems.push(`${link}: ${shown[0].replace(/\n/g, ' ')}`);
  }

  expect(problems).toEqual([]);
  expect(refused.filter((line) => line !== '403 GET /api/users')).toEqual([]);
  expect(refused.length).toBeLessThanOrEqual(1);
});

test('an operator writes up their day and walks an area’s checklist', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('app-language', 'en'));
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(process.env.E2E_OPERATOR_EMAIL || 'operator@example.com');
  await page.locator('input[type="password"]').fill(process.env.E2E_PASSWORD || 'Password123');
  await page.locator('input[type="password"]').press('Enter');
  await expect(page).toHaveURL(/\/dashboard$/);

  // The day written up.
  await page.goto('/work-logs');
  await page.getByRole('button', { name: 'Add daily work log' }).click();
  const summary = `Operator write-up ${Date.now()}`;
  await page.getByLabel('What did you finish?').fill(summary);
  await page.getByLabel('Hours').fill('2');
  const logged = page.waitForResponse(
    (response) => /\/work-logs(\/daily)?$/.test(new URL(response.url()).pathname) && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Add log' }).click();
  expect((await logged).status()).toBe(201);

  // An area checked, from its page, as the QR code on its label opens it.
  const { planId, zoneId } = await page.evaluate(async (api) => {
    const res = await fetch(`${api}/five-s-layouts`, {
      headers: { authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const plan = (await res.json()).data[0];
    return { planId: plan.id as string, zoneId: plan.zones[0].id as string };
  }, process.env.E2E_API_URL || 'http://localhost:3000/api');
  await page.goto(`/zone/${planId}/${zoneId}`);
  await page.getByTestId('zone-audit').click();
  await expect(page.getByTestId('zone-audit-submit')).toBeVisible();
  // Every score question at its best, every yes/no a yes, so the check
  // raises no follow-up work.
  for (const question of await page.getByRole('group').all()) {
    const yes = question.getByRole('button', { name: 'Yes', exact: true });
    const buttons = question.getByRole('button');
    // A yes/no question gets its yes; a score question its highest mark.
    await ((await yes.count()) ? yes : buttons.nth((await buttons.count()) - 1)).click();
  }
  const recorded = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/audit-runs') && response.request().method() === 'POST',
  );
  await page.getByTestId('zone-audit-submit').click();
  const run = await recorded;
  expect(run.status()).toBe(201);
  expect(Number(run.request().postDataJSON().score)).toBe(100);
});
