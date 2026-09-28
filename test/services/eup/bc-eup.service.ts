import { AddedService } from '../added-service.interface';
import { BcLocator } from '../../locators/bc.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { scrollAndJsClick, isExistingInWebView } from '../../helpers/element.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';

export class BcEupService implements AddedService {
  private readonly locator = new BcLocator();

  async addService(): Promise<void> {
    console.warn('[BcEupService] addService start');

    await this.selectAddOption();
    await this.selectApply();    
  }

  private async selectAddOption(): Promise<void> {
    const add = this.locator.eupAddButton;
    await add.waitForExist({ timeout: 15000 });
    await scrollAndJsClick(add);
  }

  private async selectApply(): Promise<void> {
    const apply = this.locator.eupApplyButton;
    await apply.waitForDisplayed({ timeout: 5000 });
    await scrollAndJsClick(apply);
  }


  async selectNoForService(): Promise<void> {
    const no = this.locator.eupNoButton;
    if (!(await isExistingInWebView(no))) {
      return;
    }
    await scrollAndJsClick(no);
  }

  async removeService(): Promise<void> {
    const remove = this.locator.eupRemoveButton;
    if (await isExistingInWebView(remove)) {
      await scrollAndJsClick(remove);
    }
    const confirm = this.locator.eupRemoveConfirmButton;
    if (await isExistingInWebView(confirm)) {
      await scrollAndJsClick(confirm);
    }
  }

  async verifyServiceApplied(): Promise<void> {
    await assertElementDisplayed(this.locator.eupRemoveButton, 'EUP not applied on BC');
  }

  async getServicePrice(): Promise<number> {
    const text = (await this.locator.eupAddButton.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(text);
  }
}
