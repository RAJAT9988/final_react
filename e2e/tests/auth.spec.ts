import { test, expect } from '@playwright/test';

test('logged in user sees home page', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: /Welcome,/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
});
