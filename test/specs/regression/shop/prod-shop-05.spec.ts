import { runOrSkip } from '../../../helpers/tc-filter.helper';

describe('PROD_SHOP_05', () => {
  it('Guest User - wishlist icon shows login popup', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_05', async () => {
      // TODO: guest wishlist login popup
    });
  });
});
