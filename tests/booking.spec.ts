import { test, expect } from '@playwright/test';

test.describe('Public Booking Flow', () => {
  test('successful booking flow', async ({ page }) => {
    // Navigate to public booking page for demo clinic
    await page.goto('/book/demo-clinic');
    
    // Check initial state
    await expect(page.locator('h1')).toHaveText('Book an Appointment');
    
    // Select date
    await page.getByTestId('date-picker').fill('2026-08-25');
    
    // Wait for slots (mocked in UI to return 09:00 for this date)
    const slot = page.getByTestId('slot-0');
    await slot.waitFor({ state: 'visible' });
    
    // Click slot
    await slot.click();
    
    // Fill patient info
    await expect(page.locator('h2').first()).toHaveText('Patient Information');
    await page.getByTestId('first-name').fill('John');
    await page.getByTestId('last-name').fill('Doe');
    await page.getByTestId('email').fill('john@example.com');
    await page.getByTestId('phone').fill('555-1234');
    
    // Submit
    await page.getByTestId('submit-booking').click();
    
    // Verify confirmation
    await expect(page.locator('h2').first()).toHaveText('Booking Confirmed!');
    await expect(page.locator('p').first()).toContainText('john@example.com');
  });

  test('double booking fallback (slot disappears during checkout)', async ({ page }) => {
    await page.goto('/book/demo-clinic');
    
    await page.getByTestId('date-picker').fill('2026-08-25');
    
    const slot = page.getByTestId('slot-0');
    await slot.waitFor({ state: 'visible' });
    await slot.click();
    
    // Use the name "Concurrent" to trigger our UI mock's double-booking error
    await page.getByTestId('first-name').fill('Concurrent');
    await page.getByTestId('last-name').fill('Doe');
    await page.getByTestId('email').fill('john@example.com');
    await page.getByTestId('phone').fill('555-1234');
    
    await page.getByTestId('submit-booking').click();
    
    // Verify error and regression back to step 1
    const errorMsg = page.locator('.test-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Slot is no longer available');
    
    // Should see date picker again
    await expect(page.getByTestId('date-picker')).toBeVisible();
  });
});
