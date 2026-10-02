import { getRunConfig } from '../../config/run.config';

export class PdLocator {
  get headerSkuInfo() {
    return $(
      [
        '.pd-info__sku',
        '.pdd39-anchor-nav__info-sku',
        'div[class*="ModelInfo_modalInfo"] span',
      ].join(', ')
    );
  }

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

  get eupAddButton() {
    return $('~YOUR_PD_EUP_ADD_SELECTOR');
  }

  get eupNoButton() {
    return $('~YOUR_PD_EUP_NO_SELECTOR');
  }

  get arButton() {
    return $("[an-la='gallery:ar']");
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

  /** Same as BC: first other in-stock band (bespoke SKU is not the default band). */
  get watchNonDefaultBandOption() {
    return $('input.input-band-type:not(:checked):not([disabled]):not([is-oos="true" i])');
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
    if (getRunConfig().siteCode === 'US') {
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
    if (getRunConfig().siteCode === 'US') {
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

  get addToCartButton() {
    return $(
      [
        '#anchorNavigationPriceBarMobile [an-la*="anchor navi"]',
      ].join(', ') 
    );
  }
  
  get scPlusAddButton() {
    return $(
      [
        '.option-care .pd-select-option__item > .pd-option-selector:has([an-la="samsung care:yes"])',
      ].join(', ')
    );
  }

  get scPlusPlanOption() {
    return $(
      [
        'label[for="pd-samsung-care-payment-0"]',
      ].join(', ')
    );
  }

  get scPlusModal() {
    return $(
      [
        'div.hubble-care-popup.smcpopup[role="dialog"][style*="display: block"]',
      ].join(', ')
    );
  }

  get scPlusTermsCheckboxes() {
    return $$(
      [
        '.hubble-care-popup__check-list.is-check-required .checkbox-radio',
      ].join(', ')
    );
  }

  get scPlusConfirmButton() {
    return $(
      [
        'a[an-la="samsung care:confirm"][aria-disabled="false"]',
      ].join(', ')
    );
  }

  get scPlusAppliedLabel() {
    return $(
      [
        'input[id^="pd-samsung-care-payment"]:checked + .pd-option-selector__label',
        'ul[class*="samsung-care"] li.pd-select-option__item.selected:not(:has(input[id^="pd-samsung-care-payment"]:checked)) .pd-option-selector__label',
      ].join(', ')
    );
  }

  get scPlusPriceLabel() {
    return $(
      [
        'input[id^="pd-samsung-care-payment"]:checked + .pd-option-selector__label .pd-option-selector__sub-text',
        'ul[class*="samsung-care"] li.pd-select-option__item.selected:not(:has(input[id^="pd-samsung-care-payment"]:checked)) .pd-option-selector__label .pd-option-selector__sub-text',
      ].join(', ')
    );
  }

  get scPlusNoButton() {
    return $(
      [
        '.option-care .pd-option-selector:has([an-la="samsung care:no"])',
      ].join(', ')
    );
  }

  // ---- Trade-Up ----
  get tradeUpYesOption() {
    return $('.pd-option-selector:has(:is([an-la="trade-up:yes"], [an-la="trade-in:yes"]))');
  }

  get tradeUpModal() {
    return $('#ce-trade-up-popup-section .layer-popup__inner.layer-popup__looping');
  }

  get tradeUpCurrentStep() {
    return $('.vd-trade-in-popup__step.sdf-comp-step-panel:not([style*="none"])');
  }

  get tradeUpConfirmButton() {
    return $(
      [
        '.vd-trade-in-popup__step:not([style*="none"]) button[an-la*="trade-up:"][an-la*=":next"]',
        '.vd-trade-in-popup__step:not([style*="none"]) button[an-la*="trade-up:"][an-la*=":apply"]',
      ].join(', ')
    );
  }

  get tradeUpPostalInput() {
    return $(
      [
        '.vd-trade-in-popup__postal-code input#postal-code',
        '.siel-trade-in-popup__pincode-wrap input#pincode',
        "input[name='pincode']",
      ].join(', ')
    );
  }

  get tradeUpPostalCheckButton() {
    return $(
      [
        '.vd-trade-in-popup__postal-code-btn',
        'button#pincodeApplyBtn:not([class*="disabled"])',
        '.trade-in-pincode-enter',
      ].join(', ')
    );
  }

  get tradeUpPostalSuccessMessage() {
    return $(
      [
        '.sdf-comp-postal-code-input-panel.success',
      ].join(', ')
    );
  }

  get tradeUpDeviceOptions() {
    return $$('ul.vd-trade-in-popup__product-select li select.menu__select');
  }

  get tradeUpConditionYes() {
    return $(
      [
        '[id="conditionCheckInfoYes"]',
      ].join(', ')
    ).parentElement();
  }

  get tradeUpTerms() {
    return $$(
      [
        '.vd-trade-in-popup__agree-checkbox-wrap.is-required'
      ].join(', ')
    );
  }

  get tradeUpRemoveButton() {
    return $('button[an-la="trade-in:delete"], a[an-la="trade-in:delete"], a[an-la="trade-up:delete"]');
  }

  // ---- End of Trade-Up ----
  
}
