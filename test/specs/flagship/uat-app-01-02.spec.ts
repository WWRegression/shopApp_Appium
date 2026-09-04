import { getRunConfig } from '../../../config/run.config';
import { runOrSkip } from '../../helpers/tc-filter.helper';
import {
  loadFlagshipProducts,
  toShopCategory,
  toPfCardQuery,
  getSummaryOptions,
} from '../../helpers/flagship-sku.helper';
import { CartPage } from '../../pages/cart.page';
import { ShopPage } from '../../pages/shop.page';
import { PfPage } from '../../pages/pf.page';
import { BcPage } from '../../pages/bc.page';
import { AddOnPage } from '../../pages/addon.page';

describe('UAT_APP_01 / UAT_APP_02', () => {
  const cartPage = new CartPage();
  const shopPage = new ShopPage();
  const pfPage = new PfPage();
  const bcPage = new BcPage();
  const addOnPage = new AddOnPage();

  const products = loadFlagshipProducts(getRunConfig().site);

  if (products.length === 0) {
    it('no flagship SKUs for this site', function () {
      this.skip();
    });
    return;
  }

  for (const product of products) {
    let prevPassed = false;
    let canGoToCart = false;


    it(`UAT_APP_01 [${product.sku}]`, async function () {
      await runOrSkip.call(this, 'UAT_APP_01', async () => {
        await cartPage.clearCart();
        await shopPage.openPfList(toShopCategory(product));
        await pfPage.selectPfCard(toPfCardQuery(product));

        await bcPage.selectOptions(product);
        await bcPage.verifySku(product);
        await bcPage.verifyOptions(product);

        await bcPage.tradeIn.selectNoForService();
        await bcPage.scPlus.selectNoForService();
        await bcPage.galaxyClub.selectNoForService();

        canGoToCart = true;
        prevPassed = true;
      });
    });

    it(`UAT_APP_02 [${product.sku}]`, async function () {
      await runOrSkip.call(this, 'UAT_APP_02', async () => {
        if (!prevPassed) {
          throw new Error(`UAT_APP_01 failed sku=${product.sku}`);
        }
        if (!canGoToCart) {
          this.skip();
          return;
        }

        const summary = getSummaryOptions(product, bcPage.getSelectedOptions());

        await bcPage.clickAddToCart();
        await addOnPage.clickSplashContinue();

        await cartPage.verifySku(product.sku);
        await cartPage.verifyOptions(product.sku, summary);
      });
    });
  }
});
