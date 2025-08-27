import { test, expect } from '@playwright/test';

test.describe('Setup Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to setup page
    await page.goto('/setup');
  });

  test('should complete mainland business setup flow', async ({ page }) => {
    // Step 1: Business Information
    await expect(page.locator('h2')).toContainText('Business Information');
    
    await page.fill('input[name="companyName"]', 'Test Trading LLC');
    await page.fill('input[name="tradeLicenseNumber"]', 'CN-123456789');
    await page.selectOption('select[name="emirate"]', 'Dubai');
    await page.fill('input[name="businessActivity"]', 'General Trading');
    await page.fill('input[name="establishmentDate"]', '2024-01-15');
    
    await page.click('button:has-text("Next")');

    // Step 2: Revenue Declaration
    await expect(page.locator('h2')).toContainText('Revenue Declaration');
    
    await page.fill('input[name="expectedAnnualRevenue"]', '800000');
    await page.selectOption('select[name="businessModel"]', 'B2B');
    
    // No international sales path
    await expect(page.locator('input[name="hasInternationalSales"]')).not.toBeChecked();
    
    await page.click('button:has-text("Next")');

    // Step 3: Free Zone & License
    await expect(page.locator('h2')).toContainText('Free Zone & License');
    
    // Select Mainland
    await page.check('input[value="Mainland"]');
    await page.fill('input[name="licenseNumber"]', 'CN-987654321');
    await page.fill('input[name="licenseIssueDate"]', '2024-01-15');
    await page.fill('input[name="licenseExpiryDate"]', '2025-01-14');
    
    await page.click('button:has-text("Next")');

    // Step 4: TRN Upload
    await expect(page.locator('h2')).toContainText('TRN & Tax Registration');
    
    await page.check('input[name="hasTRN"]');
    await page.fill('input[name="trnNumber"]', '100123456789012');
    await page.fill('input[name="vatRegistrationDate"]', '2024-02-01');
    
    await page.check('input[name="citRegistrationRequired"]');
    await page.fill('input[name="citRegistrationDate"]', '2024-02-01');
    
    await page.click('button:has-text("Next")');

    // Step 5: Summary & Review
    await expect(page.locator('h2')).toContainText('Summary & Review');
    
    // Verify business information is displayed
    await expect(page.locator('text=Test Trading LLC')).toBeVisible();
    await expect(page.locator('text=CN-123456789')).toBeVisible();
    
    // Complete final configuration
    await page.fill('input[name="confirmFinancialYearEnd"]', '2024-12-31');
    await page.check('input[name="agreeToTerms"]');
    
    await expect(page.locator('text=Setup Complete')).toBeVisible();
    
    // Submit setup
    await page.click('button:has-text("Complete Setup")');
    
    // Should redirect to dashboard
    await expect(page.url()).toContain('/dashboard');
  });

  test('should complete free zone QFZP setup flow', async ({ page }) => {
    // Step 1: Business Information
    await page.fill('input[name="companyName"]', 'DIFC Trading FZE');
    await page.fill('input[name="tradeLicenseNumber"]', 'DIFC-123456');
    await page.selectOption('select[name="emirate"]', 'Dubai');
    await page.fill('input[name="businessActivity"]', 'Financial Services');
    await page.fill('input[name="establishmentDate"]', '2024-01-15');
    
    await page.click('button:has-text("Next")');

    // Step 2: Revenue Declaration with international sales
    await page.fill('input[name="expectedAnnualRevenue"]', '2500000');
    await page.selectOption('select[name="businessModel"]', 'MIXED');
    
    // Enable international sales
    await page.check('input[name="hasInternationalSales"]');
    await page.fill('input[name="internationalSalesPercentage"]', '40');
    await page.selectOption('select[name="mainExportMarkets"]', 'GCC');
    
    await page.click('button:has-text("Next")');

    // Step 3: Free Zone & License with QFZP
    await page.check('input[value="FreeZone"]');
    await page.selectOption('select[name="freeZoneName"]', 'DIFC');
    await page.fill('input[name="licenseNumber"]', 'DIFC-789012');
    await page.fill('input[name="licenseIssueDate"]', '2024-01-15');
    await page.fill('input[name="licenseExpiryDate"]', '2025-01-14');
    
    // Enable QFZP
    await page.check('input[name="isQFZP"]');
    
    await page.click('button:has-text("Next")');

    // Step 4: TRN Upload
    await page.check('input[name="hasTRN"]');
    await page.fill('input[name="trnNumber"]', '100987654321098');
    await page.fill('input[name="vatRegistrationDate"]', '2024-02-01');
    
    await page.check('input[name="citRegistrationRequired"]');
    await page.fill('input[name="citRegistrationDate"]', '2024-02-01');
    
    // Appoint tax agent
    await page.check('input[name="taxAgentAppointed"]');
    await page.fill('input[name="taxAgentName"]', 'Professional Tax Consultants LLC');
    await page.fill('input[name="taxAgentLicense"]', 'TA-56789');
    
    await page.click('button:has-text("Next")');

    // Step 5: Summary & Review
    await expect(page.locator('text=DIFC Trading FZE')).toBeVisible();
    await expect(page.locator('text=QFZP')).toBeVisible();
    await expect(page.locator('text=0% CIT')).toBeVisible(); // QFZP benefit
    
    await page.fill('input[name="confirmFinancialYearEnd"]', '2024-12-31');
    await page.check('input[name="agreeToTerms"]');
    
    await page.click('button:has-text("Complete Setup")');
    
    await expect(page.url()).toContain('/dashboard');
  });

  test('should validate required fields and prevent progression', async ({ page }) => {
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');
    
    // Should show validation errors and stay on step 1
    await expect(page.locator('text=Company name is required')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Business Information');
  });

  test('should save and restore progress', async ({ page }) => {
    // Fill step 1
    await page.fill('input[name="companyName"]', 'Progress Test LLC');
    await page.fill('input[name="tradeLicenseNumber"]', 'CN-555666');
    await page.selectOption('select[name="emirate"]', 'Abu Dhabi');
    await page.fill('input[name="businessActivity"]', 'Consulting');
    await page.fill('input[name="establishmentDate"]', '2024-01-15');
    
    await page.click('button:has-text("Next")');
    
    // Fill step 2
    await page.fill('input[name="expectedAnnualRevenue"]', '450000');
    await page.selectOption('select[name="businessModel"]', 'B2C');
    
    // Refresh page to test persistence
    await page.reload();
    
    // Should be on step 2 with data preserved
    await expect(page.locator('h2')).toContainText('Revenue Declaration');
    await expect(page.locator('input[name="expectedAnnualRevenue"]')).toHaveValue('450000');
  });
});