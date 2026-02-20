import { expect } from '@playwright/test';

exports.OrderSearch = class OrderSearch {
  constructor(page) {
    this.page = page;
    this.orderSearch = page.getByRole('textbox', { name: 'Search' });
    this.resultOrderNum = page.locator("//tbody/tr[1]/td[2]");
  }
  async searchAndVerifyFromCurrentTab(options = {}) {
    const {
      rowIndex = 0,
      clearAfterSearch = false
    } = options;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 AUTO SEARCH & VERIFY - Row ${rowIndex + 1}`);
    console.log('='.repeat(60));

    try {
      const targetRow = this.page.locator('tbody tr').nth(rowIndex);
      await targetRow.waitFor({ state: 'visible', timeout: 10000 });

      // Get order number from 2nd column (OrderNum column)
      const orderNumCell = targetRow.locator('td').nth(1);
      const orderNumber = (await orderNumCell.textContent()).trim();
      console.log(`📋 Picked order number: ${orderNumber}`);

      // STEP 2: Capture MFH Status of that order
      
      const statusBadge = targetRow.locator('td .MuiChip-root').first();
      await statusBadge.waitFor({ state: 'visible', timeout: 5000 });
      const originalStatus = (await statusBadge.textContent()).trim();
      console.log(`📊 Captured status: "${originalStatus}"`);

    
      // STEP 3: Search for that order number
      
      await this.orderSearch.click();
      await this.page.waitForLoadState('networkidle');

      await this.orderSearch.clear();
      console.log('🧹 Cleared search field');

      await this.orderSearch.fill(orderNumber);
      console.log(`⌨️ Entered order number: ${orderNumber}`);
      await this.page.waitForFunction(
        () => document.querySelectorAll('tbody tr').length === 1,{ timeout: 10000 }  );

      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(2000); 

      // STEP 4: Verify ONLY that order is displayed (row count = 1)
  
      const allRows = this.page.locator('tbody tr');
      const rowCount = await allRows.count();

      console.log(`📊 Search results: ${rowCount} row(s) found`);

      if (rowCount === 0) {
        throw new Error(
          `❌ Order ${orderNumber} NOT FOUND in search results!\n` +
          `Expected 1 row, got 0 rows.`
        );
      }

      if (rowCount > 1) {
        console.log(`⚠️  WARNING: Multiple rows found (${rowCount}). Expected only 1 row.`);
        // Don't fail, but log warning
      } else {
        console.log(`✅ ONLY 1 order displayed (correct)`);
      }
      // STEP 5: Verify the order still has the same status
        const resultRow = allRows.first();

      // Verify order number matches
      const resultOrderNumCell = resultRow.locator('td').nth(1);
      const resultOrderNum = (await resultOrderNumCell.textContent()).trim();

      if (resultOrderNum !== orderNumber) {
        throw new Error(
          `❌ Order number mismatch!\n` +
          `Expected: ${orderNumber}\n` +
          `Got: ${resultOrderNum}`
        );
      }
      console.log(`✅ Order number verified: ${resultOrderNum}`);

      // Verify status matches
      const resultStatusBadge = resultRow.locator('td .MuiChip-root').first();
      await resultStatusBadge.waitFor({ state: 'visible', timeout: 5000 });
      const resultStatus = (await resultStatusBadge.textContent()).trim();

      if (resultStatus.toLowerCase() !== originalStatus.toLowerCase()) {
        throw new Error(
          `❌ Status mismatch!\n` +
          `Expected: "${originalStatus}"\n` +
          `Got: "${resultStatus}"`
        );
      }
      console.log(`✅ Status verified: "${resultStatus}"`);

      console.log('='.repeat(60));
      console.log('✅ ALL VERIFICATIONS PASSED');
      console.log('='.repeat(60) + '\n');

      // Clear search if requested
      if (clearAfterSearch) {
        await this.orderSearch.clear();
        await this.page.waitForLoadState('networkidle');
        console.log('🧹 Search field cleared\n');
      }

      return {
        success: true,
        orderNumber,
        originalStatus,
        resultStatus,
        rowCount,
        message: `Order ${orderNumber} found with correct status "${resultStatus}"`
      };

    } catch (err) {
      console.log(`❌ Verification failed: ${err.message}`);
      console.log('='.repeat(60) + '\n');

      return {
        success: false,
        orderNumber: null,
        originalStatus: null,
        resultStatus: null,
        rowCount: 0,
        message: `Verification error: ${err.message}`
      };
    }
  }

  async searchOrder(orderNumber, options = {}) {
    const {
      validateResult = true,
      clearAfterSearch = false,
      waitForResults = true,
      verifyStatus = null,  // NEW: Pass expected status to verify
      timeout = 10000
    } = options;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Searching for Order #${orderNumber}`);
    console.log('='.repeat(60));

    try {

      await expect(this.orderSearch).toBeVisible({ timeout: 5000 });
      console.log('✅ Search field is visible');
      await this.orderSearch.click();
      await this.page.waitForTimeout(500);

      await this.orderSearch.clear();
      console.log('🧹 Cleared search field');

      // Type the order number
      await this.orderSearch.fill(orderNumber);
      console.log(`⌨️ Entered order number: ${orderNumber}`);

      if (waitForResults) {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
        console.log('⏳ Waited for search results to load');
      }

      // Validate the search result
      if (validateResult) {
        try {
          await expect(this.resultOrderNum).toBeVisible({ timeout });
          const foundOrderNum = (await this.resultOrderNum.textContent())?.trim();

          if (foundOrderNum === orderNumber) {
            console.log(`✅ Order #${orderNumber} found successfully`);

            // NEW: Verify status if requested
            if (verifyStatus) {
              const statusBadge = this.page.locator('tbody tr').first().locator('td .MuiChip-root').first();
              const actualStatus = (await statusBadge.textContent()).trim();

              if (actualStatus.toLowerCase() !== verifyStatus.toLowerCase()) {
                console.log(`⚠️ Status mismatch: Expected "${verifyStatus}", got "${actualStatus}"`);
                return {
                  success: false,
                  foundOrderNum,
                  status: actualStatus,
                  message: `Status mismatch: Expected ${verifyStatus}, found ${actualStatus}`
                };
              }
              console.log(`✅ Status verified: "${actualStatus}"`);
            }

            console.log('='.repeat(60) + '\n');

            // Clear search if requested
            if (clearAfterSearch) {
              await this.orderSearch.clear();
              await this.page.waitForLoadState('networkidle');
              console.log('🧹 Search field cleared\n');
            }

            return {
              success: true,
              foundOrderNum,
              message: `Order #${orderNumber} found`
            };
          } else {
            console.log(`⚠️ Expected Order #${orderNumber}, but found #${foundOrderNum}`);
            console.log('='.repeat(60) + '\n');
            return {
              success: false,
              foundOrderNum,
              message: `Order mismatch: Expected ${orderNumber}, found ${foundOrderNum}`
            };
          }
        } catch (err) {
          console.log(`❌ Order #${orderNumber} not found in results`);
          console.log(`   Error: ${err.message}`);
          console.log('='.repeat(60) + '\n');
          return {
            success: false,
            foundOrderNum: null,
            message: `Order #${orderNumber} not found`
          };
        }
      } else {
        console.log('✅ Search completed (validation skipped)');
        console.log('='.repeat(60) + '\n');

        // Clear search if requested
        if (clearAfterSearch) {
          await this.orderSearch.clear();
          await this.page.waitForLoadState('networkidle');
          console.log('🧹 Search field cleared\n');
        }

        return {
          success: true,
          foundOrderNum: null,
          message: 'Search completed without validation'
        };
      }
    } catch (err) {
      console.log(`❌ Search failed: ${err.message}`);
      console.log('='.repeat(60) + '\n');
      return {
        success: false,
        foundOrderNum: null,
        message: `Search error: ${err.message}`
      };
    }
  }

  async searchMultipleOrders(orderNumbers, options = {}) {
    // console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Searching for ${orderNumbers.length} orders`);
    console.log('='.repeat(60) + '\n');

    const results = [];

    for (const orderNum of orderNumbers) {
      const result = await this.searchOrder(orderNum, options);
      results.push(result);

      // Clear search between multiple searches
      if (orderNumbers.indexOf(orderNum) < orderNumbers.length - 1) {
        await this.orderSearch.clear();
        await this.page.waitForTimeout(500);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // console.log('\n' + '='.repeat(60));
    console.log('📊 SEARCH SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('='.repeat(60) + '\n');

    return results;
  }

  async quickSearch(orderNumber) {
    await this.orderSearch.click();
    await this.orderSearch.clear();
    await this.orderSearch.fill(orderNumber);
    await this.page.waitForLoadState('networkidle');
  }

  async clearSearch() {
    await this.orderSearch.clear();
    await this.page.waitForLoadState('networkidle');
    console.log('🧹 Search field cleared');
  }
};