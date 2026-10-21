/// <reference lib="dom" />

import { BasePage } from './base.page';
import { CheckoutLocator, CHECKOUT_FORMS, INVALID_FIELD_SELECTOR, AUTO_CHECK_CHECKBOX_SELECTOR } from '../locators/checkout.locator';
import { prepareWebViewPage } from '../helpers/context.helper';
import { getSiteData as getSite } from '../../config/site';
import { scrollAndJsClick, getElementLabel, isDisplayedOrFalse, jsClick, clickElement, waitForDisplayedOrFalse, clickIfDisplayed } from '../helpers/element.helper';
import { scrollDown, scrollElementToCenter } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';
import { normalizeProductName, productNameMatches } from '../helpers/data.helper';
import type { LoadedSite } from '../../config/site';
import { currentSiteCode } from '../helpers/tc-filter.helper';

/** Which Edit button(s) to verify on the payment step, per site. */
const EDIT_SEQUENCE_BY_SITE: Record<string, Array<'customer' | 'delivery'>> = {
  default: ['customer'],
  SE: ['customer', 'delivery'],
  US: ['delivery'],
};

/** Sites where the Customer Details step also shows a saved address to compare against payment. */
const ADDRESS_MATCH_SITES_CUSTOMER = ['SE', 'DE', 'ES', 'AT', 'AU', 'HU', 'ID', 'SG', 'TH', 'VN', 'UK'];

/** Sites where the Delivery step also shows a saved address to compare against payment. */
const ADDRESS_MATCH_SITES_DELIVERY = ['SE', 'DE', 'ES', 'BE', 'BE_FR', 'AT', 'AU', 'HU', 'ID', 'SG', 'TH', 'UK', 'VN'];

export type CheckoutFormId = (typeof CHECKOUT_FORMS)[number];

const ADDRESS_FORMS: CheckoutFormId[] = ['app-customer-address-v2', 'app-customer-address-cn'];

interface FieldDescriptor {
  index: number;
  tag: string;
  key: string;
  required: boolean;
  hasValue: boolean;
  isAutocomplete: boolean;
  visible: boolean;
}

export class CheckoutPage extends BasePage {
  private readonly locator = new CheckoutLocator();

  private readonly formHandlers: Partial<Record<CheckoutFormId, () => Promise<void>>> = {
    'app-customer-info-v2': () => this.fillContactInfo('app-customer-info-v2'),
    'app-customer-address-v2': () => this.fillAddressInfo('app-customer-address-v2'),
    'app-checkout-step-delivery': () => this.selectDeliveryOptionIfPresent(),
    // CN uses its own contact / address / invoice forms
    'app-customer-info': () => this.fillContactInfo('app-customer-info'),
    'app-customer-address-cn': () => this.fillAddressInfo('app-customer-address-cn'),
    'app-billing-address-cn': () => this.fillContactInfo('app-billing-address-cn'),
  };

  /** Switches to the checkout WebView and stops the TC when the checkout page is not reached. */
  async prepareCheckoutPage(): Promise<void> {
    const ready = await prepareWebViewPage('checkout', () => this.locator.checkoutLayout, 20000);
    markFailedAndStop([{ label: 'checkout page reached', pass: ready }], 'prepareCheckoutPage');
  }

  /** Returns the order/item price text shown on checkout ('' when none is found). */
  async getDisplayedItemPrice(): Promise<string> {
    await this.prepareCheckoutPage();
    const candidates = [
      '.view-order-container .price',
      '.order-summary-wrapper .price',
      '.cx-summary-amount',
      "[class*='summary-total__amount']",
      '.price__current',
      '.price-special__current',
    ];
    for (const sel of candidates) {
      const el = $(sel);
      if (await el.isDisplayed().catch(() => false)) {
        const text = ((await el.getText().catch(() => '')) ?? '').trim();
        if (text) {
          return text;
        }
      }
    }
    return '';
  }

  /** Opens the View Order summary when it is collapsed. */
  private async ensureViewOrderExpanded(): Promise<void> {
    // CN shows the order summary inline, with no View Order toggle
    if (currentSiteCode() === 'CN') {
      return;
    }
    if (await this.locator.viewOrderExpanded.isExisting().catch(() => false)) {
      return;
    }
    // DOM click: the fixed summary overlay (US) intercepts pointer clicks on the toggles
    if (!(await this.locator.viewOrderSummaryToggle.waitForExist({ timeout: 10000 }).then(() => true, () => false))) {
      console.log('[ensureViewOrderExpanded] View Order toggle not found');
      return;
    }
    await jsClick(this.locator.viewOrderSummaryToggle);
    await this.locator.viewOrderExpanded.waitForExist({ timeout: 5000 }).catch(() => undefined);
    // US nests the items in a collapsed "You have N item(s) in your cart" panel
    if (await this.locator.viewOrderItemListCollapsed.isExisting().catch(() => false)) {
      await jsClick(this.locator.viewOrderItemListCollapsed);
      await this.locator.viewOrderItemListCollapsed.waitForExist({ timeout: 3000, reverse: true }).catch(() => undefined);
    }
  }

  /** Closes the View Order summary when it is open; the open summary covers the step's Next button. */
  private async ensureViewOrderCollapsed(): Promise<void> {
    if (!(await this.locator.viewOrderExpanded.isExisting().catch(() => false))) {
      return;
    }
    await jsClick(this.locator.viewOrderSummaryToggle);
    await this.locator.viewOrderExpanded.waitForExist({ timeout: 5000, reverse: true }).catch(() => undefined);
  }

  /** Opens View Order, verifies an item name matches the expected (PF) product name, then closes it again. */
  async verifyProductName(expected: string | null): Promise<void> {
    await this.ensureViewOrderExpanded();
    let itemNames: string[] = [];
    // Right after the window switch the list can show only the service items, so re-read until the product shows
    const pass = await driver
      .waitUntil(
        async () => {
          itemNames = [];
          for (const el of await this.locator.viewOrderItemNames) {
            // A hidden copy of the summary is also in the DOM; getElementLabel returns '' for it
            const name = await getElementLabel(el as unknown as ChainablePromiseElement);
            if (name) itemNames.push(name);
          }
          return itemNames.some((name) => productNameMatches(expected, normalizeProductName(name)));
        },
        { timeout: 5000, interval: 500 }
      )
      .then(() => true, () => false);
    console.log(`[Checkout.verifyProductName] expected="${expected}" actual=${JSON.stringify(itemNames)} result=${pass ? 'PASS' : 'FAIL'}`);
    await this.ensureViewOrderCollapsed();
    markFailedAndStop(
      [{ label: 'product name not found in View Order', pass, detail: `expected "${expected}", items ${JSON.stringify(itemNames)}` }],
      'Checkout.verifyProductName'
    );
  }

  /** Clicks Login on the guest checkout; the login page that opens is handled by LoginPage. */
  async clickLoginOnCheckout(): Promise<void> {
    const loginButton = this.locator.checkoutLoginButton;
    await scrollElementToCenter(loginButton).catch(() => undefined);
    await markFailedAndStop(
      () => clickElement(loginButton, { timeout: 5000 }),
      'Login failed on the Checkout page: Login button not found'
    );
  }

  /** Returns the known checkout forms currently displayed (usually one, can be more). */
  private async getVisibleForms(): Promise<CheckoutFormId[]> {
    // Read in one browser call: right after Next the step re-renders, and stale element handles wait seconds each
    const tags = await driver
      .execute<string[], [string]>((selector) => {
        return Array.from(document.querySelectorAll<HTMLElement>(selector))
          .filter((el) => {
            const style = window.getComputedStyle(el);
            return el.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map((el) => el.tagName.toLowerCase());
      }, CHECKOUT_FORMS.join(', '))
      .catch(() => [] as string[]);
    return [...new Set(tags)].filter((tag): tag is CheckoutFormId => (CHECKOUT_FORMS as readonly string[]).includes(tag));
  }

  /** True while a loading spinner or overlay is displayed. */
  private async isLoadingVisible(): Promise<boolean> {
    return driver.execute<boolean, []>(() => {
      const spinnerSelector =
        '.loading-spinner, .mat-progress-spinner, .mat-progress-bar, .cdk-overlay-backdrop, mat-spinner';

      return Array.from(document.querySelectorAll<HTMLElement>(spinnerSelector)).some((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      });
    });
  }

  /** Waits until the loading spinner/overlay is gone, so the next step does not act on a busy page. */
  private async waitForPageStable(timeoutMs = 8000): Promise<void> {
    await driver
      .waitUntil(async () => !(await this.isLoadingVisible()), { timeout: timeoutMs, interval: 300 })
      .catch(() => undefined);
  }

  /** Waits until a checkout form exists; the page shell renders before its step form mounts. */
  private async waitForAnyFormToExist(timeoutMs = 8000): Promise<void> {
    await driver
      .waitUntil(async () => (await this.locator.formElements.length) > 0, { timeout: timeoutMs, interval: 300 })
      .catch(() => undefined);
  }

  /** Waits until the form's fields render; the form host mounts before its dynamic fields (CA_FR contact). */
  private async waitForFormFields(formId: CheckoutFormId, timeoutMs = 5000): Promise<void> {
    await driver
      .waitUntil(async () => (await this.getFieldDescriptors(formId)).length > 0, { timeout: timeoutMs, interval: 300 })
      .catch(() => console.log(`[waitForFormFields] ${formId}: no fields within ${timeoutMs / 1000}s`));
  }

  /** Waits until the active step moves on from `previous`; the old step's forms stay in the DOM for a moment after Next. */
  private async waitForStepChange(previous: string, timeoutMs = 8000): Promise<void> {
    await driver
      .waitUntil(async () => (await this.getCurrentCheckoutStep()) !== previous, { timeout: timeoutMs, interval: 300 })
      .catch(() => undefined);
  }

  /** Clicks Next on the current step and logs the fields still invalid when the step does not advance. */
  private async clickMoveToNext(): Promise<void> {
    // A form can mount after the step is filled (CA_FR delivery address), so a disabled Next returns for proceedToPayment to fill again
    if (!(await this.locator.moveToNextButton.waitForClickable({ timeout: 10000 }).then(() => true, () => false))) {
      console.log('[clickMoveToNext] Next not clickable yet, the step is filled again on the next pass');
      return;
    }
    // CN has a sticky Next and a page-bottom Next, so log which one was clicked
    const buttonId = (await this.locator.moveToNextButton.getAttribute('id').catch(() => '')) || 'no id';
    await this.locator.moveToNextButton.click();
    console.log(`[clickMoveToNext] Next clicked (id=${buttonId})`);
    await driver.pause(1000);

    // Read in one browser call: the step can re-render right after Next, and stale element handles wait 10s each
    const invalidLabels = await driver
      .execute<string[], [string]>((selector) => {
        return Array.from(document.querySelectorAll<HTMLElement>(selector))
          .filter((el) => el.getClientRects().length > 0)
          .map(
            (el) =>
              el.innerText?.trim() ||
              el.getAttribute('aria-label') ||
              el.getAttribute('name') ||
              el.getAttribute('formcontrolname') ||
              el.tagName.toLowerCase()
          );
      }, INVALID_FIELD_SELECTOR)
      .catch(() => [] as string[]);

    if (invalidLabels.length > 0) {
      console.log(`clickMoveToNext: form still invalid: ${JSON.stringify(invalidLabels)}`);
    }
  }

  /** Clicks "Use suggested address" / "Use this address" on the address popup; the popup shows on US only. */
  private async clickUseAddressOnPopupIfShown(): Promise<void> {
    if (getSite().siteCode !== 'US') {
      return;
    }
    const button = this.locator.addressPopupUseAddressButton;
    if (!(await waitForDisplayedOrFalse(button, { timeout: 5000 }))) {
      return;
    }
    const label = await getElementLabel(button);
    await clickElement(button);
    console.log(`[clickUseAddressOnPopupIfShown] "${label}" clicked`);
    // The step stays on delivery after the popup closes, so the caller clicks Next again
    await button.waitForDisplayed({ timeout: 5000, reverse: true }).catch(() => undefined);
  }

  /** Reads every field of a form (key, required, value, visibility) in one browser call. */
  private async getFieldDescriptors(formTag: string): Promise<FieldDescriptor[]> {
    return driver.execute<FieldDescriptor[], [string]>((tag) => {
      const fieldSelector =
        "input[name]:not([type='checkbox']):not([type='radio']):not([disabled]), " +
        "input[formcontrolname]:not([type='checkbox']), select[name], mat-select[name], mat-select[formcontrolname]";

      const form = document.querySelector(tag);
      if (!form) {
        return [];
      }

      return Array.from(form.querySelectorAll<HTMLElement>(fieldSelector)).map((el, index) => {
        const required =
          el.hasAttribute('required') ||
          el.getAttribute('aria-required') === 'true' ||
          (el.className || '').includes('mat-mdc-select-required') ||
          Boolean(el.querySelector('.mat-mdc-form-field-required-marker'));

        const key = (el.getAttribute('name') || el.getAttribute('formcontrolname') || '').toLowerCase();
        const tagName = el.tagName.toLowerCase();
        const hasValue =
          tagName === 'input'
            ? Boolean((el as HTMLInputElement).value)
            : tagName === 'select'
              ? Boolean((el as HTMLSelectElement).value)
              : Boolean(el.querySelector('.mat-mdc-select-min-line')?.textContent?.trim());
        // Autocomplete fields open a suggestion list after typing: the address search box, and the CN address line
        const isAutocomplete = key === 'searchaddress' || (key === 'line1' && tag === 'app-customer-address-cn');

        return { index, tag: tagName, key, required, hasValue, isAutocomplete, visible: el.offsetParent !== null };
      });
    }, formTag);
  }

  private async setInputValue(field: ChainablePromiseElement, value: string, isAutocomplete: boolean): Promise<void> {
    // Native setter + events so the Angular form sees the value; JS click avoids the floating label over an empty field
    await jsClick(field).catch(() => undefined);
    await driver.execute(
      (el, val) => {
        const input = el as HTMLInputElement;
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
        nativeSetter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      },
      await field,
      value
    );

    if (!isAutocomplete) {
      return;
    }

    // Autocomplete: pick the first suggestion so the list closes
    const suggestion = $('(//mat-option)[1]');
    const suggestionAppeared = await suggestion
      .waitForExist({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (suggestionAppeared) {
      await scrollAndJsClick(suggestion).catch(() => undefined);
    }
  }

  /** Selects the option matching `value`, or the first enabled option when there is no match. */
  private async fillSelectField(field: ChainablePromiseElement, value: string | undefined): Promise<void> {
    // Dependent selects (CN province > city > district, AU suburb after the postcode) load options late,
    // and a panel opened before they arrive stays empty, so it is closed and opened again
    for (let attempt = 0; attempt < 3; attempt++) {
      await scrollAndJsClick(field).catch(() => undefined);
      if (await $('(//mat-option)[1]').waitForExist({ timeout: 3000 }).then(() => true, () => false)) {
        break;
      }
      console.log(`[fillSelectField] no options yet, reopen (attempt ${attempt + 1})`);
      await driver.keys('Escape').catch(() => undefined);
    }
    const match = value ? $(`//mat-option[contains(., "${value}")]`) : undefined;
    // Skips a disabled placeholder option (IN "Select a Floor")
    const target =
      match && (await match.isExisting().catch(() => false)) ? match : $('(//mat-option[not(@aria-disabled="true")])[1]');
    await scrollAndJsClick(target).catch(() => undefined);
  }

  /** Fills the required fields of a form from `valueMap`, keyed by field name (lowercase). */
  private async fillFormFields(formId: CheckoutFormId, valueMap: Record<string, string | undefined>): Promise<void> {
    const descriptors = await this.getFieldDescriptors(formId);
    const fields = this.locator.fieldsIn(formId);

    for (const desc of descriptors) {
      if (!desc.required) {
        continue;
      }

      const value = valueMap[desc.key];
      const field = fields[desc.index];

      // Inputs are set only when a value is given; hidden selects are skipped (CN keeps a hidden billing form)
      if (desc.tag === 'input') {
        if (value) {
          await this.setInputValue(field, value, desc.isAutocomplete);
        }
      } else if (!desc.hasValue && desc.visible) {
        await this.fillSelectField(field, value);
      }
    }
  }

  /** Fills the contact fields (name, email, phone, tax ID) with the site customer data. */
  async fillContactInfo(formId: CheckoutFormId, overrides?: Partial<LoadedSite['customer']>): Promise<void> {
    await this.waitForFormFields(formId);
    const data = { ...getSite().customer, ...overrides };
    await this.fillFormFields(formId, {
      firstname: data.firstName,
      // CN has a single full-name field
      fullname: data.firstName,
      lastname: data.lastName,
      email: data.email,
      phone: data.mobile,
      // Required tax ID on the contact step (CL "RUT")
      vatnumber: data.documentNumber,
    });
  }

  /** Fills the delivery address fields with the site shipping data. */
  async fillAddressInfo(formId: CheckoutFormId, overrides?: Partial<LoadedSite['shipping']>): Promise<void> {
    // A saved address is preselected and used as it is
    if (await this.hasSavedAddress()) {
      console.log(`[fillAddressInfo] saved address shown, form fill skipped`);
      return;
    }

    await this.waitForFormFields(formId);
    // Without a saved address the form shows a search box, so switch to manual entry
    const hasManualFields = (await this.getFieldDescriptors(formId)).some((d) => d.key === 'line1');
    if (!hasManualFields && (await this.locator.enterAddressManuallyLink.isExisting().catch(() => false))) {
      await scrollAndJsClick(this.locator.enterAddressManuallyLink).catch(() => undefined);
    }

    const data = { ...getSite().shipping, ...overrides };
    // IN: the pincode lookup fills City / State and resets fields typed before it returns, so the pincode goes first
    const pincodeFirst = getSite().siteCode === 'IN' && (await this.fillPincodeAndWaitForCity(formId, data.postalCode));
    await this.fillFormFields(formId, {
      line1: data.address1,
      line2: data.address2,
      postalcode: pincodeFirst ? undefined : data.postalCode,
      town: data.town,
      state: data.district,
      district: data.district,
      floor: data.floor,
      regioniso: data.searchText,
      searchaddress: data.searchText,
      phone: getSite().customer.mobile,
    });
  }

  /** True when a saved address is shown on the current checkout step. */
  private async hasSavedAddress(): Promise<boolean> {
    return isDisplayedOrFalse(this.locator.savedAddressInfo);
  }

  /** Stops the TC when a saved address is still shown on the address step; the TC deletes all addresses beforehand. */
  private async verifyNoSavedAddress(): Promise<void> {
    const saved = await this.hasSavedAddress();
    console.log(`[verifyNoSavedAddress] expected saved address="none" actual="${saved ? 'shown' : 'none'}" result=${saved ? 'FAIL' : 'PASS'}`);
    markFailedAndStop(
      [{ label: 'Failed to delete the address. A saved address is still present.', pass: !saved }],
      'verifyNoSavedAddress'
    );
  }

  /** Types the pincode and waits up to 5s for the City field it fills; returns false when the form has no pincode field. */
  private async fillPincodeAndWaitForCity(formId: CheckoutFormId, postalCode: string | undefined): Promise<boolean> {
    const pincode = (await this.getFieldDescriptors(formId)).find((d) => d.key === 'postalcode' && d.visible);
    if (!pincode || !postalCode) {
      return false;
    }
    await this.setInputValue(this.locator.fieldsIn(formId)[pincode.index], postalCode, false);
    const cityFilled = await driver
      .waitUntil(
        () => driver.execute((tag) => Boolean(document.querySelector<HTMLInputElement>(`${tag} input[name='town']`)?.value), formId),
        { timeout: 5000, interval: 300 }
      )
      .then(() => true, () => false);
    console.log(`[fillPincodeAndWaitForCity] pincode=${postalCode} city auto-filled=${cityFilled}`);
    return true;
  }

  /** Selects the delivery method and option when the step offers them. */
  private async selectDeliveryOptionIfPresent(): Promise<void> {
    // isExisting, not isDisplayed: the method icon reports as not displayed
    if (await this.locator.deliveryMethodButton.isExisting().catch(() => false)) {
      await scrollAndJsClick(this.locator.deliveryMethodButton).catch(() => undefined);
    }
    // The option card is clicked, not its radio input: the input is 0x0 and never becomes interactable
    await clickIfDisplayed(this.locator.deliveryOptionButton);
  }

  /** Checks the required checkboxes (terms, save address) of the current step. */
  private async checkRequiredCheckboxes(): Promise<void> {
    // Re-queried on each loop: the unchecked set shrinks as boxes get checked
    for (let i = 0; i < 5; i++) {
      const index = await this.getFirstVisibleAutoCheckIndex();
      if (index < 0) {
        return;
      }
      await scrollAndJsClick(this.locator.autoCheckCheckboxes[index]).catch(() => undefined);
    }
  }

  /** Index of the first unchecked auto-check box on screen; boxes in hidden forms (CN keeps the new-address form under d-none) are skipped. */
  private async getFirstVisibleAutoCheckIndex(): Promise<number> {
    return driver
      .execute<number, [string]>((selector) => {
        return Array.from(document.querySelectorAll<HTMLElement>(selector)).findIndex((el) => {
          const box = (el.closest('mat-checkbox, mat-radio-button, label') as HTMLElement | null) ?? el;
          return !el.closest('.d-none') && box.getClientRects().length > 0;
        });
      }, AUTO_CHECK_CHECKBOX_SELECTOR)
      .catch(() => -1);
  }

  /** Fills a form that has no dedicated handler: required selects only. */
  private async fillGenericStep(formId: CheckoutFormId): Promise<void> {
    await this.fillFormFields(formId, {});
  }

  /** Records a failure when the rewards opt-in checkbox is shown on the current step; it must stay hidden. */
  private async verifyNoRewardOptIn(): Promise<void> {
    // Checked by visibility: US keeps a hidden opt-in in the DOM on the delivery step
    const exposed = await this.locator.rewardOptIn.isDisplayed().catch(() => false);
    const step = await this.getCurrentCheckoutStep();
    console.log(
      `[verifyNoRewardOptIn] step=${step} expected opt-in="hidden" actual opt-in="${exposed ? 'exposed' : 'hidden'}" result=${exposed ? 'FAIL' : 'PASS'}`
    );
    markFailed([{ label: 'reward opt-in hidden', pass: !exposed, detail: `exposed on ${step}` }], 'verifyNoRewardOptIn');
  }

  /** Opens View Order and stops the TC when the estimated reward points area is not shown; IL has no rewards. */
  async verifyRewardArea(): Promise<void> {
    if (currentSiteCode() === 'IL') {
      console.log('[verifyRewardArea] skipped for IL');
      return;
    }
    // Some sites (NL) show the reward area only inside the expanded View Order summary
    await this.ensureViewOrderExpanded();
    const shown = await waitForDisplayedOrFalse(this.locator.rewardArea, { timeout: 3000 });
    console.log(`[verifyRewardArea] expected reward area="shown" actual="${shown ? 'shown' : 'hidden'}" result=${shown ? 'PASS' : 'FAIL'}`);
    await this.ensureViewOrderCollapsed();
    markFailedAndStop([{ label: 'reward area shown', pass: shown }], 'verifyRewardArea');
  }

  /** Verifies the payment step: expands the first payment method and checks its submit-order button matches the method title. */
  async checkPaymentMethod(): Promise<void> {
    const forms = await this.getVisibleForms();
    // CN lists payment methods in app-payment-modes-flat instead of app-checkout-step-payment
    const onPaymentPage = forms.includes('app-checkout-step-payment') || forms.includes('app-payment-modes-flat');
    markFailedAndStop([{ label: 'payment step reached', pass: onPaymentPage }], 'checkPaymentMethod');

    const titles = await this.locator.paymentMethodTitles;
    const hasTitles = (await titles.length) > 0;
    markFailedAndStop([{ label: 'payment method titles found', pass: hasTitles }], 'checkPaymentMethod');

    const first = titles[0];
    // CN: flat payment buttons with nothing to expand, so only the first one is checked to be clickable
    if (getSite().siteCode === 'CN') {
      const clickable = await first.isClickable().catch(() => false);
      console.log(`[checkPaymentMethod] expected first payment method="clickable" actual="${clickable ? 'clickable' : 'not clickable'}" result=${clickable ? 'PASS' : 'FAIL'}`);
      markFailedAndStop([{ label: 'first payment method clickable', pass: clickable }], 'checkPaymentMethod');
      return;
    }
    const title = await getElementLabel(first);
    markFailedAndStop([{ label: 'payment method title text', pass: title.length > 0 }], 'checkPaymentMethod');

    if (!(await this.locator.paymentMethodExpanded.isExisting().catch(() => false))) {
      await scrollAndJsClick(first);
    }
    await this.locator.paymentMethodExpanded.waitForExist({ timeout: 10000 });
    await this.waitForPageStable();

    // A combined title like "Credit Card/ Debit Card" matches a loader named after one half;
    // the name before "(" is also tried, since the bracketed method list can differ from the loader (CL Mercado Pago)
    const titleParts = title
      .toLowerCase()
      .split('/')
      .flatMap((part) => [part, part.split('(')[0]])
      .map((part) => part.trim())
      .filter(Boolean);
    const loaders = await this.locator.submitOrderButtonLoaders;
    let matched = false;
    for (const loader of loaders) {
      const id = ((await loader.getAttribute('id').catch(() => '')) ?? '').toLowerCase();
      const dataAnLa = ((await loader.getAttribute('data-an-la').catch(() => '')) ?? '').toLowerCase();
      if (titleParts.some((part) => id.includes(part) || dataAnLa.includes(part))) {
        matched = true;
        break;
      }
    }

    markFailedAndStop([{ label: 'submit-order loader matched title', pass: matched, detail: title }], 'checkPaymentMethod');
  }

  /** Verifies the active checkout step is `expected`, waiting up to 5s for it to settle after a Back. */
  async verifyCheckoutStep(expected: string): Promise<void> {
    await this.prepareCheckoutPage();
    let actual = '';
    const pass = await driver
      .waitUntil(async () => (actual = await this.getCurrentCheckoutStep()) === expected, { timeout: 5000, interval: 500 })
      .then(() => true, () => false);
    console.log(`[verifyCheckoutStep] expected=${expected} actual=${actual || 'none'} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'checkout step after Back', pass, detail: `expected ${expected}, actual ${actual || 'none'}` }], 'verifyCheckoutStep');
  }

  /** Returns the active step name, e.g. CHECKOUT_STEP_CONTACT_INFO / _DELIVERY / _PAYMENT. */
  async getCurrentCheckoutStep(): Promise<string> {
    return (await this.locator.activeStep.getAttribute('data-activestepname').catch(() => '')) ?? '';
  }

  /** Strips commas/spaces and lowercases an address so two renderings can be compared. */
  private normalizeAddress(text: string): string {
    return text.replace(/[,\s]+/g, '').toLowerCase().trim();
  }

  /** Returns the normalized address shown on the payment step. */
  async getAddressInfoFromPayment(): Promise<string> {
    return this.normalizeAddress(await getElementLabel(this.locator.paymentPreviewAddress));
  }

  /** Returns the normalized saved address shown on the contact/delivery step. */
  async getSavedAddressInfo(): Promise<string> {
    return this.normalizeAddress(await getElementLabel(this.locator.savedAddressInfo));
  }

  /** Records a failure when the saved address and the payment-step address do not match. */
  private verifyAddressMatch(paymentAddress: string, savedAddress: string): void {
    const matches =
      Boolean(paymentAddress) &&
      Boolean(savedAddress) &&
      (paymentAddress.includes(savedAddress) || savedAddress.includes(paymentAddress));
    markFailed(
      [{ label: 'saved address matches payment preview', pass: matches, detail: `payment="${paymentAddress}" saved="${savedAddress}"` }],
      'verifyAddressMatch'
    );
  }

  /** Clicks Edit on Customer Details and verifies it returns to the Contact Info step. */
  async verifyEditInCustomerDetails(paymentAddress?: string): Promise<void> {
    await scrollAndJsClick(this.locator.editCustomerDetailsButton);
    const step = await this.getCurrentCheckoutStep();
    markFailed(
      [{ label: 'edit navigated to contact info step', pass: step === 'CHECKOUT_STEP_CONTACT_INFO', detail: step }],
      'verifyEditInCustomerDetails'
    );

    // Only some sites show a saved address on this step to compare
    if (paymentAddress && ADDRESS_MATCH_SITES_CUSTOMER.includes(getSite().siteCode)) {
      this.verifyAddressMatch(paymentAddress, await this.getSavedAddressInfo());
    }
  }

  /** Clicks Edit on Delivery Options and verifies it returns to the Delivery step. */
  async verifyEditInDeliveryOptions(paymentAddress?: string): Promise<void> {
    await scrollAndJsClick(this.locator.editDeliveryOptionsButton);
    const step = await this.getCurrentCheckoutStep();
    markFailed(
      [{ label: 'edit navigated to delivery step', pass: step === 'CHECKOUT_STEP_DELIVERY', detail: step }],
      'verifyEditInDeliveryOptions'
    );

    // Only some sites show a saved address on this step to compare
    if (paymentAddress && ADDRESS_MATCH_SITES_DELIVERY.includes(getSite().siteCode)) {
      this.verifyAddressMatch(paymentAddress, await this.getSavedAddressInfo());
    }
  }

  /** Verifies the Edit button(s) of the payment step; which ones exist varies by site. */
  async handleCheckoutEditButton(paymentAddress?: string): Promise<void> {
    const sequence = EDIT_SEQUENCE_BY_SITE[getSite().siteCode] ?? EDIT_SEQUENCE_BY_SITE.default;
    for (const type of sequence) {
      if (type === 'customer') await this.verifyEditInCustomerDetails(paymentAddress);
      if (type === 'delivery') await this.verifyEditInDeliveryOptions(paymentAddress);
    }
  }

  /** Clicks Edit on Order Summary, which leaves checkout for the cart; the caller verifies the cart. */
  async verifyEditInOrderSummary(): Promise<void> {
    // CN has no Order Summary section
    if (getSite().siteCode === 'CN') {
      return;
    }

    await scrollDown();
    if (await isDisplayedOrFalse(this.locator.viewOrderToggle)) {
      await scrollAndJsClick(this.locator.viewOrderToggle);
    }

    if (await isDisplayedOrFalse(this.locator.editOrderSummaryButton)) {
      await scrollAndJsClick(this.locator.editOrderSummaryButton);
      if (await isDisplayedOrFalse(this.locator.leaveCheckoutConfirmButton)) {
        await scrollAndJsClick(this.locator.leaveCheckoutConfirmButton);
      }
    }
  }

  /** Clicks Back on the "Are you sure you want to go?" popup that Back from checkout opens; the popup shows on IN only. */
  async clickLeaveCheckoutConfirmIfShown(): Promise<void> {
    if (getSite().siteCode !== 'IN') {
      return;
    }
    if (await clickIfDisplayed(this.locator.leaveCheckoutConfirmButton, 3000)) {
      console.log('[clickLeaveCheckoutConfirmIfShown] leave-checkout popup Back clicked');
    }
  }

  /** Fills each checkout step and clicks Next until the payment step; returns the active steps passed in order, stops the TC when payment is never reached. */
  async proceedToPayment(
    options: { verifyRewardOptIn?: boolean; verifyNoSavedAddress?: boolean } = {},
    maxIterations = 15
  ): Promise<string[]> {
    await this.waitForAnyFormToExist();
    let lastVisible: CheckoutFormId[] = [];
    const steps: string[] = [];

    for (let i = 0; i < maxIterations; i++) {
      const visible = await this.getVisibleForms();
      const step = await this.getCurrentCheckoutStep();
      if (step && steps.at(-1) !== step) {
        steps.push(step);
        console.log(`[proceedToPayment] step #${steps.length}: ${step}`);
      }
      // Also stop by step name: CN has no app-checkout-step-payment, and Next on its payment step submits the order
      if (visible.includes('app-checkout-step-payment') || step === 'CHECKOUT_STEP_PAYMENT') {
        return steps;
      }
      lastVisible = visible;
      // Checked on the step that has the address form: contact on IN, delivery on most sites
      const hasAddressForm = visible.some((formId) => ADDRESS_FORMS.includes(formId));
      if (options.verifyNoSavedAddress && hasAddressForm) {
        await this.verifyNoSavedAddress();
      }

      for (const formId of visible) {
        const handler = this.formHandlers[formId] ?? (() => this.fillGenericStep(formId));
        await handler();
      }

      await this.checkRequiredCheckboxes();
      await this.waitForPageStable();
      // The reward opt-in can show on any step; checked once the step is filled, when its late forms have mounted (CA_FR delivery)
      if (options.verifyRewardOptIn) {
        await this.verifyNoRewardOptIn();
      }
      await this.clickMoveToNext();
      await this.clickUseAddressOnPopupIfShown();
      await this.waitForStepChange(step);
      await this.waitForAnyFormToExist();
      await this.waitForPageStable();
    }

    markFailedAndStop(
      [{ label: 'reached payment step', pass: false, detail: `stuck at: ${lastVisible.join(', ') || 'unknown'}` }],
      `proceedToPayment (${maxIterations} iterations)`
    );
    return steps;
  }

  async editOrderSummary(): Promise<void> {
    // TODO: Implement Order Summary edit navigation
  }

  async editContactDetails(): Promise<void> {
    // TODO: Implement Contact Details edit navigation
  }

  async editDeliveryMode(): Promise<void> {
    // TODO: Implement Delivery Mode edit navigation
  }

  async placeOrder(): Promise<void> {
    // TODO: Implement place order action
    await this.locator.placeOrderButton.click();
  }
}
