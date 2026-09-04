import { getRunConfig } from '../../../config/run.config';
import { runOrSkip } from '../../helpers/tc-filter.helper';
import { loadFlagshipProducts } from '../../helpers/flagship-sku.helper';
import { getCurrentWebViewPage } from '../../helpers/context.helper';
import { ShopPage } from '../../pages/shop.page';
import { PfPage } from '../../pages/pf.page';
import { BcPage } from '../../pages/bc.page';
import { PdPage } from '../../pages/pd.page';

describe('UAT_APP_01 / UAT_APP_02', () => {
  const products = loadFlagshipProducts(getRunConfig().site);

  if (products.length === 0) {
    it('no flagship SKUs for this site', function () {
      this.skip();
    });
    return;
  }

  for (const product of products) {
    // let prevPassed = false;
    // let canGoToCart = false;


    it(`UAT_APP_01 [${product.sku}]`, async function () {
      await runOrSkip.call(this, 'UAT_APP_01', async () => {
        const shopPage = new ShopPage();
        const pfPage = new PfPage();
        await shopPage.openCategory(product.kind === 'phone' ? 'mobile' : 'watch');
        await pfPage.selectPfCard({ mode: 'exact', product: product.device, exclusiveOnly: false });
        const page = (await getCurrentWebViewPage({ waitMs: 10000 })).page;
        console.log('UAT_APP_01 ============> page: ', page);

        if (page === 'bc') {
          const bcPage = new BcPage();
          await bcPage.prepareBcPage();
          await bcPage.selectOptions(product);
          await bcPage.verifyOptions(product);
          await bcPage.verifySku(product.sku);
        } else {
          const pdPage = new PdPage();
          await pdPage.preparePdPage();

          await pdPage.selectOptions(product);
          // await pdPage.verifyOptions(product);
          // await pdPage.verifySku(product.sku);
        }
      });
    });
  }
});
