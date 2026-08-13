import { AemTradeInPopupLocator } from '../../locators/aem-tradein-popup.locator';
import { scrollElementToCenter } from '../../helpers/gesture.helper';
import {
  TradeInInput,
  TradeInStep,
  mapCloseAttributeToStep,
} from './tradein.types';

/**
 * Trade-In 팝업을 step 감지 방식으로 완료한다.
 * (고정 N회 next 클릭이 아니라 현재 UI 상태에 반응)
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

    for (let attempt = 1; attempt <= 8; attempt++) {
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
        await this.acceptAllConditions();
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
      if (await option.isDisplayed().catch(() => false)) {
        await scrollElementToCenter(option).catch(() => undefined);
        await option.click();
        await driver.pause(400);
      }
    }
  }

  private async acceptAllConditions(): Promise<void> {
    const inputs = await this.locator.conditionInputs;
    const count = await inputs.length;
    for (let i = 0; i < count; i++) {
      const input = inputs[i];
      if (await input.isDisplayed().catch(() => false)) {
        await input.click().catch(() => undefined);
      }
    }
  }

  private async enterImei(imei?: string): Promise<void> {
    if (!imei) {
      return;
    }
    const field = this.locator.imeiInput;
    if (!(await field.isDisplayed().catch(() => false))) {
      return;
    }
    await field.clearValue().catch(() => undefined);
    await field.setValue(imei);
    if (await this.locator.checkImeiButton.isDisplayed().catch(() => false)) {
      await this.locator.checkImeiButton.click();
    }
  }

  private async acceptTermsIfNeeded(): Promise<void> {
    const checkbox = this.locator.termsCheckbox;
    if (await checkbox.isDisplayed().catch(() => false)) {
      const checked = await checkbox.isSelected().catch(() => false);
      if (!checked) {
        await checkbox.click();
      }
    }
  }

  private async clickContinueOrApply(): Promise<void> {
    if (await this.locator.applyButton.isDisplayed().catch(() => false)) {
      await this.clickApply();
      return;
    }
    if (await this.locator.continueButton.isDisplayed().catch(() => false)) {
      await scrollElementToCenter(this.locator.continueButton).catch(() => undefined);
      await this.locator.continueButton.click();
    }
  }

  private async clickApply(): Promise<void> {
    await this.acceptTermsIfNeeded();
    await scrollElementToCenter(this.locator.applyButton).catch(() => undefined);
    await this.locator.applyButton.waitForClickable({ timeout: 10000 });
    await this.locator.applyButton.click();
  }
}
