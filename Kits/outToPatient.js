import { expect } from '@playwright/test';

exports.outToPatient = class outToPatient {
  constructor(page) {
    this.page = page;
    this.currentOrderNum = null; // Store the current order number for use across methods

    this.ordersMenu = page.locator('li').filter({ hasText: 'Orders' }).first();
    this.orderSearch = page.getByRole('textbox', { name: 'Search' });
    this.NewOrders = page.locator('a').filter({ hasText: 'New' }).first();
    this.outToPatientTab= page.getByRole('menuitem', { name: /Out to Patient/i });
    this.allRows = page.locator('table tbody tr');
    this.firstRow = this.allRows.first();
    this.positivebtn=page.getByLabel('Positive', { exact: true });
    this.CpatureimgBtn=page.getByRole('button', { name: 'Capture Image' });
    this.selectCameraBtn= page.locator('div.MuiInputBase-input').filter({ hasText: 'Select Camera' });
    this.selectOBSCamera= page.locator('li[role="option"]').filter({ hasText: 'OBS Virtual Camera' });
    // this.selectOBSCamera=page.getByText('OBS Virtual Camera', { exact: true });
    this.savetestRecordBtn= page.getByRole('button', { name: 'Save Test Record' });

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
    }
//     async clickRecordTestForFirstKit() {
//   console.log('🧪 Clicking Record Test for first kit...\n');

//   // Wait for table rows to load
//   await this.page.waitForSelector('tbody tr');

//   const firstRow = this.page.locator('tbody tr').first();

//   // Capture Kit ID from first column
//   const kitId = (await firstRow.locator('td').nth(1).textContent())?.trim();
//   console.log(`📋 Processing KitId: ${kitId}`);
  
//   await firstRow.getByRole('button', { name: 'Record Test' }).click();

//   console.log('🖱️ Clicked Record Test');

//   // Wait for navigation to test-record page
//   await this.page.waitForURL(/\/kits\/.*\/test-record/);

//   console.log('✅ Navigated to Record Test page');
//   await this.page.getByText('Record Test').waitFor();

//   console.log('✅ Record Test page loaded successfully\n');
//   //Record test
//   await this.page.waitForLoadState('networkidle');
//   await this.page.waitForLoadState('domcontentloaded');
//   await expect(this.positivebtn).toBeVisible();
//   await this.positivebtn.click();
//   console.log('🧬 Selected Positive result');
//   //Select OBS Virtual Camera
//   await this.selectCameraBtn.scrollIntoViewIfNeeded();
//   await expect(this.selectCameraBtn).toBeVisible();
//   await this.selectCameraBtn.click();
//     console.log('📷 Opened camera selection dropdown');
//   await this.selectOBSCamera.click();
//     console.log('📷 Selected OBS Virtual Camera');

//     await this.page.waitForLoadState('networkidle');
//     await this.page.waitForLoadState('domcontentloaded');
//   // Click Capture Image multiple times with waits in between
//   await this.CpatureimgBtn.click();
//     console.log('📸 Clicked Capture Image-1st');
//     await this.page.waitForLoadState('networkidle');
//  await this.CpatureimgBtn.click();
//     console.log('📸 Clicked Capture Image-2nd');
//     await this.page.waitForLoadState('networkidle');
//  await this.CpatureimgBtn.click();
//     console.log('📸 Clicked Capture Image-3rd');
//     await this.page.waitForLoadState('networkidle');
//  await this.CpatureimgBtn.click();
//     console.log('📸 Clicked Capture Image-4th');
//     await this.page.waitForLoadState('networkidle');
//  await this.CpatureimgBtn.click();
//     console.log('📸 Clicked Capture Image-5th');
//     await this.page.waitForLoadState('networkidle');

//     await this.page.waitForTimeout(8000); // Wait for 8 seconds to ensure all actions are completed



// };
async clickRecordTestForFirstKit() {
    console.log('🧪 Clicking Record Test for first kit...\n');

    // Grant camera permissions first
    // await this.page.context().grantPermissions(['camera', 'microphone']);

    // Wait for table rows to load
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

    // // 🔥 Get available cameras and select OBS using JavaScript
    // console.log('📷 Enumerating available cameras...\n');

    // const cameraInfo = await this.page.evaluate(async () => {
    //     try {
    //         const devices = await navigator.mediaDevices.enumerateDevices();
    //         const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
    //         return videoDevices.map(device => ({
    //             deviceId: device.deviceId,
    //             label: device.label,
    //             kind: device.kind
    //         }));
    //     } catch (error) {
    //         return { error: error.message };
    //     }
    // });

    // console.log('Available cameras:', JSON.stringify(cameraInfo, null, 2));

    // // Find OBS camera
    // const obsCamera = cameraInfo.find(cam => cam.label && cam.label.toLowerCase().includes('obs'));
    
    // if (obsCamera) {
    //     console.log(`✅ Found OBS Virtual Camera: ${obsCamera.label}`);
    //     console.log(`   Device ID: ${obsCamera.deviceId}\n`);
    // } else {
    //     console.log('⚠️ OBS Virtual Camera not found in available devices');
    //     console.log('Available cameras:', cameraInfo.map(c => c.label).join(', '));
    // }

    // // 🔥 Now click the dropdown using the method that worked before
    // console.log('📷 Opening camera dropdown...');
    
    // const dropdownButton = this.page.locator('text=Select Camera').first();
    // await dropdownButton.waitFor({ state: 'visible', timeout: 10000 });
    // await dropdownButton.click();
    // console.log('✅ Dropdown opened');

    // Wait for menu to appear
    await this.page.waitForTimeout(1500);

    // Take screenshot of dropdown menu
    await this.page.screenshot({ path: 'dropdown-menu.png' });
    console.log('📸 Screenshot saved: dropdown-menu.png');

    // 🔥 Try to find OBS option in the dropdown menu
    // console.log('\n🔍 Searching for OBS option in dropdown...');
    
    // // Get all visible text elements after dropdown opens
    // const menuItems = await this.page.locator('ul[role="listbox"] li, [role="option"], .MuiMenuItem-root').all();
    // console.log(`Found ${menuItems.length} menu items`);

    // for (let i = 0; i < menuItems.length; i++) {
    //     const text = await menuItems[i].textContent();
    //     const isVisible = await menuItems[i].isVisible();
    //     console.log(`  Item ${i}: "${text}" (visible: ${isVisible})`);
        
    //     if (text && text.toLowerCase().includes('obs')) {
    //         console.log(`✅ Found OBS option at index ${i}`);
    //         await menuItems[i].click();
    //         console.log('✅ Clicked OBS Virtual Camera');
    //         break;
    //     }
    // }

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
    await this.page.waitForTimeout(5000); // Wait for save action to complete
    console.log('💾 Clicked Save Test Record');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(12000); // Wait for any post-save processing
    await expect(this.page).not.toHaveURL(/\/kits\/.*\/test-record/);

}






}