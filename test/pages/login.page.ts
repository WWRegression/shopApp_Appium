import { BasePage } from './base.page';
import { HomePage } from './home.page';
import { LoginLocator } from '../locators/login.locator';
import { isStgEnvironment } from '../helpers/env.helper';
import { getRunConfig } from '../../config/run.config';
import {
  switchToNative,
  switchToWebView,
  targetPackage,
} from '../helpers/context.helper';
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
/** Shared password for the device test accounts (Gmail / proton.me). */
const ACCOUNT_PASSWORD = 'wise1004!';

/** STG(WDS) 로그인 계정 — 팀 계정에 맞게 수정 (Katalon WDS_ID/PW 대응). */
const WDS_CREDENTIALS = {
  userId: '',
  password: '',
};

export class LoginPage extends BasePage {
  private readonly locator = new LoginLocator();
  /** Set when clearAppDataForIn wiped the app — the next launch asks for notification permission. */
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

  /** Name of the Samsung account signed in on the device — read from the Samsung account settings screen, then back to the app. */
  async getAccountNameOnDevice(): Promise<string> {
    // CN My Page shows a random shop nickname ("sa_…"), so the account name is not used
    if (getRunConfig().siteCode === 'CN') {
      console.log('[getAccountNameOnDevice] CN — skipped');
      return '';
    }
    await startActivityByAction(SAMSUNG_ACCOUNT_SETTINGS_ACTION);
    await switchToNative();
    const shown = await waitForDisplayedOrFalse(this.locator.samsungAccountName, { timeout: 10000 });
    const name = await getElementLabel(this.locator.samsungAccountName);
    console.log(`[getAccountNameOnDevice] Samsung account name on device="${name}"`);

    await forceStopPackage(SAMSUNG_ACCOUNT_PACKAGE);
    await driver.activateApp(targetPackage());
    markFailed(
      [{ label: 'Samsung account name not found on the device settings (not signed in on the device?)', pass: shown && Boolean(name) }],
      'getAccountNameOnDevice'
    );
    return name;
  }

  /** Katalon LogIn.SSOsignOutOnDevice — removes the Samsung account from device Settings, then force-stops the app. */
  async signOutOnDevice(): Promise<void> {
    console.log('[signOutOnDevice] start');
    await forceStopPackage(SAMSUNG_ACCOUNT_PACKAGE);
    await startActivityByAction('android.settings.SYNC_SETTINGS');
    await switchToNative();
    await waitForDisplayedOrFalse(this.locator.settingsAddAccount, { timeout: 5000 });

    if (await waitForDisplayedOrFalse(this.locator.samsungAccountItem, { timeout: 5000 })) {
      console.log('[signOutOnDevice] removing Samsung account');
      await clickIfDisplayed(this.locator.samsungAccountItem, 5000);
      await clickIfDisplayed(this.locator.removeAccountButton, 5000);
      await clickIfDisplayed(this.locator.removeAccountConfirmButton, 5000);
      await clickIfDisplayed(this.locator.signOutButton, 5000);
      await clickIfDisplayed(this.locator.verifyNumberConfirmButton, 5000);

      await markFailedAndStop(
        () => setElementValue(this.locator.confirmPasswordInput, ACCOUNT_PASSWORD, { timeout: 5000 }),
        '[signOutOnDevice] password confirm input not found'
      );
      // OK button overlaps the navigation bar, so submit with ENTER
      await driver.pressKeyCode(KEYCODE_ENTER);
      await driver.pause(3000);
    } else {
      console.log('[signOutOnDevice] no Samsung account on device');
    }

    await forceStopPackage(SETTINGS_PACKAGE);
    await forceStopPackage(targetPackage());
    console.log('[signOutOnDevice] end');
  }

  /** Katalon (IN) Clear Package — a signed-out IN app keeps its profile and opens on "Select profile" instead of the login page. */
  async clearAppDataForIn(): Promise<void> {
    if (getRunConfig().siteCode !== 'IN') {
      return;
    }
    console.log('[clearAppDataForIn] clearing app data');
    await clearPackage(targetPackage());
    this.appDataCleared = true;
  }

  /** True when the "Select profile to continue" screen is shown (IN shows it instead of My Page when logged out). */
  async isSelectProfileShownForIn(): Promise<boolean> {
    await switchToNative();
    return isDisplayedOrFalse(this.locator.selectProfileTitle);
  }

  /** True when the login page (Sign in / Continue as guest) is shown — the app is logged out. */
  async isLoginPageShown(): Promise<boolean> {
    await switchToNative();
    return isDisplayedOrFalse(this.locator.continueAsGuestButton);
  }

  /** Katalon LogIn.longinOnSelectProfile — selects the saved profile, then taps the login button (Continue if no login button). */
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
  }

  /** Katalon LogIn.SSOsignInOnDevice — adds the Samsung account (this.emailAccount()) in device Settings if missing, then force-stops the app. */
  async signInOnDevice(): Promise<void> {
    console.log('[signInOnDevice] start');
    await forceStopPackage(SAMSUNG_ACCOUNT_PACKAGE);
    await startActivityByAction('android.settings.SYNC_SETTINGS');
    await switchToNative();

    if (await waitForDisplayedOrFalse(this.locator.samsungAccountItem, { timeout: 5000 })) {
      console.log('[signInOnDevice] Samsung account already on device');
    } else {
      console.log('[signInOnDevice] adding Samsung account');
      // Optional like Katalon — if these miss, loginWithEmailOnSso fails at the Email button with a clear reason
      await clickIfDisplayed(this.locator.settingsAddAccount, 5000);
      await clickIfDisplayed(this.locator.samsungAccountItem, 5000);
      await this.loginWithEmailOnSso();
    }

    await forceStopPackage(SETTINGS_PACKAGE);
    await forceStopPackage(targetPackage());
    console.log('[signInOnDevice] end');
  }

  /** Katalon LogIn.loginOnSplashPage — checkout as a guest opens the login page (Sign in / Continue as guest). */
  async verifyLoginPage(timeoutMs = 20000): Promise<void> {
    await switchToNative();
    const shown =
      (await waitForDisplayedOrFalse(this.locator.loginPageLoginButton, { timeout: timeoutMs })) &&
      (await isDisplayedOrFalse(this.locator.continueAsGuestButton));
    console.log(`[verifyLoginPage] ${shown}`);
    markFailed([{ label: 'login page not shown (Sign in / Continue as guest not found)', pass: shown }], 'verifyLoginPage');
  }

  /** Katalon LogIn/loginPageTnC — CN login buttons stay disabled until the privacy agreement is checked. */
  private async agreePrivacyForCn(): Promise<void> {
    if (await clickIfDisplayed(this.locator.loginPagePrivacyCheckbox, 500)) {
      console.log('[agreePrivacyForCn] privacy agreement checked');
    }
  }

  /** Katalon LogIn/viaSamsungBtnCN — CN phone-login page has no login button, only the Samsung account logo. */
  private async clickSamsungLogoForCn(): Promise<void> {
    if (await clickIfDisplayed(this.locator.samsungAccountLogoButton, 500)) {
      console.log('[clickSamsungLogoForCn] Samsung account logo tapped');
      // Katalon waits a fixed 5s; move on as soon as the login page has gone (at most the same 5s)
      await this.locator.samsungAccountLogoButton.waitForDisplayed({ timeout: 5000, reverse: true }).catch(() => undefined);
    }
  }

  /** Katalon LogIn.loginOnSSOMainPage — taps the login button on the login page (CN: privacy agreement first, logo on the phone-login page). */
  async clickLoginBtnOnLoginPage(): Promise<void> {
    await switchToNative();

    // The CN login page slider never goes idle, so every action here would wait out the idle timeout
    await withoutIdleWait(async () => {
      // US has no login page and opens the SSO login options directly, so stop waiting as soon as either shows
      await driver
        .waitUntil(
          async () =>
            (await isDisplayedOrFalse(this.locator.loginPageLoginButton)) ||
            (await isDisplayedOrFalse(this.locator.samsungAccountLogoButton)) ||
            (await isDisplayedOrFalse(this.locator.emailSsoButton)) ||
            (await isDisplayedOrFalse(this.locator.gmailSsoButton)),
          { timeout: 10000, interval: 500 }
        )
        .catch(() => undefined);

      await this.agreePrivacyForCn();

      if (await clickIfDisplayed(this.locator.loginPageLoginButton, 500)) {
        console.log('[clickLoginBtnOnLoginPage] login button tapped on login page');
        // Katalon waits a fixed 5s; move on as soon as the login page has gone (at most the same 5s)
        await this.locator.loginPageLoginButton.waitForDisplayed({ timeout: 5000, reverse: true }).catch(() => undefined);
      } else {
        await this.clickSamsungLogoForCn();
      }
    });
  }

  /** Katalon LogIn.SSOloginViaEmail — Samsung account login with this.emailAccount(). */
  async loginWithEmailOnSso(): Promise<void> {
    const { email, password } = this.emailAccount();
    markFailed([{ label: 'account email not found on device', pass: Boolean(email) }], 'loginWithEmailOnSso');
    console.log(`[loginWithEmailOnSso] email=${email}`);
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
    }, () => `[loginWithEmailOnSso] Email login failed at ${step}`);

    await scrollByBoundary('down', 1, { left: 250, top: 400, width: 200, height: 800 }, 2);
    await this.finishSsoLogin('loginWithEmailOnSso');
    console.log('[loginWithEmailOnSso] end');
  }

  /** Katalon SSOloginVia* tail — handles the optional terms / simple-login prompts until the SSO screens close. */
  private async finishSsoLogin(tag: string, timeoutMs = 20000): Promise<void> {
    let cancelPending = true;
    let goneChecks = 0;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const checkbox = this.locator.allAgreeCheckbox;
      // The checkbox toggles, so tap it only while unchecked
      if (
        (await isDisplayedOrFalse(checkbox)) &&
        (await checkbox.getAttribute('checked').catch(() => 'true')) !== 'true' &&
        (await clickIfDisplayed(checkbox))
      ) {
        console.log(`[${tag}] terms: all agree checked`);
      } else if (await clickIfDisplayed(this.locator.agreeButton)) {
        console.log(`[${tag}] terms: Agree tapped`);
      } else if (cancelPending && (await clickIfDisplayed(this.locator.simpleLoginCancelButton))) {
        cancelPending = false;
        console.log(`[${tag}] simple login prompt: Cancel tapped`);
      } else if (await isDisplayedOrFalse(this.locator.ssoScreenElement)) {
        goneChecks = 0;
      } else if (++goneChecks >= 2) {
        // Two checks in a row without any SSO element — not just a screen transition
        return;
      }
      await driver.pause(500);
    }
    console.log(`[${tag}] SSO screens still shown after ${timeoutMs}ms`);
  }

  /** Katalon Init.purposeSkip — skips the post-login purpose screen if shown (preference "Review Later" left out until seen). */
  async skipPurpose(timeoutMs = 60000): Promise<void> {
    await switchToNative();

    // The app reloads after SSO returns (CN can take over 20s), so wait for the purpose screen, Home, or a Back header (e.g. US cart without BNB)
    await driver
      .waitUntil(
        async () =>
          (await isDisplayedOrFalse(this.locator.purposeNextButton)) ||
          (await isDisplayedOrFalse(this.bnbLocator.homeButton)) ||
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
    }
  }

  /** Katalon LogIn.loginOnSplashPage(IN) — logs in with Gmail only when SSO options show (no device account); skipped otherwise. */
  async loginWithGmailOnSsoIfShown(): Promise<void> {
    // clickLoginBtnOnLoginPage restores the previous (checkout WebView) context, and the Google button is native
    await switchToNative();
    if (!(await waitForDisplayedOrFalse(this.locator.gmailSsoButton, { timeout: 3000 }))) {
      console.log('[loginWithGmailOnSsoIfShown] no SSO login options — logged in with the device account');
      return;
    }
    await this.loginWithGmailOnSso();
  }

  /** Logs in with the email account only when the Samsung account SSO screen shows (no device account, e.g. IN guest); skipped otherwise. */
  async loginWithEmailOnSsoIfShown(): Promise<void> {
    await switchToNative();
    if (!(await waitForDisplayedOrFalse(this.locator.emailSsoButton, { timeout: 3000 }))) {
      console.log('[loginWithEmailOnSsoIfShown] no SSO login options — logged in with the device account');
      return;
    }
    await this.loginWithEmailOnSso();
  }

  /** Katalon LogIn.SSOloginViaGmail — picks the device Gmail account (this.gmailAccount()) in the Google picker. */
  async loginWithGmailOnSso(): Promise<void> {
    const { email } = this.gmailAccount();
    markFailed([{ label: 'Gmail account not found on device', pass: Boolean(email) }], 'loginWithGmailOnSso');
    console.log(`[loginWithGmailOnSso] email=${email}`);
    await switchToNative();

    let step = '';
    await markFailedAndStop(async () => {
      step = 'Sign in with Google button';
      await clickElement(this.locator.gmailSsoButton, { timeout: 5000 });

      step = 'Google account picker';
      await clickElement(this.locator.googleAccountItem(email), { timeout: 5000 });
    }, () => `[loginWithGmailOnSso] Gmail login failed at ${step}`);
    await this.finishSsoLogin('loginWithGmailOnSso');
    console.log('[loginWithGmailOnSso] end');
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

  /** Katalon Launch.startExistingAppWithGuestUser — guest app while the device keeps a Samsung account. */
  async startAppAsGuest(): Promise<void> {
    // IN can't be a guest with a device account (it shows "Select profile"), so it follows Katalon's IN branch
    if (getRunConfig().siteCode === 'IN') {
      await this.startAppAsGuestForIn();
      return;
    }
    await this.preconditionLoggedOutWithDeviceAccount();
    await this.continueAsGuestIfShown();
  }

  /** Katalon startExistingAppWithGuestUser (IN): device sign-out, app data clear, relaunch, then enter as guest. */
  private async startAppAsGuestForIn(): Promise<void> {
    await this.signOutOnDevice();
    await this.clearAppDataForIn();
    await restartApp();
    await this.continueAsGuestIfShown();
  }

  /** Katalon LogIn.startAsGuestUser — after a launch, continues as guest only when the login page is shown (Home / "Select profile" are left as is). */
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

  /** A wiped app (IN, cleared by clearAppDataForIn) asks for notification permission after launch — waits only in that case. */
  private async dismissFreshAppPermissionPopups(): Promise<void> {
    if (!this.appDataCleared) {
      return;
    }
    this.appDataCleared = false;
    if (await waitForDisplayedOrFalse(this.popupLocator.notificationDenyButton, { timeout: 15000 })) {
      // Katalon clickLocationPermission waits 15s, but the location popup never showed in IN runs — check briefly
      await this.dismissPermissionPopups(5000, 3000);
    }
  }

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
      if (!(await waitForDisplayedOrFalse(this.bnbLocator.homeButton, { timeout: 5000 }))) {
        await clickIfDisplayed(this.popupLocator.adCloseButton);
        if (await clickIfDisplayed(this.locator.continueAsGuestButton, 1000)) {
          console.log('[continueAsGuest] guest button tapped again');
        }
      }
      return waitForDisplayedOrFalse(this.bnbLocator.homeButton, { timeout: 10000 });
    });
    markFailed([{ label: 'Home not shown after Continue as guest', pass: homeShown }], 'continueAsGuest');
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

    if (!(await waitForDisplayedOrFalse(this.locator.wdsLoginPage, { timeout: timeoutMs }))) {
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
