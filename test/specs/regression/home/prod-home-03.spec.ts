import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';
import { SearchPage } from '../../../pages/search.page';

/** Each BNB tab shows the right page; header Chat/Search open chat page / search area. */
describe('PROD_HOME_03', () => {
  const homePage = new HomePage();
  const searchPage = new SearchPage();

  it('BNB tabs + header Chat/Search open correctly', async function () {
    await runOrSkip.call(this, 'PROD_HOME_03', async () => {
      // Home
      await homePage.selectBnbMenu('home');
      await homePage.verifyPageByTitleAndBnb('home');
      await homePage.openAndVerifyHeaderChat();
      await searchPage.openAndVerifyHeaderSearch();

      // Shop
      await homePage.selectBnbMenu('shop');
      await homePage.verifyPageByTitleAndBnb('shop');
      await homePage.openAndVerifyHeaderChat();
      await searchPage.openAndVerifyHeaderSearch();

      // Offers
      await homePage.selectBnbMenu('offers');
      await homePage.verifyPageByTitleAndBnb('offers');
      await homePage.openAndVerifyHeaderChat();
      await searchPage.openAndVerifyHeaderSearch();

      // Cart
      await homePage.selectBnbMenu('cart');
      await homePage.verifyPageByTitleAndBnb('cart');
      await homePage.openAndVerifyHeaderChat();
      await searchPage.openAndVerifyHeaderSearch();

      // Account
      await homePage.selectBnbMenu('mypage');
      await homePage.verifyPageByTitleAndBnb('mypage');
      await homePage.openAndVerifyHeaderChat();
      await searchPage.openAndVerifyHeaderSearch();
    });
  });
});
