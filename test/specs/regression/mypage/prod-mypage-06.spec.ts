import { runOrSkip } from '../../../helpers/tc-filter.helper';

describe('PROD_MYPAGE_06', () => {
  it('add/edit delivery/billing address reflected on Checkout', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_06', async (site) => {
      void site.shipping;
    });
  });
});
