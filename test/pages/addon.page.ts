import { BasePage } from './base.page';
import { AddOnLocator } from '../locators/addon.locator';

export class AddOnPage extends BasePage {
  private readonly locator = new AddOnLocator();

  /**
   * Katalon BC.skipAllSplash() 대응 — Continue/Skip 버튼이 보이면 클릭한다.
   * add-on 화면은 buy 버튼 클릭 직후 같은 URL 위에서 비동기로 그려지므로,
   * 즉시 체크(isDisplayed)가 아니라 잠깐 기다렸다가(waitForDisplayed) 확인한다.
   */
  async clickSplashContinue(): Promise<void> {
    const button = this.locator.continueButton;
    const shown = await button.waitForDisplayed({ timeout: 5000 }).catch(() => false);
    if (shown) {
      await button.click();
    }
  }
}
