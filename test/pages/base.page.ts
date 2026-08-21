import { PopupLocator } from '../locators/popup.locator';
import { HeaderLocator, type HeaderIcon } from '../locators/header.locator';
import { BnbLocator, BNB_MENUS, type BnbMenu } from '../locators/bnb.locator';
import { switchToNative } from '../helpers/context.helper';
import { scrollUp } from '../helpers/gesture.helper';
import {
  clickElement,
  isDisplayedSafe,
  matchesText,
  getElementLabel,
} from '../helpers/element.helper';

export type { HeaderIcon, BnbMenu };

/**
 * Shared UI across all pages (Header, BNB, overlays).
 *
 * select*    — Header/BNB tab click (public, reveal via scrollUp if hidden)
 * matches*   — Header title / selected BNB comparison
 * dismiss*   — dismiss overlays
 * Context switching stays in context.helper.
 * Element primitives stay in element.helper.
 */
export class BasePage {
  protected readonly popupLocator = new PopupLocator();
  protected readonly headerLocator = new HeaderLocator();
  protected readonly bnbLocator = new BnbLocator();

  /** Popup */
  async dismissPopupIfShown(): Promise<void> {
    const closeButton = this.popupLocator.closeButton;
    if (await isDisplayedSafe(closeButton)) {
      await closeButton.click();
    }
  }

  async dismissCookieIfShown(): Promise<void> {
    const acceptButton = this.popupLocator.cookieAcceptButton;
    if (await isDisplayedSafe(acceptButton)) {
      await acceptButton.click();
    }
  }

  async dismissOverlays(): Promise<void> {
    await this.dismissPopupIfShown();
    await this.dismissCookieIfShown();
  }

  /** Switch to Native, dismiss overlays, then scroll up. */
  async prepareHeaderBnb(): Promise<void> {
    await switchToNative();
    await this.dismissOverlays();
    await scrollUp();
  }

  /** Header */
  async selectHeaderIcon(icon: HeaderIcon): Promise<void> {
    await this.prepareHeaderBnb();
    await clickElement(this.headerLocator.icon(icon));
  }

  async matchesHeaderTitle(expected: string | RegExp): Promise<boolean> {
    const title = (await this.getHeaderTitle()).trim();
    if (!title) {
      return false;
    }
    return matchesText(title, expected);
  }

  private async getHeaderTitle(): Promise<string> {
    await this.prepareHeaderBnb();
    return getElementLabel(this.headerLocator.title);
  }

  /** BNB */
  async selectBnbMenu(menu: BnbMenu): Promise<void> {
    await this.prepareHeaderBnb();
    await this.ensureBnbVisible(menu);
    await clickElement(this.bnbLocator.menu(menu));
  }

  async matchesBnbMenu(menu: BnbMenu): Promise<boolean> {
    await this.prepareHeaderBnb();
    return this.isBnbMenuMarkedSelected(menu);
  }

  async getSelectedBnbMenu(): Promise<BnbMenu | null> {
    await this.prepareHeaderBnb();

    for (const menu of BNB_MENUS) {
      if (await this.isBnbMenuMarkedSelected(menu)) {
        return menu;
      }
    }
    return null;
  }

  private async isBnbMenuMarkedSelected(menu: BnbMenu): Promise<boolean> {
    const element = this.bnbLocator.menu(menu);
    if (!(await isDisplayedSafe(element))) {
      return false;
    }

    const selected = await element.getAttribute('selected').catch(() => 'false');
    const checked = await element.getAttribute('checked').catch(() => 'false');
    if (selected === 'true' || checked === 'true') {
      return true;
    }

    const desc = await element.getAttribute('content-desc').catch(() => '');
    return /selected|선택됨|ausgewählt/i.test(desc ?? '');
  }

  private async ensureBnbVisible(menu: BnbMenu): Promise<void> {
    // prepareHeaderBnb() already performs one scrollUp(). If BNB is still hidden,
    // try to recover it by tapping a visible header icon.
    if (await isDisplayedSafe(this.bnbLocator.menu(menu))) {
      return;
    }

    // Some pages (e.g., checkout) don't show BNB at all. Recover BNB via a header icon.
    const recoverIcon = await this.getFirstVisibleHeaderIcon([
      'search',
      'back',
      'chat',
    ]);
    if (!recoverIcon) {
      throw new Error(`No header icon available to recover BNB: ${menu}`);
    }

    await this.selectHeaderIcon(recoverIcon);

    if (await isDisplayedSafe(this.bnbLocator.menu(menu))) {
      return;
    }

    throw new Error(`BNB is not visible: ${menu}`);
  }

  private async getFirstVisibleHeaderIcon(
    candidates: HeaderIcon[]
  ): Promise<HeaderIcon | null> {
    for (const icon of candidates) {
      const element = this.headerLocator.icon(icon);
      if (await isDisplayedSafe(element)) {
        return icon;
      }
    }
    return null;
  }
}
