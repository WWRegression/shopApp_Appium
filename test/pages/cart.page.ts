import { BasePage } from './base.page';
import { CartLocator } from '../locators/cart.locator';
import { CartTradeInService } from '../services/tradein/cart-tradein.service';
import { CartScPlusService } from '../services/scplus/cart-scplus.service';
import { CartEupService } from '../services/eup/cart-eup.service';
import { CartSimService } from '../services/sim/cart-sim.service';
import { CartTradeUpService } from '../services/tradeup/cart-tradeup.service';
import { switchToNative, prepareWebViewPage, isCurrentWebViewPage, getCurrentWebViewPage } from '../helpers/context.helper';
import { getElementLabel, clickIfDisplayed, clickElement, isDisplayedOrFalse, jsTouchStart, jsClick } from '../helpers/element.helper';
import { assertEqual } from '../helpers/validation.helper';
import { markFailedAndStop, FieldCheck } from '../helpers/report.helper';
import { parseNumber, removeNonWordChars, normalizeProductName, productNameMatches } from '../helpers/data.helper';

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
   * Wait up to 20s for the cart layout. Throws on timeout so the TC fails fast.
   */
  async prepareCartPage(timeoutMs = 20000): Promise<void> {
    console.warn('prepareCartPage: start');
    const ready = await prepareWebViewPage('cart', () => this.locator.cartLayout, timeoutMs);
    if (!ready) {
      throw new Error(`prepareCartPage: cart not ready within ${timeoutMs / 1000}s`);
    }
  }

  async isCartPage(): Promise<boolean> {
    return isCurrentWebViewPage('cart');
  }

  /** Verifies the Cart page is shown (checked from native context so a closed window cannot hold the check). */
  async verifyCartPage(): Promise<void> {
    await switchToNative();
    const onCart = await driver
      .waitUntil(() => this.isCartPage(), { timeout: 8000, interval: 1000 })
      .then(() => true, () => false);
    const actual = onCart ? 'cart' : (await getCurrentWebViewPage()).page;
    console.log(`[verifyCartPage] expected=cart actual=${actual} result=${onCart ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'Cart page not shown', pass: onCart, detail: `actual ${actual}` }], 'verifyCartPage');
  }

  /** Clicks checkout and waits for the checkout page to load. */
  async clickContinueToCheckout(): Promise<void> {
    if(await clickIfDisplayed(this.locator.checkoutButton, 3000)) {
      console.warn('[clickContinueToCheckout] checkout button clicked');
    }
    if(await clickIfDisplayed(this.locator.modalCheckoutButton, 3000)) {
      console.warn('[clickContinueToCheckout] modal checkout button clicked');
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

  /** Taps the cart's Sign in; the login page is handled by LoginPage.clickLoginBtnOnLoginPage(). */
  async clickLoginOnCart(): Promise<void> {
    await this.prepareCartPage();
    // An empty cart has its own Sign in; a cart with items only has the sign-in banner at the top
    const button = (await isDisplayedOrFalse(this.locator.cartLoginButton))
      ? this.locator.cartLoginButton
      : this.locator.cartBannerLoginButton;
    await markFailedAndStop(
      () => clickElement(button, { timeout: 5000 }),
      'Login failed on the Cart page: Sign in button not found'
    );
  }

  /** Cart loads and the empty cart Sign in button is gone. */
  async verifyLoggedInOnCart(): Promise<void> {
    await this.prepareCartPage();
    const loginShown = await isDisplayedOrFalse(this.locator.emptyCartLoginButton);
    console.log(`[verifyLoggedInOnCart] expected empty cart Sign in shown=false actual=${loginShown} result=${loginShown ? 'FAIL' : 'PASS'}`);
    markFailedAndStop([{ label: 'user is not logged in (empty cart Sign in button still shown)', pass: !loginShown }], 'verifyLoggedInOnCart');
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
    markFailedAndStop([{ label: 'cart has items', pass: Boolean(first) }], 'getFirstItemSku');
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

  /** Verifies a cart item name matches the expected (PF) product name. */
  async verifyProductName(expected: string | null): Promise<void> {
    const skus = await this.getCartItemSkus();
    const itemNames: string[] = [];
    for (const sku of skus) {
      itemNames.push(await getElementLabel(this.locator.cartItemName(sku)));
    }
    const matched = itemNames.find((name) => productNameMatches(expected, normalizeProductName(name)));
    const pass = Boolean(matched);
    console.log(`[Cart.verifyProductName] expected="${expected}" actual=${JSON.stringify(itemNames)} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop(
      [{ label: 'product name not found in cart items', pass, detail: `expected "${expected}", cart items ${JSON.stringify(itemNames)}` }],
      'Cart.verifyProductName'
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
    const optionText = (await Promise.all(optionEls.map((el) => el.getText()))).join('');
    const combined = removeNonWordChars(`${name} ${skuText} ${optionText}`);
    const actualByField: Record<string, string> = { deviceName: name, sku: skuText };

    console.log(`[Cart.verifyOptions] item=${JSON.stringify({ deviceName: name, sku: skuText, options: optionText })}`);

    const checks: FieldCheck[] = [];
    for (const [label, value] of Object.entries(options)) {
      if (!value) {
        console.log(`[Cart.verifyOptions] ${label} : skipped (no value)`);
        continue;
      }
      const found = combined.includes(removeNonWordChars(value));
      const actual = actualByField[label] ?? optionText;
      console.log(`[Cart.verifyOptions] ${label} : expected=${value} || actual=${actual} || result=${found ? 'PASS' : 'FAIL'}`);
      checks.push({ label, pass: found, detail: `expected "${value}", actual "${actual}"` });
    }
    markFailedAndStop(checks, 'verifyOptions');
  }
}
