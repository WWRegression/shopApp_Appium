import { BasePage } from './base.page';
import { CartLocator } from '../locators/cart.locator';
import { CartTradeInService } from '../services/tradein/cart-tradein.service';
import { CartScPlusService } from '../services/scplus/cart-scplus.service';
import { CartEupService } from '../services/eup/cart-eup.service';
import { CartSimService } from '../services/sim/cart-sim.service';
import { CartTradeUpService } from '../services/tradeup/cart-tradeup.service';
import { switchToNative, prepareWebViewPage } from '../helpers/context.helper';
import { getElementLabel, clickIfDisplayed, clickFirstDisplayed, isDisplayedOrFalse, jsTouchStart, jsClick } from '../helpers/element.helper';
import { assertEqual } from '../helpers/validation.helper';
import { markFailed, markFailedAndStop, FieldCheck } from '../helpers/report.helper';
import { parseNumber, removeNonWordChars } from '../helpers/data.helper';

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
  readonly scPlus = new CartScPlusService(this);
  readonly eup = new CartEupService();
  readonly sim = new CartSimService();
  readonly tradeUp = new CartTradeUpService();

  /**
   * Wait up to WEBVIEW_PAGE_READY_MS (10s) for cart. Throws on timeout so the TC fails fast.
   */
  async prepareCartPage(timeoutMs?: number): Promise<void> {
    console.warn('prepareCartPage: start');
    const ready = await prepareWebViewPage('cart', this.locator.cartLayout, timeoutMs);
    if (!ready) {
      throw new Error(`prepareCartPage: cart not ready within ${(timeoutMs ?? 10000) / 1000}s`);
    }
  }

  /** Clicks checkout and waits for the checkout page to load. */
  async clickContinueToCheckout(): Promise<void> {
    await clickFirstDisplayed(this.locator.checkoutButtons);
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

  /** Katalon LogIn.loginOnCart / loginOnEmptyCart — taps the cart's Sign in; the login page is handled by LoginPage.clickLoginBtnOnLoginPage(). */
  async clickLoginOnCart(): Promise<void> {
    await this.prepareCartPage();
    await markFailedAndStop(
      () => clickFirstDisplayed(this.locator.cartLoginButton, { timeout: 5000 }),
      'Login failed on the Cart page: Sign in button not found'
    );
  }

  /** Katalon LogIn.verifyLoggedInCartPage — cart loads and the empty cart Sign in button is gone. */
  async verifyLoggedInOnCart(): Promise<void> {
    await this.prepareCartPage();
    const loginShown = await isDisplayedOrFalse(this.locator.emptyCartLoginButton);
    console.log(`[verifyLoggedInOnCart] expected empty cart Sign in shown=false actual=${loginShown} result=${loginShown ? 'FAIL' : 'PASS'}`);
    markFailed([{ label: 'user is not logged in (empty cart Sign in button still shown)', pass: !loginShown }], 'verifyLoggedInOnCart');
    await switchToNative();

    // Some sites (e.g. US) reopen cart without BNB after login — go back only then, so BNB-tab carts are untouched
    if (!(await isDisplayedOrFalse(this.bnbLocator.mypageButton))) {
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
    await this.prepareCartPage();
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

  /** Get the quantity of the cart item */
  async getCartTotalCount(): Promise<number> {
    const cartTotalCountSection = await this.locator.cartTotalCountSection.getText();
    return parseNumber(cartTotalCountSection);
  }

  /** Increments quantity via the stepper + button. */
  async increaseQuantity(sku: string): Promise<void> {
    const before_cartCount = await this.getCartTotalCount();
    const before_bnbCount = await this.getBNBCartCount();
    await this.selectBnbMenu('cart');
    console.warn(`[increaseQuantity] before_bnbCount: ${before_bnbCount} | before_cartCount: ${before_cartCount}`);

    await this.prepareCartPage();
    const increaseButton = await this.locator.quantityIncreaseButton(sku);
    await jsTouchStart(increaseButton);
    await jsClick(increaseButton);
    await driver.pause(3000);
    // await this.locator.checkoutButtons.waitForEnabled({ timeout: 3000 });
    
    const after_cartCount = await this.getCartTotalCount();
    const after_bnbCount = await this.getBNBCartCount();
    console.warn(`[increaseQuantity] after_bnbCount: ${after_bnbCount} | after_cartCount: ${after_cartCount}`);
    
    assertEqual(after_cartCount, before_cartCount + 1);
    assertEqual(after_bnbCount, before_bnbCount + 1);
  }

  /** Decrements quantity via the stepper - button. */
  async decreaseQuantity(sku: string): Promise<void> {
    const before_bnbCount = await this.getBNBCartCount();
    await this.selectBnbMenu('cart');

    await this.prepareCartPage();
    const before_cartCount = await this.getCartTotalCount();
    console.warn(`[decreaseQuantity] before_bnbCount: ${before_bnbCount} | before_cartCount: ${before_cartCount}`);

    const decreaseButton = await this.locator.quantityDecreaseButton(sku);
    if (await isDisplayedOrFalse(decreaseButton)) {
      await jsTouchStart(decreaseButton);
      await jsClick(decreaseButton);      
    } else {
      await this.removeOneCartItem();
    }    
    await driver.pause(3000);
    // await this.locator.checkoutButtons.waitForEnabled({ timeout: 3000 });
    
    const after_cartCount = await this.getCartTotalCount();
    const after_bnbCount = await this.getBNBCartCount();
    console.warn(`[decreaseQuantity] after_bnbCount: ${after_bnbCount} | after_cartCount: ${after_cartCount}`);

    assertEqual(after_cartCount, before_cartCount - 1);
    assertEqual(after_bnbCount, before_bnbCount - 1);
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
