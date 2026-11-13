import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { addToCart } from '../../../helpers/api.helper';
import { raiseLastDigit } from '../../../helpers/data.helper';
import { CartPage } from '../../../pages/cart.page';
import { CheckoutPage } from '../../../pages/checkout.page';
import { MypageProfilePage } from '../../../pages/mypage-profile.page';

/** Verify an address added / edited on the address book shows on Checkout, and the addresses can be deleted afterwards. */
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

      // Add: a card shows for each added address
      await profilePage.addAddress('shipping', phone);
      await profilePage.verifyAddressCard('shipping', phone);
      await profilePage.addAddress('billing', phone);
      await profilePage.verifyAddressCard('billing', phone);

      // Edit: only the shipping phone
      await profilePage.editAddressPhone('shipping', editedPhone);
      await profilePage.verifyAddressCard('shipping', editedPhone);

      // Checkout: the added address on delivery / billing, then the edited phone (its contact step can hide the addresses)
      await cartPage.clearCart();
      await addToCart(site.product.imSku);
      await cartPage.prepareCartPage();
      await cartPage.clickContinueToCheckout();
      await checkoutPage.openDeliveryAddressStep();
      await checkoutPage.verifyDeliveryAddressOnCheckout(site.shipping.address1);
      await checkoutPage.verifyBillingAddressOnCheckout(site.shipping.address1);
      await checkoutPage.verifyContactPhoneOnCheckout(editedPhone);

      // Delete: Search leaves Checkout for a screen with BNB, then every shipping / billing address is deleted and checked
      await checkoutPage.selectHeaderIcon('search');
      await profilePage.prepareAddressPage();
      await profilePage.clearAllAddresses();
    });
  });
});
