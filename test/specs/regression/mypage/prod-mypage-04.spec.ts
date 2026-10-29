import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { MypagePage } from '../../../pages/mypage.page';

/** Verify the Recommended Product area shows under Registered Products and its first product card opens its BC/PD page. */
describe('PROD_MYPAGE_04', () => {
  const mypagePage = new MypagePage();

  it('Recommended Product under Registered Devices redirects to BC/PD', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_04', async () => {
      await mypagePage.prepareMypage();

      await mypagePage.verifyRegisteredProductsShown();
      await mypagePage.verifyRecommendedAreaShown();
      await mypagePage.verifyRecommendedAreaBelowRegisteredProducts();

      const productName = await mypagePage.clickFirstRecommendedProduct();
      await mypagePage.verifyRecommendedProductPage(productName);
    });
  });
});
