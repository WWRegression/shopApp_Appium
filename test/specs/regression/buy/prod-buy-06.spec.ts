import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { PdPage } from '../../../pages/pd.page';

describe('PROD_BUY_06', () => {
  const pdPage = new PdPage();

  it('Native PD is shown', async function () {
    await runOrSkip.call(this, 'PROD_BUY_06', async () => {
      await pdPage.getProductName();
    });
  });
});
