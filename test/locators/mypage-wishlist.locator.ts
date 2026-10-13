/** My Page > Wishlist (WebView). */
export class MypageWishlistLocator {
  /** CN renders its own component. */
  get pageContainer() {
    return $('app-wishlist div.wishlist, app-wishlist-cn');
  }

  /** The card of this SKU. */
  productCard(sku: string) {
    return $(`.wishlist-product[data-modelcode="${sku}" i]`);
  }

  get emptySection() {
    return $('.wishlist .wishlist__empty .empty-page');
  }

  /** Remove control of the topmost card. */
  get removeButton() {
    return $(
      [
        'button[aria-label="Remove from wishlist" i]',
        'button[aria-label="wishlist:wishlist cleared" i]',
        "button[class='wishlist-remove-btn']",
      ].join(', ')
    );
  }

  /** Remove control inside the card of this SKU. */
  productRemoveButton(sku: string) {
    return $(
      [
        `.wishlist-product[data-modelcode="${sku}" i] button[aria-label="Remove from wishlist" i]`,
        `.wishlist-product[data-modelcode="${sku}" i] button[aria-label="wishlist:wishlist cleared" i]`,
        `.wishlist-product[data-modelcode="${sku}" i] button[class='wishlist-remove-btn']`,
      ].join(', ')
    );
  }

  /** "Add to cart" inside the card of this SKU. */
  addToCartButton(sku: string) {
    return $(`.wishlist-product[data-modelcode="${sku}" i] button[class*="primary"][class*="pill-btn--blue"]`);
  }

  /** Free gift Skip / OK shown on the way to the cart. */
  get continueButton() {
    return $('button[data-an-la*="ok"], button[data-an-la*="free gift:skip"]');
  }
}
