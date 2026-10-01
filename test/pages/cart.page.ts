import { BasePage } from './base.page';
import { CartLocator } from '../locators/cart.locator';
import { CartTradeInService } from '../services/tradein/cart-tradein.service';
import { CartScPlusService } from '../services/scplus/cart-scplus.service';
import { CartEupService } from '../services/eup/cart-eup.service';
import { CartSimService } from '../services/sim/cart-sim.service';
import { switchToNative, prepareWebViewPage } from '../helpers/context.helper';
import {
  getElementLabel,
  dispatchTouchStart,
  jsClick,
  scrollAndJsClick,
  clickIfDisplayed,
  clickElement,
  isDisplayedSafe,
} from '../helpers/element.helper';
import { assertEqual, assertElementDisplayed } from '../helpers/validation.helper';
import { markFailed, markFailedAndStop, FieldCheck } from '../helpers/report.helper';
import { removeNonWordChars } from '../helpers/data.helper';

export interface CartItemOptions {
  deviceName?: string;
  storage?: string;
  color?: string;
  connectivity?: string;
  caseSize?: string;
}

export class CartPage extends BasePage {
  private readonly locator = new CartLocator();

  readonly tradeIn = new CartTradeInService();
  readonly scPlus = new CartScPlusService();
  readonly eup = new CartEupService();
  readonly sim = new CartSimService();

  /**
   * Wait up to WEBVIEW_PAGE_READY_MS (10s) for cart. Throws on timeout so the TC fails fast.
   */
  async prepareCartPage(): Promise<void> {
    console.warn('prepareCartPage: start');
    const ready = await prepareWebViewPage('cart', this.locator.cartLayout);
    if (!ready) {
      throw new Error('prepareCartPage: cart not ready within 10s');
    }
  }

  /** Clicks checkout and waits for the checkout page to load. */
  async clickContinueToCheckout(): Promise<void> {
    await this.locator.checkoutButton.click();
    // US asks again in an Express Checkout modal (Katalon Cart/cartToCheckoutBtn_2nd)
    if (await clickIfDisplayed(this.locator.checkoutModalButton, 2000)) {
      console.log('[clickContinueToCheckout] checkout modal — Continue to checkout tapped');
    }
  }

  /**
   * Empty the cart via UI (precondition).
   * Loops remove → optional confirm until empty, with a hard attempt cap.
   */
  async clearCart(): Promise<void> {
    const maxAttempts = 10;

    await this.selectBnbMenu('cart');
    await this.prepareCartPage();
    await this.dismissPopupIfShown();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.warn(`[clearCart] attempt ${attempt}`);
      await this.removeOneCartItem()

      if (await this.isCartEmpty(3000)) {
        console.warn('[clearCart] empty cart');
        await switchToNative();
        return;
      }
    }
  }

  private async isCartEmpty(waitTime: number = 0): Promise<boolean> {
    return this.locator.emptyCartSection.waitForDisplayed({ timeout: waitTime }).then(() => true).catch(() => false);
  }

  /** Katalon LogIn.loginOnEmptyCart — taps Sign in on the empty cart; the login page is handled by LoginPage.clickLoginBtnOnLoginPage(). */
  async clickLoginOnEmptyCart(): Promise<void> {
    await this.prepareCartPage();
    await markFailedAndStop(
      () => clickElement(this.locator.emptyCartLoginButton, { timeout: 5000 }),
      'Login failed on the Cart page: empty cart Sign in button not found'
    );
  }

  /** Katalon LogIn.verifyLoggedInCartPage — cart loads and the empty cart Sign in button is gone. */
  async verifyLoggedInOnCart(): Promise<void> {
    await this.prepareCartPage();
    const loginShown = await isDisplayedSafe(this.locator.emptyCartLoginButton);
    console.log(`[verifyLoggedInOnCart] empty cart Sign in shown=${loginShown}`);
    markFailed([{ label: 'empty cart Sign in button hidden after login', pass: !loginShown }], 'verifyLoggedInOnCart');
    await switchToNative();

    // Some sites (e.g. US) reopen cart without BNB after login — go back only then, so BNB-tab carts are untouched
    if (!(await isDisplayedSafe(this.bnbLocator.mypageButton))) {
      console.log('[verifyLoggedInOnCart] BNB hidden, going back');
      await driver.back();
    }
  }

  /** Clicks first remove control (+ confirm if shown). Returns false if remove UI is absent. */
  private async removeOneCartItem(): Promise<boolean> {
    if (!(await clickIfDisplayed(this.locator.removeItemButton))) {
      return false;
    }
    await clickIfDisplayed(this.locator.removeConfirmButton);
    return true;
  }

  /** All sku (data-modelcode) values currently in the cart, original case preserved. */
  private async getCartItemSkus(): Promise<string[]> {
    await this.prepareCartPage();
    // Item rows can still be rendering right after the cart page itself becomes ready.
    await driver
      .waitUntil(async () => (await this.locator.itemLines.length) > 0, { timeout: 8000, interval: 300 })
      .catch(() => undefined);
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
    markFailed([{ label: 'cart has items', pass: Boolean(first) }], 'getFirstItemSku');
    return first;
  }

  /** Verifies a sku is present in the cart. */
  async verifySku(sku: string): Promise<void> {
    await console.warn('verifySku: start');
    const skus = await this.getCartItemSkus();
    const target = sku.toLowerCase();
    await markFailedAndStop(
      async () => assertEqual(skus.some((code) => code.toLowerCase() === target), true),
      `verifySku: expected "${sku}" not found in cart (found: ${skus.join(', ') || 'none'})`
    );
  }

  async getItemPrice(sku: string): Promise<string> {
    await this.prepareCartPage();
    const el = this.locator.itemPrice(sku);
    await el.waitForExist({ timeout: 10000 });
    return ((await el.getText().catch(() => '')) ?? '').trim();
  }

  async verifyTradeUpApplied(): Promise<void> {
    await this.prepareCartPage();
    await assertElementDisplayed(
      this.locator.tradeUpAppliedLabel,
      'Trade-Up not found in cart'
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
    markFailed([{ label: 'add-quantity control found', pass: Boolean(target), detail: `sku=${sku}` }], 'addQuantity');
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
      await jsClick(rowRemove);

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
    await console.warn('verifyOptions: start');
    await this.prepareCartPage();
    await this.locator.cartItemSku(sku).waitForDisplayed({ timeout: 10000 }).catch(() => undefined);

    const name = await getElementLabel(this.locator.cartItemName(sku));
    const skuText = await getElementLabel(this.locator.cartItemSku(sku));
    const optionEls = [...(await this.locator.cartItemOptions(sku))];
    const optionTexts = await Promise.all(optionEls.map((el) => el.getText()));
    const combined = removeNonWordChars(`${name} ${skuText} ${optionTexts.join(' ')}`);

    console.log(`[Cart] item raw: name="${name}" sku="${skuText}" options=${JSON.stringify(optionTexts)}`);

    const checks: FieldCheck[] = [];
    for (const [label, value] of Object.entries(options)) {
      if (!value) {
        console.log(`[Cart] check ${label}: skipped (no value)`);
        continue;
      }
      const found = combined.includes(removeNonWordChars(value));
      console.log(`[Cart] check ${label}: expected="${value}" -> found=${found}`);
      checks.push({ label, pass: found, detail: `expected "${value}"` });
    }
    markFailed(checks, 'verifyOptions');
  }
}
