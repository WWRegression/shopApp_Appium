import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { addToCart } from '../../../helpers/api.helper';

/** Verify that clicking Edit in Order Summary/Contact Details/Delivery Mode navigates back to the corresponding section. */
describe('PROD_CHECKOUT_04', () => {
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('Edit buttons in Order Summary/Contact Details/Delivery Mode navigate back to the corresponding section', async function () {
    await runOrSkip.call(this, 'PROD_CHECKOUT_04', async (site) => {
      await cartPage.clearCart();
      await addToCart(site.product.sku);

      await cartPage.prepareCartPage();
      await cartPage.clickContinueToCheckout();
      await checkoutPage.prepareCheckoutPage();

      await checkoutPage.proceedToPayment();

      let paymentAddress: string | undefined;
      if ((await checkoutPage.getCurrentCheckoutStep()) === 'CHECKOUT_STEP_PAYMENT') {
        paymentAddress = await checkoutPage.getAddressInfoFromPayment();
      }

      // Contact Details / Delivery Mode Edit
      await checkoutPage.handleCheckoutEditButton(paymentAddress);

      // Order Summary Edit > Cart
      await checkoutPage.verifyEditInOrderSummary();
      await cartPage.verifyCartPage();
    });
  });
});
