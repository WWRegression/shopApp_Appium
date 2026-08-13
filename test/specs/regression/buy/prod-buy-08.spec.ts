import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { BcPage } from '../../../pages/bc.page';

describe('PROD_BUY_08', () => {
  const bcPage = new BcPage();

  it('add products from add-on page to cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_08', async () => {
      await bcPage.proceedToCart();
    });
  });
});
