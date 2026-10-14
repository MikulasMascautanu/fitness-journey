import { expect, test, type Page } from '@playwright/test';

async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await expect(page.getByRole('heading', { name: 'Body', exact: true })).toBeVisible();
  const dismiss = page.getByRole('button', { name: 'Dismiss', exact: true });
  await expect(dismiss).toBeVisible();
  await dismiss.click();
}

test('body logging, same-date overwrite, and reload persistence', async ({ page }) => {
  await demo(page);
  await page.getByLabel('Weight', { exact: true }).fill('85.5');
  await page.getByLabel('Waist', { exact: true }).fill('90');
  const skinfolds = page.locator('.form-section').filter({ has: page.getByRole('heading', { name: 'Skinfold readings' }) });
  await skinfolds.getByLabel('Chest', { exact: true }).fill('10');
  await skinfolds.getByLabel('Abdomen', { exact: true }).fill('20');
  await skinfolds.getByLabel('Thigh', { exact: true }).fill('15');
  await expect(page.locator('.estimate-value')).toHaveText('13.6%');
  await page.getByRole('button', { name: 'Update entry', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Updated your entry' })).toBeVisible();
  await page.getByLabel('Weight', { exact: true }).fill('85.2');
  await page.getByRole('button', { name: 'Update entry', exact: true }).click();
  await expect(page.locator('.summary-primary .big-number')).toHaveText('85.2kg');
  await page.reload();
  await expect(page.getByLabel('Weight', { exact: true })).toHaveValue('85.2');
  await expect(page.locator('tbody tr')).toHaveCount(7);
  await page.getByRole('button', { name: 'Waist', exact: true }).click();
  await expect(page.getByRole('img', { name: /Waist history/ })).toBeVisible();
});

test('nutrition settings and daily logging persist', async ({ page }) => {
  await demo(page);
  await page.getByRole('link', { name: 'Nutrition', exact: true }).click();
  await page.locator('.plan-card summary').click();
  await page.getByLabel('Activity level').selectOption('1.2');
  await page.locator('input[name="weekly-goal"][value="0"]').check();
  await page.getByRole('button', { name: 'Save targets' }).click();
  await expect(page.locator('.target-card .stat-caption')).toHaveText('Maintain (0%)');
  await page.getByRole('spinbutton', { name: 'Calories', exact: true }).fill('2400');
  await page.getByRole('spinbutton', { name: 'Protein', exact: true }).fill('160');
  await page.getByRole('spinbutton', { name: 'Carbs', exact: true }).fill('260');
  await page.getByRole('spinbutton', { name: 'Fat', exact: true }).fill('80');
  await page.getByRole('button', { name: 'Save day', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved your nutrition' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Calories' })).toHaveValue('2400');
  await expect(page.locator('.target-card .stat-caption')).toHaveText('Maintain (0%)');
});

test('custom macro targets validate, preview, and persist', async ({ page }) => {
  await demo(page);
  await page.getByRole('link', { name: 'Nutrition', exact: true }).click();
  await page.locator('.plan-card summary').click();
  const protein = page.getByRole('spinbutton', { name: 'Protein target', exact: true });
  const fat = page.getByRole('spinbutton', { name: 'Fat target', exact: true });
  await protein.fill('');
  await fat.fill('14');
  await page.getByRole('button', { name: 'Save targets' }).click();
  await expect(protein).toHaveValue('');
  expect(await protein.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
  await protein.fill('1.8');
  expect(await fat.evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true);
  await fat.fill('15');
  await expect(page.locator('.plan-form .form-footer')).toContainText('Preview:');
  await page.getByRole('button', { name: 'Save targets' }).click();
  await expect(page.locator('.macro-bar .fat')).toHaveAttribute('style', 'width: 15%;');
  await page.reload();
  await page.locator('.plan-card summary').click();
  await expect(protein).toHaveValue('1.8');
  await expect(fat).toHaveValue('15');
  await page.getByRole('group', { name: 'Protein target presets', exact: true }).getByRole('button', { name: '2.4 g/kg', exact: true }).click();
  await expect(protein).toHaveValue('2.4');
  await protein.fill('2.5');
  await fat.fill('23');
  await page.getByRole('button', { name: 'Save targets' }).click();
  await expect(page.locator('.macro-bar .fat')).toHaveAttribute('style', 'width: 23%;');
  await page.reload();
  await page.locator('.plan-card summary').click();
  await expect(protein).toHaveValue('2.5');
  await expect(fat).toHaveValue('23');
});

test('account settings change the caliper sites', async ({ page }) => {
  await demo(page);
  await page.getByRole('link', { name: /Demo account/ }).click();
  await page.getByLabel('Sex used in formulas').selectOption('f');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Profile saved' })).toBeVisible();
  await page.getByRole('link', { name: 'Body', exact: true }).click();
  await page.getByLabel('Triceps', { exact: true }).fill('20');
  await page.getByLabel('Suprailiac', { exact: true }).fill('25');
  await page.locator('.form-section').filter({ has: page.getByRole('heading', { name: 'Skinfold readings' }) }).getByLabel('Thigh', { exact: true }).fill('15');
  await expect(page.locator('.estimate-value')).toHaveText('24.1%');
});

test('offline loading, deep navigation, and local entry', async ({ page, context }) => {
  await demo(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.goto('/nutrition');
  await expect(page.getByRole('heading', { name: 'Nutrition', exact: true })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Calories' }).fill('2100');
  await page.getByRole('spinbutton', { name: 'Protein' }).fill('150');
  await page.getByRole('spinbutton', { name: 'Carbs' }).fill('240');
  await page.getByRole('spinbutton', { name: 'Fat' }).fill('60');
  await page.getByRole('button', { name: 'Save day', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved your nutrition' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Calories' })).toHaveValue('2100');
  await context.setOffline(false);
});

test('light and dark layouts fit the viewport and sign-out hides data', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await demo(page);
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const name of ['Body', 'Nutrition']) {
      await page.getByRole('link', { name, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/${test.info().project.name}-${name.toLowerCase()}-${colorScheme}.png`, fullPage: true });
    }
  }
  await page.getByRole('button', { name: 'Leave demo' }).click();
  await expect(page.getByRole('heading', { name: 'A place for your progress' })).toBeVisible();
  await expect(page.locator('table')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('manifest supplies install icons', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toContain('512x512');
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
});

test('saving from two tabs preserves both sets of entries', async ({ page, context }) => {
  await demo(page);
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByRole('heading', { name: 'Body', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Nutrition', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Calories', exact: true }).fill('2345');
  await page.getByRole('spinbutton', { name: 'Protein', exact: true }).fill('150');
  await page.getByRole('spinbutton', { name: 'Carbs', exact: true }).fill('260');
  await page.getByRole('spinbutton', { name: 'Fat', exact: true }).fill('70');
  await page.getByRole('button', { name: 'Save day', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved your nutrition' })).toBeVisible();
  await second.getByLabel('Weight', { exact: true }).fill('84.1');
  await second.getByRole('button', { name: 'Update entry', exact: true }).click();
  await expect(second.getByRole('status').filter({ hasText: 'Updated your entry' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Calories', exact: true })).toHaveValue('2345');
  await page.getByRole('link', { name: 'Body', exact: true }).click();
  await expect(page.getByLabel('Weight', { exact: true })).toHaveValue('84.1');
});
