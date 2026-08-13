import { BasePage } from './base.page';
import { MypageLocator } from '../locators/mypage.locator';

export class MypagePage extends BasePage {
  private readonly locator = new MypageLocator();

  async tapLogin(): Promise<void> {
    // TODO: Implement login navigation
    await this.locator.loginButton.click();
  }

  async getAccountName(): Promise<string> {
    // TODO: Implement account name retrieval
    return await this.locator.accountName.getText();
  }
}
