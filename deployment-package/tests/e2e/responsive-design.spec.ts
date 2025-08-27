import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should work correctly on mobile viewport (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile navigation
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
    
    // Open mobile menu
    await page.click('button[aria-label="Menu"]');
    
    // Navigation items should be visible in mobile menu
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/cit"]')).toBeVisible();
    await expect(page.locator('a[href="/vat"]')).toBeVisible();
    
    // Close menu and navigate to a page
    await page.click('a[href="/cit"]');
    
    // Content should be responsive
    const mainContent = page.locator('main');
    const boundingBox = await mainContent.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('should adapt setup wizard for mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/setup');
    
    // Progress indicator should be mobile-friendly
    await expect(page.locator('[data-testid="setup-progress"]')).toBeVisible();
    
    // Forms should stack vertically on mobile
    const form = page.locator('form');
    const formStyles = await form.evaluate(el => window.getComputedStyle(el));
    expect(formStyles.flexDirection).toBe('column');
    
    // Buttons should be full-width on mobile
    const nextButton = page.locator('button:has-text("Next")');
    const buttonBox = await nextButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThan(300); // Nearly full width
  });

  test('should handle tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    
    // Should show sidebar navigation on tablet
    await expect(page.locator('nav[aria-label="Sidebar"]')).toBeVisible();
    
    // Cards should adapt to tablet layout
    const cards = page.locator('[data-testid="kpi-card"]');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // Cards should be arranged in rows appropriate for tablet
      const firstCard = cards.first();
      const cardBox = await firstCard.boundingBox();
      expect(cardBox?.width).toBeLessThan(400); // Not full width, but not tiny
    }
  });

  test('should maintain functionality on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1200, height: 800 }, // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/cit');
      
      // Calculator should work on all screen sizes
      await page.fill('input[placeholder="0.00"]:first-child', '500000');
      await page.fill('input[placeholder="0.00"]:nth-child(2)', '300000');
      
      await page.click('button:has-text("Calculate")');
      
      // Results should be visible
      await expect(page.locator('text=Net Income')).toBeVisible();
      
      // Touch targets should be at least 44px on mobile
      if (viewport.width <= 375) {
        const button = page.locator('button:has-text("Calculate")');
        const buttonBox = await button.boundingBox();
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should handle text scaling and zoom', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Simulate zoom to 150%
    await page.evaluate(() => {
      document.body.style.zoom = '1.5';
    });
    
    // Content should remain accessible and not overflow
    const main = page.locator('main');
    const viewport = page.viewportSize();
    const mainBox = await main.boundingBox();
    
    if (viewport && mainBox) {
      expect(mainBox.width).toBeLessThanOrEqual(viewport.width);
    }
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });

  test('should provide proper touch interaction on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/setup');
    
    // Touch targets should be large enough
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();
      
      if (isVisible) {
        const boundingBox = await button.boundingBox();
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});