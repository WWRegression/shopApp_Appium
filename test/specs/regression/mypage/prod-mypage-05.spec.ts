import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { MypagePage } from '../../../pages/mypage.page';

/** Verify each bottom menu of My Page (Support ~ Logout) and every sub-menu under it redirects to the correct page. */
describe('PROD_MYPAGE_05', () => {
  const mypagePage = new MypagePage();

  it('each sub-menu (Support~Logout) redirects correctly', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_05', async (site) => {
      await mypagePage.prepareMypage();
      await mypagePage.verifySupportBelowProductsArea();

      for (const menu of mypagePage.getAvailableSettingsMenus(site)) {
        const menuLabel = await mypagePage.selectSettingsMenu(menu);
        if (!menuLabel) {
          continue;
        }
        await mypagePage.verifySettingsMenuPage(menu, menuLabel);

        await mypagePage.pressBack();
        await mypagePage.verifyReturnedToMypage(menu);
      }
    });
  });
});
