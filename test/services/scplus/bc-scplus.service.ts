import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { scrollElementToCenter } from '../../helpers/gesture.helper';
import { switchToWebView } from '../../helpers/context.helper';
import { scrollAndJsClick, scrollAndWdioClick, jsClick } from '../../helpers/element.helper';
import { getRunConfig } from '../../../config/run.config';

const SC_PLUS_KEYWORDS = ['Samsung Care+', 'Samsung Care Plus', 'Care+', 'Care', 'Protect'];

export class BcScPlusService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(): Promise<void> {
    await console.warn('[BC.SCPLUS.addService] addService');
    const add = this.locator.scPlusAddButton;
    await add.waitForExist({ timeout: 15000 });
    await console.warn('[BC.SCPLUS.addService] add: waitForExist done');
    const className = (await add.getAttribute('class').catch(() => '')) ?? '';
    await console.warn('[BC.SCPLUS.addService] add: getAttribute done');
    // await scrollAndJsClick(add);
    // await console.warn('[BC.SCPLUS.addService] add: scrollAndJsClick done');

    await scrollAndWdioClick(add);
    await console.warn('[BC.SCPLUS.addService] add: scrollAndWdioClick done');
    const payment = this.locator.scPlusPaymentOption;
    if (await payment.isDisplayed().catch(() => false)) {
      await console.warn('[BC.SCPLUS.addService] payment:');
      await scrollAndWdioClick(payment);
      await console.warn('[BC.SCPLUS.addService] payment: scrollAndWdioClick done');
    }

    // CN applies SC+ without the care popup.
    if (getRunConfig().siteCode === 'CN') {
      return;
    }

    const modalOpened = await this.locator.scPlusModal
      .waitForDisplayed({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    await console.warn('[BC.SCPLUS.addService] modalOpened:', modalOpened);
    if (!modalOpened) {
      await console.warn('[BC.SCPLUS.addService] modalOpened: false');
      return;
    }

    if (className.includes('smc-item')) {
      await console.warn('[BC.SCPLUS.addService] className: smc-item');
      await this.selectFirstType();
      await this.selectFirstDuration();
      await this.clickContinue();
    }

    await this.checkAllTermsAndConditions();
    await console.warn('[BC.SCPLUS.addService] checkAllTermsAndConditions done');
    await this.clickConfirm();
    await console.warn('[BC.SCPLUS.addService] clickConfirm done');
    await this.waitForClose();
    await console.warn('[BC.SCPLUS.addService] waitForClose done');
  }

  async selectNoForService(): Promise<void> {
    const no = this.locator.scPlusNoButton;
    await scrollAndWdioClick(no);
  }

  async removeService(): Promise<void> {
    // BC SC+ removal is site-specific; decline via selectNoForService when needed.
  }

  async verifyServiceApplied(): Promise<void> {
    await switchToWebView();

    // Broad summary selectors can match non-care rows ??find one whose text looks like SC+.
    const candidates = await $$(
      [
        '#lineSummary .hubble-product__summary-product-inner .hubble-product__summary-product-option',
        '.total-summary__price-bundle .summary-care-title',
        'ul[class*="samsung-care"] li.pd-select-option__item.selected',
        '.hubble-product__summary-product-option',
        '.wearable-bc-price__bundle-title',
        '[class*="SummaryDetails_summary__details__two__row"] span',
      ].join(', ')
    );

    for (const candidate of candidates) {
      if (!(await candidate.isDisplayed().catch(() => false))) {
        continue;
      }
      const text = ((await candidate.getText().catch(() => '')) ?? '').trim();
      if (
        SC_PLUS_KEYWORDS.some((keyword) =>
          text.toLowerCase().includes(keyword.toLowerCase())
        )
      ) {
        return;
      }
    }

    throw new Error('SC+ not found in BC summary');
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const priceEl = this.locator.scPlusPriceLabel;
    await priceEl.waitForExist({ timeout: 10000 });

    const attrPrice = (await priceEl.getAttribute('data-smc-price').catch(() => '')) ?? '';
    const textPrice = (await priceEl.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(attrPrice || textPrice);
  }

  private async selectFirstType(): Promise<void> {
    const type = this.locator.scPlusTypeOption;
    if (await type.isExisting().catch(() => false)) {
      await scrollElementToCenter(type).catch(() => undefined);
      await scrollAndJsClick(type);
      await driver.pause(500);
    }
  }

  private async selectFirstDuration(): Promise<void> {
    const duration = this.locator.scPlusDurationOption;
    if (await duration.isExisting().catch(() => false)) {
      await scrollElementToCenter(duration).catch(() => undefined);
      await scrollAndJsClick(duration);
      await driver.pause(500);
    }
  }

  private async clickContinue(): Promise<void> {
    const continueBtn = this.locator.scPlusContinueButton;
    if (await continueBtn.isExisting().catch(() => false)) {
      await scrollAndJsClick(continueBtn);
    }
  }

  private async checkAllTermsAndConditions(): Promise<void> {
    const checkboxes = await this.locator.scPlusTermsCheckboxes;
    for (const checkbox of checkboxes) {
      const checked = await checkbox.isSelected().catch(() => false);
      if (checked) {
        continue;
      }
      await driver.execute(
        'arguments[0].scrollIntoView({ block: "center" });',
        checkbox
      );
      await jsClick(checkbox);
    }
  }

  private async clickConfirm(): Promise<void> {
    const confirm = this.locator.scPlusConfirmButton;
    await confirm.waitForExist({ timeout: 10000 });
    await scrollAndJsClick(confirm);
  }

  private async waitForClose(timeout = 10000): Promise<void> {
    await this.locator.scPlusModal.waitForDisplayed({ reverse: true, timeout });
  }
}
