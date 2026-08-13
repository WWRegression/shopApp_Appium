import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { MypagePage } from '../../../pages/mypage.page';
import { HomePage } from '../../../pages/home.page';

describe('PROD_REWARD_01', () => {
  const mypagePage = new MypagePage();
  const homePage = new HomePage();

  it('Rewards Points match on Home, Account, and Samsung Rewards', async function () {
    await runOrSkip.call(this, 'PROD_REWARD_01', async () => {
      await homePage.getRewardsPoints();
      await mypagePage.getAccountName();
    });
  });
});
