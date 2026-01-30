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
    
    // Save the authenticated state
    await context.storageState({ path: 'auth.json' });
    console.log('✅ Auth saved to auth.json! MFA won\'t be needed.');
    
    await browser.close();
}

saveAuth();