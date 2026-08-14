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
