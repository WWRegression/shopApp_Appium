import { getRunConfig } from '../../config/run.config';
import { storageLabelVariants } from '../helpers/data.helper';

/**
 * Buy Configurator (WebView) locators.
 * CSS는 Hybris BC 기준. 앱 변경 시 Inspector로 보정.
 */
export class BcLocator {
  get bcLayout() {
    return $(`div .bc-cross-navigation-wrap, section.watch-bc,
      #headerWrapper .MobileViewHeader_header__title__9zKbO`);
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
        `.s-option-device :has(> input[data-englishname="${label}" i])`,
        `.watch-bc-option__option-item:has(> input[data-modeldisplay="${label}" i])`,
        `div[id="device_info"]:has(> div[data-modeldisplay="${label}" i])`
      ].join(', ')
    );
  }

  storageOption(storage: string) {
    const variants = storageLabelVariants(storage);
    return $(
      variants
        .flatMap((value) => [
          `.s-option-storage :has(> input[data-englishname*="${value}" i])`, 
          `#device_info [role="button"][data-modeldisplay*="${value}" i]`,
        ])
        .join(', ')
    );
  }

  caseSizeOption(size: string) {
    const value = size.replace(/\s+/g, '');
    return $(
      [
        `.watch-bc-option__option-item:has([an-la*="case size:" i][an-la*="${value}" i])`,
        `#capacity_info[an-la*="case size:" i][an-la*="${value}" i]`
      ].join(', ')
    );
  }

  connectivityOption(value: string) {
    const v = value.replace(/\s+/g, '');
    return $(
      [
        `.watch-bc-option__option-item:has([an-la*="connectivity" i][an-la*="${v}" i])`,
        `#watchConnectivity [an-la*="card:${v}" i]`
      ].join(', ')
    );
  }

  colorOption(color: string) {
    return $(
      [
        `.s-option-color-special :has(> input[data-englishname="${color}" i])`,
        `.watch-bc-option__option-item:not(.is-disabled):has(> .input-case-color:is([data-modeldisplay*="${color}"i]))`,
        `div[id="#color_container"] :has(> div[data-modeldisplay="${color}" i])`
        
      ].join(', ')
    );
  }

  /** Visible color label on the checked swatch (localized). */
  get selectedColorVisibleName() {
    return $(
      [
        '.hubble-pd-radio.is-checked .s-color-name',
        `.watch-bc-option__option-item:has(> .input-case-color:checked) .option-select__title`,
        `[class*="ColorTile_container"]:has([class*="ColorTile_selected"]) [class*="ColorTile_bottomText"]`,
      ].join(', ')
    );
  }

  get summaryDeviceName() {
    return $$(
      [
        '.hubble-product__summary .hubble-product__summary-head .s-option-title',
        'div[data-comp-name="watchBcOrderSummary"] .dvice-name',
        `div[class*='SummaryHeader_productTitleInfo'] > span:first-child`
      ].join(', ')
    );
  }

  get summarySku() {
    return $(
      [
        '.hubble-product__summary-product .s-option-summary',
        'div[data-comp-name="watchBcOrderSummary"] .model-code',
        'div[class*="SummaryHeader_modelCode"] div[class*="ModelInfo_modalInfo"] span',
      ].join(', ')
    );
  }

  get summaryOptions() {
    return $$(
      [
        '#deviceSummary .s-option-choice',
        '.total-summary__price-list',
        '[class*="SummaryHeader_productTitleInfo"] span:nth-of-type(2)'
      ].join(', ')
    );
  }

  get summaryServicePrice() {
    return $$(
      [
        '.hubble-product__summary-product-price:not(.device-price-info)', 
        `.total-summary__price-bundle-title .total-summary__price-bundle-price:not(:empty)`, 
        'div[class*="affectedTotalsSection"]',
        '.s-tradein-summary .s-trade-price, .s-trade-price-wrap > span',
        `.tradein-option-selected .tradein-option-selected__option-price > strong`,
        `.tradein-option-selected .tradein-option-selected__option-price:not(:has(> strong)) > span`
      ].join(', ')
    );
  }

  /** Visible selected label in the option section (color is often localized). */
  optionSelectedResult(field: 'deviceName' | 'storage' | 'caseSize' | 'color' | 'connectivity') {
    const parts = this.optionSectionSelector(field)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const complete = parts.filter((part) => part.startsWith('=')).map((part) => part.slice(1).trim());
    const prefixes = parts.filter((part) => !part.startsWith('='));
    const inSection = (suffix: string) => prefixes.map((part) => `${part}${suffix}`).join(', ');

    return $(
      [
        inSection(' .is-checked'),
        inSection('.is-checked'),
        inSection(' [aria-checked="true"]'),
        ...complete,
      ]
        .filter(Boolean)
        .join(', ')
    );
  }

  optionSectionSelector(
    field: 'deviceName' | 'storage' | 'caseSize' | 'color' | 'connectivity'
  ): string {
    switch (field) {
      case 'deviceName':
        return '.s-option-device, .watch-bc-option__option-item:has([name*="device"]), #device_info[aria-label="Device"]';
      case 'storage':
        return '=.s-option-storage .is-checked .s-rdo-name, =[an-la^="storage:"][class*="selected" i]';
      case 'caseSize':
        return '.watch-bc-option__option-item:has([name*="case-size"]), =#capacity_info.Capacity_selected__8LHNQ';
      case 'connectivity':
        return '.watch-bc-option__option-item:has([name*="connectivity"]), =#watchConnectivity [class*="selected" i]';
      case 'color':
        return '=.s-option-color-special .is-checked .s-color-name, =.watch-bc-option__option-item:has(> .input-case-color:checked) .option-select__title, =[class*="ColorTile_container"]:has([class*="ColorTile_selected"]) [class*="ColorTile_bottomText"]';
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
    if (getRunConfig().siteCode === 'US') {
      return $("div[class*='ProductTitle_product'] h1");
    }
    return $('.hubble-price-bar__detail-title, .sg-product-display-name, .watch-bc-price-bar__headline');
  }
}