import { expect, Page, test } from '@playwright/test';

/**
 * What the editor saves, read back from a real server.
 *
 * The demo-mode suite cannot see a save that never leaves the browser, and
 * three of them did not: every save of an audited plan was refused with a 400,
 * the audit layers and the spaghetti routes were never sent at all, and in
 * development a refused save was quietly kept in demo storage instead. Each
 * looked saved on screen. This changes a thing, reloads the page, and looks.
 *
 * Needs the API and the seed (`npm run seed` in backend), so it runs only
 * when asked: E2E_LIVE_API=true. The credentials are the seed's own test
 * account; E2E_EMAIL and E2E_PASSWORD point it elsewhere.
 */
test.skip(process.env.E2E_LIVE_API !== 'true', 'needs the API and the seed; set E2E_LIVE_API=true');

const email = process.env.E2E_EMAIL || 'owner@example.com';
const password = process.env.E2E_PASSWORD || 'Password123';

const signIn = async (page: Page) => {
  // English, chosen here rather than assumed: the labels below are the
  // English ones, and the workspace's own language may be Mongolian.
  await page.addInitScript(() => localStorage.setItem('app-language', 'en'));
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('input[type="password"]').press('Enter');
  await expect(page).toHaveURL(/\/dashboard$/);
};

/** Waits for the editor's debounced background save to reach the server. */
const planSaved = (page: Page) =>
  page.waitForResponse(
    (response) => /\/five-s-layouts?(\/[^/]+)?$/.test(new URL(response.url()).pathname) && response.request().method() === 'PATCH',
  );

test('a zone renamed in the editor is still renamed after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/fives');

  const name = page.getByLabel('Zone name');
  const original = await name.inputValue();
  const renamed = `${original} (live check)`;

  const saved = planSaved(page);
  await name.fill(renamed);
  expect((await saved).status()).toBe(200);

  await page.reload();
  await expect(page.getByLabel('Zone name')).toHaveValue(renamed);

  // Put back as it was.
  const restored = planSaved(page);
  await page.getByLabel('Zone name').fill(original);
  expect((await restored).status()).toBe(200);
});

test('an audit layer renamed on the plan is still renamed after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/fives');

  const layer = page.getByLabel('Name of layer 1');
  const original = await layer.inputValue();

  const saved = planSaved(page);
  await layer.fill('Operator (live check)');
  expect((await saved).status()).toBe(200);

  await page.reload();
  await expect(page.getByLabel('Name of layer 1')).toHaveValue('Operator (live check)');

  const restored = planSaved(page);
  await page.getByLabel('Name of layer 1').fill(original);
  expect((await restored).status()).toBe(200);
});
