import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { HomePage } from '../../../pages/home.page';
import { MypagePage } from '../../../pages/mypage.page';

/** Verify same Rewards Points on Home, Account, and Samsung Rewards pages. */
describe('PROD_REWARD_01', () => {
  const homePage = new HomePage();
  const mypagePage = new MypagePage();

  it('Rewards Points match on Home, Account, and Samsung Rewards', async function () {
    await runOrSkip.call(this, 'PROD_REWARD_01', async () => {
      // The previous TC can end on any screen, so start from Home
      await homePage.prepareHomePage();
      const homePoints = await homePage.getRewardsPoints();

      await mypagePage.verifyNoJoinRewardsTooltip();
      const mypagePoints = await mypagePage.getRewardsPoints();
      const rewardsPagePoints = await mypagePage.getRewardsPointsOnRewardsPage();

      mypagePage.verifyRewardsPointsMatch(homePoints, mypagePoints, rewardsPagePoints);
    });
  });
});
