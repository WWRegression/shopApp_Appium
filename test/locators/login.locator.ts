import { BNB_HOME_BUTTON_XPATH } from './bnb.locator';
import { NOTIFICATION_DENY_BUTTON_XPATH } from './popup.locator';

const SAMSUNG_ACCOUNT_ID = 'com.osp.app.signin:id';

// Xpaths kept as constants so several screens can be checked in one lookup (see appScreen / loginPageOrSsoOptions)
const GUEST_BUTTON_XPATH = `//android.widget.Button[contains(@content-desc, 'as guest') or contains(@content-desc, 'als Gast') or contains(@content-desc, 'Als Gast') or @content-desc = '以访客身份继续浏览']`;
const SELECT_PROFILE_TITLE_XPATH = `//android.view.View[@content-desc = 'Select profile to continue']`;
const LOGIN_PAGE_LOGIN_BUTTON_XPATH = `//android.widget.Button[
  @content-desc = 'Sign in'
  or contains(@content-desc, 'Sign In')
  or @content-desc = 'Login'
  or @content-desc = 'Sign in to your Galaxy'
  or contains(@content-desc, 'Login with Samsung Account')
  or contains(@content-desc, 'Anmelden')
  or @content-desc = '三星账号授权登录'
]`;
const SAMSUNG_LOGO_BUTTON_XPATH = `//android.view.View[@content-desc = '其它登录方式']/following-sibling::android.widget.ImageView[2]`;
const EMAIL_SSO_BUTTON_XPATH = `//*[@resource-id = '${SAMSUNG_ACCOUNT_ID}/idSignInButtonLayout']`;
const GMAIL_SSO_BUTTON_XPATH = `//android.widget.Button[@resource-id = '${SAMSUNG_ACCOUNT_ID}/simpleSignInButton']`;

/** UK (English) values taken from Katalon Object Repository/LogIn — extend per-site if needed. */
export class LoginLocator {
  /** Katalon LogIn/loginPageGuestBtn */
  get continueAsGuestButton() {
    return $(GUEST_BUTTON_XPATH);
  }

  /** Title of the "Select profile to continue" screen (seen on IN) — Katalon Home/selectProfileToContinue anchor */
  get selectProfileTitle() {
    return $(SELECT_PROFILE_TITLE_XPATH);
  }

  /** First app screen after launch: Home, the login page or "Select profile" — one lookup instead of three */
  get appScreen() {
    return $([BNB_HOME_BUTTON_XPATH, GUEST_BUTTON_XPATH, SELECT_PROFILE_TITLE_XPATH].join(' | '));
  }

  /** appScreen or the notification permission popup that can cover it */
  get appScreenOrPermissionPopup() {
    return $(
      [BNB_HOME_BUTTON_XPATH, GUEST_BUTTON_XPATH, SELECT_PROFILE_TITLE_XPATH, NOTIFICATION_DENY_BUTTON_XPATH].join(' | ')
    );
  }

  /** Katalon Home/selectProfileToContinue — radio of the saved profile on "Select profile to continue" */
  get selectProfileRadio() {
    return $(
      `(//android.view.View[@content-desc = 'Select profile to continue']/following-sibling::android.view.View//android.widget.ImageView)[last()]`
    );
  }

  /** "Continue" on "Select profile to continue" (enabled after a profile is selected) */
  get selectProfileContinueButton() {
    return $(`//android.widget.Button[@content-desc = 'Continue']`);
  }

  /** Katalon LogIn/loginPageSignInBtn — login button on the login page (Sign in / Login with Samsung Account / 三星账号授权登录) */
  get loginPageLoginButton() {
    return $(LOGIN_PAGE_LOGIN_BUTTON_XPATH);
  }

  /** Any way to log in after tapping Login: the login page button, the CN Samsung logo, or the SSO Email / Google buttons */
  get loginPageOrSsoOptions() {
    return $(
      [LOGIN_PAGE_LOGIN_BUTTON_XPATH, SAMSUNG_LOGO_BUTTON_XPATH, EMAIL_SSO_BUTTON_XPATH, GMAIL_SSO_BUTTON_XPATH].join(' | ')
    );
  }

  /** Katalon LogIn/loginPageTnC — CN SSO privacy agreement checkbox (must be checked before any login button works) */
  get loginPagePrivacyCheckbox() {
    return $(`//android.widget.CheckBox[@checked = 'false' and ..//*[@content-desc = '《隐私政策》']]`);
  }

  /** Katalon LogIn/viaSamsungBtnCN — CN "其它登录方式" row, Samsung account logo (2nd icon) */
  get samsungAccountLogoButton() {
    return $(SAMSUNG_LOGO_BUTTON_XPATH);
  }

  /** Katalon LogIn/viaEmailBtn */
  get emailSsoButton() {
    return $(EMAIL_SSO_BUTTON_XPATH);
  }

  /** Katalon LogIn/viaGmailBtn — "Sign in with Google" */
  get gmailSsoButton() {
    return $(GMAIL_SSO_BUTTON_XPATH);
  }

  /** Katalon LogIn/addedGmail — account row in the Google account picker */
  googleAccountItem(email: string) {
    return $(
      `//android.widget.TextView[@resource-id = 'com.google.android.gms:id/account_name' and @text = '${email}']`
    );
  }

  /** Katalon LogIn/emailEdit */
  get emailInput() {
    return $(
      `//android.widget.AutoCompleteTextView
      | //android.widget.EditText[@resource-id = 'iptLgnPlnID']`
    );
  }

  /** Katalon LogIn/addAccountLogoArea — tapped to dismiss the keyboard */
  get addAccountLogoArea() {
    return $(
      `//*[(@class = 'android.widget.LinearLayout' and @resource-id = '${SAMSUNG_ACCOUNT_ID}/app_logo_parent')
        or @resource-id = '${SAMSUNG_ACCOUNT_ID}/idNextButton']`
    );
  }

  /** Katalon LogIn/emailNextBtn */
  get emailNextButton() {
    return $('//android.widget.Button');
  }

  /** Katalon LogIn/emailPasswordEdit */
  get passwordInput() {
    return $(
      `//android.widget.EditText[@resource-id = '${SAMSUNG_ACCOUNT_ID}/etSignInPassword']
      | //android.widget.EditText[@resource-id = 'iptLgnPlnPD']`
    );
  }

  /** Katalon LogIn/allAgreeChk */
  get allAgreeCheckbox() {
    return $(
      `//android.widget.ImageView[@resource-id = '${SAMSUNG_ACCOUNT_ID}/dotted_line']
      /following-sibling::android.widget.LinearLayout[1]//android.widget.CheckBox`
    );
  }

  /** Katalon LogIn/agreeBtn */
  get agreeButton() {
    return $(
      `//android.widget.Button[@resource-id = '${SAMSUNG_ACCOUNT_ID}/center_text']
      | //android.widget.Button[@resource-id = '${SAMSUNG_ACCOUNT_ID}/primary_button' and @text = 'Agree']
      | //android.widget.Button[@text = 'Agree']`
    );
  }

  /** Any element of the SSO screens (Samsung account app or the Google account picker) — gone once SSO hands back */
  get ssoScreenElement() {
    return $(
      `//*[starts-with(@resource-id, '${SAMSUNG_ACCOUNT_ID}/') or starts-with(@resource-id, 'com.google.android.gms:id/')]`
    );
  }

  /** Katalon LogIn/simpleLoginCancelBtn */
  get simpleLoginCancelButton() {
    return $(
      `//android.widget.FrameLayout[@resource-id = '${SAMSUNG_ACCOUNT_ID}/action_bar_root']
      //android.widget.Button[@resource-id = 'android:id/button2']`
    );
  }

  /** Katalon Initialization/purposeNextBtn */
  get purposeNextButton() {
    return $(
      `//android.widget.Button[@content-desc = 'Next' or @content-desc = 'Ok' or @content-desc = 'Weiter' or @content-desc = 'Nächste' or @content-desc = '下一页']`
    );
  }

  /** Katalon Initialization/purposeSkipBtn */
  get purposeSkipButton() {
    return $(`//android.widget.Button[@content-desc = 'Skip' or @content-desc = 'Überspringen' or @content-desc = '跳过']`);
  }

  /** Device Settings > Accounts (device language, English) — Katalon LogIn/settingAddAccount */
  get settingsAddAccount() {
    return $(`//android.widget.TextView[@resource-id = 'android:id/title' and @text = 'Add account']`);
  }

  /** Katalon LogIn/samsungAccountItem */
  get samsungAccountItem() {
    return $(`//android.widget.TextView[@text = 'Samsung account']`);
  }

  /** Katalon LogIn/removeAccountBtn */
  get removeAccountButton() {
    return $(
      `//android.widget.Button[@resource-id = 'com.android.settings:id/button' and @text = 'Remove account']`
    );
  }

  /** Katalon LogIn/removeAccountConfirmBtn */
  get removeAccountConfirmButton() {
    return $(
      `//android.widget.LinearLayout[@resource-id = 'com.android.settings:id/parentPanel']
      //android.widget.Button[@text = 'Remove account' or @text = 'Remove']`
    );
  }

  /** Katalon LogIn/signOutBtn */
  get signOutButton() {
    return $(
      `//android.widget.Button[@resource-id = '${SAMSUNG_ACCOUNT_ID}/sign_out_button' and @text = 'Sign out']
      | //android.widget.TextView[@content-desc = 'Sign out, Button']`
    );
  }

  /** Katalon LogIn/verifyNumberConfirmBtn */
  get verifyNumberConfirmButton() {
    return $(`//android.widget.Button[@text = 'Confirm']`);
  }

  /** Katalon LogIn/confirmPasswordEdit */
  get confirmPasswordInput() {
    return $(`//android.widget.EditText[@resource-id = '${SAMSUNG_ACCOUNT_ID}/confirm_password']`);
  }

  /** Katalon Object Repository/LogIn/wdsLoginPage */
  get wdsLoginPage() {
    return $(
      "//*[@class='android.webkit.WebView' and (@text='WMC' or @text='Sign In' or .='WMC' or .='Sign In')] | //*[@content-desc='Sign-in']"
    );
  }

  get wdsIdInput() {
    return $("//android.widget.EditText[@resource-id='userNameInput']");
  }

  get wdsPwInput() {
    return $("//android.widget.EditText[@resource-id='passwordInput']");
  }

  get wdsConfirmButton() {
    return $(
      "//android.widget.Button[@resource-id='submitButton' and (@text='Login' or .='Login')]"
    );
  }
}
