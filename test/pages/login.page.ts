import { BasePage } from './base.page';
import { LoginLocator } from '../locators/login.locator';
import { isStgEnvironment } from '../helpers/env.helper';
import { appBySite } from '../../config/site';
import {
  isWebViewContext,
  switchToNative,
  switchToWebView,
  targetPackage,
} from '../helpers/context.helper';
import {
  clearPackage,
  forceStopPackage,
  getAccountEmail,
  getGoogleAccountEmail,
  startActivityByAction,
} from '../helpers/device.helper';
import {
  clickElement,
  clickIfDisplayed,
  isDisplayedSafe,
  setElementValue,
  waitForDisplayedSafe,
  withoutIdleWait,
} from '../helpers/element.helper';
import { scrollByBoundary } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

const SAMSUNG_ACCOUNT_PACKAGE = 'com.osp.app.signin';
const SETTINGS_PACKAGE = 'com.android.settings';
const KEYCODE_ENTER = 66;
/** Shared password for the device test accounts (Gmail / proton.me). */
const ACCOUNT_PASSWORD = 'wise1004!';

/** STG(WDS) 로그인 계정 — 팀 계정에 맞게 수정 (Katalon WDS_ID/PW 대응). */
const WDS_CREDENTIALS = {
  userId: '',
  password: '',
};

export class LoginPage extends BasePage {
  private readonly locator = new LoginLocator();
  /** Set when signOutSamsungAccountOnDevice wiped the app — the next launch asks for notification permission. */
  private appDataCleared = false;

  /** Device Gmail account (wwautokr…@gmail.com) — used for Gmail SSO login. */
  gmailAccount(): { email: string; password: string } {
    return {
      email: getGoogleAccountEmail(),
      password: ACCOUNT_PASSWORD,
    };
  }

  /** Device account other than Gmail (currently proton.me) — used for Email SSO login/logout. */
  emailAccount(): { email: string; password: string } {
    return {
      email: getAccountEmail(),
      password: ACCOUNT_PASSWORD,
    };
  }

  /** Katalon LogIn.SSOsignOutOnDevice — removes the Samsung account from device Settings, then force-stops the app. */
  async signOutSamsungAccountOnDevice(): Promise<void> {
    console.log('[signOutSamsungAccountOnDevice] start');
    await forceStopPackage(SAMSUNG_ACCOUNT_PACKAGE);
    await startActivityByAction('android.settings.SYNC_SETTINGS');
    await switchToNative();
    await waitForDisplayedSafe(this.locator.settingsAddAccount, 5000);

    if (await waitForDisplayedSafe(this.locator.samsungAccountItem, 5000)) {
      console.log('[signOutSamsungAccountOnDevice] removing Samsung account');
      await clickIfDisplayed(this.locator.samsungAccountItem, 5000);
      await clickIfDisplayed(this.locator.removeAccountButton, 5000);
      await clickIfDisplayed(this.locator.removeAccountConfirmButton, 5000);
      await clickIfDisplayed(this.locator.signOutButton, 5000);
      await clickIfDisplayed(this.locator.verifyNumberConfirmButton, 5000);

      await markFailedAndStop(
        () => setElementValue(this.locator.confirmPasswordInput, ACCOUNT_PASSWORD, { timeout: 5000 }),
        '[signOutSamsungAccountOnDevice] password confirm input not found'
      );
      // OK button overlaps the navigation bar, so submit with ENTER
      await driver.pressKeyCode(KEYCODE_ENTER);
      await driver.pause(3000);
    } else {
      console.log('[signOutSamsungAccountOnDevice] no Samsung account on device');
    }

    await forceStopPackage(SETTINGS_PACKAGE);
    await forceStopPackage(targetPackage());
    // Katalon (IN) Clear Package — a signed-out IN app keeps its profile and opens on "Select profile" instead of the guest splash
    if (targetPackage() === appBySite.IN.packageName) {
      console.log('[signOutSamsungAccountOnDevice] (IN) clearing app data');
      await clearPackage(targetPackage());
      this.appDataCleared = true;
    }
    console.log('[signOutSamsungAccountOnDevice] end');
  }

  /** True when the "Select profile to continue" screen is shown (IN shows it instead of My Page when logged out). */
  async isProfileSelectShown(): Promise<boolean> {
    await switchToNative();
    return isDisplayedSafe(this.locator.selectProfileTitle);
  }

  /** Katalon LogIn.longinOnSelectProfile — selects the saved profile, then taps the login button (Continue if no login button). */
  async loginOnSelectProfile(): Promise<void> {
    console.log('[loginOnSelectProfile] logging in from Select profile screen');
    await markFailedAndStop(
      () => clickElement(this.locator.selectProfileRadio, { timeout: 5000 }),
      '[loginOnSelectProfile] saved profile not found on Select profile screen'
    );
    if (await clickIfDisplayed(this.locator.ssoSignInButton, 3000)) {
      return;
    }
    await markFailedAndStop(
      () => clickElement(this.locator.selectProfileContinueButton, { timeout: 5000 }),
      '[loginOnSelectProfile] Continue button not found on Select profile screen'
    );
  }

  /** Katalon LogIn.SSOsignInOnDevice — adds the Samsung account (this.emailAccount()) in device Settings if missing, then force-stops the app. */
  async signInSamsungAccountOnDevice(): Promise<void> {
    console.log('[signInSamsungAccountOnDevice] start');
    await forceStopPackage(SAMSUNG_ACCOUNT_PACKAGE);
    await startActivityByAction('android.settings.SYNC_SETTINGS');
    await switchToNative();

    if (await waitForDisplayedSafe(this.locator.samsungAccountItem, 5000)) {
      console.log('[signInSamsungAccountOnDevice] Samsung account already on device');
    } else {
      console.log('[signInSamsungAccountOnDevice] adding Samsung account');
      // Optional like Katalon — if these miss, loginWithEmailSso fails at the Email button with a clear reason
      await clickIfDisplayed(this.locator.settingsAddAccount, 5000);
      await clickIfDisplayed(this.locator.samsungAccountItem, 5000);
      await this.loginWithEmailSso();
    }

    await forceStopPackage(SETTINGS_PACKAGE);
    await forceStopPackage(targetPackage());
    console.log('[signInSamsungAccountOnDevice] end');
  }

  /**
   * Katalon LogIn.loginOnSSOMainPage — taps Sign in on the SSO main page, restoring the previous context.
   * CN: checks the privacy agreement first, then "三星账号授权登录" or, on the phone-login page, the Samsung account logo.
   */
  async clickSsoSignIn(): Promise<void> {
    const wasWebView = await isWebViewContext();
    await switchToNative();

    // The CN SSO page animates, so skip the UI idle wait there
    await withoutIdleWait(async () => {
      // US skips the SSO main page and opens the login options directly, so stop waiting as soon as either shows
      await driver
        .waitUntil(
          async () =>
            (await isDisplayedSafe(this.locator.ssoSignInButton)) ||
            (await isDisplayedSafe(this.locator.samsungAccountLogoButton)) ||
            (await isDisplayedSafe(this.locator.emailSsoButton)) ||
            (await isDisplayedSafe(this.locator.gmailSsoButton)),
          { timeout: 10000, interval: 500 }
        )
        .catch(() => undefined);

      // CN login buttons stay disabled until the privacy agreement is checked
      if (await clickIfDisplayed(this.locator.ssoPrivacyCheckbox, 500)) {
        console.log('[clickSsoSignIn] privacy agreement checked');
      }

      if (await clickIfDisplayed(this.locator.ssoSignInButton, 500)) {
        console.log('[clickSsoSignIn] Sign in tapped on SSO main page');
        await driver.pause(5000);
      } else if (await clickIfDisplayed(this.locator.samsungAccountLogoButton, 500)) {
        console.log('[clickSsoSignIn] Samsung account logo tapped');
        await driver.pause(5000);
      }
    });

    if (wasWebView) {
      await switchToWebView();
    }
  }

  /** Katalon LogIn.SSOloginViaEmail — Samsung account login with this.emailAccount(). */
  async loginWithEmailSso(): Promise<void> {
    const { email, password } = this.emailAccount();
    markFailed([{ label: 'account email found on device', pass: Boolean(email) }], 'loginWithEmailSso');
    console.log(`[loginWithEmailSso] email=${email}`);
    await switchToNative();

    let step = '';
    await markFailedAndStop(async () => {
      step = 'Email sign-in button';
      await clickElement(this.locator.emailSsoButton, { timeout: 5000 });

      step = 'email input';
      await setElementValue(this.locator.emailInput, email, { timeout: 5000 });
      await clickIfDisplayed(this.locator.addAccountLogoArea, 5000);
      await clickElement(this.locator.emailNextButton, { timeout: 5000 });

      step = 'password input';
      await setElementValue(this.locator.passwordInput, password, { timeout: 5000 });
      await clickElement(this.locator.emailNextButton, { timeout: 5000 });
    }, () => `[loginWithEmailSso] Email login failed at ${step}`);

    await scrollByBoundary('down', 1, { left: 250, top: 400, width: 200, height: 800 }, 2);
    // Terms may not show for an account that already agreed; a missed login is caught by verifyLoggedIn
    await clickIfDisplayed(this.locator.allAgreeCheckbox, 5000);
    await clickIfDisplayed(this.locator.agreeButton, 5000);
    await clickIfDisplayed(this.locator.simpleLoginCancelButton, 10000);
    await driver.pause(3000);
    console.log('[loginWithEmailSso] end');
  }

  /** Katalon Init.purposeSkip — skips the post-login purpose screen if shown (preference "Review Later" left out until seen). */
  async skipPurposeIfShown(timeoutMs = 15000): Promise<void> {
    const wasWebView = await isWebViewContext();
    await switchToNative();

    // The purpose screen loads a few seconds after SSO returns, so wait for either screen, Home, or a Back header (e.g. US cart without BNB)
    await driver
      .waitUntil(
        async () =>
          (await isDisplayedSafe(this.locator.purposeNextButton)) ||
          (await isDisplayedSafe(this.bnbLocator.homeButton)) ||
          (await isDisplayedSafe(this.headerLocator.backButton)),
        { timeout: timeoutMs, interval: 500 }
      )
      .catch(() => undefined);

    if (await isDisplayedSafe(this.locator.purposeNextButton)) {
      console.log('[skipPurposeIfShown] purpose screen shown, skipping');
      for (let i = 0; i < 2; i++) {
        await clickIfDisplayed(this.locator.purposeSkipButton, 5000);
        await driver.pause(1000);
      }
    }

    if (wasWebView) {
      await switchToWebView();
    }
  }

  /** Katalon LogIn.SSOloginViaGmail — picks the device Gmail account (this.gmailAccount()) in the Google picker. */
  async loginWithGmailSso(): Promise<void> {
    const { email } = this.gmailAccount();
    markFailed([{ label: 'Gmail account found on device', pass: Boolean(email) }], 'loginWithGmailSso');
    console.log(`[loginWithGmailSso] email=${email}`);
    await switchToNative();
    await driver.pause(2000);

    let step = '';
    await markFailedAndStop(async () => {
      step = 'Sign in with Google button';
      await clickElement(this.locator.gmailSsoButton, { timeout: 5000 });

      step = 'Google account picker';
      await clickElement(this.locator.googleAccountItem(email), { timeout: 5000 });
    }, () => `[loginWithGmailSso] Gmail login failed at ${step}`);
    // Terms may not show for an account that already agreed; a missed login is caught by verifyLoggedIn
    await clickIfDisplayed(this.locator.allAgreeCheckbox, 5000);
    await clickIfDisplayed(this.locator.agreeButton, 5000);

    await clickIfDisplayed(this.locator.simpleLoginCancelButton, 10000);
    await driver.pause(3000);
    console.log('[loginWithGmailSso] end');
  }

  /**
   * Katalon LogIn.startAsGuestUser — enters the app as a guest right after launch.
   * Flow: permission popups of a wiped app → wait for the app to load → tap guest unless already Home.
   */
  async continueAsGuest(timeoutMs = 30000): Promise<void> {
    await switchToNative();
    // The CN login splash animates, so skip the UI idle wait while entering
    await withoutIdleWait(async () => {
      await this.dismissFreshAppPermissionPopups();
      await this.waitForAppLoaded(timeoutMs);

      if (await isDisplayedSafe(this.bnbLocator.homeButton)) {
        console.log('[continueAsGuest] app already loaded, skipping');
        return;
      }
      await this.clickGuestButton();
    });
  }

  /**
   * A wiped app (IN, cleared on device sign-out) always asks for notification permission, but only after the guest
   * splash shows — so wait for the popup itself; no wait when the app was not wiped.
   */
  private async dismissFreshAppPermissionPopups(): Promise<void> {
    if (!this.appDataCleared) {
      return;
    }
    this.appDataCleared = false;
    if (await waitForDisplayedSafe(this.popupLocator.notificationDenyButton, 15000)) {
      // Katalon clickLocationPermission waits 15s, but the location popup never showed in IN runs — check briefly
      await this.dismissPermissionPopups(5000, 3000);
    }
  }

  /**
   * Waits until the app has loaded its first screen (Home, guest splash, or "Select profile"); a leftover permission popup on top is dismissed first.
   */
  private async waitForAppLoaded(timeoutMs: number): Promise<void> {
    const isAppLoaded = async () =>
      (await isDisplayedSafe(this.bnbLocator.homeButton)) ||
      (await isDisplayedSafe(this.locator.continueAsGuestButton)) ||
      (await this.isProfileSelectShown());

    await driver
      .waitUntil(
        async () => (await isDisplayedSafe(this.popupLocator.notificationDenyButton)) || (await isAppLoaded()),
        { timeout: timeoutMs, interval: 500 }
      )
      .catch(() => undefined);

    if (await isDisplayedSafe(this.popupLocator.notificationDenyButton)) {
      await this.dismissPermissionPopups();
      await driver.waitUntil(isAppLoaded, { timeout: timeoutMs, interval: 500 }).catch(() => undefined);
    }
  }

  /** Taps "as guest" and waits for Home; the splash can ignore the first tap right after launch, so it retries once. */
  private async clickGuestButton(): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.continueAsGuestButton, 1000))) {
      console.log('[clickGuestButton] guest option not available on current screen');
      return;
    }
    console.log('[clickGuestButton] guest button tapped');
    if (
      !(await waitForDisplayedSafe(this.bnbLocator.homeButton, 5000)) &&
      (await clickIfDisplayed(this.locator.continueAsGuestButton, 1000))
    ) {
      console.log('[clickGuestButton] guest button tapped again');
    }
    await waitForDisplayedSafe(this.bnbLocator.homeButton, 10000);
  }

  /**
   * Katalon LogIn.wdsLogin 대응.
   * STG가 아니면 no-op. WDS 페이지가 보이면 ID/PW 입력 후 Login.
   */
  async wdsLoginIfNeeded(timeoutMs = 15000): Promise<boolean> {
    if (!isStgEnvironment()) {
      console.log('[login] WDS skipped (non-STG environment)');
      return false;
    }

    await switchToNative();

    if (!(await waitForDisplayedSafe(this.locator.wdsLoginPage, timeoutMs))) {
      console.log('[login] WDS page not visible, skipping');
      return false;
    }

    if (!WDS_CREDENTIALS.userId || !WDS_CREDENTIALS.password) {
      markFailed(
        [{ label: 'WDS_CREDENTIALS set (userId/password in test/pages/login.page.ts)', pass: false }],
        'wdsLoginIfNeeded'
      );
    }

    console.log('[login] WDS page shown, starting login');

    // sts.secsso.net WebView 준비 (Katalon: switchToWebView + window scan)
    await switchToWebView(10000).catch(() => undefined);
    await switchToNative();

    await setElementValue(this.locator.wdsIdInput, WDS_CREDENTIALS.userId);
    await setElementValue(this.locator.wdsPwInput, WDS_CREDENTIALS.password);
    await clickElement(this.locator.wdsConfirmButton);
    await this.locator.wdsConfirmButton
      .waitForDisplayed({ timeout: 15000, reverse: true })
      .catch(() => undefined);

    return true;
  }
}
