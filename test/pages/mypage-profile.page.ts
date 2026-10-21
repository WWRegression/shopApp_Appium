import { BasePage } from './base.page';
import { MypageProfileLocator, AddressTab } from '../locators/mypage-profile.locator';
import { MypageLocator } from '../locators/mypage.locator';
import { prepareWebViewPage, switchToNative } from '../helpers/context.helper';
import { isDisplayedOrFalse, jsClick, scrollUntilVisible } from '../helpers/element.helper';
import { markFailedAndStop } from '../helpers/report.helper';
import { currentSiteCode } from '../helpers/tc-filter.helper';
import { clearSavedAddresses } from '../helpers/api.helper';

/** My Account > Settings > Personal Data Management > Addresses. */
export class MypageProfilePage extends BasePage {
  private readonly locator = new MypageProfileLocator();
  private readonly mypageLocator = new MypageLocator();

  /** BNB mypage tab, then direct Addresses entry, or Settings > Personal Data Management > Addresses. */
  private async navigateToAddressManagement(): Promise<void> {
    await this.selectBnbMenu('mypage');

    if (await scrollUntilVisible(this.locator.directAddressesMenuItem, 3)) {
      await this.locator.directAddressesMenuItem.click();
      return;
    }

    if (await scrollUntilVisible(this.mypageLocator.settingsMenu)) {
      await this.mypageLocator.settingsMenu.click();
    }
    if (await scrollUntilVisible(this.mypageLocator.personalDataManagementMenu)) {
      await this.mypageLocator.personalDataManagementMenu.click();
    }
    if (await scrollUntilVisible(this.locator.addressManagementMenuItem)) {
      await this.locator.addressManagementMenuItem.click();
    }
  }

  /** Address book renders at the same URL as 'mypageProfile' — reuses that page key. */
  async prepareAddressPage(): Promise<void> {
    // AU app has no address book screen; clearAllAddresses deletes through the API there
    if (currentSiteCode() === 'AU') {
      return;
    }
    await this.navigateToAddressManagement();
    const ready = await prepareWebViewPage('mypageProfile', () => this.locator.pageContainer);
    markFailedAndStop([{ label: 'address page reached', pass: ready }], 'prepareAddressPage');
  }

  async activateTab(tab: AddressTab): Promise<void> {
    const target = this.locator.tab(tab);
    if (await isDisplayedOrFalse(target)) {
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
    // AU app has no address book screen, so the saved addresses are deleted through the API
    if (currentSiteCode() === 'AU') {
      await clearSavedAddresses();
      return;
    }
    // An empty address book shows only app-empty-address, with no tabs to clear
    if (await this.locator.emptyAddressBook.isExisting().catch(() => false)) {
      console.log('[clearAllAddresses] address book already empty');
      await switchToNative();
      return;
    }
    await this.activateTab('shipping');
    await this.deleteAllInActiveTab();
    markFailedAndStop(
      [{ label: 'shipping addresses cleared', pass: !(await this.locator.deleteButton.isDisplayed().catch(() => false)) }],
      'clearAllAddresses'
    );

    await this.activateTab('billing');
    await this.deleteAllInActiveTab();
    markFailedAndStop(
      [{ label: 'billing addresses cleared', pass: !(await this.locator.deleteButton.isDisplayed().catch(() => false)) }],
      'clearAllAddresses'
    );

    await switchToNative();
  }
}
