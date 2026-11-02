/**
 * Post-ATC intermediate screens (addon / gift / go-to-cart popup) before Cart.
 */
export class SplashLocator {
  /**
   * Post-ATC popup: "Go to cart" / "Continue to cart".
   * Do NOT match "Continue shopping" — that leaves BC/home.
   */
  get continueButtonOnPopup() {
    return $(
      [
        '.confirm-popup__content-inner [an-la*="add to cart popup:go to cart"]',
        '[an-la="bridge:retention popup:continue to cart"]',
        '[data-event-type="redeem-skip"][an-la*="skip"]',
        '.addon-continue-btn[an-la="free gift:continue"]',
        '#giftContinue',
      ].join(', ')
    );
  }

  /** Footer Continue shared by addon / gift splash. */
  get continueButton() {
    return $(
      [
        '.addon-continue-btn[an-la="add-on:continue"]',
        '.addon-continue-btn[an-la="evoucher:continue"]',
        '.addon-continue-btn[an-la="add-on:go to cart"]',
        'div[class*="nav__bottom"] [an-la="anchor navi:buy now"]',
        'button[id="primaryInfoGoCartAddOn" i]',
        '#nextBtn[aria-label="Next"]',
        '[class*="AddOn_footerButton"][an-la="add-on:continue"]',
      ].join(', ')
    );
  }

  get continueButtonOnGift() {
    return $(
      [
        '.addon-continue-btn[an-la="free gift:continue"]',
        '#giftContinue',
      ].join(', ')
    );
  }

  get addonSection() {
    return $(
      [
        'div#content__addon:not([style*="display:none"]) section.hubble-addon-page',
        'div#content__addon:not([style*="display:none"]) section.wearable-addon-page',
        '[class*="AddOn_container"]',
      ].join(', ')
    );
  }

  get addonAddItemButtons() {
    return $$(
      [
        'button[an-la="add-on:add item"]',
        'button[an-la="evoucher:add item"]',
        '.wearable-addon-page [an-la="add item"]',
        'button[an-la^="add-on:"][an-la$=":add item"]',
        'button[an-la="evoucher:推薦:add item"]',
        'button[an-la="evoucher:Recommended:add item"]',
        'button[an-la="evoucher:Samsung Cases & Film:add item"]',
        'button[an-la^="bridge:add-on:"][an-la$=":add item"]',
        'button[an-tr="bridge-flagship pdp-add item-option_click"]',
        'button[an-la^="bridge:evoucher:"][an-la$=":add item"]',
        '[data-testid="productCard"][an-la="add-on:add item"]',
        'a[class*="AddOnProductItemMX_productCardTop"]',
      ].join(', ')
    );
  }
}
