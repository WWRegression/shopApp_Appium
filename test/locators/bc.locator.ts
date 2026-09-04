import { getRunConfig } from '../../config/run.config';
import { storageLabelVariants } from '../helpers/data.helper';

/**
 * Buy Configurator (WebView) locators.
 * CSS는 Hybris BC 기준. 앱 변경 시 Inspector로 보정.
 */
export class BcLocator {
  get bcLayout() {
    if (getRunConfig().site === 'US') {
      return $('#headerWrapper .MobileViewHeader_header__title__9zKbO');
    }
    return $('div .bc-cross-navigation-wrap, section.watch-bc');
  }

  tradeInYesOption() {
    return $(
      [
        '.s-option-trade a[an-la="trade-in:yes" i]',
        '.js-tradein-popup a[an-la="trade-in:yes" i]',
        '.wearable-option.trade-in button[an-la="trade-in:yes" i]',
        '.watch-bc-buyflow.trade-in-option button[an-la="trade-in:yes" i]',
        'input[an-la="trade-in:yes" i] + label',
        '[class*="TradeInOptIn_tradein__select__card"] [role="button"][aria-label*="yes" i]',
      ].join(', ')
    );
  }

  tradeInNoOption() {
    return $(
      [
        '.s-option-trade a[an-la="trade-in:no" i]',
        '.js-tradein-popup a[an-la="trade-in:no" i]',
        'input[an-la="trade-in:no" i] + label',
        '[class*="TradeInOptIn_tradein__select__card"] [role="button"][aria-label*="no" i]',
      ].join(', ')
    );
  }

  get tradeInRemoveButton() {
    return $(
      [
        'button[an-la="trade-in:delete" i]',
        'button[an-la="trade-in:remove" i]',
        'a.s-btn-text[an-la="trade-in:delete" i]',
        '.result-trade-in [an-la="trade-in:delete" i]',
        '.s-cta-delete button[an-la="trade-in:delete"]',
      ].join(', ')
    );
  }

  get tradeInEditButton() {
    return $('button[an-la*="trade-in:edit" i], [an-la*="edit trade-in" i]');
  }

  get tradeInPriceLabel() {
    return $(
      '.s-trade-price, .s-apply-discount, #card-price[class*="TradeInCard_tradein__card__price"] span'
    );
  }

  deviceOption(label: string) {
    return $(
      [
        `.s-option-device :has(> input[data-displayname="${label}" i])`,
        `.s-option-device :has(> input[data-englishname="${label}" i])`,
        `[role="button"][an-la="device:${label}" i]`,
      ].join(', ')
    );
  }

  storageOption(storage: string) {
    const variants = storageLabelVariants(storage);
    return $(
      variants
        .flatMap((value) => [
          `.s-option-storage :has(> input[data-englishname*="${value}" i])`,
          `.s-option-storage :has(> input[data-displayname*="${value}" i])`,
          `#device_info [role="button"][data-modeldisplay*="${value}" i]`,
        ])
        .join(', ')
    );
  }

  caseSizeOption(size: string) {
    const value = size.replace(/\s+/g, '');
    return $(
      [
        `.s-option-size :has(> input[data-englishname*="${value}" i])`,
        `.s-option-size :has(> input[data-displayname*="${value}" i])`,
        `.s-option-case-size :has(> input[data-englishname*="${value}" i])`,
        `.wearable-option.size :has(> input[data-englishname*="${value}" i])`,
        `[an-la="size:${value}" i]`,
        `[an-la*="case size" i][an-la*="${value}" i]`,
      ].join(', ')
    );
  }

  connectivityOption(value: string) {
    const v = value.replace(/\s+/g, '');
    return $(
      [
        `.s-option-connectivity :has(> input[data-englishname*="${v}" i])`,
        `.s-option-connectivity :has(> input[data-displayname*="${v}" i])`,
        `[an-la*="connect" i][an-la*="${v}" i]`,
        `[role="button"][data-englishname*="${v}" i]`,
      ].join(', ')
    );
  }

  colorOption(color: string) {
    return $(
      [
        `.s-option-color-special :has(> input[data-englishname="${color}" i])`,
        `.hubble-pd-radio:has([data-englishname="${color}" i])`,
        `div[id="#color_container"] [an-la="color:${color}" i]`,
        `[an-la="color:${color}" i]`,
      ].join(', ')
    );
  }

  /** Visible color label on the checked swatch (localized). */
  get selectedColorVisibleName() {
    return $(
      [
        '.hubble-pd-radio.is-checked .s-color-name',
        '.js-radio-wrap.is-checked .s-color-name',
        '.s-option-color-special input:checked + label .s-color-name',
        '.hubble-pd-radio:has(> input:checked) .s-color-name',
      ].join(', ')
    );
  }

  get summaryDeviceName() {
    return $$(
      [
        '.hubble-product__summary .hubble-product__summary-head .s-option-title',
        '.summary__product-wrap .summary__product-name',
        '.wearable-bc-summary-structure-wrap .wearable-bc-price .wearable-bc-price__headline',
        'div[class*="SummaryHeader_productTitleInfo"] > span:first-child',
        'div[data-comp-name="watchBcOrderSummary"] .dvice-name',
      ].join(', ')
    );
  }

  get summarySku() {
    return $(
      [
        '.hubble-product__summary-product .s-option-summary',
        'span.pd-info__sku-code',
        'span.pdd39-anchor-nav__info-sku',
        '.pdd39-anchor-nav__info-sub > span.pdd39-anchor-nav__info-sku',
        '.wearable-bc-summary-structure-wrap .wearable-bc-price .wearable-bc-price__description',
        'div[class*="SummaryHeader_modelCode"] div[class*="ModelInfo_modalInfo"] span',
        'div[data-comp-name="watchBcOrderSummary"] .model-code',
      ].join(', ')
    );
  }

  get summaryOptions() {
    return $$(
      [
        '#deviceSummary .s-option-choice',
        '.wearable-bc-summary-structure-wrap .wearable-bc-price__list-item--title:not(.band-price)',
        '[class*="SummaryHeader_productTitleInfo"] span:nth-of-type(2)',
        '.summary__subTitle',
        '.total-summary__price-list',
        '.hdd02-buying-tool__summary .summary__select-option-wrap',
      ].join(', ')
    );
  }

  get summaryServicePrice() {
    return $$(
      [
        '.hubble-product__summary-product-price:not(.device-price-info)',
        'div[class*="affectedTotalsSection"]',
        '.s-tradein-summary .s-trade-price',
      ].join(', ')
    );
  }

  /** Visible selected label in the option section (color is often localized). */
  optionSelectedResult(field: 'deviceName' | 'storage' | 'caseSize' | 'color' | 'connectivity') {
    const section = this.optionSectionSelector(field);
    return $(
      [
        `${section} .s-select`,
        `${section} .s-selected`,
        `${section} em.s-select`,
        `${section} [class*="selected-name"]`,
        `${section} .hubble-product__options-title em`,
      ].join(', ')
    );
  }

  optionSectionSelector(
    field: 'deviceName' | 'storage' | 'caseSize' | 'color' | 'connectivity'
  ): string {
    switch (field) {
      case 'deviceName':
        return '.s-option-device';
      case 'storage':
        return '.s-option-storage';
      case 'caseSize':
        return '.s-option-size, .s-option-case-size, .wearable-option.size';
      case 'connectivity':
        return '.s-option-connectivity';
      case 'color':
        return '.s-option-color-special, .hubble-pd-radio, [id="#color_container"]';
    }
  }

  // ---- Flagship: phone BC (hubble-product template) ----

  phoneDeviceOption(label: string) {
    return $(`input[data-englishname="${label}" i], input[data-displayname="${label}" i]`);
  }

  /** Candidates for storage+RAM matching — caller compares data-displayname (format varies: "512 GB | 12 GB"). */
  get phoneStorageOptionCandidates() {
    return $$('input[data-displayname]');
  }

  /**
   * Color is selected by target SKU, not name — avoids color-name localization mismatches.
   * Scoped to an-la="(special) color:*" since data-modelcode alone can also match the
   * device/storage option that currently resolves to the same SKU. Limited/premium colors
   * use "special color:*" instead of "color:*".
   */
  phoneColorOptionBySku(sku: string) {
    return $(
      [
        `input[an-la^="color:" i][data-modelcode="${sku}" i]`,
        `input[an-la^="special color:" i][data-modelcode="${sku}" i]`,
      ].join(', ')
    );
  }

  get phoneSummaryDevice() {
    return $('#deviceSummary .s-option-title');
  }

  get phoneSummarySku() {
    return $('#deviceSummary .s-option-summary');
  }

  get phoneSummaryChoices() {
    return $$('#deviceSummary .s-option-choice .s-product-opiton');
  }

  // ---- Flagship: watch BC ----

  watchDeviceOption(label: string) {
    return $(`input.input-device[data-modeldisplay="${label}" i]`);
  }

  watchCaseSizeOption(size: string) {
    return $(`input.input-case-size[data-modeldisplay="${size}" i]`);
  }

  watchConnectivityOption(value: string) {
    return $(`input.input-connectivity[data-modeldisplay="${value}" i]`);
  }

  watchColorOption(value: string) {
    return $(`input.input-case-color[data-modeldisplay="${value}" i]`);
  }

  /**
   * Bespoke SKUs default to the "default band" model — an extra click on any other,
   * available band-type option is required to reach the bespoke target SKU
   * (Katalon: BC.selectNoneDefaultBand). First not-checked/not-disabled/not-oos match wins.
   */
  get watchNonDefaultBandOption() {
    return $('input.input-band-type:not(:checked):not([disabled]):not([is-oos="true" i])');
  }

  get watchSummaryDevice() {
    return $('.total-summary .dvice-name');
  }

  get watchSummarySku() {
    return $('.total-summary .model-code');
  }

  get watchSummaryChoices() {
    return $$('.summary-main-product strong');
  }

  get addToCartButton() {
    return $(
      [
        '[an-la="top sticky bar:add to cart"].price-bar-confirm-btn',
        '.wearable-bc-calculator__price-cta button[an-la="sticky bar:continue"]',
        '[an-la="top sticky bar:buy now"].price-bar-cart-btn',
        'div.hubble-price-bar__price-cta .price-bar-cart-btn',
        '[an-la*="sticky bar" i][an-la*="cart" i]',
      ].join(', ')
    );
  }

  get galaxyClubBanner() {
    return $('#galaxy-club, a[an-la="samsung galaxy club:no, thanks" i]');
  }

  get galaxyClubNoButton() {
    return $(
      [
        'a[an-la="samsung galaxy club:no, thanks" i]',
        'div[an-la="samsung galaxy club:no, thanks" i]',
        '#gc-no-btn div[an-ca="option click"]',
      ].join(', ')
    );
  }

  // legacy aliases used by older service stubs
  get tradeInAddButton() {
    return this.tradeInYesOption();
  }

  get tradeInNoButton() {
    return this.tradeInNoOption();
  }

  get tradeInAppliedLabel() {
    return this.tradeInRemoveButton;
  }

  get scPlusAddButton() {
    return $(
      [
        '.hubble-product__options-list-wrap:not([style*="hidden"]) .js-smc',
        '.wearable-option.option-care li:not(.depth-two) button:not([an-la*="none"])',
        '.smc-list .insurance__item--yes',
        '.option-care .pd-select-option__item > .pd-option-selector:has([an-la="samsung care:yes"])',
        '[id="#vipCumCarePlus"] #molecule_careplus_item',
        '.watch-bc-buyflow.care-option:not([style*="none"]) button:not([an-la*="care:none"]):not([an-la*="care:no"])',
      ].join(', ')
    );
  }

  get scPlusNoButton() {
    return $(
      [
        '.hubble-product__options-list-wrap:not([style*="hidden"]) .js-smc-none',
        '.hubble-product__options-list-wrap:not([style*="hidden"]) #carenone',
        '.wearable-option.option-care button[an-la="samsung care:none"]',
        '.smc-list .insurance__item--no',
        '.option-care .pd-option-selector:has([an-la="samsung care:no"])',
        '[class*="VIPCumCarePlusContainer"] button[an-la*="samsung care:no" i]',
        '.watch-bc-buyflow.care-option:not([style*="none"]) button[an-la="samsung care:no"]',
      ].join(', ')
    );
  }

  get eupAddButton() {
    return $('[an-la*="eup" i][an-la*="yes" i], [an-la*="upgrade" i]');
  }

  get eupNoButton() {
    return $('[an-la*="eup" i][an-la*="no" i]');
  }

  get simAddButton() {
    return $('[an-la*="sim" i][an-la*="yes" i], [an-la*="add sim" i]');
  }

  get simNoButton() {
    return $('[an-la*="sim" i][an-la*="no" i]');
  }

  get bcProductName() {
    if (getRunConfig().site === 'US') {
      return $("div[class*='ProductTitle_product'] h1");
    }
    return $('.hubble-price-bar__detail-title, .sg-product-display-name, .watch-bc-price-bar__headline');
  }
}
