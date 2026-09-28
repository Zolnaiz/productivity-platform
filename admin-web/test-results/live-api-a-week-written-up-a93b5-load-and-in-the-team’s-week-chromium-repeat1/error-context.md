# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-api.spec.ts >> a week written up is still there after a reload, and in the team’s week
- Location: e2e\live-api.spec.ts:399:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByLabel('In the way')
Expected: "Live check problem 1790600520873"
Received: "Live check problem 1790600520866"
Timeout:  10000ms

Call log:
  - Expect "toHaveValue" with timeout 10000ms
  - waiting for getByLabel('In the way')
    - locator resolved to <textarea rows="2" disabled id=":r5:" placeholder="What is holding you up, and what would help" class="w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white px-3 py-2 text-sm border-gray-300 dark:border-gray-700 cursor-not-allowed bg-gray-100 dark:bg-gray-800"></textarea>
    - unexpected value ""
    21 × locator resolved to <textarea rows="2" id=":r5:" placeholder="What is holding you up, and what would help" class="w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white px-3 py-2 text-sm border-gray-300 dark:border-gray-700">Live check problem 1790600520866</textarea>
       - unexpected value "Live check problem 1790600520866"

```

```yaml
- textbox "In the way":
  - /placeholder: What is holding you up, and what would help
  - text: Live check problem 1790600520866
```

# Test source

```ts
  312 | 
  313 |   const revoked = page.waitForResponse(
  314 |     (response) => new URL(response.url()).pathname.includes('/auth/invitations/') && response.request().method() === 'DELETE',
  315 |   );
  316 |   await row.getByRole('button', { name: 'Revoke' }).click();
  317 |   const dialog = page.getByRole('dialog');
  318 |   if (await dialog.isVisible().catch(() => false)) await dialog.getByRole('button', { name: 'Revoke' }).click();
  319 |   expect((await revoked).status()).toBe(200);
  320 | 
  321 |   await page.reload();
  322 |   await expect(page.getByText(address)).toHaveCount(0);
  323 | });
  324 | 
  325 | test('a red tag raised on a zone page is still there after a reload', async ({ page }) => {
  326 |   await signIn(page);
  327 |   await page.goto('/dashboard');
  328 | 
  329 |   // The first zone of the first plan, as a QR code on its label would open it.
  330 |   const { planId, zoneId } = await page.evaluate(async (api) => {
  331 |     const res = await fetch(`${api}/five-s-layouts`, {
  332 |       headers: { authorization: `Bearer ${localStorage.getItem('token')}` },
  333 |     });
  334 |     const plan = (await res.json()).data[0];
  335 |     return { planId: plan.id as string, zoneId: plan.zones[0].id as string };
  336 |   }, process.env.E2E_API_URL || 'http://localhost:3000/api');
  337 |   await page.goto(`/zone/${planId}/${zoneId}`);
  338 | 
  339 |   const title = `Live check tag ${Date.now()}`;
  340 |   await page.getByRole('button', { name: 'Red-tag something here' }).click();
  341 |   await page.getByLabel('What is it?').fill(title);
  342 |   const raised = page.waitForResponse(
  343 |     (response) => new URL(response.url()).pathname.endsWith('/red-tags') && response.request().method() === 'POST',
  344 |   );
  345 |   await page.getByRole('button', { name: 'Raise the tag' }).click();
  346 |   expect((await raised).status()).toBe(201);
  347 | 
  348 |   await page.reload();
  349 |   await expect(page.getByText(title)).toBeVisible();
  350 | 
  351 |   // Taken off the plan again, with the plan's own save.
  352 |   const status = await page.evaluate(
  353 |     async ({ api, planId, zoneId, title }) => {
  354 |       const headers = { authorization: `Bearer ${localStorage.getItem('token')}`, 'content-type': 'application/json' };
  355 |       const plan = (await (await fetch(`${api}/five-s-layouts`, { headers })).json()).data.find(
  356 |         (item: { id: string }) => item.id === planId,
  357 |       );
  358 |       const zones = plan.zones.map((zone: { id: string; redTags?: Array<{ title: string }> }) =>
  359 |         zone.id === zoneId ? { ...zone, redTags: (zone.redTags ?? []).filter((tag) => tag.title !== title) } : zone,
  360 |       );
  361 |       const res = await fetch(`${api}/five-s-layouts/${planId}`, {
  362 |         method: 'PATCH',
  363 |         headers,
  364 |         body: JSON.stringify({ name: plan.name, site: plan.site, scale: plan.scale, zones, objects: plan.objects, baseUpdatedAt: plan.updatedAt }),
  365 |       });
  366 |       return res.status;
  367 |     },
  368 |     { api: process.env.E2E_API_URL || 'http://localhost:3000/api', planId, zoneId, title },
  369 |   );
  370 |   expect(status).toBe(200);
  371 | });
  372 | 
  373 | test('an idea put in and taken up is still taken up after a reload, with its task', async ({ page }) => {
  374 |   await signIn(page);
  375 |   await page.goto('/ideas');
  376 | 
  377 |   const title = `Live check idea ${Date.now()}`;
  378 |   await page.getByLabel('The idea').fill(title);
  379 |   const created = page.waitForResponse(
  380 |     (response) => new URL(response.url()).pathname.endsWith('/ideas') && response.request().method() === 'POST',
  381 |   );
  382 |   await page.getByRole('button', { name: 'Send the idea' }).click();
  383 |   expect((await created).status()).toBe(201);
  384 | 
  385 |   const card = page.getByTestId('idea').filter({ hasText: title });
  386 |   await card.getByRole('button', { name: 'Take it up' }).click();
  387 |   const reviewed = page.waitForResponse(
  388 |     (response) => new URL(response.url()).pathname.endsWith('/review') && response.request().method() === 'PATCH',
  389 |   );
  390 |   await card.getByRole('button', { name: 'Take it up and give out the work' }).click();
  391 |   expect((await reviewed).status()).toBe(200);
  392 | 
  393 |   await page.reload();
  394 |   const again = page.getByTestId('idea').filter({ hasText: title });
  395 |   await expect(again.getByText('Taken up', { exact: true })).toBeVisible();
  396 |   await expect(again.getByRole('link', { name: 'See the task' })).toBeVisible();
  397 | });
  398 | 
  399 | test('a week written up is still there after a reload, and in the team’s week', async ({ page }) => {
  400 |   await signIn(page);
  401 |   await page.goto('/weekly');
  402 | 
  403 |   const problem = `Live check problem ${Date.now()}`;
  404 |   await page.getByLabel('In the way').fill(problem);
  405 |   const saved = page.waitForResponse(
  406 |     (response) => new URL(response.url()).pathname.endsWith('/checkins/mine') && response.request().method() === 'PUT',
  407 |   );
  408 |   await page.getByRole('button', { name: 'Save my week' }).click();
  409 |   expect((await saved).status()).toBe(200);
  410 | 
  411 |   await page.reload();
> 412 |   await expect(page.getByLabel('In the way')).toHaveValue(problem);
      |                                               ^ Error: expect(locator).toHaveValue(expected) failed
  413 |   await expect(page.getByTestId('team-problems')).toContainText(problem);
  414 | });
  415 | 
```