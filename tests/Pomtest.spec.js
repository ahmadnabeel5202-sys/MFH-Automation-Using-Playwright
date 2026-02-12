import { test, expect } from '@playwright/test';
import { Orders } from '../Pages/ShowOrdersTab';
import { NewOrders } from '../Pages/newOrders';
import{ readyToShipOrders } from '../Pages/readyToShipOrders';
import { shippingLabelPurchasedOrders } from '../Pages/shippingLablePurchased';
import { outToPatient } from '../Kits/outToPatient';
import { loginpage } from '../Pages/LoginPage';
import { credentials } from '../Utils/Credentials';


test.describe.serial('Test Suite with General Order Flow', () => {

  // Increase overall test timeout for this suite to allow long-running refreshes
  test.setTimeout(180000);

  let orders;
  let newOrders;
  let readyToShip ;
 

//   test.skip('Test 1 - Verify user is on Kitspage', async ({ page }) => {
//     await page.goto('/#/kits');
//     await expect(page).toHaveURL('/#/kits');

//   });

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

//   test('New Orders Page Functionality', async ({ page }) => {
//     newOrders = new NewOrders(page);

//     await newOrders.gotokitsPage();
//     await newOrders.gotoOrdersMenu();
//     await newOrders.gotoNewOrders();
//     await newOrders.validateOnlyNewStatusInMFHColumn();
//     await newOrders.getFirstOrderNumber();
//     await newOrders.markasManualReview('');
//     // await newOrders.checkOrderStatusinManualReview();
//     await newOrders.gotoNewOrders();
//     await newOrders.getPrePaidKitID();
//     await newOrders.assignKitsToNewOrders();
//   });

// test('Validate Ready to Ship orders functionality', async ({ page }) => {
//   readyToShip = new readyToShipOrders(page);

//   await readyToShip.gotokitsPage();
//   await readyToShip.gotoReadyToShipOrders();
//   await readyToShip.validateKitsAssignedReadyToShipStatus();
//   await readyToShip.createShippingLabelsForFirstTwoOrders();
//   // await readyToShip.markAsFulfilledForOrderWithPrePaidKit();
// });

// test('Validate Shipping Label Purchased orders functionality', async ({ page }) => {
//   const shippingLabelPurchased = new shippingLabelPurchasedOrders(page);

//   await shippingLabelPurchased.gotokitsPage();
//   await shippingLabelPurchased.gotoShippingLabelPurchasedOrders();
//   await shippingLabelPurchased.validateShippingLabelPurchasedStatus();
//   await shippingLabelPurchased.printAllLabelsForFirstOrder();
//   await shippingLabelPurchased.markAsShippedForFirstOrder();

// });
//Kits>Out to Patient tests
test('Validate Out to Patient orders functionality', async ({ page }) => {
  // const context = page.context();

  //   // Grant camera and microphone permissions
  //   await context.grantPermissions(['camera', 'microphone']);
  const outToPatientPage = new outToPatient(page);
  await outToPatientPage.gotokitsPage();
  await outToPatientPage.gotoOutToPatientTab();
  await outToPatientPage.clickRecordTestForFirstKit();
 


});

});







