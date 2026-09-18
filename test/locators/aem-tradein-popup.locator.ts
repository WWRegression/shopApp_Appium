/**
 * AEM / Hybris Trade-In popup (WebView).
 * 고정 6-step 클릭이 아니라, 현재 step을 감지해 처리한다.
 */
export class AemTradeInPopupLocator {
  get modal() {
    return $(
      [
        '.bc-trade-in-popup',
        '.trade-in-popup-v3',
        '.trade-in-modal',
        '.hubble-tradein-popup[style]',
        '.bc-exchange-popup',
        '#tradein [class*="Modal_content"]',
        '[class*="TradeIn_tradein__instance"]',
      ].join(', ')
    );
  }

  get closeButton() {
    return $(
      [
        'button.trade-in-popup__close[an-la^="trade-in:"][an-la$="close"]',
        'button.trade-in-popup-v3__close[an-la^="trade-in:"][an-la$="close"]',
        'button.bc-trade-in-popup__close[an-la^="trade-in:"][an-la$="close"]',
        'button.bc-exchange-popup__close[an-la^="trade-in:"][an-la$="close"]',
        '[class*="Modal_right"] button[an-la^="trade-in:"][an-la$="close"]',
      ].join(', ')
    );
  }

  get continueButton() {
    return $(
      [
        'div[class*="step--show"] button[an-la*="next"]:not(.cta--disabled):not([an-la$="close"]):not([class*="btn-back"])',
        'button[class*="bc-trade-in-popup__btn-continue"]:not(.cta--disabled)',
        'button[class*="trade-in-popup-v3__btn-continue"]:not(.cta--disabled)',
      ].join(', ')
    );
  }

  get applyButton() {
    return $(
      [
        'button[an-la*="apply trade in"]:not(.cta--disabled)',
        'button[class*="bc-trade-in-popup__btn-apply"]:not([disabled])',
        'button[an-la*="apply trade-in"]:not(.cta--disabled)',
        '[an-la="trade-in:yes, i agree"]',
        'button[class*="trade-in-popup__btn-apply"]:not(.cta--disabled)',
        '#agreement-section #card-option[role="button"]',
      ].join(', ')
    );
  }

  get termsCheckbox() {
    return $(
      'input[type="checkbox"][an-la*="term" i], .trade-in-popup__apply-wrap input[type="checkbox"], [class*="tnc"] input[type="checkbox"]'
    );
  }

  get conditionInputs() {
    return $$(
      [
        '.trade-in-popup-v3__condition-list-item label.radio-v2__label',
        '.trade-in-popup-v3__condition label.radio-v2__label',
        '.trade-in-popup__condition-list label.radio-v2__label',
        '.bc-trade-in-popup__condition-list label.radio-v2__label',
        '.bc-exchange-popup__condition-list label.radio-v2__label',
        'li.radio-v2.cn-trade-in-popup__condition-option-item label.radio-v2__label',
        '.trade-in-popup-v3__condition-list-item input',
        '.trade-in-popup-v3__condition input',
        '.trade-in-popup__condition-list input',
        '.bc-trade-in-popup__condition-list input',
      ].join(', ')
    );
  }

  get goodConditionOption() {
    return $(
      [
        '.trade-in-popup-v3 input[accept_data="yes"]',
        '.trade-in-popup-v3 [an-la*="good condition" i]',
        '.trade-in-popup__summary-accept input[accept_data="yes"]',
        '#addconditionCheck0-1[name="jp-tradein-Q5"]',
      ].join(', ')
    );
  }

  get preAcceptYesButton() {
    return $('.trade-in-popup__summary-accept input[accept_data="yes"]');
  }

  get imeiInput() {
    return $(
      [
        'input.text-field-v2__input.js-validate-device-imei-input',
        'input#common-trade-imei',
        "[name='tradeIn.IMEI_FORM'] input",
        '.trade-in-summary__imei-input input',
        '.trade-in-popup__imei-form input#trade-imei',
      ].join(', ')
    );
  }

  get checkImeiButton() {
    // Do NOT use bare [an-la*="imei"] — Back is an-la="trade-in:enter imei:close".
    return $(
      [
        'button.js-validate-device-imei:not(.cta--disabled)',
        'button[an-la*="check imei" i]:not([an-la$="close"]):not([class*="btn-back"])',
        'button[an-la*="validate imei" i]:not([an-la$="close"]):not([class*="btn-back"])',
        '.trade-in-popup__imei-form button[type="button"]:not([an-la$="close"]):not([class*="btn-back"]):not(.cta--disabled)',
        '.trade-in-popup-v3__imei button[type="button"]:not([an-la$="close"]):not([class*="btn-back"]):not(.cta--disabled)',
      ].join(', ')
    );
  }

  optionByValue(optionValue: string) {
    const v = optionValue.replace(/"/g, '\\"');
    // Keep selectors inside the Trade-In popup only.
    // A bare [an-la*="512GB"] matches BC memory radios behind the overlay.
    return $(
      [
        `.trade-in-popup-v3__tradeIn-category-list input[value^="${v}" i] + label`,
        `.trade-in-popup-v3__tradeIn-category-list input[value^="${v}" i]`,
        `.trade-in-popup__category-device-list input[value="${v}" i] + label`,
        `.bc-exchange-popup__tradeIn-category-list input[an-la$="${v}" i] + label`,
        `.bc-trade-in-popup__tradeIn-category-list input[value^="${v}" i] + label`,
        `.trade-in-select a[value="${v}" i]`,
        `.trade-in-select a[data-name="${v}" i]`,
        `.trade-in-popup-v3 [data-testid="${v}" i]`,
        `.trade-in-popup-v3 .js-dropbox-item[data-filter-info*="${v}" i]`,
        `.trade-in-popup-v3 [an-la*="${v}" i]`,
        `.bc-trade-in-popup [an-la*="${v}" i]`,
        `.bc-exchange-popup [an-la*="${v}" i]`,
        `[class*="TradeIn_tradein__instance"] [an-la*="${v}" i]`,
      ].join(', ')
    );
  }
}
