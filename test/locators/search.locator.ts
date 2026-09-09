export class SearchLocator {
  /**
   * No real EditText on this screen — it's a synthetic accessibility node. Tapping the
   * clickable Button parent opens the keyboard directly (confirmed on device).
   * Only the leading word translates (e.g. "Buscar field Double tap to enter search term")
   * — match the fixed English suffix instead of the full string.
   */
  get searchInput() {
    return $(
      "//android.view.View[contains(@content-desc, 'field Double tap to enter search term')]/parent::android.widget.Button"
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

  /** PF/search result card that mentions SKU or product name */
  productCardContaining(text: string) {
    return $(`//*[contains(@content-desc,"${text}") or contains(@text,"${text}")]`);
  }
}
