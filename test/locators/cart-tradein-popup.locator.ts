/**
 * Hybris cart trade-in dialog. The host is `.modal.show`; the inner class contains `trade-in-steps`.
 * Widget lookups stay on the host. A descendant `[class*='trade-in-steps']` filter matches nothing on some WebViews.
 */
export class CartTradeInPopupLocator {
  readonly popup = ".modal.show";

  /** Step name is the middle token of `data-an-la`, e.g. `trade-in:select device:next`. Includes a disabled button. */
  readonly stepButton = `.modal.show [class*='trade-in-steps'] .modal__footer button.primary`;

  /** Used only when `stepButton` has no step token, e.g. `trade-in:apply discount:close`. */
  readonly stepCloseButton = `.modal.show [class*='trade-in-steps'] .modal__close`;

  readonly dropdownOption = 'li.trade-up__dropdown-option, li.trade-in__dropdown-option';

  get modal() {
    return $(this.popup);
  }

  get paymentOption() {
    return $(`${this.popup} .trade-in-types [class*="-button"]`);
  }

  /** Closed device lists. Open ones add `mdc-text-field--focused` or `mat-expanded`. */
  get deviceLists() {
    return $$(`${this.popup} .mat-mdc-text-field-wrapper, ${this.popup} mat-expansion-panel`);
  }

  get openDeviceList() {
    return $(
      `${this.popup} .mat-mdc-text-field-wrapper.mdc-text-field--focused, ${this.popup} mat-expansion-panel.mat-expanded`
    );
  }

  get deviceDropdownList() {
    return $(
      '.show .mat-mdc-text-field-wrapper, .show mat-expansion-panel'
    );
  }

  /**
   * Same match as `mat-option[data-an-la*="trade-in:select device" i][data-an-la*="value" i]`
   * and `.trade-in__dropdown-option[...]`. Case is compared in the page script, not with a CSS `i` flag.
   */
  deviceOption(value: string): string {
    const v = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return [
      `mat-option[data-an-la*="trade-in:select device"][data-an-la*="${v}"]`,
      `.trade-in__dropdown-option[data-an-la*="trade-in:select device"][data-an-la*="${v}"]`,
    ].join(', ');
  }

  get categoryRadios() {
    return $$(`${this.popup} mat-radio-button.trade-in-box`);
  }

  get dropdowns() {
    return $$(`${this.popup} mat-expansion-panel`);
  }

  get productGroups() {
    return $$(`${this.popup} .sc-e-p-m-p-c-s-b`);
  }

  get matSelects() {
    return $$(`${this.popup} mat-select.modal__select`);
  }

  get matOptions() {
    return $$(
      "div.cdk-overlay-container mat-option:not([aria-disabled='true']), div.cdk-overlay-container [role='option']:not([aria-disabled='true'])"
    );
  }

  get continueButton() {
    return $(
      `${this.popup} .modal__footer button.pill-btn--blue:not([disabled]), ${this.popup} .modal__footer button.pill-btn--black:not([disabled])`
    );
  }

  get conditionGroups() {
    return $$(`${this.popup} .condition-radio`);
  }

  /** Agreement boxes. Condition answers, including CN's optional multi-select, stay in `.condition-radio`. */
  get termsCheckboxes() {
    return $$(`${this.popup} mat-checkbox input[type="checkbox"]`);
  }

  get postalInput() {
    return $(`${this.popup} :is(input[formcontrolname="postCodeControl"], input#trade-up-pincode, input#trade-in-pincode)`);
  }

  get postalCheckButton() {
    return $(`${this.popup} :is(button.post-code-form__btn, .trade-in-pincode-enter)`);
  }

  get postalSuccess() {
    return $(`${this.popup} :is(mat-hint.post-code-success, mat-hint.text-primary)`);
  }

  get postalError() {
    return $(`${this.popup} :is(mat-hint.post-code-error, mat-hint.text-danger)`);
  }

  get imeiInput() {
    return $(
      [
        `${this.popup} input[formcontrolname*="imei"]`,
        `${this.popup} input[id*="imei"]`,
        `${this.popup} input[name*="imei"]`,
        `${this.popup} input[placeholder*="IMEI"]`,
        `${this.popup} input[placeholder*="imei"]`,
        `${this.popup} input[matinput][maxlength="15"][required]`,
        `${this.popup} input[matinput][maxlength="16"][required]`,
      ].join(', ')
    );
  }

  /**
   * Dedicated verify control. VN has none: back, next, and the modal close all carry
   * `trade-in:enter imei:close|next`, and the blue next button submits `#imeiForm`.
   */
  get imeiCheckButton() {
    return $(
      `${this.popup} button[class*="imei"]:not([data-an-la$=":close"]):not([data-an-la$=":next"]):not(.modal__close):not([disabled])`
    );
  }

  /** VN `mat-hint.valid-input` once the serial/IMEI is accepted. */
  get imeiSuccess() {
    return $(`${this.popup} mat-hint.valid-input, ${this.popup} .trade-in-summary__imei-success`);
  }

  get imeiError() {
    return $(`${this.popup} :is(mat-error, mat-hint.text-danger)`);
  }
}
