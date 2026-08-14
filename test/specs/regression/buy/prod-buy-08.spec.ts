import { runOrSkip } from '../../../helpers/tc-filter.helper';

describe('PROD_BUY_08', () => {
  it('add products from add-on page to cart', async function () {
    await runOrSkip.call(this, 'PROD_BUY_08', async () => {
      // TODO: reimplement using new BcPage API
    });
  });
});
