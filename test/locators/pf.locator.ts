export class PfLocator {
  get productGrid() {
    return $$(`//android.view.View[@content-desc != '' and not(ancestor::android.widget.ImageView)
        and .//android.widget.ImageView[@content-desc != '']
      ]
      |
      //android.view.View[@content-desc != '' and not(ancestor::android.widget.ImageView)
        and .//android.widget.ImageView and .//android.widget.Button
      ]
    `);
  }

  /** Search result tab, e.g. "Products (10)", "Prodotti (10)". */
  get productCount() {
    return $(`//android.view.View[${this.productCountLabel}] | //android.view.View[contains(@content-desc, 'Total')]`);
  }

  private get productCountLabel() {
    return [
      'Products', 'Prodotti', 'Produits', 'Produkte', 'Productos', 'Produtos', 'Producten', 'Produkty',
      'Produkter', 'Produse', 'Termékek', 'Ürünler', 'Sản phẩm', 'สินค้า', 'Produk',
      '产品', '產品', '製品', 'المنتجات', 'מוצרים',
    ].map((label) => `starts-with(@content-desc, '${label} (')`).join(' or ');
  }

  pfCardTitle(card: WebdriverIO.Element) {
    return card.$(this.cardTitleSelector);
  }

  /** Immediate matches. `$().getAttribute` waits `waitforTimeout` when the node is absent. */
  pfCardTitles(card: WebdriverIO.Element) {
    return card.$$(this.cardTitleSelector);
  }

  private get cardTitleSelector() {
    return './/android.view.View[@content-desc != "" and @clickable="true"]';
  }

  /** Product image inside a matched card. */
  pfCardImage(card: WebdriverIO.Element) {
    return card.$('.//android.widget.ImageView[not(@content-desc)]');
  }

  /**
   * "add to wishlist" heart; its label carries the SKU ("Add to wishlist SM-A185FZKDEUB").
   * Without `sku`, the first one on PF.
   */
  wishlistIcon(sku = '') {
    const label = [
      ['Add', 'wishlist'],
      ['Ajouter', 'souhaits'],
      ['Agregar', 'favoritos'],
      ['Añadir', 'favoritos'],
      ['Tambahkan', 'keinginan'],
      ['Aggiungi', 'desideri'],
      ['hinzufügen', 'Wunschliste'],
      ['Agregar', 'deseos'],
      ['Voeg', 'verlanglijst'],
      ['Dodaj', 'życzeń'],
      ['Lägg till', 'önskelista'],
      ['เพิ่ม', 'รายการที่อยากได้'],
      ['Thêm', 'yêu thích'],
      ['Přidat', 'oblíbených'],
      ['新增', '願望清單'],
      ['adása', 'kívánságlist'],
      ['Adaugă', 'dorințe'],
      ['ekle', 'favori'],
      ['Adicionar', 'desejos'],
      ['添加', '至我的收藏'],
    ]
      .map(([a, b]) => `(contains(@content-desc, '${a}') and contains(@content-desc, '${b}'))`)
      .join(' or ');
    return $(`(//*[(self::android.widget.Button or self::android.view.View) and (${label}) and contains(@content-desc, '${sku}')])[1]`);
  }

  /**
   * "remove from wishlist" heart; its label carries the SKU.
   * Without `sku`, the first one on PF.
   */
  wishlistRemoveIcon(sku = '') {
    const label = [
      ['Remove', 'wishlist'],
      ['Supprimer', 'souhaits'],
      ['Eliminar', 'favoritos'],
      ['Hapus', 'keinginan'],
      ['Rimuovi', 'desideri'],
      ['entfernen', 'Wunschliste'],
      ['Eliminar', 'deseos'],
      ['Verwijder', 'verlanglijst'],
      ['Usuń', 'życzeń'],
      ['Ta bort', 'önskelista'],
      ['ลบ', 'รายการที่อยากได้'],
      ['Xóa', 'yêu thích'],
      ['Odebrat', 'přání'],
      ['移除', '願望清單'],
      ['eltávolítása', 'kívánságlist'],
      ['Elimină', 'dorințe'],
      ['kaldır', 'favori'],
      ['移除心', '愿单'],
      ['Remover', 'desejos'],
    ]
      .map(([a, b]) => `(contains(@content-desc, '${a}') and contains(@content-desc, '${b}'))`)
      .join(' or ');
    return $(`(//*[(self::android.widget.Button or self::android.view.View) and (${label}) and contains(@content-desc, '${sku}')])[1]`);
  }

  /** Login popup shown to a guest who taps the wishlist heart. */
  get loginConfirmModal() {
    return $(`//*[@class='android.view.View' and (
      normalize-space(@content-desc)='Log-in' or
      normalize-space(@content-desc)='Login' or
      normalize-space(@content-desc)='Connexion' or
      normalize-space(@content-desc)='Iniciar sesión' or
      normalize-space(@content-desc)='Se connecter' or
      normalize-space(@content-desc)='Accedi' or
      normalize-space(@content-desc)='登录' or
      normalize-space(@content-desc)='Anmelden' or
      normalize-space(@content-desc)='Inloggen/Account maken' or
      normalize-space(@content-desc)='Zaloguj się' or
      normalize-space(@content-desc)='Logga in' or
      normalize-space(@content-desc)='เข้าสู่ระบบ' or
      normalize-space(@content-desc)='登入' or
      normalize-space(@content-desc)='Đăng nhập' or
      normalize-space(@content-desc)='Přihlásit se' or
      normalize-space(@content-desc)='Bejelentkezés' or
      normalize-space(@content-desc)='Autentificare' or
      normalize-space(@content-desc)='התחברות' or
      normalize-space(@content-desc)='ログイン' or
      normalize-space(@content-desc)='Giriş yap'
    )]`);
  }

  /** Sort control beside the filter icon. */
  get sortIcon() {
    return $(
        `//android.widget.ImageView[${this.filtersIconLabel}]/following-sibling::${this.pfToolbarControl}[1]`
    );
  }

  /** Filter entry on PF: the control after the result total, or a Filters icon. */
  get filterIcon() {
    return $(
      `//android.widget.ImageView[${this.filtersIconLabel}]`
    );
  }

  /** Popup title carries the selected-filter count, e.g. "Filters (3)". */
  get filterPopup() {
    return $(`//android.view.View[${this.filterPopupLabel}]`);
  }

  /** Immediate matches. `$().isDisplayed` waits `waitforTimeout` when the popup is absent. */
  get filterPopups() {
    return $$(`//android.view.View[${this.filterPopupLabel}]`);
  }

  /** Apply button inside the filter popup, e.g. content-desc "Apply (3)". */
  get filterApplyButton() {
    return $(`//android.view.View[${this.filterPopupLabel}]//android.widget.Button[${this.applyButtonLabel}]`);
  }

  /** "Clear all" inside the filter popup. */
  get filterClearAllButton() {
    return $(`//android.view.View[${this.filterPopupLabel}]//android.widget.Button[contains(@content-desc, 'Clear all')]`);
  }

  /** Close control at the top of the filter popup. The chip remove icons sit deeper in the tree. */
  get filterPopupCloseButton() {
    return $(`//android.view.View[${this.filterPopupLabel}]/android.widget.ImageView[1]`);
  }

  private get filterPopupLabel() {
    return `(starts-with(@content-desc, 'Filter') or starts-with(@content-desc, '篩選')) and .//android.widget.Button`;
  }

  /** "Apply sort" inside the sort popup. The popup title is "Sort" plus a newline and the selected option. */
  get sortApplyButton() {
    return $(`//android.view.View[${this.sortPopupLabel}]//android.widget.Button[${this.applyButtonLabel}]`);
  }

  /** Sort popup root, e.g. "Sort\nĐược khuyến nghị". "Sort By" does not match that title. */
  private get sortPopupLabel() {
    return `starts-with(@content-desc, 'Sort') or starts-with(@content-desc, '排序')`;
  }

  private get applyButtonLabel() {
    return `contains(@content-desc, 'Apply') or contains(@content-desc, '送出')`;
  }

  private get filtersIconLabel() {
    return `contains(@content-desc,'Filters') or contains(@content-desc,'篩選')`;
  }

  private get pfToolbarControl() {
    return `*[self::android.widget.Button or self::android.widget.ImageView]`;
  }

  /** Section title inside the filter ScrollView. The option rows under it are checkboxes without a content-desc. */
  get priceFilter() {
    return $(`//android.widget.ScrollView//android.widget.ImageView[${this.priceFilterLabel}]`);
  }

  get productFilter() {
    return $(`//android.widget.ScrollView//android.widget.ImageView[${this.productFilterLabel}]`);
  }

  /** Unchecked checkboxes under the price section. */
  get priceOptions() {
    return $$(this.filterCheckboxSelector(this.priceFilterLabel));
  }

  /** Unchecked checkboxes under the product section. */
  get productOptions() {
    return $$(this.filterCheckboxSelector(this.productFilterLabel));
  }

  /** First enabled checkbox under that section. */
  get priceOption() {
    return this.filterCheckbox(this.priceFilterLabel);
  }

  get productOption() {
    return this.filterCheckbox(this.productFilterLabel);
  }

  /** Chip above the list, e.g. "Galaxy Z", shown after a checkbox is selected. */
  get selectedFilterChip() {
    return $(
      `//android.view.View[${this.filterPopupLabel}]/android.view.View[android.widget.ImageView]/android.view.View[@content-desc != '']`
    );
  }

  /** Price high-to-low option in the sort popup. */
  get priceHighToLowOption() {
    const label = [
      'High to Low', 'high to low', 'الأعلى للأقل','Von hoch nach niedrig', 'Prijs hoog - laag', 'Prix décroissant', 'Du plus cher au moins cher', 'mayor a menor', 
      'Mayor a menor', 'Cena od nejvyšší po nejnižší', 'de alto a bajo', 'décroissant', '由高至低', 'legmagasabbtól', 'Harga: Tinggi -> Rendah', 
      'da alto a basso', 'גבוה לנמוך', '価格が高い順', 'Od wysokiej do niskiej', 'mais alto', 'descrescător', 'Högt till lågt', 'Azalan Fiyat', 'Cao đến thấp',
    ].map((text) => `contains(@content-desc, '${text}')`).join(' or ');
    return $(`//android.view.View[${this.sortPopupLabel}]//android.view.View[${label}]`);
  }

  get ratingSortOption() {
    return $(`//android.view.View[@scrollable='true'][last()]//android.view.View[contains(@content-desc, 'Highest Rated')]`);
  }

  /** Price line inside a PF card. */
  cardPrice(card: WebdriverIO.Element) {
    return card.$(this.cardPriceSelector);
  }

  /** Immediate matches. `$().getAttribute` waits `waitforTimeout` when the node is absent. */
  cardPrices(card: WebdriverIO.Element) {
    return card.$$(this.cardPriceSelector);
  }

  private get cardPriceSelector() {
    const money = [
      '$', '€', '£', '¥', '₫', '⃁', 'NT$', 'HK$', 'AED', 'د.إ', 'ر.س', '﷼', 'Kč', 'Ft', 'lei', 'S/', 'zł', 'kr', 'Rp', 'RM', 'TL', '₹', '₪', '円', '₱', '฿',
    ].map((mark) => `contains(@content-desc, '${mark}')`).join(' or ');
    return `.//android.view.View[${money}]`;
  }

  private filterCheckbox(headerLabel: string) {
    return $(`(${this.filterCheckboxSelector(headerLabel)})[1]`);
  }

  private filterCheckboxSelector(headerLabel: string) {
    return `//android.widget.ScrollView//android.widget.ImageView[${headerLabel}]/following-sibling::android.view.View[1]//android.widget.CheckBox[@enabled='true' and @checked='false']`;
  }

  private get priceFilterLabel() {
    const titles = [
      'Price', 'Prijs', 'Preis', 'precios', '價錢', 'מחיר', '価格で絞る', 'Cena', 'Preț', 'Preço', 'Pris', 'ราคา', '價格', 'Khoảng Giá', 'Prix',
      'prix', 'نطاق السعر', 'Precio', 'Cenové', 'Árkategória', 'harga', 'prezzo', '価格で絞る', 'Cenowy', 'preço', 'prețuri', 'Fiyat', 'giá', '价格范围',
    ].map((label) => `contains(@content-desc, '${label}')`).join(' or ');
    return `(${titles}) and not(contains(@content-desc, 'High to Low')) and not(contains(@content-desc, 'high to low'))`;
  }

  private get productFilterLabel() {
    return [
      'مجموعة المنتجات','Product Range', 'Productgamma', 'Clase', 'Gamme de produits', '產品種類', 'Terméktípus', 'Ragam Produk', 'סדרות מוצרים', 
      'Gamma di prodotti', '製品カテゴリ', 'Gama de productos', 'Productassortiment', 'Gama de producto', 'Oferta produktów', 'Gama de produse', 
      'Produktsortiment', 'รุ่น', 'Ürün Çeşitleri', '類型', 'Phạm vi sản phẩm', 'Produktová řada', 'Serie',
    ].map((label) => `contains(@content-desc, '${label}')`).join(' or ');
  }

  /** "Continue" on the login popup — the first button after its title (loginConfirmModal), in every locale. */
  get loginPopupContinueButton() {
    return $(`(//*[@class='android.view.View' and (
      normalize-space(@content-desc)='Log-in' or
      normalize-space(@content-desc)='Login' or
      normalize-space(@content-desc)='Connexion' or
      normalize-space(@content-desc)='Iniciar sesión' or
      normalize-space(@content-desc)='Se connecter' or
      normalize-space(@content-desc)='Accedi' or
      normalize-space(@content-desc)='登录' or
      normalize-space(@content-desc)='Anmelden' or
      normalize-space(@content-desc)='Inloggen/Account maken' or
      normalize-space(@content-desc)='Zaloguj się' or
      normalize-space(@content-desc)='Logga in' or
      normalize-space(@content-desc)='เข้าสู่ระบบ' or
      normalize-space(@content-desc)='登入' or
      normalize-space(@content-desc)='Đăng nhập' or
      normalize-space(@content-desc)='Přihlásit se' or
      normalize-space(@content-desc)='Bejelentkezés' or
      normalize-space(@content-desc)='Autentificare' or
      normalize-space(@content-desc)='התחברות' or
      normalize-space(@content-desc)='ログイン' or
      normalize-space(@content-desc)='Giriş yap'
    )]/following-sibling::android.widget.Button)[1]`);
  }
}
