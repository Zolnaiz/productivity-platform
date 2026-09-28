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

const pages = [
  '/dashboard',
  '/tasks',
  '/progress',
  '/plan',
  '/projects',
  '/work-logs',
  '/fives',
  '/reports',
  '/notifications',
  '/settings',
  '/users',
  '/departments',
  '/expenses',
  '/goals',
  '/questionnaires',
  '/responses',
  '/audit-templates',
];

for (const theme of ['light', 'dark'] as const) {
  test(`every page reads to a screen reader and at AA contrast in the ${theme} theme`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript((chosen) => localStorage.setItem('theme', chosen), theme);
    await page.goto('/login');
    await page.getByTestId('demo-sign-in').click();
    await expect(page).toHaveURL(/\/dashboard$/);

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
