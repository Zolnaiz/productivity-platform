import { expect, test } from '@playwright/test';

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

  await page.getByRole('navigation').getByRole('link').first().waitFor();
  const links = await page
    .getByRole('navigation')
    .getByRole('link')
    .evaluateAll((anchors) => [
      ...new Set(anchors.map((a) => a.getAttribute('href') ?? '').filter((href) => href.startsWith('/'))),
    ]);
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
