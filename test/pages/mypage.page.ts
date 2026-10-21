import { BasePage } from './base.page';
import {
  DASHBOARD_MENUS,
  MypageLocator,
  PRODUCT_MENUS,
  type DashboardMenu,
  type MypageMenu,
  type ProductMenu,
} from '../locators/mypage.locator';
import { LoginPage, SAMSUNG_ACCOUNT_PACKAGE, SAMSUNG_ACCOUNT_SETTINGS_ACTIVITY } from './login.page';
import { getRunConfig } from '../../config/run.config';
import { getSiteData } from '../../config/site';
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
import { flingToEnd, flingToStart, swipeByBoundary, tapAtCoordinates } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

/** Tap offset inside the profile card used for Login, instead of the element center. */
const LOGIN_TAP_OFFSET = { x: 350, y: 150 };
/** Tap offset on the name line inside the profile card (a center tap does nothing); CL / PE cards are taller. */
const PROFILE_TAP_OFFSET = { x: 350, y: 230, yForClPe: 260 };
/** The name line is on the right side of the profile card. */
const RTL_SITES = ['AE_AR', 'SA', 'IL'];
/** Words that name the same menu — sites swap them between the menu and its page (US menu "Inbox" opens "Notification", IN the reverse). */
const SAME_MENU_WORDS = [['inbox', 'notification']];

export class MypagePage extends BasePage {
  private readonly locator = new MypageLocator();
  private readonly loginPage = new LoginPage();
  /** Page ids captured as a baseline before the loop starts — excluded when detecting new items. */
  private readonly knownPageIds = new Set<string>();

  /** Scrolls to and clicks the menu button with this on-screen label. */
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
   * Verifies the clicked sub-menu actually navigated there.
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

  /** Checks whether any key word of the label appears in text — both values come from the same screen, so no per-language data is needed. */
  private matchesLabel(text: string, itemLabel: string): boolean {
    const target = text.toLowerCase();
    const words = itemLabel.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return (words.length ? words : [itemLabel.toLowerCase()]).some((word) => {
      // Singular / plural: "My Addresses" opens "Address"
      const stem = word.replace(/e?s$/, '');
      const sameMenu = SAME_MENU_WORDS.find((group) => group.includes(stem) || group.includes(word)) ?? [stem];
      return sameMenu.some((name) => target.includes(name));
    });
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
      .waitUntil(
        async () => {
          if (await this.isOnMypage()) {
            return true;
          }
          // A popup opening over the app (e.g. the "SHOP NOW" ad) swallows the BNB tap — close it and select the tab again
          if (await this.closeTopPopup()) {
            await this.selectBnbMenu('mypage');
          }
          return false;
        },
        { timeout: timeoutMs, interval: 500 }
      )
      .then(() => true, () => false);
    markFailedAndStop([{ label: 'My Page not shown (header title does not match)', pass: ready }], 'prepareMypage');
  }

  /** Swipes My Page down to its top before looking for Login; skipped when Login is already visible. */
  private async scrollToLoginButton(): Promise<void> {
    if (!(await isDisplayedOrFalse(this.locator.loginButton))) {
      await swipeByBoundary('down', 0.95);
    }
  }

  /** Taps Login; the login page is handled by LoginPage.clickLoginBtnOnLoginPage(). */
  async clickLoginOnMypage(): Promise<void> {
    // IN: logged-out IN shows "Select profile to continue" instead of My Page
    if (await this.loginPage.isSelectProfileShownForIn()) {
      await this.loginPage.loginOnSelectProfileForIn();
      return;
    }
    await this.prepareMypage();
    await this.scrollToLoginButton();

    const loginButton = this.locator.loginButton;
    const shown = await waitForDisplayedOrFalse(loginButton, { timeout: 5000 });
    markFailedAndStop([{ label: 'Login button not found on My Page', pass: shown }], 'clickLoginOnMypage');

    const { x, y } = await loginButton.getLocation();
    const tapX = Math.round(x) + LOGIN_TAP_OFFSET.x;
    const tapY = Math.round(y) + LOGIN_TAP_OFFSET.y;
    console.log(`[clickLoginOnMypage] tap position (${tapX}, ${tapY})`);
    await tapAtCoordinates(tapX, tapY);
  }

  /** Scrolls to Logout at the bottom of My Page with one fling to the end. */
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

  /** Opens My Page, scrolls to Logout at the bottom and logs out. */
  async logoutOnMypage(): Promise<void> {
    await this.prepareMypage();
    const found = await this.scrollToLogoutButton();
    markFailedAndStop([{ label: 'Logout button not found on My Page', pass: found }], 'logoutOnMypage');

    await clickElement(this.locator.logoutButton, { timeout: 3000 });
    console.log('[logoutOnMypage] Logout clicked');
    await clickIfDisplayed(this.locator.logoutOkayButton, 5000);
    // The app reloads after logout, so wait until Logout is gone and the first screen is back
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

  /** Login button must be shown at the top of My Page. */
  async verifyLoggedOut(): Promise<void> {
    // IN: the "Select profile to continue" screen itself means logged out
    if (await this.loginPage.isSelectProfileShownForIn()) {
      console.log('[verifyLoggedOut] Select profile screen shown — logged out');
      return;
    }
    await this.prepareMypage();
    await this.scrollToLoginButton();

    const loggedOut = await waitForDisplayedOrFalse(this.locator.loginButton, { timeout: 10000 });
    console.log(`[verifyLoggedOut] ${loggedOut}`);
    markFailedAndStop([{ label: 'user is not logged out (Login button not found on My Page)', pass: loggedOut }], 'verifyLoggedOut');
  }

  /** Logs in with the device account unless already logged in. */
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

  /** Logout button must be found at the bottom of My Page. */
  async verifyLoggedIn(options: { continueOnFail?: boolean } = {}): Promise<void> {
    let loggedIn = await this.isLoggedIn();
    if (!loggedIn) {
      // Login can still be completing in the background (CN authorizes after the tap), so it is re-checked
      console.log('[verifyLoggedIn] Logout not found yet — re-checking for up to 15s');
      loggedIn = await driver
        .waitUntil(() => this.isLoggedIn(), { timeout: 15000, interval: 2000 })
        .then(() => true, () => false);
    }
    console.log(`[verifyLoggedIn] ${loggedIn}`);
    // Stops here, except in HOME_02 where the failure is recorded and the TC goes on
    const mark = options.continueOnFail ? markFailed : markFailedAndStop;
    mark([{ label: 'user is not logged in (Logout button not found on My Page)', pass: loggedIn }], 'verifyLoggedIn');
  }

  /** The "Join Samsung Rewards" tooltip must not show on My Page. */
  async verifyNoJoinRewardsTooltip(): Promise<void> {
    const shown = await isDisplayedOrFalse(this.locator.joinRewardsTooltip);
    markFailed([{ label: '"Join Samsung Rewards" tooltip is shown on My Page', pass: !shown }], 'verifyNoJoinRewardsTooltip');
  }

  /** Rewards points shown on the My Page dashboard. */
  async getRewardsPoints(): Promise<number> {
    await this.prepareMypage();
    const shown = await waitForDisplayedOrFalse(this.locator.rewardsPoints, { timeout: 5000 });
    markFailedAndStop([{ label: 'Rewards points not found on My Page', pass: shown }], 'getRewardsPoints');
    const points = parsePoints(await getElementLabel(this.locator.rewardsPoints));
    console.log(`[getRewardsPoints] My Page points=${points}`);
    return points;
  }

  /** Opens the Samsung Rewards web page from My Page and reads its points. */
  async getRewardsPointsOnRewardsPage(): Promise<number> {
    await clickElement(this.locator.rewardsPoints, { timeout: 3000 });
    const ready = await prepareWebViewPage('mypageRewards', () => this.locator.rewardsPagePoints, 15000);
    // Must be displayed: a hidden dashboard still holds a default "0 P" in the DOM, which would pass by accident
    const shown = ready && (await waitForDisplayedOrFalse(this.locator.rewardsPagePoints, { timeout: 8000 }));
    markFailedAndStop([{ label: 'Rewards points not shown on the Samsung Rewards page', pass: shown }], 'getRewardsPointsOnRewardsPage');
    const points = parsePoints(await this.locator.rewardsPagePoints.getText());
    console.log(`[getRewardsPointsOnRewardsPage] Rewards page points=${points}`);
    await switchToNative();
    return points;
  }

  /** The three points values must be the same. */
  verifyRewardsPointsMatch(homePoints: number, mypagePoints: number, rewardsPagePoints: number): void {
    const same = homePoints === mypagePoints && homePoints === rewardsPagePoints;
    const detail = `Home=${homePoints}, My Page=${mypagePoints}, Rewards page=${rewardsPagePoints}`;
    console.log(`[verifyRewardsPointsMatch] ${same} (${detail})`);
    markFailed([{ label: 'Rewards points differ', pass: same, detail }], 'verifyRewardsPointsMatch');
  }

  /** Rewards / Wishlist are not offered on every site (site.features). */
  getAvailableDashboardMenus(site: LoadedSite): DashboardMenu[] {
    return DASHBOARD_MENUS.filter((menu) => menu === 'vouchers' || site.features[menu] !== false);
  }

  /** Selects a dashboard menu (Rewards / Vouchers / Wishlist) on My Page. */
  async selectDashboardMenu(menu: DashboardMenu): Promise<void> {
    await switchToNative();
    await markFailedAndStop(
      () => clickElement(this.locator.dashboardMenu(menu), { timeout: 5000 }),
      `[selectDashboardMenu] dashboard menu not found on My Page: ${menu}`
    );
  }

  /** The page opened from the dashboard must show the menu's tab selected. */
  async verifyDashboardMenuRedirected(menu: DashboardMenu): Promise<void> {
    const pass = await waitForDisplayedOrFalse(this.locator.dashboardMenuTab(menu), { timeout: 10000 });
    const actual = (await getElementLabel(this.locator.selectedMypageTab)).replace(/\n/g, ' / ');
    console.log(`[verifyDashboardMenuRedirected] expected selected tab=${menu} actual selected tab="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: `dashboard menu did not open its page: ${menu}`, pass, detail: `expected selected tab=${menu}, actual="${actual}"` }],
      'verifyDashboardMenuRedirected'
    );
  }

  /** Menus below the dashboard shown on the site (data/sites-data mypageMenuList). */
  getAvailableProductMenus(site: LoadedSite): ProductMenu[] {
    return PRODUCT_MENUS.filter((menu) => site.mypageMenuList?.[menu] === true);
  }

  /** Selects a menu below the dashboard on My Page and returns its name for the redirect check. */
  async selectProductMenu(menu: ProductMenu): Promise<string> {
    await switchToNative();
    const menuElement = this.locator.productMenu(menu);
    if (!(await isDisplayedOrFalse(menuElement))) {
      // scrollUntilVisible only scrolls down — start from the top, since My Page can be left scrolled past the menu
      await flingToStart();
      await scrollUntilVisible(menuElement, 3);
    }
    const menuLabel = (await getElementLabel(menuElement)).replace(/\n/g, ' ');
    // Baseline of WebView pages, so the redirect check only reads the page this click opens
    this.knownPageIds.clear();
    for (const page of await getBrowserPages()) {
      this.knownPageIds.add(page.id);
    }
    await markFailedAndStop(
      () => clickElement(menuElement, { timeout: 5000 }),
      `[selectProductMenu] menu not found on My Page: ${menu}`
    );
    return menuLabel;
  }

  /** The opened page must carry the clicked menu's name — WebView page title (CDP, no context switch), selected tab or title next to Back. */
  async verifyProductMenuRedirected(menuLabel: string): Promise<void> {
    let actual = '';
    const pass = await driver
      .waitUntil(
        async () => {
          actual = await this.getOpenedPageName();
          return this.matchesLabel(actual, menuLabel);
        },
        { timeout: 10000, interval: 500 }
      )
      .then(() => true, () => false);
    console.log(`[verifyProductMenuRedirected] expected menu="${menuLabel}" actual page="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: `menu did not open its page: ${menuLabel}`, pass, detail: `expected menu="${menuLabel}", actual page="${actual}"` }],
      'verifyProductMenuRedirected'
    );
  }

  /** Names the opened page shows: title of the newly opened WebView page, the selected tab and the title next to Back. */
  private async getOpenedPageName(): Promise<string> {
    const newPage = (await getBrowserPages()).find((page) => !this.knownPageIds.has(page.id));
    const names = [
      newPage?.title ?? '',
      await getElementLabel(this.locator.selectedMypageTab),
      await getElementLabel(this.locator.subPageTitle),
    ];
    return names.filter(Boolean).join(' | ').replace(/\n/g, ' / ');
  }

  /** After Back, the opened page is gone and the menu is shown on My Page again. */
  async verifyReturnedToMypage(menu: MypageMenu): Promise<void> {
    await switchToNative();
    const isDashboard = (DASHBOARD_MENUS as readonly string[]).includes(menu);
    const menuElement = isDashboard ? this.locator.dashboardMenu(menu as DashboardMenu) : this.locator.productMenu(menu as ProductMenu);
    // Every page opened from My Page has a Back button, My Page itself has none
    const pageClosed = await this.locator.subPageBackButton
      .waitForDisplayed({ timeout: 3000, reverse: true })
      .then(() => true, () => false);
    const pass = pageClosed && (await waitForDisplayedOrFalse(menuElement, { timeout: 3000 }));
    const actual = (await getElementLabel(menuElement)).replace(/\n/g, ' / ');
    console.log(`[verifyReturnedToMypage] expected=${menu} menu on My Page actual="${actual}" page closed=${pageClosed} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: `not back on My Page after Back: ${menu}`, pass, detail: `menu on My Page="${actual}", page closed=${pageClosed}` }],
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
    markFailedAndStop(
      [{ label: 'account name not shown on the My Page profile', pass, detail: `expected="${accountName}", actual="${actual}"` }],
      'verifyProfileName'
    );
  }

  /** Taps the account name on the My Page profile card. */
  async clickProfileOnMypage(accountName: string): Promise<void> {
    const profileCard = this.locator.profileCard(accountName);
    const shown = await waitForDisplayedOrFalse(profileCard, { timeout: 5000 });
    markFailedAndStop([{ label: 'profile not found on My Page', pass: shown }], 'clickProfileOnMypage');

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
    markFailedAndStop(
      [{ label: 'Samsung account settings not opened from the profile', pass, detail: `expected="${expected}", actual="${actual}"` }],
      'verifyProfileRedirected'
    );
  }

  /** My Page > Settings, then the given rows in order; My Page and Settings are skipped when the Settings page is already open. */
  private async selectSettingsMenus(menus: ChainablePromiseElement[], step: string): Promise<void> {
    await switchToNative();
    if (!(await isDisplayedOrFalse(menus[0]))) {
      await this.prepareMypage();
      menus = [this.locator.settingsMenu, ...menus];
    }
    for (const menu of menus) {
      await scrollUntilVisible(menu, 5);
      await markFailedAndStop(() => clickElement(menu, { timeout: 5000 }), `[${step}] menu not found under My Page > Settings`);
    }
  }

  /** My Page > Settings > Push Notification, then verifies the notification switch is shown. */
  async prepareNotificationPage(): Promise<void> {
    await this.selectSettingsMenus([this.locator.pushNotificationMenu], 'prepareNotificationPage');
    const ready = await waitForDisplayedOrFalse(this.locator.pushNotificationSwitch, { timeout: 5000 });
    markFailedAndStop([{ label: 'Push Notification page not shown (switch not found)', pass: ready }], 'prepareNotificationPage');
  }

  /** The switch must match the option chosen at first launch ('yes' = on); then goes back to Settings. */
  async verifyNotification(option: 'yes' | 'no'): Promise<void> {
    await switchToNative();
    const checked = (await this.locator.pushNotificationSwitch.getAttribute('checked').catch(() => '')) === 'true';
    const expected = option === 'yes';
    const pass = checked === expected;
    console.log(`[verifyNotification] expected=${expected ? 'on' : 'off'} actual=${checked ? 'on' : 'off'} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop(
      [{ label: 'notification setting does not match the first-launch choice', pass, detail: `expected ${expected ? 'on' : 'off'}, actual ${checked ? 'on' : 'off'}` }],
      'verifyNotification'
    );
    await this.pressBack();
  }

  /** My Page > Settings > Personal Data Management > Cookie Preferences, then verifies the TrustArc choices are shown. */
  async prepareCookiePreferencesPage(): Promise<void> {
    // Only the sites marked in site data (initialSetup.trustArcCookie) have cookie preferences to check
    if (!getSiteData().initialSetup?.trustArcCookie) {
      console.log('[prepareCookiePreferencesPage] TrustArc cookie is not required for this site — skipped');
      return;
    }
    await this.selectSettingsMenus([this.locator.personalDataManagementMenu, this.locator.cookiePreferencesMenu], 'prepareCookiePreferencesPage');
    // The consent can open on its summary first — "More info" shows the per-category choices
    if (!(await waitForDisplayedOrFalse(this.locator.trustArcSaveButton, { timeout: 15000 }))) {
      await clickIfDisplayed(this.locator.trustArcMoreInfoButton, 3000);
    }
    const ready = await waitForDisplayedOrFalse(this.locator.trustArcSaveButton, { timeout: 10000 });
    markFailedAndStop([{ label: 'Cookie Preferences not shown (TrustArc choices not found)', pass: ready }], 'prepareCookiePreferencesPage');
  }

  /** Every cookie category must still hold the choice made at first launch ('decline' = NO, 'accept' = YES); then closes with Save. */
  async verifyTrustArcCookie(choice: 'accept' | 'decline'): Promise<void> {
    if (!getSiteData().initialSetup?.trustArcCookie) {
      console.log('[verifyTrustArcCookie] TrustArc cookie is not required for this site — skipped');
      return;
    }
    // The NO/YES radio inputs are hidden by CSS, so wait on the visible preferences container instead
    const webviewReady = await prepareWebViewPage('trustArc', () => this.locator.trustArcPreferencesContent);
    const noSelected: boolean[] = [];
    if (webviewReady) {
      for (const input of await this.locator.trustArcNoInputs) {
        noSelected.push(await input.isSelected());
      }
    }
    await switchToNative();

    const expected = choice === 'decline';
    const pass = noSelected.length > 0 && noSelected.every((selected) => selected === expected);
    const actual = noSelected.map((selected) => (selected ? 'NO' : 'YES')).join(', ') || 'no choices found';
    console.log(`[verifyTrustArcCookie] expected=every category ${expected ? 'NO' : 'YES'} actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: 'TrustArc cookie does not match the first-launch choice', pass, detail: `expected every category ${expected ? 'NO' : 'YES'}, actual ${actual}` }],
      'verifyTrustArcCookie'
    );
    // Close the TrustArc choices with "Save" after the check
    await clickElement(this.locator.trustArcSaveButton, { timeout: 5000 });
  }
}
