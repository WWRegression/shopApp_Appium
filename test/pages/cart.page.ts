import { BasePage } from './base.page';
import { CartLocator } from '../locators/cart.locator';
import { CartTradeInService } from '../services/tradein/cart-tradein.service';
import { CartScPlusService } from '../services/scplus/cart-scplus.service';
import { CartEupService } from '../services/eup/cart-eup.service';
import { CartSimService } from '../services/sim/cart-sim.service';
import { switchToNative, prepareWebViewPage } from '../helpers/context.helper';
import { getElementLabel, dispatchTouchStart } from '../helpers/element.helper';
import { assertEqual } from '../helpers/validation.helper';

export class CartPage extends BasePage {
  private readonly locator = new CartLocator();

  readonly tradeIn = new CartTradeInService();
  readonly scPlus = new CartScPlusService();
  readonly eup = new CartEupService();
  readonly sim = new CartSimService();

  /**
   * Katalon Cart.verifyCartLoad() 대응 — switchToWindowByPage('cart')는 window URL만
   * 보므로, 실제 카트 페이지 URL로 바뀌었지만 DOM은 아직 안 그려진 순간에도 전환이
   * 끝날 수 있다. cartLayout이 뜰 때까지 마저 기다려야 그 뒤 로직(예: clearCart의
   * remove 버튼 탐색)이 "아직 안 그려짐"을 "원래 비어있음"으로 오인하지 않는다.
   */
  async prepareCartPage(): Promise<boolean> {
    return prepareWebViewPage('cart', this.locator.cartLayout);
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

      try {
        await driver.execute('arguments[0].click();', await removeButton);
      } catch {
        // Element can go stale between isDisplayed() and click() — retry with a fresh query.
        continue;
      }

      const confirmButton = this.locator.removeConfirmButton;
      if (await confirmButton.isDisplayed().catch(() => false)) {
        await confirmButton.click();
        await confirmButton.waitForDisplayed({ timeout: 3000, reverse: true }).catch(() => undefined);
      }
    }

    await switchToNative();
  }

  /** All sku (data-modelcode) values currently in the cart, original case preserved. */
  private async getCartItemSkus(): Promise<string[]> {
    await this.prepareCartPage();
    const items = await this.locator.itemLines;

    const skus: string[] = [];
    for (const item of items) {
      const code = await item.getAttribute('data-modelcode').catch(() => null);
      if (code) {
        skus.push(code);
      }
    }
    return skus;
  }

  /** Sku of the first cart item. */
  async getFirstItemSku(): Promise<string> {
    const [first] = await this.getCartItemSkus();
    if (!first) {
      throw new Error('Cart: no items found');
    }
    return first;
  }

  /** Katalon Cart.verifySKUSelectedInCart() */
  async verifySkuInCart(sku: string): Promise<void> {
    const skus = await this.getCartItemSkus();
    const target = sku.toLowerCase();
    assertEqual(
      skus.some((code) => code.toLowerCase() === target),
      true
    );
  }

  /**
   * Auto-detects the cart UI variant:
   *  - stepper: + button carries a value/data-modelunit quantity — sum it.
   *  - row-per-unit (e.g. IN): one row per unit, no quantity value — count rows.
   */
  private async getSkuQuantity(sku: string): Promise<number> {
    const elements = await this.locator.quantityAddButton(sku);

    let total = 0;
    for (const el of elements) {
      const raw =
        (await el.getAttribute('value').catch(() => null)) ??
        (await el.getAttribute('data-modelunit').catch(() => null));
      const parsed = raw ? parseInt(raw, 10) : NaN;
      total += Number.isFinite(parsed) ? parsed : 1;
    }
    return total;
  }

  /**
   * Katalon Cart.addQuantityCart() — one button handles both the stepper + and buy-one-more.
   * Stepper buttons only respond to a touchstart dispatch, not plain click() (verified on device).
   */
  async addQuantity(sku: string): Promise<void> {
    await this.prepareCartPage();
    const before = await this.getSkuQuantity(sku);

    const elements = await this.locator.quantityAddButton(sku);
    const target = elements[0];
    if (!target) {
      throw new Error(`Cart: no add-quantity control found for sku=${sku}`);
    }
    await dispatchTouchStart(target);
    await driver.pause(1500);

    assertEqual(await this.getSkuQuantity(sku), before + 1);
  }

  /**
   * Katalon Cart.reduceQuantityCart() — clicks the stepper - button if present,
   * otherwise removes the row itself and confirms (row-per-unit variant).
   */
  async reduceQuantity(sku: string): Promise<void> {
    await this.prepareCartPage();
    const before = await this.getSkuQuantity(sku);

    const steppers = await this.locator.quantityReduceButton(sku);
    const stepperTarget = steppers[0];

    if (stepperTarget && (await stepperTarget.isDisplayed().catch(() => false))) {
      await dispatchTouchStart(stepperTarget);
    } else {
      const rowRemove = this.locator.rowRemoveButton(sku);
      await rowRemove.waitForDisplayed({ timeout: 5000 });
      await driver.execute('arguments[0].click();', await rowRemove);

      const confirmButton = this.locator.removeConfirmButton;
      if (await confirmButton.isDisplayed().catch(() => false)) {
        await confirmButton.click();
      }
    }
    await driver.pause(1500);

    assertEqual(await this.getSkuQuantity(sku), before - 1);
  }

  /** Katalon Cart.getCartIconQuantity() — leading number in the BNB cart tab's content-desc. */
  async getCartIconQuantity(): Promise<number> {
    await this.prepareHeaderBnb();
    const desc = await getElementLabel(this.bnbLocator.menu('cart'));
    const firstLine = desc.split(/\r?\n/)[0] ?? '';
    const match = firstLine.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /** Katalon Cart.verifyCartIconQty() */
  async verifyCartIconQuantity(expected: number): Promise<void> {
    assertEqual(await this.getCartIconQuantity(), expected);
  }
}
