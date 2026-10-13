/// <reference lib="dom" />

import { BasePage } from './base.page';
import { CheckoutLocator, CHECKOUT_FORMS } from '../locators/checkout.locator';
import { prepareWebViewPage } from '../helpers/context.helper';
import { getSiteData as getSite } from '../../config/site';
import { scrollAndJsClick, getElementLabel, isDisplayedOrFalse, jsClick, clickElement, waitForDisplayedOrFalse } from '../helpers/element.helper';
import { scrollDown, scrollElementToCenter } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';
import type { LoadedSite } from '../../config/site';

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
    const ready = await prepareWebViewPage('checkout', this.locator.checkoutLayout, 20000);
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
    const elements = await this.locator.formElements;
    const visible: CheckoutFormId[] = [];

    for (const el of elements) {
      const tag = await el.getTagName().catch(() => '');
      if ((CHECKOUT_FORMS as readonly string[]).includes(tag) && (await el.isDisplayed().catch(() => false))) {
        visible.push(tag as CheckoutFormId);
      }
    }
    return visible;
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

  /** Clicks Next on the current step and logs the fields still invalid when the step does not advance. */
  private async clickMoveToNext(): Promise<void> {
    await this.locator.moveToNextButton.waitForClickable({ timeout: 10000 });
    await this.locator.moveToNextButton.click();
    await driver.pause(1000);

    const invalidLabels: string[] = [];
    for (const field of await this.locator.invalidFields) {
      if (!(await field.isDisplayed().catch(() => false))) {
        continue;
      }

      const label =
        (await field.getText().catch(() => '')).trim() ||
        ((await field.getAttribute('aria-label').catch(() => '')) ?? '') ||
        ((await field.getAttribute('name').catch(() => '')) ?? '') ||
        ((await field.getAttribute('formcontrolname').catch(() => '')) ?? '') ||
        (await field.getTagName().catch(() => ''));

      invalidLabels.push(label);
    }

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
    await scrollAndJsClick(field).catch(() => undefined);
    // Dependent selects (CN province > city > district) load options after the previous one is picked
    await $('(//mat-option)[1]').waitForExist({ timeout: 3000 }).catch(() => undefined);
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

  /** Fills the contact fields (name, email, phone) with the site customer data. */
  async fillContactInfo(formId: CheckoutFormId, overrides?: Partial<LoadedSite['customer']>): Promise<void> {
    const data = { ...getSite().customer, ...overrides };
    await this.fillFormFields(formId, {
      firstname: data.firstName,
      // CN has a single full-name field
      fullname: data.firstName,
      lastname: data.lastName,
      email: data.email,
      phone: data.mobile,
    });
  }

  /** Fills the delivery address fields with the site shipping data. */
  async fillAddressInfo(formId: CheckoutFormId, overrides?: Partial<LoadedSite['shipping']>): Promise<void> {
    // Switch to "New address" when a saved address is preselected
    if (await this.locator.newAddressRadio.isExisting().catch(() => false)) {
      await scrollAndJsClick(this.locator.newAddressRadio).catch(() => undefined);
    }

    // Without a saved address the form shows a search box, so switch to manual entry
    const hasManualFields = (await this.getFieldDescriptors(formId)).some((d) => d.key === 'line1');
    if (!hasManualFields && (await this.locator.enterAddressManuallyLink.isExisting().catch(() => false))) {
      await scrollAndJsClick(this.locator.enterAddressManuallyLink).catch(() => undefined);
    }

    const data = { ...getSite().shipping, ...overrides };
    await this.fillFormFields(formId, {
      line1: data.address1,
      line2: data.address2,
      postalcode: data.postalCode,
      // "Suburb" (AU) uses the field name "town"
      town: data.town,
      // TODO: confirm the field name of "State"
      state: data.district,
      district: data.district,
      // IN has a required "Floor" select
      floor: data.floor,
      regioniso: data.searchText,
      searchaddress: data.searchText,
      phone: getSite().customer.mobile,
    });
  }

  /** Selects the delivery method and option when the step offers them. */
  private async selectDeliveryOptionIfPresent(): Promise<void> {
    // isExisting, not isDisplayed: these radios report as not displayed
    for (const el of [this.locator.deliveryMethodButton, this.locator.deliveryOptionButton]) {
      if (await el.isExisting().catch(() => false)) {
        await scrollAndJsClick(el).catch(() => undefined);
      }
    }
  }

  /** Checks the required checkboxes (terms, save address) of the current step. */
  private async checkRequiredCheckboxes(): Promise<void> {
    // Re-queried on each loop: the unchecked set shrinks as boxes get checked
    for (let i = 0; i < 5 && (await this.locator.autoCheckCheckbox.isExisting().catch(() => false)); i++) {
      await scrollAndJsClick(this.locator.autoCheckCheckbox).catch(() => undefined);
    }
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

  /** Stops the TC when the estimated reward points area is not shown on checkout. */
  async verifyRewardArea(): Promise<void> {
    const shown = await this.locator.rewardArea.isDisplayed().catch(() => false);
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

    // A combined title like "Credit Card/ Debit Card" matches a loader named after one half
    const titleParts = title
      .toLowerCase()
      .split('/')
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

  /** Fills each checkout step and clicks Next until the payment step is reached; stops the TC when it never gets there. */
  async proceedToPayment(options: { verifyRewardOptIn?: boolean } = {}, maxIterations = 15): Promise<void> {
    await this.waitForAnyFormToExist();
    let lastVisible: CheckoutFormId[] = [];

    for (let i = 0; i < maxIterations; i++) {
      const visible = await this.getVisibleForms();
      // The reward opt-in can show on any step, so it is checked on every pass
      if (options.verifyRewardOptIn) {
        await this.verifyNoRewardOptIn();
      }
      // Also stop by step name: CN has no app-checkout-step-payment, and Next on its payment step submits the order
      if (visible.includes('app-checkout-step-payment') || (await this.getCurrentCheckoutStep()) === 'CHECKOUT_STEP_PAYMENT') {
        return;
      }
      lastVisible = visible;

      for (const formId of visible) {
        const handler = this.formHandlers[formId] ?? (() => this.fillGenericStep(formId));
        await handler();
      }

      await this.checkRequiredCheckboxes();
      await this.waitForPageStable();
      await this.clickMoveToNext();
      await this.clickUseAddressOnPopupIfShown();
      await this.waitForAnyFormToExist();
      await this.waitForPageStable();
    }

    markFailedAndStop(
      [{ label: 'reached payment step', pass: false, detail: `stuck at: ${lastVisible.join(', ') || 'unknown'}` }],
      `proceedToPayment (${maxIterations} iterations)`
    );
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
