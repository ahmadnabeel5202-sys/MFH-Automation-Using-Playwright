import { test, expect } from '@playwright/test';
import { Orders } from '../Pages/ShowOrdersTab';
import { NewOrders } from '../Pages/newOrders';
import { loginpage } from '../Pages/LoginPage';
import { credentials } from '../Utils/Credentials';


test.describe.serial('Test Suite with General Order Flow', () => {

  // Increase overall test timeout for this suite to allow long-running refreshes
  test.setTimeout(180000);

  let orders;
  let newOrders;
 

  test.skip('Test 1 - Verify user is on Kitspage', async ({ page }) => {
    await page.goto('/#/kits');
    await expect(page).toHaveURL('/#/kits');

  });

  test('Orders tabs Visibility to User', async ({ page }) => {

    orders = new Orders(page);

    await orders.gotoKitsPage();
    await orders.openOrdersMenu();
    await orders.verifyOrdersTabsVisible();
    await orders.gotoAllorders();
    await orders.searchOrder();
    await orders.refreshOrdersFromShopify();
    await orders.verifyAllColumnsVisible();

  })

  test('New Orders Page', async ({ page }) => {
    newOrders = new NewOrders(page);

    await newOrders.gotokitsPage();
    await newOrders.gotoOrdersMenu();
    await newOrders.gotoNewOrders();
    await newOrders.validateOnlyNewStatusInMFHColumn();
    await newOrders.getFirstOrderNumber();
    await newOrders.markasManualReview('');
    await newOrders.checkOrderStatusinManualReview();
  });

});







