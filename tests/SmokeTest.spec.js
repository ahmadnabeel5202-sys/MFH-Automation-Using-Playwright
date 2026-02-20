import { test, expect } from '@playwright/test';
import { Orders } from '../Orders/ShowOrdersTab';
import { NewOrders } from '../Orders/newOrders';
import { readyToShipOrders } from '../Orders/readyToShipOrders';
import { shippingLabelPurchasedOrders } from '../Orders/shippingLablePurchased';
import { CanceledOrders } from '../Orders/canceled';
import { ErrorOrders } from '../Orders/errorOrders';
import { outToPatient } from '../Kits/outToPatient';
import { ShippedOrders } from '../Orders/shippedOrders';
import { loginpage } from '../Orders/LoginPage';
import { credentials } from '../Utils/Credentials';


test.describe.serial('Test Suite with General Order Flow', () => {

  // Increase overall test timeout for this suite to allow long-running refreshes
  test.setTimeout(180000);

  let orders;
  let newOrders;
  let readyToShip;


  //   test.skip('Test 1 - Verify user is on Kitspage', async ({ page }) => {
  //     await page.goto('/#/kits');
  //     await expect(page).toHaveURL('/#/kits');

  //   });

  test.only('All Order tabs Visibility to User', async ({ page }) => {

    orders = new Orders(page);

    await orders.gotoKitsPage();
    await orders.openOrdersMenu();
    await orders.verifyOrdersTabsVisible();
    await orders.gotoAllorders();
    await orders.searchAndVerifyOrder();
    await orders.verifyAllColumnsVisible();
    // await orders.testAllColumnToggles();
    // await orders.refreshOrdersFromShopify();
  })

  test('New Orders Page Functionality', async ({ page }) => {
    newOrders = new NewOrders(page);

    await newOrders.gotokitsPage();
    await newOrders.gotoOrdersMenu();
    await newOrders.gotoNewOrders();
    await newOrders.validateOnlyNewStatusInMFHColumn();
    await newOrders.getFirstOrderNumber();
    await newOrders.gotoNewOrders();
    // await newOrders.getPrePaidKitID();
    // await newOrders.assignKitsToNewOrders();
    await newOrders.markasManualReview('');
    await newOrders.checkOrderStatusinManualReview();
  });

  test('Validate Ready to Ship orders functionality', async ({ page }) => {
    readyToShip = new readyToShipOrders(page);

    await readyToShip.gotokitsPage();
    await readyToShip.gotoReadyToShipOrders();
    await readyToShip.validateKitsAssignedReadyToShipStatus();
    await readyToShip.createShippingLabelsForFirstTwoOrders();
    // await readyToShip.markAsFulfilledForOrderWithPrePaidKit();
  });

  test('Validate Shipping Label Purchased orders functionality', async ({ page }) => {
    const shippingLabelPurchased = new shippingLabelPurchasedOrders(page);

    await shippingLabelPurchased.gotokitsPage();
    await shippingLabelPurchased.gotoShippingLabelPurchasedOrders();
    await shippingLabelPurchased.validateShippingLabelPurchasedStatus();
    await shippingLabelPurchased.printAllLabelsForFirstOrder();
    await shippingLabelPurchased.markAsShippedForFirstOrder();

  });

  test('Validate Out to Patient orders functionality', async ({ page }) => {
    // const context = page.context();

    //   // Grant camera and microphone permissions
    //   await context.grantPermissions(['camera', 'microphone']);
    const outToPatientPage = new outToPatient(page);
    await outToPatientPage.gotokitsPage();
    await outToPatientPage.gotoOutToPatientTab();
    await outToPatientPage.clickRecordTestForFirstKit();

  });

  test('Validate Canceled orders functionality', async ({ page }) => {
    const canceledOrders = new CanceledOrders(page);

    await canceledOrders.gotokitsPage();
    await canceledOrders.gotoOrdersMenu();
    await canceledOrders.gotoCanceledOrders();
    await canceledOrders.columnsToggleOptions();
    await canceledOrders.validateOnlyCanceledStatusInMFHColumn();


  });
  test('Validate Error orders functionality', async ({ page }) => {
    const errorOrders = new ErrorOrders(page);
    await errorOrders.gotokitsPage();
    await errorOrders.gotoOrdersMenu();
    await errorOrders.gotoErrorOrders();
    await errorOrders.columnsToggleOptions();
    await errorOrders.validateOnlyErrorStatusInMFHColumn();


  });
  test('Validate Shipped orders functionality', async ({ page }) => {
    const shippedOrders = new ShippedOrders(page);
    await shippedOrders.gotokitsPage();
    await shippedOrders.gotoOrdersMenu();
    await shippedOrders.gotoShippedOrders();
    await shippedOrders.columnsToggleOptions();
    await shippedOrders.validateOnlyShippedStatusInMFHColumn();

  });




});



