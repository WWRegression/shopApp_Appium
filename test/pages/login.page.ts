import { BasePage } from './base.page';
import { HomePage } from './home.page';
import { LoginLocator } from '../locators/login.locator';
import { isStgEnvironment } from '../helpers/env.helper';
import { getRunConfig } from '../../config/run.config';
import { switchToNative, switchToWebView, targetPackage} from '../helpers/context.helper';
import {
  clearPackage,
  forceStopPackage,
  getAccountEmail,
  getGoogleAccountEmail,
  restartApp,
  startActivityByAction,
} from '../helpers/device.helper';
import {
  clickElement,
  clickIfDisplayed,
  getElementLabel,
  isDisplayedOrFalse,
  setElementValue,
  waitForDisplayedOrFalse,
  withoutIdleWait,
} from '../helpers/element.helper';
import { scrollByBoundary } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

export const SAMSUNG_ACCOUNT_PACKAGE = 'com.osp.app.signin';
/** Samsung account settings screen — opened by this intent action, or from the My Page profile. */
export const SAMSUNG_ACCOUNT_SETTINGS_ACTIVITY = 'SettingMainPreference';
const SAMSUNG_ACCOUNT_SETTINGS_ACTION = 'com.samsung.android.samsungaccount.action.OPEN_SASETTINGS';
const SETTINGS_PACKAGE = 'com.android.settings';
const KEYCODE_ENTER = 66;
const ACCOUNT_Info = 'wise1004!';

/** STG(WDS) sign-in account; fill in the team account. */
const WDS_ACCOUNT = {
  userId: '',
  pw: '',
};

export class LoginPage extends BasePage {
  private readonly locator = new LoginLocator();
  /** Set when clearAppDataForIn wiped the app — the next launch asks for notification permission. */
  private appDataCleared = false;

  // --- Account ---

  /** Device Gmail account (wwautokr…@gmail.com) — used for Gmail SSO login. */
  gmailAccount(): { email: string; pw: string } {
    return {
      email: getGoogleAccountEmail(),
      pw: ACCOUNT_Info,
    };
  }

  /** Device account other than Gmail (currently proton.me) — used for Email SSO login/logout. */
  emailAccount(): { email: string; pw: string } {
    return {
      email: getAccountEmail(),
      pw: ACCOUNT_Info,
    };
  }

  /** Name of the Samsung account signed in on the device — read from the Samsung account settings screen, then back to the app. */
  async getAccountNameOnDevice(): Promise<string> {
    // CN My Page shows a random shop nickname ("sa_…"), so the account name is not used
    if (getRunConfig().siteCode === 'CN') {
      console.log('[getAccountNameOnDevice] CN — skipped');
      return '';
    }
    await startActivityByAction(SAMSUNG_ACCOUNT_SETTINGS_ACTION);
    await switchToNative();
    const shown = await waitForDisplayedOrFalse(this.locator.ssoAccountUserName, { timeout: 10000 });
    const name = await getElementLabel(this.locator.ssoAccountUserName);
    console.log(`[getAccountNameOnDevice] Samsung account name on device="${name}"`);

    await forceStopPackage(SAMSUNG_ACCOUNT_PACKAGE);
    await driver.activateApp(targetPackage());
    markFailedAndStop(
      [{ label: 'Samsung account name not found on the device settings (not signed in on the device?)', pass: shown && Boolean(name) }],
      'getAccountNameOnDevice'
    );
    return name;
  }

  // --- Device account ---

  /** Removes the Samsung account from device Settings, then force-stops the app. */
  async signOutOnDevice(): Promise<void> {
    console.log('[signOutOnDevice] start');
    await forceStopPackage(SAMSUNG_ACCOUNT_PACKAGE);
    await startActivityByAction('android.settings.SYNC_SETTINGS');
    await switchToNative();
    await waitForDisplayedOrFalse(this.locator.settingsAddAccount, { timeout: 5000 });

    if (await waitForDisplayedOrFalse(this.locator.settingAddedSamsungAccount, { timeout: 5000 })) {
      console.log('[signOutOnDevice] removing Samsung account');
      await clickIfDisplayed(this.locator.settingAddedSamsungAccount, 5000);
      await clickIfDisplayed(this.locator.settingRemoveAccountButton, 5000);
      await clickIfDisplayed(this.locator.settingRemoveConfirmButton, 5000);
      await clickIfDisplayed(this.locator.ssoSignOutButton, 5000);
      await clickIfDisplayed(this.locator.ssoConfirmVerifyNumberButton, 5000);

      await markFailedAndStop(
        () => setElementValue(this.locator.ssoConfirmPasswordInput, ACCOUNT_Info, { timeout: 5000 }),
        '[signOutOnDevice] pw confirm input not found'
      );
      // OK button overlaps the navigation bar, so submit with ENTER
      await driver.pressKeyCode(KEYCODE_ENTER);
      await waitForDisplayedOrFalse(this.locator.settingAddedSamsungAccount, {reverse: true, timeout: 5000 });
    } else {
      console.log('[signOutOnDevice] no Samsung account on device');
    }

    await forceStopPackage(SETTINGS_PACKAGE);
    await forceStopPackage(targetPackage());
    await this.clearAppDataForIn();
    console.log('[signOutOnDevice] end');
  }

  /** Adds the Samsung account (this.gmailAccount()) in device Settings if missing, then force-stops the app. */
  async signInOnDevice(): Promise<void> {
    console.log('[signInOnDevice] start');
    await forceStopPackage(SAMSUNG_ACCOUNT_PACKAGE);
    await startActivityByAction('android.settings.SYNC_SETTINGS');
    await switchToNative();

    if (await waitForDisplayedOrFalse(this.locator.settingAddedSamsungAccount, { timeout: 5000 })) {
      console.log('[signInOnDevice] Samsung account already on device');
    } else {
      console.log('[signInOnDevice] adding Samsung account');
      await clickIfDisplayed(this.locator.settingsAddAccount, 5000);
      await clickIfDisplayed(this.locator.settingAddSamsungAccount, 5000);
      await this.ssoLoginWithGmail();      
      await clickIfDisplayed(this.locator.ssoSamsungPassCancelButton, 5000);

      const added = await driver
        .waitUntil(
          async () =>
            (await isDisplayedOrFalse(this.locator.ssoAccountUserName)) ||
            (await isDisplayedOrFalse(this.locator.settingAddedSamsungAccount)),
          { timeout: 5000, interval: 500 }
        )
        .then(() => true, () => false);
      markFailedAndStop([{ label: 'Samsung account not added on device', pass: added }], 'signInOnDevice');
    }
    await forceStopPackage(SETTINGS_PACKAGE);
    await forceStopPackage(targetPackage());
    console.log('[signInOnDevice] end');
  }

  /** A signed-out IN app keeps its profile and opens on "Select profile" instead of the login page. */
  async clearAppDataForIn(): Promise<void> {
    if (getRunConfig().siteCode !== 'IN') {
      return;
    }
    console.log('[clearAppDataForIn] clearing app data');
    await clearPackage(targetPackage());
    this.appDataCleared = true;
  }

  /** Precondition: Samsung account on the device and the app relaunched — Home is verified unless the app opens logged out. */
  async preconditionSignedInOnDevice(): Promise<void> {
    await this.signInOnDevice();
    await restartApp();
    await switchToNative();
    await this.waitForAppLoaded(60000);
    // A logged-out app opens on the login page / "Select profile" (no BNB), so there is no Home to prepare
    if ((await this.isLoginPageShown()) || (await this.isSelectProfileShownForIn())) {
      console.log('[preconditionSignedInOnDevice] app opened logged out (login page or Select profile)');
      return;
    }
    await new HomePage().prepareHomePage();
  }

  /** Precondition: Samsung account on the device, app logged out. */
  async preconditionLoggedOutWithDeviceAccount(): Promise<void> {
    // mypage.page imports this page, so load it only when needed
    const { MypagePage } = await import('./mypage.page');
    await this.preconditionSignedInOnDevice();
    await new MypagePage().ensureLoggedOut();
  }

  /** Guest app while the device keeps a Samsung account. */
  async startAppAsGuest(): Promise<void> {
    // IN cannot be a guest with a device account (it shows "Select profile"), so it takes its own path
    if (getRunConfig().siteCode === 'IN') {
      await this.startAppAsGuestForIn();
      return;
    }
    await this.preconditionLoggedOutWithDeviceAccount();
    await this.continueAsGuestIfShown();
  }

  /** IN: device sign-out, app data clear, relaunch, then enter as guest. */
  private async startAppAsGuestForIn(): Promise<void> {
    await this.signOutOnDevice();
    await this.clearAppDataForIn();
    await restartApp();
    await this.continueAsGuestIfShown();
  }

  // --- Login page ---

  /** True when the login page (Sign in / Continue as guest) is shown — the app is logged out. */
  async isLoginPageShown(): Promise<boolean> {
    await switchToNative();
    return isDisplayedOrFalse(this.locator.continueAsGuestButton);
  }

  /** Checkout as a guest opens the login page (Sign in / Continue as guest). */
  async verifyLoginPage(timeoutMs = 20000): Promise<void> {
    await switchToNative();
    const shown =
      (await waitForDisplayedOrFalse(this.locator.loginPageLoginButton, { timeout: timeoutMs })) &&
      (await isDisplayedOrFalse(this.locator.continueAsGuestButton));
    console.log(`[verifyLoginPage] ${shown}`);
    markFailedAndStop([{ label: 'login page not shown (Sign in / Continue as guest not found)', pass: shown }], 'verifyLoginPage');
  }

  /** Taps the login button on the login page (CN: privacy agreement first, logo on the phone-login page). */
  async clickLoginBtnOnLoginPage(): Promise<void> {
    await switchToNative();

    // The CN login page slider never goes idle, so every action here would wait out the idle timeout
    await withoutIdleWait(async () => {
      // US has no login page and opens the SSO login options directly, so stop waiting as soon as either shows
      await driver
        .waitUntil(
          async () => {
            // Adobe Assurance can open over the login page a few seconds after a fresh launch (IN)
            await this.clickAssuranceCancelIfShown(0);
            return (
              (await isDisplayedOrFalse(this.locator.loginPageLoginButton)) ||
              (await isDisplayedOrFalse(this.locator.samsungAccountLogoButton)) ||
              (await isDisplayedOrFalse(this.locator.ssoWithEmailButton)) ||
              (await isDisplayedOrFalse(this.locator.ssoWithGmailButton))
            );
          },
          { timeout: 10000, interval: 500 }
        )
        .catch(() => undefined);

      await this.agreePrivacyForCn();

      if (await clickIfDisplayed(this.locator.loginPageLoginButton, 500)) {
        console.log('[clickLoginBtnOnLoginPage] login button tapped on login page');
        // Move on as soon as the login page has gone (5s at most)
        await this.locator.loginPageLoginButton.waitForDisplayed({ timeout: 5000, reverse: true }).catch(() => undefined);
      } else {
        await this.clickSamsungLogoForCn();
      }
    });
  }

  /** CN login buttons stay disabled until the privacy agreement is checked. */
  private async agreePrivacyForCn(): Promise<void> {
    if (await clickIfDisplayed(this.locator.loginPagePrivacyCheckbox, 500)) {
      console.log('[agreePrivacyForCn] privacy agreement checked');
    }
  }

  /** CN phone-login page has no login button, only the Samsung account logo. */
  private async clickSamsungLogoForCn(): Promise<void> {
    if (await clickIfDisplayed(this.locator.samsungAccountLogoButton, 500)) {
      console.log('[clickSamsungLogoForCn] Samsung account logo tapped');
      // Move on as soon as the login page has gone (5s at most)
      await this.locator.samsungAccountLogoButton.waitForDisplayed({ timeout: 5000, reverse: true }).catch(() => undefined);
    }
  }

  /** CN and IN do not log in automatically on first launch, so they log in from the login page. */
  async clickLoginBtnOnLoginPageForCnIn(): Promise<void> {
    // Other sites must log in automatically with the device account — logging in here would hide a broken auto-login
    if (!['CN', 'IN'].includes(getRunConfig().siteCode)) {
      return;
    }
    await this.clickLoginBtnOnLoginPage();
  }

  // --- Select profile ---

  /** True when the "Select profile to continue" screen is shown (IN shows it instead of My Page when logged out). */
  async isSelectProfileShownForIn(): Promise<boolean> {
    await switchToNative();
    return isDisplayedOrFalse(this.locator.selectProfileTitle);
  }

  /** Selects the saved profile, then taps the login button (IN) or Continue and the login button on the next page (US). */
  async loginOnSelectProfileForIn(): Promise<void> {
    console.log('[loginOnSelectProfileForIn] logging in from Select profile screen');
    await markFailedAndStop(
      () => clickElement(this.locator.selectProfileRadio, { timeout: 5000 }),
      '[loginOnSelectProfileForIn] saved profile not found on Select profile screen'
    );
    if (await clickIfDisplayed(this.locator.loginPageLoginButton, 3000)) {
      return;
    }
    await markFailedAndStop(
      () => clickElement(this.locator.selectProfileContinueButton, { timeout: 5000 }),
      '[loginOnSelectProfileForIn] Continue button not found on Select profile screen'
    );
    // US opens the login page after Continue — "Sign in" there completes the login
    if (await clickIfDisplayed(this.locator.loginPageLoginButton, 3000)) {
      console.log('[loginOnSelectProfileForIn] login button tapped on the login page after Continue');
    }
  }

  /** After the setup is applied the app can reopen logged out on "Select profile to continue"; logs in with the saved profile. */
  async loginOnSelectProfileIfShown(timeoutMs = 8000): Promise<void> {
    await switchToNative();
    // The app restarts twice after Apply, so Select profile can show a few seconds after Home first appears (IN)
    if (!(await waitForDisplayedOrFalse(this.locator.selectProfileTitle, { timeout: timeoutMs }))) {
      return;
    }
    await this.loginOnSelectProfileForIn();
  }

  // --- SSO ---

  /** Samsung account login with this.emailAccount(). */
  async ssoLoginWithEmail(): Promise<void> {
    const { email, pw } = this.emailAccount();
    markFailedAndStop([{ label: 'account email not found on device', pass: Boolean(email) }], 'ssoLoginWithEmail');
    console.log(`[ssoLoginWithEmail] email=${email}`);
    await switchToNative();

    let step = '';
    await markFailedAndStop(async () => {
      step = 'Email sign-in button';
      await clickElement(this.locator.ssoWithEmailButton, { timeout: 5000 });

      step = 'email input';
      await setElementValue(this.locator.ssoEmailInput, email, { timeout: 5000 });
      await clickIfDisplayed(this.locator.ssoAddAccountLogoArea, 5000);
      await clickElement(this.locator.ssoIdNextButton, { timeout: 5000 });

      step = 'pw input';
      await setElementValue(this.locator.ssoPasswordInput, pw, { timeout: 5000 });
      await clickElement(this.locator.ssoPwNextButton, { timeout: 5000 });
    }, () => `[ssoLoginWithEmail] Email login failed at ${step}`);

    await scrollByBoundary('down', 1, { left: 250, top: 400, width: 200, height: 800 }, 2);
    await this.finishSsoLogin('ssoLoginWithEmail');
    console.log('[ssoLoginWithEmail] end');
  }

   /** Post-SSO: Check all → Scroll down(if any) → Agree → Cancel(if any). */

  /** Logs in with the email account only when the Samsung account SSO screen shows (no device account, e.g. IN guest); skipped otherwise. */
  async ssoLoginWithEmailIfShown(): Promise<void> {
    await switchToNative();
    if (!(await waitForDisplayedOrFalse(this.locator.ssoWithEmailButton, { timeout: 3000 }))) {
      console.log('[ssoLoginWithEmailIfShown] no SSO login options — logged in with the device account');
      return;
    }
    await this.ssoLoginWithEmail();
  }

  /** Picks the device Gmail account (this.gmailAccount()) in the Google picker. */
  async ssoLoginWithGmail(): Promise<void> {
    const { email } = this.gmailAccount();
    markFailedAndStop([{ label: 'Gmail account not found on device', pass: Boolean(email) }], 'ssoLoginWithGmail');
    console.log(`[ssoLoginWithGmail] email=${email}`);
    await switchToNative();

    let step = '';
    await markFailedAndStop(async () => {
      step = 'Sign in with Google button';
      await clickElement(this.locator.ssoWithGmailButton, { timeout: 5000 });

      step = 'Google account picker';
      await clickElement(this.locator.googleAccountItem(email), { timeout: 5000 });
    }, () => `[ssoLoginWithGmail] Gmail login failed at ${step}`);
    await this.finishSsoLogin('ssoLoginWithGmail');
    console.log('[ssoLoginWithGmail] end');
  }

  /** Logs in with Gmail only when SSO options show (no device account); skipped otherwise. */
  async ssoLoginWithGmailIfShown(): Promise<void> {
    // clickLoginBtnOnLoginPage restores the previous (checkout WebView) context, and the Google button is native
    await switchToNative();
    if (!(await waitForDisplayedOrFalse(this.locator.ssoWithGmailButton, { timeout: 3000 }))) {
      console.log('[ssoLoginWithGmailIfShown] no SSO login options — logged in with the device account');
      return;
    }
    await this.ssoLoginWithGmail();
  }

  /** Post-SSO: Check all, Scroll down if any, Agree, Cancel if any. */
  private async finishSsoLogin(tag: string): Promise<void> {
    const checkbox = this.locator.ssoAllAgreeCheckbox;
    if (await waitForDisplayedOrFalse(checkbox,{ timeout: 10000 })) {
      if ((await checkbox.getAttribute('checked').catch(() => 'true')) !== 'true') {
        await checkbox.click().catch(() => undefined);
        console.log(`[${tag}] terms: all agree checked`);
      }
    }

    if (await clickIfDisplayed(this.locator.ssoTermsScrollDownButton)) {
      console.log(`[${tag}] terms: Scroll down tapped`);
    }

    if (await clickIfDisplayed(this.locator.ssoAgreeButton)) {
      console.log(`[${tag}] terms: Agree tapped`);
    }

    if (await clickIfDisplayed(this.locator.ssoSamsungPassCancelButton,5000)) {
      console.log(`[${tag}] simple login prompt: Cancel tapped`);
    }
  }

  /** Skips the post-login purpose screen if shown, or taps "Review Later" on the preference review sheet. */
  async skipPurpose(timeoutMs = 60000): Promise<void> {
    await switchToNative();

    // The app reloads after SSO returns (CN can take over 20s), so wait for the purpose screen, Home, or a Back header (e.g. US cart without BNB)
    await driver
      .waitUntil(
        async () =>
          (await isDisplayedOrFalse(this.locator.purposeNextButton)) ||
          (await isDisplayedOrFalse(this.locator.preferenceReviewLaterButton)) ||
          (await isDisplayedOrFalse(this.bnbLocator.homeButton)) ||
          (await isDisplayedOrFalse(this.popupLocator.cookieAcceptButton)) ||
          (await isDisplayedOrFalse(this.popupLocator.promoCloseButton)) ||
          (await this.isPermissionPopupShown()) ||
          (await isDisplayedOrFalse(this.headerLocator.backButton)),
        { timeout: timeoutMs, interval: 500 }
      )
      .catch(() => undefined);

    if (await isDisplayedOrFalse(this.locator.purposeNextButton)) {
      console.log('[skipPurpose] purpose screen shown, skipping');
      for (let i = 0; i < 2; i++) {
        await clickIfDisplayed(this.locator.purposeSkipButton, 5000);
        await driver.pause(1000);
      }
    } else if (await clickIfDisplayed(this.locator.preferenceReviewLaterButton)) {
      console.log('[skipPurpose] preference review sheet shown, tapped "Review Later"');
    }
  }

  // --- Guest ---

  /** Taps "Continue as guest" on the login page and verifies Home; the login page can ignore the first tap right after launch, so it retries once. */
  async continueAsGuest(): Promise<void> {
    await switchToNative();
    // The CN login page slider never goes idle, so every action here would wait out the idle timeout
    const homeShown = await withoutIdleWait(async () => {
      // An ad overlay ("SHOP NOW") can cover the login page and swallow the tap; only its X — the broad closeButton matches the CN guest button
      await clickIfDisplayed(this.popupLocator.adCloseButton);
      await markFailedAndStop(
        () => clickElement(this.locator.continueAsGuestButton, { timeout: 1000 }),
        '[continueAsGuest] Continue as guest button not found on the login page'
      );
      console.log('[continueAsGuest] guest button tapped');
      if (!(await this.closePopupsUntilHomeShown(5000))) {
        await clickIfDisplayed(this.popupLocator.adCloseButton);
        if (await clickIfDisplayed(this.locator.continueAsGuestButton, 1000)) {
          console.log('[continueAsGuest] guest button tapped again');
        }
      }
      // A wiped app (first launch) loads Home slower — CN took over 15s
      return this.closePopupsUntilHomeShown(30000);
    });
    markFailedAndStop([{ label: 'Home not shown after Continue as guest', pass: homeShown }], 'continueAsGuest');
  }

  /** After a launch, continues as guest only when the login page is shown (Home / "Select profile" are left as is). */
  async continueAsGuestIfShown(timeoutMs = 60000): Promise<void> {
    await switchToNative();
    // The CN login page slider never goes idle, so every action here would wait out the idle timeout
    const loginPageShown = await withoutIdleWait(async () => {
      await this.dismissFreshAppPermissionPopups();
      await this.waitForAppLoaded(timeoutMs);
      return this.isLoginPageShown();
    });
    if (!loginPageShown) {
      console.log('[continueAsGuestIfShown] login page not shown (Home or Select profile) — skipping');
      return;
    }
    await this.continueAsGuest();
  }

  /** Guest checkout can open the login page; continues as guest only when it shows. */
  async continueAsGuestToCheckoutIfShown(timeoutMs = 5000): Promise<void> {
    await switchToNative();
    // The CN login page slider never goes idle, so every action here would wait out the idle timeout
    const tapped = await withoutIdleWait(() => clickIfDisplayed(this.locator.continueAsGuestButton, timeoutMs));
    console.log(`[continueAsGuestToCheckoutIfShown] ${tapped ? 'guest button tapped' : 'login page not shown — skipping'}`);
  }

  /** On the login boarding page, opens the country menu and selects `countryName`. */
  async changeCountryOnLoginSplash(countryName: string): Promise<void> {
    await switchToNative();
    const splash = this.locator.splashCountryButton;
    const shown = await waitForDisplayedOrFalse(splash, { timeout: 30000 });
    markFailedAndStop([{ label: 'login splash country menu not found', pass: shown }], 'changeCountryOnLoginSplash');
    await clickElement(splash, { timeout: 5000 });
    await this.selectCountry(countryName);
    const changed = await driver
      .waitUntil(async () => (await getElementLabel(splash)).includes(countryName), { timeout: 10000, interval: 500 })
      .then(() => true, () => false);
    console.log(`[changeCountryOnLoginSplash] expected="${countryName}" result=${changed ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: 'country did not change on the login splash', pass: changed, detail: countryName }],
      'changeCountryOnLoginSplash'
    );
  }

  /** A wiped app (IN, cleared by clearAppDataForIn) asks for notification permission after launch — waits only in that case. */
  private async dismissFreshAppPermissionPopups(): Promise<void> {
    if (!this.appDataCleared) {
      return;
    }
    this.appDataCleared = false;
    if (await waitForDisplayedOrFalse(this.popupLocator.notificationDenyButton, { timeout: 15000 })) {
      // Check briefly
      await this.dismissPermissionPopups(5000, 3000);
    }
  }

  /** Closes what covers Home (CN ad splash, permission, promotion) until BNB shows; the cookie popup is left for verifyCookiePopup and counts as Home. */
  private async closePopupsUntilHomeShown(timeoutMs: number): Promise<boolean> {
    return driver
      .waitUntil(
        async () => {
          if (
            (await isDisplayedOrFalse(this.bnbLocator.homeButton)) ||
            (await isDisplayedOrFalse(this.popupLocator.cookieAcceptButton))
          ) {
            return true;
          }
          await this.closeTopPopup({ keepCookie: true });
          return false;
        },
        { timeout: timeoutMs, interval: 500 }
      )
      .then(() => true, () => false);
  }

  // --- STG ---

  /**
   * STG가 아니면 no-op. WDS 페이지가 보이면 ID/PW 입력 후 Login.
   */
  async wdsLoginIfNeeded(timeoutMs = 15000): Promise<boolean> {
    if (!isStgEnvironment()) {
      console.log('[login] WDS skipped (non-STG environment)');
      return false;
    }

    await switchToNative();

    if (!(await waitForDisplayedOrFalse(this.locator.wdsLoginPage, { timeout: timeoutMs }))) {
      console.log('[login] WDS page not visible, skipping');
      return false;
    }

    if (!WDS_ACCOUNT.userId || !WDS_ACCOUNT.pw) {
      markFailedAndStop(
        [{ label: 'WDS_ACCOUNT set (userId/pw in test/pages/login.page.ts)', pass: false }],
        'wdsLoginIfNeeded'
      );
    }

    console.log('[login] WDS page shown, starting login');

    // sts.secsso.net WebView 준비 (switchToWebView + window scan)
    await switchToWebView(10000).catch(() => undefined);
    await switchToNative();

    await setElementValue(this.locator.wdsIdInput, WDS_ACCOUNT.userId);
    await setElementValue(this.locator.wdsPwInput, WDS_ACCOUNT.pw);
    await clickElement(this.locator.wdsConfirmButton);
    await this.locator.wdsConfirmButton
      .waitForDisplayed({ timeout: 15000, reverse: true })
      .catch(() => undefined);

    return true;
  }
}
