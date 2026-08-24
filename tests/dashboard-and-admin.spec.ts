import { test, expect } from '@playwright/test';

test.describe('Clinic Dashboard & Platform Admin QA', () => {
  test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('redirects unauthenticated users from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('renders help center hub with knowledge guides', async ({ page }) => {
    await page.goto('/help');
    await expect(page.locator('h1')).toContainText('Help');
  });
});
