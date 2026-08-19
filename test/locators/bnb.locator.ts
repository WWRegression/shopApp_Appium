export type BnbMenu = 'home' | 'shop' | 'offers' | 'cart' | 'account';

export const BNB_MENUS: BnbMenu[] = ['home', 'shop', 'offers', 'cart', 'account'];

/**
 * Native bottom navigation.
 * content-desc varies by locale, so keep representative labels.
 * Extend per-site if needed.
 */
export class BnbLocator {
  get homeButton() {
    return $(
      "//android.view.View[contains(@content-desc,'Home') or contains(@content-desc,'Start') or contains(@content-desc,'홈')]"
    );
  }

  get shopButton() {
    return $(
      "//android.view.View[contains(@content-desc,'Shop') or contains(@content-desc,'Einkaufen') or contains(@content-desc,'쇼핑')]"
    );
  }

  get offersButton() {
    return $(
      "//android.view.View[contains(@content-desc,'Offers') or contains(@content-desc,'Angebote') or contains(@content-desc,'혜택') or contains(@content-desc,'优惠')]"
    );
  }

  get cartButton() {
    return $(
      "//android.view.View[contains(@content-desc,'Cart') or contains(@content-desc,'Warenkorb') or contains(@content-desc,'购物车') or contains(@content-desc,'장바구니')]"
    );
  }

  get accountButton() {
    return $(
      "//android.view.View[contains(@content-desc,'Account') or contains(@content-desc,'Konto') or contains(@content-desc,'账户') or contains(@content-desc,'계정')]"
    );
  }

  menu(menu: BnbMenu) {
    switch (menu) {
      case 'home':
        return this.homeButton;
      case 'shop':
        return this.shopButton;
      case 'offers':
        return this.offersButton;
      case 'cart':
        return this.cartButton;
      case 'account':
        return this.accountButton;
    }
  }
}
