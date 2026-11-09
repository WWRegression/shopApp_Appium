const SAMSUNG_ACCOUNT_PACKAGE = '@package="com.osp.app.signin"';
const SETTINGS_PACKAGE = '@package="com.android.settings"';

export class LoginLocator {
  

  /** Country row on the login boarding page. Tapping it opens the country list. */
  get splashCountryButton() {
    return $(
      `//android.widget.ImageView[
        contains(@content-desc, 'Country')
        or contains(@content-desc, '國家')
        or contains(@content-desc, 'país')
      ]`
    );
  }

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

  get selectProfileTitle() {
    return $(`//android.view.View[@content-desc = 'Select profile to continue']`);
  }

  get selectProfileRadio() {
    return $(
      `(//android.view.View[@content-desc = 'Select profile to continue']/following-sibling::android.view.View//android.widget.ImageView)[last()]`
    );
  }

  get selectProfileContinueButton() {
    return $(`//android.widget.Button[@content-desc = 'Continue']`);
  }

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

  get loginPagePrivacyCheckbox() {
    return $(`//android.widget.CheckBox[@checked = 'false' and ..//*[@content-desc = '《隐私政策》']]`);
  }

  get samsungAccountLogoButton() {
    return $(`//android.view.View[@content-desc = '其它登录方式']/following-sibling::android.widget.ImageView[2]`);
  }





  googleAccountItem(email: string) {
    return $(
      `//android.widget.TextView[@resource-id = 'com.google.android.gms:id/account_name' and @text = '${email}']`
    );
  }






  get purposeNextButton() {
    return $(
      `//android.widget.Button[@content-desc = 'Next' or @content-desc = 'Ok' or @content-desc = 'Weiter' or @content-desc = 'Nächste' or @content-desc = 'Siguiente' or @content-desc = '下一页']`
    );
  }

  get preferenceReviewLaterButton() {
    return $(`//android.widget.Button[@content-desc = 'Review Later']`);
  }

  get purposeSkipButton() {
    return $(
      `(//android.widget.Button[@content-desc = 'Skip' 
      or @content-desc = 'Überspringen' 
      or @content-desc = 'Omitir' 
      or @content-desc = 'Saltar' 
      or @content-desc = '跳过'
      or @content-desc = 'Continuar'
      or @content-desc = 'Přeskočit'
      or @content-desc = 'Passer'
      or @content-desc = '跳過'
      or @content-desc = 'Átugrás'
      or @content-desc = 'Lewati'
      or @content-desc = ' דלג'
      or @content-desc = 'スキップ'
      or @content-desc = 'Pomiń'
      or @content-desc = 'Omite'
      or @content-desc = 'تخطي'
      or @content-desc = 'Hoppa över'
      or @content-desc = 'ข้าม'
      or @content-desc = 'Atla'
      or @content-desc = 'Bỏ qua'
      ])[1]`
    );
  }

/* settings package -------------------------------------------------------------*/
  get settingAddedSamsungAccount() {
    return $(`//android.widget.TextView[${SETTINGS_PACKAGE} and @resource-id="android:id/summary" and @text="Samsung account"]`);
  }

  /** Manage accounts row of this email as a Samsung account (the same email can also be listed as Google) */
  settingSamsungAccountRow(email: string) {
    return $(
      `//android.widget.TextView[${SETTINGS_PACKAGE} and @resource-id="android:id/title" and @text="${email}"]
      [following-sibling::*//android.widget.TextView[@resource-id="android:id/summary" and @text="Samsung account"]]`
    );
  }

  get settingsAddAccount() {
    return $(`//android.widget.TextView[${SETTINGS_PACKAGE} and @resource-id="android:id/title" and @text="Add account"]`);
  }

  get settingAddSamsungAccount() {
    return $(`//android.widget.TextView[${SETTINGS_PACKAGE} and @resource-id="android:id/title" and @text="Samsung account"]`);
  }

  get settingRemoveAccountButton() {
    return $(`//android.widget.Button[${SETTINGS_PACKAGE} and @text = 'Remove account']`);
  }

  get settingRemoveConfirmButton() {
    return $(`//android.widget.Button[${SETTINGS_PACKAGE} and @text = 'Remove']`);
  }
/* end of settings package -------------------------------------------------------------*/

/* sso package -------------------------------------------------------------*/
  get ssoAccountUserName() {
    return $(`//android.widget.TextView[${SAMSUNG_ACCOUNT_PACKAGE} and contains(@resource-id, 'user_name')]`);
  }

  get ssoWithGmailButton() {
    return $(`//android.widget.Button[${SAMSUNG_ACCOUNT_PACKAGE} and contains(@resource-id,'simpleSignInButton')]`);
  }

  get ssoWithEmailButton() {
    return $(`//android.widget.Button[${SAMSUNG_ACCOUNT_PACKAGE} and contains(@resource-id,'idSignInButton')]`);
  }

  get ssoAllAgreeCheckbox() {
    return $(`//android.widget.ImageView[${SAMSUNG_ACCOUNT_PACKAGE} and contains(@resource-id,"dotted_line") ]
      /following-sibling::*[1]//android.widget.CheckBox`);
  }

  get ssoTermsScrollDownButton() {
      return $(`//android.widget.Button['${SAMSUNG_ACCOUNT_PACKAGE}' and @content-desc="Scroll down"]`);
  }

  get ssoAgreeButton() {
    return $(`//android.widget.Button['${SAMSUNG_ACCOUNT_PACKAGE}' and @text = 'Agree']`);
  }

  get ssoSamsungPassCancelButton() {
    return $(`//android.widget.Button['${SAMSUNG_ACCOUNT_PACKAGE}' and @text = 'Cancel']`);
  }

  get ssoSignOutButton() {
    return $(`//android.widget.Button[${SAMSUNG_ACCOUNT_PACKAGE} and @text = 'Sign out']`);
  }

  get ssoConfirmVerifyNumberButton() {
    return $(`//android.widget.Button[${SAMSUNG_ACCOUNT_PACKAGE} and @text = 'Confirm']`);
  }

  get ssoConfirmPasswordInput() {
    return $(`//android.widget.EditText[${SAMSUNG_ACCOUNT_PACKAGE} and contains(@resource-id,'confirm_password')]`);
  }

  get ssoEmailInput() {
    return $(
      `//android.widget.AutoCompleteTextView[${SAMSUNG_ACCOUNT_PACKAGE}]
      | //android.widget.EditText[@resource-id = 'iptLgnPlnID']`
    );
  }

  get ssoAddAccountLogoArea() {
    return $(`//android.widget.LinearLayout[${SAMSUNG_ACCOUNT_PACKAGE} and contains(@resource-id,"app_logo_parent")]`);
  }

  get ssoIdNextButton() {
    return $(`//android.widget.Button[${SAMSUNG_ACCOUNT_PACKAGE} and contains(@resource-id,"idNextButton")]`);
  }

  get ssoPasswordInput() {
    return $(
      `//android.widget.EditText[${SAMSUNG_ACCOUNT_PACKAGE} and contains(@resource-id,"etSignInPassword")]
      | //android.widget.EditText[@resource-id = 'iptLgnPlnPD']`
    );
  }

  get ssoPwNextButton() {
    return $(`//android.widget.Button[${SAMSUNG_ACCOUNT_PACKAGE} and contains(@resource-id,"pwNextButton")]`);
  }
/* end of sso package -------------------------------------------------------------*/

//wds login
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
