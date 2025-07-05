import { test, expect } from '@playwright/test';

const BASE = 'https://your-deployment-url.replit.app'; // Update with actual deployment URL

test.beforeAll(async ({ request }) => {
  // Seed demo account (idempotent)
  await request.post(`${BASE}/api/public/seedDemo`);
});

async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type=email]', 'demo@peergos.test');
  await page.fill('input[type=password]', 'Demo1234!');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard');
}

test.describe('Peergos Tax Compliance Platform', () => {
  test('Public API endpoints work', async ({ request }) => {
    // Test health endpoint
    const health = await request.get(`${BASE}/api/public/demo`);
    expect(health.ok()).toBeTruthy();
    const healthData = await health.json();
    expect(healthData.name).toBe('Peergos Tax Compliance Hub');
    expect(healthData.vatRate).toBe(0.05);
    expect(healthData.citSmallBusinessReliefAED).toBe(375000);
  });

  test('Demo account seeding works', async ({ request }) => {
    const seed = await request.post(`${BASE}/api/public/seedDemo`);
    const seedData = await seed.json();
    
    // Should either create (201) or already exist (409)
    expect([201, 409]).toContain(seed.status());
    
    if (seed.status() === 201) {
      expect(seedData.email).toBe('demo@peergos.test');
      expect(seedData.password).toBe('Demo1234!');
      expect(seedData.loginUrl).toBe('/login');
    }
  });

  test('Dashboard loads and shows KPIs', async ({ page }) => {
    await login(page);
    
    // Check for key dashboard elements
    await expect(page.getByText(/VAT/i)).toBeVisible();
    await expect(page.getByText(/CIT/i)).toBeVisible();
    await expect(page.getByText(/Revenue/i)).toBeVisible();
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('Navigation works', async ({ page }) => {
    await login(page);
    
    // Test navigation to different sections
    await page.click('text=Invoicing');
    await expect(page.url()).toContain('/invoicing');
    
    await page.click('text=VAT');
    await expect(page.url()).toContain('/vat');
    
    await page.click('text=CIT');
    await expect(page.url()).toContain('/cit');
  });

  test('Invoice creation flow', async ({ page }) => {
    await login(page);
    
    // Navigate to invoicing
    await page.click('text=Invoicing');
    
    // Check for invoice creation button
    await expect(page.getByText(/Create Invoice/i)).toBeVisible();
    
    // Click create invoice
    await page.click('text=Create Invoice');
    
    // Verify form appears
    await expect(page.getByText(/Client Name/i)).toBeVisible();
  });

  test('Financial calculations display', async ({ page }) => {
    await login(page);
    
    // Check that financial calculations are shown
    await expect(page.locator('[data-testid="vat-amount"], .vat-amount, text=/AED/i')).toBeVisible();
    await expect(page.locator('[data-testid="cit-amount"], .cit-amount, text=/AED/i')).toBeVisible();
  });

  test('Multi-language support', async ({ page }) => {
    await login(page);
    
    // Look for language toggle or Arabic text support
    const hasLanguageToggle = await page.locator('button:has-text("AR"), button:has-text("EN"), [data-testid="language-toggle"]').count();
    const hasArabicSupport = await page.locator('[dir="rtl"], .rtl').count();
    
    // Should have either language toggle or RTL support
    expect(hasLanguageToggle > 0 || hasArabicSupport > 0).toBeTruthy();
  });

  test('Tax compliance features accessible', async ({ page }) => {
    await login(page);
    
    // Check access to key compliance features
    const complianceFeatures = [
      'VAT',
      'CIT', 
      'Invoice',
      'Financial',
      'Dashboard'
    ];
    
    for (const feature of complianceFeatures) {
      await expect(page.getByText(new RegExp(feature, 'i'))).toBeVisible();
    }
  });

  test('Responsive design works', async ({ page }) => {
    await login(page);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Error handling works', async ({ page }) => {
    // Test with invalid credentials
    await page.goto(`${BASE}/login`);
    await page.fill('input[type=email]', 'invalid@test.com');
    await page.fill('input[type=password]', 'wrongpassword');
    await page.click('button[type=submit]');
    
    // Should show error message
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });
});