import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { PfPage } from '../../../pages/pf.page';
import { ShopPage } from '../../../pages/shop.page';

/** Verify 1 filter and 1 sort by option work properly on the PF page. */
describe('PROD_SHOP_06', () => {
  const shopPage = new ShopPage();
  const pfPage = new PfPage();

  it('1 filter and 1 sort-by option work on PF', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_06', async () => {
      await shopPage.openCategory('mobile');
      await pfPage.verifyPfPage();

      const filter = await pfPage.applyFilter();
      const sort = await pfPage.applySort();
      await pfPage.verifyFilterAndSort(filter, sort);
    });
  });
});
