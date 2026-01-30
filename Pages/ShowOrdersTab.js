import { expect } from '@playwright/test';

exports.Orders = class Orders {
  constructor(page) {
    this.page = page;

    // Orders parent menu
    this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
    this.orderSearch = page.getByRole('textbox', { name: 'Search' });
    this.AllPage = page.locator('a').filter({ hasText: 'All' }).first();
    //First row and Second column (OrderNum)
    this.resultOrderNum= page.locator("//tbody/tr[1]/td[2]");
    this.refreshOrderbtn=page.locator('p:has-text("REFRESH ORDERS FROM SHOPIFY")');
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
    await this.ordersMenu.click();
  }

  async verifyOrdersTabsVisible() {

    for (const tab of this.orderTabs) {
      const tabLocator = this.page
        .locator('a')
        .filter({ hasText: tab })
        .first(); // ✅ avoids strict mode

      await expect(tabLocator).toBeVisible();
        
     }
  }
  async gotoAllorders(){

    await expect(this.AllPage).toBeVisible();
    await this.AllPage.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchOrder(){

    await expect(this.orderSearch).toBeVisible();
    await this.orderSearch.click();
    await this.page.waitForLoadState('networkidle');
    await this.orderSearch.fill('23324');
    await this.page.waitForLoadState('networkidle');
    await expect(this.resultOrderNum).toBeVisible();
    await expect(this.resultOrderNum).toHaveText('23324');  // Text check after search
    await this.orderSearch.clear();
    await this.page.waitForLoadState('networkidle');
  }
async refreshOrdersFromShopify() {
     {
        console.log('🔄 Refresh started');

        // Click refresh, then wait for the success message to appear (click-first approach)
        await this.refreshOrderbtn.click();
        await this.successMessage.waitFor({ state: 'visible' });
        console.log('✅ Success message visible');

        await this.page.screenshot({
          path: 'screenshots/shopify-refresh-success.png',
          fullPage: true
        });
        console.log('📸 Screenshot saved: shopify-refresh-success.png');

        // Wait for the success message to disappear (page has settled)
        await this.successMessage.waitFor({ state: 'hidden' });
        console.log('✅ Message disappeared');
        
    } 

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


};

