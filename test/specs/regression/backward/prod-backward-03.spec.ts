import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';
import { OfferPage } from '../../../pages/offer.page';
import { PfPage } from '../../../pages/pf.page';
import { SearchPage } from '../../../pages/search.page';

/** Verify Back returns to the right page from Chat, the Home main KV, Offers contents and a search result BC/PD. */
describe('PROD_BACKWARD_03', () => {
  const homePage = new HomePage();
  const offerPage = new OfferPage();
  const searchPage = new SearchPage();
  const pfPage = new PfPage();

  it('back navigation from Chat, Home/Offers KV, search BC/PD', async function () {
    await runOrSkip.call(this, 'PROD_BACKWARD_03', async (site) => {
      // Chat > Back > Home
      await homePage.prepareHomePage();
      await homePage.clickChat();
      await homePage.verifyChatOpened();
      await homePage.pressDeviceBack();
      await homePage.verifyPageByTitleAndBnb('home');

      // Home main KV > Back > Home
      await homePage.clickMainKv();
      await homePage.verifySubPageOpened('Home main KV');
      await homePage.pressDeviceBack();
      await homePage.verifyPageByTitleAndBnb('home');

      // Offers link/KV > Back > Offers
      await offerPage.prepareOfferPage();
      await offerPage.clickOfferContents();
      await offerPage.verifySubPageOpened('Offers contents');
      await offerPage.pressDeviceBack();
      await offerPage.verifyPageByTitleAndBnb('offers');

      // Search result PF card > BC/PD > Back > search results
      await searchPage.searchByKeyword(site.search.keyword);
      const pfProductName = await pfPage.selectFirstPfCard(true);
      await pfPage.verifyBcPdProductName(pfProductName);
      await pfPage.pressDeviceBack();
      await searchPage.verifyReturnedToSearchResults();
      await pfPage.verifyPfPage();
    });
  });
});
