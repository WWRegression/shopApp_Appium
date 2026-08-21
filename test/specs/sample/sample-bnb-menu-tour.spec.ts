import { getSite } from '../../helpers/tc-filter.helper';
import { MypagePage } from '../../pages/mypage.page';

/**
 * SAMPLE — demo spec, not registered in the regression catalog (test-case.catalog.ts).
 * Run only via `npx wdio run wdio.conf.ts --spec test/specs/sample/sample-bnb-menu-tour.spec.ts`.
 *
 * Enters the main menu only if enabled in site.json (mypageMenuList.support);
 * sub-menu count is read dynamically from the screen and every item is clicked and verified.
 */
describe('SAMPLE_BNB_MENU_TOUR', () => {
  const mypagePage = new MypagePage();

  it('Verify MyPage > Support sub-menu', async function () {
    const site = getSite();
    if (!site.mypageMenuList?.support) {
      return;
    }

    await mypagePage.selectBnbMenu('mypage');
    await mypagePage.selectMenu('Support');

    const subMenuCount = await mypagePage.getSubMenuCount();
    for (let i = 0; i < subMenuCount; i++) {
      console.log(`[LOOP] iteration ${i + 1}/${subMenuCount}`);
      const itemLabel = await mypagePage.clickItemAt(i);
      await mypagePage.verifyRedirected(itemLabel);
    }

    await mypagePage.pressBack();
  });
});
