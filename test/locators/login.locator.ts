const SAMSUNG_ACCOUNT_ID = 'com.osp.app.signin:id';

/** UK (English) values taken from Katalon Object Repository/LogIn — extend per-site if needed. */
export class LoginLocator {
  /** Katalon MyAccount/VerifyMenu/verifyProfiles — account name on the Samsung account settings screen */
  get samsungAccountName() {
    return $(`//android.widget.TextView[@resource-id = '${SAMSUNG_ACCOUNT_ID}/user_name']`);
  }

  /** Katalon LogIn/loginPageGuestBtn */
  get continueAsGuestButton() {
    return $(
      `//android.widget.Button[
      contains(@content-desc, 'as guest')
      or contains(@content-desc, 'als Gast')
      or contains(@content-desc, 'Als Gast')
      or contains(@content-desc, '以访客身份继续浏览')
      or contains(@content-desc, 'تسوّق الآن كضيف')
      or contains(@content-desc, 'Als Gast shoppen')
      or contains(@content-desc, 'Shop als gast')
      or contains(@content-desc, 'Acheter en tant qu’invité')
      or contains(@content-desc, 'Magasiner en tant qu’invité')
      or contains(@content-desc, 'Comprar como invitado')
      or contains(@content-desc, 'Continuar como invitado')
      or contains(@content-desc, 'Nakupovat jako host')
      or contains(@content-desc, 'Shoppe als Gast')
      or contains(@content-desc, 'Continuar como invitado/a')
      or contains(@content-desc, '以訪客身份購物')
      or contains(@content-desc, 'Folytatás vendégként')
      or contains(@content-desc, 'Belanja sebagai tamu')
      or contains(@content-desc, 'המשך כאורח')
      or contains(@content-desc, 'Continua come ospite')
      or contains(@content-desc, 'ゲストとして購入')
      or contains(@content-desc, 'Kupuj jako gość')
      or contains(@content-desc, 'Continuar sem registo')
      or contains(@content-desc, 'Cumpără ca oaspete')
      or contains(@content-desc, 'Handla som gäst')
      or contains(@content-desc, 'ดำเนินการต่อโดยไม่เข้าสู่ระบบ')
      or contains(@content-desc, 'Misafir olarak devam et')
      or contains(@content-desc, '以訪客身分購物')
      or contains(@content-desc, 'Mua sắm với tư cách Khách')
      ]`
    );
  }

  /** Title of the "Select profile to continue" screen (seen on IN) — Katalon Home/selectProfileToContinue anchor */
  get selectProfileTitle() {
    return $(`//android.view.View[@content-desc = 'Select profile to continue']`);
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
    return $(
      `//android.widget.Button[
      contains(@content-desc, 'Sign in')
      or contains(@content-desc, 'Sign In')
      or contains(@content-desc, 'Login')
      or contains(@content-desc, 'تسجيل')
      or contains(@content-desc, 'Sign in to your Galaxy')
      or contains(@content-desc, 'Login with Samsung Account')
      or contains(@content-desc, 'Anmelden')
      or contains(@content-desc, 'Inloggen')
      or contains(@content-desc, 'Se connecter')
      or contains(@content-desc, 'Connexion / Créer un compte')
      or contains(@content-desc, 'Iniciar sesión')
      or contains(@content-desc, '三星账号授权登录')
      or contains(@content-desc, 'Přihlásit')
      or contains(@content-desc, 'Anmelden/Registrieren')
      or contains(@content-desc, 'Regístrate')
      or contains(@content-desc, '登入')
      or contains(@content-desc, 'Bejelentkezés')
      or contains(@content-desc, 'התחברות / יצירת חשבון')
      or contains(@content-desc, 'Accedi')
      or contains(@content-desc, 'ログイン')
      or contains(@content-desc, 'Inicia sesión')
      or contains(@content-desc, 'Zaloguj się')
      or contains(@content-desc, 'Registe-se/Inicie sessão')
      or contains(@content-desc, 'Autentificare')
      or contains(@content-desc, 'Logga in')
      or contains(@content-desc, 'เข้าสู่ระบบ')
      or contains(@content-desc, 'Giriş yap / Üye ol')
      or contains(@content-desc, 'Đăng nhập')
      ]`
    );
  }

  /** Katalon LogIn/loginPageTnC — CN SSO privacy agreement checkbox (must be checked before any login button works) */
  get loginPagePrivacyCheckbox() {
    return $(`//android.widget.CheckBox[@checked = 'false' and ..//*[@content-desc = '《隐私政策》']]`);
  }

  /** Katalon LogIn/viaSamsungBtnCN — CN "其它登录方式" row, Samsung account logo (2nd icon) */
  get samsungAccountLogoButton() {
    return $(`//android.view.View[@content-desc = '其它登录方式']/following-sibling::android.widget.ImageView[2]`);
  }

  /** Katalon LogIn/viaEmailBtn */
  get emailSsoButton() {
    return $(`//*[@resource-id = '${SAMSUNG_ACCOUNT_ID}/idSignInButtonLayout']`);
  }

  /** Katalon LogIn/viaGmailBtn — "Sign in with Google" */
  get gmailSsoButton() {
    return $(`//android.widget.Button[@resource-id = '${SAMSUNG_ACCOUNT_ID}/simpleSignInButton']`);
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
