import { expect } from '@playwright/test';

exports.readyToShipOrders = class readyToShipOrders {
        constructor(page) {
        this.page = page;
        // Locators


    this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
    this.orderSearch = page.getByRole('textbox', { name: 'Search' });
    this.NewOrders = page.locator('a').filter({ hasText: 'New' }).first();
    this.readyToShipTab = page.locator('a').filter({ hasText: 'Ready to Ship' }).first();
    this.kitsMenu = page.locator('li').filter({ hasText: 'Kits' }).first();
    this.allRows = page.locator('tbody tr');
    this.mfhStatusBadges = page.locator('td .MuiChip-root, td:nth-child(4)'); // MFH Status column
    this.successToast = page.locator('div[role="alert"], .MuiAlert-root, .toast-success');

  }
   async gotokitsPage() {
      await this.page.goto('/#/kits');
      await this.page.waitForLoadState('networkidle');
     }


   async gotoReadyToShipOrders() {
    await expect(this.ordersMenu).toBeVisible();
    await this.ordersMenu.click();
    await this.page.waitForLoadState('networkidle');
    
    await expect(this.readyToShipTab).toBeVisible();
    await this.readyToShipTab.click();
    await this.page.waitForLoadState('networkidle');
    
    console.log('✅ Navigated to Ready to Ship orders\n');
  }

  async validateKitsAssignedReadyToShipStatus() {
    console.log('🔍 Validating MFH Status: kitsAssignedReadyToShip\n');
    
    await this.page.waitForLoadState('networkidle');
    await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });
    
    const totalRows = await this.allRows.count();
    const invalidOrders = [];
    
    // Check each row
    for (let i = 0; i < totalRows; i++) {
      const row = this.allRows.nth(i);
      const orderNum = await row.locator('td').nth(1).textContent();
      const mfhStatus = await row.locator('td').nth(3).textContent();
      
      if (mfhStatus.trim() !== 'kitsAssignedReadyToShip') {
        invalidOrders.push({ orderNum: orderNum.trim(), status: mfhStatus.trim() });
      }
    }
    
    // Display results
    console.log('='.repeat(60));
    console.log(`📊 Total Rows: ${totalRows}`);
    console.log(`✅ Valid Rows: ${totalRows - invalidOrders.length}`);
    console.log(`❌ Invalid Rows: ${invalidOrders.length}`);
    console.log('='.repeat(60));
    
    if (invalidOrders.length > 0) {
      console.log('\n⚠️  Orders with incorrect status:');
      invalidOrders.forEach(order => {
        console.log(`   Order #${order.orderNum} - Status: "${order.status}"`);
      });
      console.log('');
    } else {
      console.log('\n✅ All orders have correct status!\n');
    }
    
    return { totalRows, invalidOrders };
  }

  async createShippingLabelsForFirstTwoOrders() {
    console.log(' Creating shipping labels for first 2 orders...\n');
    
    await this.page.waitForLoadState('networkidle');
    await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });
    
    const results = [];
    
    for (let i = 0; i < 2; i++) {
      const row = this.allRows.nth(i);
      
      // Get order number
      const orderNum = await row.locator('td').nth(1).textContent();
      const orderNumber = orderNum.trim();
      
      console.log(`${'='.repeat(50)}`);
      console.log(`Processing Order ${i + 1}/2 - Order #${orderNumber}`);
      console.log(`${'='.repeat(50)}`);
      
      // Click CREATE SHIPPING LABELS button
      const createLabelBtn = row.locator('p:has-text("CREATE SHIPPING LABELS"), button:has-text("CREATE SHIPPING LABELS")').first();
      await expect(createLabelBtn).toBeVisible({ timeout: 5000 });
      await createLabelBtn.click();
      console.log('🖱️  Clicked CREATE SHIPPING LABELS');
      
      // Wait for success message
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(2000);
      
      // Capture success message
      const successMessage = await this.captureSuccessMessage();
      
      // Verify labels created
      const verification = this.verifyLabelsCreated(successMessage);
      
      results.push({
        orderNumber,
        successMessage,
        outboundCreated: verification.outboundCreated,
        inboundCreated: verification.inboundCreated,
        success: verification.bothCreated
      });
      
      console.log('');
    }
    
    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SHIPPING LABELS CREATION SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach((result, index) => {
      console.log(`Order ${index + 1} - #${result.orderNumber}:`);
      console.log(`   ✅ Outbound Label: ${result.outboundCreated ? 'Created' : 'NOT Created'}`);
      console.log(`   ✅ Inbound Label: ${result.inboundCreated ? 'Created' : 'NOT Created'}`);
      console.log(`   📋 Message: ${result.successMessage}`);
      console.log('');
    });
    
    const allSuccess = results.every(r => r.success);
    if (allSuccess) {
      console.log('✅ All shipping labels created successfully!\n');
    } else {
      console.log('❌ Some labels failed to create!\n');
    }
    
    return results;
  }

  async captureSuccessMessage() {
    try {
      await this.successToast.first().waitFor({ state: 'visible', timeout: 5000 });
      const messageText = await this.successToast.first().textContent();
      console.log(`📬 Success Message: ${messageText.trim()}`);
      return messageText.trim();
    } catch (error) {
      console.log('⚠️  No success message found');
      return '';
    }
  }

  verifyLabelsCreated(message) {
    const outboundCreated = /1\s+outbound\s+shipping\s+label/i.test(message) || 
                           /outbound.*created/i.test(message);
    const inboundCreated = /1\s+inbound\s+shipping\s+label/i.test(message) || 
                          /inbound.*created/i.test(message);
    
    console.log(`   ✅ Outbound Label: ${outboundCreated ? 'Verified' : 'NOT Verified'}`);
    console.log(`   ✅ Inbound Label: ${inboundCreated ? 'Verified' : 'NOT Verified'}`);
    
    return {
      outboundCreated,
      inboundCreated,
      bothCreated: outboundCreated && inboundCreated
    };
  }
};



    