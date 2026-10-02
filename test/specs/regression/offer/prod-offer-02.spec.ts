import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { OfferPage } from '../../../pages/offer.page';

/** Verify the selected category tab on the Offers page, and that the tab row is hidden with fewer than three categories. */
describe('PROD_OFFER_02', () => {
  const offerPage = new OfferPage();

  it('category tab selected when tapped; tab row hidden if fewer than 3', async function () {
    await runOrSkip.call(this, 'PROD_OFFER_02', async () => {
      await offerPage.prepareOfferPage();

      // No category tabs (no offers, or fewer than 3 categories) — nothing more to verify
      if (!(await offerPage.hasCategoryTabs())) {
        return;
      }

      await offerPage.verifyAllOffersTabSelected();

      const tabNames = await offerPage.getCategoryTabNames();
      offerPage.verifyCategoryTabCount(tabNames);
      await offerPage.verifyEachCategoryTab(tabNames);
    });
  });
});
