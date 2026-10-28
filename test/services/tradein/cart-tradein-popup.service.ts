import type { Site } from '../../../config/site';
import { getRunConfig } from '../../../config/run.config';
import { CartTradeInPopupLocator } from '../../locators/cart-tradein-popup.locator';
import {
  clickIfDisplayed,
  getEnabledElements,
  getInputValue,
  isDisplayedOrFalse,
  jsClick,
  scrollAndWdioClick,
  setInputValue,
  waitForDisplayedOrFalse,
} from '../../helpers/element.helper';
import { scrollElementToCenter } from '../../helpers/gesture.helper';
import { Key } from 'webdriverio';

export type CartTradeInInput = NonNullable<Site['tradeIn']>;

/** Cart footer-button step. Names follow the AEM popup where the screen is the same. */
type CartTradeInStep = 'intro' | 'select-device' | 'check-condition' | 'enter-imei' | 'apply-discount';

const WAIT_MS = 10000;
/** Device list open, option click, and value apply. A missing list should not sit for WAIT_MS. */
const LIST_MS = 2000;
const STEP_LEAVE_MS = 8000;
const VALIDATE_MS = 30000;
/** An error still shown this long after submit, with no success seen, is taken as the new result. */
const IMEI_STALE_ERROR_MS = 2000;
const MAX_STEPS = 10;
const MAX_CONDITION_PASSES = 5;
const FILL_ATTEMPTS = 3;
const FILL_SETTLE_MS = 1500;
/**
 * Index of the "good" answer per condition question, for sites whose answers have no accept_data="yes".
 * Same table as the AEM popup. null = leave that question as is.
 */
const CONDITION_ANSWERS: Record<string, (question: number) => number | null> = {
  JP: () => 1,
  NZ: () => 1,
  SG: () => 1,
  TH: (q) => (q === 0 ? 0 : 1),
  PH: (q) => (q < 8 ? 0 : 1),
  AE: (q) => (q === 0 ? 0 : null),
  AE_AR: (q) => (q === 0 ? 0 : null),
  UK: (q) => (q === 0 ? 0 : null),
  IN: (q) => [0, 1, 1, 1, 0, 0][q] ?? 0,
  VN: (q) => (q === 0 ? 0 : 1),
};

/** Middle token of the footer primary button `data-an-la`. Add a row when a new step appears. */
const STEP_BY_LABEL: Record<string, CartTradeInStep> = {
  'trade-in guide': 'intro',
  'select device': 'select-device',
  'enter imei': 'enter-imei',
  'check device condition': 'check-condition',
  'apply discount': 'apply-discount',
};
const log = (message: string): void => console.warn(`[Cart.TRADEIN] ${message}`);

/** Hybris cart trade-in popup. Runs whichever step is mounted until the popup closes. */
export class CartTradeInPopupService {
  private readonly locator = new CartTradeInPopupLocator();

  async popupProcess(input: CartTradeInInput = {}): Promise<void> {
    if (!(await this.waitForOpen())) {
      throw new Error('[Cart.TRADEIN] popup did not open');
    }
    log(`popup opened, devices: ${this.deviceValues(input).join(' > ') || '-'}`);
    await this.processStepFlow(input);
    log('done');
  }

  private async processStepFlow(input: CartTradeInInput): Promise<void> {
    let previous: CartTradeInStep | null = null;
    let retried = false;
    for (let attempt = 1; attempt <= MAX_STEPS; attempt++) {
      const active = await this.waitForActiveStep();
      if (!active) {
        if (!(await this.isPopupOpen())) {
          log('popup closed');
          return;
        }
        throw new Error('[Cart.TRADEIN] popup open but no step shown');
      }
      if (active === 'unknown') {
        throw new Error(`[Cart.TRADEIN] unknown step "${(await this.readStepLabel()) || '-'}" — add it to STEP_BY_LABEL`);
      }
      const sameStep = active === previous;
      if (sameStep && retried) {
        throw new Error(`[Cart.TRADEIN] stuck on step "${active}"`);
      }
      retried = sameStep;
      previous = active;
      log(`step ${attempt}: ${active}${sameStep ? ' (retry)' : ''}`);
      await this.runStep(active, input);
      if (!(await this.waitForStepLeave(active))) {
        log(`step "${active}" still shown after ${STEP_LEAVE_MS}ms`);
      }
    }
    if (await this.isPopupOpen()) {
      throw new Error(`[Cart.TRADEIN] popup still open after ${MAX_STEPS} steps`);
    }
  }

  private async runStep(step: CartTradeInStep, input: CartTradeInInput): Promise<void> {
    switch (step) {
      case 'intro':
        await this.selectPaymentOption();
        break;
      case 'select-device': {
        await this.fillPostalCode(input.zipCode);
        const skipped = await this.selectDevice(input);
        await this.enterImeiIfShown(input.imei, 2000);
        await this.checkAllTerms();
        const note = skipped.length ? ` (options not found: ${skipped.join(', ')})` : '';
        await this.selectContinueButton(`select-device: next${note}`);
        return;
      }
      case 'enter-imei':
        await this.checkAllTerms();
        await this.enterImeiIfShown(input.imei, WAIT_MS, true);
        await this.checkAllTerms();
        break;
      case 'check-condition':
        await this.answerConditions();
        await this.checkAllTerms();
        break;
      case 'apply-discount':
        await this.checkAllTerms();
        await this.enterImeiIfShown(input.imei, 0);
        break;
    }
    await this.selectContinueButton(`${step}: next`);
  }

  /** Live DOM read. isDisplayed stays true on a closed modal and is slow after the cart refreshes. */
  private async isPopupOpen(): Promise<boolean> {
    return driver.execute((popup) => {
      const root = document.querySelector(popup as string);
      if (!(root instanceof HTMLElement)) {
        return false;
      }
      const style = getComputedStyle(root);
      return style.display !== 'none' && style.visibility !== 'hidden' && root.getClientRects().length > 0;
    }, this.locator.popup).catch(() => false);
  }

  private async waitForOpen(timeout = WAIT_MS): Promise<boolean> {
    return driver.waitUntil(() => this.isPopupOpen(), { timeout, interval: 300 }).then(() => true).catch(() => false);
  }

  /** null when no step shows within the wait (popup closing or closed). */
  private async waitForActiveStep(): Promise<CartTradeInStep | 'unknown' | null> {
    let active: CartTradeInStep | 'unknown' | null = null;
    await driver
      .waitUntil(
        async () => {
          active = await this.currentActiveStep();
          return active !== null || !(await this.isPopupOpen());
        },
        { timeout: WAIT_MS, interval: 300 }
      )
      .catch(() => undefined);
    return active;
  }

  /** The shown step. Footer primary `data-an-la` first; the close button only when that value is empty. */
  private async currentActiveStep(): Promise<CartTradeInStep | 'unknown' | null> {
    const label = await this.readStepLabel();
    if (!label) {
      return null;
    }
    return STEP_BY_LABEL[label] ?? 'unknown';
  }

  /** Middle token, lowercased. Empty when the popup is closed or neither button has a step token. */
  private async readStepLabel(): Promise<string> {
    return driver
      .execute((stepButton, stepCloseButton) => {
        const labelOf = (selector: string): string => {
          const button = document.querySelector(selector);
          const root = button?.closest('.modal');
          if (!(button instanceof HTMLElement) || !(root instanceof HTMLElement)) {
            return '';
          }
          const style = getComputedStyle(root);
          if (style.display === 'none' || style.visibility === 'hidden' || root.getClientRects().length === 0) {
            return '';
          }
          const anLa = button.getAttribute('data-an-la') ?? '';
          return (anLa.split(':')[1] ?? '').trim().toLowerCase();
        };
        return labelOf(stepButton as string) || labelOf(stepCloseButton as string);
      }, this.locator.stepButton, this.locator.stepCloseButton)
      .catch(() => '');
  }

  private async waitForStepLeave(step: CartTradeInStep): Promise<boolean> {
    return driver
      .waitUntil(async () => !(await this.isPopupOpen()) || (await this.currentActiveStep()) !== step, {
        timeout: STEP_LEAVE_MS,
        interval: 300,
      })
      .then(() => true)
      .catch(() => false);
  }

  private deviceValues(input: CartTradeInInput): string[] {
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
    ].filter((value): value is string => Boolean(value?.trim()));
  }

  private async fillPostalCode(zipCode?: string): Promise<void> {
    const input = this.locator.postalInput;
    if (!(await isDisplayedOrFalse(input))) {
      return;
    }
    if (await isDisplayedOrFalse(this.locator.postalSuccess)) {
      log('  postal code already accepted');
      return;
    }
    if (!zipCode) {
      throw new Error('[Cart.TRADEIN] postal code shown but site data has no tradeIn.zipCode');
    }
    await this.fillField(input, zipCode, 'postal code');
    const check = this.locator.postalCheckButton;
    if (await clickIfDisplayed(check)) {
      log('  postal code check clicked');
    } else {
      await input.addValue(Key.Enter);
    }
    let error = '';
    const accepted = await driver
      .waitUntil(
        async () => {
          if (await isDisplayedOrFalse(this.locator.postalSuccess)) {
            return true;
          }
          if (!(await isDisplayedOrFalse(check)) || (await check.getAttribute('disabled').catch(() => null)) !== null) {
            return true;
          }
          const errorEl = this.locator.postalError;
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
      throw new Error(`[Cart.TRADEIN] postal code rejected: "${error}"`);
    }
    if (!accepted) {
      throw new Error(`[Cart.TRADEIN] postal code not accepted within ${VALIDATE_MS}ms`);
    }
    log('  postal code accepted');
  }

  /** Each site value: a matching category, or an option in an open device list. A missing option is skipped. */
  private async selectDevice(input: CartTradeInInput): Promise<string[]> {
    const skipped: string[] = [];
    for (const value of this.deviceValues(input)) {
      if ((await this.clickCategory(value)) || (await this.chooseListedDevice(value))) {
        continue;
      }
      log(`  device "${value}": not in this step, skipped`);
      skipped.push(value);
    }
    return skipped;
  }

  /** Clicks the option when its list is already open. Otherwise opens the next closed device list and waits for it. */
  private async chooseListedDevice(value: string): Promise<boolean> {
    if (await this.clickDeviceOption(value)) {
      await this.waitUntilDeviceValueShown(value);
      return true;
    }
    if (!(await this.openNextDeviceList())) {
      return false;
    }
    const picked = await driver
      .waitUntil(() => this.clickDeviceOption(value), { timeout: LIST_MS, interval: 200 })
      .catch(() => false);
    if (picked) {
      await this.waitUntilDeviceValueShown(value);
    }
    return picked;
  }

  /** Returns once the field shows the value. A still-open overlay is closed so the next select can be clicked. */
  private async waitUntilDeviceValueShown(value: string): Promise<void> {
    const needle = value.trim().toLowerCase();
    const shown = await driver
      .waitUntil(
        () =>
          driver.execute((wanted) => {
            const text = (node: Element | null): string => (node?.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
            const selectShows = [...document.querySelectorAll('.show mat-select')].some((select) => {
              if (select.querySelector('.mat-mdc-select-placeholder')) {
                return false;
              }
              return text(select.querySelector('.mat-mdc-select-value')).includes(wanted as string);
            });
            const inputShows = [...document.querySelectorAll('.show input.mat-mdc-autocomplete-trigger, .show input[role="combobox"]')].some(
              (input) => input instanceof HTMLInputElement && input.value.toLowerCase().includes(wanted as string)
            );
            const panelShows = [...document.querySelectorAll('.show mat-panel-title')].some((title) => text(title).includes(wanted as string));
            return selectShows || inputShows || panelShows;
          }, needle),
        { timeout: LIST_MS, interval: 150 }
      )
      .then(() => true)
      .catch(() => false);
    if (!shown) {
      return;
    }
    const backdrop = $('.cdk-overlay-backdrop');
    if (await backdrop.isDisplayed().catch(() => false)) {
      await backdrop.click().catch(() => undefined);
    }
  }

  /** Visible option whose text or `data-an-la` contains the site value. */
  private async clickDeviceOption(value: string): Promise<boolean> {
    const marked = await driver
      .execute((wanted) => {
        document.querySelectorAll('[data-tradein-pick]').forEach((node) => node.removeAttribute('data-tradein-pick'));
        const needle = (wanted as string).toLowerCase();
        const option = [...document.querySelectorAll('mat-option, [role="option"], .trade-in__dropdown-option, .trade-up__dropdown-option')].find((node) => {
          if (!(node instanceof HTMLElement) || node.getAttribute('aria-disabled') === 'true' || node.getClientRects().length === 0) {
            return false;
          }
          const text = `${node.getAttribute('data-an-la') ?? ''} ${node.textContent ?? ''}`.replace(/\s+/g, ' ').trim().toLowerCase();
          return text.includes(needle);
        });
        if (!(option instanceof HTMLElement)) {
          return '';
        }
        option.setAttribute('data-tradein-pick', '1');
        return (option.getAttribute('data-an-la') || option.textContent || '').replace(/\s+/g, ' ').trim();
      }, value)
      .catch(() => '');
    if (!marked) {
      return false;
    }
    await scrollAndWdioClick($('[data-tradein-pick="1"]'));
    log(`  device "${value}": "${marked}"`);
    return true;
  }

  /** Open when a combobox list or an expansion panel is expanded. Focus alone does not count. */
  private async isDeviceListOpen(): Promise<boolean> {
    return driver
      .execute(() => {
        const shown = (node: Element | null): boolean => node instanceof HTMLElement && node.getClientRects().length > 0;
        return (
          shown(document.querySelector('.show [role="combobox"][aria-expanded="true"]')) ||
          shown(document.querySelector('.show mat-expansion-panel.mat-expanded')) ||
          shown(document.querySelector('.cdk-overlay-container mat-option, .cdk-overlay-container [role="option"]'))
        );
      })
      .catch(() => false);
  }

  /**
   * Clicks the next closed device field under `.show`.
   * CN is an empty `mat-select.modal__select`. The next one stays in `li.hide-inactive` until the previous value is shown.
   * IN is an empty autocomplete input. A focused field stays closed until `aria-expanded` becomes true.
   */
  private async openNextDeviceList(): Promise<boolean> {
    const deadline = Date.now() + LIST_MS;
    let marked = false;
    while (Date.now() < deadline) {
      marked = await this.markNextClosedDeviceList();
      if (!marked) {
        await driver.pause(200);
        continue;
      }
      await scrollAndWdioClick($('[data-tradein-open]'));
      const opened = await driver
        .waitUntil(() => this.isDeviceListOpen(), { timeout: 700, interval: 100 })
        .then(() => true)
        .catch(() => false);
      if (opened) {
        log('  device list opened');
        return true;
      }
    }
    log(marked ? '  device list did not open' : '  device list: no closed list');
    return false;
  }

  /** Marks the next empty device field. A select that already shows a value is left closed. */
  private async markNextClosedDeviceList(): Promise<boolean> {
    return driver
      .execute(() => {
        document.querySelectorAll('[data-tradein-open]').forEach((node) => node.removeAttribute('data-tradein-open'));
        const shown = (node: Element | null): node is HTMLElement =>
          node instanceof HTMLElement && node.getClientRects().length > 0;
        const blocked = (node: Element): boolean =>
          Boolean(node.closest('.hide-inactive') || node.closest('.mat-form-field-disabled'));
        const mark = (node: HTMLElement): boolean => {
          node.style.pointerEvents = 'auto';
          node.setAttribute('data-tradein-open', '1');
          return true;
        };
        for (const select of document.querySelectorAll('.show mat-select.modal__select')) {
          if (!shown(select) || blocked(select) || select.getAttribute('aria-disabled') === 'true' || select.getAttribute('aria-expanded') === 'true') {
            continue;
          }
          const chosen = (select.querySelector('.mat-mdc-select-value-text')?.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (chosen || !select.classList.contains('mat-mdc-select-empty')) {
            continue;
          }
          const trigger = select.querySelector('.mat-mdc-select-trigger');
          return mark(shown(trigger) ? trigger : select);
        }
        for (const combo of document.querySelectorAll('.show input.mat-mdc-autocomplete-trigger, .show input[role="combobox"]')) {
          if (!(combo instanceof HTMLInputElement) || combo.disabled || combo.getAttribute('aria-expanded') === 'true' || combo.value.trim()) {
            continue;
          }
          const row = combo.closest('li.hide-inactive');
          if (row instanceof HTMLElement && !shown(combo)) {
            row.classList.remove('hide-inactive');
          }
          if (shown(combo)) {
            return mark(combo);
          }
        }
        const text = (node: Element | null): string => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
        for (const panel of document.querySelectorAll('.show mat-expansion-panel')) {
          if (!(panel instanceof HTMLElement) || panel.classList.contains('mat-expanded') || !shown(panel) || blocked(panel)) {
            continue;
          }
          const search = panel.querySelector('input.trade-in__search');
          const title = `${text(panel.querySelector('mat-panel-title'))} ${search instanceof HTMLInputElement ? search.value.trim() : ''}`.trim();
          const picked = [...panel.querySelectorAll('.option-brand')].some((brand) => title.includes(text(brand)));
          if (title && picked) {
            continue;
          }
          const header = panel.querySelector('mat-expansion-panel-header');
          return mark(shown(header) ? header : panel);
        }
        return false;
      })
      .catch(() => false);
  }

  /** A checked category whose label or `data-an-la` already contains the site value is left as is. */
  private async clickCategory(value: string): Promise<boolean> {
    const wanted = value.trim().toLowerCase();
    for (const radio of await this.locator.categoryRadios.getElements()) {
      const text = await this.optionText(radio.$('.box__label'));
      const anLa = ((await radio.getAttribute('data-an-la').catch(() => '')) ?? '').toLowerCase();
      if (!text.toLowerCase().includes(wanted) && !anLa.includes(wanted)) {
        continue;
      }
      const shown = text || anLa;
      const className = (await radio.getAttribute('class').catch(() => '')) ?? '';
      if (className.includes('mat-mdc-radio-checked')) {
        log(`  category already selected: "${shown}"`);
        return true;
      }
      await scrollAndWdioClick(radio);
      log(`  category: "${shown}"`);
      return true;
    }
    return false;
  }

  private async selectPaymentOption(): Promise<void> {
    if (await isDisplayedOrFalse(this.locator.continueButton)) {
      log('  process already selected');
      return;
    }
    const firstOption = await this.locator.paymentOption;
    if (!firstOption) {
      log('  no process option shown');
      return;
    }
    const title = await this.optionText(firstOption);
    await scrollAndWdioClick(firstOption);
    log(`  process: "${title || '-'}"`);
  }

  private async optionText(option: ChainablePromiseElement | WebdriverIO.Element): Promise<string> {
    return ((await (option as WebdriverIO.Element).getText().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Same pass as the AEM popup. An answer can reveal the next question, so repeat until nothing new is clicked.
   * prefer accept_data="yes", otherwise the site index, otherwise the first enabled option.
   */
  private async answerConditions(): Promise<void> {
    const pickIndex = CONDITION_ANSWERS[getRunConfig().siteCode.toUpperCase()] ?? (() => 0);
    await this.waitForConditionQuestions();
    for (let pass = 1; pass <= MAX_CONDITION_PASSES; pass++) {
      let answered = false;
      const questions = await this.shownConditionQuestions();
      log(`  condition pass ${pass}: ${questions.length} question(s) shown`);
      for (const [index, answers] of questions.entries()) {
        const question = `Q${index + 1}`;
        const pick = pickIndex(index);
        if (pick === null) {
          log(`  ${question}: left as is (site rule)`);
          continue;
        }
        if (await this.isQuestionChecked(answers)) {
          continue;
        }
        const enabled = await getEnabledElements(answers);
        if (enabled.length === 0) {
          log(`  ${question}: every answer disabled, skipped`);
          continue;
        }
        const preferred = (await this.findAcceptYes(enabled)) ?? answers[pick];
        const target = preferred && enabled.includes(preferred) ? preferred : enabled[0];
        if (!target) {
          continue;
        }
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

  /** The condition step can mount before its three questions are in the DOM. */
  private async waitForConditionQuestions(): Promise<void> {
    await driver
      .waitUntil(async () => (await this.shownConditionQuestions()).length > 0, { timeout: WAIT_MS, interval: 300 })
      .catch(() => undefined);
  }

  /**
   * One `.condition-radio` is one question. CN radios have no shared `name`, so grouping by name
   * turned each option into its own question. Checkbox-only groups are optional and are left out.
   */
  private async shownConditionQuestions(): Promise<WebdriverIO.Element[][]> {
    const questions: WebdriverIO.Element[][] = [];
    for (const group of await this.locator.conditionGroups.getElements()) {
      const shown: WebdriverIO.Element[] = [];
      for (const radio of await group.$$('input[type="radio"]').getElements()) {
        if (await this.isConditionOptionShown(radio)) {
          shown.push(radio);
        }
      }
      if (shown.length > 0) {
        questions.push(shown);
      }
    }
    return questions;
  }

  /** The native input is often hidden behind its label, so the label (or parent) must be on screen. */
  private async isConditionOptionShown(radio: WebdriverIO.Element): Promise<boolean> {
    return driver
      .execute((node) => {
        const input = node as unknown as HTMLInputElement;
        const target = input.labels?.[0] ?? input.parentElement;
        return Boolean(target && target.getClientRects().length > 0);
      }, radio)
      .catch(() => false);
  }

  private async isQuestionChecked(answers: WebdriverIO.Element[]): Promise<boolean> {
    for (const radio of answers) {
      if (await this.isRadioChecked(radio)) {
        return true;
      }
    }
    return false;
  }

  /**
   * AEM reads isSelected(). Hybris CN puts `active` on the label and never checks the input,
   * and Material puts `mat-radio-checked` / `mat-mdc-checkbox-checked` on the host.
   */
  private async isRadioChecked(radio: WebdriverIO.Element): Promise<boolean> {
    if (await radio.isSelected().catch(() => false)) {
      return true;
    }
    return driver
      .execute((node) => {
        const input = node as unknown as HTMLElement;
        const host = input.closest('mat-radio-button, mat-checkbox, label');
        return Boolean(
          host?.classList.contains('active') ||
            host?.classList.contains('mat-mdc-radio-checked') ||
            host?.classList.contains('mat-radio-checked') ||
            host?.classList.contains('mat-mdc-checkbox-checked') ||
            host?.classList.contains('mat-checkbox-checked')
        );
      }, radio)
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

  /** Clicks the input, then its label when Hybris only marks the label. */
  private async choose(el: WebdriverIO.Element, label: string): Promise<void> {
    log(`  ${label}: "${await this.radioLabel(el)}"`);
    const tag = ((await el.getTagName().catch(() => '')) ?? '').toLowerCase();
    if (tag !== 'input') {
      await scrollAndWdioClick(el);
      return;
    }
    await jsClick(el);
    await driver.pause(500);
    if (await this.isRadioChecked(el)) {
      return;
    }
    const id = (await el.getAttribute('id').catch(() => '')) ?? '';
    if (id) {
      const labelEl = $(`${this.locator.popup} label[for="${id}"]`);
      if (await isDisplayedOrFalse(labelEl)) {
        await scrollAndWdioClick(labelEl);
        await driver.pause(300);
      }
    }
    if (!(await this.isRadioChecked(el))) {
      throw new Error(`[Cart.TRADEIN] input not selected after click (${label})`);
    }
  }

  private async radioLabel(radio: WebdriverIO.Element): Promise<string> {
    return driver
      .execute((node) => {
        const input = node as unknown as HTMLInputElement;
        const text = (input.labels?.[0] ?? input).textContent?.replace(/\s+/g, ' ').trim() ?? '';
        return (text || input.value || '').slice(0, 60);
      }, radio)
      .catch(() => '');
  }

  private async enterImeiIfShown(imei: string | undefined, timeout: number, termsFollow = false): Promise<void> {
    const field = this.locator.imeiInput;
    const shown = timeout > 0 ? await waitForDisplayedOrFalse(field, { timeout }) : await isDisplayedOrFalse(field);
    if (!shown) {
      return;
    }
    if (!imei) {
      throw new Error('[Cart.TRADEIN] IMEI field shown but site data has no tradeIn.imei');
    }
    await this.fillField(field, imei, 'IMEI');
    if (await clickIfDisplayed(this.locator.imeiCheckButton, 2000)) {
      log('  IMEI check clicked');
    }
    await this.waitForImeiValidated(termsFollow);
  }

  /** Success hint or an enabled continue ends the wait. An error is ignored until IMEI_STALE_ERROR_MS. */
  private async waitForImeiValidated(termsFollow: boolean): Promise<void> {
    const started = Date.now();
    let error = '';
    const done = await driver
      .waitUntil(
        async () => {
          if (termsFollow && (await this.hasUncheckedTerms())) {
            await this.checkAllTerms().catch(() => undefined);
          }
          if (await isDisplayedOrFalse(this.locator.imeiSuccess)) {
            return true;
          }
          if (await isDisplayedOrFalse(this.locator.continueButton)) {
            return true;
          }
          const errorEl = this.locator.imeiError;
          if (Date.now() - started > IMEI_STALE_ERROR_MS && (await isDisplayedOrFalse(errorEl))) {
            error = ((await errorEl.getText().catch(() => '')) ?? '').trim() || 'error shown';
            return true;
          }
          return false;
        },
        { timeout: VALIDATE_MS, interval: 500 }
      )
      .catch(() => false);
    const elapsed = `${((Date.now() - started) / 1000).toFixed(1)}s`;
    if (error) {
      throw new Error(`[Cart.TRADEIN] IMEI rejected after ${elapsed}: "${error}"`);
    }
    if (!done) {
      throw new Error(`[Cart.TRADEIN] IMEI not validated within ${VALIDATE_MS}ms`);
    }
    log(`  IMEI validated in ${elapsed}`);
  }

  private async hasUncheckedTerms(): Promise<boolean> {
    for (const checkbox of await this.locator.termsCheckboxes.getElements()) {
      if (!(await checkbox.isSelected().catch(() => false))) {
        return true;
      }
    }
    return false;
  }

  /** Agreement boxes only. Optional condition checkboxes live in `.condition-radio` and are not in this list. */
  private async checkAllTerms(): Promise<void> {
    const checkboxes = [...(await this.locator.termsCheckboxes.getElements())];
    for (const [index, checkbox] of checkboxes.entries()) {
      if (!(await checkbox.isSelected().catch(() => false))) {
        await this.choose(checkbox, `terms ${index + 1}/${checkboxes.length}`);
      }
    }
  }

  /**
   * The page can fill the field on its own shortly after the popup opens,
   * possibly after we typed, so re-check after a settle pause and retype if it was overwritten.
   */
  private async fillField(field: ChainablePromiseElement, value: string, label: string): Promise<void> {
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
    throw new Error(`[Cart.TRADEIN] ${label}: could not enter "${value}" (last "${entered}")`);
  }

  private async selectContinueButton(label: string): Promise<void> {
    await scrollElementToCenter(this.locator.modal.$('.modal__footer'));
    if (!(await clickIfDisplayed(this.locator.continueButton, WAIT_MS))) {
      throw new Error(`[Cart.TRADEIN] ${label} not clickable`);
    }
    log(`  click ${label}`);
  }
}
