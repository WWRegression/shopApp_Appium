export class PfLocator {
  /**
   * PF cards in the scrollable list. Match the wrapping View — ImageView content-desc
   * can lag while the image loads.
   */
  get productGrid() {
    return $$(
      "//android.view.View[@scrollable='true']//android.view.View[@content-desc and .//android.widget.ImageView]"
    );
  }

  /** Product image inside a matched card. */
  cardImage(card: WebdriverIO.Element) {
    return card.$('.//android.widget.ImageView');
  }
}