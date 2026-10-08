import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { markFailed } from '../../../helpers/report.helper';
import { PfPage } from '../../../pages/pf.page';
import { ShopPage, type CategoryMismatch } from '../../../pages/shop.page';

/** Verify L0/L1 category navigation: each page title, and PF vs BC/PD product name on the first L1 (or L0 without L1). */
describe('PROD_SHOP_01', () => {
  const shopPage = new ShopPage();
  const pfPage = new PfPage();

  it('L0/L1 categories show their title and PF product name matches BC/PD', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_01', async () => {
      const mismatches: CategoryMismatch[] = [];
      await shopPage.prepareShopPage();

      const L0Categories = await shopPage.getCategories('L0');
      for (const L0category of L0Categories) {
        await shopPage.selectCategory(L0category);
        if (!(await shopPage.verifyCategoryTitle(mismatches, L0category))) {
          await shopPage.goToPreviousPage(mismatches, 'L0', L0category, L0Categories);
          continue;
        }

        const L1Categories = await shopPage.getCategories('L1');
        if (L1Categories.length === 0) {
          const pfProductName = await pfPage.selectFirstPfCard();
          const bcPdProductName = await pfPage.getBcPdProductName(pfProductName);
          pfPage.verifyProductNameMatch(mismatches, pfProductName, bcPdProductName, L0category);
          await shopPage.goToPreviousPage(mismatches, 'L0', L0category, L0Categories);
          continue;
        }

        for (const [i, L1category] of L1Categories.entries()) {
          await shopPage.selectCategory(L1category);
          if (!(await shopPage.verifyCategoryTitle(mismatches, L0category, L1category))) {
            await shopPage.goToPreviousPage(mismatches, 'L1', L0category, L0Categories, L1Categories);
            continue;
          }
          if (i === 0) {
            const pfProductName = await pfPage.selectFirstPfCard();
            const bcPdProductName = await pfPage.getBcPdProductName(pfProductName);
            pfPage.verifyProductNameMatch(mismatches, pfProductName, bcPdProductName, L0category, L1category);
          }
          await shopPage.goToPreviousPage(mismatches, 'L1', L0category, L0Categories, L1Categories);
        }
        await shopPage.goToPreviousPage(mismatches, 'L0', L0category, L0Categories);
      }
      markFailed(mismatches.map((label) => ({ label, pass: false })), 'PROD_SHOP_01');
    });
  });
});
