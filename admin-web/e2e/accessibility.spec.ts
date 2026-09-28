import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Every page in the menu, checked by axe against WCAG 2 A and AA, in both
 * themes.
 *
 * The first pass found text too faint to read on most pages - light-theme
 * greys and blues left on dark cards at 3:1, a primary button at 3.7:1 - and
 * register fields a screen reader announced as "edit text", with no name.
 * None of it shows in a unit test: contrast needs the rendered colours, and
 * a missing name looks like nothing at all.
 *
 * Demo mode, like the smoke suite: no server, the fixtures fill the pages.
 */

/** Every page the demo owner's menu links to, read from the menu itself so a page added to it is checked without anybody remembering to list it. */
const menuPages = async (page: import('@playwright/test').Page) => {
  await page.getByRole('navigation').getByRole('link').first().waitFor();
  const links = await page
    .getByRole('navigation')
    .getByRole('link')
    .evaluateAll((anchors) => [
      ...new Set(anchors.map((a) => a.getAttribute('href') ?? '').filter((href) => href.startsWith('/'))),
    ]);
  // The half-year and annual report opens from the monthly one, not the menu.
  return [...links, '/reports/period'];
};

for (const theme of ['light', 'dark'] as const) {
  test(`every page reads to a screen reader and at AA contrast in the ${theme} theme`, async ({ page }) => {
    test.setTimeout(300_000);
    await page.addInitScript((chosen) => localStorage.setItem('theme', chosen), theme);
    await page.goto('/login');
    await page.getByTestId('demo-sign-in').click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const pages = await menuPages(page);
    expect(pages.length).toBeGreaterThan(15);

    const problems: string[] = [];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      for (const violation of violations) {
        for (const node of violation.nodes) {
          problems.push(`${path} ${violation.id}: ${node.html.slice(0, 120)}`);
        }
      }
    }

    expect(problems).toEqual([]);
  });
}

/*
  The screens a phone opens on the floor: the sign-in, and the area page a
  zone's QR label leads to, with its checklist and its red-tag form open.
*/
for (const theme of ['light', 'dark'] as const) {
  test(`the sign-in and a zone's page read the same on a phone in the ${theme} theme`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript((chosen) => localStorage.setItem('theme', chosen), theme);

    const problems: string[] = [];
    const check = async (where: string) => {
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      for (const violation of violations) {
        for (const node of violation.nodes) problems.push(`${where} ${violation.id}: ${node.html.slice(0, 120)}`);
      }
    };

    await page.goto('/login');
    await check('sign-in');

    await page.getByTestId('demo-sign-in').click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/fives');
    await expect(page.locator('svg[aria-label="5S floor plan"]')).toBeVisible();
    const target = await page.evaluate(() => {
      const [plan] = JSON.parse(localStorage.getItem('productivity-demo-5s-layouts') || '[]');
      return { planId: plan.id as string, zoneId: plan.zones?.[0]?.id as string };
    });

    await page.goto(`/zone/${target.planId}/${target.zoneId}`);
    await expect(page.locator('h1')).toBeVisible();
    await check('zone');

    await page.getByTestId('zone-audit').click();
    await expect(page.getByTestId('zone-audit-submit')).toBeVisible();
    await check('zone checklist');

    await page.goto(`/zone/${target.planId}/${target.zoneId}`);
    await page.getByTestId('zone-red-tag').click();
    await expect(page.locator('form')).toBeVisible();
    await check('zone red tag');

    expect(problems).toEqual([]);
  });
}
