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

test('a 5S register row typed in is still there after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/fives');

  const marker = `Live check ${Date.now()}`;
  await page.getByRole('button', { name: 'Add row' }).first().click();
  const saved = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/five-s-guidelines') && response.request().method() === 'PATCH',
  );
  await page.getByPlaceholder('A01 - Reception').last().fill(marker);
  expect((await saved).status()).toBe(200);

  await page.reload();
  const row = page.locator('tr', { has: page.locator(`input[value="${marker}"]`) });
  await expect(row).toHaveCount(1);

  // Taken out again, through the register's own confirmation.
  await row.getByRole('button', { name: 'Delete improvement row' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator(`input[value="${marker}"]`)).toHaveCount(0);
});

test('a workspace setting saved is still set after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/settings');

  const closeDay = page.getByLabel('Month close day');
  const original = await closeDay.inputValue();
  const changed = original === '7' ? '8' : '7';

  await closeDay.fill(changed);
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Month close day')).toHaveValue(changed);

  await page.getByLabel('Month close day').fill(original);
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
});

test('a task added on the board is there after a reload, and gone once deleted', async ({ page }) => {
  await signIn(page);
  await page.goto('/tasks');

  const title = `Live check task ${Date.now()}`;
  await page.getByRole('button', { name: 'New task' }).first().click();
  await page.getByLabel('Task title').fill(title);
  const created = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/tasks') && response.request().method() === 'POST',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Add task' }).click();
  expect((await created).status()).toBe(201);

  await page.reload();
  await expect(page.getByText(title)).toBeVisible();

  // And taken back, as a manager takes back a task raised by mistake.
  const deleted = page.waitForResponse(
    (response) => new URL(response.url()).pathname.includes('/tasks/') && response.request().method() === 'DELETE',
  );
  await page.getByRole('button', { name: `Delete ${title}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  expect((await deleted).status()).toBe(200);

  await page.reload();
  await expect(page.getByText(title)).toHaveCount(0);
});

/** Deletes a record the test made, through the API it was made on. */
const removeThrough = (page: Page, path: string) =>
  page.evaluate(
    async ({ api, path }) =>
      (
        await fetch(`${api}${path}`, {
          method: 'DELETE',
          headers: { authorization: `Bearer ${localStorage.getItem('token')}` },
        })
      ).status,
    { api: process.env.E2E_API_URL || 'http://localhost:3000/api', path },
  );

test('a project added is still there after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/projects');

  const name = `Live check project ${Date.now()}`;
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByLabel('Project name').fill(name);
  const created = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/projects') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Add project' }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const { data } = await response.json();

  await page.reload();
  await expect(page.getByText(name)).toBeVisible();

  expect(await removeThrough(page, `/projects/${data.id}`)).toBe(200);
});

test('a department added is still there after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/departments');

  const name = `Live check department ${Date.now()}`;
  await page.getByRole('button', { name: 'New department' }).click();
  await page.getByLabel('Department name').fill(name);
  const created = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/departments') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Add department' }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const { data } = await response.json();

  await page.reload();
  await expect(page.getByText(name)).toBeVisible();

  expect(await removeThrough(page, `/departments/${data.id}`)).toBe(200);
});

test('a day written up is still there after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/work-logs');

  const summary = `Live check write-up ${Date.now()}`;
  await page.getByLabel('What did you finish?').fill(summary);
  await page.getByLabel('Hours').fill('1.5');
  const created = page.waitForResponse(
    (response) => /\/work-logs(\/daily)?$/.test(new URL(response.url()).pathname) && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Add log' }).click();
  expect((await created).status()).toBe(201);

  await page.reload();
  await expect(page.getByText(summary)).toBeVisible();
});

test('an expense submitted is still there after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/expenses');

  const title = `Live check expense ${Date.now()}`;
  await page.getByLabel('Expense title').fill(title);
  await page.getByLabel('Amount').fill('12500');
  const created = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/expenses') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  expect((await created).status()).toBe(201);

  await page.reload();
  await expect(page.getByText(title)).toBeVisible();
});

test('a daily goal added is still there after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/goals');

  const title = `Live check goal ${Date.now()}`;
  await page.getByLabel('Goal title').fill(title);
  const created = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/daily-goals') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Add goal' }).click();
  expect((await created).status()).toBe(201);

  await page.reload();
  await expect(page.getByText(title)).toBeVisible();
});

test('a month closed stays closed after a reload, and reopens', async ({ page }) => {
  await signIn(page);

  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`;
  await page.goto(`/reports?month=${month}`);

  // Whichever way it stands, bring it to open first - once the report is in.
  await expect(page.getByRole('button', { name: /^(Close|Reopen) month$/ })).toBeVisible();
  const reopen = page.getByRole('button', { name: 'Reopen month' });
  if (await reopen.isVisible()) await reopen.click();
  await expect(page.getByRole('button', { name: 'Close month' })).toBeVisible();

  await page.getByRole('button', { name: 'Close month' }).click();
  await expect(page.getByText(/^Closed on /)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/^Closed on /)).toBeVisible();

  await page.getByRole('button', { name: 'Reopen month' }).click();
  await expect(page.getByRole('button', { name: 'Close month' })).toBeVisible();
});

test('a questionnaire template built is still there after a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/questionnaires');

  const title = `Live check checklist ${Date.now()}`;
  await page.getByLabel('Template title').fill(title);
  await page.getByLabel('Question 1', { exact: true }).fill('Is the aisle clear?');
  const created = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/assessment-templates') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Create template' }).click();
  expect((await created).status()).toBe(201);

  await page.reload();
  await expect(page.getByText(title)).toBeVisible();
});

test('an invitation sent is open after a reload, and revoked', async ({ page }) => {
  await signIn(page);
  await page.goto('/users');

  const address = `live-check-${Date.now()}@example.com`;
  await page.getByRole('button', { name: 'Invite somebody' }).click();
  await page.getByRole('dialog').getByLabel('Email').fill(address);
  const created = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/auth/invitations') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Send invitation' }).click();
  expect((await created).status()).toBe(201);

  await page.reload();
  const row = page.locator('li, tr', { hasText: address }).first();
  await expect(row).toBeVisible();

  const revoked = page.waitForResponse(
    (response) => new URL(response.url()).pathname.includes('/auth/invitations/') && response.request().method() === 'DELETE',
  );
  await row.getByRole('button', { name: 'Revoke' }).click();
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible().catch(() => false)) await dialog.getByRole('button', { name: 'Revoke' }).click();
  expect((await revoked).status()).toBe(200);

  await page.reload();
  await expect(page.getByText(address)).toHaveCount(0);
});
