export class HeaderLocator {
  get searchButton() {
    return $(
      "//android.widget.Button[contains(@content-desc,'Search') or contains(@content-desc,'Suche') or contains(@content-desc,'Buscar') or contains(@content-desc,'搜索') or contains(@content-desc,'검색')]"
    );
  }

  get backButton() {
    return $(
      "//android.widget.Button[contains(@content-desc,'Back') or contains(@content-desc,'Zurück') or contains(@content-desc,'뒤로')]"
    );
  }
}
