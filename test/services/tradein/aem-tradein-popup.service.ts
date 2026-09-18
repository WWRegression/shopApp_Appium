import { AemTradeInPopupLocator } from '../../locators/aem-tradein-popup.locator';
import { scrollElementToCenter } from '../../helpers/gesture.helper';
import { scrollAndJsClick, jsClick } from '../../helpers/element.helper';
import { getRunConfig } from '../../../config/run.config';
import {
  TradeInInput,
  TradeInStep,
  mapCloseAttributeToStep,
} from './tradein.types';

/**
 * Trade-In ?ì??step ê°ì? ë°©ì?¼ë¡ ?ë£?ë¤.
 * (ê³ ì  N??next ?´ë¦­???ë???ì¬ UI ?í??ë°ì)
 */
export class AemTradeInPopupService {
  private readonly locator = new AemTradeInPopupLocator();

  async isOpen(): Promise<boolean> {
    return this.locator.modal.isDisplayed().catch(() => false);
  }

  async waitForOpen(timeout = 10000): Promise<void> {
    await this.locator.modal.waitForDisplayed({ timeout });
  }

  async waitForClose(timeout = 15000): Promise<void> {
    await this.locator.modal.waitForDisplayed({ reverse: true, timeout });
  }

  async detectStep(): Promise<TradeInStep> {
    const anLa = await this.locator.closeButton.getAttribute('an-la').catch(() => null);
    const mapped = mapCloseAttributeToStep(anLa);
    if (mapped !== 'unknown') {
      return mapped;
    }

    if (await this.locator.imeiInput.isDisplayed().catch(() => false)) {
      return 'enter-imei';
    }
    const conditions = await this.locator.conditionInputs;
    if ((await conditions.length) > 0) {
      return 'check-condition';
    }
    if (await this.locator.applyButton.isDisplayed().catch(() => false)) {
      return 'apply-discount';
    }
    return 'unknown';
  }

  async completeTradeInFlow(input: TradeInInput = {}): Promise<void> {
    await this.waitForOpen();

    for (let attempt = 1; attempt <= 12; attempt++) {
      if (!(await this.isOpen())) {
        return;
      }

      const step = await this.detectStep();
      await this.runStep(step, input);
      await driver.pause(800);
    }

    if (await this.isOpen()) {
      throw new Error('Trade-In popup still open after max step attempts');
    }
  }

  private async runStep(step: TradeInStep, input: TradeInInput): Promise<void> {
    switch (step) {
      case 'guide':
        await this.clickContinueOrApply();
        break;
      case 'select-device':
        await this.selectDeviceOptions(input);
        await this.clickContinueOrApply();
        break;
      case 'check-condition':
        await this.preAcceptDeviceConditionIfNeeded();
        await this.acceptAllConditions();
        await this.acceptTermsIfNeeded();
        await this.clickContinueOrApply();
        break;
      case 'enter-imei':
        await this.enterImei(input.imei);
        await this.clickContinueOrApply();
        break;
      case 'apply-discount':
        await this.acceptTermsIfNeeded();
        await this.clickApply();
        break;
      case 'unknown':
      default:
        await this.clickContinueOrApply();
        break;
    }
  }

  private async selectDeviceOptions(input: TradeInInput): Promise<void> {
    const values = [
      input.category,
      input.brand,
      input.model,
      input.subseries,
      input.device,
      input.storage,
      input.color,
      input.screenSize,
      input.purchaseFrom,
    ].filter((v): v is string => Boolean(v && v.trim()));

    for (const value of values) {
      const option = this.locator.optionByValue(value);
      // isDisplayed can be true for occluded page elements; require existence in popup scope.
      if (!(await option.isExisting().catch(() => false))) {
        continue;
      }
      await scrollElementToCenter(option).catch(() => undefined);
      try {
        await scrollAndJsClick(option);
      } catch {
        await jsClick(option);
      }
      await driver.pause(400);
    }
  }

  private shouldClickConditionIndex(siteCode: string, index: number): boolean {
    const site = siteCode.toUpperCase();
    const evenIndex = index % 2 === 0;
    const oddIndex = index === 0 || (index !== 1 && index % 2 === 1);
    const secondAndEven = index === 1 || (index !== 0 && index % 2 === 0);
    const onlyOdd = index % 2 === 1;
    const firstItem = index === 0;
    const inSpecific = [0, 3, 5, 7, 8, 10].includes(index);

    if (['TH', 'CN', 'HK', 'HK_EN'].includes(site)) return oddIndex;
    if (site === 'PH') return secondAndEven;
    if (['JP', 'NZ', 'SG'].includes(site)) return onlyOdd;
    if (['AE', 'AE_AR', 'UK'].includes(site)) return firstItem;
    if (site === 'IN') return inSpecific;
    return evenIndex;
  }

  private async preAcceptDeviceConditionIfNeeded(): Promise<void> {
    const good = this.locator.goodConditionOption;
    if (!(await good.isExisting().catch(() => false))) {
      return;
    }
    const selected = await good.isSelected().catch(() => false);
    if (selected) {
      return;
    }
    await scrollElementToCenter(good).catch(() => undefined);
    await this.clickConditionTarget((await good) as unknown as WebdriverIO.Element);
  }

  private async acceptAllConditions(): Promise<void> {
    const inputs = await this.locator.conditionInputs;
    const count = await inputs.length;
    const targets: WebdriverIO.Element[] = [];

    for (let i = 0; i < count; i++) {
      const el = (await inputs[i]) as unknown as WebdriverIO.Element;
      if (await el.isDisplayed().catch(() => false)) {
        targets.push(el as WebdriverIO.Element);
      }
    }
    if (targets.length === 0) {
      return;
    }

    const checklistTargets: WebdriverIO.Element[] = [];
    for (const target of targets) {
      const acceptData =
        (await target.getAttribute('accept_data').catch(() => '')) ??
        (await target.getAttribute('accept-data').catch(() => '')) ??
        '';
      // Summary accept radios (good / not good) are handled in preAcceptDeviceConditionIfNeeded.
      if (acceptData === 'yes' || acceptData === 'no') {
        continue;
      }
      checklistTargets.push(target);
    }

    if (checklistTargets.length === 0) {
      return;
    }

    const siteCode = getRunConfig().siteCode;
    let clicked = false;

    for (let idx = 0; idx < checklistTargets.length; idx++) {
      if (!this.shouldClickConditionIndex(siteCode, idx)) {
        continue;
      }
      await this.clickConditionTarget(checklistTargets[idx]);
      clicked = true;
      await driver.pause(300);
    }

    if (!clicked) {
      for (const target of checklistTargets) {
        await this.clickConditionTarget(target);
        await driver.pause(300);
      }
    }
  }

  private async clickConditionTarget(el: WebdriverIO.Element): Promise<void> {
    const tag = ((await el.getTagName().catch(() => '')) ?? '').toLowerCase();

    if (tag === 'input') {
      const id = (await el.getAttribute('id').catch(() => '')) ?? '';
      if (id) {
        const label = await $(`label[for="${id.replace(/"/g, '\\"')}"]`);
        if (await label.isExisting().catch(() => false)) {
          await scrollElementToCenter(label).catch(() => undefined);
          await jsClick(await label);
          return;
        }
      }
      await driver.execute(
        'const el = arguments[0]; const parent = el.closest(".radio-v2, label"); (parent || el).click();',
        el
      );
      return;
    }

    await jsClick(el);
  }

  private async enterImei(imei?: string): Promise<void> {
    if (!imei) {
      return;
    }
    const field = this.locator.imeiInput;
    if (!(await field.isExisting().catch(() => false))) {
      return;
    }
    await scrollElementToCenter(field).catch(() => undefined);
    await field.clearValue().catch(() => undefined);
    await field.setValue(imei);

    const checkBtn = this.locator.checkImeiButton;
    if (await checkBtn.isExisting().catch(() => false)) {
      await scrollAndJsClick(checkBtn);
      // Wait for validation to enable Continue (avoid re-entering the same step blindly).
      await this.locator.continueButton
        .waitForDisplayed({ timeout: 10000 })
        .catch(() => undefined);
      await driver.pause(500);
    }
  }

  private async acceptTermsIfNeeded(): Promise<void> {
    const checkboxes = await $$(
      [
        'input[type="checkbox"][an-la*="term" i]',
        '.trade-in-popup__apply-wrap input[type="checkbox"]',
        '[class*="tnc"] input[type="checkbox"]',
        '.trade-in-popup-v3 input[type="checkbox"]:not(:checked)',
      ].join(', ')
    );

    for (const checkbox of checkboxes) {
      if (!(await checkbox.isDisplayed().catch(() => false))) {
        continue;
      }
      const checked = await checkbox.isSelected().catch(() => false);
      if (!checked) {
        await jsClick(checkbox);
      }
    }
  }

  private async clickContinueOrApply(): Promise<void> {
    if (await this.locator.applyButton.isExisting().catch(() => false)) {
      const applyDisabled =
        ((await this.locator.applyButton.getAttribute('class').catch(() => '')) ?? '').includes(
          'cta--disabled'
        );
      if (!applyDisabled) {
        await this.clickApply();
        return;
      }
    }
    const cont = this.locator.continueButton;
    if (await cont.isExisting().catch(() => false)) {
      await scrollElementToCenter(cont).catch(() => undefined);
      await scrollAndJsClick(cont);
    }
  }

  private async clickApply(): Promise<void> {
    await this.acceptTermsIfNeeded();
    await scrollElementToCenter(this.locator.applyButton).catch(() => undefined);
    await scrollAndJsClick(this.locator.applyButton);
  }
}
