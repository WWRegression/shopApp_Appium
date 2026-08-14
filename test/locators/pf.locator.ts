export class PfLocator {
  get productGrid() {
    return $$('//android.widget.ImageView[@content-desc]');
  }

  /** Katalon Search.groovy getMatchingPfCardCount / collectProductsInfo와 동일한 패턴. */
  get firstProductCard() {
    return $('(//android.widget.ImageView[@content-desc and string-length(@content-desc) > 9])[1]');
  }

  productCardContaining(text: string) {
    return $(
      `(//android.widget.ImageView[@content-desc and contains(@content-desc, "${text}")])[1]`
    );
  }
}
