import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { MypagePage } from '../../../pages/mypage.page';

describe('PROD_MYPAGE_01', () => {
  const mypagePage = new MypagePage();

  it('profile redirects to the correct page', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_01', async () => {
      await mypagePage.getAccountName();
    });
  });
});
