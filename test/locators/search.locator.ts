import { HEADER_REGION_XPATH } from './header.locator';

export class SearchLocator {
  /**
   * Search field in the header region (not the header Search icon Button).
   * Often a synthetic a11y View whose clickable Button parent opens the keyboard
   * (e.g. "Buscar field Double tap to enter search term"); IN uses a real EditText.
   */
  get searchInput() {
    return $(this.searchInputSelector);
  }

  /** Immediate matches. `$().isDisplayed` waits `waitforTimeout` when the search area is not open. */
  get searchInputs() {
    return $$(this.searchInputSelector);
  }

  private get searchInputSelector() {
    // Under header only: EditText (IN) or View whose desc contains search/搜索 (not the Search icon Button).
    return (
      `${HEADER_REGION_XPATH}//android.widget.EditText` +
      ` | ${HEADER_REGION_XPATH}//android.view.View[` +
      `contains(translate(@content-desc,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'search')` +
      ` or contains(@content-desc,'搜索')]`
    );
  }

  get searchSubmitButton() {
    return $(
      "//android.widget.Button[contains(@content-desc,'Search') or contains(@content-desc,'Suche') or @content-desc='Go']"
    );
  }

  get searchResults() {
    return $('//android.widget.ScrollView | //androidx.recyclerview.widget.RecyclerView');
  }

  /**
   * Recent-searches section (both layouts):
   * - content-desc="Recent searches" (keywords + per-row X only)
   * - content-desc="Recent searches\nClear all" (section itself is Clear all)
   */
  private get recentSearchesSection() {
    const headings = [
      'Recent searches',
      'Recent Searches',
      'Nedávná vyhledávání',
      '最近の検索',
      'عمليات البحث الأخيرة',
      'Aktuelle Suchanfragen',
      'Recente zoekopdrachten',
      'Recherches récentes',
      'Búsquedas recientes',
      'Suchverlauf',
      '最近搜尋',
      '最近搜索',
      'Legutóbbi keresések',
      'Pencarian Terbaru',
      'חיפושים אחרונים',
      'Ricerche recenti',
      'Ostatnie wyszukiwania',
      'Pesquisas recentes',
      'Căutări recente',
      'Senaste sökningar',
      'การค้นหาล่าสุด',
      'Arama geçmişi',
      'Tìm kiếm gần đây',
    ]
      .map((heading) => `contains(@content-desc, '${heading}')`)
      .join(' or ');
    return `//android.view.View[${headings}]`;
  }

  /** Keyword chip under Recent searches (View + empty-desc X ImageView siblings). */
  get recentKeywords() {
    return $$(
      `(${this.recentSearchesSection})//android.view.View[@content-desc != '' and @clickable='true'][
        following-sibling::*[1][self::android.widget.ImageView][@clickable='true' and (not(@content-desc) or @content-desc='')]
      ]`
    );
  }

  /** Per-row X under Recent searches (not Related Searches rows). */
  get recentKeywordDeleteButtons() {
    return $$(
      `(${this.recentSearchesSection})//android.widget.ImageView[@clickable='true' and (not(@content-desc) or @content-desc='')][
        preceding-sibling::*[1][self::android.view.View][@content-desc != '' and @clickable='true']
      ]`
    );
  }

  /** Empty-result message on the search screen. */
  get noResultMessage() {
    const phrases = [
      'Try a new search or the below suggestions',
      '尝试进行新搜索或查看以下建议',
    ].map((phrase) => `contains(@content-desc, "${phrase}")`).join(' or ');
    return $(`//android.view.View[${phrases}]`);
  }

  /**
   * First Popular/Trending/Recommended chip under the section heading.
   * - Popular Searches: clickable android.view.View children
   * - Recommended Search: clickable android.widget.ImageView children
   */
  get trendingKeyword() {
    return $(
      `(${this.popularSearchesHeading})/*[
        (self::android.view.View or self::android.widget.ImageView)
        and @clickable='true' and @content-desc != ''
      ][1]`
    );
  }

  /** Locale section title that wraps the popular/trending/recommended keyword chips. */
  private get popularSearchesHeading() {
    const headings = [
      'Popular Searches',
      'Trending Searches',
      'Oblíbená vyhledávání',
      '検索で人気の製品',
      'Beliebte Suchanfragen',
      'Beliebte Suchbegriffe',
      'عمليات البحث الشائعة',
      'Populaire zoekopdrachten',
      'Recherches populaires',
      'Búsquedas populares',
      '熱門搜尋',
      'Gyakori keresések',
      'Pencarian Populer',
      ' חיפושים פופולריים',
      'Ricerche popolari',
      'Popularne wyszukiwania',
      'Pesquisas mais populares',
      'Căutări populare',
      'Populära sökningar',
      'การค้นหายอดนิยม',
      'Popüler aramalar',
      'Tìm kiếm phổ biến',
      '热门搜索',
    ]
      .map((heading) => `@content-desc='${heading}'`)
      .join(' or ');
    return `//android.view.View[${headings}]`;
  }

  /** Clickable rows under Suggested Searches. Related products is not clickable. */
  get suggestedCategories() {
    return $$(`(${this.suggestedSearchHeading})/following-sibling::android.view.View[@content-desc != '' and @clickable='true']`);
  }

  private get suggestedSearchHeading() {
    return this.suggestionHeading([
      ['推荐搜索'],
      ['عن', 'ابحث'],
      ['Suggested', 'searches'],
      ['Vorgeschlagene', 'Suchanfragen'],
      ['Recherches', 'suggérées'],
      ['Búsquedas', 'sugeridas'],
      ['Doporučená', 'vyhledávání'],
      ['Búsquedas', 'recomendadas'],
      ['Javasolt', 'keresések'],
      ['Saran', 'Pencarian'],
      ['Ricerche', 'suggerite'],
      ['Voorgestelde', 'zoekopdrachten'],
      ['Önerilen', 'Aramalar'],
      ['Tìm kiếm', 'được đề xuất'],
      ['Föreslagna', 'sökningar'],
      ['חיפושים', 'מוצעים'],
      ['おすすめの', '検索結果'],
      ['Sugerowane', 'wyszukiwania'],
      ['Pesquisas', 'sugeridas'],
    ]);
  }

  /** One content-desc, or every part of a pair, on the suggestion heading. */
  private suggestionHeading(labels: string[][]): string {
    const clauses = labels.map((parts) =>
      parts.length === 1
        ? `@content-desc='${parts[0]}'`
        : parts.map((part) => `contains(@content-desc, '${part}')`).join(' and ')
    );
    return `//android.view.View[${clauses.map((clause) => `(${clause})`).join(' or ')}]`;
  }

  /** PF/search result card that mentions SKU or product name */
  productCardContaining(text: string) {
    return $(`//*[contains(@content-desc,"${text}") or contains(@text,"${text}")]`);
  }
}
