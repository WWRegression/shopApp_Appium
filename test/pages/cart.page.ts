import { BasePage } from './base.page';
import { CartLocator } from '../locators/cart.locator';
import { CartTradeInService } from '../services/tradein/cart-tradein.service';
import { CartScPlusService } from '../services/scplus/cart-scplus.service';
import { CartEupService } from '../services/eup/cart-eup.service';
import { CartSimService } from '../services/sim/cart-sim.service';
import { CartTradeUpService } from '../services/tradeup/cart-tradeup.service';
import { switchToNative, prepareWebViewPage, isCurrentWebViewPage, getCurrentWebViewPage } from '../helpers/context.helper';
import { getElementLabel, clickIfDisplayed, clickElement, isDisplayedOrFalse, jsTouchStart, jsClick, waitForDisplayedOrFalse, getInputValue, setInputValue, scrollAndJsClick } from '../helpers/element.helper';
import { assertEqual } from '../helpers/validation.helper';
import { markFailed, markFailedAndStop, FieldCheck } from '../helpers/report.helper';
import { currentSiteCode } from '../helpers/tc-filter.helper';
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
    // Some sites (IT) show the checkout button only at the bottom of the page.
    // DOM click: on IT it opens checkout in a new window and a WebDriver click then never returns
    await scrollAndJsClick(this.locator.checkoutButton);
    if(await clickIfDisplayed(this.locator.modalCheckoutButton, 1000)) {
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
    // Item rows can still be rendering right after the cart page itself becomes ready
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
    const skus = await this.getCartItemSkus();
    const pass = skus.some((code) => code.toLowerCase() === sku.toLowerCase());
    console.warn(`[Cart.verifySku] expected="${sku}" actual=${skus.join(", ") || "none"} result=${pass ? "PASS" : "FAIL"}`);
    await markFailedAndStop(
      async () => assertEqual(pass, true),
      `verifySku: expected "${sku}" not found in cart (found: ${skus.join(', ') || 'none'})`
    );
  }

  /** Clicks the cart item name. The name itself may be the link, or an anchor inside it. */
  async clickProductName(sku: string): Promise<void> {
    await this.prepareCartPage();
    const nameEl = this.locator.cartItemName(sku);
    const name = (await getElementLabel(nameEl).catch(() => '')).trim();
    if (!(await clickIfDisplayed(nameEl, 10000))) {
      throw new Error(`[Cart.clickProductName] product name not clickable for sku "${sku}"`);
    }
    console.warn(`[Cart.clickProductName] clicked "${name || sku}"`);
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
    // With some services (SIM, EUP) a confirm popup opens and the quantity only changes after Yes
    if (await clickIfDisplayed(this.locator.quantityChangeConfirmYesButton, 1000)) {
      console.log('[increaseQuantity] quantity change confirm popup: Yes clicked');
      await driver.pause(3000);
    }
    // await this.locator.checkoutButtons.waitForEnabled({ timeout: 3000 });

    const after_cartCount = await this.getCartTotalCount();
    const after_bnbCount = await this.getBNBCartCount();
    console.warn(`[increaseQuantity] after_bnbCount: ${after_bnbCount} | after_cartCount: ${after_cartCount}`);
    
    assertEqual(after_cartCount, before_cartCount + 1);
    assertEqual(after_bnbCount, before_bnbCount + 1);
  }

  /** Types a quantity into the item's quantity input and commits it; 0 removes the item. */
  async inputQuantity(sku: string, quantity: number): Promise<void> {
    // IN has no quantity input
    if (currentSiteCode() === 'IN') {
      console.log('[inputQuantity] skipped for IN');
      return;
    }
    await this.prepareCartPage();
    const input = this.locator.quantityInput(sku);
    const found = await waitForDisplayedOrFalse(input, { timeout: 5000 });
    markFailed([{ label: 'quantity input', pass: found, detail: `not found for ${sku}` }], 'inputQuantity');
    if (!found) {
      return;
    }

    const typed = await this.typeIntoQuantityInput(input, String(quantity));
    await this.commitQuantityInput(input);
    // Some sites ask to confirm the removal at 0
    if (quantity === 0) {
      await clickIfDisplayed(this.locator.removeConfirmButton, 3000);
    }
    // Native gestures before the cart update lands can drop it (UK)
    await driver.pause(['CL', 'PE', 'US'].includes(currentSiteCode()) ? 5000 : 3000);
    console.log(`[inputQuantity] sku=${sku} typed=${quantity} input="${typed}"`);
  }

  /** Replaces the input's value by typing, falling back to a JS set; returns the value it ends up holding. */
  private async typeIntoQuantityInput(input: ChainablePromiseElement, value: string): Promise<string> {
    await input.click().catch(() => undefined);
    // Select the current value first so typing replaces it without an empty value in between
    await driver.execute((el) => {
      (el as unknown as HTMLInputElement).focus();
      (el as unknown as HTMLInputElement).select();
    }, await input);
    await driver.keys(value.split(''));
    // Typed keys can miss the input when the WebView keeps focus elsewhere
    if ((await getInputValue(input)) !== value) {
      await setInputValue(input, value);
    }
    return getInputValue(input);
  }

  /** Commits the typed quantity: the cart updates on the input's change event. */
  private async commitQuantityInput(input: ChainablePromiseElement): Promise<void> {
    await driver.keys('Enter');
    // The input is already gone when the item was removed
    await driver
      .execute((el) => {
        el.dispatchEvent(new Event('change', { bubbles: true }));
        (el as unknown as HTMLInputElement).blur();
      }, await input)
      .catch(() => undefined);
  }

  /** Records a failure when the item's quantity input does not show `expected`, waiting up to 8s for the cart to update. */
  async verifyItemQuantity(sku: string, expected: number): Promise<void> {
    // IN has no quantity input
    if (currentSiteCode() === 'IN') {
      return;
    }
    await this.prepareCartPage();
    let actual = '';
    const pass = await driver
      .waitUntil(
        async () => {
          actual = await getInputValue(this.locator.quantityInput(sku));
          return actual === String(expected);
        },
        { timeout: 8000, interval: 500 }
      )
      .then(() => true, () => false);
    console.log(`[verifyItemQuantity] sku=${sku} expected=${expected} actual=${actual || 'none'} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'item quantity', pass, detail: `expected ${expected}, actual ${actual || 'none'}` }], 'verifyItemQuantity');
  }

  /** Records a failure when the BNB cart tab count differs from the cart's total item count, waiting up to 10s for the tab to update. */
  async verifyCartIconMatchesCart(): Promise<void> {
    await this.prepareCartPage();
    const cartCount = (await this.isCartEmpty()) ? 0 : await this.getCartTotalCount();
    let bnbCount = -1;
    const pass = await driver
      .waitUntil(async () => (bnbCount = await this.getBNBCartCount()) === cartCount, { timeout: 10000, interval: 1000 })
      .then(() => true, () => false);
    console.log(`[verifyCartIconMatchesCart] expected cart icon=${cartCount} actual=${bnbCount} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'cart icon count', pass, detail: `cart ${cartCount}, icon ${bnbCount}` }], 'verifyCartIconMatchesCart');
  }

  /** Records a failure when the service area shows no error text within 10s (e.g. after raising the quantity to 2). */
  async verifyServiceErrorText(service: 'tradeIn' | 'scPlus' | 'tradeUp' | 'eup'): Promise<void> {
    await this.prepareCartPage();
    const errorText = this.locator.serviceErrorText(service);
    let text = '';
    // The error span is always in the DOM, so it must also have text
    const shown = await driver
      .waitUntil(
        async () => {
          text = (await errorText.isDisplayed().catch(() => false)) ? ((await errorText.getText().catch(() => '')) ?? '').trim() : '';
          return Boolean(text);
        },
        { timeout: 10000, interval: 1000 }
      )
      .then(() => true, () => false);
    console.log(`[verifyServiceErrorText] service=${service} expected error text="shown" actual="${text || 'none'}" result=${shown ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: `${service} error text on cart`, pass: shown }], 'verifyServiceErrorText');
  }

  /** Records a failure when the cart still shows items after up to 10s. */
  async verifyCartIsEmpty(): Promise<void> {
    await this.prepareCartPage();
    const empty = await this.isCartEmpty(10000);
    console.log(`[verifyCartIsEmpty] expected cart="empty" actual="${empty ? 'empty' : 'has items'}" result=${empty ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'cart is empty', pass: empty }], 'verifyCartIsEmpty');
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
