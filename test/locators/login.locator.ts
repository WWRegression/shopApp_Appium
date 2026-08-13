export class LoginLocator {
  get emailSsoButton() {
    // TODO: Replace with actual Email SSO selector
    return $('~YOUR_LOGIN_EMAIL_SSO_SELECTOR');
  }

  get gmailSsoButton() {
    // TODO: Replace with actual Gmail SSO selector
    return $('~YOUR_LOGIN_GMAIL_SSO_SELECTOR');
  }

  get logoutButton() {
    // TODO: Replace with actual logout selector
    return $('~YOUR_LOGIN_LOGOUT_SELECTOR');
  }

  get continueAsGuestButton() {
    // TODO: Replace with actual continue as guest selector
    return $('~YOUR_LOGIN_CONTINUE_AS_GUEST_SELECTOR');
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
