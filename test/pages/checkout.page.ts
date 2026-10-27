/// <reference lib="dom" />

import { BasePage } from './base.page';
import { CheckoutLocator, CHECKOUT_FORMS, INVALID_FIELD_SELECTOR, AUTO_CHECK_CHECKBOX_SELECTOR } from '../locators/checkout.locator';
import { prepareWebViewPage } from '../helpers/context.helper';
import { getSiteData as getSite } from '../../config/site';
import { scrollAndJsClick, getElementLabel, isDisplayedOrFalse, jsClick, clickElement, waitForDisplayedOrFalse, clickIfDisplayed } from '../helpers/element.helper';
import { scrollDown, scrollElementToCenter } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';
import { normalizeProductName, productNameMatches, removeNonWordChars } from '../helpers/data.helper';
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
  type: string;
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

  /** Switches to the checkout WebView. */
  async prepareCheckoutPage(): Promise<void> {
    await prepareWebViewPage('checkout', () => this.locator.checkoutLayout, 20000);
  }

  /** Stops the TC when the checkout page is not shown. */
  async verifyCheckoutPage(): Promise<void> {
    const shown = await prepareWebViewPage('checkout', () => this.locator.checkoutLayout, 20000);
    console.log(`[verifyCheckoutPage] expected checkout page="shown" actual="${shown ? 'shown' : 'not shown'}" result=${shown ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'checkout page shown', pass: shown }], 'verifyCheckoutPage');
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

  /** Opens the View Order summary when it is collapsed; DOM clicks, since the fixed summary overlay (US) intercepts taps. */
  private async ensureViewOrderExpanded(): Promise<void> {
    // CN shows the order summary inline, with no View Order toggle
    if (currentSiteCode() === 'CN') {
      return;
    }
    if (await this.locator.viewOrderExpanded.isExisting().catch(() => false)) {
      return;
    }
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

  /** Opens View Order and stops the TC when no item name matches the expected (PF) product name. */
  async verifyProductName(expected: string | null): Promise<void> {
    await this.ensureViewOrderExpanded();
    let itemNames: string[] = [];
    // Re-read: right after the window switch the list can show only the service items
    const pass = await driver
      .waitUntil(
        async () => {
          itemNames = [];
          for (const el of await this.locator.viewOrderItemNames) {
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
    if (!(await clickIfDisplayed(loginButton, 5000))) {
      console.log('[clickLoginOnCheckout] Login button not found');
    }
  }

  /** Returns the known checkout forms currently displayed, read in one browser call since the step re-renders after Next. */
  private async getVisibleForms(): Promise<CheckoutFormId[]> {
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

  /** Clicks Next on the current step and logs the fields still invalid; a disabled Next returns so the step is filled again. */
  private async clickMoveToNext(): Promise<void> {
    const next = this.locator.moveToNextButton;
    // Centered first: on long forms (PT) Next is below the viewport and never counts as clickable
    await scrollElementToCenter(next);
    if (!(await next.waitForClickable({ timeout: 10000 }).then(() => true, () => false))) {
      console.log('[clickMoveToNext] Next not clickable yet, the step is filled again on the next pass');
      return;
    }
    // CN has a sticky Next and a page-bottom Next, so the id shows which one was clicked
    const buttonId = (await next.getAttribute('id').catch(() => '')) || 'no id';
    await next.click();
    console.log(`[clickMoveToNext] Next clicked (id=${buttonId})`);
    await driver.pause(1000);

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

  /** Clicks "Use suggested address" on the address popup; the step stays on delivery, so the caller clicks Next again. */
  private async clickUseAddressOnPopupIfShown(): Promise<void> {
    // The popup shows on US only
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
              : // A custom trigger (IT phone prefix "+39") shows the value outside min-line
                Boolean(el.querySelector('.mat-mdc-select-min-line, .mat-mdc-select-value-text')?.textContent?.trim());
        // Autocomplete fields: the address search box, the CN address line, and fields with a search icon (FR street)
        const isAutocomplete =
          key === 'searchaddress' ||
          (key === 'line1' && tag === 'app-customer-address-cn') ||
          Boolean(el.closest('.mat-mdc-form-field-has-icon-prefix'));

        const type = tagName === 'input' ? (el as HTMLInputElement).type : '';
        return { index, tag: tagName, type, key, required, hasValue, isAutocomplete, visible: el.offsetParent !== null };
      });
    }, formTag);
  }

  /** Sets an input through the native setter and events so the Angular form sees it; autocomplete picks the first suggestion. */
  private async setInputValue(field: ChainablePromiseElement, value: string, isAutocomplete: boolean): Promise<void> {
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

    // Waits for an option holding the typed value: a list left over from the previous field shows first (FR postal code → street)
    const wanted = removeNonWordChars(value);
    let clicked = '';
    await driver
      .waitUntil(
        async () => {
          for (const option of await $$('mat-option')) {
            // getText() returns "" for options in the overlay panel
            const text = String(await option.getProperty('textContent').catch(() => ''));
            if (text && removeNonWordChars(text).includes(wanted)) {
              await scrollAndJsClick(option);
              clicked = text.trim();
              return true;
            }
          }
          return false;
        },
        { timeout: 5000, interval: 500 }
      )
      .catch(() => undefined);
    console.log(`[setInputValue] suggestion for "${value}" clicked="${clicked || 'none'}"`);
  }

  /** Selects the option matching `value`, or the first enabled option when there is no match. */
  private async fillSelectField(field: ChainablePromiseElement, value: string | undefined): Promise<void> {
    // Dependent selects (CN province > city, AU suburb) load late, and a panel opened too early stays empty, so it is reopened
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

  /** Fills the required fields of a form; each entry is a value and the field names (lowercase) that take it. onlyEmpty keeps inputs that already have a value. */
  private async fillFormFields(
    formId: CheckoutFormId,
    entries: [string | undefined, string[]][],
    options: { onlyEmpty?: boolean } = {}
  ): Promise<void> {
    const valueMap: Record<string, string | undefined> = {};
    for (const [value, keys] of entries) {
      keys.forEach((key) => (valueMap[key] = value));
    }
    const fields = this.locator.fieldsIn(formId);
    const done = new Set<string>();

    // Some fields are enabled only after another is filled (FR street after the postal code), so they get another pass
    for (let pass = 0; pass < 3; pass++) {
      const pending = (await this.getFieldDescriptors(formId)).filter(
        (desc) => desc.required && !done.has(desc.key || String(desc.index))
      );
      if (pending.length === 0) {
        break;
      }

      for (const desc of pending) {
        done.add(desc.key || String(desc.index));
        // Phone field names differ by site (IT: telephone), but they are all type=tel
        const value = valueMap[desc.key] ?? (desc.type === 'tel' ? valueMap.phone : undefined);
        const field = fields[desc.index];

        // Hidden selects are skipped: CN keeps a hidden billing form
        if (desc.tag === 'input') {
          if (value && !(options.onlyEmpty && desc.hasValue)) {
            await this.setInputValue(field, value, desc.isAutocomplete);
          }
        } else if (!desc.hasValue && desc.visible) {
          await this.fillSelectField(field, value);
        }
      }
    }
  }

  /** Fills the contact fields (name, email, phone, tax ID) with the site customer data. */
  async fillContactInfo(formId: CheckoutFormId, overrides?: Partial<LoadedSite['customer']>): Promise<void> {
    await this.waitForFormFields(formId);
    const data = { ...getSite().customer, ...overrides };
    await this.fillFormFields(formId, [
      // CN has a single full-name field
      [data.firstName, ['firstname', 'fullname']],
      [data.lastName, ['lastname']],
      [data.email, ['email']],
      [data.mobile, ['phone']],
      // CL requires the RUT tax ID here
      [data.documentNumber, ['vatnumber']],
    ]);
  }

  /** Fills the delivery address fields with the site shipping data; a preselected saved address is used as it is. */
  async fillAddressInfo(formId: CheckoutFormId, overrides?: Partial<LoadedSite['shipping']>): Promise<void> {
    if (await this.hasSavedAddress()) {
      console.log(`[fillAddressInfo] saved address shown, form fill skipped`);
      return;
    }

    await this.waitForFormFields(formId);
    const data = { ...getSite().shipping, ...overrides };

    // A picked address suggestion fills the fields below it, so afterwards only the empty ones are typed
    const picked = await this.pickSuggestedAddress(formId, data.searchText);
    if (!picked) {
      // Without a saved address the form shows a search box, so switch to manual entry
      const hasManualFields = (await this.getFieldDescriptors(formId)).some((d) => d.key === 'line1');
      if (!hasManualFields && (await this.locator.enterAddressManuallyLink.isExisting().catch(() => false))) {
        await scrollAndJsClick(this.locator.enterAddressManuallyLink).catch(() => undefined);
      }
    }

    // IN: the pincode lookup resets fields typed before it returns, so the pincode goes first
    const pincodeFirst = getSite().siteCode === 'IN' && (await this.fillPincodeAndWaitForCity(formId, data.postalCode));
    await this.fillFormFields(
      formId,
      [
        [data.address1, ['line1']],
        [data.address2, ['line2', 'suburb', 'kecamatan', 'județ']],
        [pincodeFirst ? undefined : data.postalCode, ['postalcode']],
        [data.town, ['town']],
        [data.district, ['state', 'district']],
        [data.floor, ['floor']],
        [data.searchText, ['regioniso', 'searchaddress']],
        [getSite().customer.mobile, ['phone']],
      ],
      { onlyEmpty: picked }
    );
  }

  /** Types the search text into the address search box and picks the first suggestion; true when it filled the address line. */
  private async pickSuggestedAddress(formId: CheckoutFormId, searchText: string | undefined): Promise<boolean> {
    const search = (await this.getFieldDescriptors(formId)).find((d) => d.key === 'searchaddress' && d.visible);
    if (!searchText || !search) {
      return false;
    }
    await this.setInputValue(this.locator.fieldsIn(formId)[search.index], searchText, true);
    const filled = await driver
      .waitUntil(async () => (await this.getFieldDescriptors(formId)).some((d) => d.key === 'line1' && d.hasValue), {
        timeout: 5000,
        interval: 500,
      })
      .then(() => true, () => false);
    console.log(`[pickSuggestedAddress] searched "${searchText}", address fields filled=${filled}`);
    return filled;
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

  /** Selects the delivery method, option card and date when the step offers them and none is selected yet. */
  private async selectDeliveryOptionIfPresent(): Promise<void> {
    // isExisting: the method icon reports as not displayed
    if (await this.locator.deliveryMethodButton.isExisting().catch(() => false)) {
      await scrollAndJsClick(this.locator.deliveryMethodButton).catch(() => undefined);
    }
    // The card is clicked, not its radio input: the input is 0x0 and never becomes interactable
    const optionClicked = await clickIfDisplayed(this.locator.deliveryOptionButton);
    // PL shows a delivery date list once an option is selected
    const dateClicked = await clickIfDisplayed(this.locator.deliveryDateButton, optionClicked ? 3000 : 0);
    console.log(`[selectDeliveryOptionIfPresent] option clicked=${optionClicked} date clicked=${dateClicked}`);
  }

  /** Checks the required checkboxes (terms, save address) of the current step, re-reading the unchecked set each time. */
  private async checkRequiredCheckboxes(): Promise<void> {
    for (let i = 0; i < 5; i++) {
      const index = await this.getFirstVisibleAutoCheckIndex();
      if (index < 0) {
        return;
      }
      await scrollAndJsClick(this.locator.autoCheckCheckboxes[index]).catch(() => undefined);
    }
  }

  /** Index of the first unchecked auto-check box on screen; boxes in hidden forms (CN d-none) are skipped. */
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
    await this.fillFormFields(formId, []);
  }

  /** Records a failure when the rewards opt-in checkbox is shown on the current step; checked by visibility since US keeps a hidden one. */
  private async verifyNoRewardOptIn(): Promise<void> {
    const exposed = await this.locator.rewardOptIn.isDisplayed().catch(() => false);
    const step = await this.getCurrentCheckoutStep();
    console.log(
      `[verifyNoRewardOptIn] step=${step} expected opt-in="hidden" actual opt-in="${exposed ? 'exposed' : 'hidden'}" result=${exposed ? 'FAIL' : 'PASS'}`
    );
    markFailed([{ label: 'reward opt-in hidden', pass: !exposed, detail: `exposed on ${step}` }], 'verifyNoRewardOptIn');
  }

  /** Opens View Order and stops the TC when the estimated reward points area is not shown. */
  async verifyRewardArea(): Promise<void> {
    // IL has no rewards
    if (currentSiteCode() === 'IL') {
      console.log('[verifyRewardArea] skipped for IL');
      return;
    }
    
    await this.ensureViewOrderExpanded();
    const shown = await waitForDisplayedOrFalse(this.locator.rewardArea, { timeout: 3000 });
    console.log(`[verifyRewardArea] expected reward area="shown" actual="${shown ? 'shown' : 'hidden'}" result=${shown ? 'PASS' : 'FAIL'}`);
    await this.ensureViewOrderCollapsed();
    markFailedAndStop([{ label: 'reward area shown', pass: shown }], 'verifyRewardArea');
  }

  /** Records a failure when the View Order (order summary) area is not collapsed on the first load. */
  async verifyViewOrderCollapsed(): Promise<void> {
    // CN shows the order summary inline, with no View Order toggle
    if (currentSiteCode() === 'CN') {
      console.log('[verifyViewOrderCollapsed] skipped for CN');
      return;
    }
    const shown = await waitForDisplayedOrFalse(this.locator.viewOrderToggle, { timeout: 5000 });
    const cls = shown ? ((await this.locator.viewOrderToggle.getAttribute('class').catch(() => '')) ?? '') : '';
    const collapsed = cls.includes('close');
    const actual = !shown ? 'not shown' : collapsed ? 'collapsed' : `expanded (class="${cls}")`;
    console.log(`[verifyViewOrderCollapsed] expected View Order="collapsed" actual="${actual}" result=${collapsed ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'View Order collapsed on load', pass: collapsed, detail: actual }], 'verifyViewOrderCollapsed');
  }

  /** Opens every payment method one by one and stops the TC when any fails to open; methods must start collapsed (not US). */
  async checkPaymentMethod(): Promise<void> {
    const site = currentSiteCode();
    // Payment methods render after a skeleton loader; stops as soon as they show
    let total = 0;
    await driver
      .waitUntil(async () => (total = await this.locator.paymentMethodTitles.length) > 0, { timeout: 5000, interval: 500 })
      .catch(() => undefined);
    console.log(`[checkPaymentMethod] total payment methods=${total}`);
    markFailedAndStop([{ label: 'payment methods found', pass: total > 0 }], 'checkPaymentMethod');

    // CN shows flat payment buttons with nothing to expand
    if (site === 'CN') {
      await this.verifyPaymentMethodsClickable(total);
      return;
    }
    // US opens the first method by default
    if (site !== 'US') {
      const collapsed = !(await this.locator.paymentMethodExpanded.isExisting().catch(() => false));
      console.log(`[checkPaymentMethod] expected default="collapsed" actual="${collapsed ? 'collapsed' : 'expanded'}" result=${collapsed ? 'PASS' : 'FAIL'}`);
      markFailed([{ label: 'payment methods collapsed by default', pass: collapsed }], 'checkPaymentMethod');
    }

    const failed: string[] = [];
    for (let i = 0; i < total; i++) {
      // Re-read the list each time: opening a method re-renders the section
      const title = (await this.locator.paymentMethodTitles)[i];
      if (!title) {
        failed.push(`#${i + 1} (not found)`);
        continue;
      }
      const name = ((await title.getText().catch(() => '')) ?? '').trim().split('\n')[0] || `#${i + 1}`;
      // Tapping the already-open first method on US would close it
      if (!(site === 'US' && i === 0)) {
        await scrollAndJsClick(title);
      }
      const opened = await this.waitForPaymentMethodOpened();
      console.log(`[checkPaymentMethod] ${i + 1}/${total} "${name}" expected="opened" actual="${opened ? 'opened' : 'not opened'}" result=${opened ? 'PASS' : 'FAIL'}`);
      if (!opened) {
        failed.push(name);
      }
    }
    markFailedAndStop(
      [{ label: 'all payment methods opened', pass: failed.length === 0, detail: `failed ${failed.length}/${total}: ${failed.join(', ')}` }],
      'checkPaymentMethod'
    );
  }

  /** Stops the TC when any payment method button is not clickable (CN). */
  private async verifyPaymentMethodsClickable(total: number): Promise<void> {
    const titles = await this.locator.paymentMethodTitles;
    const failed: string[] = [];
    for (let i = 0; i < total; i++) {
      if (!(await titles[i]?.isClickable().catch(() => false))) {
        failed.push(`#${i + 1}`);
      }
    }
    console.log(`[checkPaymentMethod] expected all ${total} methods="clickable" actual not clickable=${JSON.stringify(failed)} result=${failed.length ? 'FAIL' : 'PASS'}`);
    markFailedAndStop([{ label: 'all payment methods clickable', pass: failed.length === 0, detail: failed.join(', ') }], 'checkPaymentMethod');
  }

  /** True when a payment method's expanded area shows and its loading spinner is gone within 10s each. */
  private async waitForPaymentMethodOpened(): Promise<boolean> {
    const expanded = await this.locator.paymentMethodExpanded.waitForExist({ timeout: 10000 }).then(() => true, () => false);
    if (!expanded) {
      return false;
    }
    return driver
      .waitUntil(async () => !(await this.isLoadingVisible()), { timeout: 10000, interval: 300 })
      .then(() => true, () => false);
  }

  /** Records a failure when the active checkout step is not `expected`, waiting up to 5s for it to settle after a Back. */
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

  /** Clicks Edit on Customer Details and records a failure when it does not return to the Contact Info step. */
  async verifyEditInCustomerDetails(paymentAddress?: string): Promise<void> {
    await scrollAndJsClick(this.locator.editCustomerDetailsButton);
    const step = await this.getCurrentCheckoutStep();
    markFailed(
      [{ label: 'edit navigated to contact info step', pass: step === 'CHECKOUT_STEP_CONTACT_INFO', detail: step }],
      'verifyEditInCustomerDetails'
    );

    // Only some sites show a saved address on this step
    if (paymentAddress && ADDRESS_MATCH_SITES_CUSTOMER.includes(getSite().siteCode)) {
      this.verifyAddressMatch(paymentAddress, await this.getSavedAddressInfo());
    }
  }

  /** Clicks Edit on Delivery Options and records a failure when it does not return to the Delivery step. */
  async verifyEditInDeliveryOptions(paymentAddress?: string): Promise<void> {
    await scrollAndJsClick(this.locator.editDeliveryOptionsButton);
    const step = await this.getCurrentCheckoutStep();
    markFailed(
      [{ label: 'edit navigated to delivery step', pass: step === 'CHECKOUT_STEP_DELIVERY', detail: step }],
      'verifyEditInDeliveryOptions'
    );

    // Only some sites show a saved address on this step
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

  /** Clicks Back on the "Are you sure you want to go?" popup that Back from checkout opens. */
  async clickLeaveCheckoutConfirmIfShown(): Promise<void> {
    // The popup shows on IN only
    if (getSite().siteCode !== 'IN') {
      return;
    }
    if (await clickIfDisplayed(this.locator.leaveCheckoutConfirmButton, 3000)) {
      console.log('[clickLeaveCheckoutConfirmIfShown] leave-checkout popup Back clicked');
    }
  }

  /** Fills each checkout step and clicks Next until the payment step; returns the active steps passed in order. */
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
      // Also by step name: CN has no app-checkout-step-payment, and Next on its payment step submits the order
      if (visible.includes('app-checkout-step-payment') || step === 'CHECKOUT_STEP_PAYMENT') {
        return steps;
      }
      lastVisible = visible;
      // The address form is on the contact step on IN, on the delivery step elsewhere
      if (options.verifyNoSavedAddress && visible.some((formId) => ADDRESS_FORMS.includes(formId))) {
        await this.verifyNoSavedAddress();
      }

      // Delivery options last: PL shows the option cards only after the address is filled
      const ordered = [...visible.filter((f) => f !== 'app-checkout-step-delivery'), ...visible.filter((f) => f === 'app-checkout-step-delivery')];
      for (const formId of ordered) {
        const handler = this.formHandlers[formId] ?? (() => this.fillGenericStep(formId));
        await handler();
      }

      await this.checkRequiredCheckboxes();
      await this.waitForPageStable();
      // Checked after filling, once late forms have mounted (CA_FR delivery)
      if (options.verifyRewardOptIn) {
        await this.verifyNoRewardOptIn();
      }
      await this.clickMoveToNext();
      await this.clickUseAddressOnPopupIfShown();
      await this.waitForStepChange(step);
      await this.waitForAnyFormToExist();
      await this.waitForPageStable();
    }

    console.log(`[proceedToPayment] payment step not reached in ${maxIterations} passes, stuck at: ${lastVisible.join(', ') || 'unknown'}`);
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
