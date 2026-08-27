export class CartLocator {
  get cartLayout() {
    return $(
      [
        'cx-page-layout.CartPageTemplate.ng-star-inserted',
        'div[class*="cart-page-container"]',
        'main > div.container',
        'cx-page-layout[class*="CartPageTemplateV2"]',
        'cx-page-layout.CartPageTemplate',
      ].join(', ')
    );
  }

  get removeItemButton() {
    return $(
      [
        '.mat-icon[class*="cart-item__remove"]',
        '.cart-top-actions button[data-automation-id="removeEntry"]:first-of-type',
        'button.data-omni-remove:first-of-type',
        'span[data-an-tr="cart-product-remove"]',
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

  /**
   * Quantity-increase control. Matches both cart UI variants:
   *  - stepper + button (carries value/data-modelunit)
   *  - buy-one-more button (adds a new row on click)
   */
  quantityAddButton(sku: string) {
    return $$(
      [
        `[data-modelcode="${sku}"] cart-item-counter button.btn-qty-plus`,
        `.cart-item[data-modelcode="${sku}"] button[data-an-la="plus button"]`,
        `.btn-qty-plus[data-modelcode="${sku}"]`,
        `.btn-buy-one-more[data-modelcode="${sku}"]`,
      ].join(', ')
    );
  }

  /** Quantity-decrease stepper button. Not present on row-per-unit UIs — use rowRemoveButton instead. */
  quantityReduceButton(sku: string) {
    return $$(
      [
        `cart-item-counter[data-modelcode="${sku}"] button[data-an-tr="cart-product-remove"]:not([disabled])`,
        `.cart-item[data-modelcode="${sku}"] .cart-item__quantity button[data-an-tr="cart-product-remove"]:not([disabled])`,
        `div[data-modelcode="${sku}"] cart-item-counter button[data-an-tr="cart-product-remove"]:not([disabled])`,
      ].join(', ')
    );
  }

  /** Removes an entire row (one unit) on row-per-unit UIs — pair with removeConfirmButton. */
  rowRemoveButton(sku: string) {
    return $(`.cart-item[data-modelcode="${sku}"] button[data-an-la="remove item"]`);
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

  get checkoutButton() {
    return $(
      [
        '[an-la*="checkout" i]',
        '[an-la*="go to checkout" i]',
        'button[class*="checkout"]',
        'a[href*="checkout"]',
      ].join(', ')
    );
  }

  get scPlusAddButton() {
    return $('[an-la*="care+" i]');
  }

  get scPlusNoButton() {
    return $('[an-la*="care+" i][an-la*="no" i]');
  }

  get eupAddButton() {
    return $('[an-la*="eup" i]');
  }

  get eupNoButton() {
    return $('[an-la*="eup" i][an-la*="no" i]');
  }

  get simAddButton() {
    return $('[an-la*="sim" i]');
  }

  get simNoButton() {
    return $('[an-la*="sim" i][an-la*="no" i]');
  }
}
