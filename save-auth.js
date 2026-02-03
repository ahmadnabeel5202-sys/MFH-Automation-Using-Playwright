const { chromium } = require('playwright');

async function saveAuth() {
    const browser = await chromium.launch({ 
        headless: false,
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔓 Please login manually (including MFA)...');
    await page.goto('https://new-test-admin.malefromhome.com/');
    
    // Wait for you to login manually
    console.log('⏸️  After login complete, press Continue in Playwright Inspector');
    await page.pause();
    
    // Check if LOT EXP is set
    console.log('\n📅 Checking LOT EXP date...');
    try {
        // Wait for page to load completely
        await page.waitForLoadState('networkidle');
        
        // Look for LOT EXP element
        const lotExpElement = page.locator('text=/LOT EXP/i').first();
        await lotExpElement.waitFor({ state: 'visible', timeout: 5000 });
        const lotExpText = await lotExpElement.textContent();
        
        console.log(`Current LOT EXP: ${lotExpText}`);
        
        if (lotExpText.includes('NOT SET')) {
            console.log('\n⚠️  WARNING: LOT EXP is NOT SET!');
            console.log('📅 Please set the LOT EXP date in the UI now...');
            console.log('⏸️  After setting LOT EXP, press Continue in Playwright Inspector');
            await page.pause();
            
            // Verify it's set now
            const updatedLotExpText = await lotExpElement.textContent();
            console.log(`Updated LOT EXP: ${updatedLotExpText}`);
            
            if (updatedLotExpText.includes('NOT SET')) {
                console.log('❌ ERROR: LOT EXP is still NOT SET!');
                console.log('⚠️  Tests may fail without LOT EXP date set.');
            } else {
                console.log('✅ LOT EXP date is now set!');
            }
        } else {
            console.log('✅ LOT EXP date is already set!');
        }
    } catch (error) {
        console.log(`⚠️  Could not verify LOT EXP: ${error.message}`);
        console.log('📅 Please make sure LOT EXP is set before continuing...');
        console.log('⏸️  Press Continue when ready');
        await page.pause();
    }
    
    // Save the authenticated state
    await context.storageState({ path: 'auth.json' });
    console.log('\n✅ Auth saved to auth.json! MFA won\'t be needed.');
    console.log('✅ LOT EXP date included in saved state.');
    
    await browser.close();
}

saveAuth();