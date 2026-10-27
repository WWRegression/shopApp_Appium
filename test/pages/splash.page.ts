import { BasePage } from './base.page';
import { SplashLocator } from '../locators/splash.locator';
import { getWindowIdsForPage } from '../helpers/context.helper';

type SplashCheck = 'cart' | 'clicked' | 'none';

/** Post-ATC splash (add-on / gift / popup) → cart. */
export class SplashPage extends BasePage {
  private readonly locator = new SplashLocator();

  /** Clicks splash Continue buttons as they show, until a new cart window opens. */
  async clickSplashContinue(): Promise<void> {
    const oldCartWindows = await getWindowIdsForPage('cart');
    let deadline = Date.now() + 8000;

    while (Date.now() < deadline) {
      const result = await this.clickContinueIfShown();
      if (result === 'cart') {
        return;
      }
      if (result === 'clicked') {
        console.log('[clickSplashContinue] Continue clicked');
        if (await this.isNewCartWindowOpened(oldCartWindows)) {
          console.log('[clickSplashContinue] cart window opened');
          return;
        }
        // A chained splash (add-on → gift) shows right after a click
        deadline = Date.now() + 4000;
      }
      await driver.pause(300);
    }
  }

  /** True when a new cart window opens within 3s; read from the window list because the hidden BC window answers slowly. */
  private async isNewCartWindowOpened(oldWindows: string[]): Promise<boolean> {
    return driver
      .waitUntil(async () => (await getWindowIdsForPage('cart')).some((id) => !oldWindows.includes(id)), {
        timeout: 3000,
        interval: 500,
      })
      .catch(() => false);
  }

  /** Clicks a visible Continue once; 'cart' when on the cart or the window closed. */
  private async clickContinueIfShown(): Promise<SplashCheck> {
    const selectors = await Promise.all(
      [this.locator.continueButtonOnPopup, this.locator.continueButton].map(async (button) => String((await button).selector))
    );
    return driver
      .execute((selectors: string[]): SplashCheck => {
        if (location.pathname.includes('/cart')) {
          return 'cart';
        }
        // Clicking the same Continue twice loads the cart twice
        const button = selectors
          .flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))
          .find((el) => el.getClientRects().length > 0 && !el.dataset.splashClicked);
        if (!button) {
          return 'none';
        }
        button.dataset.splashClicked = '1';
        button.scrollIntoView({ block: 'center' });
        button.click();
        return 'clicked';
      }, selectors)
      .catch((): SplashCheck => 'cart');
  }
}
