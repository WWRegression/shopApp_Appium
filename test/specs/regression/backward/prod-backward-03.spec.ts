import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { OfferPage } from '../../../pages/offer.page';
import { SearchPage } from '../../../pages/search.page';

describe('PROD_BACKWARD_03', () => {
  const offerPage = new OfferPage();
  const searchPage = new SearchPage();

  it('back navigation from Chat, Home/Offers KV, search BC/PD', async function () {
    await runOrSkip.call(this, 'PROD_BACKWARD_03', async (site) => {
      await offerPage.openRtbSection();
      await searchPage.searchByKeyword(site.search.keyword);
      // TODO: reimplement using new PfPage API
    });
  });
});
