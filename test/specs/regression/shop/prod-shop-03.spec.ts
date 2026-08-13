import { runOrSkip } from '../../../helpers/tc-filter.helper';

describe('PROD_SHOP_03', () => {
  it('each menu (SamsungStore~CustomerSupport) links correctly', async function () {
    await runOrSkip.call(this, 'PROD_SHOP_03', async (site) => {
      // TODO: verify menus from site.menus when populated
      void site.menus;
    });
  });
});
