import { getRunConfig } from '../../config/run.config';

export class PdLocator {
  get tradeInAddButton() {
    return $('~YOUR_PD_TRADEIN_ADD_SELECTOR');
  }

  get tradeInNoButton() {
    return $('~YOUR_PD_TRADEIN_NO_SELECTOR');
  }

  get tradeInRemoveButton() {
    return $('~YOUR_PD_TRADEIN_REMOVE_SELECTOR');
  }

  get tradeInAppliedLabel() {
    return $('~YOUR_PD_TRADEIN_APPLIED_SELECTOR');
  }

  get tradeInPriceLabel() {
    return $('~YOUR_PD_TRADEIN_PRICE_SELECTOR');
  }

  get productName() {
    return $('~YOUR_PD_PRODUCT_NAME_SELECTOR');
  }

  get scPlusAddButton() {
    return $('~YOUR_PD_SCPLUS_ADD_SELECTOR');
  }

  get scPlusNoButton() {
    return $('~YOUR_PD_SCPLUS_NO_SELECTOR');
  }

  get eupAddButton() {
    return $('~YOUR_PD_EUP_ADD_SELECTOR');
  }

  get eupNoButton() {
    return $('~YOUR_PD_EUP_NO_SELECTOR');
  }

  get simAddButton() {
    return $('~YOUR_PD_SIM_ADD_SELECTOR');
  }

  get simNoButton() {
    return $('~YOUR_PD_SIM_NO_SELECTOR');
  }

  // ---- Flagship: watch PD ----
  // Device/connectivity/color each get their own optional section (#option-device/#option-group/
  // #option-color) — present only when this PD page actually offers that choice; some products
  // fix device/connectivity and only expose color.

  get deviceSection() {
    return $('#option-device');
  }

  get deviceOptionCandidates() {
    return $$('#option-device input.option-input');
  }

  get connectivitySection() {
    return $('#option-group');
  }

  connectivityOption(value: string) {
    return $(`#option-group input.option-input[an-la="connectivity:${value.toLowerCase()}" i]`);
  }

  watchColorOption(value: string) {
    return $(`#option-color input.option-input[data-colorname="${value}" i]`);
  }

  /** Currently selected color, as displayed (not the data-colorname attribute). */
  get selectedColorText() {
    return $('#multiColorText');
  }

  /** data-shop-sku on this element is the SKU shown for the current selection. */
  get skuAnchor() {
    return $('#anchorNavigationPriceBar');
  }

  /** "Galaxy Watch9 (Bluetooth, 40 mm)" — device+connectivity+size combined. */
  get headerSpec() {
    return $('.pdd39-anchor-nav__headline');
  }

  get summaryProductName() {
    return $('.summary__product-name');
  }

  get summaryChoices() {
    return $$('.summary__select-option-wrap .summary__select-option');
  }

  get pdProductName() {
    if (getRunConfig().site === 'US') {
      return $("div[class*='ProductNameReview_header__title__tag'] h1, div[class*='ProductTitle_product'] h1");
    }
    return $(
      `.pd-info__title:not(.hidden), .hubble-price-bar__detail-title, .sg-product-display-name, 
      .wearable-bc-calculator__headline, .watch-bc-price-bar__headline,
      div[class*='ProductNameReview_header__title__tag'] h1,
      div[class*='ProductTitle_product'] h1,
      div[class*='pdd39-anchor-nav__headline'] h1`
    );
  }

  get pdLayout() {
    if (getRunConfig().site === 'US') {
      return $('.SubHeader_productNavigation__NwEe4');
    }
    return $('div.pdd39-anchor-nav');
  }

  nativePdProductName(productName: string) {
    return $(`//*[ @class = 'android.view.View' and
      contains(translate(translate(@content-desc, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz'), ' ', ''),
      translate(translate('${productName}', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz'), ' ', ''))
    ]`);
  }
}
