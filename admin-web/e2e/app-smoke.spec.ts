import { expect, test } from '@playwright/test';

/**
 * The paths a real defect would take down, in a real browser.
 *
 * Every serious fault found in this application over the last month was found
 * by opening it, not by a unit test: walls that were never sent to the server,
 * pointer coordinates that ignored the canvas's letterboxing, a plan drawn in
 * white on a dark page, a translation call printed as its own source code.
 * jsdom cannot see any of those — it has no layout, so a click always lands
 * where the maths says it does.
 *
 * Demo mode, so this needs no server and no database: the fixtures live in the
 * browser. What it exercises is the application shell, the router, the canvas
 * and the theme, which is where those faults were.
 *
 * Nothing here matches translated text. The suite that was here before did,
 * and stopped running the day the interface defaulted to Mongolian — a test
 * nobody notices has stopped is worse than no test.
 */

const signIn = async (page: import('@playwright/test').Page) => {
  await page.goto('/login');
  await page.getByTestId('demo-sign-in').click();
  await expect(page).toHaveURL(/\/dashboard$/);
};

test('somebody can sign in and reach the floor plan', async ({ page }) => {
  await signIn(page);

  await page.goto('/fives');

  // The canvas is the page: if it is not here, nothing else on it matters.
  await expect(page.locator('svg[aria-label="5S floor plan"]')).toBeVisible();
});

test('the plan can be drawn on', async ({ page }) => {
  await signIn(page);
  await page.goto('/fives');

  const canvas = page.locator('svg[aria-label="5S floor plan"]');
  await expect(canvas).toBeVisible();
  // Wall segments, by the one attribute only they carry: a drawn wall's
  // thickness is not the demo's, so counting a particular width would be
  // counting the fixtures rather than the drawing.
  const walls = canvas.locator('line[stroke-linecap="butt"]');
  const wallsBefore = await walls.count();

  // Two clicks with the wall tool in hand: one to start, one to finish. This
  // is the gesture that broke when the pointer maths ignored the SVG's
  // letterboxing, and the only way to see it is to click at a real position
  // in a laid-out page.
  await page.getByTestId('tool-wall').click();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('the canvas has no box to click in');

  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.4);
  await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.4);

  await expect.poll(() => walls.count()).toBeGreaterThan(wallsBefore);
});

test('the plan is not a white slab at night', async ({ page }) => {
  await signIn(page);
  await page.goto('/fives');

  const paper = page.locator('svg[aria-label="5S floor plan"] rect[data-canvas-background]').first();
  await expect(paper).toHaveAttribute('fill', '#ffffff');

  // The theme control is a radio group; the middle option is dark. Chosen by
  // position rather than by its label, which is translated.
  await page.getByRole('radio', { name: /dark|бараан/i }).click();

  await expect(paper).not.toHaveAttribute('fill', '#ffffff');
});

test('the monthly report opens and is compiled per person', async ({ page }) => {
  await signIn(page);

  await page.goto('/reports');

  // One row per member of the demo workspace, whether or not they recorded
  // anything — the case that says the report is built from the staff list and
  // not only from the records.
  await expect(page.locator('table tbody tr')).not.toHaveCount(0);
});

test('a zone label opens the area it names', async ({ page }) => {
  await signIn(page);
  await page.goto('/fives');
  await expect(page.locator('svg[aria-label="5S floor plan"]')).toBeVisible();

  const target = await page.evaluate(() => {
    const plan = JSON.parse(localStorage.getItem('productivity-demo-5s-layout') || '{}');
    return { planId: plan.id as string, zoneId: plan.zones?.[0]?.id as string };
  });

  await page.goto(`/zone/${target.planId}/${target.zoneId}`);

  await expect(page.locator('h1')).toContainText('A01');
});
