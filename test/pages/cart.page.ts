import { BasePage } from './base.page';
import { CartLocator } from '../locators/cart.locator';
import { CheckoutLocator } from '../locators/checkout.locator';
import { CartTradeInService } from '../services/tradein/cart-tradein.service';
import { CartScPlusService } from '../services/scplus/cart-scplus.service';
import { CartEupService } from '../services/eup/cart-eup.service';
import { CartSimService } from '../services/sim/cart-sim.service';
import { switchToNative, prepareWebViewPage } from '../helpers/context.helper';
import { getElementLabel, dispatchTouchStart } from '../helpers/element.helper';
import { assertEqual } from '../helpers/validation.helper';
import { stripToAlnum } from '../helpers/data.helper';

export interface CartItemOptions {
  device?: string;
  storage?: string;
  color?: string;
  connectivity?: string;
  caseSize?: string;
}

export class CartPage extends BasePage {
  private readonly locator = new CartLocator();
  private readonly checkoutLocator = new CheckoutLocator();

  readonly tradeIn = new CartTradeInService();
  readonly scPlus = new CartScPlusService();
  readonly eup = new CartEupService();
  readonly sim = new CartSimService();

  /** Waits for the cart URL AND the cart layout to render — the URL can change before the DOM catches up. */
  async prepareCartPage(): Promise<boolean> {
    return prepareWebViewPage('cart', this.locator.cartLayout);
  }

  /** Clicks checkout and waits for the checkout page to load. */
  async clickContinueToCheckout(): Promise<void> {
    await this.locator.checkoutButton.click();
    await prepareWebViewPage('checkout', this.checkoutLocator.activeStep);
  }

  /** Removes items one by one until the cart is empty. No iteration cap — mochaOpts.timeout guards runaway loops. */
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
        // Modal can close on its own between the check above and the click below.
        await driver.execute('arguments[0].click();', await confirmButton).catch(() => undefined);
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

  /** Verifies a sku is present in the cart. */
  async verifySku(sku: string): Promise<void> {
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

  /** Increments quantity via the stepper + button. Only responds to a touchstart dispatch, not click(). */
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

  /** Decrements quantity via the stepper - button, or removes the row itself when there's no stepper. */
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

  /** Reads the item count from the BNB cart tab's content-desc (leading number). */
  async getCartIconQuantity(): Promise<number> {
    await this.prepareHeaderBnb();
    const desc = await getElementLabel(this.bnbLocator.menu('cart'));
    const firstLine = desc.split(/\r?\n/)[0] ?? '';
    const match = firstLine.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async verifyCartIconQuantity(expected: number): Promise<void> {
    assertEqual(await this.getCartIconQuantity(), expected);
  }

  /**
   * Verifies each given field's value appears somewhere in that cart item's name/sku/options
   * text. Plain strings in, not tied to any product model — reusable outside flagship specs too.
   */
  async verifyOptions(sku: string, options: CartItemOptions): Promise<void> {
    await this.prepareCartPage();
    await this.locator.cartItemSku(sku).waitForDisplayed({ timeout: 10000 }).catch(() => undefined);

    const name = await getElementLabel(this.locator.cartItemName(sku));
    const skuText = await getElementLabel(this.locator.cartItemSku(sku));
    const optionEls = [...(await this.locator.cartItemOptions(sku))];
    const optionTexts = await Promise.all(optionEls.map((el) => el.getText()));
    const combined = stripToAlnum(`${name} ${skuText} ${optionTexts.join(' ')}`);

    console.log(`[Cart] item raw: name="${name}" sku="${skuText}" options=${JSON.stringify(optionTexts)}`);

    for (const [label, value] of Object.entries(options)) {
      if (!value) {
        console.log(`[Cart] check ${label}: skipped (no value)`);
        continue;
      }
      const found = combined.includes(stripToAlnum(value));
      console.log(`[Cart] check ${label}: expected="${value}" -> found=${found}`);
      assertEqual(found, true);
    }
  }
}
