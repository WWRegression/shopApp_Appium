import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { OfferPage } from '../../../pages/offer.page';

describe('PROD_OFFER_01', () => {
  const offerPage = new OfferPage();

  it('RTB section redirects to the correct page', async function () {
    await runOrSkip.call(this, 'PROD_OFFER_01', async () => {
      await offerPage.openRtbSection();
    });
  });
});
