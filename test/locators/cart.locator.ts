export class CartLocator {
  get cartLayout() {
    return $('cx-storefront.stop-navigating.CartPageTemplateV2');
  }

  get emptyCartSection() {
    return $('cx-cart-details .cart-details__empty, app-cart-details-cn .cart-details__empty');
  }

  get checkoutButton() {
    return $(
      [
        'cx-cart-totals-v2 button[data-an-tr="cart-to-checkout" i]:not(div.hideContinueCta *):not([disabled])',
        'cx-cart-totals-v2 button.sticky-cart-totals__checkout-btn:not([disabled])',
        'app-sticky-cart-totals-cn [data-an-tr="cart-to-checkout" i]',
        'app-continue-to-checkout button[data-an-tr="cart-to-checkout" i][data-an-la="proceed to checkout" i]:not(.sticky-cta-enabled):not([disabled])',
      ].join(', ')
    );
  }

  get modalCheckoutButton() {
    return $('app-sticky-checkout-cta-modal.show button[data-an-tr="cart-to-checkout"]');
  }

  get cartLoginButton() {
    return $('section.cart-details__empty button[data-an-la="empty cart:sign in"]');
  }

  get cartBannerLoginButton() {
    return $('button.sign-in-banner__btn, button.guest-signin-btn');
  }

  /** Cart/emptyCartLoginBtn — Sign in button on the empty cart (guest) */
  get emptyCartLoginButton() {
    return $('button[data-an-la="empty cart:sign in"]');
  }
  
  /** Cart total count section */
  get cartTotalCountSection() {
    return $('.item-counter-container p.item-count');
  }

  get removeItemButton() {
    return $(
      [
        '.cart-item .mat-icon[class*="cart-item__remove"]',
        '.cart-item button[data-automation-id="removeEntry"]',
        '.cart-item button.data-omni-remove',
        '.cart-item button[data-an-la="remove item"]',
        '.cart-top-actions button[data-automation-id="removeEntry"]',
      ].join(', ')
    );
  }

  get removeConfirmButton() {
    return $(
      [
        "app-cart-item-remove-modal.show [data-an-la='Yes' i]",
        "app-cart-item-remove-modal.show [data-an-la='cart-product-remove']",
        'app-cart-item-remove-modal.show [data-an-la="remove-item"]',
        'button[data-an-la="delete option:yes"]',
      ].join(', ')
    );
  }

  /** All rendered cart item lines, unfiltered by sku. Match on data-modelcode in code. */
  get itemLines() {
    return $$(
      [
        '.cart-row',
        '.cart-item:is([data-pvitype="mobile"], [data-pvitype="tv"], [data-pvitype="refrigerator"], [data-pimsubtype="e-vouchers"], [data-pvitype="mobile accessory"], [data-an-sc="card-cart-product"])',
      ].join(', ')
    );
  }

  cartItem(sku: string) {
    return $(`.cart-item[data-modelcode="${sku}" i]`);
  }

  /** Removes an entire row (one unit) on row-per-unit UIs — pair with removeConfirmButton. */
  rowRemoveButton(sku: string) {
    return $(`.cart-item[data-modelcode="${sku}"] button[data-an-la="remove item"]`);
  }

  cartItemName(sku: string) {
    return $(`.cart-item[data-modelcode="${sku}" i] [class*="cart-item__name"]`);
  }

  cartItemSku(sku: string) {
    return $(`.cart-item[data-modelcode="${sku}" i] .cart-item__sku`);
  }

  /** Storage/color etc, split across multiple spans (e.g. "Pistachio", ", ", "1 TB"). */
  cartItemOptions(sku: string) {
    return $$(`.cart-item[data-modelcode="${sku}" i] .cart-item__options`);
  }

  /** Quantity-increase button */
  quantityIncreaseButton(sku: string) {
    return $(
      [        
        `.cart-item[data-modelcode="${sku}"] button.btn-qty-plus`,
        `.cart-item[data-modelcode="${sku}"] button.btn-buy-one-more`,
      ].join(', ')
    );
  }

  quantityInput(sku: string) {
    return $(
      [
        `.cart-item[data-modelcode="${sku}" i] input.input-qty`,
        `[data-modelcode="${sku}" i] cart-item-counter input`,
        `[data-modelcode="${sku}" i] input[data-automation-id="txt-qty"]`,
      ].join(', ')
    );
  }

  /** Quantity-decrease button */
  quantityDecreaseButton(sku: string) {
    return $(
      [
        `.cart-item[data-modelcode="${sku}"] button.decrement_focus:not([disabled])`        
      ].join(', ')
    );
  }

  itemPrice(sku: string) {
    return $(
      [
        `.cart-item[data-modelcode="${sku}" i] .price-container .price__current`,
        `.cart-item[data-modelcode="${sku}" i] .price-special__current`,
        `.cart-item[data-modelcode="${sku}" i] .price`,
      ].join(', ')
    );
  }

  /** TRADE-IN -------------------------------------------------------------- */
  get tradeInRemoveButton() {
    return $(
      [
        '[data-modelcode="TRADE-IN"] button:is([data-an-la="remove-item"], [data-an-la="remove item"], [data-an-tr="cart-product-remove"])',
        '.tradein-service button[data-an-la*="remove" i]',
        '.cart-item[data-modelcode="TRADE-IN"]',
      ].join(', ')
    );
  }

  get tradeInAppliedLabel() {
    return this.tradeInRemoveButton;
  }

  get tradeInPriceLabel() {
    return $('[data-modelcode="TRADE-IN"] .price, [data-modelcode="TRADE-IN"] .action-text--mobile, .tradein-service .price, .trade-in-total-price, span.trade-in__item-discount');
  }

  serviceErrorText(service: 'tradeIn' | 'scPlus' | 'tradeUp' | 'eup') {
    const area = {
      tradeIn: '.service-item__trade-in',
      scPlus: '.service-item__smc',
      tradeUp: '[data-modelcode="TRADE-UP"]',
      eup: '.service-item__smf',
    }[service];
    return $(`${area} .service-item__error span.error-text`);
  }

  get quantityChangeConfirmYesButton() {
    return $('app-item-counter-modal .modal__footer button[data-an-la="Yes"]');
  }

  get tradeInAddButton() {
    return $(
      '[data-an-la*="trade-in" i][data-an-la*="add" i], button[data-an-la*="add trade-in" i], .tradein-service [data-an-la*="add" i]'
    );
  }

  get tradeInNoButton() {
    return $('[an-la*="trade-in" i][an-la*="no" i]');
  }
  /** TRADE-IN END -------------------------------------------------------------- */

  /** SC+ -------------------------------------------------------------- */
  get scPlusAddButton() {
    return $(
      [
        '[data-an-la="add service:samsung care"]',
        '[an-la*="care+" i]',
        '[an-la*="samsung care" i][an-la*="add" i]',
      ].join(', ')
    );
  }

  get scPlusNoButton() {
    return $('[an-la*="care+" i][an-la*="no" i]');
  }

  get scPlusAppliedLabel() {
    return $(
      [
        '.service-item__smc div.action-text',
        '[data-pimsubtype="galaxy"] .action-text.smc',
      ].join(', ')
    );
  }

  get scPlusModal() {
    return $(
      [
        '.hubble-care-popup-new.is-opened',
        'app-samsung-care-v2.modal.show',
      ].join(', ')
    );
  }

  get scPlusPlanOption() {
    return $(
      [
        'mat-radio-group .smc-option',
      ].join(', ')
    );
  }

  get scPlusTermsCheckboxes() {
    return $$(
      [
        '.modal__checkbox-wrapper mat-checkbox input',
      ].join(', ')
    );
  }

  get scPlusConfirmButton() {
    return $(
      [
        'button[data-an-la*="samsung care:"i][data-an-la*="confirm"i]',
      ].join(', ')
    );
  }
  /** SC+ END -------------------------------------------------------------- */

  /** EUP -------------------------------------------------------------- */
  get eupAddButton() {
    return $("button[data-an-la='add service:samsung flex'], [an-la*='eup' i]");
  }

  get eupRemoveButton() {
    return $(
      '[data-modeldisplay="Samsung Upgrade"] button[data-an-la="remove item"]'
    );
  }

  get eupAppliedLabel() {
    return this.eupRemoveButton;
  }
  /** EUP END -------------------------------------------------------------- */

  /** TRADE-UP -------------------------------------------------------------- */
  get tradeUpAddButton() {
    return $('[data-an-la*="trade-up"][data-an-la*="add"], button[data-an-la="add service:trade-in"]');
  }

  /** Shown trade-up/trade-in popup. The dialog class contains `trade-up-steps` or `trade-in-steps`. */
  readonly tradeUpPopup = ".modal.show [class*='trade-'][class*='steps']";

  get tradeUpModal() {
    return $(this.tradeUpPopup);
  }

  /** One mat-expansion-panel per question. The next list stays empty until the previous pick. */
  get tradeUpDropdowns() {
    return $$(`${this.tradeUpPopup} mat-expansion-panel`);
  }

  /** IN product tiles. The next list is inserted after the previous pick. */
  get tradeUpProductGroups() {
    return $$(`${this.tradeUpPopup} .sc-e-p-m-p-c-s-b`);
  }

  /** UK mat-select. The next one stays disabled until the previous pick. Options open in the page overlay. */
  get tradeUpMatSelects() {
    return $$(`${this.tradeUpPopup} mat-select.modal__select`);
  }

  get tradeUpMatOptions() {
    return $$("div.cdk-overlay-container :is(mat-option, [role='option']):not([aria-disabled='true'])");
  }

  /** Footer action. Global uses a blue button, IN uses a black "Add to cart" button. */
  readonly tradeUpFooterAction = ".modal__footer button:is(.pill-btn--blue, .pill-btn--black)";

  get tradeUpContinueButton() {
    return $(`${this.tradeUpPopup} ${this.tradeUpFooterAction}:not([disabled])`);
  }

  /** Visible Sí button. No is the first radio in the DOM, so the yes label is targeted directly. */
  get tradeUpConditionYes() {
    return $(`${this.tradeUpPopup} label.condition-radio__yes`);
  }

  /** CN condition questions. The next group stays disabled until the previous answer. */
  get tradeUpConditionGroups() {
    return $$(`${this.tradeUpPopup} .condition-radio`);
  }

  /** Required agreement on the discount step. The native input sits inside mat-checkbox. */
  get tradeUpTermsCheckboxes() {
    return $$(`${this.tradeUpPopup} mat-checkbox input[type="checkbox"]`);
  }

  get tradeUpPostalInput() {
    return $(`${this.tradeUpPopup} :is(input[formcontrolname="postCodeControl"], input#trade-up-pincode)`);
  }

  /** Check control beside the postcode field. */
  get tradeUpPostalCheckButton() {
    return $(`${this.tradeUpPopup} :is(button.post-code-form__btn, .trade-in-pincode-enter)`);
  }

  get tradeUpPostalSuccess() {
    return $(`${this.tradeUpPopup} :is(mat-hint.post-code-success, mat-hint.text-primary)`);
  }

  get tradeUpPostalError() {
    return $(`${this.tradeUpPopup} :is(mat-hint.post-code-error, mat-hint.text-danger)`);
  }

  get tradeUpRemoveButton() {
    return $(
      [
        ':is(div[data-modelcode="TRADE-UP"], [data-modelcode="TRADE-IN"]) button[data-an-la*="remove"][data-an-la*="item"]',        
      ].join(', ')
    );
  }

  get tradeUpPriceLabel() {
    return $(':is(div[data-modelcode="TRADE-UP"], [data-modelcode="TRADE-IN"]) :is(.service-item__actions div.action-text, .trade-in-total-price)');
  }
  /**TRADE-UP END -------------------------------------------------------------- */

  /** SIM -------------------------------------------------------------- */
  get simAddButton() {
    return $(
      [
        '[data-an-la*="sim" i][data-an-la*="add" i]',
        '[an-la*="sim" i]',
        '[an-la*="tariff" i][an-la*="add" i]',
      ].join(', ')
    );
  }

  get simNoButton() {
    return $('[an-la*="sim" i][an-la*="no" i]');
  }

  get simAppliedLabel() {
    return $(
      [
        '[data-modelcode*="SIM"] button[data-an-la*="remove"]',
      ].join(', ')
    );
  }
  /** SIM END -------------------------------------------------------------- */
}
