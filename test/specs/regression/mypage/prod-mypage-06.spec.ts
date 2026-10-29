import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { addToCart } from '../../../helpers/api.helper';
import { raiseLastDigit } from '../../../helpers/data.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { MypageProfilePage } from '../../../pages/mypage-profile.page';

/** Verify a delivery / billing address can be added, edited and deleted on the address book, and the change shows on Checkout. */
describe('PROD_MYPAGE_06', () => {
  const profilePage = new MypageProfilePage();
  const cartPage = new CartPage();
  const checkoutPage = new CheckoutPage();

  it('add/edit delivery/billing address reflected on Checkout', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_06', async (site) => {
      const phone = site.customer.mobile;
      // Only the last digit changes, so the number stays valid on every site
      const editedPhone = raiseLastDigit(phone, 1);

      // Delete: every saved address is removed through the API
      await profilePage.prepareAddressPage();
      await profilePage.deleteAllAddressesByApi();

      // Add
      await profilePage.addAddress('shipping', phone);
      await profilePage.verifyAddressCard('shipping', phone);
      await profilePage.addAddress('billing', phone);
      await profilePage.verifyAddressCard('billing', phone);

      // Edit: only billing, since checkout shows the billing phone (the delivery address shows no phone)
      await profilePage.editAddressPhone('billing', editedPhone);
      await profilePage.verifyAddressCard('billing', editedPhone);

      // Checkout: the delivery address as added, the billing address as edited
      await cartPage.clearCart();
      await addToCart(site.product.sku);
      await cartPage.prepareCartPage();
      await cartPage.clickContinueToCheckout();
      await checkoutPage.verifySavedDeliveryAddress(site.shipping.postalCode ?? '');
      await checkoutPage.verifySavedBillingAddressPhone(editedPhone);

    });
  });
});
