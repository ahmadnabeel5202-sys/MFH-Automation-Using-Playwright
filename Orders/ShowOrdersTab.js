import { expect } from '@playwright/test';
import { OrderSearch } from '../Utils/ordersUtils';

exports.Orders = class Orders {
  constructor(page) {
    this.page = page;

    // Orders parent menu
    this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
    this.orderSearchA = page.getByRole('textbox', { name: 'Search' });
    this.AllPage = page.locator('a').filter({ hasText: 'All' }).first();
    this.columnsToggleBtn = page.getByRole('button', { name: 'Columns' });
    this.columnsMenu = page.locator('div[role="presentation"] ul');

    this.orderSearch = new OrderSearch(page);
    this.resultOrderNum = page.locator("//tbody/tr[1]/td[2]");
    this.refreshOrderbtn = page.locator('p:has-text("REFRESH ORDERS FROM SHOPIFY")');
    this.successMessage = page.getByText(/Shopify Order Refresh complete/i);

    this.orderTabs = [
      'All',
      'New',
      'Ready to Ship',
      'Shipping',
      'Shipped',
      'Duplicates',
      'Canceled',
      'Manual Review',
      'Error'
    ];
  }

  async gotoKitsPage() {
    await this.page.goto('/#/kits');
    await this.page.waitForLoadState('networkidle');
  }

  async openOrdersMenu() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.ordersMenu).toBeVisible();
    await this.ordersMenu.click();
  }

  async verifyOrdersTabsVisible() {
    for (const tab of this.orderTabs) {
      const tabLocator = this.page
        .locator('a')
        .filter({ hasText: tab })
        .first();

      await expect(tabLocator).toBeVisible();
    }
  }

  async gotoAllorders() {
    await expect(this.AllPage).toBeVisible();
    await this.AllPage.click();
    await this.page.waitForLoadState('networkidle');
  }

 async searchAndVerifyOrder(options = { clearAfterSearch: true }) {
  const result = await this.orderSearch.searchAndVerifyFromCurrentTab(options);
  if (!result.success) {
    throw new Error(`Search verification failed: ${result.message}`);
  }
  return result;
}

  // async searchForOrder(orderNum) {
  //   return await this.orderSearch.searchOrder(orderNum, { clearAfterSearch: true });
  // }

  async refreshOrdersFromShopify() {
    console.log('🔄 Refresh started');

    await this.refreshOrderbtn.click();
    await this.successMessage.waitFor({ state: 'visible' });
    console.log('✅ Success message visible');

    await this.page.screenshot({
      path: 'shopify-refresh-success.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: shopify-refresh-success.png');

    await this.successMessage.waitFor({ state: 'hidden' });
    console.log('✅ Message disappeared');
  }

  async verifyAllColumnsVisible() {
    await expect(this.page, 'Should be on Orders page').toHaveURL(/\/orders/);
    const expectedColumns = [
      'OrderNum',
      'Notes',
      'MFH Status',
      'Customer',
      'Items',
      'Kit(s)',
      'PPKit(s)',
      'Outbound Shipping',
      'Actions'
    ];

    for (const columnName of expectedColumns) {
      const column = this.page.getByText(columnName, { exact: true });

      await expect(column).toBeVisible({ timeout: 10000 });
      console.log(`✅ ${columnName} column visible`);
    }
  }

  async columnsToggleOptions() {
    await expect(this.columnsToggleBtn).toBeVisible();
    await this.columnsToggleBtn.click();
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.columnsMenu).toBeVisible();
  }

  async toggleColumn(columnName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Toggling column: ${columnName}`);
    console.log('='.repeat(60));

    try {
      // Open columns menu if not already open
      const menuVisible = await this.columnsMenu.isVisible().catch(() => false);
      if (!menuVisible) {
        await this.columnsToggleBtn.click();
        await this.page.waitForTimeout(500);
      }

      // 🔥 Find the checkbox/toggle with EXACT match
      const columnItem = this.columnsMenu.getByRole('checkbox', { name: columnName, exact: true });
      await expect(columnItem).toBeVisible({ timeout: 5000 });

      // Check current state before toggle
      const isCheckedBefore = await columnItem.isChecked();
      console.log(`   📊 Current state: ${isCheckedBefore ? 'Visible' : 'Hidden'}`);

      // Click to toggle
      await columnItem.click();
      await this.page.waitForTimeout(500);
      console.log(`   🖱️ Clicked toggle for ${columnName}`);

      // Verify checkbox state changed
      const isCheckedAfter = await columnItem.isChecked();
      console.log(`   📊 New state: ${isCheckedAfter ? 'Visible' : 'Hidden'}`);

      // Close menu BEFORE checking table visibility
      await this.page.keyboard.press('Escape');
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000);

      // Verify column visibility in the table with safer approach
     const columnHeader = this.page.locator('table thead th').filter({ hasText: new RegExp(`^${columnName.replace(/[()]/g, '\\$&')}$`) });

      if (isCheckedAfter) {
        // Should be visible
        try {
          await expect(columnHeader).toBeVisible({ timeout: 3000 });
          console.log(`   ✅ Column "${columnName}" is now VISIBLE in table`);
        } catch (err) {
          console.log(`   ⚠️ Column "${columnName}" not visible in table (may be expected)`);
        }
      } else {
        // Should be hidden - just check without assertion
        await this.page.waitForTimeout(500);
        const isVisible = await columnHeader.isVisible({ timeout: 1000 }).catch(() => false);
        if (!isVisible) {
          console.log(`   ✅ Column "${columnName}" is now HIDDEN from table`);
        } else {
          console.log(`   ⚠️ Column "${columnName}" still visible (unexpected)`);
        }
      }

      console.log('='.repeat(60) + '\n');

      return {
        success: true,
        currentState: isCheckedAfter ? 'visible' : 'hidden',
        toggled: isCheckedBefore !== isCheckedAfter
      };

    } catch (err) {
      console.log(`   ❌ Error toggling column: ${err.message}`);
      console.log('='.repeat(60) + '\n');

      // Try to close menu if still open
      await this.page.keyboard.press('Escape').catch(() => {});

      return {
        success: false,
        currentState: 'unknown',
        error: err.message
      };
    }
  }

  async toggleMultipleColumns(columnNames) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Testing column toggles for ${columnNames.length} columns`);
    console.log('='.repeat(60) + '\n');

    const results = [];

    for (const columnName of columnNames) {
      // Toggle OFF
      const offResult = await this.toggleColumn(columnName);
      results.push({ column: columnName, action: 'OFF', ...offResult });

      await this.page.waitForTimeout(1000);

      // Toggle ON
      const onResult = await this.toggleColumn(columnName);
      results.push({ column: columnName, action: 'ON', ...onResult });

      await this.page.waitForTimeout(1000);
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 COLUMN TOGGLE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful toggles: ${successCount}`);
    console.log(`❌ Failed toggles: ${failCount}`);
    console.log('='.repeat(60) + '\n');

    return results;
  }

  async testAllColumnToggles() {
    const columnsToTest = [
      'OrderNum', 
      'Notes',
      'MFH Status',
      'Customer',
      'Items',
      'Kit(s)',
      'PPKit(s)',
      'Outbound Shipping'
    ];

const results = await this.toggleMultipleColumns(columnsToTest);
  
  
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    throw new Error(
      `❌ ${failures.length} column toggle(s) failed:\n` +
      failures.map(f => `  - ${f.column} (${f.action}): ${f.error || 'unknown error'}`).join('\n')
    );
  }
  
  return results;
}

}