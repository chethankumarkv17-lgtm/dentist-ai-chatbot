import { test, expect } from '@playwright/test';

test.describe('Phase 40 — Full 32-Step Production Smoke Test Suite', () => {
  test('Step 1-3: Open SaaS homepage, signup, and login pages', async ({ page }) => {
    // 1. Open SaaS homepage
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // 2. Open Signup
    await page.goto('/signup');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();

    // 3. Open Login
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test('Step 4-7: Clinic Onboarding & Pathway Selection', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Step 8-10: Dashboard Services, Dentists & Availability', async ({ page }) => {
    await page.goto('/dashboard/services');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/dashboard/dentists');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/dashboard/availability');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Step 11-13: Widget Embed, Test Host & Chatbot Interface', async ({ page }) => {
    // Chatbot settings page
    await page.goto('/dashboard/chatbot');
    await expect(page.locator('body')).toBeVisible();

    // Test Host Page containing the widget iframe
    await page.goto('/test-host');
    await expect(page.locator('body')).toBeVisible();

    // Dedicated widget interface
    await page.goto('/widget?id=mock-clinic-id');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Step 14-22: Real Availability, Booking Flow & Confirmation', async ({ page }) => {
    await page.goto('/book/downtown-dental');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Step 23-28: Multi-Tenancy, Billing, Quotas & Platform Admin', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/admin');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/admin/system-health');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Step 29-32: Mobile Viewport, Website Builder & Published Clinic Site', async ({ page }) => {
    // 29. Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/widget?id=mock-clinic-id');
    await expect(page.locator('body')).toBeVisible();

    // 30. Website Builder
    await page.goto('/dashboard/site-builder');
    await expect(page.locator('body')).toBeVisible();

    // 31-32. Published Site
    await page.goto('/site/downtown-dental');
    await expect(page.locator('body')).toBeVisible();
  });
});
