export type AddressTab = 'shipping' | 'billing';

/** Address book locators. */
export class MypageProfileLocator {
  // ── Native navigation (Account page → Address book) ──────────────────────

  /** Some sites show "Addresses" directly on the Account page — try before Settings. */
  get directAddressesMenuItem() {
    return $(`//*[contains(@content-desc, 'Addresses')]`);
  }

  /** Label varies by locale: Marketing Preferences / Manage Preferences / Edit Preferences / Address Management. */
  get addressManagementMenuItem() {
    return $(
      `//*[
        contains(@content-desc, 'Marketing')
        or contains(@content-desc, 'Préférences marketing')
        or contains(@content-desc, 'تفضيلات التسويق')
        or contains(@content-desc, 'Preferencias de marketing')
        or contains(@content-desc, 'Preferensi Pemasaran')
        or contains(@content-desc, 'Modifica le tue preferenze')
        or contains(@content-desc, 'Editar preferencias')
        or contains(@content-desc, 'Marketingvoorkeuren')
        or contains(@content-desc, '地址管理')
        or contains(@content-desc, 'Preferencje marketingowe')
        or contains(@content-desc, 'Inställningar för marknadsföring')
        or contains(@content-desc, 'Tùy chọn Tiếp thị')
        or contains(@content-desc, 'Adress- & Marketing-Einstellungen')
        or contains(@content-desc, '行銷偏好設定')
        or contains(@content-desc, 'การตั้งค่าด้านการตลาด')
        or contains(@content-desc, 'Předvolby marketingu')
        or contains(@content-desc, 'Präferenzen bearbeiten')
        or contains(@content-desc, 'Marketingmegkeresésekkel kapcsolatos beállítások')
        or contains(@content-desc, 'Editați preferințele')
        or contains(@content-desc, 'Pazarlama Tercihleri')
        or contains(@content-desc, '編輯偏好')
        or contains(@content-desc, 'マーケティング通信')
        or contains(@content-desc, 'Os meus pedidos')
        or contains(@content-desc, 'העדפות שיווקיות')
        or contains(@content-desc, 'Address Management')
        or contains(@content-desc, 'Manage Preferences')
        or contains(@content-desc, 'Edit Preferences')
      ]`
    );
  }

  // ── WebView: address book page ────────────────────────────────────────────

  get pageContainer() {
    return $('div.address, app-empty-address');
  }

  get emptyAddressBook() {
    return $('app-empty-address');
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
