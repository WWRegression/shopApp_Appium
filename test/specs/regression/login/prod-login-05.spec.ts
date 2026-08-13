import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { CartPage } from '../../../pages/cart.page';

describe('PROD_LOGIN_05', () => {
  const cartPage = new CartPage();

  it('Guest - auto login via Continue to checkout CTA', async function () {
    await runOrSkip.call(this, 'PROD_LOGIN_05', async () => {
      await cartPage.proceedToCheckout();
    });
  });
});
