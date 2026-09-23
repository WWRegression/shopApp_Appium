import { getRunConfig } from '../../../config/run.config';
import { runOrSkip } from '../../helpers/tc-filter.helper';
import { loadFlagshipProducts, toCartItemOptions, toShopCategory } from '../../helpers/flagship-sku.helper';
import { getCurrentWebViewPage } from '../../helpers/context.helper';
import { ShopPage } from '../../pages/shop.page';
import { PfPage } from '../../pages/pf.page';
import { BcPage } from '../../pages/bc.page';
import { PdPage } from '../../pages/pd.page';
import { CartPage } from '../../pages/cart.page';
import { SplashPage } from '../../pages/splash.page';

describe('UAT_APP_01 / UAT_APP_02', () => {
  const products = loadFlagshipProducts(getRunConfig().siteCode);

  if (products.length === 0) {
    it('no flagship SKUs for this site', function () {
      this.skip();
    });
    return;
  }

  for (const product of products) {
    let app01Passed = false;

    it(`UAT_APP_01 [${product.sku}]`, async function () {
      app01Passed = false;
      await runOrSkip.call(this, 'UAT_APP_01', async () => {
        const cartPage = new CartPage();
        const shopPage = new ShopPage();
        const pfPage = new PfPage();
        await cartPage.clearCart();
        await shopPage.openCategory(toShopCategory(product));
        await pfPage.selectPfCard({ mode: 'exact', product: product.deviceName, exclusiveOnly: false });
        console.log('UAT_APP_01 =============> Start');
        const page = (await getCurrentWebViewPage({ waitMs: 10000 })).page;
        console.log('UAT_APP_01 =============> page: ', page);

        if (page === 'bc') {
          const bcPage = new BcPage();
          await bcPage.prepareBcPage();
          await bcPage.selectOptions(product);
          await bcPage.verifyOptions(product);
        } else if (page === 'pd') {
          const pdPage = new PdPage();
          await pdPage.preparePdPage();
          await pdPage.selectOptions(product);
          // await pdPage.verifyOptions(product);
        } else {
          throw new Error(`UAT_APP_01: expected BC or PD, got page=${page} sku=${product.sku}`);
        }

        app01Passed = true;
      });
    });

    it(`UAT_APP_02 [${product.sku}]`, async function () {
      await runOrSkip.call(this, 'UAT_APP_02', async () => {
        if (!app01Passed) {
          this.skip();
        }

        const bcPage = new BcPage();
        const splashPage = new SplashPage();
        const cartPage = new CartPage();
        const { page } = await getCurrentWebViewPage({ waitMs: 10000 });
        console.log('UAT_APP_02 =============> Start page: ', page);

        if (page === 'bc') {
          await bcPage.galaxyClub.selectNoForService();
          await bcPage.tradeIn.selectNoForService();
          await bcPage.scPlus.selectNoForService();
          await bcPage.clickAddToCart();
        } else if (page === 'pd') {
          throw new Error(`UAT_APP_02: PD add-to-cart not implemented yet sku=${product.sku}`);
        } else {
          throw new Error(`UAT_APP_02: expected BC/PD after APP_01, got page=${page} sku=${product.sku}`);
        }

        await splashPage.clickSplashContinue();
        await cartPage.prepareCartPage();
        await cartPage.verifySku(product.sku);
        await cartPage.verifyOptions(product.sku, toCartItemOptions(product));
      });
    });
  }
});
