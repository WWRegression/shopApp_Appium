export type AddressTab = 'shipping' | 'billing';

/** Address book locators. Ported from Katalon's Address.groovy + Object Repository. */
export class MypageProfileLocator {
  // ── Native navigation (Account page → Address book) ──────────────────────

  /** Some sites show "Addresses" directly on the Account page — try before Settings. */
  get directAddressesMenuItem() {
    return $(`//*[contains(@content-desc, 'Addresses')]`);
  }

  get settingsIcon() {
    return $(`//android.widget.ImageView[contains(@content-desc, 'Settings')]`);
  }

  get personalDataManagementMenuItem() {
    return $(`//*[contains(@content-desc, 'Personal Data Management')]`);
  }

  /** Label varies by locale: Marketing Preferences / Manage Preferences / Edit Preferences / Address Management. */
  get addressManagementMenuItem() {
    return $(
      `//*[
        contains(@content-desc, 'Marketing')
        or contains(@content-desc, 'Address Management')
        or contains(@content-desc, 'Manage Preferences')
        or contains(@content-desc, 'Edit Preferences')
      ]`
    );
  }

  // ── WebView: address book page ────────────────────────────────────────────

  get pageContainer() {
    return $('div.address');
  }

  tab(tab: AddressTab) {
    const index = tab === 'shipping' ? '1' : '2';
    return $(`.mat-mdc-tab-labels div[aria-posinset='${index}'] div[data-an-tr='account-profile']`);
  }

  get deleteButton() {
    return $('button[data-an-la="address:delete"]');
  }

  get confirmDeleteButton() {
    return $('button[data-an-la="delete address:delete"], button[data-an-la="delete address:yes"]');
  }
}
