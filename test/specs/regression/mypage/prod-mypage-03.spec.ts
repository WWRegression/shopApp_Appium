import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { MypagePage } from '../../../pages/mypage.page';

/** Verify that selecting each menu (My Orders~Inbox) in Account redirects to the correct page. */
describe('PROD_MYPAGE_03', () => {
  const mypagePage = new MypagePage();

  it('each menu (My Orders~Inbox) redirects to the correct page', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_03', async (site) => {
      await mypagePage.prepareMypage();

      // Menus below the dashboard (My Orders / My Repairs / My Referrals / Inbox / My SmartThings ...) — vary by site
      for (const menu of mypagePage.getAvailableProductMenus(site)) {
        const menuLabel = await mypagePage.selectProductMenu(menu);
        await mypagePage.verifyProductMenuRedirected(menuLabel);

        await mypagePage.pressBack();
        await mypagePage.verifyReturnedToMypage(menu);
      }
    });
  });
});
