export class SearchLocator {
  /**
   * No real EditText on this screen — it's a synthetic accessibility node. Tapping the
   * clickable Button parent opens the keyboard directly (confirmed on device).
   * Only the leading word translates (e.g. "Buscar field Double tap to enter search term")
   * — match the fixed English suffix instead of the full string.
   */
  get searchInput() {
    return $(this.searchInputSelector);
  }

  /** Immediate matches. `$().isDisplayed` waits `waitforTimeout` when the search screen is not open. */
  get searchInputs() {
    return $$(this.searchInputSelector);
  }

  private get searchInputSelector() {
    return [
      "//android.view.View[contains(@content-desc, 'field Double tap to enter search term')]/parent::android.widget.Button",
      "//android.view.View[contains(@content-desc, '搜索')]/parent::android.widget.Button",
      // CN search screen: the field itself is "Search  " and is not inside a Button
      "//android.view.View[normalize-space(@content-desc)='Search' or normalize-space(@content-desc)='搜索']",
      // IN shows the newer search bar (with a microphone) whose input is a real EditText
      '//android.widget.EditText',
    ].join(' | ');
  }

  get searchSubmitButton() {
    return $(
      "//android.widget.Button[contains(@content-desc,'Search') or contains(@content-desc,'Suche') or @content-desc='Go']"
    );
  }

  get searchResults() {
    return $('//android.widget.ScrollView | //androidx.recyclerview.widget.RecyclerView');
  }

  get recentKeywords() {
    return $$(
      `//android.view.View[@content-desc != '' and @clickable='true'][
        following-sibling::*[1][self::android.widget.ImageView][@clickable='true'][not(@content-desc) or @content-desc='']
      ]`
    );
  }

  get recentKeywordDeleteButtons() {
    return $$(
      `//android.widget.ImageView[@clickable='true'][not(@content-desc) or @content-desc=''][
        preceding-sibling::*[1][self::android.view.View][@content-desc != '' and @clickable='true']
      ]`
    );
  }

  /** Empty-result message on the search screen. */
  get noResultMessage() {
    const phrases = [
      'Try a new search or the below suggestions',
      '尝试进行新搜索或查看以下建议',
      'no matches were found',
      'عذراً، لم يتم العثور على نتائج مطابقة.',
      'Désolé, aucun résultat trouvé.',
      'Lo sentimos, no hay resultados que coincidan con tu búsqueda.',
      'Vaya, no hemos encontrado ninguna coincidencia.',
      'Maaf, tidak ada hasil yang ditemukan.',
      'Spiacente, non sono state trovate corrispondenze',
      'Leider wurden keine passenden Ergebnisse gefunden.',
      'Sorry, er zijn geen overeenkomsten gevonden.',
      'Niestety, nie znaleziono pasujących wyników.',
      'Tyvärr hittades inga resultat.',
      'ขออภัย ไม่พบผลลัพธ์',
      '很抱歉，找不到任何相符結果。',
      'Rất tiếc, không tìm thấy kết quả phù hợp.',
      'Omlouváme se, nebyly nalezeny žádné shody.',
      '很抱歉，找不到任何匹配結果。',
      'Sajnáljuk, nincs találat.',
      'Lo sentimos, no se encontraron resultados.',
      'Ne pare rău, nu au fost găsite potriviri.',
      'Eşleşme bulunamadı.',
      '抱歉，未找到匹配项。',
      'Sorry, er zijn geen resultaten gevonden.',
      "Désolé, aucun résultat n'a été trouvé.",
      ' לא נמצאו תוצאות תואמות',
      'Não foram encontrados resultados',
      'Try a new search or the below suggestions',
    ].map((phrase) => `contains(@content-desc, "${phrase}")`).join(' or ');
    return $(`//android.view.View[${phrases}]`);
  }

  /** Clickable rows under Suggested Searches. Related products is not clickable. */
  get suggestedCategories() {
    return $$(`(${this.suggestedSearchHeading})/following-sibling::android.view.View[@content-desc != '' and @clickable='true']`);
  }

  private get suggestedSearchHeading() {
    return this.suggestionHeading([
      ['推荐搜索'],
      ['عن', 'ابحث'],
      ['Suggested', 'Searches'],
      ['Suggested', 'searches'],
      ['Vorgeschlagene', 'Suchanfragen'],
      ['Recherches', 'suggérées'],
      ['Búsquedas', 'sugeridas'],
      ['推薦', '搜索'],
      ['Doporučená', 'vyhledávání'],
      ['Búsquedas', 'recomendadas'],
      ['搜尋', '建議'],
      ['Javasolt', 'keresések'],
      ['Saran', 'Pencarian'],
      ['Ricerche', 'suggerite'],
      ['Voorgestelde', 'zoekopdrachten'],
      ['Căutări', 'sugerate'],
      ['คำค้นหาที่', 'แนะนํา'],
      ['คำค้นหาที่แนะนํา'],
      ['Önerilen', 'Aramalar'],
      ['建議', '搜尋'],
      ['Tìm kiếm', 'được đề xuất'],
      ['Föreslagna', 'sökningar'],
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
