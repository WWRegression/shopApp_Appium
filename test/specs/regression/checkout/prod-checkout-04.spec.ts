import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_CHECKOUT_04', () => {
  const checkoutPage = new CheckoutPage();

  it('Edit buttons navigate back to Order Summary/Contact/Delivery', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_04', async () => {
      await checkoutPage.verifyOnCheckout();
      await checkoutPage.editOrderSummary();
      await checkoutPage.editContactDetails();
      await checkoutPage.editDeliveryMode();
    });
  });
});
