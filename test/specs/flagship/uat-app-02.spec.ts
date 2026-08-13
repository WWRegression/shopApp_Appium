import { runOrSkip } from '../../helpers/tc-filter.helper';
import { BcPage } from '../../pages/bc.page';

describe('UAT_APP_02', () => {
  const bcPage = new BcPage();

  it('product added to cart verification', async function () {
    await runOrSkip.call(this, 'UAT_APP_02', async () => {
      await bcPage.proceedToCart();
    });
  });
});
