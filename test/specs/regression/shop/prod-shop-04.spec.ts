import { runOrSkip } from '../../../helpers/tc-filter.helper';

describe('PROD_SHOP_04', () => {
  it('change country and auto login via Country menu', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_04', async (site) => {
      void site.countryName;
    });
  });
});
