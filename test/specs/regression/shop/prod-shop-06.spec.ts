import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { ShopPage } from '../../../pages/shop.page';

describe('PROD_SHOP_06', () => {
  const shopPage = new ShopPage();

  it('1 filter and 1 sort-by option work on PF', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_06', async () => {
      await shopPage.openFirstCategory();
      // TODO: reimplement using new PfPage API
    });
  });
});
