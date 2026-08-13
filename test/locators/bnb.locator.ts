/**
 * Native bottom navigation.
 * content-desc는 locale마다 다르므로 대표 라벨만 포함. 부족하면 site별 확장.
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
}
