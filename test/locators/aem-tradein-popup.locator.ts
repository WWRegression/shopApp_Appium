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
      'div[class*="step--show"] button[an-la*="next"]:not(.cta--disabled), button[class*="bc-trade-in-popup__btn-continue"]:not(.cta--disabled), button[class*="trade-in-popup-v3__btn-continue"]'
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
        '.trade-in-popup-v3__condition-list-item input',
        '.trade-in-popup-v3__condition input',
        '.trade-in-popup__condition-list input',
        '.bc-trade-in-popup__condition-list input',
        '.bc-exchange-popup__condition-list label.radio-v2__label',
      ].join(', ')
    );
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
    return $('button[an-la*="imei" i], button[class*="imei"], [an-la*="check imei" i]');
  }

  optionByValue(optionValue: string) {
    const v = optionValue.replace(/"/g, '\\"');
    return $(
      [
        `.trade-in-popup-v3__tradeIn-category-list input[value^="${v}" i] + label`,
        `.trade-in-popup__category-device-list input[value="${v}" i] + label`,
        `.trade-in-select a[value="${v}" i]`,
        `.trade-in-select a[data-name="${v}" i]`,
        `[data-testid="${v}" i]`,
        `.js-dropbox-item[data-filter-info*="${v}" i]`,
        `[an-la*="${v}" i]`,
      ].join(', ')
    );
  }
}
