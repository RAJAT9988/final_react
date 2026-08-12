import { test as setup, expect } from '@playwright/test';

import { createUser } from '../../src/testing/data-generators';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const user = createUser({
    firstName: 'Jane',
    password: 'password1',
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.waitForURL('/auth/login');
  await page.getByRole('link', { name: 'Register' }).click();

  await page.getByLabel('First Name').fill(user.firstName);
  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Register' }).click();
  // Backend signup has no JWT — app redirects to login after register
  await page.waitForURL('/auth/login');

  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('/app');

  await expect(page.getByText(`Welcome, ${user.firstName}`)).toBeVisible();

  await page.getByRole('button', { name: 'Sign Out' }).click();
  await page.waitForURL('/auth/login');

  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('/app');

  await page.context().storageState({ path: authFile });
});
