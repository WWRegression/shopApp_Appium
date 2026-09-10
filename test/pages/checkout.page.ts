/// <reference lib="dom" />

import { BasePage } from './base.page';
import { CheckoutLocator, CHECKOUT_FORMS } from '../locators/checkout.locator';
import { prepareWebViewPage } from '../helpers/context.helper';
import { getSiteData as getSite } from '../../config/site';
import { clickOptionInput, getElementLabel, isDisplayedSafe, jsClick } from '../helpers/element.helper';
import { scrollDown } from '../helpers/gesture.helper';
import { markFailed } from '../helpers/report.helper';
import type { LoadedSite } from '../../config/site';

/** Katalon Checkout.handleCheckoutEditButton() per-site sequence. */
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
}

export class CheckoutPage extends BasePage {
  private readonly locator = new CheckoutLocator();

  private readonly formHandlers: Partial<Record<CheckoutFormId, () => Promise<void>>> = {
    'app-customer-info-v2': () => this.fillContactInfo('app-customer-info-v2'),
    'app-customer-address-v2': () => this.fillAddressInfo('app-customer-address-v2'),
    'app-checkout-step-delivery': () => this.selectDeliveryOptionIfPresent(),
  };

  async prepareCheckoutPage(): Promise<void> {
    const ready = await prepareWebViewPage('checkout', this.locator.checkoutLayout, 20000);
    markFailed([{ label: 'checkout page reached', pass: ready }], 'prepareCheckoutPage');
  }

  /** Which known checkout forms are on screen right now (usually one, can be more). */
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

  /** Waits for the loading spinner/overlay to clear — polled, no fixed sleep. */
  private async waitForPageStable(timeoutMs = 8000): Promise<void> {
    await driver
      .waitUntil(async () => !(await this.isLoadingVisible()), { timeout: timeoutMs, interval: 300 })
      .catch(() => undefined);
  }

  /** The outer cx-page-layout can render before its lazy-loaded step component mounts — wait for a real form to exist, not just the shell. */
  private async waitForAnyFormToExist(timeoutMs = 8000): Promise<void> {
    await driver
      .waitUntil(async () => (await this.locator.formElements.length) > 0, { timeout: timeoutMs, interval: 300 })
      .catch(() => undefined);
  }

  /** Playwright ref nextStep() — after clicking, check *why* it didn't advance instead of clicking blind. */
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
      console.log(`clickMoveToNext: form still invalid — ${JSON.stringify(invalidLabels)}`);
    }
  }

  /** One round trip for the whole form instead of several `getAttribute` calls per field over the wire. */
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
        // Search-style address field — same key fillAddressInfo() already fills across every site.
        const isAutocomplete = key === 'searchaddress';

        return { index, tag: tagName, key, required, hasValue, isAutocomplete };
      });
    }, formTag);
  }

  private async setInputValue(field: ChainablePromiseElement, value: string, isAutocomplete: boolean): Promise<void> {
    // setValue() doesn't reliably flip this Angular form's validity state — use the native setter + dispatch events.
    // A native tap can land on the floating label overlapping an empty field — click via JS instead.
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

    // A search-style input (e.g. address autocomplete) can drop a mat-option list — same primitive as a select.
    const suggestion = $('(//mat-option)[1]');
    const suggestionAppeared = await suggestion
      .waitForExist({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (suggestionAppeared) {
      await clickOptionInput(suggestion).catch(() => undefined);
    }
  }

  /** Pick `value` if given, else the first option — caller already knows the field is empty. */
  private async fillSelectField(field: ChainablePromiseElement, value: string | undefined): Promise<void> {
    await clickOptionInput(field).catch(() => undefined);
    const match = value ? $(`//mat-option[contains(., "${value}")]`) : undefined;
    const target = match && (await match.isExisting().catch(() => false)) ? match : $('(//mat-option)[1]');
    await clickOptionInput(target).catch(() => undefined);
  }

  /** Fills only the required fields in `formId` from `valueMap`, keyed by name/formcontrolname (lowercased). */
  private async fillFormFields(formId: CheckoutFormId, valueMap: Record<string, string | undefined>): Promise<void> {
    const descriptors = await this.getFieldDescriptors(formId);
    const fields = this.locator.fieldsIn(formId);

    for (const desc of descriptors) {
      if (!desc.required) {
        continue;
      }

      const value = valueMap[desc.key];
      const field = fields[desc.index];

      if (desc.tag === 'input') {
        if (value) {
          await this.setInputValue(field, value, desc.isAutocomplete);
        }
      } else if (!desc.hasValue) {
        await this.fillSelectField(field, value);
      }
    }
  }

  async fillContactInfo(formId: CheckoutFormId, overrides?: Partial<LoadedSite['customer']>): Promise<void> {
    const data = { ...getSite().customer, ...overrides };
    await this.fillFormFields(formId, {
      firstname: data.firstName,
      lastname: data.lastName,
      email: data.email,
      phone: data.mobile,
    });
  }

  async fillAddressInfo(formId: CheckoutFormId, overrides?: Partial<LoadedSite['shipping']>): Promise<void> {
    if (await this.locator.newAddressRadio.isExisting().catch(() => false)) {
      await clickOptionInput(this.locator.newAddressRadio).catch(() => undefined);
    }

    // No saved address defaults to a search box — switch to manual fields if they're not rendered yet.
    const hasManualFields = (await this.getFieldDescriptors(formId)).some((d) => d.key === 'line1');
    if (!hasManualFields && (await this.locator.enterAddressManuallyLink.isExisting().catch(() => false))) {
      await clickOptionInput(this.locator.enterAddressManuallyLink).catch(() => undefined);
    }

    const data = { ...getSite().shipping, ...overrides };
    await this.fillFormFields(formId, {
      line1: data.address1,
      line2: data.address2,
      postalcode: data.postalCode,
      // "Suburb" is a select/autocomplete with formcontrolname "town" (confirmed on device).
      town: data.town,
      // TODO: confirm real name/formcontrolname for "State" on device — best guess until verified.
      state: data.district,
      searchaddress: data.searchText,
      phone: getSite().customer.mobile,
    });
  }

  /** isExisting() not isDisplayed() — these radios report as not displayed despite being real. */
  private async selectDeliveryOptionIfPresent(): Promise<void> {
    for (const el of [this.locator.deliveryMethodButton, this.locator.deliveryOptionButton]) {
      if (await el.isExisting().catch(() => false)) {
        await clickOptionInput(el).catch(() => undefined);
      }
    }
  }

  /** Page-wide, called once per runCheckout() pass rather than per form — the selector isn't form-scoped. */
  private async checkRequiredCheckboxes(): Promise<void> {
    // Re-queried each time — :not(:checked) shrinks as each checkbox gets checked.
    for (let i = 0; i < 5 && (await this.locator.autoCheckCheckbox.isExisting().catch(() => false)); i++) {
      await clickOptionInput(this.locator.autoCheckCheckbox).catch(() => undefined);
    }
  }

  /** Fallback for any step not in `formHandlers` — new countries only need an entry there for real data or bespoke interaction. */
  private async fillGenericStep(formId: CheckoutFormId): Promise<void> {
    await this.fillFormFields(formId, {});
  }

  /** The rewards opt-in checkbox should never show up during checkout. */
  async verifyNoRewardOptIn(): Promise<void> {
    const shown = await this.locator.rewardOptIn.isDisplayed().catch(() => false);
    markFailed([{ label: 'reward opt-in hidden', pass: !shown }], 'verifyNoRewardOptIn');
  }

  /** The estimated reward points banner should always show up during checkout. */
  async verifyRewardArea(): Promise<void> {
    const shown = await this.locator.rewardArea.isDisplayed().catch(() => false);
    markFailed([{ label: 'reward area shown', pass: shown }], 'verifyRewardArea');
  }

  /** Expand the first payment method, then confirm its submit-order loader's id/data-an-la carries its own title. */
  async checkPaymentMethod(): Promise<void> {
    const onPaymentPage = (await this.getVisibleForms()).includes('app-checkout-step-payment');
    markFailed([{ label: 'payment step reached', pass: onPaymentPage }], 'checkPaymentMethod');

    const titles = await this.locator.paymentMethodTitles;
    const hasTitles = (await titles.length) > 0;
    markFailed([{ label: 'payment method titles found', pass: hasTitles }], 'checkPaymentMethod');

    const first = titles[0];
    const title = await getElementLabel(first);
    markFailed([{ label: 'payment method title text', pass: title.length > 0 }], 'checkPaymentMethod');

    if (!(await this.locator.paymentMethodExpanded.isExisting().catch(() => false))) {
      await clickOptionInput(first);
    }
    await this.locator.paymentMethodExpanded.waitForExist({ timeout: 10000 });
    await this.waitForPageStable();

    // A combined label like "Credit Card/ Debit Card" maps to a loader keyed on just one half.
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

    markFailed([{ label: 'submit-order loader matched title', pass: matched, detail: title }], 'checkPaymentMethod');
  }

  /** The active step's data-activestepname, e.g. CHECKOUT_STEP_CONTACT_INFO / _DELIVERY / _PAYMENT. */
  async getCurrentCheckoutStep(): Promise<string> {
    return (await this.locator.activeStep.getAttribute('data-activestepname').catch(() => '')) ?? '';
  }

  private normalizeAddress(text: string): string {
    return text.replace(/[,\s]+/g, '').toLowerCase().trim();
  }

  async getAddressInfoFromPayment(): Promise<string> {
    return this.normalizeAddress(await getElementLabel(this.locator.paymentPreviewAddress));
  }

  async getSavedAddressInfo(): Promise<string> {
    return this.normalizeAddress(await getElementLabel(this.locator.savedAddressInfo));
  }

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

  /** Katalon Checkout.verifyEditInCustomerDetails() — Edit button must land back on the Contact Info step. */
  async verifyEditInCustomerDetails(paymentAddress?: string): Promise<void> {
    await clickOptionInput(this.locator.editCustomerDetailsButton);
    const step = await this.getCurrentCheckoutStep();
    markFailed(
      [{ label: 'edit navigated to contact info step', pass: step === 'CHECKOUT_STEP_CONTACT_INFO', detail: step }],
      'verifyEditInCustomerDetails'
    );

    if (paymentAddress && ADDRESS_MATCH_SITES_CUSTOMER.includes(getSite().siteCode)) {
      this.verifyAddressMatch(paymentAddress, await this.getSavedAddressInfo());
    }
  }

  /** Katalon Checkout.verifyEditInDeliveryOptions() — Edit button must land back on the Delivery step. */
  async verifyEditInDeliveryOptions(paymentAddress?: string): Promise<void> {
    await clickOptionInput(this.locator.editDeliveryOptionsButton);
    const step = await this.getCurrentCheckoutStep();
    markFailed(
      [{ label: 'edit navigated to delivery step', pass: step === 'CHECKOUT_STEP_DELIVERY', detail: step }],
      'verifyEditInDeliveryOptions'
    );

    if (paymentAddress && ADDRESS_MATCH_SITES_DELIVERY.includes(getSite().siteCode)) {
      this.verifyAddressMatch(paymentAddress, await this.getSavedAddressInfo());
    }
  }

  /** Katalon Checkout.handleCheckoutEditButton() — which Edit button(s) to check varies by site. */
  async handleCheckoutEditButton(paymentAddress?: string): Promise<void> {
    const sequence = EDIT_SEQUENCE_BY_SITE[getSite().siteCode] ?? EDIT_SEQUENCE_BY_SITE.default;
    for (const type of sequence) {
      if (type === 'customer') await this.verifyEditInCustomerDetails(paymentAddress);
      if (type === 'delivery') await this.verifyEditInDeliveryOptions(paymentAddress);
    }
  }

  /**
   * Katalon Checkout.verifyEditInOrderSummary() — editing Order Summary leaves checkout entirely
   * and returns to Cart (unlike the Customer/Delivery edit buttons, which stay inside checkout).
   * CN has no Order Summary section. Caller must verify the Cart landing (e.g. cartPage.prepareCartPage()).
   */
  async verifyEditInOrderSummary(): Promise<void> {
    if (getSite().siteCode === 'CN') {
      return;
    }

    await scrollDown();
    if (await isDisplayedSafe(this.locator.viewOrderToggle)) {
      await clickOptionInput(this.locator.viewOrderToggle);
    }

    if (await isDisplayedSafe(this.locator.editOrderSummaryButton)) {
      await clickOptionInput(this.locator.editOrderSummaryButton);
      if (await isDisplayedSafe(this.locator.leaveCheckoutConfirmButton)) {
        await clickOptionInput(this.locator.leaveCheckoutConfirmButton);
      }
    }
  }

  /** Every pass: fill whatever's visible (handlers skip fields already filled), then try to advance. */
  async runCheckout(maxIterations = 15): Promise<void> {
    await this.waitForAnyFormToExist();
    let lastVisible: CheckoutFormId[] = [];

    for (let i = 0; i < maxIterations; i++) {
      const visible = await this.getVisibleForms();
      if (visible.includes('app-checkout-step-payment')) {
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
      await this.waitForAnyFormToExist();
      await this.waitForPageStable();
    }

    markFailed(
      [{ label: 'reached payment step', pass: false, detail: `stuck at: ${lastVisible.join(', ') || 'unknown'}` }],
      `runCheckout (${maxIterations} iterations)`
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
