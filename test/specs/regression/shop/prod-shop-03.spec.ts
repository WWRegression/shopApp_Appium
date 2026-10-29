import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { markFailed } from '../../../helpers/report.helper';
import { ShopPage } from '../../../pages/shop.page';

/** Verify that each menu (Student Store ~ Customer Support) links to the corresponding page. */
describe('PROD_SHOP_03', () => {
  const shopPage = new ShopPage();

  it('each menu (Student Store~Customer Support) links to the corresponding page', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_03', async (site) => {
      for (const menu of shopPage.getShopMenus(site)) {
        await shopPage.prepareShopPage();
        if (!(await shopPage.selectShopMenu(menu))) {
          continue;
        }

        if (menu === 'customerSupport') {
          const itemCount = await shopPage.getCustomerSupportItemCount();
          markFailed([{ label: 'customerSupport: no sub-menu shown', pass: itemCount > 0 }], 'PROD_SHOP_03');
          for (let index = 0; index < itemCount; index += 1) {
            const label = await shopPage.selectCustomerSupportItem(index);
            await shopPage.verifyCustomerSupportPage(label);
            await shopPage.closeShopMenuPage();
          }
          continue;
        }

        await shopPage.verifyShopMenuPage(menu);
        if (menu === 'moreSamsungApps') {
          await shopPage.verifyMoreSamsungApps();
        }
        await shopPage.closeShopMenuPage();
      }
    });
  });
});
