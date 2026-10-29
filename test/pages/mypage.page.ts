import { BasePage } from './base.page';
import {
  DASHBOARD_MENUS,
  MypageLocator,
  PRODUCT_MENUS,
  SETTINGS_MENUS,
  STORE_OPTIONS,
  type DashboardMenu,
  type MypageMenu,
  type ProductMenu,
  type SettingsMenu,
  type StoreOption,
} from '../locators/mypage.locator';
import { LoginPage, SAMSUNG_ACCOUNT_PACKAGE, SAMSUNG_ACCOUNT_SETTINGS_ACTIVITY } from './login.page';
import { PdPage } from './pd.page';
import { PfPage } from './pf.page';
import { getRunConfig } from '../../config/run.config';
import { getSiteData } from '../../config/site';
import type { LoadedSite } from '../../config/site';
import { getDetailedWebViewWindows, prepareWebViewPage, switchToNative, switchToWebView, targetPackage } from '../helpers/context.helper';
import { normalizeProductName, parsePoints, productNameMatches } from '../helpers/data.helper';
import { closeExternalBrowserIfOpen, getBrowserPages } from '../helpers/device.helper';
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
  private readonly pfPage = new PfPage();
  private readonly pdPage = new PdPage();

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

  /** Sub-menu rows on the open list; rows without a label (loading placeholders) are left out. */
  private async getValidSubMenuItems() {
    const items = this.locator.subMenuItems;
    await items[0].waitForExist({ timeout: 3000 }).catch(() => undefined);
    const valid = [];
    for (const item of await items) {
      if (((await item.getAttribute('content-desc').catch(() => '')) || '').trim()) {
        valid.push(item);
      }
    }
    return valid;
  }

  /** Number of sub-menus on the open list — read from the screen since it varies by country. */
  async getSubMenuCount(): Promise<number> {
    await switchToNative();
    const count = (await this.getValidSubMenuItems()).length;
    console.log(`[getSubMenuCount] count=${count}`);
    return count;
  }

  /** Clicks the sub-menu at index and returns its label ('' when the row is gone). */
  async clickItemAt(index: number): Promise<string> {
    await switchToNative();
    const item = (await this.getValidSubMenuItems())[index];
    const itemLabel = item ? ((await item.getAttribute('content-desc').catch(() => '')) || '').trim() : '';
    if (!itemLabel) {
      console.log(`[clickItemAt] index=${index} not found`);
      return '';
    }
    console.log(`[clickItemAt] index=${index} label="${itemLabel}"`);
    await this.saveWebViewBaseline();
    await clickElement(this.locator.subMenuRow(itemLabel), { timeout: 3000 }).catch(() =>
      console.log(`[clickItemAt] could not click "${itemLabel}"`)
    );
    return itemLabel;
  }

  /** The clicked sub-menu must leave the list and open a page containing its name (or one of acceptedNames). */
  async verifyRedirected(itemLabel: string, acceptedNames: readonly string[] = []): Promise<void> {
    await this.verifyDetailPageOpened(itemLabel, () => this.waitForSubMenuListLeft(itemLabel), acceptedNames);
  }

  /** True once the clicked row is gone, i.e. the next screen replaced the list. */
  private async waitForSubMenuListLeft(itemLabel: string): Promise<boolean> {
    return this.locator
      .subMenuRow(itemLabel)
      .waitForDisplayed({ timeout: 10000, reverse: true })
      .then(() => true, () => false);
  }

  /** Polls the opened page's names for up to 10s until they contain the label. */
  private async waitForPageNamed(label: string): Promise<{ pass: boolean; actual: string }> {
    let actual = '';
    const pass = await driver
      .waitUntil(
        async () => {
          actual = await this.getOpenedPageName();
          return this.matchesLabel(actual, label);
        },
        { timeout: 10000, interval: 500 }
      )
      .then(() => true, () => false);
    return { pass, actual };
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

  /** Same title ignoring spaces and case — the list title repeats its menu's name ("  Support" for "Support"). */
  private isSameTitle(title: string, menuLabel: string): boolean {
    const normalize = (text: string) => text.replace(/\s+/g, '').toLowerCase();
    return !!title && normalize(title) === normalize(menuLabel);
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
  async prepareMypage(timeoutMs = 10000): Promise<void> {
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
    await this.saveWebViewBaseline();
    await markFailedAndStop(
      () => clickElement(menuElement, { timeout: 5000 }),
      `[selectProductMenu] menu not found on My Page: ${menu}`
    );
    return menuLabel;
  }

  /** The opened page's names must contain the clicked menu's name (see getOpenedPageName). */
  async verifyPageTitleMatchesMenu(menuLabel: string): Promise<void> {
    const { pass, actual } = await this.waitForPageNamed(menuLabel);
    console.log(`[verifyPageTitleMatchesMenu] expected menu="${menuLabel}" actual page="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: `page title does not match the menu: ${menuLabel}`, pass, detail: `expected menu="${menuLabel}", actual page="${actual}"` }],
      'verifyPageTitleMatchesMenu'
    );
  }

  /** The menu's own page content (mypage.locator *Page) must be shown — in the newly opened WebView window (CSS locator) or on the native screen (xpath). */
  async verifyMenuPageContentShown(menu: ProductMenu): Promise<void> {
    const isNativePage = /^[/(]/.test(String((await this.locator.productMenuPage(menu)).selector));
    let pass: boolean;
    let actual: string;
    if (isNativePage) {
      await switchToNative();
      pass = await waitForDisplayedOrFalse(this.locator.productMenuPage(menu), { timeout: 15000 });
      actual = `${pass ? 'shown' : 'not shown'} on the native screen`;
    } else {
      const url = await this.switchToNewWebViewWindow(10000);
      pass = !!url && (await waitForDisplayedOrFalse(this.locator.productMenuPage(menu), { timeout: 15000 }));
      actual = url ? `${pass ? 'shown' : 'not shown'} in the new WebView window ${url}` : 'no new WebView window opened';
      await switchToNative();
    }
    console.log(`[verifyMenuPageContentShown] expected=${menu} page content shown actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: `${menu} page content not shown`, pass, detail: actual }], 'verifyMenuPageContentShown');
  }

  /** Switches to the WebView window the last menu click opened (absent from the baseline); returns its URL, '' when none opens. */
  private async switchToNewWebViewWindow(timeoutMs: number): Promise<string> {
    if (!(await switchToWebView(timeoutMs))) {
      return '';
    }
    let url = '';
    await driver
      .waitUntil(
        async () => {
          const window = (await getDetailedWebViewWindows()).find((w) => !this.knownPageIds.has(w.webviewPageId));
          if (!window) {
            return false;
          }
          await driver.switchToWindow(window.webviewPageId);
          url = window.url;
          return true;
        },
        { timeout: timeoutMs, interval: 500 }
      )
      .catch(() => undefined);
    return url;
  }

  /**
   * Names the opened page shows: title and URL of WebView pages opened since the click (CDP, no context switch),
   * the selected tab, the page heading, the title next to Back, the browser address bar and an external app's package.
   */
  private async getOpenedPageName(): Promise<string> {
    const newPages = (await getBrowserPages()).filter((page) => !this.knownPageIds.has(page.id));
    const currentPackage = await driver.getCurrentPackage().catch(() => '');
    const names = [
      ...newPages.flatMap((page) => [page.title, page.url.split('?')[0]]),
      await getElementLabel(this.locator.selectedMypageTab),
      await getElementLabel(this.locator.subPageHeading),
      await getElementLabel(this.locator.subPageTitle),
      await getElementLabel(this.locator.browserUrlBar),
      currentPackage === targetPackage() ? '' : currentPackage,
    ];
    return names.filter(Boolean).join(' | ').replace(/\n/g, ' / ');
  }

  /** After Back, the opened page is gone and the menu is shown on My Page again. */
  async verifyReturnedToMypage(menu: MypageMenu): Promise<void> {
    await switchToNative();
    const menuElement = this.locator.mypageMenu(menu);
    // Every page opened from My Page has a Back button, My Page itself has none
    const pageClosed = await this.locator.subPageBackButton
      .waitForDisplayed({ timeout: 3000, reverse: true })
      .then(() => true, () => false);
    // My Page can come back scrolled (e.g. after the Samsung account app), so the menu is looked for further down too
    if (pageClosed && !(await isDisplayedOrFalse(menuElement))) {
      await scrollUntilVisible(menuElement, 3);
    }
    const pass = pageClosed && (await waitForDisplayedOrFalse(menuElement, { timeout: 3000 }));
    const actual = (await getElementLabel(menuElement)).replace(/\n/g, ' / ');
    console.log(`[verifyReturnedToMypage] expected=${menu} menu on My Page actual="${actual}" page closed=${pageClosed} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: `not back on My Page after Back: ${menu}`, pass, detail: `menu on My Page="${actual}", page closed=${pageClosed}` }],
      'verifyReturnedToMypage'
    );
  }

  /** Registered Products must be shown on My Page — searched from the top, scrolling down up to 2 times. */
  async verifyRegisteredProductsShown(): Promise<void> {
    await switchToNative();
    await flingToStart();
    await scrollUntilVisible(this.locator.registeredProductsArea, 3);
    const pass = await waitForDisplayedOrFalse(this.locator.registeredProductsArea, { timeout: 5000 });
    console.log(`[verifyRegisteredProductsShown] expected=Registered Products shown actual=${pass ? 'shown' : 'not shown'} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'Registered Products not shown on My Page', pass }], 'verifyRegisteredProductsShown');
  }

  /** The recommended products area ("Suggested for …") must be shown — scrolling down up to 2 times. */
  async verifyRecommendedAreaShown(): Promise<void> {
    await scrollUntilVisible(this.locator.recommendedArea, 3);
    const pass = await waitForDisplayedOrFalse(this.locator.recommendedArea, { timeout: 5000 });
    const actual = pass ? `"${(await getElementLabel(this.locator.recommendedArea)).replace(/\n/g, ' / ')}"` : 'not shown';
    console.log(`[verifyRecommendedAreaShown] expected=recommended area shown actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'recommended area not shown on My Page', pass }], 'verifyRecommendedAreaShown');
  }

  /** The recommended area must sit right below Registered Products. */
  async verifyRecommendedAreaBelowRegisteredProducts(): Promise<void> {
    const maxGap = this.getMaxGapBelow();
    const gap = await this.getVerticalGap(this.locator.registeredProductsArea, this.locator.recommendedArea);
    const pass = gap >= 0 && gap <= maxGap;
    console.log(`[verifyRecommendedAreaBelowRegisteredProducts] expected gap=0~${maxGap}px actual gap=${gap}px result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: 'recommended area not right below Registered Products', pass, detail: `gap=${gap}px, allowed 0~${maxGap}px` }],
      'verifyRecommendedAreaBelowRegisteredProducts'
    );
  }

  /** Support must sit right below the recommended area, or right below Registered Products on sites without one. */
  async verifySupportBelowProductsArea(): Promise<void> {
    if (!getSiteData().mypageMenuList?.support) {
      console.log('[verifySupportBelowProductsArea] no Support menu on this site — skipped');
      return;
    }
    await switchToNative();
    await flingToStart();
    await scrollUntilVisible(this.locator.supportMenu, 5);

    const hasRecommended = await isDisplayedOrFalse(this.locator.recommendedArea);
    const upperName = hasRecommended ? 'recommended area' : 'Registered Products';
    const upper = hasRecommended ? this.locator.recommendedArea : this.locator.registeredProductsArea;
    if (!hasRecommended) {
      const shown = await isDisplayedOrFalse(upper);
      markFailedAndStop([{ label: 'neither the recommended area nor Registered Products is shown above Support', pass: shown }], 'verifySupportBelowProductsArea');
    }

    const maxGap = this.getMaxGapBelow();
    const gap = await this.getVerticalGap(upper, this.locator.supportMenu);
    const pass = gap >= 0 && gap <= maxGap;
    console.log(`[verifySupportBelowProductsArea] expected Support below ${upperName} gap=0~${maxGap}px actual gap=${gap}px result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: `Support not right below ${upperName}`, pass, detail: `gap=${gap}px, allowed 0~${maxGap}px` }],
      'verifySupportBelowProductsArea'
    );
  }

  /** Pixels between the bottom of `upper` and the top of `lower`; NaN when either is not found. */
  private async getVerticalGap(upper: ChainablePromiseElement, lower: ChainablePromiseElement): Promise<number> {
    return Promise.all([upper.getLocation(), upper.getSize(), lower.getLocation()])
      .then(([upperTop, upperSize, lowerTop]) => Math.round(lowerTop.y - (upperTop.y + upperSize.height - 1)))
      .catch(() => NaN);
  }

  /** Largest gap still counted as "right below" — US leaves more room between My Page sections. */
  private getMaxGapBelow(): number {
    return getRunConfig().siteCode === 'US' ? 400 : 10;
  }

  /** Bottom menus shown on the site (data/sites-data mypageMenuList). */
  getAvailableSettingsMenus(site: LoadedSite): SettingsMenu[] {
    return SETTINGS_MENUS.filter((menu) => site.mypageMenuList?.[menu] === true);
  }

  /** Selects a bottom menu (Support ~ Logout) on My Page and returns its name ('' when it could not be clicked). */
  async selectSettingsMenu(menu: SettingsMenu): Promise<string> {
    await switchToNative();
    const menuElement = this.locator.settingsMenuButton(menu);
    if (!(await isDisplayedOrFalse(menuElement))) {
      // scrollUntilVisible only scrolls down — start from the top, since My Page can be left scrolled past the menu
      await flingToStart();
      await scrollUntilVisible(menuElement, 5);
    }
    const menuLabel = (await getElementLabel(menuElement)).replace(/\n/g, ' ');
    await this.saveWebViewBaseline();
    const clicked = await clickElement(menuElement, { timeout: 5000 }).then(() => true, () => false);
    // A missing menu is recorded and the next menu is checked
    markFailed([{ label: `menu not found on My Page: ${menu}`, pass: clicked }], 'selectSettingsMenu');
    return clicked ? menuLabel : '';
  }

  /** Verifies what the bottom menu opened: its sub-menu list, the Samsung account, the logout popup or its page. */
  async verifySettingsMenuPage(menu: SettingsMenu, menuLabel: string): Promise<void> {
    switch (menu) {
      case 'accountManagement':
        return this.verifyAccountManagementPage();
      case 'logout':
        return this.verifyLogoutPopupShown();
      case 'smartThings':
        return this.verifyPageTitleMatchesMenu(menuLabel);
      default:
        return this.verifySubMenus(menuLabel);
    }
  }

  /** Clicks each sub-menu on the list and checks the detail page it opens; a sub-menu opening another list is checked the same way. */
  private async verifySubMenus(listLabel: string): Promise<void> {
    // Waits for the list to load before counting its rows
    await this.isSubMenuListShown(listLabel, 5000);
    await this.verifyGiveFeedbackHidden();
    const acceptedNames = await this.getAcceptedPageNames();

    const count = await this.getSubMenuCount();
    markFailed([{ label: `no sub-menu shown: ${listLabel}`, pass: count > 0 }], 'verifySubMenus');
    for (let index = 0; index < count; index++) {
      const itemLabel = await this.clickItemAt(index);
      if (!itemLabel) {
        markFailed([{ label: `sub-menu ${index + 1} of ${count} not found on the list: ${listLabel}`, pass: false }], 'verifySubMenus');
        continue;
      }
      if (await this.isSubMenuListOpened(itemLabel)) {
        await this.verifySubMenus(itemLabel);
      } else {
        await this.verifyRedirected(itemLabel, acceptedNames.get(itemLabel));
      }
      if (!(await this.returnToSubMenuList(listLabel))) {
        markFailed([{ label: `could not return to the sub-menu list, rest not checked: ${listLabel}`, pass: false }], 'verifySubMenus');
        return;
      }
    }
  }

  /** Closes the opened sub-menu page until its list is back — an external app is closed, TrustArc needs Back twice. */
  private async returnToSubMenuList(listLabel: string): Promise<boolean> {
    await switchToNative();
    // A sub-menu that opened nothing is still on the list — Back would leave it
    if (await this.isSubMenuListShown(listLabel, 0)) {
      return true;
    }
    if ((await driver.getCurrentPackage().catch(() => '')) !== targetPackage()) {
      await closeExternalBrowserIfOpen();
      if (await this.isSubMenuListShown(listLabel, 3000)) {
        return true;
      }
    }
    for (let attempt = 1; attempt <= 3; attempt++) {
      await driver.back();
      if (await this.isSubMenuListShown(listLabel, 2000)) {
        return true;
      }
    }
    console.log(`[returnToSubMenuList] list "${listLabel}" not shown after Back`);
    return false;
  }

  /** True when the open sub-menu list's title equals listLabel (checked once when timeoutMs is 0). */
  private async isSubMenuListShown(listLabel: string, timeoutMs: number): Promise<boolean> {
    const isShown = async () => this.isSameTitle(await getElementLabel(this.locator.subMenuListTitle), listLabel);
    if (timeoutMs === 0) {
      return isShown();
    }
    return driver.waitUntil(isShown, { timeout: timeoutMs, interval: 300 }).then(() => true, () => false);
  }

  /** Give Feedback must not be offered on the sub-menu list. */
  private async verifyGiveFeedbackHidden(): Promise<void> {
    const shown = await isDisplayedOrFalse(this.locator.giveFeedbackMenu);
    console.log(`[verifyGiveFeedbackHidden] expected=Give Feedback not shown actual=${shown ? 'shown' : 'not shown'} result=${shown ? 'FAIL' : 'PASS'}`);
    markFailed([{ label: 'Give Feedback is shown on the sub-menu list', pass: !shown }], 'verifyGiveFeedbackHidden');
  }

  /** Sub-menus on the open list whose page does not show their name, with the page names accepted instead. */
  private async getAcceptedPageNames(): Promise<Map<string, string[]>> {
    const rules: [ChainablePromiseElement, string[]][] = [
      // Cookie Preferences opens the TrustArc consent
      [this.locator.cookiePreferencesMenu, ['trustarc']],
      // Marketing Preferences opens the profile page in the app or the Samsung account
      [this.locator.marketingPreferencesMenu, ['profile-setting', 'account.samsung.com', SAMSUNG_ACCOUNT_PACKAGE]],
    ];
    const accepted = new Map<string, string[]>();
    for (const [row, names] of rules) {
      const label = await getElementLabel(row);
      if (label) {
        accepted.set(label, names);
      }
    }
    return accepted;
  }

  /** True when the clicked sub-menu opened another sub-menu list (e.g. Personal Data Management). */
  private async isSubMenuListOpened(itemLabel: string): Promise<boolean> {
    // The next screen is already drawn once the clicked row is gone, so the title is checked once
    return (await this.waitForSubMenuListLeft(itemLabel)) && (await this.isSubMenuListShown(itemLabel, 0));
  }

  /** Account Management must open the Samsung account settings (CN: its own account page with "退出登录"). */
  private async verifyAccountManagementPage(): Promise<void> {
    await switchToNative();
    // IN: Account Management lists "Delete Account" first — the Samsung account opens from it
    const openedViaDeleteAccount = await clickIfDisplayed(this.locator.deleteAccountMenu, 2000);
    const { pass, expected, actual } = await this.waitForSamsungAccountSettings(() =>
      isDisplayedOrFalse(this.locator.cnAccountLogoutButton)
    );
    console.log(`[verifyAccountManagementPage] expected activity="${expected}" actual activity="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop(
      [{ label: 'Samsung account settings not opened from Account Management', pass, detail: `expected="${expected}", actual="${actual}"` }],
      'verifyAccountManagementPage'
    );
    if (openedViaDeleteAccount) {
      await driver.back();
    }
  }

  /** Logout must ask for confirmation first; the popup is closed afterwards with Back, so the user stays logged in. */
  private async verifyLogoutPopupShown(): Promise<void> {
    const pass = await waitForDisplayedOrFalse(this.locator.logoutOkayButton, { timeout: 5000 });
    const actual = pass ? `popup with "${await getElementLabel(this.locator.logoutOkayButton)}"` : 'no popup';
    console.log(`[verifyLogoutPopupShown] expected=logout confirm popup actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'logout confirm popup not shown', pass, detail: actual }], 'verifyLogoutPopupShown');
  }

  /** Clicks the first product in the recommended area and returns its name (content-desc). */
  async clickFirstRecommendedProduct(): Promise<string> {
    const product = this.locator.recommendedFirstProduct;
    const shown = await waitForDisplayedOrFalse(product, { timeout: 3000 });
    markFailedAndStop([{ label: 'first recommended product not shown', pass: shown }], 'clickFirstRecommendedProduct');
    const productName = (await getElementLabel(product)).replace(/\n/g, ' ');
    console.log(`[clickFirstRecommendedProduct] product="${productName}"`);
    await clickElement(product, { timeout: 3000 });
    return productName;
  }

  /** The page opened from the recommended product must be its BC/PD — names compared on BC/PD, or the product found on the native PD. */
  async verifyRecommendedProductPage(productName: string): Promise<void> {
    const bcPdName = await this.pfPage.getBcPdProductName();
    if (bcPdName === null) {
      // Not a BC/PD WebView page — some products open the native PD
      await markFailedAndStop(
        () => this.pdPage.verifySkuForNativePdPage(productName),
        `[verifyRecommendedProductPage] product not shown on BC/PD or native PD: "${productName}"`
      );
      console.log(`[verifyRecommendedProductPage] expected="${productName}" actual=shown on native PD result=PASS`);
      return;
    }
    const expected = normalizeProductName(productName);
    const pass = productNameMatches(expected, bcPdName);
    console.log(`[verifyRecommendedProductPage] expected="${expected}" actual BC/PD="${bcPdName}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop(
      [{ label: 'recommended product page mismatch', pass, detail: `expected "${productName}", actual BC/PD "${bcPdName}"` }],
      'verifyRecommendedProductPage'
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
    const { pass, expected, actual } = await this.waitForSamsungAccountSettings();
    console.log(`[verifyProfileRedirected] expected activity="${expected}" actual activity="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop(
      [{ label: 'Samsung account settings not opened from the profile', pass, detail: `expected="${expected}", actual="${actual}"` }],
      'verifyProfileRedirected'
    );
  }

  /** Waits up to 10s for the Samsung account settings activity (or `alsoAccept`); returns the activity seen last. */
  private async waitForSamsungAccountSettings(
    alsoAccept: () => Promise<boolean> = async () => false
  ): Promise<{ pass: boolean; expected: string; actual: string }> {
    const expected = `${SAMSUNG_ACCOUNT_PACKAGE}/…${SAMSUNG_ACCOUNT_SETTINGS_ACTIVITY}`;
    let actual = '';
    const pass = await driver
      .waitUntil(
        async () => {
          const currentPackage = await driver.getCurrentPackage();
          const currentActivity = await driver.getCurrentActivity();
          actual = `${currentPackage}/${currentActivity}`;
          const isSettings = currentPackage === SAMSUNG_ACCOUNT_PACKAGE && currentActivity.endsWith(SAMSUNG_ACCOUNT_SETTINGS_ACTIVITY);
          return isSettings || (await alsoAccept());
        },
        { timeout: 10000, interval: 500 }
      )
      .then(() => true, () => false);
    return { pass, expected, actual };
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

  /** My Page > Settings > Select Country, then selects the given country. */
  async changeCountryInSettings(countryName?: string): Promise<void> {
    await this.selectSettingsMenus([this.locator.selectCountryMenu], 'changeCountryInSettings');
    await this.selectCountry(countryName);
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

  /** Store options the site shows in the Select Store sheet (data/sites-data shopMenuList). */
  getAvailableStoreOptions(site: LoadedSite): StoreOption[] {
    return STORE_OPTIONS.filter((store) => site.shopMenuList?.[store] === true);
  }

  /** Scrolls to Select Store at the bottom of My Page and clicks it. */
  async clickSelectStore(): Promise<void> {
    await switchToNative();
    const button = this.locator.selectStoreButton;
    if (!(await isDisplayedOrFalse(button))) {
      await flingToEnd();
    }
    const clicked = await clickElement(button, { timeout: 3000 }).then(() => true, () => false);
    markFailed([{ label: 'Select Store not found on My Page', pass: clicked }], 'clickSelectStore');
  }

  /** The store option must be shown in the Select Store sheet when expected, and hidden otherwise. */
  async verifyStoreOptionShown(store: StoreOption, expected: boolean): Promise<void> {
    const shown = await waitForDisplayedOrFalse(this.locator.storeOption(store), { timeout: expected ? 3000 : 1000 });
    const pass = shown === expected;
    console.log(`[verifyStoreOptionShown] store=${store} expected=${expected ? 'shown' : 'hidden'} actual=${shown ? 'shown' : 'hidden'} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop(
      [{ label: `${store} option ${expected ? 'not shown' : 'shown'} in Select Store`, pass }],
      'verifyStoreOptionShown'
    );
  }

  /** Opens the Select Store sheet again (e.g. after Back from a store page) when the option is not on screen. */
  async ensureStoreOptionShown(store: StoreOption): Promise<void> {
    await switchToNative();
    if (await isDisplayedOrFalse(this.locator.storeOption(store))) {
      return;
    }
    await this.prepareMypage();
    await this.clickSelectStore();
  }

  /** Clicks the store option in the Select Store sheet. */
  async selectStoreOption(store: StoreOption): Promise<void> {
    await switchToNative();
    await markFailedAndStop(
      () => clickElement(this.locator.storeOption(store), { timeout: 3000 }),
      `[selectStoreOption] ${store} not found in Select Store`
    );
  }
}
