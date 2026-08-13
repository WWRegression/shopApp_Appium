import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CheckoutPage } from '../../../pages/checkout.page';

describe('PROD_LOGIN_07', () => {
  const checkoutPage = new CheckoutPage();

  it('Guest - auto login via Login CTA on checkout', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_07', async () => {
      await checkoutPage.verifyOnCheckout();
    });
  });
});
