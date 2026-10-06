import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { MypagePage } from '../../../pages/mypage.page';

/** Verify that selecting each Dashboard menu in Account redirects to the correct page. */
describe('PROD_MYPAGE_02', () => {
  const mypagePage = new MypagePage();

  it('each Dashboard menu redirects to the correct page', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_02', async (site) => {
      await mypagePage.prepareMypage();
      await mypagePage.verifyNoJoinRewardsTooltip();

      // Dashboard menus (Rewards / Vouchers / Wishlist)
      for (const menu of mypagePage.getAvailableDashboardMenus(site)) {
        await mypagePage.selectDashboardMenu(menu);
        await mypagePage.verifyDashboardMenuRedirected(menu);

        await mypagePage.pressBack();
        await mypagePage.verifyReturnedToMypage(menu);
      }
    });
  });
});
