import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';

/** Verify each Bottom Navigation Bar (Home/Shop/Offers/Cart/Account) redirects to the correct page. */
describe('PROD_HOME_03', () => {
  const homePage = new HomePage();

  it('BNB Home/Shop/Offers/Cart/Account redirects correctly', async function () {
    await runOrSkip.call(this, 'PROD_HOME_03', async () => {
      // Home
      await homePage.selectBnbMenu('home');
      await homePage.verifyPageByTitleAndBnb('home');
      await homePage.verifyChat();
      await homePage.verifySearch();

      // Shop
      await homePage.selectBnbMenu('shop');
      await homePage.verifyPageByTitleAndBnb('shop');
      await homePage.verifyChat();
      await homePage.verifySearch();

      // Offers
      await homePage.selectBnbMenu('offers');
      await homePage.verifyPageByTitleAndBnb('offers');
      await homePage.verifyChat();
      await homePage.verifySearch();

      // Cart
      await homePage.selectBnbMenu('cart');
      await homePage.verifyPageByTitleAndBnb('cart');
      await homePage.verifyChat();
      await homePage.verifySearch();

      // Account
      await homePage.selectBnbMenu('mypage');
      await homePage.verifyPageByTitleAndBnb('mypage');
      await homePage.verifyChat();
      await homePage.verifySearch();
    });
  });
});
