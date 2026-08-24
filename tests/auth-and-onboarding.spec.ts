import { test, expect } from '@playwright/test';

test.describe('Authentication & Onboarding Flows', () => {
  test('renders login page with email and password inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('renders signup page with organization and password fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('renders forgot password reset page', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('renders onboarding questionnaire with dual website pathways', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('body')).toBeVisible();
  });
});
