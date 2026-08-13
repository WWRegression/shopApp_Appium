export class SearchLocator {
  get searchInput() {
    return $('//android.widget.EditText');
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
