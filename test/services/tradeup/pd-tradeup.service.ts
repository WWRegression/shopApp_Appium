import { PdLocator } from '../../locators/pd.locator';
import { isDisplayedOrFalse, clickIfDisplayed, scrollAndWdioClick, waitForDisplayedOrFalse } from '../../helpers/element.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';

type TradeUpSteps = 'selectDevice' | 'checkCondition' | 'applyDiscount';
/**
 * PD Trade-Up (VD/HA). Katalon PDTradeUpHandler — simplified WebView path.
 * AE/AE_AR/VN fall back to Trade-In style entry in Katalon; here we still use Trade-Up yes.
 */
export class PdTradeUpService {
  private readonly locator = new PdLocator();

  private readonly candidates: [TradeUpSteps, string[]][] = [
    ['selectDevice', ['sdf-comp-step-panel-product']],
    ['checkCondition', ['sdf-comp-step-panel-condition']],
    ['applyDiscount', ['sdf-comp-step-panel-discount']],
  ];

  async addService(postalCode?: string ): Promise<void> {
    if (!await clickIfDisplayed(this.locator.tradeUpYesOption)) {
      console.warn('[PD.TRADEUP.addService] tradeUpYesOption not found');
      return;
    }
    console.warn('[PD.TRADEUP.addService] tradeUpYesOption found and clicked');    
    await this.popupProcess(postalCode);
  }

  private async popupProcess(postalCode?: string): Promise<void> {
    if (!(await this.waitForOpen())) {
      console.warn('[PD.TRADEUP.popupProcess] popup not opened');
      return;
    }
    
    for (let attempt = 0; attempt < 5; attempt++) {
      const active = await this.currentActiveStep();
      if (!active) {
        if (!(await this.waitForOpen(1000))) {
          return;
        }
        await driver.pause(1000);
        continue;
      }
      await this.runStep(active, postalCode);      
    }
    await this.waitForClose();
  }

  
  private async currentActiveStep(): Promise<TradeUpSteps | null> {
   
    const currentStep = this.locator.tradeUpCurrentStep;
    if (!(await isDisplayedOrFalse(currentStep))) {
      console.warn('[PD.TRADEUP.currentActiveStep] current step not found');
      return null;
    }
    const stepClassName= await currentStep.getAttribute('class');
    console.warn('[PD.TRADEUP.currentActiveStep] step class name=', stepClassName);
    if (!stepClassName) {
      console.warn('[PD.TRADEUP.currentActiveStep] step class name not found');
      return null;
    }
    const matched = this.candidates.find(
      ([, classNames]) => classNames.some(classNamePart =>
        stepClassName.includes(classNamePart)
      )
    );
    
    return matched?.[0] ?? null;
  }

  private async runStep(step: TradeUpSteps, postalCode?: string): Promise<void> {
    console.warn(`[PD.TRADEUP.runStep] step ============================ ${step}`);
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

  private async waitForOpen(timeout = 5000): Promise<boolean> {
    const displayed = await waitForDisplayedOrFalse(this.locator.tradeUpModal, {timeout:timeout});
    console.warn('[PD.TRADEUP.waitForOpen] popup opened=', displayed);
    return displayed;
  }

  private async waitForClose(timeout = 5000): Promise<boolean> {
    const displayed = await waitForDisplayedOrFalse(this.locator.tradeUpModal, {reverse: true, timeout:timeout});
    console.warn('[PD.TRADEUP.waitForClose] popup closed=', displayed);
    return displayed;
  }

  private async stepSelectDevice(postalCode?: string): Promise<void> {
    console.warn('[PD.TRADEUP.stepSelectDevice] step select device found');
    await this.setPostalCode(postalCode);
    await this.selectModel();
    await this.selectBrand();
    await this.selectContinueButton();
  }

  private async stepCheckCondition(): Promise<void> {
    console.warn('[PD.TRADEUP.stepCheckCondition] step check condition found');
    await this.selectConditionYes();
    await this.selectContinueButton();
  }

  private async stepApplyDiscount(): Promise<void> {
    console.warn('[PD.TRADEUP.stepApplyDiscount] step apply discount found');
    await this.checkAllTermsAndConditions();
    await this.selectContinueButton();
  }

  private async selectContinueButton(): Promise<void> {
    if(await clickIfDisplayed(this.locator.tradeUpConfirmButton)){
      console.warn('[PD.TRADEUP.selectContinueButton] continue/apply button found and clicked');
    }
  }

  private async setPostalCode(postalCode?: string): Promise<void> {
    if(!postalCode) {
      console.warn('[PD.TRADEUP.setPostalCode] postal code is not provided');
      return;
    }

    const input = this.locator.tradeUpPostalInput;
    if (!(await clickIfDisplayed(input))) {
      console.warn('[PD.TRADEUP.setPostalCode] postal code input not found');
      return;
    }    
    await input.clearValue().catch(() => undefined);
    await input.setValue(postalCode);
    console.warn('[PD.TRADEUP.setPostalCode] input postal code');
    await driver.pause(500);

    if(await clickIfDisplayed(this.locator.tradeUpPostalCheckButton)){
      console.warn('[PD.TRADEUP.setPostalCode] checked postal code');
      await waitForDisplayedOrFalse(this.locator.tradeUpPostalSuccessMessage, {timeout: 2000});
      console.warn('[PD.TRADEUP.setPostalCode] postal code checked successfully');
    }
  }

  private async selectModel(): Promise<void> {
    console.warn('[PD.TRADEUP.selectModel] step select model found');
    await driver
      .execute(() => {
        const selects = Array.from(
          document.querySelectorAll<HTMLSelectElement>(
            'div.menu.sdf-comp-model-menu select.menu__select, li.model select.menu__select'
          )
        );
        for (const sel of selects) {
          if (sel.options.length > 1) {
            sel.selectedIndex = 1;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      })
      .catch(() => undefined);
  }

  private async selectBrand(): Promise<void> {
    console.warn('[PD.TRADEUP.selectBrand] step select brand found');
    await driver
      .execute(() => {
        const selects = Array.from(
          document.querySelectorAll<HTMLSelectElement>(
            'div.menu.sdf-comp-brand-menu select.menu__select, li.brand select.menu__select'
          )
        );
        for (const sel of selects) {
          if (sel.options.length > 1) {
            sel.selectedIndex = 1;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      })
      .catch(() => undefined);
  }

  private async selectConditionYes(): Promise<void> {
    if(await clickIfDisplayed(this.locator.tradeUpConditionYes)){
      console.warn('[PD.TRADEUP.selectConditionYes] accept condition yes found and clicked');
    }
  }

  private async checkAllTermsAndConditions(): Promise<void> {
    const termsCheckboxes = await this.locator.tradeUpTerms;
    for (const checkbox of termsCheckboxes) {
      const input = checkbox.$('input');
      const checked = await input.isSelected().catch(() => false);
      if (checked) {
        continue;
      }
      await scrollAndWdioClick(checkbox);
    }
  }

  async verifyServiceApplied(): Promise<void> {
    await assertElementDisplayed(
      this.locator.tradeUpRemoveButton,
      'Trade-Up not applied on PD'
    );
  }
}
