import { BasePage } from './base.page';
import { LoginLocator } from '../locators/login.locator';
import { isStgEnvironment } from '../helpers/env.helper';
import { switchToNative, switchToWebView } from '../helpers/context.helper';

/** STG(WDS) 로그인 계정 — 팀 계정에 맞게 수정 (Katalon WDS_ID/PW 대응). */
const WDS_CREDENTIALS = {
  userId: '',
  password: '',
};

export class LoginPage extends BasePage {
  private readonly locator = new LoginLocator();

  async loginWithEmailSso(): Promise<void> {
    // TODO: Implement Email SSO login flow
    await this.locator.emailSsoButton.click();
  }

  async loginWithGmailSso(): Promise<void> {
    // TODO: Implement Gmail SSO login flow
    await this.locator.gmailSsoButton.click();
  }

  async logout(): Promise<void> {
    // TODO: Implement logout flow
    await this.locator.logoutButton.click();
  }

  async continueAsGuest(): Promise<void> {
    // TODO: Implement continue as guest
    await this.locator.continueAsGuestButton.click();
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

    const visible = await this.locator.wdsLoginPage
      .waitForDisplayed({ timeout: timeoutMs })
      .then(
        () => true,
        () => false
      );

    if (!visible) {
      console.log('[login] WDS page not visible, skipping');
      return false;
    }

    if (!WDS_CREDENTIALS.userId || !WDS_CREDENTIALS.password) {
      throw new Error(
        '[login] WDS_CREDENTIALS is empty — set userId/password in test/pages/login.page.ts'
      );
    }

    console.log('[login] WDS page shown, starting login');

    // sts.secsso.net WebView 준비 (Katalon: switchToWebView + window scan)
    await switchToWebView(10000).catch(() => undefined);
    await switchToNative();

    await this.locator.wdsIdInput.waitForDisplayed({ timeout: 10000 });
    await this.locator.wdsIdInput.setValue(WDS_CREDENTIALS.userId);
    await this.locator.wdsPwInput.setValue(WDS_CREDENTIALS.password);
    await this.locator.wdsConfirmButton.click();
    await this.locator.wdsConfirmButton
      .waitForDisplayed({ timeout: 15000, reverse: true })
      .catch(() => undefined);

    return true;
  }
}
