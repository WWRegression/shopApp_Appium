import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { OfferPage } from '../../../pages/offer.page';

describe('PROD_OFFER_02', () => {
  const offerPage = new OfferPage();

  it('category icons black when selected; hide filter if fewer than 3', async function () {
    await runOrSkip.call(this, 'PROD_OFFER_02', async () => {
      await offerPage.verifyCategoryFilterBehavior();
    });
  });
});
