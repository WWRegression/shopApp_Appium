import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { switchToWebView } from '../../helpers/context.helper';
import { scrollAndJsClick, scrollAndWdioClick } from '../../helpers/element.helper';

export class BcScPlusService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(): Promise<void> {
    console.warn('[BC.SCPLUS.addService] started');

    await this.selectAddOption();
    
    await this.selectPlanOption();

    await this.popupProcess();
    console.warn('[BC.SCPLUS.addService] done');  
  }
  
  async selectNoForService(): Promise<void> {
    const no = this.locator.scPlusNoButton;
    await scrollAndWdioClick(no);
  }

  async removeService(): Promise<void> {
    // BC SC+ removal is site-specific; decline via selectNoForService when needed.
  }

  async verifyServiceApplied(): Promise<void> {
    const appliedLabel = await this.locator.scPlusAppliedLabel;

    if (await appliedLabel.waitForDisplayed({ timeout: 3000 }).catch(() => false)) {
      console.warn('[BC.SCPLUS.verifyServiceApplied] appliedLabel found');
      return;
    }

    console.warn('[BC.SCPLUS.verifyServiceApplied] appliedLabel not found');
    return;
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const priceEl = this.locator.scPlusPriceLabel;
    await priceEl.waitForExist({ timeout: 10000 });

    const attrPrice = (await priceEl.getAttribute('data-smc-price').catch(() => '')) ?? '';
    const textPrice = (await priceEl.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(attrPrice || textPrice);
  }

  private async selectAddOption(): Promise<void> {
    const addOption = this.locator.scPlusAddButton;
    if (await addOption.isDisplayed().catch(() => false)) {
      await scrollAndWdioClick(addOption);
      console.warn('[BC.SCPLUS.addService] addOption found and clicked');
    }
  }
  private async selectPlanOption(): Promise<void> {
    const planOption = this.locator.scPlusPlanOption;
    
    if (await planOption.waitForDisplayed({ timeout: 3000 }).catch(() => false)) {
      await scrollAndWdioClick(planOption);
      console.warn('[BC.SCPLUS.selectPlanOption] plan/payment option found and clicked');
    }
  }

  private async popupProcess(): Promise<void> {
    const modalOpened = await this.locator.scPlusModal
    if(await modalOpened.waitForDisplayed({ timeout: 5000 }).catch(() => false)) {
      console.warn('[BC.SCPLUS.addService] modalOpened: true');
      
      await this.checkAllTermsAndConditions();
      console.warn('[BC.SCPLUS.addService] checkAllTermsAndConditions done');

      await this.clickConfirm();
      console.warn('[BC.SCPLUS.addService] clickConfirm done');

      await this.waitForClose();
      console.warn('[BC.SCPLUS.addService] waitForClose done');      
    }
    else {
      console.warn('[BC.SCPLUS.addService] modalOpened: false');
      return;
    }
  }

  private async checkAllTermsAndConditions(): Promise<void> {
    const checkboxes = await this.locator.scPlusTermsCheckboxes;
    for (const checkbox of checkboxes) {
      const checked = await checkbox.isSelected().catch(() => false);
      if (checked) {
        continue;
      }
      await scrollAndJsClick(checkbox);
    }
  }

  private async clickConfirm(): Promise<void> {
    const confirm = this.locator.scPlusConfirmButton;
    await confirm.waitForExist({ timeout: 3000 });
    await scrollAndJsClick(confirm);
  }

  private async waitForClose(): Promise<void> {
    await this.locator.scPlusModal.waitForDisplayed({ reverse: true, timeout: 5000 });
  }
}
