import { BasePage } from './base.page';
import { HomeLocator } from '../locators/home.locator';
import { switchToNative } from '../helpers/context.helper';
import { parsePoints } from '../helpers/data.helper';
import { getRunConfig } from '../../config/run.config';
import { getSiteData } from '../../config/site';
import {
  clickElement,
  clickIfDisplayed,
  getElementLabel,
  isDisplayedOrFalse,
  scrollUntilVisible,
  waitForDisplayedOrFalse,
} from '../helpers/element.helper';
import { longPressElement } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

export class HomePage extends BasePage {
  private readonly locator = new HomeLocator();

  /** True when the header title matches the Home title texts (BasePage.titleTexts.HOME). */
  async isOnHome(): Promise<boolean> {
    return this.matchesHeaderTitle('HOME');
  }

  /** Katalon Common.navigateToPage("HOME") — waits for the app's first screen, selects Home on BNB, then verifies the Home header title. */
  async prepareHomePage(timeoutMs = 60000): Promise<void> {
    await switchToNative();
    // The CN app sometimes takes over 20s to load; the wait ends as soon as a screen shows
    await this.waitForAppLoaded(timeoutMs);
    await markFailedAndStop(() => this.selectBnbMenu('home'), '[prepareHomePage] Home tab not available on BNB');

    const ready = await driver
      .waitUntil(() => this.isOnHome(), { timeout: 5000, interval: 500 })
      .then(() => true, () => false);
    markFailedAndStop([{ label: 'Home not shown (header title does not match)', pass: ready }], 'prepareHomePage');
  }

  /** Katalon Init.clickLocationPermission — allows location ("While using the app") when the permission popup shows. */
  async allowLocationPermissionIfShown(timeoutMs = 10000): Promise<void> {
    await switchToNative();
    const allowed = await clickIfDisplayed(this.popupLocator.locationAllowButton, timeoutMs);
    console.log(`[allowLocationPermissionIfShown] ${allowed ? 'location permission allowed' : 'no location permission popup'}`);
  }

  /** Katalon UI.checkCookiePopupAndClosePopups — the cookie popup must show after the initial setup (TrustArc sites already answered it). */
  async verifyCookiePopup(): Promise<void> {
    // Only the sites marked in site data (initialSetup.cookiePopup) must show it
    if (!getSiteData().initialSetup?.cookiePopup) {
      console.log('[verifyCookiePopup] cookie popup is not required for this site — skipped');
      return;
    }
    await switchToNative();
    let shown = await waitForDisplayedOrFalse(this.popupLocator.cookieAcceptButton, { timeout: 5000 });
    // Welcome and promotion popups can stack on top of the cookie popup — close them one by one until it shows
    for (let closed = 0; !shown && closed < 3; closed += 1) {
      if (!(await this.closeTopPopup({ keepCookie: true }))) {
        break;
      }
      console.log(`[verifyCookiePopup] closed a popup covering the cookie popup (${closed + 1})`);
      shown = await waitForDisplayedOrFalse(this.popupLocator.cookieAcceptButton, { timeout: 3000 });
    }
    console.log(`[verifyCookiePopup] expected=cookie popup shown actual=${shown ? 'shown' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'Cookie popup not found on site', pass: shown }], 'verifyCookiePopup');
  }

  /** Katalon Init.checkAndClickTrustArcCookie — clicks Accept all (registered user) or Decline all (guest user) on the TrustArc consent. */
  async clickTrustArcCookie(choice: 'accept' | 'decline'): Promise<void> {
    // Only the sites marked in site data (initialSetup.trustArcCookie) show the consent
    if (!getSiteData().initialSetup?.trustArcCookie) {
      console.log('[clickTrustArcCookie] TrustArc cookie is not required for this site — skipped');
      return;
    }
    await switchToNative();
    // The consent WebView opens a moment after the country is confirmed
    await waitForDisplayedOrFalse(this.locator.trustArcWebView, { timeout: 3000 });
    const button = choice === 'accept' ? this.locator.trustArcAcceptButton : this.locator.trustArcDeclineButton;
    const shown = await waitForDisplayedOrFalse(button, { timeout: 30000 });
    console.log(`[clickTrustArcCookie] expected=TrustArc cookie shown actual=${shown ? 'shown' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    // Katalon records this failure and goes on — the next step stops the TC if the consent is still in the way
    markFailed([{ label: 'TrustArc cookie not found on site', pass: shown }], 'clickTrustArcCookie');
    if (!shown) {
      return;
    }
    await clickElement(button, { timeout: 5000 });
    console.log(`[clickTrustArcCookie] clicked "${choice} all"`);
  }

  /** Katalon Init.clickTnC — checks the first-launch T&C checkbox when the screen has one (CN: then "同意"). */
  async clickTncCheckbox(): Promise<void> {
    await switchToNative();
    const checkbox = this.locator.tncCheckbox;
    // The checkbox, where there is one, comes before the notification options
    await driver
      .waitUntil(async () => (await isDisplayedOrFalse(checkbox)) || (await this.isNotificationOptionShown()), { timeout: 10000, interval: 500 })
      .catch(() => undefined);
    if (!(await clickIfDisplayed(checkbox))) {
      console.log('[clickTncCheckbox] no T&C checkbox on this screen');
      return;
    }
    const agreed = await clickIfDisplayed(this.locator.tncAgreeButton, 3000);
    console.log(`[clickTncCheckbox] checkbox clicked${agreed ? ', agree clicked' : ''}`);
  }

  /** True when the notification choice is on screen: the in-app Yes/No options, or the Android permission popup (IN). */
  private async isNotificationOptionShown(): Promise<boolean> {
    return (await isDisplayedOrFalse(this.locator.notificationRadio('no'))) || (await isDisplayedOrFalse(this.popupLocator.notificationDenyButton));
  }

  /** Set by selectNotification when the choice was made on the Android permission popup (IN) — there is no Get Started screen then. */
  private notificationOnPermissionPopup = false;

  /** Katalon Init.clickNotification — selects "Yes" or "No" for notifications (IN: Allow / Don't allow on the Android permission popup). */
  async selectNotification(option: 'yes' | 'no'): Promise<void> {
    await switchToNative();
    const radio = this.locator.notificationRadio(option);
    const permissionButton = option === 'yes' ? this.popupLocator.notificationAllowButton : this.popupLocator.notificationDenyButton;
    await driver
      .waitUntil(async () => this.isNotificationOptionShown(), { timeout: 20000, interval: 500 })
      .catch(() => undefined);
    this.notificationOnPermissionPopup = await isDisplayedOrFalse(permissionButton);
    const target = this.notificationOnPermissionPopup ? permissionButton : radio;
    // Longer screens (e.g. AU, SA_EN) keep the options below the fold
    const shown = this.notificationOnPermissionPopup || (await isDisplayedOrFalse(radio)) || (await scrollUntilVisible(radio, 3));
    markFailedAndStop([{ label: `notification "${option}" option not found`, pass: shown }], 'selectNotification');
    await clickElement(target, { timeout: 5000 });
    console.log(`[selectNotification] selected "${option}"`);
  }

  /** Katalon Init.clickNotification — "Get Started" closes the initial setup. */
  async clickGetStarted(): Promise<void> {
    if (this.notificationOnPermissionPopup) {
      console.log('[clickGetStarted] notification was answered on the permission popup, no Get Started screen — skipped');
      return;
    }
    await switchToNative();
    const button = this.locator.getStartedButton;
    await scrollUntilVisible(button, 3);
    await markFailedAndStop(() => clickElement(button, { timeout: 5000 }), '[clickGetStarted] Get Started button not found');
    console.log('[clickGetStarted] clicked');
  }

  /** Katalon Init.clickNotification(yes) — after "Yes", Android asks for the notification permission; allows it. */
  async allowNotificationPermissionIfShown(): Promise<void> {
    await switchToNative();
    const allowed = await clickIfDisplayed(this.popupLocator.notificationAllowButton, 5000);
    console.log(`[allowNotificationPermissionIfShown] ${allowed ? 'notification permission allowed' : 'no notification permission popup'}`);
  }

  /** Katalon Init.setupEnvironment — long-presses the Home header title to open the setup screen, sets "Enable Webview Debugging" to Yes and applies. */
  async enableWebviewDebugging(): Promise<void> {
    // TODO: remove once the CN build has the setup screen
    if (getRunConfig().siteCode === 'CN') {
      console.log('[enableWebviewDebugging] no setup screen on this build — skipped');
      return;
    }
    await this.prepareHomePage();
    await this.dismissOverlays();
    await longPressElement(this.headerLocator.title);

    const yesOption = this.locator.setupWebviewYesOption;
    const opened = await scrollUntilVisible(yesOption, 10);
    markFailedAndStop([{ label: 'setup screen not opened (Enable Webview Debugging not found)', pass: opened }], 'enableWebviewDebugging');
    await clickElement(yesOption, { timeout: 5000 });

    const applyButton = this.locator.setupApplyButton;
    await scrollUntilVisible(applyButton, 15);
    await markFailedAndStop(() => clickElement(applyButton, { timeout: 5000 }), '[enableWebviewDebugging] Apply button not found');
    console.log('[enableWebviewDebugging] Webview Debugging set to Yes and applied');
    // Apply restarts the app
    await this.waitForAppLoaded(30000);
  }

  async verifyBottomNavigation(): Promise<void> {
    // TODO: Verify BNB Home/Shop/Offers/Cart/Account redirection
    await this.selectBnbMenu('home');
  }

  async verifyTermsAndConditions(): Promise<void> {
    // TODO: Verify T&C folded by default and hyperlink redirections
  }

  /** Katalon Reward.getPointsHomePage — Rewards points shown on Home; fails when the account has not joined Rewards. */
  async getRewardsPoints(): Promise<number> {
    await switchToNative();
    // The points badge shows up a few seconds after Home itself
    if (!(await waitForDisplayedOrFalse(this.locator.rewardsPoints, { timeout: 10000 }))) {
      const notJoined = await isDisplayedOrFalse(this.locator.rewardsJoinButton);
      const reason = notJoined ? 'Samsung Rewards is not joined (Join button shown on Home)' : 'Rewards points not found on Home';
      markFailedAndStop([{ label: reason, pass: false }], 'getRewardsPoints');
    }
    const points = parsePoints(await getElementLabel(this.locator.rewardsPoints));
    console.log(`[getRewardsPoints] Home points=${points}`);
    return points;
  }
}
