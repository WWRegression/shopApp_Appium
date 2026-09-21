import { getRunConfig } from '../../config/run.config';
import { storageLabelVariants } from '../helpers/data.helper';
import { OptionChip } from '../pages/bc.page';
/**
 * Buy Configurator (WebView) locators.
 * CSS는 Hybris BC 기준. 앱 변경 시 Inspector로 보정.
 */
export class BcLocator {
  get bcLayout() {
    // Early-appearing BC anchors (Katalon BC/BCLayout + sticky/price bar).
    return $(
      [
        '.bc-page',
        '.st-page-pd',
        '.wbc-page',
        '.wbc-page-v2',
        '#pdp-page',
        '.bc-cross-navigation-wrap',
        'section.watch-bc',
        '.hubble-price-bar',
        '.watch-bc-price-bar',
        'cx-storefront',
        'main[cxskiplink*="main"]',
      ].join(', ')
    );
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
        '.watch-bc-buyflow.trade-in-option .buyflow-option.no-option'
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
        `#watchConnectivity [an-la*="card:${v}" i]`,
        `#carrier_info [an-la*="connectivity" i][an-la*="${v}" i]`
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

  get summaryDeviceName() {
    return $$(
      [
        '.hubble-product__summary .hubble-product__summary-head .s-option-title',
        'div[data-comp-name="watchBcOrderSummary"] .dvice-name',
        'div[class*="SummaryHeader_productTitleInfo"] > span:first-child'
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
  optionSelectedResult(field: string) {
    const selector = this.optionSectionSelector(field);
    if (!selector) {
      return undefined;
    }
    const parts = selector
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

  optionSectionSelector(field: string): string | undefined {
    switch (field) {
      case 'deviceName':
        return '.s-option-device, .watch-bc-option__option-item:has([name*="device"]), #device_info[aria-label="Device"]';
      case 'storage':
        return '=.s-option-storage .is-checked .s-rdo-name, =[an-la^="storage:"][class*="selected" i]';
      case 'caseSize':
        // Title only — section .is-checked also matches "Color options may vary depending on the case size".
        return [
          '=.watch-bc-option__option-item:has(> .input-case-size:checked) .option-select__title',
          '=#capacity_info.Capacity_selected__8LHNQ',
        ].join(', ');
      case 'connectivity':
        return [
          '=.watch-bc-option__option-item:has(> .input-connectivity:checked) .option-select__title',
          '=#watchConnectivity [class*="selected" i]',
        ].join(', ');
      case 'color':
        // Watch case colour (not band colour): checked input-case-color label / phone / US tile.
        return [
          '=.watch-bc-option__option-item:has(> .input-case-color:checked) .option-select__title',
          '=.s-option-color-special .is-checked .s-color-name',
          '=[class*="ColorTile_container"]:has([class*="ColorTile_selected"]) [class*="ColorTile_bottomText"]',
        ].join(', ');
    }
    return undefined;
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
        '.watch-bc-price-bar__cta button'
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

  get scPlusPlanOption() {
    return $(
      [
        '.hubble-product__options-payment .s-option-box',
        'label[for="pd-samsung-care-payment-0"]',
      ].join(', ')
    );
  }

  get scPlusModal() {
    return $(
      [
        '.hubble-care-popup-new:not([style*="display: none"])',
        'div.hubble-care-popup.smcpopup[role="dialog"][style*="display: block"]',
        '.smc-modal',
      ].join(', ')
    );
  }

  get scPlusTypeOption() {
    return $('.smc-modal :has(> [name="smc-types"]), .smc-modal [name="smc-types"]');
  }

  get scPlusDurationOption() {
    return $('.smc-modal :has(> [name="smc-durations"]), .smc-modal [name="smc-durations"]');
  }

  get scPlusContinueButton() {
    return $('.smc-modal [an-la="samsung care:continue"]');
  }

  get scPlusConfirmButton() {
    return $(
      [
        'button[an-la="samsung care:confirm"]',
        '[an-la*="samsung care"][an-la*="agree & close"]',
        'a[an-la="samsung care:confirm"][aria-disabled="false"]',
      ].join(', ')
    );
  }

  get scPlusTermsCheckboxes() {
    return $$(
      [
        '.hubble-care-popup-new__check-list .checkbox-radio input',
        '.smc-modal .tandc__item',
        '.js-added-services-container .added-services-terms .checkbox-square',
        'mat-checkbox[formcontrolname="tnc"] input[required]',
        '.hubble-care-popup__check-list.is-check-required input[id*="care-chk"]',
      ].join(', ')
    );
  }

  get scPlusPriceLabel() {
    return $(
      [
        '#samsung-care div[class*="is-checked"][data-smc-price]',
        '#samsung-care div[class*="is-checked"] .s-option-price',
        '#samsung-care div[class*="is-checked"] .opt-option-price',
        '[class*="CareOfferOption_selected"] span',
      ].join(', ')
    );
  }

  get scPlusAppliedLabel() {
    return $(
      [
        '#lineSummary .hubble-product__summary-product-inner .hubble-product__summary-product-option',
        '.total-summary__price-bundle .summary-care-title',
        'ul[class*="samsung-care"]:has(li.pd-select-option__item.selected)',
        '.hubble-product__summary-product-option',
        '.wearable-bc-price__bundle-title',
        '[class*="SummaryDetails_summary__details__two__row"] span',
      ].join(', ')
    );
  }

  get eupAddButton() {
    return $(
      [
        ':has(> [an-la="eup:yes" i])',
        '[an-la="eup:yes" i]',
        '[an-la="purchase program:upgrade program" i]',
        'button[an-la*="purchase program:samsung flex" i][data-type="upgrade" i]:not(.disabled)',
        '[an-la*="eup" i][an-la*="yes" i]',
        '[an-la*="upgrade" i]',
      ].join(', ')
    );
  }

  get eupNoButton() {
    return $('[an-la*="eup" i][an-la*="no" i], [an-la*="upgrade" i][an-la*="no" i]');
  }

  get eupRemoveButton() {
    return $(
      [
        '[data-type-headline="Samsung Flex"] [an-la="upgrade program:remove"]',
        '[an-la="eup:remove"]',
        '.samsung-flex__cta button.js-upgrade-remove',
      ].join(', ')
    );
  }

  get eupApplyButton() {
    return $(
      [
        '[data-type-headline="Samsung Flex"] [an-la="upgrade program:apply"]',
        '.samsung-flex__cta button.js-upgrade-add',
      ].join(', ')
    );
  }

  get eupImeiInput() {
    return $('.text-field-v2__input#eup-imei, input#eup-imei');
  }

  get eupConfirmImeiButton() {
    return $('[id="confirmImei"][an-la="eup popup:enter imei:confirm code"]');
  }

  get eupTncLabels() {
    return $$('label[for*="upgrade-seau-chk"]');
  }

  get summaryTotalPrice() {
    return $(
      [
        '.hubble-product__total-text',
        "[class*='SummaryDetails_amountContainer']",
        '.total-summary__price-total .price',
        '.hubble-price-bar__price-now',
      ].join(', ')
    );
  }

  get buyNowButton() {
    return $(
      [
        'div.hubble-price-bar__price-cta:not(.inner-cta) [an-la="top sticky bar:buy now"]',
        'div:is(.hubble-price-bar__price-cta, .watch-bc-price-bar__cta):not(.inner-cta) [an-la*="buy now" i]',
        '[an-la="top sticky bar:buy now"].price-bar-cart-btn',
      ].join(', ')
    );
  }

  get addonAddButtons() {
    return $$(
      [
        "button[an-la='add-on:add item']",
        "a[class*='AddOnProductItemMX_productCardTop']",
      ].join(', ')
    );
  }

  get simAddButton() {
    return $(
      [
        '[an-la*="tariffs:vodafone"i]',
      ].join(', ')
    );
  }

  get simNoButton() {
    return $(
      [
        '[an-la*="sim" i][an-la*="no" i]',
        '[an-la="tariff:no"]',
        '[an-la="tariff:none"]',
        '.s-option-tariff [an-la*="no" i]',
      ].join(', ')
    );
  }

  get simPurchaseOption() {
    return $(
      [
        '[an-la*="tariffs:vodafone"i]',
        '.contents-tariff__option-list',
      ].join(', ')
    );
  }

  get simInlinePlanOption() {
    return $(
      [
        'div[data-tariff-carrier="vodafone"] label.hubble-pd-popup-opener[data-tariff-action="confirmation"]',
      ].join(', ')
    );
  }

  get simModal() {
    return $('.tariff-popup__inner, .bc-popup__content-wrap');
  }

  get simPlanOption() {
    return $(
      [
        '.tariff-popup__radio',
        '#tariff-tab-panel-0 .contents-tariff__option-list:first-of-type label[data-tariff-action="confirmation"]',
      ].join(', ')
    );
  }

  get simNextButton() {
    return $('.tariff-popup__btn-next');
  }

  get simConfirmButton() {
    return $('.tariff-popup__btn-submit, #hubble-tariff-layer button[title="Confirm Popup"]');
  }

  get simTermsCheckboxes() {
    return $$(
      [
        '.tariff-popup__checkbox:has(input[required]):not(.tariff-popup__checkbox--checked)',
        '.bc-tariff-type1-popup__checkbox:has(input[required]):not(.tariff-popup__checkbox--checked)',
        '.tariff-popup__checkbox input[required]:not(:checked)',
      ].join(', ')
    );
  }

  get simRemoveButton() {
    return $(
      [
        '.is-delete[role="button"][an-la*="tariff:"]',
      ].join(', ')
    );
  }

  get simPriceLabel() {
    return $(
      [
        '.tariff-popup__selected-spec-header .tariff-popup__selected-spec-value',
        '.tariff-popup__selected-spec-price strong',
        '.product_service_offers .s-selec-price',
        '.s-tariff-summary__price',
      ].join(', ')
    );
  }

  get simAppliedLabel() {
    return this.simRemoveButton;
  }

  usCarrierPurchaseOption(connectivity: string) {
    const cleaned = connectivity.toLowerCase().trim().replace(/&/g, '-');
    return $(
      [
        `[an-la*="purchase options:${cleaned}"]`,
        `[an-la*="purchase options:${connectivity.toLowerCase().trim()}"]`,
      ].join(', ')
    );
  }

  get bcProductName() {
    if (getRunConfig().siteCode === 'US') {
      return $("div[class*='ProductTitle_product'] h1");
    }
    return $('.hubble-price-bar__detail-title, .sg-product-display-name, .watch-bc-price-bar__headline');
  }
}