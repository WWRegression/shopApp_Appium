import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { markFailed } from '../../../helpers/report.helper';
import { ShopPage, type CategoryMismatch } from '../../../pages/shop.page';

/** Verify that each menu (Student Store ~ Customer Support) links to the corresponding page. */
describe('PROD_SHOP_03', () => {
  const shopPage = new ShopPage();

  it('each menu (Student Store~Customer Support) links to the corresponding page', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_03', async (site) => {
      const mismatches: CategoryMismatch[] = [];

      for (const menu of shopPage.getShopMenus(site)) {
        await shopPage.prepareShopPage();
        await shopPage.selectShopMenu(menu);

        if (menu === 'customerSupport') {
          const itemCount = await shopPage.getCustomerSupportItemCount();
          if (itemCount === 0) {
            mismatches.push('customerSupport: no sub-menu shown');
          }
          for (let index = 0; index < itemCount; index += 1) {
            const label = await shopPage.selectCustomerSupportItem(index);
            await shopPage.verifyCustomerSupportPage(mismatches, label);
            await shopPage.closeShopMenuPage();
          }
          continue;
        }

        await shopPage.verifyShopMenuPage(mismatches, menu);
        if (menu === 'moreSamsungApps') {
          await shopPage.verifyMoreSamsungApps(mismatches);
        }
        await shopPage.closeShopMenuPage();
      }

      markFailed(mismatches.map((label) => ({ label, pass: false })), 'PROD_SHOP_03');
    });
  });
});
