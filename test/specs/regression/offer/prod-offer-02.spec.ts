import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { OfferPage } from '../../../pages/offer.page';

/** Verify the selected category tab on the Offers page, that the tab row is hidden with fewer than three categories, and the T&C at the bottom. */
describe('PROD_OFFER_02', () => {
  const offerPage = new OfferPage();

  it('category tab selected when tapped; tab row hidden if fewer than 3', async function () {
    await runOrSkip.call(this, 'PROD_OFFER_02', async () => {
      await offerPage.prepareOfferPage();

      // No tab row (no offers, or fewer than 3 categories): the Main KV page and the T&C are checked
      if (!(await offerPage.hasCategoryTabs())) {
        await offerPage.verifyMainKvWithoutTabs();
        await offerPage.verifyTerms();
        return;
      }

      await offerPage.verifyAllOffersTabSelected();

      const tabNames = await offerPage.getCategoryTabNames();
      offerPage.verifyCategoryTabCount(tabNames);
      await offerPage.verifyEachCategoryTab(tabNames);

      // T&C is only under the first tab (Featured), where the tab loop ends
      await offerPage.verifyTerms();
    });
  });
});
