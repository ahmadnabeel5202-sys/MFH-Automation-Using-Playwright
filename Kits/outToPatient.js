import { expect } from '@playwright/test';

exports.outToPatient = class outToPatient {
    constructor(page) {
        this.page = page;
        this.currentOrderNum = null; // Store the current order number for use across methods

        this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
        this.orderSearch = page.getByRole('textbox', { name: 'Search' });
        this.NewOrders = page.locator('a').filter({ hasText: 'New' }).first();
        this.outToPatientTab = page.getByRole('menuitem', { name: /Out to Patient/i });
        this.allRows = page.locator('table tbody tr');
        this.firstRow = this.allRows.first();
        this.positivebtn = page.getByLabel('Positive', { exact: true });
        this.CpatureimgBtn = page.getByRole('button', { name: 'Capture Image' });
        this.selectCameraBtn = page.locator('div.MuiInputBase-input').filter({ hasText: 'Select Camera' });
        this.savetestRecordBtn = page.getByRole('button', { name: 'Save Test Record' });

    }


    async gotokitsPage() {
        await this.page.goto('/#/kits');
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
    }

    async gotoOutToPatientTab() {
        await expect(this.outToPatientTab).toBeVisible();
        await this.outToPatientTab.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(3000);
    }

    async clickRecordTestForFirstKit() {
        console.log('🧪 Clicking Record Test for first kit...\n');

        // Grant camera permissions first
        // await this.page.context().grantPermissions(['camera', 'microphone']);

        // Wait for table rows to load
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(8000);
        await this.page.waitForSelector('tbody tr');

        const firstRow = this.page.locator('tbody tr').first();

        // Capture Kit ID from first column
        const kitId = (await firstRow.locator('td').nth(1).textContent())?.trim();
        console.log(`📋 Processing KitId: ${kitId}`);

        await firstRow.getByRole('button', { name: 'Record Test' }).click();
        console.log('🖱️ Clicked Record Test');

        // Wait for navigation to test-record page
        await this.page.waitForURL(/\/kits\/.*\/test-record/);
        console.log('✅ Navigated to Record Test page');

        await this.page.getByText('Record Test').waitFor();
        console.log('✅ Record Test page loaded successfully\n');

        // Record test
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');

        await expect(this.positivebtn).toBeVisible();
        await this.positivebtn.click();
        console.log('🧬 Selected Positive result');

        // Wait for camera section to load
        await this.page.waitForTimeout(3000);





        // Wait for camera to initialize
        await this.page.waitForTimeout(3000);

        // Click Capture Image multiple times
        console.log('\n📸 Starting image capture...');
        for (let i = 1; i <= 5; i++) {
            await this.CpatureimgBtn.waitFor({ state: 'visible' });
            await this.CpatureimgBtn.click();
            console.log(`📸 Captured image ${i}/5`);
            await this.page.waitForTimeout(2000);
        }

        console.log('✅ All images captured successfully\n');
        // await this.page.savetestRecordBtn.scrollIntoViewIfNeeded();
        await expect(this.savetestRecordBtn).toBeVisible();


        await this.savetestRecordBtn.click();
        console.log('💾 Clicked Save Test Record');

      ;
        // Wait for message to appear

        const successMessage = this.page.locator('div.MuiSnackbarContent-message', {
            hasText: /Test Recorded/i
        });

        await expect(successMessage).toBeVisible({ timeout: 30000 });

        const messageText = await successMessage.textContent();
        console.log(`📋 Message: ${messageText}`);
        expect(messageText).toContain('Test Recorded');


        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        


    }

    


}

