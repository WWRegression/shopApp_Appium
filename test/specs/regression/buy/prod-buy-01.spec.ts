import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { SearchPage } from '../../../pages/search.page';
import { BcPage } from '../../../pages/bc.page';
import { CartPage } from '../../../pages/cart.page';

/**
 * PROD_BUY_01 (pilot)
 * BC에서 Trade-In 추가 → Cart에서 적용 여부 검증
 */
describe('PROD_BUY_01', () => {
  const searchPage = new SearchPage();
  const bcPage = new BcPage();
  const cartPage = new CartPage();

  it('add Trade-In on BC and verify in cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_01', async (site) => {
      await searchPage.searchByKeyword(site.product.sku);
      await searchPage.openProductFromResults(site.product.sku);

      await bcPage.tradeIn.addService(site.tradeIn);
      await bcPage.tradeIn.verifyServiceApplied();

      await cartPage.ready();
      await cartPage.tradeIn.verifyServiceApplied();
    });
  });
});
