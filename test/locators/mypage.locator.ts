export const DASHBOARD_MENUS = ['rewards', 'vouchers', 'wishlist'] as const;

export type DashboardMenu = (typeof DASHBOARD_MENUS)[number];

export class MypageLocator {
  menuButton(label: string) {
    return $(`//android.widget.ImageView[contains(@content-desc, '${label}')]`);
  }
  
  get subMenuItems() {
    return $$('//android.view.View[@content-desc and .//android.widget.ImageView]');
  }

  /** Katalon LogIn/mypageLoginBtn — English, DE; CN '登录' matched exactly since the CN logout button '退出登录' contains it */
  get loginButton() {
    return $(
      `//*[contains(@content-desc, 'Log-in')
      or contains(@content-desc, 'Login')
      or contains(@content-desc, 'Anmelden')
      or contains(@content-desc, '登录')
      or contains(@content-desc, 'تسجيل الدخول')
      or contains(@content-desc, 'Inloggen')
      or contains(@content-desc, 'Se connecter')
      or contains(@content-desc, 'Connexion')
      or contains(@content-desc, 'Iniciar sesión')
      or contains(@content-desc, 'Přihlásit se')
      or contains(@content-desc, '登入')
      or contains(@content-desc, 'Bejelentkezés')
      or contains(@content-desc, 'התחברות')
      or contains(@content-desc, 'Accedi')
      or contains(@content-desc, 'ログイン')
      or contains(@content-desc, 'Inloggen/Account maken')
      or contains(@content-desc, 'Zaloguj się')
      or contains(@content-desc, 'Autentificare')
      or contains(@content-desc, 'Logga in')
      or contains(@content-desc, 'เข้าสู่ระบบ')
      or contains(@content-desc, 'Giriş yap')
      or contains(@content-desc, 'Đăng nhập')]`
    );
  }

  /** Katalon LogIn/mypageLogoutBtn — English, DE, CN ('退出登录') */
  get logoutButton() {
    return $(
      `//*[contains(@content-desc, 'Logout')
      or contains(@content-desc, 'Log out')
      or contains(@content-desc, 'Abmelden')
      or contains(@content-desc, 'Ausloggen')
      or contains(@content-desc, 'Abmeldung')
      or contains(@content-desc, '退出')
      or contains(@content-desc, 'تسجيل الخروج')
      or contains(@content-desc, 'Afmelden')
      or contains(@content-desc, 'Se déconnecter')
      or contains(@content-desc, 'Déconnexion')
      or contains(@content-desc, 'Cerrar sesión')
      or contains(@content-desc, 'Odhlášení')
      or contains(@content-desc, '登出')
      or contains(@content-desc, 'Kijelentkezés')
      or contains(@content-desc, 'Keluar')
      or contains(@content-desc, 'התנתקות')
      or contains(@content-desc, 'Disconnetti')
      or contains(@content-desc, 'ログアウト')
      or contains(@content-desc, 'Salir')
      or contains(@content-desc, 'Wyloguj się')
      or contains(@content-desc, 'Deconectare')
      or contains(@content-desc, 'تسجيل خروج')
      or contains(@content-desc, 'Logga ut')
      or contains(@content-desc, 'ออกจากระบบ')
      or contains(@content-desc, 'Çıkış yap')
      or contains(@content-desc, 'Đăng xuất')]`
    );
  }

  /** Katalon LogIn/mypageLogoutOkayBtn — logout confirm dialog (Okay is index 2, followed by Cancel; index alone also hits the header Chat button) */
  get logoutOkayButton() {
    return $(`//android.widget.Button[@index = '2' and following-sibling::android.widget.Button]`);
  }

  /** Katalon MyAccount/MenuDashboard/samsungrewards — Rewards points on the My Page dashboard, e.g. "0 / Points" (English), "10 / 星钻" (CN) */
  get rewardsPoints() {
    return $(
      `//android.view.View[
        @content-desc = "b"
        or @content-desc = "P"
        or contains(@content-desc, "Body")
        or contains(@content-desc, "Poin")
        or contains(@content-desc, "Points")
        or contains(@content-desc, "Puncte")
        or contains(@content-desc, "Pont")
        or contains(@content-desc, "Pontok")
        or contains(@content-desc, "Punkte")
        or contains(@content-desc, "Punkty")
        or contains(@content-desc, "Punten")
        or contains(@content-desc, "Puntos")
        or contains(@content-desc, "Punti")
        or contains(@content-desc, "Poäng")
        or contains(@content-desc, "Récompenses Samsung")
        or contains(@content-desc, "Rewards")
        or contains(@content-desc, "Samsung hűségprogram")
        or contains(@content-desc, "rewards")
        or contains(@content-desc, "Điểm")
        or contains(@content-desc, "คะแนน")
        or contains(@content-desc, "نقاط المكافآت")
        or contains(@content-desc, "مكافآت سامسونج")
        or contains(@content-desc, "ซัมซุงรีวอร์ด")
        or contains(@content-desc, "星钻")
        or contains(@content-desc, "點數")
        or contains(@content-desc, "我的星钻")
        or contains(@content-desc, "ポイント")
        or contains(@content-desc, "Pontos")
        or contains(@content-desc, "積分")
      ]`
    );
  }

  /** Katalon MyAccount/MenuDashboard/samsungRewardBadge — "Join Samsung Rewards" tooltip (English, CN) */
  get joinRewardsTooltip() {
    return $(`//android.view.View[@content-desc = 'Join Samsung Rewards' or @content-desc = '加入 Samsung Rewards']`);
  }

  /** Katalon MyAccount/rewardsPointsWebView — points on the Samsung Rewards web page, e.g. "0 P" (global), "10" (CN) */
  get rewardsPagePoints() {
    return $('strong.js-point-info, .rewards-points-balance > span:first-of-type');
  }

  /** Katalon MyAccount/MenuDashboard/vouchers — Vouchers on the My Page dashboard */
  get vouchers() {
    return $(
      `//android.view.View[
        contains(@content-desc, "Vouchers")
        or contains(@content-desc, "Bons")
        or contains(@content-desc, "قسائم")
        or contains(@content-desc, "Mis Cupones")
        or contains(@content-desc, "Cupones")
        or contains(@content-desc, "Mes coupons")
        or contains(@content-desc, "I tuoi codici sconto")
        or contains(@content-desc, "Tegoedbonnen")
        or contains(@content-desc, "优惠券")
        or contains(@content-desc, "Kupony")
        or contains(@content-desc, "Kuponger")
        or contains(@content-desc, "Phiếu mua hàng")
        or contains(@content-desc, "Gutscheine")
        or contains(@content-desc, "คูปอง")
        or contains(@content-desc, "slevové kódy")
        or contains(@content-desc, "Kuponkódok")
        or contains(@content-desc, "Vouchere")
        or contains(@content-desc, "Hediye çekleri")
        or contains(@content-desc, "Codes promo")
        or contains(@content-desc, "クーポン")
        or contains(@content-desc, "優惠券")
        or contains(@content-desc, "Códigos")
        or contains(@content-desc, "שוברים")
        or contains(@content-desc, "Coupons")
      ]`
    );
  }

  /** Katalon MyAccount/MenuDashboard/wishlist — Wishlist on the My Page dashboard */
  get wishlist() {
    return $(
      `//android.view.View[
        contains(@content-desc, "Wishlist")
        or contains(@content-desc, "Liste d'envies")
        or contains(@content-desc, "Mis Favoritos")
        or contains(@content-desc, "Lista de deseos")
        or contains(@content-desc, "Favoritos")
        or contains(@content-desc, "Mes favoris")
        or contains(@content-desc, "Lista dei desideri")
        or contains(@content-desc, "Productos favoritos")
        or contains(@content-desc, "Verlanglijstje")
        or contains(@content-desc, "我的收藏")
        or contains(@content-desc, "Lista życzeń")
        or contains(@content-desc, "Önskelista")
        or contains(@content-desc, "Danh sách yêu thích")
        or contains(@content-desc, "Wunschliste")
        or contains(@content-desc, "สินค้าที่สนใจ")
        or contains(@content-desc, "Oblíbené")
        or contains(@content-desc, "Kívánságlista")
        or contains(@content-desc, "Listă de dorințe")
        or contains(@content-desc, "Favorilerim")
        or contains(@content-desc, "Liste d’envies")
        or contains(@content-desc, "お気に入り")
        or contains(@content-desc, "מועדפים")
      ]`
    );
  }

  dashboardMenu(menu: DashboardMenu) {
    switch (menu) {
      case 'rewards':
        return this.rewardsPoints;
      case 'vouchers':
        return this.vouchers;
      case 'wishlist':
        return this.wishlist;
    }
  }

  /** Katalon MyAccount/VerifyMenu/samsungRewards — Rewards tab selected on the page opened from the dashboard */
  get rewardsTab() {
    return $(
      `//android.widget.HorizontalScrollView//android.view.View[@selected = 'true' and (
        contains(@content-desc, "Body")
        or contains(@content-desc, "Poin")
        or contains(@content-desc, "Points")
        or contains(@content-desc, "Pont")
        or contains(@content-desc, "Pontok")
        or contains(@content-desc, "Punkte")
        or contains(@content-desc, "Punkty")
        or contains(@content-desc, "Puncte")
        or contains(@content-desc, "Punten")
        or contains(@content-desc, "Puntos")
        or contains(@content-desc, "Punti")
        or contains(@content-desc, "Poäng")
        or contains(@content-desc, "Récompenses Samsung")
        or contains(@content-desc, "Rewards")
        or contains(@content-desc, "Samsung hűségprogram")
        or contains(@content-desc, "rewards")
        or contains(@content-desc, "Điểm")
        or contains(@content-desc, "คะแนน")
        or contains(@content-desc, "نقاط المكافآت")
        or contains(@content-desc, "مكافآت سامسونج")
        or contains(@content-desc, "ซัมซุงรีวอร์")
        or contains(@content-desc, "星钻")
        or contains(@content-desc, "點數")
        or contains(@content-desc, "我的星钻")
        or contains(@content-desc, "リワード")
      )]`
    );
  }

  /** Katalon MyAccount/VerifyMenu/vouchers — Vouchers tab selected on the page opened from the dashboard */
  get vouchersTab() {
    return $(
      `//android.widget.HorizontalScrollView//android.view.View[@selected = 'true' and (
        contains(@content-desc, "Vouchers")
        or contains(@content-desc, "Bons")
        or contains(@content-desc, "قسائم")
        or contains(@content-desc, "Mis Cupones")
        or contains(@content-desc, "Cupones")
        or contains(@content-desc, "Mes coupons")
        or contains(@content-desc, "I tuoi codici sconto")
        or contains(@content-desc, "Tegoedbonnen")
        or contains(@content-desc, "优惠券")
        or contains(@content-desc, "Kupony")
        or contains(@content-desc, "Kuponger")
        or contains(@content-desc, "Phiếu mua hàng")
        or contains(@content-desc, "Gutscheine")
        or contains(@content-desc, "คูปอง")
        or contains(@content-desc, "slevové kódy")
        or contains(@content-desc, "Kuponkódok")
        or contains(@content-desc, "Vouchere")
        or contains(@content-desc, "Hediye çekleri")
        or contains(@content-desc, "Codes promo")
        or contains(@content-desc, "クーポン")
        or contains(@content-desc, "優惠券")
        or contains(@content-desc, "Códigos")
        or contains(@content-desc, "שוברים")
        or contains(@content-desc, "Coupons")
      )]`
    );
  }

  /** Katalon MyAccount/VerifyMenu/wishlist — Wishlist tab selected on the page opened from the dashboard */
  get wishlistTab() {
    return $(
      `//android.widget.HorizontalScrollView//android.view.View[@selected = 'true' and (
        contains(@content-desc, "Wishlist")
        or contains(@content-desc, "Liste d'envies")
        or contains(@content-desc, "Mis Favoritos")
        or contains(@content-desc, "Lista de deseos")
        or contains(@content-desc, "Favoritos")
        or contains(@content-desc, "Mes favoris")
        or contains(@content-desc, "Lista dei desideri")
        or contains(@content-desc, "Productos favoritos")
        or contains(@content-desc, "Verlanglijstje")
        or contains(@content-desc, "我的收藏")
        or contains(@content-desc, "Lista życzeń")
        or contains(@content-desc, "Önskelista")
        or contains(@content-desc, "Danh sách yêu thích")
        or contains(@content-desc, "Wunschliste")
        or contains(@content-desc, "สินค้าที่สนใจ")
        or contains(@content-desc, "Oblíbené")
        or contains(@content-desc, "Kívánságlista")
        or contains(@content-desc, "Listă de dorințe")
        or contains(@content-desc, "Favorilerim")
        or contains(@content-desc, "Liste d’envies")
        or contains(@content-desc, "お気に入り")
        or contains(@content-desc, "מועדפים")
      )]`
    );
  }

  dashboardMenuTab(menu: DashboardMenu) {
    switch (menu) {
      case 'rewards':
        return this.rewardsTab;
      case 'vouchers':
        return this.vouchersTab;
      case 'wishlist':
        return this.wishlistTab;
    }
  }

  /** Currently selected tab in the tab row of the page opened from the dashboard (read for the actual value in logs) */
  get selectedDashboardTab() {
    return $(`//android.widget.HorizontalScrollView//android.view.View[@selected = 'true']`);
  }

  /** Katalon MyAccount/profiles — profile card showing every word of the account name; CN by its greeting ('欢迎光临') since it shows a random "sa_…" nickname */
  profileCard(accountName: string) {
    const hasName =
      accountName
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => `contains(@content-desc, '${word}')`)
        .join(' and ') || 'false()';
    return $(`//android.widget.ImageView[(${hasName}) or contains(@content-desc, '欢迎光临')]`);
  }
}
