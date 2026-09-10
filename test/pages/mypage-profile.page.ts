import { BasePage } from './base.page';
import { MypageProfileLocator, AddressTab } from '../locators/mypage-profile.locator';
import { prepareWebViewPage, switchToNative } from '../helpers/context.helper';
import { isDisplayedSafe, jsClick } from '../helpers/element.helper';
import { scrollUntilVisible } from '../helpers/gesture.helper';
import { markFailed } from '../helpers/report.helper';

/** My Account > Settings > Personal Data Management > Addresses. Ported from Katalon's Address.groovy. */
export class MypageProfilePage extends BasePage {
  private readonly locator = new MypageProfileLocator();

  /** BNB mypage tab, then direct Addresses entry, or Settings > Personal Data Management > Addresses. */
  private async navigateToAddressManagement(): Promise<void> {
    await this.selectBnbMenu('mypage');

    if (await scrollUntilVisible(this.locator.directAddressesMenuItem, 3)) {
      await this.locator.directAddressesMenuItem.click();
      return;
    }

    if (await scrollUntilVisible(this.locator.settingsIcon)) {
      await this.locator.settingsIcon.click();
    }
    if (await scrollUntilVisible(this.locator.personalDataManagementMenuItem)) {
      await this.locator.personalDataManagementMenuItem.click();
    }
    if (await scrollUntilVisible(this.locator.addressManagementMenuItem)) {
      await this.locator.addressManagementMenuItem.click();
    }
  }

  /** Address book renders at the same URL as 'mypageProfile' — reuses that page key. */
  async prepareAddressPage(): Promise<void> {
    await this.navigateToAddressManagement();
    const ready = await prepareWebViewPage('mypageProfile', this.locator.pageContainer);
    markFailed([{ label: 'address page reached', pass: ready }], 'prepareAddressPage');
  }

  async activateTab(tab: AddressTab): Promise<void> {
    const target = this.locator.tab(tab);
    if (await isDisplayedSafe(target)) {
      await target.click();
    }
  }

  /** Deletes every address card in the active tab. No iteration cap — mochaOpts.timeout guards runaway loops. */
  private async deleteAllInActiveTab(): Promise<void> {
    for (;;) {
      const deleteBtn = this.locator.deleteButton;
      if (!(await deleteBtn.isDisplayed().catch(() => false))) {
        break;
      }

      try {
        await jsClick(deleteBtn);
      } catch {
        // Element can go stale between isDisplayed() and click() — retry with a fresh query.
        continue;
      }

      const confirmBtn = this.locator.confirmDeleteButton;
      if (await confirmBtn.isDisplayed().catch(() => false)) {
        await jsClick(confirmBtn).catch(() => undefined);
        await confirmBtn.waitForDisplayed({ timeout: 3000, reverse: true }).catch(() => undefined);
      }
    }
  }

  /** Deletes all Shipping and Billing addresses. Call prepareAddressPage() first. */
  async clearAllAddresses(): Promise<void> {
    await this.activateTab('shipping');
    await this.deleteAllInActiveTab();
    markFailed(
      [{ label: 'shipping addresses cleared', pass: !(await this.locator.deleteButton.isDisplayed().catch(() => false)) }],
      'clearAllAddresses'
    );

    await this.activateTab('billing');
    await this.deleteAllInActiveTab();
    markFailed(
      [{ label: 'billing addresses cleared', pass: !(await this.locator.deleteButton.isDisplayed().catch(() => false)) }],
      'clearAllAddresses'
    );

    await switchToNative();
  }
}
