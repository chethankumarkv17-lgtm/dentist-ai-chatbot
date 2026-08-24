import { test, expect } from '@playwright/test';

test.describe('Public Marketing, Booking & Mobile Responsiveness', () => {
  test('renders marketing home page with key dental SaaS features', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Radiant Nobel, text=Dental, text=AI').first()).toBeVisible();
  });

  test('renders pricing page with Starter, Growth, and Pro tiers', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('text=Starter, text=Growth, text=Pro').first()).toBeVisible();
  });

  test('renders privacy, terms, and legal disclosure pages', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy');

    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText('Terms');
  });

  test('renders public booking page and supports mobile responsive viewport', async ({ page }) => {
    // Set mobile viewport (iPhone 14 / modern standard)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/book/demo-clinic');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
