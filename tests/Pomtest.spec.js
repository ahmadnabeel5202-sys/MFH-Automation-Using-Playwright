import { test, expect } from '@playwright/test';
import { Orders } from '../Pages/ShowOrdersTab';
import { NewOrders } from '../Pages/newOrders';
import{ readyToShipOrders } from '../Pages/readyToShipOrders';
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

  test.skip('Orders tabs Visibility to User', async ({ page }) => {

    orders = new Orders(page);

    await orders.gotoKitsPage();
    await orders.openOrdersMenu();
    await orders.verifyOrdersTabsVisible();
    await orders.gotoAllorders();
    await orders.searchOrder();
    await orders.refreshOrdersFromShopify();
    await orders.verifyAllColumnsVisible();

  })

  test.skip('New Orders Page Functionality', async ({ page }) => {
    newOrders = new NewOrders(page);

    await newOrders.gotokitsPage();
    await newOrders.gotoOrdersMenu();
    await newOrders.gotoNewOrders();
    await newOrders.validateOnlyNewStatusInMFHColumn();
    await newOrders.getFirstOrderNumber();
    await newOrders.markasManualReview('');
    await newOrders.checkOrderStatusinManualReview();
    await newOrders.gotoNewOrders();
    await newOrders.getPrePaidKitID();
    

    // await newOrders.assignKitsToNewOrders();
  const result = await newOrders.assignKitsToNewOrders();
  });

test('Validate Ready to Ship orders', async ({ page }) => {
  const readyToShip = new readyToShipOrders(page);
  await readyToShip.gotokitsPage();
  await readyToShip.gotoReadyToShipOrders();
  await readyToShip.validateKitsAssignedReadyToShipStatus();
  await readyToShip.createShippingLabelsForFirstTwoOrders();
});

});







