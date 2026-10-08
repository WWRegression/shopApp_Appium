export class CartLocator {
  get cartLayout() {
    return $('cx-page-layout.CartPageTemplateV2, div.cart-details-wrapper');
  }

  get emptyCartSection() {
    return $('cx-cart-details .cart-details__empty, app-cart-details-cn .cart-details__empty');
  }

  /** Katalon Cart/cartToCheckoutBtn_2nd — "Continue to checkout" scoped to the open Express Checkout modal (e.g. US). */
  get checkoutModalButton() {
    return $('app-sticky-checkout-cta-modal.show .modal__container.sticky-checkout-modal button[data-an-tr="cart-to-checkout"]');
  }

  /** Katalon Cart/loginBtn + Cart/emptyCartLoginBtn — guest Sign in on the cart (with items or empty); all matches since a hidden one can come first */
  get cartLoginButton() {
    return $$('button.guest-signin-btn, button.sign-in-banner__btn, button[data-an-la="empty cart:sign in"]');
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
    return $(`.cart-item[data-modelcode="${sku}" i] .cart-item__name`);
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
    return $('[data-modelcode="TRADE-IN"] .price, .tradein-service .price');
  }

  get tradeInAddButton() {
    return $(
      '[an-la*="trade-in" i][an-la*="add" i], button[an-la*="add trade-in" i], .tradein-service [an-la*="add" i]'
    );
  }

  get tradeInNoButton() {
    return $('[an-la*="trade-in" i][an-la*="no" i]');
  }

  /** All matches — CN also has a hidden 0x0 copy, so click the displayed one */
  get checkoutButtons() {
    return $$(
      [
        '[data-an-la*="checkout" i]',
        '[data-an-tr*="checkout" i]',
        'button[class*="checkout"]',
        'a[href*="checkout"]',
      ].join(', ')
    );
  }

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

  get eupAddButton() {
    return $("button[data-an-la='add service:samsung flex'], [an-la*='eup' i]");
  }

  get eupNoButton() {
    return $('[an-la*="eup" i][an-la*="no" i]');
  }

  get eupRemoveButton() {
    return $(
      '[data-modeldisplay="Samsung Upgrade"] button[data-an-la="remove item"], [data-modeldisplay*="Flex" i] button[data-an-la*="remove" i]'
    );
  }

  get eupAppliedLabel() {
    return this.eupRemoveButton;
  }

  get tradeUpRemoveButton() {
    return $(
      [
        'div[data-modelcode="TRADE-IN"] button:is([data-an-la="remove-item"], [data-an-la="remove item"], [data-an-tr="cart-product-remove"])',
        'div[data-modelcode="TRADE-UP"] button[data-an-la="remove item"]',
      ].join(', ')
    );
  }

  get tradeUpPriceLabel() {
    return $('div[data-modelcode="TRADE-UP"] .service-item__actions div.action-text');
  }

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

}
