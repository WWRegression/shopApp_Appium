import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { STORE_OPTIONS } from '../../../locators/mypage.locator';
import { MypagePage } from '../../../pages/mypage.page';
import { ShopPage } from '../../../pages/shop.page';

/** Verify the Select Store sheet on My Page shows the site's Student / Corporate store options, and each opens its store. */
describe('PROD_MYPAGE_07', () => {
  const mypagePage = new MypagePage();
  const shopPage = new ShopPage();

  it('Estore/EPP option displayed on Account page', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_07', async (site) => {
      const stores = mypagePage.getAvailableStoreOptions(site);

      await mypagePage.prepareMypage();
      await mypagePage.clickSelectStore();
      for (const store of STORE_OPTIONS) {
        await mypagePage.verifyStoreOptionShown(store, stores.includes(store));
      }

      for (const store of stores) {
        await mypagePage.ensureStoreOptionShown(store);
        await mypagePage.selectStoreOption(store);
        await shopPage.verifyShopMenuPage(store);
        await mypagePage.pressBack();
      }
      // Close the sheet when no store page was opened
      if (!stores.length) {
        await mypagePage.pressBack();
      }
    });
  });
});
