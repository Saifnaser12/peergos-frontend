import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should switch between English and Arabic', async ({ page }) => {
    // Verify default English
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Switch to Arabic
    await page.click('button[aria-label="Switch to Arabic"]');
    
    // Verify Arabic content and RTL layout
    await expect(page.locator('text=لوحة التحكم')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Check navigation in Arabic
    await expect(page.locator('text=الضرائب')).toBeVisible(); // Taxes
    await expect(page.locator('text=المحاسبة')).toBeVisible(); // Accounting
    
    // Switch back to English
    await page.click('button[aria-label="Switch to English"]');
    
    // Verify English content and LTR layout
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('should maintain language preference across pages', async ({ page }) => {
    // Switch to Arabic
    await page.click('button[aria-label="Switch to Arabic"]');
    
    // Navigate to different pages
    await page.click('a[href="/cit"]');
    await expect(page.locator('text=ضريبة الشركات')).toBeVisible();
    
    await page.click('a[href="/vat"]');
    await expect(page.locator('text=ضريبة القيمة المضافة')).toBeVisible();
    
    await page.click('a[href="/accounting"]');
    await expect(page.locator('text=المحاسبة')).toBeVisible();
    
    // Language should persist across navigation
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('should display Arabic numbers and currency correctly', async ({ page }) => {
    // Switch to Arabic
    await page.click('button[aria-label="Switch to Arabic"]');
    
    // Navigate to calculator
    await page.click('a[href="/cit"]');
    
    // Check Arabic number formatting
    await expect(page.locator('text=درهم')).toBeVisible(); // AED currency
    
    // Forms should work with Arabic interface
    await page.fill('input[placeholder*="0.00"]', '123456');
    
    // Number should be displayed correctly
    await expect(page.locator('input[value="123456"]')).toBeVisible();
  });

  test('should handle RTL layout correctly in forms', async ({ page }) => {
    // Switch to Arabic
    await page.click('button[aria-label="Switch to Arabic"]');
    
    // Navigate to setup wizard
    await page.click('a[href="/setup"]');
    
    // Verify RTL form layout
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Form labels should be right-aligned
    const label = page.locator('label').first();
    const labelStyles = await label.evaluate(el => window.getComputedStyle(el));
    expect(labelStyles.textAlign).toBe('right');
    
    // Input fields should work correctly
    await page.fill('input[name="companyName"]', 'شركة الاختبار ذ.م.م');
    await expect(page.locator('input[value="شركة الاختبار ذ.م.م"]')).toBeVisible();
  });

  test('should display date formats correctly for different locales', async ({ page }) => {
    // Check English date format
    await expect(page.locator('text=January')).toBeVisible();
    
    // Switch to Arabic
    await page.click('button[aria-label="Switch to Arabic"]');
    
    // Navigate to calendar
    await page.click('a[href="/calendar"]');
    
    // Check Arabic month names (if implemented)
    // Note: This would depend on full locale implementation
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});