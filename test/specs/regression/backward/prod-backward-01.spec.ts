import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { ShopPage } from '../../../pages/shop.page';
import { PfPage } from '../../../pages/pf.page';
import { BcPage } from '../../../pages/bc.page';
import { SplashPage } from '../../../pages/splash.page';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';

/** Add a PF product to cart up to payment, then go back to cart, BC, PF and Shop checking each page and the product name. */
describe('PROD_BACKWARD_01', function () {
  // Forward to payment and back to Shop runs past the default 240s; WDIO reads the limit when the test starts
  this.timeout(480000);

  const shopPage = new ShopPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const splashPage = new SplashPage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('PF to payment then back to cart and PF', async function () {
    await runOrSkip.call(this, 'PROD_BACKWARD_01', async () => {
      await cartPage.clearCart();

      await shopPage.openCategory('mobile');
      const pfProductName = await pfPage.selectFirstPfCard(true);

      await bcPage.verifyProductName(pfProductName);
      await bcPage.verifyBnbDisplayed('BC');
      await bcPage.galaxyClub.selectNoForService();
      await bcPage.tradeIn.selectNoForService();
      await bcPage.scPlus.selectNoForService();
      await bcPage.clickAddToCart();
      await splashPage.clickSplashContinue();

      await cartPage.prepareCartPage();
      await cartPage.verifyProductName(pfProductName);
      await cartPage.verifyBnbDisplayed('Cart');

      await cartPage.clickContinueToCheckout();
      await checkoutPage.prepareCheckoutPage();
      await checkoutPage.verifyBnbNotDisplayed('Checkout');
      await checkoutPage.verifyProductName(pfProductName);
      const checkoutSteps = await checkoutPage.proceedToPayment();
      console.log(`[PROD_BACKWARD_01] checkout steps: ${checkoutSteps.join(' > ')}`);

      // Back walks the checkout steps in reverse, then Cart > BC > PF > Shop L1 > Shop
      for (const step of [...checkoutSteps].reverse()) {
        await checkoutPage.verifyCheckoutStep(step);
        await checkoutPage.pressDeviceBack();
      }
      await checkoutPage.clickLeaveCheckoutConfirmIfShown();

      await cartPage.verifyCartPage();
      await cartPage.prepareCartPage();
      await cartPage.verifyProductName(pfProductName);
      await cartPage.pressDeviceBack();

      await bcPage.verifyBcPage();
      await bcPage.verifyProductName(pfProductName);
      await bcPage.pressDeviceBack();

      await pfPage.verifyPfPage();
      await pfPage.pressDeviceBack();

      await shopPage.verifyCategoryL1Page('mobile');
      await shopPage.pressDeviceBack();
      await shopPage.verifyShopPage();
    });
  });
});
