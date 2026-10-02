import { BasePage } from './base.page';
import { MypageLocator } from '../locators/mypage.locator';
import { LoginPage } from './login.page';
import { prepareWebViewPage, switchToNative } from '../helpers/context.helper';
import { parsePoints } from '../helpers/data.helper';
import { getBrowserPages } from '../helpers/device.helper';
import {
  clickElement,
  clickIfDisplayed,
  getElementLabel,
  isDisplayedOrFalse,
  scrollUntilVisible,
  waitForDisplayedOrFalse,
} from '../helpers/element.helper';
import { flingToEnd, swipeByBoundary, tapAtCoordinates } from '../helpers/gesture.helper';
import { markFailed } from '../helpers/report.helper';

/** Katalon loginOnMypage taps this offset inside the profile card instead of the element center. */
const LOGIN_TAP_OFFSET = { x: 350, y: 150 };

export class MypagePage extends BasePage {
  private readonly locator = new MypageLocator();
  private readonly loginPage = new LoginPage();
  /** Page ids captured as a baseline before the loop starts — excluded when detecting new items. */
  private readonly knownPageIds = new Set<string>();

  /** Katalon MyPage.tapMenu() equivalent — scrolls to and clicks the menu button with this on-screen label. */
  async selectMenu(label: string): Promise<void> {
    console.log(`[selectMenu] label="${label}"`);
    const button = this.locator.menuButton(label);
    await button.waitForExist({ timeout: 3000 }).catch(() => undefined);
    const found = await scrollUntilVisible(button);
    console.log(`[selectMenu] found=${found}`);
    if (found) {
      await button.click();
      console.log(`[selectMenu] clicked "${label}"`);
    }
  }

  /**
   * subMenuItems matches on @content-desc presence alone, so loading/empty
   * placeholder rows can slip in — keep only rows with a non-empty content-desc.
   * Shared by getSubMenuCount()/clickItemAt() so both use the same criteria.
   */
  private async getValidSubMenuItems() {
    const items = this.locator.subMenuItems;
    await items[0].waitForExist({ timeout: 3000 }).catch(() => undefined);
    const all = await items;

    const valid = [];
    for (const item of all) {
      const desc = ((await item.getAttribute('content-desc').catch(() => '')) || '').trim();
      if (desc) {
        valid.push(item);
      }
    }
    return valid;
  }

  /** Sub-menu item count — read from the screen since it varies by country. */
  async getSubMenuCount(): Promise<number> {
    await switchToNative();
    const items = await this.getValidSubMenuItems();
    console.log(`[getSubMenuCount] count=${items.length}`);

    // Baseline before the loop — prevents leftover webview pages from earlier
    // sessions being mistaken for newly opened ones.
    this.knownPageIds.clear();
    const existing = await getBrowserPages();
    for (const p of existing) {
      this.knownPageIds.add(p.id);
    }
    console.log(`[getSubMenuCount] baseline page ids=${existing.map((p) => p.id).join(',')}`);

    return items.length;
  }

  /** Clicks the item at index and returns its label (content-desc). */
  async clickItemAt(index: number): Promise<string> {
    await switchToNative();
    const items = await this.getValidSubMenuItems();
    const item = items[index];
    if (!item) {
      console.log(`[clickItemAt] index=${index} not found`);
      return '';
    }

    const itemLabel = ((await item.getAttribute('content-desc').catch(() => '')) || '')
      .trim()
      .toLowerCase();
    console.log(`[clickItemAt] index=${index} label="${itemLabel}" — clicking`);
    await item.click();
    return itemLabel;
  }

  /**
   * Verifies the clicked sub-menu actually navigated there. Katalon
   * MyPage.verifySubMenus() equivalent. Checks whether the label appears in
   * the url (webview) or header title (native). The url is read directly
   * from the chrome devtools socket, staying in NATIVE — no Appium context
   * switch (switchToWebView, several seconds) needed.
   */
  async verifyRedirected(itemLabel: string): Promise<void> {
    console.log(`[verifyRedirected] start menu="${itemLabel}"`);
    if (!itemLabel) {
      console.log('[verifyRedirected] skip — empty label');
      return;
    }

    const page = await this.findWebviewPage();
    let matched: boolean;
    if (page) {
      matched = this.matchesLabel(page.url, itemLabel);
      console.log(
        `[verifyRedirected] context=webview url="${page.url}" title="${page.title}" matched=${matched}`
      );
    } else {
      const headerTitle = await getElementLabel(this.headerLocator.title);
      matched = this.matchesLabel(headerTitle, itemLabel);
      console.log(`[verifyRedirected] context=native header="${headerTitle}" matched=${matched}`);
    }
    expect(matched).toBe(true);

    console.log(`[verifyRedirected] done menu="${itemLabel}"`);
    await this.pressBack();
  }

  /**
   * Polls briefly since the webview may not have appeared yet right after
   * the click. Only ids absent from the baseline (knownPageIds) count as
   * new — leftover webviews are always in the baseline and get excluded.
   */
  private async findWebviewPage(timeoutMs = 4000): Promise<{ url: string; title: string } | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const pages = await getBrowserPages();
      const page = pages.find((p) => p.url && !this.knownPageIds.has(p.id));
      if (page) {
        this.knownPageIds.add(page.id);
        return { url: page.url, title: page.title };
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return null;
  }

  /** Checks whether the label's key word appears in text — both values come from the same screen, so no per-language data is needed. */
  private matchesLabel(text: string, itemLabel: string): boolean {
    const keyword = itemLabel.split(' ').find((w) => w.length > 2) ?? itemLabel;
    return text.toLowerCase().includes(keyword);
  }

  /** Android system back — returns to the sub-menu list screen. */
  async pressBack(): Promise<void> {
    console.log('[pressBack]');
    await switchToNative();
    await driver.back();
  }

  /** Opens My Page via BNB and waits for its title (logs only when missing, like Katalon). */
  private async openMypage(timeoutMs: number): Promise<void> {
    // logout → verifyLoggedOut → clickLogin each open My Page; skip the BNB tap when it is already shown
    await switchToNative();
    if (await isDisplayedOrFalse(this.locator.accountPageTitle)) {
      console.log('[openMypage] already on My Page');
      return;
    }
    await this.selectBnbMenu('mypage');
    if (!(await waitForDisplayedOrFalse(this.locator.accountPageTitle, { timeout: timeoutMs }))) {
      console.log('[openMypage] failed to navigate to My Page');
    }
  }

  /** Katalon swipes My Page down to its top before looking for Login; skipped when Login is already visible. */
  private async scrollToLoginButton(): Promise<void> {
    if (!(await isDisplayedOrFalse(this.locator.loginButton))) {
      await swipeByBoundary('down', 0.95);
    }
  }

  /** Katalon LogIn.loginOnMypage (My Page part) — taps Login; the login page is handled by LoginPage.clickLoginBtnOnLoginPage(). */
  async clickLoginOnMypage(): Promise<void> {
    // Katalon loginOnMypage(IN): logged-out IN shows "Select profile to continue" instead of My Page
    if (await this.loginPage.isSelectProfileShownForIn()) {
      await this.loginPage.loginOnSelectProfileForIn();
      return;
    }
    await this.openMypage(5000);
    await this.scrollToLoginButton();

    const loginButton = this.locator.loginButton;
    if (!(await waitForDisplayedOrFalse(loginButton, { timeout: 5000 }))) {
      console.log('[clickLoginOnMypage] login button not shown');
      return;
    }

    const { x, y } = await loginButton.getLocation();
    const tapX = Math.round(x) + LOGIN_TAP_OFFSET.x;
    const tapY = Math.round(y) + LOGIN_TAP_OFFSET.y;
    console.log(`[clickLoginOnMypage] tap position (${tapX}, ${tapY})`);
    await tapAtCoordinates(tapX, tapY);
  }

  /** Scrolls to Logout at the bottom of My Page (Katalon swipes a fixed 2–3 times; one fling is faster). */
  private async scrollToLogoutButton(): Promise<boolean> {
    // Short My Pages (e.g. CN) already show it — flinging a page that doesn't scroll is slow
    if (await isDisplayedOrFalse(this.locator.logoutButton)) {
      return true;
    }
    await flingToEnd();
    if (await isDisplayedOrFalse(this.locator.logoutButton)) {
      return true;
    }
    // The fling may have hit another scrollable (e.g. a banner) — fall back to step scrolling
    return scrollUntilVisible(this.locator.logoutButton, 5);
  }

  /** Katalon LogIn.logoutOnMypage — logs out from the bottom of My Page if logged in. */
  async logoutOnMypage(): Promise<void> {
    console.log('[logoutOnMypage] start');
    // Katalon logoutOnMypage: the login page means logged out — start as guest and stop
    if (await this.loginPage.isLoginPageShown()) {
      console.log('[logoutOnMypage] login page shown — already logged out, continuing as guest');
      await this.loginPage.continueAsGuest();
      return;
    }
    // "Select profile to continue" (IN) is itself the logged-out state
    if (await this.loginPage.isSelectProfileShownForIn()) {
      console.log('[logoutOnMypage] Select profile screen shown — already logged out, skipping');
      return;
    }
    await this.openMypage(5000);
    // Already logged out (e.g. just after guest entry) → nothing to scroll for
    if (await isDisplayedOrFalse(this.locator.loginButton)) {
      console.log('[logoutOnMypage] already logged out, skipping');
      return;
    }
    const found = await this.scrollToLogoutButton();

    if (found && (await clickIfDisplayed(this.locator.logoutButton, 3000))) {
      console.log('[logoutOnMypage] Logout clicked');
      await clickIfDisplayed(this.locator.logoutOkayButton, 5000);
      // Katalon waits a fixed 10s; wait only until Logout is gone — verifyLoggedOut checks the Login button afterwards
      await this.locator.logoutButton.waitForDisplayed({ timeout: 10000, reverse: true }).catch(() => undefined);
    }
    console.log('[logoutOnMypage] end');
  }

  /** Katalon LogIn.isLogOutStatus — Login button must be shown at the top of My Page. */
  async verifyLoggedOut(): Promise<void> {
    // Katalon isLogOutStatus(IN): the "Select profile to continue" screen itself means logged out
    if (await this.loginPage.isSelectProfileShownForIn()) {
      console.log('[verifyLoggedOut] Select profile screen shown — logged out');
      return;
    }
    await this.openMypage(5000);
    await this.scrollToLoginButton();

    const loggedOut = await waitForDisplayedOrFalse(this.locator.loginButton, { timeout: 10000 });
    console.log(`[verifyLoggedOut] ${loggedOut}`);
    if (!loggedOut) {
      // Katalon: log back in before failing so the next TC doesn't start from a broken login state
      console.log('[verifyLoggedOut] not logged out — trying to log back in before failing');
      await this.clickLoginOnMypage().catch(() => undefined);
      await this.loginPage.clickLoginBtnOnLoginPage().catch(() => undefined);
    }
    markFailed([{ label: 'user is not logged out (Login button not found on My Page)', pass: loggedOut }], 'verifyLoggedOut');
  }

  /** Katalon LogIn.ensureLoginStatus — logs in with the device account unless already logged in (no failure). */
  async ensureLoggedIn(): Promise<void> {
    // A logged-out app can open on the login page (no BNB) — its login button logs in with the device account
    if (await this.loginPage.isLoginPageShown()) {
      console.log('[ensureLoggedIn] login page shown — logging in');
      await this.loginPage.clickLoginBtnOnLoginPage();
      return;
    }
    // "Select profile" (IN) has no BNB to reach My Page — clickLoginOnMypage logs in from it
    if (!(await this.loginPage.isSelectProfileShownForIn()) && (await this.isLoggedIn())) {
      console.log('[ensureLoggedIn] already logged in');
      return;
    }
    console.log('[ensureLoggedIn] not logged in — logging in');
    await this.clickLoginOnMypage();
    await this.loginPage.clickLoginBtnOnLoginPage();
  }

  /** True when Logout is found at the bottom of My Page. */
  private async isLoggedIn(): Promise<boolean> {
    // Katalon's 2s delay isn't needed: openMypage already waits for the My Page title
    await this.openMypage(10000);
    return this.scrollToLogoutButton();
  }

  /** Katalon LogIn.isLogInStatus — Logout button must be found at the bottom of My Page. */
  async verifyLoggedIn(): Promise<void> {
    let loggedIn = await this.isLoggedIn();
    if (!loggedIn) {
      // Login can still be completing in the background (CN authorizes after the tap) — Katalon also re-checks 3 times
      console.log('[verifyLoggedIn] Logout not found yet — re-checking for up to 15s');
      loggedIn = await driver
        .waitUntil(() => this.isLoggedIn(), { timeout: 15000, interval: 2000 })
        .then(() => true, () => false);
    }
    console.log(`[verifyLoggedIn] ${loggedIn}`);
    markFailed([{ label: 'user is not logged in (Logout button not found on My Page)', pass: loggedIn }], 'verifyLoggedIn');
  }

  /** Katalon Reward.checkJoinRewardsTooltipOnMyPage — the "Join Samsung Rewards" tooltip must not show on My Page. */
  async verifyNoJoinRewardsTooltip(): Promise<void> {
    await this.openMypage(5000);
    const shown = await isDisplayedOrFalse(this.locator.joinRewardsTooltip);
    markFailed([{ label: '"Join Samsung Rewards" tooltip is shown on My Page', pass: !shown }], 'verifyNoJoinRewardsTooltip');
  }

  /** Katalon Reward.getPointsMyPage — Rewards points shown on the My Page dashboard. */
  async getRewardsPoints(): Promise<number> {
    await this.openMypage(5000);
    const shown = await waitForDisplayedOrFalse(this.locator.rewardsPoints, { timeout: 5000 });
    markFailed([{ label: 'Rewards points not found on My Page', pass: shown }], 'getRewardsPoints');
    const points = parsePoints(await getElementLabel(this.locator.rewardsPoints));
    console.log(`[getRewardsPoints] My Page points=${points}`);
    return points;
  }

  /** Katalon Reward.getPointsRewardsPage — opens the Samsung Rewards web page from My Page and reads its points. */
  async getRewardsPointsOnRewardsPage(): Promise<number> {
    await clickElement(this.locator.rewardsPoints, { timeout: 3000 });
    const ready = await prepareWebViewPage('mypageRewards', this.locator.rewardsPagePoints, 15000);
    // Must be displayed: a hidden dashboard still holds a default "0 P" in the DOM, which would pass by accident
    const shown = ready && (await waitForDisplayedOrFalse(this.locator.rewardsPagePoints, { timeout: 8000 }));
    markFailed([{ label: 'Rewards points not shown on the Samsung Rewards page', pass: shown }], 'getRewardsPointsOnRewardsPage');
    const points = parsePoints(await this.locator.rewardsPagePoints.getText());
    console.log(`[getRewardsPointsOnRewardsPage] Rewards page points=${points}`);
    await switchToNative();
    return points;
  }

  /** Katalon Reward.comparePointsAcrossPages — the three points values must be the same. */
  verifyRewardsPointsMatch(homePoints: number, mypagePoints: number, rewardsPagePoints: number): void {
    const same = homePoints === mypagePoints && homePoints === rewardsPagePoints;
    const detail = `Home=${homePoints}, My Page=${mypagePoints}, Rewards page=${rewardsPagePoints}`;
    console.log(`[verifyRewardsPointsMatch] ${same} (${detail})`);
    markFailed([{ label: 'Rewards points differ', pass: same, detail }], 'verifyRewardsPointsMatch');
  }

  async getAccountName(): Promise<string> {
    // TODO: Implement account name retrieval
    return await this.locator.accountName.getText();
  }
}
