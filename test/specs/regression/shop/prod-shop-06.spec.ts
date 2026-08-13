import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { ShopPage } from '../../../pages/shop.page';
import { PfPage } from '../../../pages/pf.page';

describe('PROD_SHOP_06', () => {
  const shopPage = new ShopPage();
  const pfPage = new PfPage();

  it('1 filter and 1 sort-by option work on PF', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_06', async () => {
      await shopPage.openFirstCategory();
      await pfPage.applyFilterAndSort();
    });
  });
});
