import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';

/** Verify T&C and hyperlinks redirection is correct and T&C is displayed as folded by default. */
describe('PROD_HOME_04', () => {
  const homePage = new HomePage();

  it('T&C folded by default and hyperlinks redirect correctly', async function () {
    await runOrSkip.call(this, 'PROD_HOME_04', async () => {
      await homePage.prepareHomePage();
      if (!(await homePage.isTermsShown())) {
        return;
      }
      await homePage.verifyTermsFolded();
      await homePage.verifyTermsLinks();
    });
  });
});
