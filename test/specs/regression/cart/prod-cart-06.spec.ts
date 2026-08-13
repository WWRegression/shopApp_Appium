import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { PdPage } from '../../../pages/pd.page';

describe('PROD_CART_06', () => {
  const pdPage = new PdPage();

  it('open PD/BC from product name on cart', async function () {
    await runOrSkip.call(this, 'PROD_CART_06', async () => {
      await pdPage.getProductName();
    });
  });
});
