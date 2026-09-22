import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { scrollElementToCenter } from '../../helpers/gesture.helper';
import { switchToWebView } from '../../helpers/context.helper';
import { scrollAndJsClick, scrollAndWdioClick, scrollUntilVisibleInWebView, getElementLabel } from '../../helpers/element.helper';
import { getRunConfig } from '../../../config/run.config';

const US_SKU_CARRIER: Record<string, string> = {
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

  async addService(skuInfo: string): Promise<void> {
    await console.warn('[BC.SIM.addService] Start');
    
    if (getRunConfig().siteCode === 'US') {
      await this.addSimForUS(skuInfo);
      console.warn('[BC.SIM.addService] addSimForUS done');
      return;      
    }

    await this.selecteAddOption();
    await this.selectPlanOption();
    await this.popupProcess();

    await console.warn('[BC.SIM.addService] Done');
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
    const appliedLabel = (getRunConfig().siteCode === 'US') ? this.locator.simAppliedLabel : this.locator.simRemoveButton;
    if ((await appliedLabel.isDisplayed().catch(() => false))) {
      const label = await getElementLabel(appliedLabel);
      console.warn('[BC.SIM.verifyServiceApplied] SIM applied: ', label);
    }else{
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


  private async addSimForUS(skuInfo: string): Promise<void> {
    const carrier = US_SKU_CARRIER[skuInfo.slice(-3).toUpperCase()]
    console.warn('[BC.SIM.addUsSim] carrier : ', carrier);
    if (!carrier) {
      return;
    }
    
    const carrierOption = this.locator.connectivityOption(carrier);
    if (await carrierOption.isDisplayed().catch(() => false)) {
      await scrollAndWdioClick(carrierOption);
    }

    const purchase = this.locator.usCarrierPurchaseOption(carrier);
    if (!(await scrollUntilVisibleInWebView(purchase))) {
      throw new Error('SIM purchase option not found');
    }
    await scrollAndWdioClick(purchase);
    console.warn('[BC.SIM.addUsSim] purchase found and clicked');
  }

  private async selecteAddOption(): Promise<void> {
    const addOption = this.locator.simAddButton;
    if (await addOption.isDisplayed().catch(() => false)) {
      await scrollAndWdioClick(addOption);
      console.warn('[BC.SIM.selecteAddOption] addOption found and clicked');
    }
  }

  private async selectPlanOption(): Promise<void> {
    const plan = this.locator.simPlanOption;
    if (await plan.isDisplayed().catch(() => false)) {
      await scrollAndWdioClick(plan);
      console.warn('[BC.SIM.selectPlanOption] plan/payment option found and clicked');
    }
  }

  private async popupProcess(): Promise<void> {
    if(await this.waitForOpen()) {
      console.warn('[BC.SIM.popupProcess] modalOpened: true');
      
      await this.selectPlanOptionInPopup();
      console.warn('[BC.SIM.popupProcess] selectPlanOptionInPopup done');
      await this.checkAllTermsAndConditions();
      console.warn('[BC.SIM.popupProcess] checkAllTermsAndConditions done');
      await this.clickConfirm();
      console.warn('[BC.SIM.popupProcess] clickConfirm done');
      await this.waitForClose();
      console.warn('[BC.SIM.popupProcess] waitForClose done');      
    }
    else {
      console.warn('[BC.SCPLUS.addService] modalOpened: false');
      return;
    }
  }
  private async selectPlanOptionInPopup(): Promise<void> {
    const planOption = this.locator.simPlanOptionInPopup;    
    if (await planOption.isDisplayed().catch(() => false)) {
      await scrollAndWdioClick(planOption);
      console.warn('[BC.SIM.selectPlanOptionInPopup] plan/payment option found and clicked');

      const next = this.locator.simNextButton;
      await next.waitForExist({ timeout: 10000 });
      await scrollAndWdioClick(next);
      console.warn('[BC.SIM.selectPlanOptionInPopup] next button found and clicked');
    }
  }

  private async checkAllTermsAndConditions(): Promise<void> {
    const checkboxes = await this.locator.simTermsCheckboxes;
    for (const checkbox of checkboxes) {
      const checked = await checkbox.isSelected().catch(() => false);
      if (checked) {
        continue;
      }
      await scrollAndWdioClick(checkbox);
    }
  }

  private async clickConfirm(): Promise<void> {
    const confirm = this.locator.simConfirmButton;
    await confirm.waitForExist({ timeout: 3000 });
    await scrollAndJsClick(confirm);
  }

  private async waitForOpen(): Promise<boolean> {
    return await this.locator.simModal.waitForDisplayed({ timeout: 5000 }).catch(() => false);
  }

  private async waitForClose(): Promise<void> {
    await this.locator.simModal.waitForDisplayed({ reverse: true, timeout: 5000 });
  }
}
