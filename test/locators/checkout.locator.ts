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
  'app-payment-modes-flat',
  'app-customer-info',
  'app-customer-address-cn',
  'app-billing-address-cn',
  'app-delivery-info-cn'
] as const;

const FIELD_SELECTOR_PARTS = [
  "input[name]:not([type='checkbox']):not([type='radio']):not([disabled])",
  "input[formcontrolname]:not([type='checkbox'])",
  'textarea[name]',
  'textarea[formcontrolname]',
  'select[name]',
  'mat-select[name]',
  'mat-select[formcontrolname]',
];

const PAYMENT_METHOD_TITLE_SELECTOR = [
  ...[
    'h2.payment-title',
    'li[dtm-payment-analytics][accordion][class*="paymentMethodItem"] [role="button"]',
    'div[class="payment-full_body"] app-payment-mode-flat-item',
    'div[class="payment-step_body"] app-payment-mode-flat-item',
  ].map((s) => `app-checkout-step-payment ${s}`),
  '.payment-banks .payment-mode',
  'app-payment-modes-flat app-payment-mode-flat-item',
].join(', ');

export const AUTO_CHECK_CHECKBOX_SELECTOR = [
  "input[name*='CHECKOUT_OPTIONS']:not(:checked)",
  "input[type='checkbox'][required]:not(:checked)",
  "input[type='checkbox'][name*='save' i]:not([disabled]):not(:checked)",
  "input[type='radio'][value*='GENERAL_INVOICE' i]:not([disabled]):not(:checked)"
].join(', ');

export const INVALID_FIELD_SELECTOR = '.ng-invalid, ul.error, ul.error li, mat-error, .mat-mdc-form-field-error';

const SUBMIT_ORDER_BUTTON_LOADER_SELECTOR = 'button[appsubmitorderbuttonloader], div[appsubmitorderbuttonloader], button[data-an-tr="checkout-payment-detail"], .express-payment-mode-wrapper > div, #samsungPayContainer > button, button.fe0yvp1';

export class CheckoutLocator {
  get activeStep() {
    return $('mat-expansion-panel[data-activestepname]:has(> mat-expansion-panel-header[aria-expanded="true"])');
  }

  get checkoutLayout() {
    return $('cx-storefront.stop-navigating.CheckoutPageTemplateV2');
  }

  get checkoutLoginButton() {
    return $('.checkout-login-link a[data-an-tr="account-login"], span[data-an-tr="account-login"]');
  }

  get formElements() {
    return $$(CHECKOUT_FORMS.join(', '));
  }

  fieldsIn(formTag: string) {
    return $$(FIELD_SELECTOR_PARTS.map((s) => `${formTag} ${s}`).join(', '));
  }

  get moveToNextButton() {
    return $(
      [
        "button[class*='continue-btn']:not(.enter-address-method)",
        "app-sticky-cart-totals-cn .sticky-cart-button__row:not(.hide-cta) button.cx-summary-orderBtn",
        "button[id='checkout-page-order-btn']"
      ].join(', ')
    );
  }

  get addressPopupUseAddressButton() {
    return $(
      'app-address-recommendation-modal button[data-an-la*="use suggested address" i], app-address-recommendation-modal button[data-an-la*="use this address" i]'
    );
  }

  get useThisAddressButton() {
    return $('button[data-an-la*="use this address" i]');
  }

  get deliveryMethodButton() {
    return $('[aria-selected="false"] mat-icon[data-mat-icon-name="delivery-icon"]');
  }

  get deliveryOptionButton() {
    return $('ul[class*="delivery_list"] .delivery-mode-tab:not(.selected-mode)');
  }

  get autoCheckCheckboxes() {
    return $$(AUTO_CHECK_CHECKBOX_SELECTOR);
  }

  get enterAddressManuallyLink() {
    return $('button.enter-address-method');
  }

  get rewardOptIn() {
    return $('app-rewards-opt-in input[type="checkbox"], app-rewards-opt-in-v2 input[type="checkbox"]');
  }

  get rewardArea() {
    return $(
      'div[class*="summary-rewards-benefit"], div[class*="rewards-estimated-points"], div[class*="rewards-points-value"], app-signin-option-cn div.guest-signin-estimated-points'
    );
  }

  selectedValueOf(field: WebdriverIO.Element) {
    return field.$('.mat-mdc-select-min-line');
  }

  get orderSummary() {
    return $('.view-order-container, .order-summary-wrapper');
  }

  get placeOrderButton() {
    return $('~YOUR_CHECKOUT_PLACE_ORDER_SELECTOR');
  }

  get paymentMethodTitles() {
    return $$(PAYMENT_METHOD_TITLE_SELECTOR);
  }

  get paymentMethodExpanded() {
    return $(
      '.payment-modes-type mat-expansion-panel-header.mat-expanded[role="button"], app-checkout-step-payment .payment-modes mat-expansion-panel-header.mat-expanded[role="button"], .accordion-toggle[aria-expanded="true"], .payment-banks .payment-mode.selected'
    );
  }

  get submitOrderButtonLoaders() {
    return $$(SUBMIT_ORDER_BUTTON_LOADER_SELECTOR);
  }

  get editCustomerDetailsButton() {
    return $('[data-an-la="checkout:customer details:edit"]');
  }

  get editDeliveryOptionsButton() {
    return $('[data-an-la="checkout:delivery options:edit"]');
  }

  get paymentPreviewAddress() {
    return $('.details__shipping-address, .address__formatted-address, .delivery-address-fullname');
  }

  get savedAddressInfo() {
    return $('.address-box label');
  }

  get viewOrderToggle() {
    return $('mat-icon[data-an-la="view more"]');
  }

  get viewOrderSummaryToggle() {
    return $('.RightContentCheckoutSlot mat-icon[data-an-la="view more"], .RightContentCheckoutSlot .view-order-container mat-icon[data-an-tr="indication"]');
  }

  get viewOrderExpanded() {
    return $('.RightContentCheckoutSlot .view-order-container.isExpanded');
  }

  get viewOrderItemListCollapsed() {
    return $('.RightContentCheckoutSlot app-cart-item-list-us mat-expansion-panel-header[aria-expanded="false"] mat-icon[data-an-la="order summary:view more"]');
  }

  get viewOrderItemNames() {
    return $$('.RightContentCheckoutSlot .cart-item__name-checkout');
  }

  get editOrderSummaryButton() {
    return $('[data-an-la="order summary:edit"], [data-an-la="order summary:edit cart"]');
  }

  get leaveCheckoutConfirmButton() {
    return $('[data-an-la="leave the checkout page:yes"], .savings-modal button.resend-otp-btn');
  }
}
