import { runOrSkip } from '../../helpers/tc-filter.helper';
import { resolveProduct, getTypesForSite, writeResolvedSkuEntry } from '../../helpers/product-api.helper';

/**
 * Katalon CALL_API TC equivalent. Filename is prefixed with `_` so it sorts before every
 * other regression spec and runs first — resolves a valid IM/VD/HA sku for the current
 * site via API and caches it (config/cache/resolved-sku.json) so every other TC's
 * getSite()/loadSite() picks up fresh data for the rest of the suite run.
 */
describe('CALL_API', () => {
  it('resolve a valid sku per product type via API', async function () {
    this.timeout(120000);
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
