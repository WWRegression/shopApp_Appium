import { runOrSkip } from '../../../helpers/tc-filter.helper';

describe('PROD_BUY_07', () => {
  it('AR function on TV/Monitor PD', async function () {
    await runOrSkip.call(this, 'PROD_BUY_07', async (site) => {
      void site.search.vdSku;
    });
  });
});
