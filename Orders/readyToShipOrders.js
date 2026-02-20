import { expect } from '@playwright/test';

exports.readyToShipOrders = class readyToShipOrders {
  constructor(page) {
    this.page = page;

    // 🔹 Locators
    this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
    this.orderSearch = page.getByRole('textbox', { name: 'Search' });
    this.NewOrders = page.locator('a').filter({ hasText: 'New' }).first();
    this.readyToShipTab = page.locator('a').filter({ hasText: 'Ready to Ship' }).first();
    this.kitsMenu = page.locator('li').filter({ hasText: 'Kits' }).first();

    this.allRows = page.locator('tbody tr');
    this.mfhStatusBadges = page.locator('td .MuiChip-root, td:nth-child(4)');
    this.successToast = page.locator('div[role="alert"], .MuiAlert-root, .toast-success');
  }

  async gotokitsPage() {
    await this.page.goto('/#/kits');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoReadyToShipOrders() {
    await expect(this.ordersMenu).toBeVisible();
    await this.ordersMenu.click();

    await expect(this.readyToShipTab).toBeVisible();
    await this.readyToShipTab.click();

    console.log('✅ Navigated to Ready to Ship orders\n');
  }

  async validateKitsAssignedReadyToShipStatus() {
    console.log('🔍 Validating MFH Status: kitsAssignedReadyToShip\n');

    await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });

    const totalRows = await this.allRows.count();
    const invalidOrders = [];

    for (let i = 0; i < totalRows; i++) {
      const row = this.allRows.nth(i);
      const orderNum = await row.locator('td').nth(1).textContent();
      const mfhStatus = await row.locator('td').nth(3).textContent();

      if (mfhStatus.trim() !== 'kitsAssignedReadyToShip') {
        invalidOrders.push({
          orderNum: orderNum.trim(),
          status: mfhStatus.trim()
        });
      }
    }

    console.log('='.repeat(60));
    console.log(`📊 Total Rows: ${totalRows}`);
    console.log(`✅ Valid Rows: ${totalRows - invalidOrders.length}`);
    console.log(`❌ Invalid Rows: ${invalidOrders.length}`);
    console.log('='.repeat(60));

    if (invalidOrders.length > 0) {
      console.log('\n⚠️ Orders with incorrect status:');
      invalidOrders.forEach(order => {
        console.log(`   Order #${order.orderNum} - Status: "${order.status}"`);
      });
      console.log('');
    } else {
      console.log('\n✅ All orders have correct status!\n');
    }

    return { totalRows, invalidOrders };
  }

  // 🔹 Late fix for prepaid kit id detection
  async hasPrePaidKitID(rowIndex) {
    try {
      const row = this.allRows.nth(rowIndex);
      const itemsColumn = row.locator('td').nth(5);
      const text = (await itemsColumn.innerText()).replace(/\s+/g, ' ');

      console.log(`   📋 Items Column Data: ${text.substring(0, 120)}...`);

      const match = text.match(/PrePaid\s*KitID\s*(\d+)/i);

      if (match) {
        console.log(`   ✅ PrePaid KitID FOUND: ${match[1]}`);
        return true;
      }

      console.log(`   ❌ PrePaid KitID NOT found`);
      return false;

    } catch (err) {
      console.log(`   ⚠️ Error checking PrePaid KitID: ${err.message}`);
      return false;
    }
  }

  async createShippingLabelsForFirstTwoOrders() {
    console.log('📦 Creating shipping labels for first 2 orders WITHOUT PrePaid KitID...\n');

    await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });

    const totalRows = await this.allRows.count();
    const results = [];
    let processedCount = 0;

    for (let i = 0; i < totalRows && processedCount < 2; i++) {
      const row = this.allRows.nth(i);

      const orderNum = await row.locator('td').nth(1).textContent();
      const orderNumber = orderNum?.trim();

      console.log('='.repeat(50));
      console.log(`Checking Order - Order #${orderNumber}`);
      console.log('='.repeat(50));

      const hasKitID = await this.hasPrePaidKitID(i);

      if (hasKitID) {
        console.log(`⏭️ SKIPPING - Order #${orderNumber} has PrePaid KitID\n`);
        continue;
      }

      console.log(`✅ Order #${orderNumber} - No PrePaid KitID, proceeding...`);

      // 🔹 CREATE SHIPPING LABELS button (row scoped)
      const actionsCell = row.locator('td').last();
      const createLabelBtn = actionsCell.getByRole('button', {
        name: /create shipping labels/i
      });

      const isVisible = await createLabelBtn.isVisible().catch(() => false);

      if (!isVisible) {
        console.log('⚠️ CREATE SHIPPING LABELS button not visible\n');
        results.push({
          orderNumber,
          successMessage: 'Button not visible',
          outboundCreated: false,
          inboundCreated: false,
          success: false
        });
        processedCount++;
        continue;
      }

      await createLabelBtn.click();
      console.log('🖱️ Clicked CREATE SHIPPING LABELS');

      // ✅ Correct async wait (NOT networkidle)
      const successMessage = await this.waitForShippingLabelsReady();
      const verification = this.verifyLabelsCreated(successMessage);

      results.push({
        orderNumber,
        successMessage,
        outboundCreated: verification.outboundCreated,
        inboundCreated: verification.inboundCreated,
        success: verification.bothCreated
      });

      processedCount++;
      console.log('');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SHIPPING LABELS CREATION SUMMARY');
    console.log('='.repeat(60));

    results.forEach((result, index) => {
      console.log(`Order ${index + 1} - #${result.orderNumber}:`);
      console.log(`   ✅ Outbound Label: ${result.outboundCreated ? 'Created' : 'NOT Created'}`);
      console.log(`   ✅ Inbound Label: ${result.inboundCreated ? 'Created' : 'NOT Created'}`);
      console.log(`   📋 Message:\n${result.successMessage}`);
      console.log('');
    });

    const allSuccess = results.every(r => r.success);
    console.log(allSuccess
      ? '✅ All shipping labels created successfully!\n'
      : '⚠️ Some labels may not have been created\n'
    );

    return results;
  }

  // 🔹 Proper async wait for backend processing
  async waitForShippingLabelsReady() {
    try {
      await expect.poll(
        async () => {
          const text = await this.successToast.first().textContent().catch(() => '');
          return text?.toLowerCase();
        },
        { timeout: 20000 }
      ).toSatisfy(text =>
        text.includes('ready to print') &&
        text.includes('shipping label')
      );

      const finalMessage = await this.successToast.first().textContent();
      console.log('✅ Shipping labels are ready to print');
      return finalMessage.trim();

    } catch {
      console.log('❌ Shipping labels did not become ready in time');
      return '';
    }
  }

  verifyLabelsCreated(message) {
    const outboundCreated = /outbound.*ready to print/i.test(message);
    const inboundCreated = /inbound.*ready to print/i.test(message);

    console.log(`   ✅ Outbound Label: ${outboundCreated ? 'Verified' : 'NOT Verified'}`);
    console.log(`   ✅ Inbound Label: ${inboundCreated ? 'Verified' : 'NOT Verified'}`);

    return {
      outboundCreated,
      inboundCreated,
      bothCreated: outboundCreated && inboundCreated
    };
  }
};
