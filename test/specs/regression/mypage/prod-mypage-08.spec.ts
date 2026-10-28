import { runOrSkip } from '../../../helpers/tc-filter.helper';
import { MypagePage } from '../../../pages/mypage.page';

/** Verify the Search and Chat icons on Account open the search box and the chat page. */
describe('PROD_MYPAGE_08', () => {
  const mypagePage = new MypagePage();

  it('Search/Chat icons on Account redirect correctly', async function () {
    await runOrSkip.call(this, 'PROD_MYPAGE_08', async () => {
      await mypagePage.prepareMypage();
      await mypagePage.verifyPageByTitleAndBnb('mypage');
      await mypagePage.verifySearch();
      await mypagePage.verifyChat();
    });
  });
});
