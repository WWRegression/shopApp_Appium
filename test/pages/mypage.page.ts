import { BasePage } from './base.page';
import { DASHBOARD_MENUS, MypageLocator, type DashboardMenu } from '../locators/mypage.locator';
import { LoginPage, SAMSUNG_ACCOUNT_PACKAGE, SAMSUNG_ACCOUNT_SETTINGS_ACTIVITY } from './login.page';
import { getRunConfig } from '../../config/run.config';
import type { LoadedSite } from '../../config/site';
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
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

/** Katalon loginOnMypage taps this offset inside the profile card instead of the element center. */
const LOGIN_TAP_OFFSET = { x: 350, y: 150 };
/** Katalon tapProfiles taps the name line inside the profile card (a center tap does nothing); CL / PE cards are taller. */
const PROFILE_TAP_OFFSET = { x: 350, y: 230, yForClPe: 260 };
/** Katalon SiteConfig.RTL — the name line is on the right side of the profile card. */
const RTL_SITES = ['AE_AR', 'SA', 'IL'];

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

  /** True when the header title matches the My Page title texts (BasePage.titleTexts.MY_PAGE). */
  async isOnMypage(): Promise<boolean> {
    return this.matchesHeaderTitle('MY_PAGE');
  }

  /** Selects My Page on BNB (skipped when already there), then verifies the My Page header title. */
  async prepareMypage(timeoutMs = 5000): Promise<void> {
    // logout → verifyLoggedOut → clickLogin each prepare My Page; skip the BNB tap when it is already shown
    if (await this.isOnMypage()) {
      console.log('[prepareMypage] already on My Page');
      return;
    }
    await markFailedAndStop(() => this.selectBnbMenu('mypage'), '[prepareMypage] My Page tab not available on BNB');

    const ready = await driver
      .waitUntil(() => this.isOnMypage(), { timeout: timeoutMs, interval: 500 })
      .then(() => true, () => false);
    markFailed([{ label: 'My Page not shown (header title does not match)', pass: ready }], 'prepareMypage');
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
    await this.prepareMypage();
    await this.scrollToLoginButton();

    const loginButton = this.locator.loginButton;
    const shown = await waitForDisplayedOrFalse(loginButton, { timeout: 5000 });
    markFailed([{ label: 'Login button not found on My Page', pass: shown }], 'clickLoginOnMypage');

    const { x, y } = await loginButton.getLocation();
    const tapX = Math.round(x) + LOGIN_TAP_OFFSET.x;
    const tapY = Math.round(y) + LOGIN_TAP_OFFSET.y;
    console.log(`[clickLoginOnMypage] tap position (${tapX}, ${tapY})`);
    await tapAtCoordinates(tapX, tapY);
  }

  /** Scrolls to Logout at the bottom of My Page (Katalon swipes a fixed 2–3 times; one fling to the end is faster). */
  private async scrollToLogoutButton(): Promise<boolean> {
    // At the very end Logout sits above the BNB (US has Select Store below it); mid-page it can hide behind the BNB
    // Fling once more when Logout is not there yet (the page can still be growing while My Page loads)
    for (let attempt = 1; attempt <= 2; attempt++) {
      await flingToEnd();
      if (await isDisplayedOrFalse(this.locator.logoutButton)) {
        return true;
      }
      console.log(`[scrollToLogoutButton] Logout not shown after fling ${attempt}`);
    }
    return false;
  }

  /** Katalon LogIn.logoutOnMypage — opens My Page, scrolls to Logout at the bottom and logs out. */
  async logoutOnMypage(): Promise<void> {
    await this.prepareMypage();
    const found = await this.scrollToLogoutButton();
    markFailed([{ label: 'Logout button not found on My Page', pass: found }], 'logoutOnMypage');

    await clickElement(this.locator.logoutButton, { timeout: 3000 });
    console.log('[logoutOnMypage] Logout clicked');
    await clickIfDisplayed(this.locator.logoutOkayButton, 5000);
    // Katalon waits a fixed 10s; the app reloads after logout, so wait until Logout is gone and the first screen is back
    await this.locator.logoutButton.waitForDisplayed({ timeout: 10000, reverse: true }).catch(() => undefined);
    await this.waitForAppLoaded(20000);
  }

  /** Logs out on My Page unless the app is already logged out (login page, IN "Select profile" or Login shown on My Page). */
  async ensureLoggedOut(): Promise<void> {
    // The login page and "Select profile" (IN) have no BNB to reach My Page — both mean logged out
    if ((await this.loginPage.isLoginPageShown()) || (await this.loginPage.isSelectProfileShownForIn())) {
      console.log('[ensureLoggedOut] login page or Select profile shown — already logged out');
      return;
    }
    await this.prepareMypage();
    if (await isDisplayedOrFalse(this.locator.loginButton)) {
      console.log('[ensureLoggedOut] Login shown on My Page — already logged out');
      return;
    }
    await this.logoutOnMypage();
  }

  /** Katalon LogIn.isLogOutStatus — Login button must be shown at the top of My Page. */
  async verifyLoggedOut(): Promise<void> {
    // Katalon isLogOutStatus(IN): the "Select profile to continue" screen itself means logged out
    if (await this.loginPage.isSelectProfileShownForIn()) {
      console.log('[verifyLoggedOut] Select profile screen shown — logged out');
      return;
    }
    await this.prepareMypage();
    await this.scrollToLoginButton();

    const loggedOut = await waitForDisplayedOrFalse(this.locator.loginButton, { timeout: 10000 });
    console.log(`[verifyLoggedOut] ${loggedOut}`);
    markFailed([{ label: 'user is not logged out (Login button not found on My Page)', pass: loggedOut }], 'verifyLoggedOut');
  }

  /** Katalon LogIn.ensureLoginStatus — logs in with the device account unless already logged in. */
  async ensureLoggedIn(): Promise<void> {
    // A logged-out app can open on the login page (no BNB) — its login button logs in with the device account
    if (await this.loginPage.isLoginPageShown()) {
      console.log('[ensureLoggedIn] login page shown — logging in');
      await this.loginPage.clickLoginBtnOnLoginPage();
      await this.loginPage.skipPurpose();
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
    await this.loginPage.skipPurpose();
  }

  /** True when Logout is found at the bottom of My Page. */
  private async isLoggedIn(): Promise<boolean> {
    // My Page can still be loading while login completes — return false so verifyLoggedIn re-checks instead of failing
    const ready = await this.prepareMypage(10000).then(() => true, () => false);
    return ready && (await this.scrollToLogoutButton());
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
    await this.prepareMypage();
    const shown = await isDisplayedOrFalse(this.locator.joinRewardsTooltip);
    markFailed([{ label: '"Join Samsung Rewards" tooltip is shown on My Page', pass: !shown }], 'verifyNoJoinRewardsTooltip');
  }

  /** Katalon Reward.getPointsMyPage — Rewards points shown on the My Page dashboard. */
  async getRewardsPoints(): Promise<number> {
    await this.prepareMypage();
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

  /** Katalon MyPage.getAvailableDashboardMenu — Rewards / Wishlist are not offered on every site (site.features). */
  getAvailableDashboardMenus(site: LoadedSite): DashboardMenu[] {
    return DASHBOARD_MENUS.filter((menu) => menu === 'vouchers' || site.features[menu] !== false);
  }

  /** Katalon MyPage.tapMenu — selects a dashboard menu (Rewards / Vouchers / Wishlist) on My Page. */
  async selectDashboardMenu(menu: DashboardMenu): Promise<void> {
    await switchToNative();
    await markFailedAndStop(
      () => clickElement(this.locator.dashboardMenu(menu), { timeout: 5000 }),
      `[selectDashboardMenu] dashboard menu not found on My Page: ${menu}`
    );
  }

  /** Katalon MyPage.verifyMenu — the page opened from the dashboard must show the menu's tab selected. */
  async verifyDashboardMenuRedirected(menu: DashboardMenu): Promise<void> {
    const pass = await waitForDisplayedOrFalse(this.locator.dashboardMenuTab(menu), { timeout: 10000 });
    const actual = (await getElementLabel(this.locator.selectedDashboardTab)).replace(/\n/g, ' / ');
    console.log(`[verifyDashboardMenuRedirected] expected selected tab=${menu} actual selected tab="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: `dashboard menu did not open its page: ${menu}`, pass, detail: `expected selected tab=${menu}, actual="${actual}"` }],
      'verifyDashboardMenuRedirected'
    );
  }

  /** Katalon verifyMyPageMenus (Back and verify) — after Back, the tab page is gone and the dashboard menu is shown again. */
  async verifyReturnedToMypage(menu: DashboardMenu): Promise<void> {
    const tabPageClosed = await this.locator
      .dashboardMenuTab(menu)
      .waitForDisplayed({ timeout: 3000, reverse: true })
      .then(() => true, () => false);
    const pass = tabPageClosed && (await waitForDisplayedOrFalse(this.locator.dashboardMenu(menu), { timeout: 3000 }));
    const actual = (await getElementLabel(this.locator.dashboardMenu(menu))).replace(/\n/g, ' / ');
    console.log(`[verifyReturnedToMypage] expected=${menu} menu on My Page actual="${actual}" tab page closed=${tabPageClosed} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: `not back on My Page after Back: ${menu}`, pass, detail: `menu on My Page="${actual}", tab page closed=${tabPageClosed}` }],
      'verifyReturnedToMypage'
    );
  }

  /** The My Page profile must show the name of the account signed in on the device (not for CN — it shows a random shop nickname). */
  async verifyProfileName(accountName: string): Promise<void> {
    if (getRunConfig().siteCode === 'CN') {
      console.log('[verifyProfileName] CN — skipped (random shop nickname shown instead of the account name)');
      return;
    }
    const profileCard = this.locator.profileCard(accountName);
    const pass = await waitForDisplayedOrFalse(profileCard, { timeout: 5000 });
    const actual = (await getElementLabel(profileCard)).replace(/\n/g, ' / ') || '(profile with this name not found)';
    console.log(`[verifyProfileName] expected name="${accountName}" actual My Page profile="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: 'account name not shown on the My Page profile', pass, detail: `expected="${accountName}", actual="${actual}"` }],
      'verifyProfileName'
    );
  }

  /** Katalon MyPage.tapProfiles — taps the account name on the My Page profile card. */
  async clickProfileOnMypage(accountName: string): Promise<void> {
    const profileCard = this.locator.profileCard(accountName);
    const shown = await waitForDisplayedOrFalse(profileCard, { timeout: 5000 });
    markFailed([{ label: 'profile not found on My Page', pass: shown }], 'clickProfileOnMypage');

    const siteCode = getRunConfig().siteCode;
    const { x, y } = await profileCard.getLocation();
    const { width } = await profileCard.getSize();
    const tapX = Math.round(RTL_SITES.includes(siteCode) ? x + width - PROFILE_TAP_OFFSET.x : x + PROFILE_TAP_OFFSET.x);
    const tapY = Math.round(y) + (['CL', 'PE'].includes(siteCode) ? PROFILE_TAP_OFFSET.yForClPe : PROFILE_TAP_OFFSET.y);
    console.log(`[clickProfileOnMypage] tap position (${tapX}, ${tapY})`);
    await tapAtCoordinates(tapX, tapY);
  }

  /** Selecting the profile must open the Samsung account settings screen (activity only — the name is not compared). */
  async verifyProfileRedirected(): Promise<void> {
    await switchToNative();
    const expected = `${SAMSUNG_ACCOUNT_PACKAGE}/…${SAMSUNG_ACCOUNT_SETTINGS_ACTIVITY}`;
    let actual = '';
    const pass = await driver
      .waitUntil(
        async () => {
          const currentPackage = await driver.getCurrentPackage();
          const currentActivity = await driver.getCurrentActivity();
          actual = `${currentPackage}/${currentActivity}`;
          return currentPackage === SAMSUNG_ACCOUNT_PACKAGE && currentActivity.endsWith(SAMSUNG_ACCOUNT_SETTINGS_ACTIVITY);
        },
        { timeout: 10000, interval: 500 }
      )
      .then(() => true, () => false);
    console.log(`[verifyProfileRedirected] expected activity="${expected}" actual activity="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: 'Samsung account settings not opened from the profile', pass, detail: `expected="${expected}", actual="${actual}"` }],
      'verifyProfileRedirected'
    );
  }
}
