// import { expect } from '@playwright/test';

// exports.shippingLabelPurchasedOrders = class shippingLabelPurchasedOrders {
//     constructor(page) {
//         this.page = page;

//         // 🔹 Locators
//         this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
//         this.orderSearch = page.getByRole('textbox', { name: 'Search' });
//         this.shippingLabelPurchasedTab = page.locator('a').filter({ hasText: 'Shipping Label Purchased' }).first();

//         this.allRows = page.locator('tbody tr');
//         this.mfhStatusBadges = page.locator('td .MuiChip-root, td:nth-child(4)');

//         // 🔹 Action Column Button Locators (row-specific, use with row.locator)
//         // Note: These buttons have text inside <p> tags within the button element
//         this.printAllLabelsBtn = page.locator('button:has-text("Print All Labels")');
//         this.markAsShippedBtn = page.locator('button:has-text("MARK AS SHIPPED")');
//         this.manualReviewBtn = page.locator('button:has-text("MANUAL REVIEW")');
//         this.pdfLink = page.locator('a:has-text("PDF")');
//         this.trackLink = page.locator('a:has-text("Track")');
//         // 🔹 Dialog Locators
//         this.dialogOkButton = page.locator('button:has-text("OK")');
//         this.dialogCancelButton = page.locator('button:has-text("Cancel")');
//         this.dialogMessage = page.locator('div[role="dialog"], .MuiDialog-root');

//         // 🔹 Toast/Alert Locators
//         this.successToast = page.locator('div[role="alert"]');
//     }

//     async gotokitsPage() {
//         await this.page.goto('/#/kits');
//         await this.page.waitForLoadState('networkidle');
//     }

//     async gotoShippingLabelPurchasedOrders() {
//         await expect(this.ordersMenu).toBeVisible();
//         await this.ordersMenu.click();
//         await this.page.waitForLoadState('networkidle');

//         await expect(this.shippingLabelPurchasedTab).toBeVisible();
//         await this.shippingLabelPurchasedTab.click();
//         await this.page.waitForLoadState('networkidle');

//         console.log('✅ Navigated to Shipping Label Purchased orders\n');
//     }

//     async validateShippingLabelPurchasedStatus() {
//         console.log('🔍 Validating MFH Status: shippingLabelPurchased\n');

//         await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });

//         const totalRows = await this.allRows.count();
//         const invalidOrders = [];

//         for (let i = 0; i < totalRows; i++) {
//             const row = this.allRows.nth(i);
//             const orderNum = await row.locator('td').nth(1).textContent();
//             const mfhStatus = await row.locator('td').nth(3).textContent();

//             if (mfhStatus.trim() !== 'shippingLabelPurchased') {
//                 invalidOrders.push({
//                     orderNum: orderNum.trim(),
//                     status: mfhStatus.trim()
//                 });
//             }
//         }

//         console.log('='.repeat(60));
//         console.log(`📊 Total Rows: ${totalRows}`);
//         console.log(`✅ Valid Rows: ${totalRows - invalidOrders.length}`);
//         console.log(`❌ Invalid Rows: ${invalidOrders.length}`);
//         console.log('='.repeat(60));

//         if (invalidOrders.length > 0) {
//             console.log('\n⚠️ Orders with incorrect status:');
//             invalidOrders.forEach(order => {
//                 console.log(`   Order #${order.orderNum} - Status: "${order.status}"`);
//             });
//             console.log('');
//         } else {
//             console.log('\n✅ All orders have correct status!\n');
//         }

//         return { totalRows, invalidOrders };
//     }

//     // 🔹 Print All Labels for First Order
//     async printAllLabelsForFirstOrder() {
//         console.log('🖨️ Printing all labels for first order...\n');

//         await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });

//         const row = this.allRows.first();

//         // Get order number from first row
//         const orderNum = await row.locator('td').nth(1).textContent();
//         const orderNumber = orderNum?.trim();

//         console.log('='.repeat(60));
//         console.log(`📋 Processing Order #${orderNumber}`);
//         console.log('='.repeat(60));

//         // Get Actions cell (last column)
//         const actionsCell = row.locator('td').last();

//         // Locate "Print All Labels" button in Actions cell
//         const printButton = actionsCell.locator('button:has-text("Print All Labels")');

//         const isVisible = await printButton.isVisible().catch(() => false);

//         if (!isVisible) {
//             console.log('⚠️ "Print All Labels" button not visible\n');
//             return {
//                 orderNumber,
//                 success: false,
//                 message: 'Print All Labels button not visible'
//             };
//         }

//         console.log('✅ Found "Print All Labels" button');

//         // Click the button
//         await printButton.scrollIntoViewIfNeeded();
//         await this.page.waitForTimeout(500);
//         await printButton.click({ force: true });
//         console.log('🖱️ Clicked "Print All Labels" button');

//         // Wait for success message
//         const successMessage = await this.waitForRegLabelsMessage(orderNumber);

//         if (successMessage.toLowerCase().includes('getting reg labels')) {
//             console.log(`\n✅ Order #${orderNumber} - Labels printing initiated successfully!\n`);
//             return {
//                 orderNumber,
//                 success: true,
//                 message: successMessage
//             };
//         } else {
//             console.log(`\n⚠️ Order #${orderNumber} - Unexpected message received\n`);
//             return {
//                 orderNumber,
//                 success: false,
//                 message: successMessage
//             };
//         }
//     }

//     // 🔹 Wait for "Getting reg labels" success message
//     async waitForRegLabelsMessage(orderNumber) {
//         try {
//             console.log('⏳ Waiting for labels generation message...');

//             const maxAttempts = 30; // 30 seconds total
//             let finalMessage = '';

//             for (let attempt = 0; attempt < maxAttempts; attempt++) {
//                 await this.page.waitForTimeout(1000);

//                 const alerts = await this.successToast.all();
//                 console.log(`   🔄 Attempt ${attempt + 1}/${maxAttempts} - Alerts found: ${alerts.length}`);

//                 for (const alert of alerts) {
//                     const isVisible = await alert.isVisible().catch(() => false);
//                     if (!isVisible) continue;

//                     const text = await alert.textContent().catch(() => '');
//                     if (!text || text.trim().length === 0) continue;

//                     const lowerText = text.toLowerCase();
//                     console.log(`   📋 Message: ${text.substring(0, 150)}`);

//                     // Check for the expected success message
//                     if (
//                         lowerText.includes('getting reg labels') ||
//                         lowerText.includes('inbound/outbound shipping labels') ||
//                         (lowerText.includes('labels') && lowerText.includes(orderNumber?.toLowerCase()))
//                     ) {
//                         console.log('✅ Success message detected!');
//                         finalMessage = text.trim();
//                         return finalMessage;
//                     }

//                     // Capture any other message
//                     if (lowerText.includes('error') || lowerText.includes('failed')) {
//                         console.log('❌ Error message detected!');
//                         finalMessage = text.trim();
//                         return finalMessage;
//                     }
//                 }
//             }

//             console.log('❌ Timeout: Success message did not appear');
//             return finalMessage || 'Timeout waiting for labels generation message';

//         } catch (err) {
//             console.log(`❌ Error: ${err.message}`);

//             // Try to get any visible message as fallback
//             const alerts = await this.successToast.all();
//             for (const alert of alerts) {
//                 const text = await alert.textContent().catch(() => '');
//                 if (text && text.trim().length > 0) {
//                     console.log(`   📋 Fallback message: ${text}`);
//                     return text.trim();
//                 }
//             }

//             return '';
//         }
//     }

//     // 🔹 Mark as Shipped for First Order
//     async markAsShippedForFirstOrder() {
//         console.log('📦 Marking first order as shipped...\n');
//         await this.page.waitForLoadState('networkidle');
//         await this.page.waitForLoadState('domcontentloaded');

//         await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });

//         const row = this.allRows.first();
//         const orderNumber = (await row.locator('td').nth(1).textContent())?.trim();

//         console.log('='.repeat(60));
//         console.log(`📋 Processing Order #${orderNumber}`);
//         console.log('='.repeat(60));

//         const markAsShippedButton = row
//             .locator('td')
//             .last()
//             .locator('button:has-text("MARK AS SHIPPED")');

//         await expect(markAsShippedButton).toBeVisible();
//         console.log('✅ Found "MARK AS SHIPPED" button');

//         // 🔐 Register native dialog handler BEFORE clicking
//         this.page.once('dialog', async dialog => {
//             console.log(`📢 Dialog (${dialog.type()}): ${dialog.message()}`);
//             await dialog.accept();
//             console.log('✅ Confirmation dialog accepted');
//         });

//         // Click button
//         await markAsShippedButton.click();
//         console.log('🖱️ Clicked "MARK AS SHIPPED"');

//         const result = await this.waitForFinalMarkAsShippedMessage();

//         if (result.success) {
//             console.log(`\n✅ Order #${orderNumber} shipped successfully`);
//             console.log(`📋 Message: ${result.message}\n`);
//         } else {
//             console.log(`\n❌ Order #${orderNumber} shipping failed`);
//             console.log(`📋 Message: ${result.message}\n`);
//         }

//         return {
//             orderNumber,
//             success: result.success,
//             message: result.message
//         };

//     }
//     async waitForFinalMarkAsShippedMessage() {
//         console.log('⏳ Waiting for final Mark-As-Shipped result...');

//         const timeoutMs = 45000;
//         const start = Date.now();

//         while (Date.now() - start < timeoutMs) {
//             const alerts = await this.successToast.all();

//             for (const alert of alerts) {
//                 if (!(await alert.isVisible().catch(() => false))) continue;

//                 const message = (await alert.textContent().catch(() => '')).trim();
//                 if (!message) continue;

//                 const lower = message.toLowerCase();
//                 console.log(`📋 Toast: ${message}`);

//                 // ❌ Ignore progress / noise messages
//                 if (
//                     lower.includes('marking order') ||
//                     lower.includes('getting reg labels') ||
//                     lower.includes('shipping labels')
//                 ) {
//                     continue;
//                 }

//                 // ✅ FINAL SUCCESS
//                 if (
//                     lower.includes('marked as outtopatient') ||  // This will match!
//                     lower.includes('out to patient') ||
//                     (lower.includes('kitid') && lower.includes('marked'))
//                 ) {
//                     console.log('✅ Final SUCCESS toast detected');
//                     return { success: true, message };  // Returns immediately!
//                 }

//                 // ❌ FINAL ERROR
//                 if (
//                     lower.includes('error') ||
//                     lower.includes('failed') ||
//                     lower.includes('unable')
//                 ) {
//                     console.log('❌ Error toast detected');
//                     return { success: false, message };
//                 }
//             }

//             await this.page.waitForTimeout(1000);
//         }

//         return {
//             success: false,
//             message: 'Timeout waiting for final shipped confirmation'
//         };
//     }


// };

///Second code -------2


import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

exports.shippingLabelPurchasedOrders = class shippingLabelPurchasedOrders {
    constructor(page) {
        this.page = page;

        // 🔹 Locators
        this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
        this.orderSearch = page.getByRole('textbox', { name: 'Search' });
        this.shippingLabelPurchasedTab = page.locator('a').filter({ hasText: 'Shipping Label Purchased' }).first();

        this.allRows = page.locator('tbody tr');
        this.mfhStatusBadges = page.locator('td .MuiChip-root, td:nth-child(4)');

        // 🔹 Action Column Button Locators (row-specific, use with row.locator)
        // Note: These buttons have text inside <p> tags within the button element
        this.printAllLabelsBtn = page.locator('button:has-text("Print All Labels")');
        this.markAsShippedBtn = page.locator('button:has-text("MARK AS SHIPPED")');
        this.manualReviewBtn = page.locator('button:has-text("MANUAL REVIEW")');
        this.pdfLink = page.locator('a:has-text("PDF")');
        this.trackLink = page.locator('a:has-text("Track")');
        // 🔹 Dialog Locators
        this.dialogOkButton = page.locator('button:has-text("OK")');
        this.dialogCancelButton = page.locator('button:has-text("Cancel")');
        this.dialogMessage = page.locator('div[role="dialog"], .MuiDialog-root');

        // 🔹 Toast/Alert Locators
        this.successToast = page.locator('div[role="alert"]');
    }

    async gotokitsPage() {
        await this.page.goto('/#/kits');
        await this.page.waitForLoadState('networkidle');
    }

    async gotoShippingLabelPurchasedOrders() {
        await expect(this.ordersMenu).toBeVisible();
        await this.ordersMenu.click();
        await this.page.waitForLoadState('networkidle');

        await expect(this.shippingLabelPurchasedTab).toBeVisible();
        await this.shippingLabelPurchasedTab.click();
        await this.page.waitForLoadState('networkidle');

        console.log('✅ Navigated to Shipping Label Purchased orders\n');
    }

    async validateShippingLabelPurchasedStatus() {
        console.log('🔍 Validating MFH Status: shippingLabelPurchased\n');

        await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });

        const totalRows = await this.allRows.count();
        const invalidOrders = [];

        for (let i = 0; i < totalRows; i++) {
            const row = this.allRows.nth(i);
            const orderNum = await row.locator('td').nth(1).textContent();
            const mfhStatus = await row.locator('td').nth(3).textContent();

            if (mfhStatus.trim() !== 'shippingLabelPurchased') {
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

    // 🔹 Print All Labels for First Order WITH Download Verification
    async printAllLabelsForFirstOrder() {
        console.log('🖨️ Printing all labels for first order...\n');

        await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });

        const row = this.allRows.first();

        // Get order number from first row
        const orderNum = await row.locator('td').nth(1).textContent();
        const orderNumber = orderNum?.trim();

        console.log('='.repeat(60));
        console.log(`📋 Processing Order #${orderNumber}`);
        console.log('='.repeat(60));

        // Get Actions cell (last column)
        const actionsCell = row.locator('td').last();

        // Locate "Print All Labels" button in Actions cell
        const printButton = actionsCell.locator('button:has-text("Print All Labels")');

        const isVisible = await printButton.isVisible().catch(() => false);

        if (!isVisible) {
            console.log('⚠️ "Print All Labels" button not visible\n');
            return {
                orderNumber,
                success: false,
                message: 'Print All Labels button not visible'
            };
        }

        console.log('✅ Found "Print All Labels" button');

        // 🔥 START listening for download BEFORE clicking the button
        const downloadPromise = this.page.waitForEvent('download', { timeout: 60000 });

        // Click the button
        await printButton.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(500);
        await printButton.click({ force: true });
        console.log('🖱️ Clicked "Print All Labels" button');

        // Wait for "Getting reg labels" processing message
        console.log('⏳ Waiting for labels processing message...');
        const processingMessage = await this.waitForRegLabelsMessage(orderNumber);
        console.log(`📋 Processing message: ${processingMessage}`);

        // 🔥 NOW wait for the file download to complete
        console.log('⏳ Waiting for file download to start...\n');

        try {
            const download = await downloadPromise;

            // Get the filename
            const suggestedFilename = download.suggestedFilename();
            console.log(`📥 Download detected: ${suggestedFilename}`);

            // Verify filename contains "MergeLabels"
            const expectedFilename = 'mergedlabels';
            const isCorrectFile = suggestedFilename.toLowerCase().includes(expectedFilename.toLowerCase());

            if (!isCorrectFile) {
                console.log(`❌ Wrong file downloaded: ${suggestedFilename}`);
                console.log(`   Expected filename to contain: "${expectedFilename}"\n`);
                return {
                    orderNumber,
                    success: false,
                    message: `Wrong file downloaded: ${suggestedFilename}`,
                    filename: suggestedFilename
                };
            }

            // Create downloads directory if it doesn't exist
            const downloadsDir = './downloads';
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir, { recursive: true });
            }

            // Save with timestamp to avoid overwriting
            const timestamp = new Date().getTime();
            const downloadPath = path.join(downloadsDir, `${timestamp}_${suggestedFilename}`);
            await download.saveAs(downloadPath);
            console.log(`💾 File saved to: ${downloadPath}`);

            // Verify file is not empty
            const stats = fs.statSync(downloadPath);
            const fileSizeInBytes = stats.size;
            const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);

            console.log(`📊 File size: ${fileSizeInKB} KB`);

            if (fileSizeInBytes === 0) {
                console.log('❌ Downloaded file is empty!\n');
                return {
                    orderNumber,
                    success: false,
                    message: 'Downloaded file is empty',
                    filename: suggestedFilename,
                    fileSizeKB: fileSizeInKB,
                    downloadPath
                };
            }

            console.log('\n' + '='.repeat(60));
            console.log(`✅ Order #${orderNumber} - Labels Downloaded Successfully!`);
            console.log(`   📄 Filename: ${suggestedFilename}`);
            console.log(`   📊 File Size: ${fileSizeInKB} KB`);
            console.log(`   📁 Saved to: ${downloadPath}`);
            console.log('='.repeat(60) + '\n');

            return {
                orderNumber,
                success: true,
                message: 'Labels downloaded successfully',
                filename: suggestedFilename,
                fileSizeKB: fileSizeInKB,
                downloadPath
            };

        } catch (error) {
            console.log(`\n❌ Download Failed!`);
            console.log(`   Error: ${error.message}\n`);

            return {
                orderNumber,
                success: false,
                message: `Download timeout or error: ${error.message}`
            };
        }
    }

    // 🔹 Wait for "Getting reg labels" success message
    async waitForRegLabelsMessage(orderNumber) {
        try {
            console.log('⏳ Waiting for labels generation message...');

            const maxAttempts = 30; // 30 seconds total
            let finalMessage = '';

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                await this.page.waitForTimeout(1000);

                const alerts = await this.successToast.all();
                console.log(`   🔄 Attempt ${attempt + 1}/${maxAttempts} - Alerts found: ${alerts.length}`);

                for (const alert of alerts) {
                    const isVisible = await alert.isVisible().catch(() => false);
                    if (!isVisible) continue;

                    const text = await alert.textContent().catch(() => '');
                    if (!text || text.trim().length === 0) continue;

                    const lowerText = text.toLowerCase();
                    console.log(`   📋 Message: ${text.substring(0, 150)}`);

                    // Check for the expected success message
                    if (
                        lowerText.includes('getting reg labels') ||
                        lowerText.includes('inbound/outbound shipping labels') ||
                        (lowerText.includes('labels') && lowerText.includes(orderNumber?.toLowerCase()))
                    ) {
                        console.log('✅ Success message detected!');
                        finalMessage = text.trim();
                        return finalMessage;
                    }

                    // Capture any other message
                    if (lowerText.includes('error') || lowerText.includes('failed')) {
                        console.log('❌ Error message detected!');
                        finalMessage = text.trim();
                        return finalMessage;
                    }
                }
            }

            console.log('❌ Timeout: Success message did not appear');
            return finalMessage || 'Timeout waiting for labels generation message';

        } catch (err) {
            console.log(`❌ Error: ${err.message}`);

            // Try to get any visible message as fallback
            const alerts = await this.successToast.all();
            for (const alert of alerts) {
                const text = await alert.textContent().catch(() => '');
                if (text && text.trim().length > 0) {
                    console.log(`   📋 Fallback message: ${text}`);
                    return text.trim();
                }
            }

            return '';
        }
    }

    // 🔹 Mark as Shipped for First Order
    async markAsShippedForFirstOrder() {
        console.log('📦 Marking first order as shipped...\n');
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');

        await expect(this.allRows.first()).toBeVisible({ timeout: 10000 });

        const row = this.allRows.first();
        const orderNumber = (await row.locator('td').nth(1).textContent())?.trim();

        console.log('='.repeat(60));
        console.log(`📋 Processing Order #${orderNumber}`);
        console.log('='.repeat(60));

        const markAsShippedButton = row
            .locator('td')
            .last()
            .locator('button:has-text("MARK AS SHIPPED")');

        await expect(markAsShippedButton).toBeVisible();
        console.log('✅ Found "MARK AS SHIPPED" button');

        // 🔐 Register native dialog handler BEFORE clicking
        this.page.once('dialog', async dialog => {
            console.log(`📢 Dialog (${dialog.type()}): ${dialog.message()}`);
            await dialog.accept();
            console.log('✅ Confirmation dialog accepted');
        });

        // Click button
        await markAsShippedButton.click();
        console.log('🖱️ Clicked "MARK AS SHIPPED"');

        const result = await this.waitForFinalMarkAsShippedMessage();

        if (result.success) {
            console.log(`\n✅ Order #${orderNumber} shipped successfully`);
            console.log(`📋 Message: ${result.message}\n`);
        } else {
            console.log(`\n❌ Order #${orderNumber} shipping failed`);
            console.log(`📋 Message: ${result.message}\n`);
        }

        return {
            orderNumber,
            success: result.success,
            message: result.message
        };

    }

    async waitForFinalMarkAsShippedMessage() {
        console.log('⏳ Waiting for final Mark-As-Shipped result...');

        const timeoutMs = 45000;
        const start = Date.now();

        while (Date.now() - start < timeoutMs) {
            const alerts = await this.successToast.all();

            for (const alert of alerts) {
                if (!(await alert.isVisible().catch(() => false))) continue;

                const message = (await alert.textContent().catch(() => '')).trim();
                if (!message) continue;

                const lower = message.toLowerCase();
                console.log(`📋 Toast: ${message}`);

                // ❌ Ignore progress / noise messages
                if (
                    lower.includes('marking order') ||
                    lower.includes('getting reg labels') ||
                    lower.includes('shipping labels')
                ) {
                    continue;
                }

                // ✅ FINAL SUCCESS
                if (
                    lower.includes('marked as outtopatient') ||
                    lower.includes('out to patient') ||
                    (lower.includes('kitid') && lower.includes('marked'))
                ) {
                    console.log('✅ Final SUCCESS toast detected');
                    return { success: true, message };
                }

                // ❌ FINAL ERROR
                if (
                    lower.includes('error') ||
                    lower.includes('failed') ||
                    lower.includes('unable')
                ) {
                    console.log('❌ Error toast detected');
                    return { success: false, message };
                }
            }

            await this.page.waitForTimeout(1000);
        }

        return {
            success: false,
            message: 'Timeout waiting for final shipped confirmation'
        };
    }

};
