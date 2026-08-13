import { PopupLocator } from '../locators/popup.locator';
import { HeaderLocator } from '../locators/header.locator';
import { BnbLocator } from '../locators/bnb.locator';
import { switchToNative } from '../helpers/context.helper';
import { scrollElementToCenter } from '../helpers/gesture.helper';

/**
 * 전 페이지 공통 UI 동작.
 * Context 전환 구현은 context.helper에만 둔다 (이중 API 금지).
 */
export class BasePage {
  protected readonly popupLocator = new PopupLocator();
  protected readonly headerLocator = new HeaderLocator();
  protected readonly bnbLocator = new BnbLocator();

  async closePopupIfDisplayed(): Promise<void> {
    const closeButton = this.popupLocator.closeButton;
    if (await closeButton.isDisplayed().catch(() => false)) {
      await closeButton.click();
    }
  }

  async acceptCookieBannerIfShown(): Promise<void> {
    const acceptButton = this.popupLocator.cookieAcceptButton;
    if (await acceptButton.isDisplayed().catch(() => false)) {
      await acceptButton.click();
    }
  }

  async clickHeaderSearch(): Promise<void> {
    await switchToNative();
    await this.headerLocator.searchButton.click();
  }

  async clickBnbHome(): Promise<void> {
    await switchToNative();
    await this.bnbLocator.homeButton.click();
  }

  async clickBnbCart(): Promise<void> {
    await switchToNative();
    await this.bnbLocator.cartButton.click();
  }

  protected async clickWhenReady(
    element: ChainablePromiseElement,
    options?: { scroll?: boolean; timeout?: number }
  ): Promise<void> {
    if (options?.scroll !== false) {
      await scrollElementToCenter(element).catch(() => undefined);
    }
    await element.waitForClickable({ timeout: options?.timeout ?? 10000 });
    await element.click();
  }
}
