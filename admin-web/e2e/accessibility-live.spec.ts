import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * The accessibility check again, on the real server's data, as an operator
 * and as the owner.
 *
 * The demo's fixtures fill every table and photograph every red tag, and
 * hide what an empty or half-filled page does: on real data the 5S
 * registers had no rows, so nothing in their scroll area could take focus,
 * and a red tag with its photograph taken left the camera input with no
 * name.
 *
 * Uses the seed's accounts (`npm run seed` in backend), so it runs only with
 * E2E_LIVE_API=true, like the live suite.
 */
test.skip(process.env.E2E_LIVE_API !== 'true', 'needs the API and the seed; set E2E_LIVE_API=true');

const accounts = [
  process.env.E2E_OPERATOR_EMAIL || 'operator@example.com',
  process.env.E2E_EMAIL || 'owner@example.com',
];

for (const email of accounts) {
  test(`every page in ${email}'s menu reads to a screen reader and at AA contrast`, async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(process.env.E2E_PASSWORD || 'Password123');
    await page.locator('input[type="password"]').press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('navigation').getByRole('link').first().waitFor();
    const pages = await page
      .getByRole('navigation')
      .getByRole('link')
      .evaluateAll((anchors) => [
        ...new Set(anchors.map((a) => a.getAttribute('href') ?? '').filter((href) => href.startsWith('/'))),
      ]);

    const problems: string[] = [];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      for (const violation of violations) {
        for (const node of violation.nodes) problems.push(`${path} ${violation.id}: ${node.html.slice(0, 120)}`);
      }
    }

    expect(problems).toEqual([]);
  });
}
