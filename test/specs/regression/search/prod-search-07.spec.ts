import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';
import { PfPage } from '../../../pages/pf.page';
import { SearchPage } from '../../../pages/search.page';

/** Partial keyword. Suggested Searches lists matching smartphone rows without submitting. */
const KEYWORD = 'S2';

/** Suggested Searches smartphone row opens PF; Products tab count and card names match the keyword. */
describe('PROD_SEARCH_07', () => {
  const homePage = new HomePage();
  const searchPage = new SearchPage();
  const pfPage = new PfPage();

  it('Suggested Searches smartphone opens PF with matching product cards', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_07', async () => {
      await homePage.prepareHomePage();
      await searchPage.openSearch();
      await searchPage.typeKeyword(KEYWORD);

      await searchPage.verifySuggestedSearches(KEYWORD);
      await searchPage.openSuggestedCategory(KEYWORD);
      await pfPage.verifySearchResult([KEYWORD]);
    });
  });
});
