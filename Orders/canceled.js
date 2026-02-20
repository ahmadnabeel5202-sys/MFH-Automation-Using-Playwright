import { expect } from '@playwright/test';

exports.CanceledOrders = class CanceledOrders {
  constructor(page) {
    this.page = page;
    this.currentOrderNum = null; // Store the current order number for use across methods

    this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
    this.orderSearch = page.getByRole('textbox', { name: 'Search' });
    this.NewOrders = page.locator('a').filter({ hasText: 'New' }).first();
    this.manualReviewbtn = page.locator('p:has-text("MANUAL REVIEW")').nth(0);
    this.Row1OrderNum = page.locator("//tbody/tr[1]/td[2]");
    this.columnsToggleBtn = page.getByRole('button', { name: 'Columns' });
    this.columnsMenu = page.locator('div[role="presentation"] ul');
    this.canceledTab = page.getByRole('menuitem', { name: 'Canceled' });
  }

  async gotokitsPage() {
    await this.page.goto('/#/kits');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoOrdersMenu() {
    await expect(this.ordersMenu).toBeVisible();
    await this.ordersMenu.click();
    await this.page.waitForLoadState('networkidle');
  }

  async gotoCanceledOrders() {
    await expect(this.canceledTab).toBeVisible();
    await this.canceledTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState("domcontentloaded");
  }

  async columnsToggleOptions() {
    await expect(this.columnsToggleBtn).toBeVisible();
    await this.columnsToggleBtn.click();
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.columnsMenu).toBeVisible();
  }

  async validateOnlyCanceledStatusInMFHColumn() {
    // await expect(this.canceledTab).toBeVisible();
    // await this.canceledTab.click();
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");

    await expect(this.page.locator('table tbody tr').first()).toBeVisible();
    await expect(this.page.locator('td .MuiChip-root').first()).toBeVisible();

    // All MFH status badges
    const statusBadges = this.page.locator('td .MuiChip-root');
    const count = await statusBadges.count();
    expect(count).toBeGreaterThan(0); // ensure rows exist

    for (let i = 0; i < count; i++) {
      const badge = statusBadges.nth(i);
      await expect(badge).toHaveText(/canceled/i);
    }
    console.log(`✅ MFH Status validation completed. Rows checked: ${count}`);
  }

}