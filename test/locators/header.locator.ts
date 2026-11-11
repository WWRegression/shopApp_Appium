export type HeaderIcon = 'search' | 'back' | 'chat';

const contentDescContainsAny = (labels: readonly string[]) =>
  labels.map((label) => `@content-desc='${label}'`).join(' or ');

/** Back button labels (CN '返回') */
const BACK_LABELS = [
  'Back',
  'رجوع',
  'Zurück',
  'Terug',
  'Retour',
  'Arrière',
  'Atrás',
  '返回',
  'Retroceder',
  'Zpět',
  '上一頁',
  'Vissza',
  'Kembali',
  'Indietro',
  'Wstecz',
  'Voltar',
  'Înapoi',
  'กลับ',
  'Geri',
  'Tillbaka',
  'Quay lại',
] as const;

const SEARCH_LABELS = [
  'Search',
  'بحث',
  'Suche',
  'Zoeken',
  'Chercher',
  'Buscar',
  '搜索',
  'Hledat',
  'Rechercher',
  'Keresés',
  'Cari',
  'Cerca',
  'Szukaj',
  'Pesquisar',
  'ค้นหา',
  'Ara',
  'Sök',
  'Tìm kiếm',
] as const;

const CHAT_LABELS = [
  'Chat',
  'محادثة مع الدعم',
  'Chatten',
  'Clavarder',
  '客服',
  '實時對話',
  'Obrolan',
  'แชท',
  'Canlı destek',
  '聊天',
  'Chatta',
  'Trò chuyện',
] as const;

const BACK_BUTTON_PREDICATE = contentDescContainsAny(BACK_LABELS);
const SEARCH_BUTTON_PREDICATE = contentDescContainsAny(SEARCH_LABELS);
const CHAT_BUTTON_PREDICATE = contentDescContainsAny(CHAT_LABELS);

/**
 * First View under content FrameLayout with no content-desc and at least one direct Button.
 * Native header strip (Back / title / Search / Chat).
 */
export const HEADER_REGION_XPATH = `(//android.widget.FrameLayout[@resource-id='android:id/content']//android.view.View[(not(@content-desc) or @content-desc='') and ./android.widget.Button])[1]`;

/**
 * Native app header.
 * content-desc varies by locale, so keep a small set of representative labels.
 * Extend per-site if needed.
 */
export class HeaderLocator {
  get headerRegion() {
    return $(HEADER_REGION_XPATH);
  }

  /**
   * Page title in the header, under a content-desc-less View:
   * 1) Button / View[@content-desc]  (e.g. My Page)
   * 2) Button[@content-desc] without a titled child View  (e.g. Settings "Samsung\\nMy Page")
   * Also: header-direct View[@content-desc]  (e.g. Cart)
   */
  get headerTitle() {
    return $(
      `(
        ${HEADER_REGION_XPATH}/android.view.View[@content-desc]
        | ${HEADER_REGION_XPATH}/android.view.View/android.widget.Button/android.view.View[@content-desc]
        | ${HEADER_REGION_XPATH}/android.view.View/android.widget.Button[@content-desc and not(.//android.view.View[@content-desc])]
      )[1]`
    );
  }

  get backButton() {
    return $(`${HEADER_REGION_XPATH}/android.widget.Button[${BACK_BUTTON_PREDICATE}]`);
  }

  get searchButton() {
    return $(`${HEADER_REGION_XPATH}/android.widget.Button[${SEARCH_BUTTON_PREDICATE}]`);
  }

  get chatButton() {
    return $(`${HEADER_REGION_XPATH}/android.widget.Button[${CHAT_BUTTON_PREDICATE}]`);
  }

  get browserUrlBar() {
    return $(`//android.widget.EditText[@resource-id = 'com.android.chrome:id/url_bar']`);
  }

  icon(icon: HeaderIcon) {
    switch (icon) {
      case 'search':
        return this.searchButton;
      case 'back':
        return this.backButton;
      case 'chat':
        return this.chatButton;
    }
  }
}
