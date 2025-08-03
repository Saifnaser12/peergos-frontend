import { test, expect } from '@playwright/test';

test.describe('Tax Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/');
    // Assume user is already logged in for these tests
  });

  test('should calculate and file CIT return', async ({ page }) => {
    await page.click('a[href="/cit"]');
    
    // Navigate to CIT Calculator tab
    await page.click('button:has-text("Calculate CIT")');
    
    // Fill CIT calculation form
    await page.fill('input[placeholder="0.00"]:nth-of-type(1)', '1200000'); // Revenue
    await page.fill('input[placeholder="0.00"]:nth-of-type(2)', '800000');  // Expenses
    
    await page.click('button:has-text("Calculate")');
    
    // Verify calculation results
    await expect(page.locator('text=Net Income:')).toBeVisible();
    await expect(page.locator('text=AED 400,000')).toBeVisible(); // 1.2M - 800K
    
    // Expected CIT: (400,000 - 375,000) * 9% = 2,250
    await expect(page.locator('text=AED 2,250')).toBeVisible();
    
    // Navigate to filing
    await page.click('button:has-text("File Return")');
    
    // Complete filing form
    await page.fill('input[name="taxPeriod"]', '2024');
    await page.selectOption('select[name="filingStatus"]', 'final');
    
    await page.click('button:has-text("Submit to FTA")');
    
    // Verify submission
    await expect(page.locator('text=CIT return submitted successfully')).toBeVisible();
  });

  test('should calculate and submit VAT return', async ({ page }) => {
    await page.click('a[href="/vat"]');
    
    // Navigate to VAT Calculator tab
    await page.click('button:has-text("Calculator")');
    
    // Fill VAT calculation form
    await page.selectOption('select[name="taxPeriod"]', 'Q1-2024');
    await page.fill('input[name="standardRatedSales"]', '500000');
    await page.fill('input[name="zeroRatedSales"]', '100000');
    await page.fill('input[name="inputVAT"]', '15000');
    await page.fill('input[name="exemptSales"]', '50000');
    
    await page.click('button:has-text("Calculate VAT")');
    
    // Verify calculations
    // Output VAT: 500,000 * 5% = 25,000
    await expect(page.locator('text=AED 25,000')).toBeVisible();
    // Net VAT: 25,000 - 15,000 = 10,000
    await expect(page.locator('text=AED 10,000')).toBeVisible();
    
    // Navigate to VAT Return tab
    await page.click('button:has-text("VAT Return")');
    
    // Submit VAT return
    await page.click('button:has-text("Submit VAT Return")');
    
    // Verify submission
    await expect(page.locator('text=VAT return submitted successfully')).toBeVisible();
  });

  test('should generate FTA-compliant invoice', async ({ page }) => {
    await page.click('a[href="/invoicing"]');
    
    // Create new invoice
    await page.click('button:has-text("Create Invoice")');
    
    // Fill invoice details
    await page.fill('input[name="supplier.name"]', 'Test Trading LLC');
    await page.fill('input[name="supplier.trn"]', '100123456789012');
    await page.fill('input[name="customer.name"]', 'Customer Company LLC');
    await page.fill('input[name="customer.trn"]', '100987654321098');
    
    // Add line item
    await page.fill('input[name="items[0].description"]', 'Consulting Services');
    await page.fill('input[name="items[0].quantity"]', '1');
    await page.fill('input[name="items[0].unitPrice"]', '10000');
    
    // Generate invoice
    await page.click('button:has-text("Generate Invoice")');
    
    // Verify invoice generation
    await expect(page.locator('text=Invoice generated successfully')).toBeVisible();
    
    // Check QR code and hash are present
    await expect(page.locator('canvas')).toBeVisible(); // QR code canvas
    await expect(page.locator('text=SHA-256')).toBeVisible(); // Hash information
    
    // Download UBL XML
    await page.click('button:has-text("Download XML")');
    
    // Verify XML download initiated
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });

  test('should handle tax agent workflow', async ({ page }) => {
    await page.click('a[href="/cit"]');
    
    // Navigate to filing
    await page.click('button:has-text("File Return")');
    
    // Enable tax agent filing
    await page.check('input[name="useTaxAgent"]');
    
    // Select tax agent
    await page.selectOption('select[name="taxAgentId"]', 'Professional Tax Consultants LLC');
    
    // Submit for agent review
    await page.click('button:has-text("Submit for Agent Review")');
    
    // Verify submission
    await expect(page.locator('text=Submitted to tax agent for review')).toBeVisible();
    
    // Check filing history
    await page.click('button:has-text("Filing History")');
    await expect(page.locator('text=Pending Agent Review')).toBeVisible();
  });
});