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

  get productCount() {
    return $(`//android.view.View[
      starts-with(@content-desc, 'Products (')
      or starts-with(@content-desc, '产品 (')
    ]`);
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
    return $(`(//*[(self::android.widget.Button or self::android.view.View) and (
        (contains(@content-desc, 'Add') and contains(@content-desc, 'wishlist'))
        or (contains(@content-desc, 'Ajouter') and contains(@content-desc, 'souhaits'))
        or (contains(@content-desc, 'Agregar') and contains(@content-desc, 'favoritos'))
        or (contains(@content-desc, 'Añadir') and contains(@content-desc, 'favoritos'))
        or (contains(@content-desc, 'Tambahkan') and contains(@content-desc, 'keinginan'))
        or (contains(@content-desc, 'Aggiungi') and contains(@content-desc, 'desideri'))
        or (contains(@content-desc, '添加') and contains(@content-desc, '愿望清单'))
        or (contains(@content-desc, 'hinzufügen') and contains(@content-desc, 'Wunschliste'))
        or (contains(@content-desc, 'Agregar') and contains(@content-desc, 'deseos'))
        or (contains(@content-desc, 'Voeg') and contains(@content-desc, 'verlanglijst'))
        or (contains(@content-desc, 'Dodaj') and contains(@content-desc, 'życzeń'))
        or (contains(@content-desc, 'Lägg till') and contains(@content-desc, 'önskelista'))
        or (contains(@content-desc, 'เพิ่ม') and contains(@content-desc, 'รายการที่อยากได้'))
        or (contains(@content-desc, 'Thêm') and contains(@content-desc, 'yêu thích'))
        or (contains(@content-desc, 'Přidat') and contains(@content-desc, 'oblíbených'))
        or (contains(@content-desc, '新增') and contains(@content-desc, '願望清單'))
        or (contains(@content-desc, 'adása') and contains(@content-desc, 'kívánságlist'))
        or (contains(@content-desc, 'Adaugă') and contains(@content-desc, 'dorințe'))
        or (contains(@content-desc, 'ekle') and contains(@content-desc, 'favori'))
        or (contains(@content-desc, '加入心') and contains(@content-desc, '愿单'))
        or (contains(@content-desc, 'Adicionar') and contains(@content-desc, 'desejos'))
        or (contains(@content-desc, '添加') and contains(@content-desc, '至我的收藏'))
      ) and contains(@content-desc, '${sku}')])[1]`);
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
      `//android.view.View[${this.resultTotalLabel}]/following-sibling::${this.pfToolbarControl}[2]` +
        ` | //android.widget.ImageView[${this.filtersIconLabel}]/following-sibling::${this.pfToolbarControl}[1]`
    );
  }

  /** Filter entry on PF: the control after the result total, or a Filters icon. */
  get filterIcon() {
    return $(
      `//android.view.View[${this.resultTotalLabel}]/following-sibling::${this.pfToolbarControl}[1]` +
        ` | //android.widget.ImageView[${this.filtersIconLabel}]`
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
    const titles = [
      'فرز بحسب', 'ترتيب حسب', 'Trier par', 'Ordenar por', '排序方式', 'Seřadit podle', 'Rendezés',
      'Urut berdasarkan', 'Ordina per', 'Filtrează după', 'เรียงตาม', 'Sırala', '排序', 'Sắp xếp theo',
      'מיון לפי', '並び替え',
    ].map((text) => `contains(@content-desc, '${text}')`).join(' or ');
    return `starts-with(@content-desc, 'Sort') or ${titles}`;
  }

  private get applyButtonLabel() {
    return [
      'Apply', 'تطبيق', 'Anwenden', 'Toepassen', 'Appliquer', 'Aplicar', '应用', 'Použít', '確認',
      'Alkalmazás', 'Tetapkan', 'Applica', '適用する', 'Zastosuj', 'Aplică', 'Tillämpa', 'ใช้', 'Uygula', '送出', 'Áp dụng', 'החל',
    ].map((text) => `contains(@content-desc, '${text}')`).join(' or ');
  }

  private get resultTotalLabel() {
    return [
      'Total', 'الإجمالي', 'Gesamt', 'ทั้งหมด', '总计', 'Celkem', '總計', 'Összesen', 'Totale', 'Totaal',
      'Razem', 'Totalt', 'Toplam', '總共', 'Tổng', 'תוצאות', '合計 ',
    ].map((label) => `contains(@content-desc, '${label}')`).join(' or ');
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

  get resolutionFilter() {
    return $(`//android.widget.ScrollView//android.widget.ImageView[${this.resolutionFilterLabel}]`);
  }

  /** Unchecked checkboxes under the price section. */
  get priceOptions() {
    return $$(this.filterCheckboxSelector(this.priceFilterLabel));
  }

  /** Unchecked checkboxes under the product section. */
  get productOptions() {
    return $$(this.filterCheckboxSelector(this.productFilterLabel));
  }

  /** Unchecked checkboxes under the resolution section. */
  get resolutionOptions() {
    return $$(this.filterCheckboxSelector(this.resolutionFilterLabel));
  }

  /** First enabled checkbox under that section. */
  get priceOption() {
    return this.filterCheckbox(this.priceFilterLabel);
  }

  get productOption() {
    return this.filterCheckbox(this.productFilterLabel);
  }

  get resolutionOption() {
    return this.filterCheckbox(this.resolutionFilterLabel);
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
      'High to Low', 'high to low', 'mayor a menor', 'الأعلى للأقل', 'Von hoch nach niedrig', 'élevé à bas',
      '价格从高到低', 'nejvyšší po nejnižší', 'alto a bajo', 'décroissant', '由高至低', 'legmagasabbtól',
      'Tinggi -> Rendah', 'alto a basso', 'hoog - laag', 'wysokiej do niskiej', 'descrescător', 'Högt till lågt',
      'Azalan', 'Cao đến thấp', 'מהגבוה לנמוך', 'mais alto', '高い順', 'plus cher',
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
      '$', '€', '£', '¥', '₩', '₱', '₫', 'NT$', 'HK$', 'AED', 'د.إ', 'SAR', 'ر.س', '﷼', 'Kč', 'Ft', 'lei',
      'S/', 'zł', 'kr', '฿', '₺', 'Rp', 'RM', 'TL', '₹', '₪', '円',
    ].map((mark) => `contains(@content-desc, '${mark}')`).join(' or ');
    return `.//android.view.View[${money}]`;
  }

  /** Rating line inside a PF card, e.g. "4.9/5(9999+)". */
  cardRating(card: WebdriverIO.Element) {
    return card.$(this.cardRatingSelector);
  }

  /** Immediate matches. `$().getAttribute` waits `waitforTimeout` when the node is absent. */
  cardRatings(card: WebdriverIO.Element) {
    return card.$$(this.cardRatingSelector);
  }

  private get cardRatingSelector() {
    return `.//android.widget.ImageView[contains(@content-desc, '/5') or contains(@content-desc, 'Rating')]`;
  }

  private filterCheckbox(headerLabel: string) {
    return $(`(${this.filterCheckboxSelector(headerLabel)})[1]`);
  }

  private filterCheckboxSelector(headerLabel: string) {
    return `//android.widget.ScrollView//android.widget.ImageView[${headerLabel}]/following-sibling::android.view.View[1]//android.widget.CheckBox[@enabled='true' and @checked='false']`;
  }

  private get priceFilterLabel() {
    const titles = [
      'Price', 'Preis', 'Precio', 'Prix', 'Prijs', '价格', '價格', '價錢', 'Cenové', 'Árkategória', 'harga',
      'prezzo', 'السعر', 'Prisklass', 'ราคา', 'Fiyat', 'giá', 'מחיר', '価格', 'Preço', 'Preț', 'Cena',
    ].map((label) => `contains(@content-desc, '${label}')`).join(' or ');
    return `(${titles}) and not(contains(@content-desc, 'High to Low')) and not(contains(@content-desc, 'high to low'))`;
  }

  private get productFilterLabel() {
    return [
      'Product Range', 'Produktsortiment', 'Gamme de produits', 'Gama de producto', '产品类型', 'Produktová',
      '產品種類', 'Terméktípus', 'Ragam Produk', 'Gamma di prodotti', 'Productassortiment', 'Oferta produktów',
      'Gama de produse', 'Ürün Çeşitleri', 'Phạm vi sản phẩm', 'סדרות', '製品カテゴリ', 'Serie', 'Clase', 'Formfaktor',
    ].map((label) => `contains(@content-desc, '${label}')`).join(' or ');
  }

  private get resolutionFilterLabel() {
    return [
      'Resolution', 'Résolution', 'Rozlišení', 'Resolución', '解析度', 'Resolusi', 'Risoluzione', 'Felbontás',
      'Auflösung', 'rozdzielczość', 'Rezoluție', 'دقة', 'ความละเอียด', 'Çözünürlük', '分辨率', 'Độ Phân Giải', '解像度',
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
