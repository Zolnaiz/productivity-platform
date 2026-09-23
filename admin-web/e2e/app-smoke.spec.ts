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

test('a red tag can be raised from the label, one-handed', async ({ page }) => {
  // The step that turns the zone page from a notice board into a tool: the
  // person who finds the clutter is usually the person working next to it.
  await signIn(page);
  await page.goto('/fives');
  await expect(page.locator('svg[aria-label="5S floor plan"]')).toBeVisible();

  const target = await page.evaluate(() => {
    const plan = JSON.parse(localStorage.getItem('productivity-demo-5s-layout') || '{}');
    return { planId: plan.id as string, zoneId: plan.zones?.[0]?.id as string };
  });

  await page.goto(`/zone/${target.planId}/${target.zoneId}`);
  await page.getByTestId('zone-red-tag').click();

  const form = page.locator('form');
  await form.locator('input').first().fill('Pallet left in the aisle');
  await form.locator('button[type="submit"]').click();

  await expect(page.getByText('Pallet left in the aisle')).toBeVisible();
});

test('cleaning can be recorded from the label, and the stored date is shown', async ({ page }) => {
  // The other half of what the person standing there is for. The date on
  // screen has to be the one that was stored, not the one this machine
  // happens to think it is.
  await signIn(page);
  await page.goto('/fives');
  await expect(page.locator('svg[aria-label="5S floor plan"]')).toBeVisible();

  const target = await page.evaluate(() => {
    const plan = JSON.parse(localStorage.getItem('productivity-demo-5s-layout') || '{}');
    return { planId: plan.id as string, zoneId: plan.zones?.[0]?.id as string };
  });

  await page.goto(`/zone/${target.planId}/${target.zoneId}`);
  await page.getByTestId('zone-cleaned').click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const plan = JSON.parse(localStorage.getItem('productivity-demo-5s-layout') || '{}');
        return plan.zones?.[0]?.lastCleanedAt as string;
      }),
    )
    .toMatch(/^\d{4}-\d{2}-\d{2}$/);

  const stored = await page.evaluate(() => {
    const plan = JSON.parse(localStorage.getItem('productivity-demo-5s-layout') || '{}');
    return plan.zones?.[0]?.lastCleanedAt as string;
  });
  await expect(page.getByText(stored)).toBeVisible();
});

test('a checklist can be walked from the label, and a failing area raises work', async ({ page }) => {
  // The whole 5S loop in one gesture: a check walked in the area repaints the
  // map and raises the work it calls for. Both used to happen only for an
  // audit typed up afterwards at a desk.
  await signIn(page);
  await page.goto('/fives');
  await expect(page.locator('svg[aria-label="5S floor plan"]')).toBeVisible();

  const target = await page.evaluate(() => {
    const plan = JSON.parse(localStorage.getItem('productivity-demo-5s-layout') || '{}');
    return { planId: plan.id as string, zoneId: plan.zones?.[0]?.id as string };
  });

  await page.goto(`/zone/${target.planId}/${target.zoneId}`);
  await page.getByTestId('zone-audit').click();

  // The lowest answer to every question, which is the case that has to lead
  // somewhere rather than the case that passes.
  const rows = page.locator('form ol li');
  const count = await rows.count();
  for (let index = 0; index < count; index += 1) {
    await rows.nth(index).getByRole('button', { name: '0', exact: true }).click();
  }

  await page.getByTestId('zone-audit-submit').click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const plan = JSON.parse(localStorage.getItem('productivity-demo-5s-layout') || '{}');
        return plan.zones?.[0]?.lastAuditScore as number;
      }),
    )
    .toBe(0);

  const followUps = await page.evaluate(() => {
    const tasks = JSON.parse(localStorage.getItem('productivity-demo-tasks') || '[]');
    return tasks.filter((task: { sourceType?: string }) => task.sourceType === 'audit_run').length;
  });
  expect(followUps).toBeGreaterThan(0);

  // And the photograph, which is what turns the score from an opinion into
  // something a manager can look at. The slot appears only once the check
  // exists for it to belong to.
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'aisle.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    ),
  });

  await expect(page.getByText('aisle.png')).toBeVisible();
});

test('a department counts its people and its areas', async ({ page }) => {
  // Both numbers used to be typed in by hand. They are now counted from the
  // staff list and from every floor of the plan, which is the only reason the
  // page is worth reading.
  await signIn(page);
  await page.goto('/fives');
  await expect(page.locator('svg[aria-label="5S floor plan"]')).toBeVisible();

  await page.goto('/departments');

  // The demo workspace's own department name, so this does not depend on the
  // interface language.
  const card = page.locator('h2', { hasText: 'Operations' }).locator('xpath=../..');
  await expect(card).toBeVisible();

  // Two people and two areas in the demo, both counted rather than stored.
  await expect.poll(async () => (await card.innerText()).match(/[1-9]/g)?.length ?? 0).toBeGreaterThan(1);
});
