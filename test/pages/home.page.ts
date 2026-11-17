import { BasePage } from './base.page';
import { HomeLocator } from '../locators/home.locator';
import { switchToNative } from '../helpers/context.helper';
import { parsePoints } from '../helpers/data.helper';
import { getSiteData } from '../../config/site';
import {
  clickElement,
  clickIfDisplayed,
  getElementLabel,
  isDisplayedOrFalse,
  quickSwipeUntilVisible,
  scrollUntilVisible,
  waitForDisplayedOrFalse,
  verifyHyperlinkRedirects,
  withoutIdleWait,
} from '../helpers/element.helper';
import { longPressElement, scrollListDown } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

export class HomePage extends BasePage {
  private readonly locator = new HomeLocator();

  /** True when the header title matches the Home title texts (BasePage.titleTexts.HOME). */
  async isOnHome(): Promise<boolean> {
    return this.matchesHeaderTitle('HOME');
  }

  /** Waits for the app's first screen, selects Home on BNB, then verifies the Home header title. */
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

  /** The cookie popup must show after the initial setup (TrustArc sites already answered it); then closes it. */
  async verifyAndCloseCookiePopup(): Promise<void> {
    // Only the sites marked in site data (initialSetup.cookiePopup) must show it
    if (!getSiteData().initialSetup?.cookiePopup) {
      console.log('[verifyAndCloseCookiePopup] cookie popup is not required for this site — skipped');
      return;
    }
    await switchToNative();
    const acceptButton = this.popupLocator.cookieAcceptButton;
    let shown = await waitForDisplayedOrFalse(acceptButton, { timeout: 5000 });
    // Welcome and promotion popups can stack on top of the cookie popup — close them one by one until it shows
    for (let closed = 0; !shown && closed < 3; closed += 1) {
      if (!(await this.closeTopPopup({ keepCookie: true }))) {
        break;
      }
      console.log(`[verifyAndCloseCookiePopup] closed a popup covering the cookie popup (${closed + 1})`);
      shown = await waitForDisplayedOrFalse(acceptButton, { timeout: 3000 });
    }
    console.log(`[verifyAndCloseCookiePopup] expected=cookie popup shown actual=${shown ? 'shown' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'Cookie popup not found on site', pass: shown }], 'verifyAndCloseCookiePopup');
    if (!shown) {
      return;
    }
    await clickElement(acceptButton, { timeout: 5000 });
    console.log('[verifyAndCloseCookiePopup] cookie popup closed');
  }

  /** Opens Universal Build Config from the Home title, sets Mobile Backend = P1 and Webview Debugging = Yes, then applies. */
  async configureUniversalBuild(): Promise<void> {
    console.log('[configureUniversalBuild] start');
    await this.prepareHomePage();
    await this.dismissOverlays();
    await longPressElement(this.headerLocator.headerTitle);

    const opened = await waitForDisplayedOrFalse(this.locator.setupMobileBackendP1Option, { timeout: 10000 });
    markFailedAndStop([{ label: 'setup screen not opened (Universal Build Config not found)', pass: opened }], 'configureUniversalBuild');

    // The options are fixed for every run, so all of them are set here and applied once (Apply restarts the app)
    await this.selectSetupOption(this.locator.setupMobileBackendP1Option, 'Mobile Backend = P1');
    await this.selectSetupOption(this.locator.setupHybrisP1Option, 'Hybris = P1');
    await this.selectSetupOption(this.locator.setupAEMP1Option, 'AEM = P1');
    await this.selectSetupOption(this.locator.setupWebviewYesOption, 'Webview Debugging = Yes');

    const applyButton = this.locator.setupApplyButton;
    await scrollUntilVisible(applyButton, 15);
    await markFailedAndStop(() => clickElement(applyButton, { timeout: 5000 }), '[configureUniversalBuild] Apply button not found');
    
    await this.waitForAppLoaded(30000);
  }

  /** Scrolls to one option on the setup screen and selects it. */
  private async selectSetupOption(option: ChainablePromiseElement, label: string): Promise<void> {
    await scrollUntilVisible(option, 10);
    await markFailedAndStop(() => clickElement(option, { timeout: 5000 }), `[configureUniversalBuild] ${label} option not found`);
    console.log(`[configureUniversalBuild] selected ${label}`);
  }

  /** Opens chat: the floating chat button when shown (UK has no header chat icon), else the header chat icon. */
  async clickChat(): Promise<void> {
    await switchToNative();
    if (await clickIfDisplayed(this.locator.chatFabButton, 2000)) {
      return;
    }
    await this.selectHeaderIcon('chat');
  }

  /** Chat must open: header title becomes Chat, or a screen without the Home header (UK shows a cookie notice instead of the chat). */
  async verifyChatOpened(): Promise<void> {
    let actual = 'still on Home';
    const opened = await driver
      .waitUntil(
        async () => {
          if (await this.matchesHeaderTitle('CHAT')) {
            actual = 'chat page';
            return true;
          }
          if (!(await isDisplayedOrFalse(this.headerLocator.headerTitle))) {
            actual = 'screen over Home (no header)';
            return true;
          }
          return false;
        },
        { timeout: 8000, interval: 500 }
      )
      .then(() => true, () => false);
    console.log(`[verifyChatOpened] expected=chat opened actual=${actual} result=${opened ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'Failed to navigate Chat page', pass: opened, detail: actual }], 'verifyChatOpened');
  }

  /** Clicks the main KV at the top of Home. */
  async clickMainKv(): Promise<void> {
    await switchToNative();
    await markFailedAndStop(() => clickElement(this.locator.mainKv, { timeout: 5000 }), '[clickMainKv] main KV not found on Home');
  }

  /** Scrolls Home until the T&C row is shown; a site without T&C on Home ends the TC as N/A. */
  async verifyTermsShown(): Promise<void> {
    await switchToNative();
    // A video playing above the T&C keeps the screen busy, so idle waits are skipped
    const shown = await withoutIdleWait(async () => {
      const found = await quickSwipeUntilVisible(this.locator.tncSection);
      if (found) {
        // The swipe bounces at the page end and brings up the notification panel over the T&C;
        // a scroll down from mid-screen hides it (one starting next to the BNB opens the panel)
        await scrollListDown();
      }
      return found;
    });
    console.log(`[verifyTermsShown] T&C ${shown ? 'shown' : 'not shown'}`);
    markFailedAndStop([{ label: '[SKIPPED] No T&C on Home for this site', pass: shown }], 'verifyTermsShown');
  }

  /** T&C is folded by default, and tapping it shows its content (opened for the link checks). */
  async verifyTermsFolded(): Promise<void> {
    // Existence, not display: the opened content can start behind BNB
    const folded = await withoutIdleWait(async () => !(await this.locator.tncContent.isExisting()));
    console.log(`[verifyTermsFolded] expected T&C="folded" actual="${folded ? 'folded' : 'open'}" result=${folded ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'T&C is not folded by default', pass: folded }], 'verifyTermsFolded');
    if (!folded) {
      return;
    }

    const opened = await withoutIdleWait(async () => {
      await clickElement(this.locator.tncSection, { timeout: 5000 });
      return this.locator.tncContent.waitForExist({ timeout: 3000 }).then(() => true, () => false);
    });
    console.log(`[verifyTermsFolded] expected T&C content="shown" actual="${opened ? 'shown' : 'not shown'}" result=${opened ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'T&C content is not shown after tapping it', pass: opened }], 'verifyTermsFolded');
  }

  /** Every T&C link opens its page. No link is a pass. */
  async verifyTermsLinks(): Promise<void> {
    const results = await verifyHyperlinkRedirects(() => this.locator.tncSection);
    markFailed(
      results.map((result) => ({ label: `T&C link did not open its page: ${result.name}`, pass: result.pass, detail: result.actual })),
      'verifyTermsLinks'
    );
  }

  /** Rewards points shown on Home; fails when the account has not joined Rewards. */
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
