import { expect } from '@playwright/test';

exports.NewOrders = class NewOrders {
  constructor(page) {
    this.page = page;
    this.currentOrderNum = null; // Store the current order number for use across methods

    this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
    this.orderSearch = page.getByRole('textbox', { name: 'Search' });
    this.NewOrders = page.locator('a').filter({ hasText: 'New' }).first();
    //this.Assignkitsbtn= page.locator('p:has-text("ASSIGN KITS")').nth(0);//Assign kits for 1st kit
    this.manualReviewbtn = page.locator('p:has-text("MANUAL REVIEW")').nth(0)//Manual Review -- for 1st kit
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

      // ✅ Text validation
      await expect(badge).toHaveText(/new/i);
    }
    console.log(`✅ MFH Status validation completed. Rows checked: ${count}`);
  }

  async getFirstOrderNumber() {
    const orderNum = await this.Row1OrderNum.textContent();
    console.log(`First Row order num is : ${orderNum}`);
    return orderNum?.trim(); // remove spaces

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


  // 2 Feb-2026-- Assign kits 
  async hasPrePaidKitID(rowIndex = 0) {
    try {
      const kitId = await this.getPrePaidKitID(rowIndex);
      return !!kitId && /^\d+$/.test(kitId);
    } catch (error) {
      console.log(`Row ${rowIndex}: Error checking PrePaid KitID - ${error.message}`);
      return false;
    }
  }

  /**
   * Get the PrePaid KitID value from a specific row (checks only column 5)
   */
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

  // helper: wait for the operation toast (captures short-lived toasts via MutationObserver)
  async waitForOperationToast(timeout = 30000) {
    try {
      const toastText = await this.page.evaluate(({ timeout }) => {
        return new Promise(resolve => {
          const selectors = ['[role="alert"]', '.MuiSnackbar-root', '.Toastify__toast', '.snackbar', '[data-testid="toast"]'];
          const getText = el => (el && (el.innerText || el.textContent) || '').trim();

          const checkNow = () => {
            for (const sel of selectors) {
              const els = Array.from(document.querySelectorAll(sel));
              for (const el of els) {
                const t = getText(el);
                if (t && /success|successful|fail|failed|error|already/i.test(t)) return t;
              }
            }
            return null;
          };

          const existing = checkNow();
          if (existing) return resolve(existing);

          const observer = new MutationObserver(() => {
            const found = checkNow();
            if (found) {
              observer.disconnect();
              resolve(found);
            }
          });

          observer.observe(document.body, { childList: true, subtree: true });

          setTimeout(() => {
            observer.disconnect();
            resolve('');
          }, timeout);
        });
      }, { timeout });

      return toastText || '';
    } catch {
      return '';
    }
  }

  // Updated assign flow: click 2 rows WITH PrePaid KitID (validate failure) and 2 WITHOUT (validate success)
  async assignKitsToNewOrders() {
    console.log('🔍 Assign workflow: attempt 2 failures (have PrePaid KitID) + 2 successes (no PrePaid KitID)');

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);

    const allRows = this.page.locator('tbody tr');
    const totalRows = await allRows.count();
    console.log(`📊 Total orders found: ${totalRows}`);

    const successTarget = 2;
    const failTarget = 2;
    let assignedCount = 0;
    let failedCount = 0;
    const assignedDetails = [];
    const failedDetails = [];

    for (let i = 0; i < totalRows; i++) {
      if (assignedCount >= successTarget && failedCount >= failTarget) {
        console.log(`\n🎯 Targets reached (success: ${assignedCount}, failed: ${failedCount}). Stopping.\n`);
        break;
      }

      try {
        const row = this.page.locator('tbody tr').nth(i);
        const orderNum = (await row.locator('td').nth(1).textContent({ timeout: 5000 }))?.trim() || `<row ${i}>`;

        console.log(`${'='.repeat(50)}`);
        console.log(`Checking Order ${i + 1}/${totalRows} - Order #${orderNum}`);
        console.log(`${'='.repeat(50)}`);

        const hasKitID = await this.hasPrePaidKitID(i);

        // Read column-5 raw text for logging
        let column5Text = '';
        try {
          column5Text = (await row.locator('td').nth(5).textContent({ timeout: 3000 }))?.trim() || '';
        } catch (e) {
          column5Text = `<error reading column 5: ${e.message}>`;
        }

        if (hasKitID) {
          if (failedCount < failTarget) {
            console.log(`🔁 Validating failure on PrePaid KitID order ${orderNum}`);
            // start watching toast BEFORE click
            const toastWatcher = this.waitForOperationToast(30000);
            // ensure clickable
            const assignKitsBtn = row.locator('p:has-text("ASSIGN KITS")').first();
            try {
              await assignKitsBtn.scrollIntoViewIfNeeded();
              await expect(assignKitsBtn).toBeVisible({ timeout: 5000 });
              await assignKitsBtn.click({ force: true });
              console.log(`🖱️ Clicked ASSIGN KITS (expected fail) for Order ${orderNum}`);
            } catch (err) {
              failedCount++;
              failedDetails.push({ order: orderNum, row: i, column5: column5Text, toast: '(click failed)', note: err.message });
              console.log(`⚠️ Click failed for Order ${orderNum}: ${err.message}`);
              console.log(`Order failed = ${failedCount}`);
              continue;
            }

            const toastText = (await toastWatcher) || '';
            console.log(`🛎️ Toast: "${toastText || '(none)'}"`);

            if (/fail|failed|error|already/i.test(toastText) || !/success|successful/i.test(toastText)) {
              failedCount++;
              failedDetails.push({ order: orderNum, row: i, column5: column5Text, toast: toastText || '(none)' });
              console.log(`❌ Failure validated for Order ${orderNum}`);
              console.log(`Order failed = ${failedCount}`);
            } else {
              failedDetails.push({ order: orderNum, row: i, column5: column5Text, toast: toastText, note: 'unexpected success' });
              console.log(`⚠️ Unexpected SUCCESS for PrePaid KitID order ${orderNum} — recorded.`);
            }

            await this.page.waitForTimeout(500);
          } else {
            console.log(`⏭️ Skipping PrePaid KitID order ${orderNum} (already validated ${failedCount} failures)`);
          }
        } else {
          if (assignedCount < successTarget) {
            console.log(`🔁 Attempting assign for Order ${orderNum} (no PrePaid KitID)`);
            const toastWatcher = this.waitForOperationToast(30000);
            const assignKitsBtn = row.locator('p:has-text("ASSIGN KITS")').first();
            try {
              await assignKitsBtn.scrollIntoViewIfNeeded();
              await expect(assignKitsBtn).toBeVisible({ timeout: 5000 });
              await assignKitsBtn.click({ force: true });
              console.log(`🖱️ Clicked ASSIGN KITS for Order ${orderNum}`);
            } catch (err) {
              failedDetails.push({ order: orderNum, row: i, column5: column5Text, toast: '(click failed)', note: err.message });
              console.log(`⚠️ Click failed for Order ${orderNum}: ${err.message}`);
              continue;
            }

            const toastText = (await toastWatcher) || '';
            console.log(`🛎️ Toast: "${toastText || '(none)'}"`);

            if (/success|successful/i.test(toastText)) {
              assignedCount++;
              assignedDetails.push({ order: orderNum, row: i, column5: column5Text, toast: toastText });
              console.log(`✅ Kit assigned successfully for Order ${orderNum} (${assignedCount}/${successTarget})`);
            } else {
              failedDetails.push({ order: orderNum, row: i, column5: column5Text, toast: toastText || '(none)' });
              console.log(`❌ Assignment failed for Order ${orderNum}. Toast: ${toastText || '(none)'}`);
            }

            await this.page.waitForTimeout(500);
          } else {
            console.log(`⏭️ Skipping Order ${orderNum} (already reached ${assignedCount} successes)`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing order ${i + 1}: ${error.message}`);
        continue;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 ASSIGNMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Kits Assigned (successful): ${assignedCount}`);
    console.log(`❌ Failures detected:           ${failedCount}`);
    console.log('='.repeat(60) + '\n');

    if (assignedDetails.length) {
      console.log('📋 Assigned details:');
      assignedDetails.forEach((d, idx) => console.log(`${idx + 1}. Order ${d.order} | row ${d.row} | col5: ${d.column5 || '(empty)'} | toast: ${d.toast}`));
    }
    if (failedDetails.length) {
      console.log('📋 Failed details:');
      failedDetails.forEach((d, idx) => console.log(`${idx + 1}. Order ${d.order} | row ${d.row} | col5: ${d.column5 || '(empty)'} | toast: ${d.toast} ${d.note ? '| note: ' + d.note : ''}`));
    }

    // Return detailed summary
    return { assignedCount, failedCount, assignedDetails, failedDetails };
  }
};