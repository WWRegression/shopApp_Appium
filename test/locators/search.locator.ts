export class SearchLocator {
  /**
   * No real EditText on this screen — it's a synthetic accessibility node. Tapping the
   * clickable Button parent opens the keyboard directly (confirmed on device).
   * Only the leading word translates (e.g. "Buscar field Double tap to enter search term")
   * — match the fixed English suffix instead of the full string.
   */
  get searchInput() {
    return $(
      [
        "//android.view.View[contains(@content-desc, 'field Double tap to enter search term')]/parent::android.widget.Button",
        "//android.view.View[contains(@content-desc, '搜索')]/parent::android.widget.Button",
        // IN shows the newer search bar (with a microphone) whose input is a real EditText
        '//android.widget.EditText',
      ].join(' | ')
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

  /** PF/search result card that mentions SKU or product name */
  productCardContaining(text: string) {
    return $(`//*[contains(@content-desc,"${text}") or contains(@text,"${text}")]`);
  }
}
