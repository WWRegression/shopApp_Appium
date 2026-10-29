import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';
import { SearchPage } from '../../../pages/search.page';

/** No result page for blacklist words (Google, Apple, iPhone) and a special character. */
describe('PROD_SEARCH_06', () => {
  const homePage = new HomePage();
  const searchPage = new SearchPage();

  it('blacklist words and a special character show the no-result page', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_06', async () => {
      const blacklistWords = ["google", "apple", "iphone", "@"];
      
      await homePage.prepareHomePage();
      for (const word of blacklistWords) {
        await searchPage.searchByKeyword(word);
        await searchPage.verifyNoResultPage();
      }
    });
  });
});
