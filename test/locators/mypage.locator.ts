import { BACK_BUTTON_XPATH } from './header.locator';

export const DASHBOARD_MENUS = ['rewards', 'vouchers', 'wishlist'] as const;

export type DashboardMenu = (typeof DASHBOARD_MENUS)[number];

/** Katalon MyPage.GroupedMenuList.MenuProduct — menus below the dashboard (My Products ~ My Addresses) */
export const PRODUCT_MENUS = [
  'myProducts',
  'myOrders',
  'myRepairs',
  'myReferrals',
  'myQRCode',
  'inbox',
  'mySmartThings',
  'orderSupport',
  'myAddresses',
] as const;

export type ProductMenu = (typeof PRODUCT_MENUS)[number];

export type MypageMenu = DashboardMenu | ProductMenu;

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
      or @content-desc='登录'
      or contains(@content-desc, 'تسجيل الدخول')
      or contains(@content-desc, 'Inloggen')
      or contains(@content-desc, 'Se connecter')
      or @content-desc='Connexion'
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
      or @content-desc='Déconnexion'
      or contains(@content-desc, 'Cerrar sesión')
      or @content-desc='退出登录'
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

  /** Currently selected tab in the tab row of a page opened from My Page (e.g. My Orders, Vouchers) */
  get selectedMypageTab() {
    return $(`//android.widget.HorizontalScrollView//android.view.View[@selected = 'true']`);
  }

  /** Katalon MyAccount/MenuProduct/myProducts (US) */
  get myProducts() {
    return $(`//android.view.View[@content-desc = "My Products"]`);
  }

  /** Katalon MyAccount/MenuProduct/myorders */
  get myOrders() {
    return $(
      `//android.view.View[
        contains(@content-desc, "Orders")
        or contains(@content-desc, "Mes commandes")
        or contains(@content-desc, "تتبع طلباتي")
        or contains(@content-desc, "pedidos")
        or contains(@content-desc, "pedido")
        or contains(@content-desc, "Pesanan")
        or contains(@content-desc, "I miei ordini")
        or contains(@content-desc, "Volg bestelling")
        or contains(@content-desc, "我的订单")
        or contains(@content-desc, "Moje zamówienia")
        or contains(@content-desc, "طلباتي")
        or contains(@content-desc, "Mina beställningar")
        or contains(@content-desc, "Đơn hàng của tôi")
        or contains(@content-desc, "Meine Bestellungen")
        or contains(@content-desc, "我的訂單")
        or contains(@content-desc, "คำสั่งซื้อของฉัน")
        or contains(@content-desc, "Moje objednávky")
        or contains(@content-desc, "Rendeléseim követése")
        or contains(@content-desc, "Comenzile mele")
        or contains(@content-desc, "Siparişleri takip et")
        or contains(@content-desc, "orders")
        or contains(@content-desc, "ההזמנות שלי")
        or contains(@content-desc, "注文履歴")
        or @content-desc = "Order"
      ]`
    );
  }

  /** Katalon MyAccount/MenuProduct/myrepairs (CN shows "服务支持") */
  get myRepairs() {
    return $(
      `//android.view.View[
        contains(@content-desc, "Repairs")
        or contains(@content-desc, "Repair")
        or contains(@content-desc, "Mes réparations")
        or contains(@content-desc, "تتبّع معاملة الإصلاح الخاصة بي")
        or contains(@content-desc, "Mi reparación")
        or contains(@content-desc, "Mes Services")
        or contains(@content-desc, "Layanan Perbaikan")
        or contains(@content-desc, "Le mie riparazioni")
        or contains(@content-desc, "Mijn reparatie")
        or contains(@content-desc, "服务支持")
        or contains(@content-desc, "Moje naprawy")
        or contains(@content-desc, "تتبع الإصلاح الخاص بي")
        or contains(@content-desc, "Mina reparationer")
        or contains(@content-desc, "Sửa chữa của tôi")
        or contains(@content-desc, "檢視服務紀錄")
        or contains(@content-desc, "การซ่อมแซมของฉัน")
        or contains(@content-desc, "Meine Reparaturen")
        or contains(@content-desc, "Moje opravy")
        or contains(@content-desc, "我的維修")
        or contains(@content-desc, "Javítás követése")
        or contains(@content-desc, "Reparațiile mele")
        or contains(@content-desc, "Tamir takibi")
        or contains(@content-desc, "Reparatur")
        or contains(@content-desc, "repair")
        or contains(@content-desc, "修理")
        or contains(@content-desc, "As minhas reparações")
      ]`
    );
  }

  /** Katalon MyAccount/MenuProduct/myreferrals */
  get myReferrals() {
    return $(
      `//android.view.View[
        contains(@content-desc, 'My Referrals')
        or contains(@content-desc, 'My Referral')
        or contains(@content-desc, 'Mis referidos')
        or contains(@content-desc, 'Moje polecenia')
        or contains(@content-desc, 'การแนะนำของฉัน')
        or contains(@content-desc, 'Mes Recommandations')
        or contains(@content-desc, 'ترشيحي')
      ]
      | //android.widget.ImageView[contains(@content-desc, 'My Referral')]`
    );
  }

  /** Katalon MyAccount/MenuProduct/myqrcode */
  get myQRCode() {
    return $(`//android.view.View[contains(@content-desc, 'QR') and .//android.widget.ImageView]`);
  }

  /** Katalon MyAccount/MenuProduct/inbox */
  get inbox() {
    return $(
      `//android.view.View[(
        contains(@content-desc, "Inbox")
        or contains(@content-desc, "Boîte de réception")
        or contains(@content-desc, "Notificaciones")
        or contains(@content-desc, "Incluido en la caja")
        or contains(@content-desc, "Bandeja de entrada")
        or contains(@content-desc, "Kotak Masuk")
        or contains(@content-desc, "Messaggi")
        or contains(@content-desc, "Notification")
        or contains(@content-desc, "消息通知")
        or contains(@content-desc, "Skrzynka odbiorcza")
        or contains(@content-desc, "الرسائل الواردة")
        or contains(@content-desc, "Inkorg")
        or contains(@content-desc, "Hộp thư")
        or contains(@content-desc, "Posteingang")
        or contains(@content-desc, "收件匣")
        or contains(@content-desc, "กล่องข้อความ")
        or contains(@content-desc, "Doručená pošta")
        or contains(@content-desc, "Üzenetek")
        or contains(@content-desc, "Căsuță de inbox")
        or contains(@content-desc, "Bildirimler")
        or contains(@content-desc, "Benachrichtigung")
        or contains(@content-desc, "As minhas notificações")
        or contains(@content-desc, "תיבת הודעות")
        or contains(@content-desc, "通知")
        or contains(@content-desc, "Notificação")
      ) and .//android.widget.ImageView]`
    );
  }

  /** Katalon MyAccount/MenuProduct/mySmartThings */
  get mySmartThings() {
    return $(`//android.view.View[contains(@content-desc, "SmartThings")]`);
  }

  /** Katalon MyAccount/MenuProduct/orderSupport (IN) */
  get orderSupport() {
    return $(`//android.view.View[contains(@content-desc, 'Support')]`);
  }

  /** Katalon MyAccount/MenuProduct/myAddresses (IN) */
  get myAddresses() {
    return $(`//android.view.View[contains(@content-desc, 'Addresses')]`);
  }

  productMenu(menu: ProductMenu) {
    switch (menu) {
      case 'myProducts':
        return this.myProducts;
      case 'myOrders':
        return this.myOrders;
      case 'myRepairs':
        return this.myRepairs;
      case 'myReferrals':
        return this.myReferrals;
      case 'myQRCode':
        return this.myQRCode;
      case 'inbox':
        return this.inbox;
      case 'mySmartThings':
        return this.mySmartThings;
      case 'orderSupport':
        return this.orderSupport;
      case 'myAddresses':
        return this.myAddresses;
    }
  }

  /** Back button of a page opened from My Page — My Page itself has none */
  get subPageBackButton() {
    return $(BACK_BUTTON_XPATH);
  }

  /** Title next to Back on a page opened from My Page (US nests it in a container) */
  get subPageTitle() {
    return $(`(${BACK_BUTTON_XPATH}/following-sibling::*/descendant-or-self::*[@content-desc])[1]`);
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
