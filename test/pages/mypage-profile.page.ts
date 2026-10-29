/// <reference lib="dom" />
import { BasePage } from './base.page';
import { CheckoutPage } from './checkout.page';
import { MypageProfileLocator, AddressTab } from '../locators/mypage-profile.locator';
import { MypageLocator } from '../locators/mypage.locator';
import { getSiteData } from '../../config/site';
import { prepareWebViewPage, switchToNative } from '../helpers/context.helper';
import { clickElement, isDisplayedOrFalse, jsClick, scrollUntilVisible } from '../helpers/element.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';
import { currentSiteCode } from '../helpers/tc-filter.helper';
import { clearSavedAddresses } from '../helpers/api.helper';

/** My Account > Settings > Personal Data Management > Addresses. */
export class MypageProfilePage extends BasePage {
  private readonly locator = new MypageProfileLocator();
  private readonly mypageLocator = new MypageLocator();
  private readonly checkoutPage = new CheckoutPage();

  /** BNB mypage tab, then direct Addresses entry, or Settings > Personal Data Management > Addresses. */
  private async navigateToAddressManagement(): Promise<void> {
    await this.selectBnbMenu('mypage');

    if (await scrollUntilVisible(this.locator.directAddressesMenuItem, 3)) {
      await clickElement(this.locator.directAddressesMenuItem);
      return;
    }

    for (const menu of [this.mypageLocator.settingsMenu, this.mypageLocator.personalDataManagementMenu, this.locator.addressManagementMenuItem]) {
      if (await scrollUntilVisible(menu)) {
        await clickElement(menu);
      }
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

  /** Selects the Shipping / Billing tab; false when the tab is not shown (an empty address book has no tabs). */
  async activateTab(tab: AddressTab): Promise<boolean> {
    const target = this.locator.tab(tab);
    if (!(await isDisplayedOrFalse(target))) {
      return false;
    }
    await clickElement(target);
    return true;
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

  /** Deletes every saved address through the API, then the reloaded address book must be empty. Call prepareAddressPage() first. */
  async deleteAllAddressesByApi(): Promise<void> {
    await clearSavedAddresses();
    const empty = await prepareWebViewPage('mypageProfile', () => this.locator.emptyAddressBook, 15000);
    console.log(`[deleteAllAddressesByApi] expected=empty address book actual=${empty ? 'empty' : 'addresses still shown'} result=${empty ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'address book not empty after deleting all addresses', pass: empty }], 'deleteAllAddressesByApi');
  }

  /** Opens the add form on the tab, fills it with the site address and the given phone, and saves it. */
  async addAddress(tab: AddressTab, phone: string): Promise<void> {
    // Sites without a Billing tab keep one address for both (an empty book shows no tabs, so only Billing is checked)
    if (!(await this.activateTab(tab)) && tab === 'billing') {
      console.log('[addAddress] no Billing tab on this site — skipped');
      return;
    }
    await markFailedAndStop(
      () => clickElement(this.locator.addAddressButton, { timeout: 5000 }),
      `[addAddress] Add address button not found on the ${tab} tab`
    );
    await this.fillAddressForm(phone);
    await this.clickSaveAddress();
  }

  /** Opens the first card's edit form on the tab, changes only the phone and saves it. */
  async editAddressPhone(tab: AddressTab, phone: string): Promise<void> {
    if (!(await this.activateTab(tab))) {
      console.log(`[editAddressPhone] no ${tab} tab on this site — skipped`);
      return;
    }
    await markFailedAndStop(
      () => clickElement(this.locator.editAddressButton, { timeout: 5000 }),
      `[editAddressPhone] Edit button not found on the ${tab} tab`
    );
    const shown = await this.locator.addressForm.waitForExist({ timeout: 10000 }).then(() => true, () => false);
    markFailedAndStop([{ label: 'address edit form not shown', pass: shown }], 'editAddressPhone');
    await this.checkoutPage.fillFormFields(this.locator.addressFormSelector, [[phone, ['phone']]]);
    await this.clickSaveAddress();
  }

  /** Fills the open address form with the site customer and shipping data, using the given phone. */
  private async fillAddressForm(phone: string): Promise<void> {
    const form = this.locator.addressFormSelector;
    const shown = await this.locator.addressForm.waitForExist({ timeout: 10000 }).then(() => true, () => false);
    markFailedAndStop([{ label: 'address form not shown', pass: shown }], 'fillAddressForm');

    const { customer, shipping } = getSiteData();
    // A picked address suggestion fills the fields below it, so afterwards only the empty ones are typed
    const picked = await this.checkoutPage.pickSuggestedAddress(form, shipping.searchText);
    await this.checkoutPage.fillFormFields(
      form,
      [
        [customer.firstName, ['firstname', 'fullname']],
        [customer.lastName, ['lastname']],
        [customer.email, ['email']],
        [phone, ['phone']],
        [shipping.address1, ['line1']],
        [shipping.address2, ['line2', 'suburb', 'kecamatan', 'județ']],
        [shipping.postalCode, ['postalcode']],
        [shipping.town, ['town']],
        [shipping.district, ['state', 'district']],
        [shipping.searchText, ['regioniso', 'searchaddress']],
      ],
      { onlyEmpty: picked }
    );
  }

  /** Saves the address form and waits for it to close. */
  private async clickSaveAddress(): Promise<void> {
    await jsClick(this.locator.saveAddressButton).catch(() => console.log('[clickSaveAddress] Save button not found'));
    await this.locator.addressForm.waitForExist({ timeout: 10000, reverse: true }).catch(() => undefined);
  }

  /** A card on the tab must show the postal code and the phone (digits only, so a country prefix or spaces do not matter). */
  async verifyAddressCard(tab: AddressTab, phone: string): Promise<void> {
    if (!(await this.activateTab(tab)) && tab === 'billing') {
      console.log('[verifyAddressCard] no Billing tab on this site — skipped');
      return;
    }
    const postalCode = getSiteData().shipping.postalCode ?? '';
    const phoneDigits = phone.replace(/\D/g, '');
    let cards: string[] = [];
    const pass = await driver
      .waitUntil(
        async () => {
          cards = await this.getAddressCardTexts();
          return cards.some((card) => card.includes(postalCode) && card.replace(/\D/g, '').includes(phoneDigits));
        },
        { timeout: 10000, interval: 500 }
      )
      .then(() => true, () => false);
    const actual = cards.length > 0 ? cards.join(' | ') : 'no address card';
    console.log(`[verifyAddressCard] ${tab} expected card with "${postalCode}" and phone ${phone} actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: `${tab} address card not shown with phone ${phone}`, pass, detail: actual }], 'verifyAddressCard');
  }

  /** Text of every address card on the active tab, read in one browser call. */
  private async getAddressCardTexts(): Promise<string[]> {
    return driver.execute(
      (selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)).map((el) => el.innerText.replace(/\n/g, ' / ')),
      this.locator.addressCardInfoSelector
    );
  }
}
