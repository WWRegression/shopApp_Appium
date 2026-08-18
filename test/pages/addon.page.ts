import { BasePage } from './base.page';
import { AddOnLocator } from '../locators/addon.locator';

export class AddOnPage extends BasePage {
  private readonly locator = new AddOnLocator();

  /**
   * Katalon BC.skipAllSplash() 대응 — "All"이라는 이름 그대로, add-on 화면은
   * free gift / evoucher / add-on 등 여러 splash 단계가 연달아 나올 수 있다.
   * 한 번 클릭으로는 그 중 한 단계만 넘어가므로, Continue/Skip 버튼이 더는
   * 안 보일 때까지 반복 클릭한다 (locator는 매 반복마다 다시 resolve —
   * 단계가 바뀌면 DOM 안의 실제 매칭 대상도 바뀌기 때문).
   *
   * 매 반복마다 popupSkipButton을 먼저 확인한다 — confirm-popup이 이미 떠 있으면
   * continueButton 후보(예: evoucher:continue)는 어두운 오버레이에 가려져 있어서
   * 클릭이 intercept된다. isDisplayed()로 즉시 확인만 하고 폴링은 안 한다 — 팝업이
   * 없는 나라(대부분)에서 매 반복 불필요하게 몇 초씩 기다리지 않기 위함. 우리가
   * 막으려는 상황은 "팝업이 이미 떠 있는 채로 다음 반복이 시작되는 것"이라
   * 즉시 확인으로 충분하다.
   */
  async clickSplashContinue(): Promise<void> {
    for (;;) {
      if (await this.locator.popupSkipButton.isDisplayed().catch(() => false)) {
        await this.locator.popupSkipButton.click();
        continue;
      }

      const button = this.locator.continueButton;
      const shown = await button.waitForDisplayed({ timeout: 5000 }).catch(() => false);
      if (!shown) {
        break;
      }
      await button.click();
    }
  }
}
