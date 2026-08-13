import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';

describe('PROD_HOME_04', () => {
  const homePage = new HomePage();

  it('T&C folded by default and hyperlinks redirect correctly', async function () {
    await runOrSkip.call(this, 'PROD_HOME_04', async () => {
      await homePage.verifyTermsAndConditions();
    });
  });
});
