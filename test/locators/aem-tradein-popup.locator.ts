/**
 * Trade-In popup (WebView).
 * Step popups (v3 / legacy / CN / IN) share one naming rule: the shown step gets `<prefix>__step--show`
 * and carries `<prefix>__<name>-wrap` (or `#...Popup-stepN`), so one step table covers every site.
 * US is a single-screen React modal whose fields grow as you pick.
 */
export type TradeInStep =
  | 'intro'
  | 'customer'
  | 'choose'
  | 'discount'
  | 'select-device'
  | 'enter-imei'
  | 'check-condition'
  | 'apply-discount';

const STEP_POPUP_ROOTS = [
  '.trade-in-popup-v3[role="dialog"]',
  '.trade-in-popup[role="dialog"]',
  '.bc-trade-in-popup',
  '.bc-exchange-popup[role="dialog"]',
].join(', ');

const US_ROOT = '[class*="Modal_overlay__"]:has(#tradein-header)';

/** Matched against the shown step element itself (el.matches). Add a row when a site adds a new step. */
export const TRADE_IN_STEPS: [TradeInStep, string][] = [
  ['intro', '[class*="__intro-wrap"]'],
  ['customer', '[class*="__customer-wrap"]'],
  ['choose', '[class*="__choose-wrap"]'],
  ['discount', '[class*="__discount-wrap"]'],
  ['select-device', '[class*="__tradeIn-wrap"], [class*="__category-wrap"], [id$="Popup-step1"]'],
  ['enter-imei', '[class*="__imei-wrap"]'],
  ['check-condition', '[class*="__condition-wrap"], [id$="Popup-step2"]'],
  ['apply-discount', '[class*="__apply-wrap"], [id$="Popup-step3"]'],
];

/** Pincode/zip box shown before the device list: IN `.js-pin-wrap`, ID `#tradeInZipCode`. */
const PINCODE_WRAP = ':is(.js-pin-wrap, [class*="__imei-form-wrap"]:has(#tradeInZipCode))';

const ENABLED_BUTTON = ':not([disabled]):not(.cta--disabled):not([an-la$="close"]):not([class*="btn-back"])';

export class AemTradeInPopupLocator {
  get tradeInModal() {
    return $(`${STEP_POPUP_ROOTS}, ${US_ROOT}`);
  }

  get activeStep() {
    return $(`:is(${STEP_POPUP_ROOTS}) [class*="__step--show"]`);
  }

  /** Apply in the popup footer; buttons inside any step (shown or hidden) are excluded. */
  get footerApplyButton() {
    return $(`:is(${STEP_POPUP_ROOTS}) ${this.applyButton}:not([class*="__step"] *)`);
  }

  // ---- Used inside the shown step: stepElement.$(...) ----
  readonly nextButton =
    `button:is([an-la*="next" i], [an-la*="continue" i], [class*="btn-continue"], [class*="btn-next"])${ENABLED_BUTTON}`;

  readonly applyButton = `button:is([an-la*="apply" i], [class*="btn-apply"])${ENABLED_BUTTON}`;

  /**
   * Answer inputs, grouped into questions by name. Some condition lists (e.g. HK_EN) use checkboxes as answers;
   * they are scoped to the condition list so terms checkboxes elsewhere are not taken as questions.
   */
  readonly answerOptions = 'input[type="radio"], [class*="__condition-list"] input[type="checkbox"]';

  /** Required agreement boxes only; optional checkbox answers (e.g. extra condition details) are left alone. */
  readonly termsCheckboxes = [
    'input[type="checkbox"]:is([required], [aria-required="true"], [an-la*="term" i], [name*="term" i], [id*="term" i], [id*="agree" i])',
    ':is(.is-required, [class*="tnc"], [class*="terms"], [class*="agree"]) input[type="checkbox"]',
  ].join(', ');

  readonly textInput = 'input:is([type="text"], [type="tel"], [type="number"], :not([type]))';

  /**
   * IMEI field in a step that also has other inputs (e.g. apply step, IN select-device).
   * IN's field has no imei attribute, only the `__imei-type3` section around it; its pincode box also carries
   * an `__imei-form-wrap` class, so a broader class match would catch the pincode.
   */
  readonly imeiInput = [
    'input:is([name*="imei" i], [id*="imei" i], [class*="imei" i], [placeholder*="imei" i], [an-la*="imei" i])',
    '[class*="__imei-type3"] input',
  ].join(', ');

  readonly imeiCheckButton =
    `button:is(.js-validate-device-imei, [an-la*="imei" i], [class*="__imei-form"] .search, [class*="__imei-type3"] [class*="__imei-form-enter"])${ENABLED_BUTTON}:not([an-la$="next"])`;

  /** Shown only while the field is in the error state (the wrapper gets .error); the pincode box is excluded. */
  readonly imeiError = `.text-field-v2.error:not(${PINCODE_WRAP} *) .text-field-v2__text.error`;

  /** Pincode/zip gate before the device list (e.g. IN, ID). */
  readonly pincodeInput = `${PINCODE_WRAP} input`;

  /** Shown under the field once the pincode is accepted (IN, ID). */
  readonly pincodeSuccess = `${PINCODE_WRAP} .text-field-v2__text.success`;

  readonly imeiLoading = '[class*="__imei-form--load-wrap"], .circular-progress';

  deviceOption(value: string): string {
    const v = value.replace(/"/g, '\\"');
    return [
      `input[value="${v}" i]`,
      `input[value^="${v}" i]`,
      `a[value="${v}" i]`,
      `[data-name="${v}" i]`,
      `[data-testid="${v}" i]`,
      `[data-filter-info*="${v}" i]`,
      `[an-la$="${v}" i]`,
    ].join(', ');
  }

  // ---- US ----
  get usModal() {
    return $(US_ROOT);
  }

  get usGoodConditionOption() {
    return $(`${US_ROOT} [data-testid="nonCracked"]`);
  }

  /**
   * Dropdown buttons in field order: "Dropdown Brand Selected: Samsung", "Device Dropdown Selected: undefined".
   * The selected part may hold a previous trade-in's value, so fields are matched by position.
   */
  readonly usDropdowns = `${US_ROOT} [role="button"][aria-label*="Selected:"]`;

  /** Item in an opened dropdown list: "Dropdown Brand Option: Samsung", "Device Dropdown Option: Galaxy Z Flip6". */
  usDropdownOption(value: string) {
    return $(`${US_ROOT} [role="button"][aria-label$="Option: ${value.replace(/"/g, '\\"')}" i]`);
  }

  get usAgreeButton() {
    return $(`${US_ROOT} [class*="Modal_footer__"] button[an-la="trade-in:yes, i agree" i]:not([disabled])`);
  }
}
