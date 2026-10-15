export class PfLocator {
  get productGrid() {
    return $$(`//android.view.View[@content-desc != '' and not(ancestor::android.widget.ImageView)
        and .//android.widget.ImageView[@content-desc != '']
      ]
      |
      //android.view.View[@content-desc != '' and not(ancestor::android.widget.ImageView)
        and .//android.widget.ImageView and .//android.widget.Button
      ]
    `);
  }

  get productCount() {
    return $(`//android.view.View[
      starts-with(@content-desc, 'Products (')
      or starts-with(@content-desc, '产品 (')
    ]`);
  }

  pfCardTitle(card: WebdriverIO.Element) {
    return card.$('.//android.view.View[@content-desc != "" and @clickable="true"]');
  }

  /** Product image inside a matched card. */
  pfCardImage(card: WebdriverIO.Element) {
    return card.$('.//android.widget.ImageView[not(@content-desc)]');
  }

  /**
   * "add to wishlist" heart; its label carries the SKU ("Add to wishlist SM-A185FZKDEUB").
   * Without `sku`, the first one on PF.
   */
  wishlistIcon(sku = '') {
    return $(`(//*[(self::android.widget.Button or self::android.view.View) and (
        (contains(@content-desc, 'Add') and contains(@content-desc, 'wishlist'))
        or (contains(@content-desc, 'Ajouter') and contains(@content-desc, 'souhaits'))
        or (contains(@content-desc, 'Agregar') and contains(@content-desc, 'favoritos'))
        or (contains(@content-desc, 'Añadir') and contains(@content-desc, 'favoritos'))
        or (contains(@content-desc, 'Tambahkan') and contains(@content-desc, 'keinginan'))
        or (contains(@content-desc, 'Aggiungi') and contains(@content-desc, 'desideri'))
        or (contains(@content-desc, '添加') and contains(@content-desc, '愿望清单'))
        or (contains(@content-desc, 'hinzufügen') and contains(@content-desc, 'Wunschliste'))
        or (contains(@content-desc, 'Agregar') and contains(@content-desc, 'deseos'))
        or (contains(@content-desc, 'Voeg') and contains(@content-desc, 'verlanglijst'))
        or (contains(@content-desc, 'Dodaj') and contains(@content-desc, 'życzeń'))
        or (contains(@content-desc, 'Lägg till') and contains(@content-desc, 'önskelista'))
        or (contains(@content-desc, 'เพิ่ม') and contains(@content-desc, 'รายการที่อยากได้'))
        or (contains(@content-desc, 'Thêm') and contains(@content-desc, 'yêu thích'))
        or (contains(@content-desc, 'Přidat') and contains(@content-desc, 'přání'))
        or (contains(@content-desc, '新增') and contains(@content-desc, '願望清單'))
        or (contains(@content-desc, 'adása') and contains(@content-desc, 'kívánságlist'))
        or (contains(@content-desc, 'Adaugă') and contains(@content-desc, 'dorințe'))
        or (contains(@content-desc, 'ekle') and contains(@content-desc, 'favori'))
        or (contains(@content-desc, '加入心') and contains(@content-desc, '愿单'))
        or (contains(@content-desc, 'Adicionar') and contains(@content-desc, 'desejos'))
        or (contains(@content-desc, '添加') and contains(@content-desc, '至我的收藏'))
      ) and contains(@content-desc, '${sku}')])[1]`);
  }

  /** Login popup shown to a guest who taps the wishlist heart. */
  get loginConfirmModal() {
    return $(`//*[@class='android.view.View' and (
      normalize-space(@content-desc)='Log-in' or
      normalize-space(@content-desc)='Login' or
      normalize-space(@content-desc)='Connexion' or
      normalize-space(@content-desc)='Iniciar sesión' or
      normalize-space(@content-desc)='Se connecter' or
      normalize-space(@content-desc)='Accedi' or
      normalize-space(@content-desc)='登录' or
      normalize-space(@content-desc)='Anmelden' or
      normalize-space(@content-desc)='Inloggen/Account maken' or
      normalize-space(@content-desc)='Zaloguj się' or
      normalize-space(@content-desc)='Logga in' or
      normalize-space(@content-desc)='เข้าสู่ระบบ' or
      normalize-space(@content-desc)='登入' or
      normalize-space(@content-desc)='Đăng nhập' or
      normalize-space(@content-desc)='Přihlásit se' or
      normalize-space(@content-desc)='Bejelentkezés' or
      normalize-space(@content-desc)='Autentificare' or
      normalize-space(@content-desc)='Giriş yap'
    )]`);
  }

  /** "Continue" on the login popup — the first button after its title (loginConfirmModal), in every locale. */
  get loginPopupContinueButton() {
    return $(`(//*[@class='android.view.View' and (
      normalize-space(@content-desc)='Log-in' or
      normalize-space(@content-desc)='Login' or
      normalize-space(@content-desc)='Connexion' or
      normalize-space(@content-desc)='Iniciar sesión' or
      normalize-space(@content-desc)='Se connecter' or
      normalize-space(@content-desc)='Accedi' or
      normalize-space(@content-desc)='登录' or
      normalize-space(@content-desc)='Anmelden' or
      normalize-space(@content-desc)='Inloggen/Account maken' or
      normalize-space(@content-desc)='Zaloguj się' or
      normalize-space(@content-desc)='Logga in' or
      normalize-space(@content-desc)='เข้าสู่ระบบ' or
      normalize-space(@content-desc)='登入' or
      normalize-space(@content-desc)='Đăng nhập' or
      normalize-space(@content-desc)='Přihlásit se' or
      normalize-space(@content-desc)='Bejelentkezés' or
      normalize-space(@content-desc)='Autentificare' or
      normalize-space(@content-desc)='Giriş yap'
    )]/following-sibling::android.widget.Button)[1]`);
  }
}
