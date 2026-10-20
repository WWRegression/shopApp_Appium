import { PdLocator } from '../../locators/pd.locator';
import {
  clickIfDisplayed,
  getEnabledElements,
  isAnySelected,
  isDisplayedOrFalse,
  jsClick,
  scrollAndJsClick,
  setInputValue,
  waitForDisplayedOrFalse,
} from '../../helpers/element.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';

const WAIT_MS = 10000;
const STEP_LEAVE_MS = 8000;
const MAX_STEPS = 5;
/** Pincode check is a server round-trip with no fixed duration. */
const VALIDATE_MS = 30000;

type TradeUpSteps = 'selectDevice' | 'checkCondition' | 'applyDiscount';
/** PD Trade-Up popup. VD uses step panels; IN is one screen treated as selectDevice. */
export class PdTradeUpService {
  private readonly locator = new PdLocator();

  private readonly candidates: [TradeUpSteps, string[]][] = [
    ['selectDevice', ['sdf-comp-step-panel-product', 'siel-trade-in-popup', 'cn-trade-in-popup__step1']],
    ['checkCondition', ['sdf-comp-step-panel-condition', 'cn-trade-in-popup__step2']],
    ['applyDiscount', ['sdf-comp-step-panel-discount', 'cn-trade-in-popup__step3']],
  ];

  async addService(postalCode?: string ): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.tradeUpYesOption, WAIT_MS))) {
      throw new Error('[PD.TRADEUP.addService] trade-up yes option not found');
    }
    console.warn('[PD.TRADEUP.addService] trade-up yes option clicked');
    await this.popupProcess(postalCode);
  }

  private async popupProcess(postalCode?: string): Promise<void> {
    if (!(await this.waitForOpen())) {
      throw new Error('[PD.TRADEUP] popup did not open');
    }

    let previousStep: TradeUpSteps | null = null;
    let retried = false;
    for (let attempt = 1; attempt <= MAX_STEPS; attempt++) {
      const active = await this.currentActiveStep();
      if (!active) {
        if (!(await this.isPopupOpen())) {
          console.warn('[PD.TRADEUP] popup closed');
          return;
        }
        throw new Error('[PD.TRADEUP] popup open but no step shown');
      }
      const sameStep = active === previousStep;
      if (sameStep && retried) {
        throw new Error(`[PD.TRADEUP] stuck on step "${active}"`);
      }
      retried = sameStep;
      previousStep = active;
      console.warn(`[PD.TRADEUP.popupProcess] step ${attempt}: ${active}${sameStep ? ' (retry)' : ''}`);
      await this.runStep(active, postalCode);
      if (!(await this.waitForStepLeave(active))) {
        console.warn(`[PD.TRADEUP] step "${active}" still shown after ${STEP_LEAVE_MS}ms`);
      }
    }
    throw new Error(`[PD.TRADEUP] popup still open after ${MAX_STEPS} steps`);
  }

  private async currentActiveStep(): Promise<TradeUpSteps | null> {
    const steps = await this.locator.tradeUpCurrentSteps;
    for (const step of steps) {
      if (!(await isDisplayedOrFalse(step))) {
        continue;
      }
      const stepClassName = (await step.getAttribute('class').catch(() => '')) ?? '';
      const matched = this.candidates.find(([, classNames]) =>
        classNames.some((classNamePart) => stepClassName.includes(classNamePart))
      );
      if (matched) {
        return matched[0];
      }
      console.warn(`[PD.TRADEUP.currentActiveStep] shown step not mapped, class="${stepClassName}"`);
      return null;
    }
    return null;
  }

  private async runStep(step: TradeUpSteps, postalCode?: string): Promise<void> {
    switch (step) {
      case 'selectDevice':
        await this.stepSelectDevice(postalCode);
        return;
      case 'checkCondition':
        await this.stepCheckCondition();
        return;
      case 'applyDiscount':
        await this.stepApplyDiscount();
        return;
    }
  }

  private async isPopupOpen(): Promise<boolean> {
    return isDisplayedOrFalse(this.locator.tradeUpModal);
  }

  private async waitForOpen(timeout = WAIT_MS): Promise<boolean> {
    const displayed = await waitForDisplayedOrFalse(this.locator.tradeUpModal, { timeout });
    console.warn('[PD.TRADEUP.waitForOpen] popup opened=', displayed);
    return displayed;
  }

  /** False when the same step is still shown after the timeout. */
  private async waitForStepLeave(step: TradeUpSteps): Promise<boolean> {
    return driver
      .waitUntil(async () => !(await this.isPopupOpen()) || (await this.currentActiveStep()) !== step, {
        timeout: STEP_LEAVE_MS,
        interval: 300,
      })
      .then(() => true)
      .catch(() => false);
  }

  private async stepSelectDevice(postalCode?: string): Promise<void> {
    console.warn('[PD.TRADEUP.stepSelectDevice] step select device found');
    await this.setPostalCode(postalCode);
    await this.selectDeviceOptions()
    await this.selectContinueButton();
  }

  private async stepCheckCondition(): Promise<void> {
    console.warn('[PD.TRADEUP.stepCheckCondition] step check condition found');
    await this.selectConditionYes();
    await this.selectFirstRadios();
    await this.selectContinueButton();
  }

  private async stepApplyDiscount(): Promise<void> {
    console.warn('[PD.TRADEUP.stepApplyDiscount] step apply discount found');
    await this.checkAllTermsAndConditions();
    await this.selectContinueButton();
  }

  private async selectContinueButton(): Promise<void> {
    if (!(await clickIfDisplayed(this.locator.tradeUpConfirmButton, WAIT_MS))) {
      throw new Error('[PD.TRADEUP] continue/apply button not clickable');
    }
    console.warn('[PD.TRADEUP.selectContinueButton] continue/apply button clicked');
  }

  private async setPostalCode(postalCode?: string): Promise<void> {
    const input = this.locator.tradeUpPostalInput;
    if (!(await isDisplayedOrFalse(input))) {
      console.warn('[PD.TRADEUP.setPostalCode] postal code input not shown');
      return;
    }
    if (await isDisplayedOrFalse(this.locator.tradeUpPostalSuccessMessage)) {
      console.warn('[PD.TRADEUP.setPostalCode] postal code already accepted');
      return;
    }
    if (!postalCode) {
      throw new Error('[PD.TRADEUP] postal code shown but site data has no tradeUp.postalCode');
    }
    await setInputValue(input, postalCode);
    console.warn(`[PD.TRADEUP.setPostalCode] entered: ${postalCode}`);
    if (!(await clickIfDisplayed(this.locator.tradeUpPostalCheckButton, WAIT_MS))) {
      throw new Error('[PD.TRADEUP] postal code check button not clickable');
    }

    const started = Date.now();
    let error = '';
    const accepted = await driver
      .waitUntil(
        async () => {
          if (await isDisplayedOrFalse(this.locator.tradeUpPostalSuccessMessage)) {
            return true;
          }
          const errorEl = this.locator.tradeUpPostalErrorMessage;
          if (await isDisplayedOrFalse(errorEl)) {
            error = ((await errorEl.getText().catch(() => '')) ?? '').trim() || 'error shown';
            return true;
          }
          return false;
        },
        { timeout: VALIDATE_MS, interval: 500 }
      )
      .catch(() => false);
    if (error) {
      throw new Error(`[PD.TRADEUP] postal code rejected: "${error}"`);
    }
    if (!accepted) {
      throw new Error(`[PD.TRADEUP] postal code not accepted within ${VALIDATE_MS}ms`);
    }
    console.warn(`[PD.TRADEUP.setPostalCode] accepted in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }

  private async selectDeviceOptions(): Promise<void> {
    for (let pass = 1; pass <= 8; pass++) {
      const select = await this.nextUnselectedDropdown(pass === 1 ? 0 : WAIT_MS);
      console.warn('[PD.TRADEUP.selectDeviceOptions]   dropdown found=', select);
      if (!select) {
        break;
      }
      const value = await driver.execute((el) => {
        const sel = el as HTMLSelectElement;
        const index = [...sel.options].findIndex((option) => option.value);
        if (index < 0) {
          return '';
        }
        sel.selectedIndex = index;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return sel.value;
      }, select).catch(() => '');
      console.warn(`[PD.TRADEUP.selectDeviceOptions]   dropdown ${pass}: "${value || '-'}"`);
    }

    await this.selectFirstRadios();
    console.warn('[PD.TRADEUP.selectDeviceOptions] option selects selected done');
  }

  /**
   * First dropdown with no answer yet and a real option.
   * timeout 0 checks once, then waits only when a dropdown is on screen but its options are not ready.
   * A later pass waits for a dropdown that appears after the previous pick.
   */
  private async nextUnselectedDropdown(timeout: number): Promise<WebdriverIO.Element | undefined> {
    const find = async (): Promise<WebdriverIO.Element | undefined> => {
      for (const select of await this.locator.tradeUpDeviceOptions.getElements()) {
        const ready = await driver.execute((el) => {
          const node = el as HTMLSelectElement;
          if (node.closest('.menu')?.classList.contains('selected')) {
            return false;
          }
          if (node.options[node.selectedIndex]?.value) {
            return false;
          }
          return [...node.options].some((option) => Boolean(option.value));
        }, select).catch(() => false);
        if (ready) {
          return select;
        }
      }
      return undefined;
    };

    const immediate = await find();
    if (immediate) {
      return immediate;
    }
    const waitMs = timeout > 0 || (await this.hasPendingDropdown()) ? timeout || WAIT_MS : 0;
    if (waitMs === 0) {
      return undefined;
    }
    let found: WebdriverIO.Element | undefined;
    await driver
      .waitUntil(async () => Boolean((found = await find())), { timeout: waitMs, interval: 300 })
      .catch(() => undefined);
    return found;
  }

  /** A dropdown is shown but still has no value, even when its options are not loaded yet. */
  private async hasPendingDropdown(): Promise<boolean> {
    for (const select of await this.locator.tradeUpDeviceOptions.getElements()) {
      const pending = await driver.execute((el) => {
        const node = el as HTMLSelectElement;
        if (node.closest('.menu')?.classList.contains('selected')) {
          return false;
        }
        return !node.options[node.selectedIndex]?.value;
      }, select).catch(() => false);
      if (pending) {
        return true;
      }
    }
    return false;
  }

  /** First enabled radio of each shown group that has no answer yet. A pick can reveal the next group. */
  private async selectFirstRadios(): Promise<void> {
    for (let pass = 1; pass <= 5; pass++) {
      const groups = await this.locator.tradeUpRadioGroups.getElements();
      if (groups.length === 0) {
        return;
      }
      let picked = false;
      console.warn(`[PD.TRADEUP.selectFirstRadios] pass ${pass}: ${groups.length} group(s)`);
      for (const group of groups) {
        const radios = [...(await group.$$('input[type="radio"]'))];
        if (radios.length === 0 || (await isAnySelected(radios))) {
          continue;
        }
        const [option] = await getEnabledElements(radios);
        if (!option) {
          console.warn('[PD.TRADEUP.selectFirstRadios]   every option disabled, skipped');
          continue;
        }
        const value = (await option.getAttribute('value').catch(() => '')) || (await option.getAttribute('id').catch(() => '')) || '-';
        await jsClick(option);
        console.warn(`[PD.TRADEUP.selectFirstRadios]   option "${value}" clicked`);
        picked = true;
        await driver.pause(500);
      }
      if (!picked) {
        return;
      }
    }
  }

  private async selectConditionYes(): Promise<void> {
    if(await clickIfDisplayed(this.locator.tradeUpConditionYes)){
      console.warn('[PD.TRADEUP.selectConditionYes] accept condition yes found and clicked');
    }
  }

  private async checkAllTermsAndConditions(): Promise<void> {
    const checkboxes = await this.locator.tradeUpTermsCheckboxes;
    for (const checkbox of checkboxes) {
      if (await checkbox.isSelected().catch(() => false)) {
        continue;
      }
      await scrollAndJsClick(checkbox);
    }
  }

  async verifyServiceApplied(): Promise<void> {
    await assertElementDisplayed(
      this.locator.tradeUpRemoveButton,
      'Trade-Up not applied on PD'
    );
  }
}
