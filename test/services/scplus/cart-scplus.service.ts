import { AddedService } from '../added-service.interface';
import { CartLocator } from '../../locators/cart.locator';
import { parsePriceToNumber } from '../../helpers/data.helper';
import { assertElementDisplayed } from '../../helpers/validation.helper';
import { switchToWebView, switchToWindowByPage } from '../../helpers/context.helper';
import { scrollAndJsClick, jsClick } from '../../helpers/element.helper';
import { scrollElementToCenter } from '../../helpers/gesture.helper';

export class CartScPlusService implements AddedService {
  private readonly locator = new CartLocator();

  async addService(): Promise<void> {
    await switchToWebView();
    await switchToWindowByPage('cart');

    const add = this.locator.scPlusAddButton;
    await add.waitForExist({ timeout: 15000 });
    await scrollElementToCenter(add);
    await scrollAndJsClick(add);

    // Prefer first radio if nothing is checked yet.
    const checked = await $(
      'mat-radio-group mat-radio-button.mat-mdc-radio-checked, input[type="radio"].radio[checked="checked"]'
    )
      .isExisting()
      .catch(() => false);
    if (!checked) {
      const firstOption = await $(
        'mat-radio-group > div:first-child mat-radio-button input, mat-radio-group mat-radio-button input'
      );
      if (await firstOption.isExisting().catch(() => false)) {
        await jsClick(firstOption);
      }
    }

    const terms = await $$(
      [
        'input[type="checkbox"].mdc-checkbox__native-control:not(:checked)',
        '[for="serviceAcceptedTermsCondition"] input[type="checkbox"]:not(:checked)',
        'input[type="checkbox"][id*="ServiceTermsAndCondition.acceptedTermsAndConditions"]:not(:checked)',
        'mat-checkbox:not(.mat-mdc-checkbox-checked) input',
      ].join(', ')
    );
    for (const checkbox of terms) {
      await jsClick(checkbox);
    }

    const apply = await $(
      [
        'button[type="submit"].pill-btn--newblue:not([disabled])',
        'button[data-an-la="samsung care:add to cart"]:not([disabled])',
        'button[data-an-la="samsung care:confirm"]:not([disabled])',
      ].join(', ')
    );
    await apply.waitForExist({ timeout: 10000 });
    await scrollAndJsClick(apply);
  }

  async selectNoForService(): Promise<void> {
    await switchToWebView();
    await this.locator.scPlusNoButton.click();
  }

  async removeService(): Promise<void> {
    // Cart SC+ removal not required for PROD_BUY_02.
  }

  async verifyServiceApplied(): Promise<void> {
    await switchToWebView();
    await switchToWindowByPage('cart');
    await assertElementDisplayed(
      this.locator.scPlusAppliedLabel,
      'SC+ not found in cart'
    );
  }

  async getServicePrice(): Promise<number> {
    await switchToWebView();
    const text = (await this.locator.scPlusAppliedLabel.getText().catch(() => '')) ?? '';
    return parsePriceToNumber(text);
  }
}
