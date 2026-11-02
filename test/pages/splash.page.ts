import { BasePage } from './base.page';
import { SplashLocator } from '../locators/splash.locator';
import { getWindowIdsForPage, prepareWebViewPage } from '../helpers/context.helper';
import { clickIfDisplayed, isDisplayedOrFalse, scrollAndJsClick } from '../helpers/element.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';
import { getRunConfig } from '../../config/run.config';

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

  /** Waits for the add-on page after Add to Cart; a free gift page shown first is continued. Skips the TC when the site has no add-on. */
  async prepareAddonPage(): Promise<void> {
    await prepareWebViewPage('bc', () => this.locator.addonSection, 15000);
    // Some sites show the free gift page before the add-on page
    if (await clickIfDisplayed(this.locator.continueButtonOnGift)) {
      console.log('[prepareAddonPage] free gift Continue clicked');
    }
    const shown = await driver
      .waitUntil(async () => Boolean(await this.findAddItemButton()), { timeout: 10000, interval: 500 })
      .then(() => true, () => false);
    console.log(`[prepareAddonPage] add-on page shown=${shown}`);
    markFailedAndStop([{ label: '[SKIPPED] No add-on page on this site', pass: shown }], 'prepareAddonPage');
  }

  /** The BNB cart icon on the add-on page must already count the product added on BC. */
  async verifyCartIconUpdated(): Promise<void> {
    // US add-on page has no BNB
    if (getRunConfig().siteCode === 'US') {
      return;
    }
    const count = await this.getBNBCartCount();
    const pass = count > 0;
    console.log(`[verifyCartIconUpdated] expected=more than 0 actual=${count} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'Cart icon not updated on the add-on page', pass, detail: `count ${count}` }], 'verifyCartIconUpdated');
  }

  /** Clicks Add on the first add-on product and returns its SKU. */
  async selectAddonOption(): Promise<string> {
    await prepareWebViewPage('bc', () => this.locator.addonSection, 10000);
    const button = await this.findAddItemButton();
    markFailedAndStop([{ label: 'No add-on Add button shown', pass: Boolean(button) }], 'selectAddonOption');
    const sku = await driver.execute(
      (el) => (el as unknown as HTMLElement).closest('[data-modelcode]')?.getAttribute('data-modelcode') ?? '',
      button!
    );
    await scrollAndJsClick(button!);
    console.log(`[selectAddonOption] add-on SKU=${sku}`);
    markFailedAndStop([{ label: 'Add-on SKU not found', pass: Boolean(sku) }], 'selectAddonOption');
    return sku;
  }

  private async findAddItemButton(): Promise<WebdriverIO.Element | undefined> {
    for (const button of await this.locator.addonAddItemButtons) {
      if (await isDisplayedOrFalse(button)) {
        return button;
      }
    }
    return undefined;
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
