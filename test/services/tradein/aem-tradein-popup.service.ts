import { AemTradeInPopupLocator, TRADE_IN_STEPS, TradeInStep } from '../../locators/aem-tradein-popup.locator';
import {
  clickIfDisplayed,
  getEnabledElements,
  getInputValue,
  isAnySelected,
  isDisplayedOrFalse,
  jsClick,
  scrollAndWdioClick,
  setInputValue,
  waitForDisplayedOrFalse,
} from '../../helpers/element.helper';
import { Key } from 'webdriverio';
import { getRunConfig } from '../../../config/run.config';
import type { Site } from '../../../config/site';

export type TradeInInput = NonNullable<Site['tradeIn']>;

const OPEN_TIMEOUT_MS = 10000;
const CLOSE_TIMEOUT_MS = 15000;
const WAIT_MS = 10000;
const STEP_LEAVE_TIMEOUT_MS = 8000;
/** Server-side checks (IMEI, pincode) have no fixed duration. */
const VALIDATE_TIMEOUT_MS = 30000;
/** An error still shown this long after submit, with no spinner seen, is taken as the new result. */
const IMEI_STALE_ERROR_MS = 2000;
const MAX_STEPS = 10;
const MAX_CONDITION_PASSES = 5;
const FILL_ATTEMPTS = 3;
const FILL_SETTLE_MS = 1500;
/**
 * Index of the "good" answer per condition question, for sites whose answers have no accept_data="yes".
 * Assumes each question is one radio/checkbox group (same name); null = leave that question as is.
 */
const CONDITION_ANSWERS: Record<string, (question: number) => number | null> = {
  JP: () => 1,
  NZ: () => 1,
  SG: () => 1,
  TH: (q) => (q === 0 ? 0 : 1),
  PH: (q) => (q === 0 ? 1 : 0),
  AE: (q) => (q === 0 ? 0 : null),
  AE_AR: (q) => (q === 0 ? 0 : null),
  UK: (q) => (q === 0 ? 0 : null),
  IN: (q) => [0, 1, 1, 1, 0, 0][q] ?? 0,
};

interface ActiveStep {
  step: TradeInStep | null;
  element: WebdriverIO.Element;
}

const log = (message: string): void => console.warn(`[TradeIn] ${message}`);

/** Trade-In popup shared by BC/PD: runs whichever step is shown until the popup closes. */
export class AemTradeInPopupService {
  private readonly locator = new AemTradeInPopupLocator();
  /** The shown popup root, set on open; other matching roots on the page may be hidden. */
  private root: WebdriverIO.Element | undefined;

  async isPopupOpen(): Promise<boolean> {
    return this.root ? this.root.isDisplayed().catch(() => false) : false;
  }

  private get popupRoot(): WebdriverIO.Element {
    if (!this.root) {
      throw new Error('[TradeIn] popup root not set; call popupProcess first');
    }
    return this.root;
  }

  private async waitForOpen(): Promise<boolean> {
    this.root = undefined;
    await driver
      .waitUntil(
        async () => {
          for (const el of await $$(this.locator.popupRoots).getElements()) {
            if (await el.isDisplayed().catch(() => false)) {
              this.root = el;
              return true;
            }
          }
          return false;
        },
        { timeout: OPEN_TIMEOUT_MS, interval: 300 }
      )
      .catch(() => undefined);
    return Boolean(this.root);
  }

  private async waitForClose(): Promise<void> {
    const closed = await driver
      .waitUntil(async () => !(await this.isPopupOpen()), { timeout: CLOSE_TIMEOUT_MS, interval: 300 })
      .catch(() => false);
    if (!closed) {
      throw new Error(`[TradeIn] popup still open ${CLOSE_TIMEOUT_MS}ms after the last action`);
    }
    log('popup closed');
  }

  async popupProcess(input: TradeInInput = {}): Promise<void> {
    if (!(await this.waitForOpen())) {
      throw new Error('[TradeIn] popup did not open');
    }
    const isUs = await this.popupRoot.$(this.locator.usHeader).isExisting().catch(() => false);
    log(`popup opened (${isUs ? 'US single screen' : 'step popup'}), devices: ${this.deviceValues(input).join(' > ') || '-'}`);
    if (isUs) {
      await this.processUsFlow(input);
    } else {
      await this.processStepFlow(input);
    }
    log('done');
  }

  // ---- Step popups ----
  private async processStepFlow(input: TradeInInput): Promise<void> {
    let previousStep: TradeInStep | null = null;
    let retried = false;
    for (let attempt = 1; attempt <= MAX_STEPS; attempt++) {
      const active = await this.waitForActiveStep();
      if (!active) {
        if (!(await this.isPopupOpen())) {
          log('popup closed');
          return;
        }
        throw new Error('[TradeIn] popup open but no step shown');
      }
      if (!active.step) {
        throw new Error(`[TradeIn] unknown step ${await this.describe(active.element)} — add it to TRADE_IN_STEPS`);
      }
      // A step that did not advance is retried once.
      const sameStep = active.step === previousStep;
      if (sameStep && retried) {
        throw new Error(`[TradeIn] stuck on step "${active.step}" ${await this.describe(active.element)}`);
      }
      retried = sameStep;
      previousStep = active.step;

      log(`step ${attempt}: ${active.step}${sameStep ? ' (retry)' : ''}`);
      await this.runStep(active.step, active.element, input);
      if (!(await this.waitForStepLeave(active.step))) {
        log(`step "${active.step}" still shown after ${STEP_LEAVE_TIMEOUT_MS}ms`);
      }
    }
    throw new Error(`[TradeIn] popup still open after ${MAX_STEPS} steps`);
  }

  private async runStep(step: TradeInStep, stepEl: WebdriverIO.Element, input: TradeInInput): Promise<void> {
    switch (step) {
      case 'intro':
      case 'discount':
        break;
      case 'customer':
      case 'choose':
        await this.selectFirstOptionIfNoneChecked(stepEl);
        break;
      case 'select-device': {
        await this.enterPincodeIfShown(stepEl, input.zipCode);
        const skipped = await this.selectDevice(stepEl, input);
        // Some sites (e.g. IN) ask for the IMEI in this step once the device is picked.
        if (await waitForDisplayedOrFalse(stepEl.$(this.locator.imeiInput), { timeout: 2000 })) {
          await this.enterImei(stepEl, input.imei, this.locator.imeiInput, [stepEl.$(this.locator.nextButton)]);
        }
        // Some sites (e.g. NZ) put required confirm checkboxes under the device list.
        await this.checkAllTerms(stepEl);
        const note = skipped.length ? ` (options not found: ${skipped.join(', ')})` : '';
        await this.clickRequired(stepEl.$(this.locator.nextButton), `select-device: next${note}`);
        return;
      }
      case 'enter-imei':
        // Terms first: Next stays disabled until both terms and IMEI are done, and enterImei waits for it.
        await this.checkAllTerms(stepEl);
        // The only text field in this step is the IMEI.
        await this.enterImei(stepEl, input.imei, this.locator.textInput, [stepEl.$(this.locator.nextButton)]);
        break;
      case 'check-condition':
        await this.answerConditions(stepEl);
        await this.checkAllTerms(stepEl);
        break;
      case 'apply-discount':
        await this.checkAllTerms(stepEl);
        if (await isDisplayedOrFalse(stepEl.$(this.locator.imeiInput))) {
          await this.enterImei(stepEl, input.imei, this.locator.imeiInput, [
            stepEl.$(this.locator.applyButton),
            this.popupRoot.$(this.locator.footerApplyButton),
          ]);
        }
        if (await clickIfDisplayed(stepEl.$(this.locator.applyButton), WAIT_MS)) {
          log('apply-discount: click apply');
        } else {
          await this.clickRequired(this.popupRoot.$(this.locator.footerApplyButton), 'apply-discount: footer apply');
        }
        return;
    }
    await this.clickRequired(stepEl.$(this.locator.nextButton), `${step}: next`);
  }

  private async readActiveStep(): Promise<ActiveStep | null> {
    const element = await this.popupRoot.$(this.locator.activeStep).getElement();
    if (!(await element.isDisplayed().catch(() => false))) {
      return null;
    }
    const step = (await driver
      .execute(
        (node, entries) => {
          const el = node as unknown as HTMLElement;
          const hit = (entries as [string, string][]).find(([, selector]) => el.matches(selector));
          return hit ? hit[0] : null;
        },
        element,
        TRADE_IN_STEPS
      )
      .catch(() => null)) as TradeInStep | null;

    return { step, element };
  }

  /** class/id of a step element, for error messages. */
  private async describe(element: WebdriverIO.Element): Promise<string> {
    const cls = (await element.getAttribute('class').catch(() => '')) ?? '';
    const id = (await element.getAttribute('id').catch(() => '')) ?? '';
    return `(class="${cls}" id="${id}")`;
  }

  /** null when no step shows within the wait (popup closing or closed). */
  private async waitForActiveStep(): Promise<ActiveStep | null> {
    let active: ActiveStep | null = null;
    await driver
      .waitUntil(
        async () => {
          active = await this.readActiveStep();
          return active !== null || !(await this.isPopupOpen());
        },
        { timeout: WAIT_MS, interval: 300 }
      )
      .catch(() => undefined);
    return active;
  }

  /** false when the same step is still shown after the timeout. */
  private async waitForStepLeave(step: TradeInStep): Promise<boolean> {
    return driver
      .waitUntil(async () => !(await this.isPopupOpen()) || (await this.readActiveStep())?.step !== step, {
        timeout: STEP_LEAVE_TIMEOUT_MS,
        interval: 300,
      })
      .then(() => true)
      .catch(() => false);
  }

  // ---- Step actions ----
  private async selectFirstOptionIfNoneChecked(stepEl: WebdriverIO.Element): Promise<void> {
    const [first] = await this.shownQuestions(stepEl);
    if (!first) {
      log('  no option shown');
      return;
    }
    if (await isAnySelected(first)) {
      log('  option already selected');
      return;
    }
    const [option] = await getEnabledElements(first);
    if (option) {
      await this.choose(option, 'option');
    } else {
      log('  every option disabled');
    }
  }

  /** Some sites (e.g. IN, ID) show the device list only after a pincode/zip is accepted; Enter triggers the check. */
  private async enterPincodeIfShown(stepEl: WebdriverIO.Element, zipCode: string | undefined): Promise<void> {
    const field = stepEl.$(this.locator.pincodeInput);
    if (!(await isDisplayedOrFalse(field))) {
      return;
    }
    if (!zipCode) {
      throw new Error('[TradeIn] pincode field shown but site data has no tradeIn.zipCode');
    }
    await this.fillField(stepEl, this.locator.pincodeInput, zipCode, 'pincode');
    await field.addValue(Key.Enter);

    const started = Date.now();
    if (!(await waitForDisplayedOrFalse(stepEl.$(this.locator.pincodeSuccess), { timeout: VALIDATE_TIMEOUT_MS }))) {
      throw new Error(`[TradeIn] pincode ${zipCode} not accepted within ${VALIDATE_TIMEOUT_MS}ms`);
    }
    log(`  pincode accepted in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }

  /**
   * Each next list may only render after the previous pick, so every value gets its own wait.
   * Returns the values with no matching option, so a later Next failure can name them.
   */
  private async selectDevice(stepEl: WebdriverIO.Element, input: TradeInInput): Promise<string[]> {
    const skipped: string[] = [];
    for (const value of this.deviceValues(input)) {
      const option = stepEl.$(this.locator.deviceOption(value));
      if (!(await option.waitForExist({ timeout: WAIT_MS }).then(() => true).catch(() => false))) {
        log(`  device "${value}": not in this step, skipped`);
        skipped.push(value);
        continue;
      }
      await this.choose(await option.getElement(), `device "${value}"`);
    }
    return skipped;
  }

  /** proceedButtons: the step's Next/Apply (or footer Apply), enabled only after the IMEI is validated. */
  private async enterImei(
    stepEl: WebdriverIO.Element,
    imei: string | undefined,
    fieldSelector: string,
    proceedButtons: ChainablePromiseElement[]
  ): Promise<void> {
    if (!imei) {
      throw new Error('[TradeIn] IMEI field shown but site data has no tradeIn.imei');
    }
    await stepEl.$(fieldSelector).waitForDisplayed({ timeout: WAIT_MS });
    await this.fillField(stepEl, fieldSelector, imei, 'IMEI');
    const checked = await clickIfDisplayed(stepEl.$(this.locator.imeiCheckButton), 2000);
    log(`  IMEI ${checked ? 'check clicked, ' : ''}validating...`);
    await this.waitForImeiValidated(stepEl, proceedButtons);
  }

  /**
   * Validation is a server round-trip with no fixed duration, so wait for a result rather than a fixed time.
   * An error left over from a previous attempt is ignored until the spinner shows or IMEI_STALE_ERROR_MS passes.
   */
  private async waitForImeiValidated(stepEl: WebdriverIO.Element, proceedButtons: ChainablePromiseElement[]): Promise<void> {
    const started = Date.now();
    let loadingSeen = false;
    let error = '';
    const done = await driver
      .waitUntil(
        async () => {
          for (const button of proceedButtons) {
            if (await isDisplayedOrFalse(button)) {
              return true;
            }
          }
          if (await isDisplayedOrFalse(stepEl.$(this.locator.imeiLoading))) {
            loadingSeen = true;
            return false;
          }
          const errorEl = stepEl.$(this.locator.imeiError);
          if ((loadingSeen || Date.now() - started > IMEI_STALE_ERROR_MS) && (await isDisplayedOrFalse(errorEl))) {
            error = ((await errorEl.getText().catch(() => '')) ?? '').trim() || 'error shown';
            return true;
          }
          return false;
        },
        { timeout: VALIDATE_TIMEOUT_MS, interval: 500 }
      )
      .catch(() => false);

    const elapsed = `${((Date.now() - started) / 1000).toFixed(1)}s`;
    if (error) {
      throw new Error(`[TradeIn] IMEI rejected after ${elapsed}: "${error}"`);
    }
    if (!done) {
      throw new Error(`[TradeIn] IMEI not validated within ${VALIDATE_TIMEOUT_MS}ms`);
    }
    log(`  IMEI validated in ${elapsed}`);
  }

  /** An answer can reveal follow-up questions (e.g. CA "Yes"), so repeat until no shown question is unanswered. */
  private async answerConditions(stepEl: WebdriverIO.Element): Promise<void> {
    const pickIndex = CONDITION_ANSWERS[getRunConfig().siteCode.toUpperCase()] ?? (() => 0);

    for (let pass = 1; pass <= MAX_CONDITION_PASSES; pass++) {
      let answered = false;
      const questions = await this.shownQuestions(stepEl);
      log(`  condition pass ${pass}: ${questions.length} question(s) shown`);
      for (const [index, answers] of questions.entries()) {
        const question = `Q${index + 1}`;
        const pick = pickIndex(index);
        if (pick === null) {
          log(`  ${question}: left as is (site rule)`);
          continue;
        }
        if (await isAnySelected(answers)) {
          continue;
        }
        // An earlier answer can disable some options; fall back to the first enabled one.
        const enabled = await getEnabledElements(answers);
        if (enabled.length === 0) {
          log(`  ${question}: every answer disabled, skipped`);
          continue;
        }
        const preferred = (await this.findAcceptYes(enabled)) ?? answers[pick];
        const target = preferred && enabled.includes(preferred) ? preferred : enabled[0];
        const fallback = target !== preferred ? ', preferred disabled' : '';
        await this.choose(target, `${question} answer ${answers.indexOf(target) + 1}/${answers.length}${fallback}`);
        answered = true;
      }
      if (!answered) {
        return;
      }
      await driver.pause(500);
    }
  }

  /** Answer groups (by name) whose options are on screen; follow-up questions can sit hidden in the DOM. */
  private async shownQuestions(stepEl: WebdriverIO.Element): Promise<WebdriverIO.Element[][]> {
    const questions = new Map<string, WebdriverIO.Element[]>();
    for (const option of await stepEl.$$(this.locator.answerOptions)) {
      if (!(await this.isOptionShown(option))) {
        continue;
      }
      const name = (await option.getAttribute('name').catch(() => '')) || `#${questions.size}`;
      questions.set(name, [...(questions.get(name) ?? []), option]);
    }
    return [...questions.values()];
  }

  /** Inputs are often visually hidden behind a label, so check the label (or parent) is rendered. */
  private async isOptionShown(option: WebdriverIO.Element): Promise<boolean> {
    return driver
      .execute((node) => {
        const input = node as unknown as HTMLInputElement;
        const target = input.labels?.[0] ?? input.parentElement;
        return Boolean(target && target.getClientRects().length > 0);
      }, option)
      .catch(() => false);
  }

  private async findAcceptYes(answers: WebdriverIO.Element[]): Promise<WebdriverIO.Element | undefined> {
    for (const answer of answers) {
      const accept =
        (await answer.getAttribute('accept_data').catch(() => null)) ??
        (await answer.getAttribute('accept-data').catch(() => null));
      if (accept === 'yes') {
        return answer;
      }
    }
    return undefined;
  }

  private async checkAllTerms(stepEl: WebdriverIO.Element): Promise<void> {
    const checkboxes = [...(await stepEl.$$(this.locator.termsCheckboxes))];
    for (const [index, checkbox] of checkboxes.entries()) {
      if (!(await checkbox.isSelected().catch(() => false))) {
        await this.choose(checkbox, `terms ${index + 1}/${checkboxes.length}`);
      }
    }
  }

  // ---- US (single screen; each pick adds the next field below) ----
  private async processUsFlow(input: TradeInInput): Promise<void> {
    await this.clickRequired(this.locator.usGoodConditionOption, 'US: good condition');

    // The site keeps the previous trade-in (any value), and Agree stays disabled until each field is picked again,
    // so every dropdown is opened by position and its option picked, whatever it shows now.
    for (const [index, value] of this.deviceValues(input).entries()) {
      const dropdown = await this.waitForUsDropdown(index);
      if (!dropdown) {
        throw new Error(`[TradeIn] US: dropdown ${index + 1} for "${value}" not shown`);
      }
      
      await scrollAndWdioClick(dropdown);
      log(`  US: dropdown ${index + 1} opened`);
      await this.clickRequired(this.locator.usDropdownOption(value), `US: option "${value}"`);
    }

    await this.clickRequired(this.locator.usAgreeButton, 'US: Yes, I Agree');
    await this.waitForClose();
  }

  /** The n-th dropdown; each pick renders the next one. */
  private async waitForUsDropdown(index: number): Promise<WebdriverIO.Element | undefined> {
    let shown: WebdriverIO.Element | undefined;
    await driver
      .waitUntil(
        async () => {
          const dropdown = (await $$(this.locator.usDropdowns).getElements())[index];
          if (dropdown && (await dropdown.isDisplayed().catch(() => false))) {
            shown = dropdown;
          }
          return Boolean(shown);
        },
        { timeout: WAIT_MS, interval: 300 }
      )
      .catch(() => undefined);
    return shown;
  }

  // ---- Shared ----
  /** Device values in pick order; empty ones are skipped. */
  private deviceValues(input: TradeInInput): string[] {
    return [
      input.category,
      input.brand,
      input.model,
      input.subseries,
      input.device,
      input.storage,
      input.color,
      input.screenSize,
      input.purchaseFrom,
    ].filter((v): v is string => Boolean(v?.trim()));
  }

  /**
   * Native radio/checkbox: HTMLElement.click() toggles it and fires change without a hit-test,
   * so a styled label or overlapping area can't swallow the tap.
   */
  private async choose(el: WebdriverIO.Element, label: string): Promise<void> {
    log(`  ${label}: "${await this.readOptionText(el)}"`);
    const tag = ((await el.getTagName().catch(() => '')) ?? '').toLowerCase();
    if (tag !== 'input') {
      await scrollAndWdioClick(el);
      return;
    }
    await jsClick(el);
    await driver.pause(500);
    if (!(await el.isSelected().catch(() => false))) {
      throw new Error(`[TradeIn] input not selected after click ${await this.describe(el)}`);
    }
  }

  /** Label text (or value / an-la) of the option, cut short for logs. */
  private async readOptionText(el: WebdriverIO.Element): Promise<string> {
    return driver
      .execute((node) => {
        const target = node as unknown as HTMLInputElement;
        const text = (target.labels?.[0] ?? target).textContent?.replace(/\s+/g, ' ').trim();
        return (text || target.value || target.getAttribute('an-la') || '').slice(0, 60);
      }, el)
      .catch(() => '');
  }

  /**
   * The page can fill the field on its own shortly after the popup opens (e.g. a saved/located pincode),
   * possibly after we typed, so re-check after a settle pause and retype if it was overwritten.
   */
  private async fillField(stepEl: WebdriverIO.Element, selector: string, value: string, label: string): Promise<void> {
    const field = stepEl.$(selector);
    let entered = '';
    for (let attempt = 1; attempt <= FILL_ATTEMPTS; attempt++) {
      const before = (await getInputValue(field)).trim();
      if (before && before !== value) {
        log(`  ${label}: replacing "${before}"`);
      }
      entered = await setInputValue(field, value);
      await driver.pause(FILL_SETTLE_MS);
      const settled = await getInputValue(field);
      if (entered === value && settled === value) {
        log(`  ${label} entered: ${value}`);
        return;
      }
      entered = settled;
      log(`  ${label}: field shows "${settled}" after typing${attempt < FILL_ATTEMPTS ? ', retype' : ''}`);
    }
    log(`  ${label}: could not keep "${value}" (last "${entered}"); same-selector inputs on the page:`);
    for (const line of await this.describeInputs(stepEl, selector)) {
      log(`    ${line}`);
    }
    throw new Error(`[TradeIn] ${label}: could not enter "${value}"`);
  }

  /** Every input matching the selector in the whole page, to spot a duplicate field outside the step. */
  private async describeInputs(stepEl: WebdriverIO.Element, selector: string): Promise<string[]> {
    return driver
      .execute(
        (stepNode, sel) => {
          const step = stepNode as unknown as HTMLElement;
          const active = document.activeElement as HTMLElement | null;
          return Array.from(document.querySelectorAll<HTMLInputElement>(sel)).map(
            (input, i) =>
              `#${i} id="${input.id}" value="${input.value}" shown=${input.getClientRects().length > 0} ` +
              `inStep=${step.contains(input)} focused=${input === active}`
          );
        },
        stepEl,
        selector
      )
      .catch((err: Error) => [`describe failed: ${err.message}`]);
  }

  private async clickRequired(el: ChainablePromiseElement, label: string): Promise<void> {
    if (!(await clickIfDisplayed(el, WAIT_MS))) {
      throw new Error(`[TradeIn] ${label} not clickable`);
    }
    log(`  click ${label}`);
  }
}
