import { BasePage } from './base.page';
import { CartLocator } from '../locators/cart.locator';
import { CartTradeInService } from '../services/tradein/cart-tradein.service';
import { CartScPlusService } from '../services/scplus/cart-scplus.service';
import { CartEupService } from '../services/eup/cart-eup.service';
import { CartSimService } from '../services/sim/cart-sim.service';
import { switchToNative, preparePage } from '../helpers/context.helper';

export class CartPage extends BasePage {
  private readonly locator = new CartLocator();

  readonly tradeIn = new CartTradeInService();
  readonly scPlus = new CartScPlusService();
  readonly eup = new CartEupService();
  readonly sim = new CartSimService();

  /**
   * Katalon Cart.verifyCartLoad() 대응 — switchUrl('cart')는 window.location.href만
   * 보므로, 실제 카트 페이지 URL로 바뀌었지만 DOM은 아직 안 그려진 순간에도 true를
   * 반환할 수 있다. cartLayout이 뜰 때까지 마저 기다려야 그 뒤 로직(예: clearCart의
   * remove 버튼 탐색)이 "아직 안 그려짐"을 "원래 비어있음"으로 오인하지 않는다.
   */
  async prepareCartPage(): Promise<boolean> {
    return preparePage('cart', this.locator.cartLayout);
  }

  async proceedToCheckout(): Promise<void> {
    await this.prepareCartPage();
    await this.locator.checkoutButton.click();
  }

  /**
   * Katalon Cart.clearCart() — remove 아이콘이 안 보일 때까지 반복 제거.
   * 개수 상한 없음: mochaOpts.timeout(120s)이 이미 전체 테스트 단위의 무한루프 방지막 역할.
   */
  async clearCart(): Promise<void> {
    await this.selectBnbMenu('cart');
    await this.prepareCartPage();
    await this.dismissPopupIfShown();

    for (;;) {
      const removeButton = this.locator.removeItemButton;
      if (!(await removeButton.isDisplayed().catch(() => false))) {
        break;
      }

      await driver.execute('arguments[0].click();', await removeButton);

      const confirmButton = this.locator.removeConfirmButton;
      if (await confirmButton.isDisplayed().catch(() => false)) {
        await confirmButton.click();
        await confirmButton.waitForDisplayed({ timeout: 3000, reverse: true }).catch(() => undefined);
      }
    }

    await switchToNative();
  }
}
