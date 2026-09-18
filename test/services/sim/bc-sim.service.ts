import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { scrollElementToCenter } from '../../helpers/gesture.helper';
import { switchToWebView } from '../../helpers/context.helper';
import { scrollAndJsClick, jsClick } from '../../helpers/element.helper';
import { getRunConfig } from '../../../config/run.config';

const US_CARRIERS = ['Verizon', 'AT&T', 'T-Mobile'] as const;

const US_CONNECTIVITY_BY_SKU_SUFFIX: Record<string, string> = {
  XAA: 'unlocked',
  VZW: 'verizon',
  ATT: 'at&t',
  XAU: 't-mobile',
};

export type SimAddOptions = {
  connectivity?: string;
  sku?: string;
};

export class BcSimService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(options: SimAddOptions = {}): Promise<void> {
    await console.warn('[BC.SIM.addService] Start');
    const siteCode = getRunConfig().siteCode;

    if (siteCode === 'US') {
      await this.addUsSim(options);
      return;
    }

    // UK/DE start from the inline plan chip (no separate Apply CTA).
    if (siteCode !== 'UK' && siteCode !== 'DE') {
      const add = this.locator.simAddButton;
      await add.waitForExist({ timeout: 30000 });
      await scrollElementToCenter(add);
      await scrollAndJsClick(add);
    }

    const purchase = this.locator.simPurchaseOption;
    
    if (await purchase.isDisplayed().catch(() => false)) {
      await scrollAndJsClick(purchase);
    }
    await console.warn('[BC.SIM.addService] purchase clicked');
    if (['DE', 'UK', 'SE'].includes(siteCode)) {
      await this.selectInlinePlan();
      await console.warn('[BC.SIM.addService] inline plan selected');
      await this.waitForOpen();
      await console.warn('[BC.SIM.addService] modal opened');
      if (siteCode === 'DE') {
        await this.acceptTermsAndConditions();
      }
      await this.clickConfirm();
      await console.warn('[BC.SIM.addService] modal closed');
      return;
    }

    await this.waitForOpen();
    await this.selectAnyPlan();
    await this.clickNext();
    await this.acceptTermsAndConditions();
    await this.clickConfirm();
    await this.waitForClose();
    await console.warn('[BC.SIM.addService] modal closed');
  }

  async selectNoForService(): Promise<void> {
    await switchToWebView();
    const no = this.locator.simNoButton;
    if (await no.isDisplayed().catch(() => false)) {
      await scrollElementToCenter(no);
      await no.click();
    }
  }

  async removeService(): Promise<void> {
    await switchToWebView();
    const remove = this.locator.simRemoveButton;
    if (await remove.isDisplayed().catch(() => false)) {
      await scrollAndJsClick(remove);
    }
  }

  async verifyServiceApplied(): Promise<void> {
    const siteCode = getRunConfig().siteCode;

    if (siteCode === 'US') {
      const options = await $$('.hubble-product__summary-product-option, [class*="summary"] [class*="option"]');
      for (const option of options) {
        if (!(await option.isDisplayed().catch(() => false))) {
          continue;
        }
        const text = ((await option.getText().catch(() => '')) ?? '').trim();
        if (US_CARRIERS.some((carrier) => text.includes(carrier))) {
          return;
        }
      }
      throw new Error('SIM/carrier not found in BC summary (US)');
    }

    const remove = this.locator.simRemoveButton;
    const visible = await remove
      .waitForDisplayed({ timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (!visible) {
      throw new Error('SIM is not added on BC page');
    }
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const priceEl = this.locator.simPriceLabel;
    if (!(await priceEl.isExisting().catch(() => false))) {
      return 0;
    }
    const text = (await priceEl.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(text.replace(/\s+|\/.*/g, ''));
  }

  private async addUsSim(options: SimAddOptions): Promise<void> {
    const connectivity =
      options.connectivity ||
      this.resolveUsConnectivityFromSku(options.sku) ||
      '';

    if (!connectivity) {
      return;
    }

    const carrier = this.locator.connectivityOption(connectivity);
    if (await carrier.isExisting().catch(() => false)) {
      await scrollElementToCenter(carrier);
      await scrollAndJsClick(carrier);
      await driver.pause(500);
    }

    if (connectivity.toLowerCase() === 'unlocked') {
      return;
    }

    const purchase = this.locator.usCarrierPurchaseOption(connectivity);
    await purchase.waitForExist({ timeout: 10000 });
    await scrollElementToCenter(purchase);
    await scrollAndJsClick(purchase);
  }

  private resolveUsConnectivityFromSku(sku?: string): string | undefined {
    if (!sku || sku.length < 3) {
      return undefined;
    }
    const suffix = sku.slice(-3).toUpperCase();
    return US_CONNECTIVITY_BY_SKU_SUFFIX[suffix];
  }

  private async selectInlinePlan(): Promise<void> {
    const plan = this.locator.simInlinePlanOption;
    await plan.waitForExist({ timeout: 10000 });
    await scrollAndJsClick(plan);
  }

  private async selectAnyPlan(): Promise<void> {
    const plan = this.locator.simPlanOption;
    await plan.waitForExist({ timeout: 10000 });
    await scrollElementToCenter(plan).catch(() => undefined);
    await scrollAndJsClick(plan);
  }

  private async acceptTermsAndConditions(): Promise<void> {
    const checkboxes = await this.locator.simTermsCheckboxes;
    for (const checkbox of checkboxes) {
      if (!(await checkbox.isDisplayed().catch(() => false))) {
        continue;
      }
      await driver.execute(
        'arguments[0].scrollIntoView({ block: "center" });',
        checkbox
      );
      await jsClick(checkbox);
      await driver.pause(300);
    }
  }

  private async clickNext(): Promise<void> {
    const next = this.locator.simNextButton;
    await next.waitForExist({ timeout: 10000 });
    await scrollAndJsClick(next);
  }

  private async clickConfirm(): Promise<void> {
    if (getRunConfig().siteCode === 'SE') {
      await this.acceptTermsAndConditions();
    }
    const confirm = this.locator.simConfirmButton;
    await confirm.waitForExist({ timeout: 10000 });
    await scrollAndJsClick(confirm);
  }

  private async waitForOpen(timeout = 10000): Promise<void> {
    await this.locator.simModal.waitForDisplayed({ timeout });
  }

  private async waitForClose(timeout = 10000): Promise<void> {
    await this.locator.simModal.waitForDisplayed({ reverse: true, timeout });
  }
}
