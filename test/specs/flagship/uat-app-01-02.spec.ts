import { getRunConfig } from '../../../config/run.config';
import { runOrSkip } from '../../helpers/tc-filter.helper';
import { loadFlagshipProducts } from '../../helpers/flagship-sku.helper';

describe('UAT_APP_01 / UAT_APP_02', () => {
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
       
        prevPassed = true;
      });
    });

    it(`UAT_APP_02 [${product.sku}]`, async function () {
      await runOrSkip.call(this, 'UAT_APP_02', async () => {
        if (!prevPassed) {
          throw new Error(`UAT_APP_01 failed sku=${product.sku}`);
        }
        if (!canGoToCart) {
       
        }
       
      });
    });
  }
});
