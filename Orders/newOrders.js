import { expect } from '@playwright/test';

exports.NewOrders = class NewOrders {
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

  async gotoNewOrders() {
    await expect(this.NewOrders).toBeVisible();
    await this.NewOrders.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState("domcontentloaded");
  }

  async columnsToggleOptions() {
    await expect(this.columnsToggleBtn).toBeVisible();
    await this.columnsToggleBtn.click();
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.columnsMenu).toBeVisible();
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
      await expect(badge).toHaveText(/new/i);
    }
    console.log(`✅ MFH Status validation completed. Rows checked: ${count}`);
  }

  async getFirstOrderNumber() {
    const orderNum = await this.Row1OrderNum.textContent();
    console.log(`First Row order num is : ${orderNum}`);
    return orderNum?.trim();
  }

  async markasManualReview(note = '') {
    const orderNum = (await this.getFirstOrderNumber()) || '<unknown>';
    this.currentOrderNum = orderNum;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Starting Manual Review for order: ${orderNum}`);
    console.log('='.repeat(60));

    // Set up handler for native browser dialog
    this.page.once('dialog', async dialog => {
      console.log(`📢 Dialog type: ${dialog.type()}`);
      console.log(`📋 Dialog message: ${dialog.message()}`);

      if (dialog.type() === 'prompt') {
        await dialog.accept(note || '');
        console.log(`✅ Accepted prompt with note: "${note || '(blank)'}"`);
      } else {
        await dialog.accept();
        console.log(`✅ Accepted ${dialog.type()} dialog`);
      }
    });

    // Find and click Manual Review button
    const firstRow = this.page.locator('tbody tr').first();
    const manualReviewBtn = firstRow.locator('p:has-text("MANUAL REVIEW")').first();
    await manualReviewBtn.click();
    console.log('🖱️ Clicked Manual Review button');

    // Wait for order to move to Manual Review tab
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000); // Wait for order to actually move

    console.log(`✅ Order ${orderNum} marked for Manual Review and moved from New Orders tab\n`);
    return orderNum;
  }
  async checkOrderStatusinManualReview() {
    const orderNum = this.currentOrderNum || (await this.getFirstOrderNumber()) || '<unknown>';
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Checking status for order: ${orderNum} in Manual Review tab`);
    console.log('='.repeat(60));

    const manualReviewTab = this.page.locator('a').filter({ hasText: 'Manual Review' }).first();
    await manualReviewTab.click();
    await this.page.waitForLoadState('networkidle');

    // ✅ FIX 1: Wait longer for Manual Review tab to fully load
    await this.page.waitForTimeout(2000);

    // ✅ FIX 2: Verify we're actually on Manual Review page
    await expect(this.page).toHaveURL(/manual.?review/i, { timeout: 10000 });
    console.log('✅ Confirmed on Manual Review page');

    // Wait for search field
    await expect(this.orderSearch).toBeVisible();

    await this.orderSearch.click();
    await this.orderSearch.clear();
    await this.page.waitForTimeout(500); // Let clear take effect
    
    // Search for the order
    await this.orderSearch.fill(orderNum);
    console.log(`🔍 Searching for order: ${orderNum}`);
    
    await this.page.waitForLoadState('networkidle');
    
    // ✅ FIX 4: Wait longer for search results to render
    await this.page.waitForTimeout(2500);

    // Wait for order row to appear
    const orderRow = this.page.locator(`tbody tr:has-text("${orderNum}")`).first();
    await orderRow.waitFor({ state: 'visible', timeout: 10000 });

    console.log(`✅ Order ${orderNum} found in Manual Review tab (visible row)`);

    // Validate Manual Review page loaded correctly
    await expect(this.page).toHaveURL(/.*\/orders\/status\/manualReview/);

    // Actions column visible
    await expect(
      this.page.getByRole('columnheader', { name: 'Actions' })
    ).toBeVisible();

    console.log('✅ Manual Review page loaded successfully with correct URL and columns');

    // ✅ FIX 5: Wait for the actions column cell to be fully rendered
    const actionsColumn = orderRow.locator('td').last();
    await actionsColumn.waitFor({ state: 'visible', timeout: 5000 });
    
    // ✅ FIX 6: Extra wait to ensure actions have loaded
    await this.page.waitForTimeout(1000);
    
    const actionsText = await actionsColumn.innerText();
    console.log(`📋 Actions column text: "${actionsText}"`);

    // ✅ FIX 7: Check if we're seeing New Orders actions (critical validation)
    if (actionsText.includes('ASSIGN KITS') || actionsText.includes('MANUAL REVIEW')) {
      throw new Error(
        `❌ CRITICAL: Order ${orderNum} is showing NEW ORDERS actions!\n` +
        `Actions found: ${actionsText}\n\n` +
        `This means the order didn't actually move to Manual Review tab.\n` +
        `Expected: ERROR, CANCEL, REVERT TO NEW\n` +
        `Got: ${actionsText}`
      );
    }

    // Validate expected actions
    const expectedActions = ['ERROR', 'CANCEL', 'REVERT TO NEW'];
    const actualActions = actionsText.split('\n').map(a => a.trim()).filter(Boolean);

    const missingActions = expectedActions.filter(a => !actualActions.includes(a));
    const extraActions = actualActions.filter(a => !expectedActions.includes(a));

    if (missingActions.length || extraActions.length) {
      throw new Error(
        `Actions column mismatch for order ${orderNum}\n` +
        `Missing: ${missingActions.join(', ')}\n` +
        `Extra: ${extraActions.join(', ')}\n` +
        `Full actions text: "${actionsText}"`
      );
    }

    console.log(`✅ Actions column contains exactly the expected options for order ${orderNum}\n`);
  }

  // Helper: Check if row has PrePaid Kit ID
  async hasPrePaidKitID(rowIndex = 0) {
    try {
      const kitId = await this.getPrePaidKitID(rowIndex);
      return !!kitId && /^\d+$/.test(kitId);
    } catch (error) {
      console.log(`Row ${rowIndex}: Error checking PrePaid KitID - ${error.message}`);
      return false;
    }
  }

  // Helper: Get PrePaid Kit ID value
  async getPrePaidKitID(rowIndex = 0) {
    try {
      const row = this.page.locator('tbody tr').nth(rowIndex);
      const prePaidKitIDColumn = row.locator('td').nth(5);
      const columnText = (await prePaidKitIDColumn.textContent({ timeout: 5000 })) || '';
      const text = columnText.replace(/\r/g, '').trim();

      // Try same-line pattern first
      const sameLineMatch = text.match(/Pre\s*Paid\s*Kit\s*ID\s*[:\-]?\s*(\d+)/i);
      if (sameLineMatch && sameLineMatch[1]) return sameLineMatch[1];

      // Split lines and check label / next-line value
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        if (/Pre\s*Paid\s*Kit\s*ID/i.test(lines[i])) {
          const inlineDigits = lines[i].match(/(\d+)/);
          if (inlineDigits) return inlineDigits[1];
          if (i < lines.length - 1) {
            const nextDigits = lines[i + 1].match(/(\d+)/);
            if (nextDigits) return nextDigits[1];
          }
        }
      }

      return null;
    } catch (error) {
      console.log(`Row ${rowIndex}: Error getting PrePaid KitID - ${error.message}`);
      return null;
    }
  }

  // Helper: Wait for ALL toasts to disappear before proceeding
  async waitForAllToastsToDisappear(timeout = 10000) {
    try {
      console.log('⏳ Waiting for all toasts to disappear...');
      const start = Date.now();

      while (Date.now() - start < timeout) {
        const toasts = this.page.locator('[role="alert"], .MuiSnackbar-root, .Toastify__toast');
        const count = await toasts.count();

        if (count === 0) {
          console.log('✅ All toasts disappeared');
          return true;
        }

        // Check if any are visible
        let anyVisible = false;
        for (let i = 0; i < count; i++) {
          const isVisible = await toasts.nth(i).isVisible().catch(() => false);
          if (isVisible) {
            anyVisible = true;
            break;
          }
        }

        if (!anyVisible) {
          console.log('✅ All toasts are hidden');
          return true;
        }

        await this.page.waitForTimeout(500);
      }

      console.log('⚠️ Timeout waiting for toasts to disappear');
      return false;
    } catch (err) {
      console.log(`⚠️ Error waiting for toasts: ${err.message}`);
      return false;
    }
  }

  // Helper: Wait for FINAL toast (skip processing messages like "Assigning...")
  async waitForFinalToast(timeout = 45000) {
    try {
      console.log('⏳ Waiting for final result toast...');
      const start = Date.now();
      let seenProcessingMessage = false;

      while (Date.now() - start < timeout) {
        const toasts = this.page.locator('[role="alert"], .MuiSnackbar-root, .Toastify__toast');
        const count = await toasts.count();

        for (let i = 0; i < count; i++) {
          const toast = toasts.nth(i);
          const isVisible = await toast.isVisible().catch(() => false);

          if (isVisible) {
            const text = (await toast.textContent().catch(() => '')) || '';
            const lower = text.toLowerCase();

            // Skip initial processing messages
            if (lower.includes('assigning kits') || lower.includes('processing')) {
              if (!seenProcessingMessage) {
                console.log(`   📋 Processing message: ${text.substring(0, 50)}...`);
                seenProcessingMessage = true;
              }
              await this.page.waitForTimeout(1000);
              continue;
            }

            // Look for FINAL result messages
            if (
              lower.includes('summary') ||
              lower.includes('orders processed') ||
              lower.includes('successful') ||
              lower.includes('failed') ||
              lower.includes('error') ||
              lower.includes('not found')
            ) {
              console.log(`   ✅ Final result toast detected`);
              return text.trim();
            }
          }
        }

        await this.page.waitForTimeout(1000);
      }

      console.log('   ⚠️ Timeout waiting for final toast');
      return '';
    } catch (err) {
      console.log(`   ❌ Error waiting for toast: ${err.message}`);
      return '';
    }
  }

  // Updated assign flow: 2 failures (PrePaid Kit) + 2 successes (no PrePaid Kit)
  async assignKitsToNewOrders() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 ASSIGN KITS WORKFLOW');
    console.log('Goal: Validate 2 FAILURES (PrePaid Kit) + 2 SUCCESSES (No PrePaid Kit)');
    console.log('='.repeat(60) + '\n');

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);

    // Clear any existing toasts first
    await this.waitForAllToastsToDisappear();

    const allRows = this.page.locator('tbody tr');
    const totalRows = await allRows.count();
    console.log(`📊 Total orders found: ${totalRows}\n`);

    const failureTarget = 2; // Orders WITH PrePaid Kit
    const successTarget = 2; // Orders WITHOUT PrePaid Kit
    let failedCount = 0;
    let assignedCount = 0;
    const failedDetails = [];
    const assignedDetails = [];

    for (let i = 0; i < totalRows; i++) {
      // Stop when both targets are reached
      if (failedCount >= failureTarget && assignedCount >= successTarget) {
        console.log(`\n🎯 Both targets reached! Failures: ${failedCount}, Successes: ${assignedCount}\n`);
        break;
      }

      try {
        const row = this.page.locator('tbody tr').nth(i);
        const orderNum = (await row.locator('td').nth(1).textContent({ timeout: 5000 }))?.trim() || `<row ${i}>`;

        console.log('='.repeat(60));
        console.log(`Processing Order ${i + 1}/${totalRows} - Order #${orderNum}`);
        console.log('='.repeat(60));

        const hasKitID = await this.hasPrePaidKitID(i);
        const kitIDValue = await this.getPrePaidKitID(i);

        if (hasKitID) {
          console.log(`📋 Order has PrePaid KitID: ${kitIDValue}`);

          // Skip if we already have enough failures
          if (failedCount >= failureTarget) {
            console.log(`⏭️ SKIPPING - Already validated ${failedCount} failures with PrePaid Kit\n`);
            continue;
          }

          console.log(`🔁 Testing failure for PrePaid Kit order (${failedCount + 1}/${failureTarget})`);
        } else {
          console.log(`📋 Order does NOT have PrePaid KitID`);

          // Skip if we already have enough successes
          if (assignedCount >= successTarget) {
            console.log(`⏭️ SKIPPING - Already validated ${assignedCount} successes without PrePaid Kit\n`);
            continue;
          }

          console.log(`🔁 Attempting to assign kit (${assignedCount + 1}/${successTarget})`);
        }

        // Ensure no old toasts are visible
        await this.waitForAllToastsToDisappear();

        // Find and click ASSIGN KITS button
        const assignKitsBtn = row.locator('p:has-text("ASSIGN KITS")').first();

        try {
          await assignKitsBtn.scrollIntoViewIfNeeded();
          await expect(assignKitsBtn).toBeVisible({ timeout: 5000 });
          await assignKitsBtn.click({ force: true });
          console.log('🖱️ Clicked ASSIGN KITS button');
        } catch (err) {
          console.log(`⚠️ Click failed for Order ${orderNum}: ${err.message}\n`);
          if (hasKitID) {
            failedDetails.push({ order: orderNum, row: i, hasPrePaidKit: true, kitID: kitIDValue, error: 'Button click failed' });
          } else {
            failedDetails.push({ order: orderNum, row: i, hasPrePaidKit: false, error: 'Button click failed' });
          }
          continue;
        }

        // Wait for FINAL toast (not the "Assigning..." processing message)
        const toastText = await this.waitForFinalToast(45000);

        if (!toastText) {
          console.log(`⚠️ No final toast received for Order ${orderNum}\n`);
          failedDetails.push({
            order: orderNum,
            row: i,
            hasPrePaidKit: hasKitID,
            kitID: kitIDValue,
            toast: 'No toast received',
            note: 'Timeout'
          });
          await this.waitForAllToastsToDisappear();
          await this.page.waitForTimeout(1000);
          continue;
        }

        console.log(`📬 Final Toast:\n${toastText.substring(0, 250)}...\n`);

        // Check for success or failure in the FINAL toast
        const lowerToast = toastText.toLowerCase();

        // Success indicators: "orders successful: 1" or "successful kit operations: 1"
        const hasSuccessCount = /orders successful:\s*[1-9]/.test(lowerToast) ||
          /successful kit operations:\s*[1-9]/.test(lowerToast);
        const hasNoFailures = /orders failed:\s*0/.test(lowerToast) ||
          /failed kit operations:\s*0/.test(lowerToast);
        const isSuccess = hasSuccessCount && hasNoFailures;

        // Failure indicators: "orders failed: 1" or "failed kit operations: 1"
        const hasFailureCount = /orders failed:\s*[1-9]/.test(lowerToast) ||
          /failed kit operations:\s*[1-9]/.test(lowerToast);
        const isFailed = hasFailureCount || lowerToast.includes('not found') ||
          lowerToast.includes('error');

        if (hasKitID) {
          // Orders WITH PrePaid Kit should FAIL
          if (isFailed) {
            failedCount++;
            failedDetails.push({
              order: orderNum,
              row: i,
              hasPrePaidKit: true,
              kitID: kitIDValue,
              toast: toastText.substring(0, 150)
            });
            console.log(`✅ Failure validated for PrePaid Kit order ${orderNum} (${failedCount}/${failureTarget})\n`);
          } else {
            console.log(`⚠️ Unexpected SUCCESS for PrePaid Kit order ${orderNum}\n`);
            assignedDetails.push({
              order: orderNum,
              row: i,
              hasPrePaidKit: true,
              kitID: kitIDValue,
              toast: toastText.substring(0, 150),
              note: 'Unexpected - should have failed'
            });
          }
        } else {
          // Orders WITHOUT PrePaid Kit should SUCCEED
          if (isSuccess) {
            assignedCount++;
            assignedDetails.push({
              order: orderNum,
              row: i,
              hasPrePaidKit: false,
              toast: toastText.substring(0, 150)
            });
            console.log(`✅ Kit assigned successfully for non-PrePaid order ${orderNum} (${assignedCount}/${successTarget})\n`);
          } else {
            failedDetails.push({
              order: orderNum,
              row: i,
              hasPrePaidKit: false,
              toast: toastText.substring(0, 150),
              note: 'Unexpected - should have succeeded'
            });
            console.log(`❌ Assignment failed for non-PrePaid order ${orderNum}\n`);
          }
        }

        // Wait for toast to disappear before next iteration
        await this.waitForAllToastsToDisappear();
        await this.page.waitForTimeout(1000);

      } catch (error) {
        console.error(`❌ Error processing order ${i + 1}: ${error.message}\n`);
        continue;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ASSIGNMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Validated Failures (PrePaid Kit orders): ${failedCount}/${failureTarget}`);
    console.log(`✅ Validated Successes (Non-PrePaid orders): ${assignedCount}/${successTarget}`);
    console.log(`❌ Unexpected results: ${failedDetails.filter(d => d.note).length}`);
    console.log('='.repeat(60) + '\n');

    if (failedDetails.length > 0) {
      console.log('❌ Expected Failures (PrePaid Kit):');
      failedDetails.filter(d => d.hasPrePaidKit && !d.note).forEach((d, idx) => {
        console.log(`${idx + 1}. Order ${d.order} | Row ${d.row} | KitID: ${d.kitID}`);
      });
      console.log('');
    }

    if (assignedDetails.length > 0) {
      console.log('✅ Successful Assignments (Non-PrePaid):');
      assignedDetails.filter(d => !d.hasPrePaidKit && !d.note).forEach((d, idx) => {
        console.log(`${idx + 1}. Order ${d.order} | Row ${d.row}`);
      });
      console.log('');
    }

    if (failedDetails.some(d => d.note) || assignedDetails.some(d => d.note)) {
      console.log('⚠️ Unexpected Results:');
      [...failedDetails, ...assignedDetails].filter(d => d.note).forEach((d, idx) => {
        console.log(`${idx + 1}. Order ${d.order} | PrePaid: ${d.hasPrePaidKit ? 'YES' : 'NO'} | ${d.note}`);
      });
      console.log('');
    }

    return {
      failedCount,
      assignedCount,
      failedDetails,
      assignedDetails,
      success: failedCount >= failureTarget && assignedCount >= successTarget
    };
  }
};

