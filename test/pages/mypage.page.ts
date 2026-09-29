import { BasePage } from './base.page';
import { MypageLocator } from '../locators/mypage.locator';
import { LoginPage } from './login.page';
import { switchToNative } from '../helpers/context.helper';
import { getBrowserPages } from '../helpers/device.helper';
import {
  clickIfDisplayed,
  getElementLabel,
  isDisplayedSafe,
  scrollUntilVisible,
  waitForDisplayedSafe,
} from '../helpers/element.helper';
import { swipeByBoundary, tapAtCoordinates } from '../helpers/gesture.helper';
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
    if (await isDisplayedSafe(this.locator.accountPageTitle)) {
      console.log('[openMypage] already on My Page');
      return;
    }
    await this.selectBnbMenu('mypage');
    if (!(await waitForDisplayedSafe(this.locator.accountPageTitle, timeoutMs))) {
      console.log('[openMypage] failed to navigate to My Page');
    }
  }

  /** Katalon swipes My Page down to its top before looking for Login; skipped when Login is already visible. */
  private async scrollToLoginButton(): Promise<void> {
    if (!(await isDisplayedSafe(this.locator.loginButton))) {
      await swipeByBoundary('down', 0.95);
    }
  }

  /**
   * Katalon Common.navigateToPage("HOME") — waits for the app to load after a relaunch, then taps Home.
   * Skipped (like Katalon, which only warns) when no BNB shows, e.g. "Select profile to continue"; logout/verifyLoggedOut/clickLogin handle that screen.
   */
  async selectHome(timeoutMs = 20000): Promise<void> {
    await switchToNative();
    await driver
      .waitUntil(
        async () =>
          (await isDisplayedSafe(this.bnbLocator.homeButton)) ||
          (await this.loginPage.isProfileSelectShown()) ||
          (await isDisplayedSafe(this.popupLocator.notificationDenyButton)),
        { timeout: timeoutMs, interval: 500 }
      )
      .catch(() => undefined);

    // A late notification popup (e.g. IN re-asking after a deny) covers Home — close it, then wait for BNB
    if (await isDisplayedSafe(this.popupLocator.notificationDenyButton)) {
      await this.dismissPermissionPopups();
      await waitForDisplayedSafe(this.bnbLocator.homeButton, 3000);
    }

    if (!(await isDisplayedSafe(this.bnbLocator.homeButton))) {
      console.log('[selectHome] BNB not shown (e.g. Select profile screen) — skipping');
      return;
    }
    await this.selectBnbMenu('home');
  }

  /** Katalon LogIn.loginOnMypage (My Page part) — taps Login; the SSO page is handled by LoginPage.clickSsoSignIn(). */
  async clickLoginOnMypage(): Promise<void> {
    // Katalon loginOnMypage(IN): logged-out IN shows "Select profile to continue" instead of My Page
    if (await this.loginPage.isProfileSelectShown()) {
      await this.loginPage.loginOnSelectProfile();
      return;
    }
    await this.openMypage(5000);
    await this.scrollToLoginButton();

    const loginButton = this.locator.loginButton;
    if (!(await waitForDisplayedSafe(loginButton, 5000))) {
      console.log('[clickLoginOnMypage] login button not shown');
      return;
    }

    const { x, y } = await loginButton.getLocation();
    const tapX = Math.round(x) + LOGIN_TAP_OFFSET.x;
    const tapY = Math.round(y) + LOGIN_TAP_OFFSET.y;
    console.log(`[clickLoginOnMypage] tap position (${tapX}, ${tapY})`);
    await tapAtCoordinates(tapX, tapY);
  }

  /** Katalon LogIn.logoutOnMypage — logs out from the bottom of My Page if logged in. */
  async logoutOnMypage(): Promise<void> {
    console.log('[logoutOnMypage] start');
    // "Select profile to continue" (IN) is itself the logged-out state
    if (await this.loginPage.isProfileSelectShown()) {
      console.log('[logoutOnMypage] Select profile screen shown — already logged out, skipping');
      return;
    }
    await this.openMypage(5000);
    // Already logged out (e.g. just after guest entry) → nothing to scroll for
    if (await isDisplayedSafe(this.locator.loginButton)) {
      console.log('[logoutOnMypage] already logged out, skipping');
      return;
    }
    // Katalon swipes up twice; My Page length differs by site (IN needs more), so scroll until Logout appears
    const found = await scrollUntilVisible(this.locator.logoutButton, 5);

    if (found && (await clickIfDisplayed(this.locator.logoutButton, 3000))) {
      console.log('[logoutOnMypage] Logout clicked');
      await clickIfDisplayed(this.locator.logoutOkayButton, 5000);
      await driver.pause(10000);
    }
    console.log('[logoutOnMypage] end');
  }

  /** Katalon LogIn.isLogOutStatus — Login button must be shown at the top of My Page. */
  async verifyLoggedOut(): Promise<void> {
    // Katalon isLogOutStatus(IN): the "Select profile to continue" screen itself means logged out
    if (await this.loginPage.isProfileSelectShown()) {
      console.log('[verifyLoggedOut] Select profile screen shown — logged out');
      return;
    }
    await this.openMypage(5000);
    await this.scrollToLoginButton();

    const loggedOut = await waitForDisplayedSafe(this.locator.loginButton, 10000);
    console.log(`[verifyLoggedOut] ${loggedOut}`);
    if (!loggedOut) {
      // Katalon: log back in before failing so the next TC doesn't start from a broken login state
      console.log('[verifyLoggedOut] not logged out — trying to log back in before failing');
      await this.clickLoginOnMypage().catch(() => undefined);
      await this.loginPage.clickSsoSignIn().catch(() => undefined);
    }
    markFailed([{ label: 'user is logged out (Login button shown)', pass: loggedOut }], 'verifyLoggedOut');
  }

  /** Katalon LogIn.isLogInStatus — Logout button must be found at the bottom of My Page. */
  async verifyLoggedIn(): Promise<void> {
    await driver.pause(2000);
    await this.openMypage(10000);

    // Katalon swipes up 3 times then retries; scroll until Logout appears instead (IN My Page is longer than UK)
    const loggedIn = await scrollUntilVisible(this.locator.logoutButton, 5);
    console.log(`[verifyLoggedIn] ${loggedIn}`);
    markFailed([{ label: 'user is logged in (Logout button shown)', pass: loggedIn }], 'verifyLoggedIn');
  }

  async getAccountName(): Promise<string> {
    // TODO: Implement account name retrieval
    return await this.locator.accountName.getText();
  }
}
