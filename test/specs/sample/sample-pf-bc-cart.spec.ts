import { getSite } from '../../helpers/tc-filter.helper';
import { SearchPage } from '../../pages/search.page';
import { PfPage } from '../../pages/pf.page';
import { BcPage } from '../../pages/bc.page';
import { CartPage } from '../../pages/cart.page';
import { AddOnPage } from '../../pages/addon.page';

/**
 * SAMPLE — 회귀 카탈로그(test-case.catalog.ts)에 등록되지 않은 데모 스펙.
 * regression/flagship glob 밖(test/specs/sample)에 있어 정규 실행에는 포함되지 않고
 * `npx wdio run wdio.conf.ts --spec test/specs/sample/sample-pf-bc-cart.spec.ts` 로만 실행된다.
 *
 * 흐름: Cart 비우기 → 제품명 검색 → 상위 PF 카드 클릭 → BC 옵션 선택 → Galaxy Club/TradeIn/SC+ No → Cart 진입
 */
describe('SAMPLE_PF_BC_CART', () => {
  const searchPage = new SearchPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const cartPage = new CartPage();
  const addOnPage = new AddOnPage();

  it('search product, select BC options, decline service, reach cart', async function () {
    const site = getSite();

    await cartPage.clearCart();

    await searchPage.searchByKeyword('Galaxy Z Fold8');
    await pfPage.selectPfCard();

    await bcPage.selectOptions(site.product);
  
    await bcPage.galaxyClub.selectNoForService();
    await bcPage.tradeIn.selectNoForService();
    await bcPage.scPlus.selectNoForService();

    await bcPage.clickAddToCart();
    await addOnPage.clickSplashContinue();
    await cartPage.prepareCartPage();
  });
});
