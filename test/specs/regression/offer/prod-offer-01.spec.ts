import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { OfferPage } from '../../../pages/offer.page';

/** Verify that selecting the RTB section in the Offers redirects to the correct page. */
describe('PROD_OFFER_01', () => {
  const offerPage = new OfferPage();

  it('RTB section redirects to the correct page', async function () {
    await runOrSkip.call(this, 'PROD_OFFER_01', async () => {
      await offerPage.prepareOfferPage();

      await offerPage.verifyRtbShown();
      await offerPage.verifyRtbRedirects();
    });
  });
});
