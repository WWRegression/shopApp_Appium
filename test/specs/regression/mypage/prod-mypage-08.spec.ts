import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { MypagePage } from '../../../pages/mypage.page';
import { SearchPage } from '../../../pages/search.page';

/** Header Search/Chat icons on Account open the search area and the chat page. */
describe('PROD_MYPAGE_08', () => {
  const mypagePage = new MypagePage();
  const searchPage = new SearchPage();

  it('Header Search/Chat icons on Account open correctly', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_08', async () => {
      await mypagePage.prepareMypage();
      await mypagePage.verifyPageByTitleAndBnb('mypage');
      await searchPage.openAndVerifyHeaderSearch();
      await mypagePage.openAndVerifyHeaderChat();
    });
  });
});
