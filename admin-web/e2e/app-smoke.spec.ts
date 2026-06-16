import { expect, test } from '@playwright/test';

test('seeded owner can sign in and open projects', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByLabel('Email')).toHaveValue('owner@example.com');
  await page.getByLabel('Password').fill('Password123');
  await page.getByLabel('Password').press('Enter');

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/projects');
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('body')).toContainText('Operations productivity rollout');
});
