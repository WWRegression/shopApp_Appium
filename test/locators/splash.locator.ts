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
        '[class*="CreditDialog_overlayButtons"] [an-la="bridge:retention popup:continue to cart"]',
        '.confirm-popup__content [an-la="add to cart popup:go to cart"]',
      ].join(', ')
    );
  }

  /** Footer Continue shared by addon / gift splash. */
  get continueButton() {
    return $(
      [
        '.cta--emphasis.addon-continue-btn',
        '[an-la="add-on:continue"][data-testid="footerButton"]',
        '[an-la="free gift:continue"]',
        '[an-la*="gift" i][an-la*="continue" i]',
        '[id="giftContinue"]',
      ].join(', ')
    );
  }
}
