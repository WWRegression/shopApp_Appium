export type HeaderIcon = 'search' | 'back' | 'chat';

/**
 * Native app header.
 * content-desc varies by locale, so keep a small set of representative labels.
 * Extend per-site if needed.
 */
export class HeaderLocator {
  get title() {
    return $(
      [
        "//android.widget.TextView[contains(@resource-id,'toolbar') or contains(@resource-id,'Toolbar')]",
        "//android.widget.TextView[contains(@resource-id,'title') or contains(@resource-id,'Title')]",
        "//android.view.ViewGroup[contains(@resource-id,'toolbar') or contains(@resource-id,'appbar') or contains(@resource-id,'header')]//android.widget.TextView",
      ].join(' | ')
    );
  }

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

  get chatButton() {
    return $(
      "//*[self::android.widget.Button or self::android.widget.ImageView or self::android.view.View][contains(@content-desc,'Chat') or contains(@content-desc,'채팅') or contains(@content-desc,'聊天')]"
    );
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
