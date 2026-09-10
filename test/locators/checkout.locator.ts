/** Known checkout form component tags — used directly as form ids. Site-dependent, not every site shows every one of these. */
export const CHECKOUT_FORMS = [
  'app-customer-info-v2',
  'app-customer-address-v2',
  'app-billing-address-v2',
  'app-checkout-invoice',
  'app-checkout-tnc',
  'app-checkout-identification',
  'app-checkout-step-samsung-care',
  'app-checkout-step-trade-in',
  'app-checkout-step-sim',
  'app-checkout-step-broadband',
  'app-step-leasing-evollis',
  'app-checkout-step-delivery',
  'app-delivery-info-additional-location-info',
  'app-delivery-info-no-pickup-split',
  'app-delivery-info-delivery-first',
  'app-delivery-info-pickup-first',
  'app-pick-up',
  'app-pick-up-manual',
  'app-dpd-parcel-machine',
  'app-omniva-parcel-machine',
  'app-checkout-step-payment',
] as const;

/** Input/select fields eligible for auto-fill. */
const FIELD_SELECTOR_PARTS = [
  "input[name]:not([type='checkbox']):not([type='radio']):not([disabled])",
  "input[formcontrolname]:not([type='checkbox'])",
  'select[name]',
  'mat-select[name]',
  'mat-select[formcontrolname]',
];

/** Payment-method title elements — collapsed by default, one per available payment method. */
const PAYMENT_METHOD_TITLE_SELECTOR = [
  'h2.payment-title',
  'li[dtm-payment-analytics][accordion][class*="paymentMethodItem"] [role="button"]',
  'div[class="payment-full_body"] app-payment-mode-flat-item',
  'div[class="payment-step_body"] app-payment-mode-flat-item',
]
  .map((s) => `app-checkout-step-payment ${s}`)
  .join(', ');

/** Marks the button/div that submits the order for the currently-expanded payment method. */
const SUBMIT_ORDER_BUTTON_LOADER_SELECTOR = 'button[appsubmitorderbuttonloader], div[appsubmitorderbuttonloader]';

export class CheckoutLocator {
  /** The active step panel — proves the checkout page has loaded and started its flow. */
  get activeStep() {
    return $("mat-expansion-panel[data-activestepname][class*='active']");
  }

  get checkoutLayout() {
    return $('cx-page-layout.CheckoutPageTemplateV2');
  }

  /** All known checkout form components currently in the DOM (may be more than one). */
  get formElements() {
    return $$(CHECKOUT_FORMS.join(', '));
  }

  /** Fillable fields inside a given form component. */
  fieldsIn(formTag: string) {
    return $$(FIELD_SELECTOR_PARTS.map((s) => `${formTag} ${s}`).join(', '));
  }

  /** Validation errors left over after trying to advance a step. */
  get invalidFields() {
    return $$('.ng-invalid, ul.error, ul.error li, mat-error, .mat-mdc-form-field-error');
  }

  /** "cart-to-checkout" deliberately excluded — that's the cart page's own button, not a step-continue button. */
  get moveToNextButton() {
    return $(
      [
        "button[id='checkout-page-order-btn']",
        "button[data-an-tr='checkout-order-detail']",
        "button[class*='continue-btn']",
      ].join(', ')
    );
  }

  /** The not-yet-selected delivery method tab. */
  get deliveryMethodButton() {
    return $('[aria-selected="false"] mat-icon[data-mat-icon-name="delivery-icon"]');
  }

  /** Not-yet-selected delivery option radio — the wrapping div is the label's parent, not a descendant, so click the input itself. */
  get deliveryOptionButton() {
    return $('ul[class*="delivery_list"] input[type="radio"]:not(:checked)');
  }

  /** Checkboxes to proactively check if present: required T&C, and "save this address". */
  get autoCheckCheckbox() {
    return $(
      [
        "input[name*='CHECKOUT_OPTIONS']:not(:checked)",
        "input[type='checkbox'][required]:not(:checked)",
        "input[type='checkbox'][name*='save' i]:not([disabled]):not(:checked)",
      ].join(', ')
    );
  }

  /** "New address" option in the saved/new address radio group — not yet selected. */
  get newAddressRadio() {
    return $("input[name='addressOptionShipping'][value='NEW_ADDRESS']:not(:checked)");
  }

  /** Switches the address search box to manual line1/town/postcode fields (first-time checkout, no saved address). */
  get enterAddressManuallyLink() {
    return $('button.enter-address-method');
  }

  /** Rewards opt-in checkbox — should never be shown (verifyNoRewardOptIn asserts on this). */
  get rewardOptIn() {
    return $('app-rewards-opt-in input[type="checkbox"], app-rewards-opt-in-v2 input[type="checkbox"]');
  }

  /** Estimated reward points banner — a different element than rewardOptIn, this one should be shown. */
  get rewardArea() {
    return $(
      'div[class*="summary-rewards-benefit"], div[class*="rewards-estimated-points"], div[class*="rewards-points-value"]'
    );
  }

  /** Currently-selected text preview on a mat-select trigger, if any. */
  selectedValueOf(field: WebdriverIO.Element) {
    return field.$('.mat-mdc-select-min-line');
  }

  /** Order Summary header — collapsed by default, but "Order Summary (N)" + total price already show here. */
  get orderSummary() {
    return $('.view-order-container, .order-summary-wrapper');
  }

  get placeOrderButton() {
    return $('~YOUR_CHECKOUT_PLACE_ORDER_SELECTOR');
  }

  /** All available (collapsed-by-default) payment method titles. */
  get paymentMethodTitles() {
    return $$(PAYMENT_METHOD_TITLE_SELECTOR);
  }

  /** Present once a payment method panel has expanded. */
  get paymentMethodExpanded() {
    return $(
      '.payment-modes-type mat-expansion-panel-header.mat-expanded[role="button"], .accordion-toggle[aria-expanded="true"]'
    );
  }

  /** All button/div elements marking the submit-order loader for whichever payment method is expanded. */
  get submitOrderButtonLoaders() {
    return $$(SUBMIT_ORDER_BUTTON_LOADER_SELECTOR);
  }

  get editCustomerDetailsButton() {
    return $('[data-an-la="checkout:customer details:edit"]');
  }

  get editDeliveryOptionsButton() {
    return $('[data-an-la="checkout:delivery options:edit"]');
  }

  /** Address shown on the payment step — compared against savedAddressInfo after an Edit-button navigation. */
  get paymentPreviewAddress() {
    return $('.details__shipping-address, .address__formatted-address, .delivery-address-fullname');
  }

  get savedAddressInfo() {
    return $('.address-box label');
  }

  /** Collapsed-by-default Order Summary expand toggle. */
  get viewOrderToggle() {
    return $('mat-icon[data-an-la="view more"]');
  }

  get editOrderSummaryButton() {
    return $('[data-an-la="order summary:edit"], [data-an-la="order summary:edit cart"]');
  }

  /** Confirmation button on the "leave checkout?" modal shown when editing Order Summary. */
  get leaveCheckoutConfirmButton() {
    return $('[data-an-la="leave the checkout page:yes"]');
  }
}
