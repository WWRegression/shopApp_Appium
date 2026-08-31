import { runOrSkip } from '../../helpers/tc-filter.helper';
import { resolveProduct, getTypesForSite, writeResolvedSkuEntry } from '../../helpers/product-api.helper';

/**
 * Resolves a valid IM/VD/HA sku per site via API and caches it, so every other TC's
 * getSite() picks up fresh data. Filename is prefixed with `_` to run first in the suite.
 */
describe('CALL_API', () => {
  it('resolve a valid sku per product type via API', async function () {
    await runOrSkip.call(this, 'CALL_API', async (site) => {
      for (const type of getTypesForSite(site.siteCode)) {
        const product = await resolveProduct(site, type);
        if (!product) {
          console.warn(`[${site.siteCode}][${type}] no valid sku found — keeping static value`);
          continue;
        }
        writeResolvedSkuEntry(site.siteCode, type, product);
        console.log(`[${site.siteCode}][${type}] resolved sku=${product.sku}`);
      }
    });
  });
});
