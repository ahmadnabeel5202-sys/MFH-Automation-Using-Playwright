import { expect } from '@playwright/test';

exports.NewOrders= class NewOrders {
     constructor(page) {
    this.page = page;
    this.currentOrderNum = null; // Store the current order number for use across methods

    this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
    this.orderSearch = page.getByRole('textbox', { name: 'Search' });
    this.NewOrders = page.locator('a').filter({ hasText: 'New' }).first();
    this.Assignkitsbtn= page.locator('p:has-text("ASSIGN KITS")').nth(0);//Assign kits for 1st kit
    this.manualReviewbtn= page.locator('p:has-text("MANUAL REVIEW")').nth(0)//Manual Review -- for 1st kit
    this.Row1OrderNum =page.locator("//tbody/tr[1]/td[2]");
    this.columnsToggleBtn= page.getByRole('button', { name: 'Columns' });
    this.columnsMenu = page.locator('div[role="presentation"] ul');

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
     async gotoNewOrders(){
      await expect(this.NewOrders).toBeVisible();
      await this.NewOrders.click();
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForLoadState("domcontentloaded");
     }
     async columnsToggleOptions(){
      await expect(this.columnsToggleBtn).toBeVisible();
      await this.columnsToggleBtn.click();



     }

    async validateOnlyNewStatusInMFHColumn() {

      await expect(this.NewOrders).toBeVisible();
      await this.NewOrders.click();
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

        // ✅ Text validation
        await expect(badge).toHaveText(/new/i);
      }
       console.log(`✅ MFH Status validation completed. Rows checked: ${count}`);
    }

    async getFirstOrderNumber() {
    const orderNum = await this.Row1OrderNum.textContent();
    console.log(`First Row order num is : ${orderNum}`);
    return orderNum?.trim(); // remove extra spaces

  }
async markasManualReview(note = '') {
  const orderNum = (await this.getFirstOrderNumber()) || '<unknown>';
  this.currentOrderNum = orderNum; // Store the order number for use in other methods
  console.log(`Starting Manual Review for order: ${orderNum}`);
  
  // Set up handler for native browser dialog (prompt/alert/confirm)
  this.page.once('dialog', async dialog => {
    console.log(`Dialog type: ${dialog.type()}`);
    console.log(`Dialog message: ${dialog.message()}`);
    
    if (dialog.type() === 'prompt') {
      // If it's a prompt dialog, accept it with the note
      await dialog.accept(note || '');
      console.log(`✅ Accepted prompt with note: "${note || '(blank)'}"`);
    } else {
      // For alert or confirm dialogs
      await dialog.accept();
      console.log(`✅ Accepted ${dialog.type()} dialog`);
    }
  });
  
  // Find the first row's Manual Review button within that specific row
  const firstRow = this.page.locator('tbody tr').first();
  const manualReviewBtn = firstRow.locator('p:has-text("MANUAL REVIEW")').first();
  await manualReviewBtn.click();
  console.log('✅ Clicked Manual Review button');
  
  // Wait for the dialog to be handled and any network requests to complete
  await this.page.waitForLoadState('networkidle');
  
  console.log(`✅ Order ${orderNum} marked for Manual Review`);
  return orderNum;
};

async checkOrderStatusinManualReview() {

  const orderNum = this.currentOrderNum || (await this.getFirstOrderNumber()) || '<unknown>';
  console.log(`Checking status for order: ${orderNum}`);
  this.currentOrderNum = orderNum; // Keep it current in case it's needed elsewhere
  
  // Navigate to Manual Review tab
  const manualReviewTab = this.page.locator('a').filter({ hasText: 'Manual Review' }).first();
  await manualReviewTab.click();
  await this.page.waitForLoadState('networkidle');
  
  // Wait for the search field in Manual Review tab to be ready
  await expect(this.orderSearch).toBeVisible();
  
  // Search for the order
  await this.orderSearch.click();
  await this.orderSearch.clear();
  await this.orderSearch.fill(orderNum);
  await this.page.waitForLoadState('networkidle');
  
  // Wait for the specific order row to appear after search
  const orderRow = this.page.locator(`tbody tr:has-text("${orderNum}")`).first();
  await orderRow.waitFor({ state: 'visible' });
  
  console.log(`✅ Order ${orderNum} found in Manual Review (visible row)`);

  // Get all columns in the row to find the actions column
  const rowCells = orderRow.first().locator('td');
  const cellCount = await rowCells.count();
  console.log(`Total columns in row: ${cellCount}`);
  
  // Log all cell contents to find the correct column
  for (let i = 0; i < cellCount; i++) {
    const cellText = await rowCells.nth(i).innerText();
    console.log(`Column ${i}: ${cellText}`);
  }

  // Find the actions column by looking for button/text content
  const actionsColumn = orderRow.first().locator('td').last(); // Try last column for actions
  const actionsText = await actionsColumn.innerText();
  console.log(`Actions column text: ${actionsText}`);

  // Validate expected actions
  const expectedActions = ['ERROR', 'CANCEL', 'REVERT TO NEW'];
  const actualActions = actionsText.split('\n').map(a => a.trim()).filter(Boolean);

  const missingActions = expectedActions.filter(a => !actualActions.includes(a));
  const extraActions = actualActions.filter(a => !expectedActions.includes(a));

  if (missingActions.length || extraActions.length) {
    throw new Error(
      `Actions column mismatch for order ${orderNum}\nMissing: ${missingActions}\nExtra: ${extraActions}`
    );
  }

  console.log(`✅ Actions column contains exactly the expected options for order ${orderNum}`);

}

};