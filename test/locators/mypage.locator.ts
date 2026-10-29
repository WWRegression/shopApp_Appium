import { BACK_BUTTON_XPATH } from './header.locator';

export const DASHBOARD_MENUS = ['rewards', 'vouchers', 'wishlist'] as const;

export type DashboardMenu = (typeof DASHBOARD_MENUS)[number];

/** Menus below the dashboard (My Products ~ My Addresses) */
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

export const SETTINGS_MENUS = ['support', 'policy', 'smartThings', 'settings', 'accountManagement', 'logout'] as const;

export type SettingsMenu = (typeof SETTINGS_MENUS)[number];

export type MypageMenu = DashboardMenu | ProductMenu | SettingsMenu;

export const STORE_OPTIONS = ['studentStore', 'corporateStore'] as const;

export type StoreOption = (typeof STORE_OPTIONS)[number];

export class MypageLocator {
  menuButton(label: string) {
    return $(`//android.widget.ImageView[contains(@content-desc, '${label}')]`);
  }
  
  get subMenuItems() {
    return $$('//android.view.View[@content-desc and .//android.widget.ImageView]');
  }

  /** English, DE; CN '登录' matched exactly since the CN logout button '退出登录' contains it */
  get loginButton() {
    return $(
      `//*[contains(@content-desc, 'Log-in')
      or contains(@content-desc, 'Login')
      or contains(@content-desc, 'Anmelden')
      or @content-desc='登录'
      or contains(@content-desc, 'تسجيل الدخول')
      or contains(@content-desc, 'Inloggen')
      or contains(@content-desc, 'Se connecter')
      or starts-with(@content-desc, 'Connexion')
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

  /** English, DE, CN ('退出登录') */
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

  /** Logout confirm dialog (Okay is index 2, followed by Cancel; index alone also hits the header Chat button) */
  get logoutOkayButton() {
    return $(`//android.widget.Button[@index = '2' and following-sibling::android.widget.Button]`);
  }

  /** Rewards points on the My Page dashboard, e.g. "0 / Points" (English), "10 / 星钻" (CN) */
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
      ][not(.//android.widget.ImageView)]`
    );
  }

  /** "Join Samsung Rewards" tooltip (English, CN) */
  get joinRewardsTooltip() {
    return $(
      `//android.view.View[
        @content-desc='Join Samsung Rewards' or
        @content-desc='انضم إلى Samsung Rewards' or
        @content-desc='Doe mee met Samsung Rewards' or
        @content-desc='Rejoignez Samsung Rewards' or
        @content-desc='Inscrivez-vous à Samsung Rewards' or
        @content-desc='Gana Samsung Rewards' or
        @content-desc='Zapojte se do programu Samsung Rewards' or
        @content-desc='Tritt Samsung Rewards bei' or
        @content-desc='Unirse a Samsung Rewards' or
        @content-desc='加入 Samsung Rewards' or
        @content-desc='Csatlakozz a Samsung Rewards programhoz' or
        @content-desc='Bergabung dengan Samsung Rewards' or
        @content-desc='Samsungリワードに参加' or
        @content-desc='Acumula Samsung Rewards' or
        @content-desc='Dołącz do programu Samsung Rewards' or
        @content-desc='Aderir ao Samsung Rewards' or
        @content-desc='Intră în programul Samsung Rewards' or
        @content-desc='Gå med i Samsung Rewards' or
        @content-desc='ใช้ Samsung Rewards' or
        @content-desc='Samsung Rewards’a Katılın' or
        @content-desc='Tham gia Samsung Rewards']`
      );
  }

  /** Points on the Samsung Rewards web page, e.g. "0 P" (global), "10" (CN) */
  get rewardsPagePoints() {
    return $('strong.js-point-info, .rewards-points-balance > span:first-of-type');
  }

  /** Vouchers on the My Page dashboard */
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

  /** Wishlist on the My Page dashboard */
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

  /** Rewards tab selected on the page opened from the dashboard */
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

  /** Vouchers tab selected on the page opened from the dashboard */
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

  /** Wishlist tab selected on the page opened from the dashboard */
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

  /** US only */
  get myProducts() {
    return $(`//android.view.View[@content-desc = "My Products"]`);
  }

  get myProductsPage() {
    return $(`.myd17-my-product-list-full-ux25:not(.skeleton)`);
  }

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

  get myOrdersPage() {
    return $(`app-orders-search`);
  }

  /** CN shows "服务支持" */
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

  get myRepairsPage() {
    return $(`.myd18-my-repair-history__summary, cx-page-layout.ProfileMyRepairPageTemplate`);
  }

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

  get myReferralsPage() {
    return $(`.myd07-my-referrals__top, cx-paragraph.ng-star-inserted, .my-referrals__refer-via-email`);
  }

  get myQRCode() {
    return $(`//android.view.View[contains(@content-desc, 'QR') and .//android.widget.ImageView]`);
  }

  get myQRCodePage() {
    return $(`//android.view.View[contains(@content-desc, 'qr code')]`);
  }

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

  get inboxPage() {
    return $(
      `//android.view.View[contains(@content-desc, 'There are no new notifications')]
      | //android.widget.ImageView[@content-desc and .//android.widget.Button]`
    );
  }

  get mySmartThings() {
    return $(`//android.view.View[contains(@content-desc, "SmartThings")]`);
  }

  get mySmartThingsPage() {
    return $(`h2.myd26-my-story-st__wrapper-headline`);
  }

  /** IN only */
  get orderSupport() {
    return $(`//android.view.View[contains(@content-desc, 'Support')]`);
  }

  /** IN only */
  get orderSupportPage() {
    return $(`.su21-shop-search-kv__contents`);
  }

  /** IN only */
  get myAddresses() {
    return $(`//android.view.View[contains(@content-desc, 'Addresses')]`);
  }

  /** IN only */
  get myAddressesPage() {
    return $(`app-address-profile`);
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

  productMenuPage(menu: ProductMenu) {
    switch (menu) {
      case 'myProducts':
        return this.myProductsPage;
      case 'myOrders':
        return this.myOrdersPage;
      case 'myRepairs':
        return this.myRepairsPage;
      case 'myReferrals':
        return this.myReferralsPage;
      case 'myQRCode':
        return this.myQRCodePage;
      case 'inbox':
        return this.inboxPage;
      case 'mySmartThings':
        return this.mySmartThingsPage;
      case 'orderSupport':
        return this.orderSupportPage;
      case 'myAddresses':
        return this.myAddressesPage;
    }
  }

  get registeredProductsArea() {
    return $(
      `//*[(self::android.widget.ImageView or self::android.view.View) and (
        @content-desc = 'Registered Products'
        or @content-desc = 'Registered products'
        or @content-desc = 'Registrierte Produkte'
        or @content-desc = 'Produits enregistrés'
        or @content-desc = 'Prodotti registrati'
        or @content-desc = 'Productos registrados'
        or @content-desc = 'Produtos Registados'
        or @content-desc = 'Sản phẩm đã đăng ký'
        or @content-desc = 'Daftarkan produk saya'
        or @content-desc = 'สินค้าที่ลงทะเบียน'
        or @content-desc = 'Registrerade produkter'
        or @content-desc = 'المنتجات المسجّلة'
        or @content-desc = 'Geregistreerde producten'
        or @content-desc = 'Zarejestrowane produkty'
        or @content-desc = 'Produse înregistrate'
        or @content-desc = 'Registrované produkty'
        or @content-desc = '已註冊產品'
        or @content-desc = '已登記的產品'
        or @content-desc = 'Regisztrált termékeim'
        or @content-desc = 'Kayıtlı Ürünler'
        or @content-desc = '登録済みの製品'
        or @content-desc = '登録済み製品'
      )]`
    );
  }

  get recommendedArea() {
    return $(
      `//android.view.View[
        contains(@content-desc, 'Suggested for')
        or contains(@content-desc, 'Recommended for')
        or contains(@content-desc, 'منتجات مقترحة لـ')
        or contains(@content-desc, 'Suggéré pour')
        or contains(@content-desc, 'Recommandé pour')
        or contains(@content-desc, 'Sugerido para')
        or contains(@content-desc, 'Sugestie dla')
        or contains(@content-desc, 'คำแนะนำสำหรับ')
        or contains(@content-desc, '的專屬推薦')
        or contains(@content-desc, '精選')
        or contains(@content-desc, 'Đề xuất cho')
        or contains(@content-desc, 'Empfohlen für')
        or contains(@content-desc, 'Doporučujeme pro')
        or contains(@content-desc, 'Neked ajánljuk')
        or contains(@content-desc, 'Produse recomandate pentru tine')
        or contains(@content-desc, 'Disarankan untuk')
        or contains(@content-desc, 'Suggerimenti per')
        or contains(@content-desc, 'Aanbevolen voor')
        or contains(@content-desc, 'さんへのおすすめ')
      ]`
    );
  }

  get recommendedFirstProduct() {
    return this.recommendedArea.$('.//android.widget.HorizontalScrollView[1]/android.widget.ImageView[1]');
  }

  /** Back button of a page opened from My Page — My Page itself has none */
  get subPageBackButton() {
    return $(BACK_BUTTON_XPATH);
  }

  /** Title next to Back on a page opened from My Page (US nests it in a container) */
  get subPageTitle() {
    return $(`(${BACK_BUTTON_XPATH}/following-sibling::*/descendant-or-self::*[@content-desc])[1]`);
  }

  /** Profile card showing every word of the account name; CN by its greeting ('欢迎光临') since it shows a random "sa_…" nickname */
  profileCard(accountName: string) {
    const hasName =
      accountName
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => `contains(@content-desc, '${word}')`)
        .join(' and ') || 'false()';
    return $(`//android.widget.ImageView[(${hasName}) or contains(@content-desc, '欢迎光临')]`);
  }

  get supportMenu() {
    return $(
      `//android.widget.ImageView[
        @content-desc = 'Support' or
        @content-desc = 'الدعم' or
        @content-desc = 'Destek' or
        @content-desc = 'Aide' or
        @content-desc = 'Soporte' or
        @content-desc = 'Suporte' or
        @content-desc = 'Guide et solutions' or
        @content-desc = 'Supporto' or
        @content-desc = 'Asistencia técnica' or
        @content-desc = 'Pomoc' or
        @content-desc = 'Podpora' or
        @content-desc = 'Asistenţă' or
        @content-desc = 'Támogatás' or
        @content-desc = '售后服务' or
        @content-desc = '支援' or
        @content-desc = 'Dukungan' or
        @content-desc = 'สนับสนุน' or
        @content-desc = 'שירות לקוחות' or
        @content-desc = 'Hỗ trợ' or
        @content-desc = 'サポート' or
        @content-desc = 'Assistance' or
        @content-desc = 'Customer Support' or
        @content-desc = 'お問い合わせ' or
        @content-desc = 'カスタマーサポート'
      ]`
    );
  }

  get policyMenu() {
    return $(
      `//android.widget.ImageView[
        @content-desc = 'Policy' or
        @content-desc = 'Politique' or
        @content-desc = 'السياسات' or
        @content-desc = 'Política' or
        @content-desc = 'Política de privacidad' or
        @content-desc = 'Conditions générales' or
        @content-desc = 'Keamanan & Privasi' or
        @content-desc = 'Informativa' or
        @content-desc = 'Términos y condiciones' or
        @content-desc = 'Over ons' or
        @content-desc = '政策' or
        @content-desc = 'Polityka' or
        @content-desc = 'Chính sách' or
        @content-desc = 'Rechtliche Hinweise' or
        @content-desc = 'นโยบาย' or
        @content-desc = 'Richtlinien' or
        @content-desc = 'Pravidla a podmínky' or
        @content-desc = 'Jogi irányelvek' or
        @content-desc = 'מדיניות' or
        @content-desc = 'Politică' or
        @content-desc = 'Gizlilik Politikası' or
        @content-desc = 'Samsungプライバシーポリシー'
      ]`
    );
  }

  get smartThingsMenu() {
    return $(`//android.widget.ImageView[contains(@content-desc, 'SmartThings')]`);
  }

  get accountManagementMenu() {
    return $(
      `//android.widget.ImageView[
        @content-desc = 'Account Management' or
        @content-desc = 'Gestion des comptes' or
        @content-desc = 'حذف الحساب' or
        @content-desc = 'Gestión de cuentas' or
        @content-desc = 'Gestión de cuenta' or
        @content-desc = 'Mon compte' or
        @content-desc = 'Manajemen Akun' or
        @content-desc = 'Gestione account' or
        @content-desc = 'Accountbeheer' or
        @content-desc = '账号管理' or
        @content-desc = 'Zarządzanie kontem' or
        @content-desc = 'إدارة الحساب' or
        @content-desc = 'Hantera konto' or
        @content-desc = 'Quản lý Tài khoản' or
        @content-desc = '帳戶管理' or
        @content-desc = 'การจัดการบัญชี' or
        @content-desc = 'Account-Verwaltung' or
        @content-desc = 'Správa účtu' or
        @content-desc = 'Fiók kezelése' or
        @content-desc = 'Gestionare cont' or
        @content-desc = 'Hesabım' or
        @content-desc = 'Gestão de conta' or
        @content-desc = 'アカウント設定'
      ]`
    );
  }

  settingsMenuButton(menu: SettingsMenu) {
    switch (menu) {
      case 'support':
        return this.supportMenu;
      case 'policy':
        return this.policyMenu;
      case 'smartThings':
        return this.smartThingsMenu;
      case 'settings':
        return this.settingsMenu;
      case 'accountManagement':
        return this.accountManagementMenu;
      case 'logout':
        return this.logoutButton;
    }
  }

  mypageMenu(menu: MypageMenu) {
    if ((DASHBOARD_MENUS as readonly string[]).includes(menu)) {
      return this.dashboardMenu(menu as DashboardMenu);
    }
    if ((SETTINGS_MENUS as readonly string[]).includes(menu)) {
      return this.settingsMenuButton(menu as SettingsMenu);
    }
    return this.productMenu(menu as ProductMenu);
  }

  get subMenuListTitle() {
    return $(
      `//android.view.View[
        @clickable = 'false'
        and string-length(normalize-space(@content-desc)) > 0
        and following-sibling::*[1]//android.view.View[@clickable = 'true' and .//android.widget.ImageView]
      ]`
    );
  }

  subMenuRow(label: string) {
    return $(`//android.view.View[@clickable = 'true' and normalize-space(@content-desc) = "${label}"]`);
  }

  get subPageHeading() {
    return $(`(//android.view.View[@clickable = 'false' and string-length(normalize-space(@content-desc)) > 0])[1]`);
  }

  get giveFeedbackMenu() {
    return $(
      `//android.view.View[
        contains(@content-desc, 'Give Feedback') or
        contains(@content-desc, 'Give My Opinion') or
        contains(@content-desc, 'Give Me Opinion') or
        contains(@content-desc, 'الدراسة الاستقصائية تغذية راجعة') or
        contains(@content-desc, 'Feedback Survey') or
        contains(@content-desc, 'Partagez vos commentaires') or
        contains(@content-desc, 'Share your feedback') or
        contains(@content-desc, 'Danos tu opinión') or
        contains(@content-desc, 'Encuesta de satisfacción') or
        contains(@content-desc, 'Donnez votre avis') or
        contains(@content-desc, '反映意見') or
        contains(@content-desc, 'Berikan masukan') or
        contains(@content-desc, 'Lascia il tuo feedback') or
        contains(@content-desc, 'Feedback geben') or
        contains(@content-desc, 'Oferă o opinie') or
        contains(@content-desc, 'Dar feedback') or
        contains(@content-desc, 'アプリを評価する') or
        contains(@content-desc, 'Donner ton avis') or
        contains(@content-desc, 'Ge feedback')
      ]`
    );
  }

  get marketingPreferencesMenu() {
    return $(
      `//android.view.View[
        contains(@content-desc, 'Marketing') or
        @content-desc = 'Préférences marketing' or
        @content-desc = 'تفضيلات التسويق' or
        @content-desc = 'Preferencias de marketing' or
        @content-desc = 'Preferensi Pemasaran' or
        @content-desc = 'Modifica le tue preferenze' or
        @content-desc = 'Editar preferencias' or
        @content-desc = 'Marketingvoorkeuren' or
        @content-desc = '地址管理' or
        @content-desc = 'Preferencje marketingowe' or
        @content-desc = 'Inställningar för marknadsföring' or
        @content-desc = 'Tùy chọn Tiếp thị' or
        @content-desc = 'Adress- & Marketing-Einstellungen' or
        @content-desc = '行銷偏好設定' or
        @content-desc = 'การตั้งค่าด้านการตลาด' or
        @content-desc = 'Předvolby marketingu' or
        @content-desc = 'Präferenzen bearbeiten' or
        @content-desc = 'Marketingmegkeresésekkel kapcsolatos beállítások' or
        @content-desc = 'Editați preferințele' or
        @content-desc = 'Pazarlama Tercihleri' or
        @content-desc = '編輯偏好' or
        @content-desc = 'Edit Preferences' or
        @content-desc = 'マーケティングに関する設定(マーケティング通信など)' or
        @content-desc = 'Os meus pedidos' or
        normalize-space(@content-desc) = 'העדפות שיווקיות' or
        @content-desc = 'Manage Preferences'
      ]`
    );
  }

  get deleteAccountMenu() {
    return $(`//android.widget.ImageView[@content-desc = 'Delete Account']`);
  }

  get cnAccountLogoutButton() {
    return $(`//android.widget.Button[@content-desc = '退出登录']`);
  }

  /** "Settings" row at the bottom of My Page */
  get settingsMenu() {
    return $(
      `//android.widget.ImageView[
        @content-desc = 'Settings' or
        @content-desc = 'Paramètres' or
        @content-desc = 'الإعدادات' or
        @content-desc = 'Ajustes' or
        @content-desc = 'Pengaturan' or
        @content-desc = 'Impostazioni' or
        @content-desc = 'Configuración' or
        @content-desc = 'Instellingen' or
        @content-desc = '设定' or
        @content-desc = 'Ustawienia' or
        @content-desc = 'Inställningar' or
        @content-desc = 'Cài đặt' or
        @content-desc = '設定' or
        @content-desc = 'การตั้งค่า' or
        @content-desc = 'Einstellungen' or
        @content-desc = 'Nastavení' or
        @content-desc = 'Beállítások' or
        @content-desc = 'Setări' or
        @content-desc = 'Ayarlar' or
        @content-desc = 'Réglages' or
        @content-desc = 'Definições' or
        @content-desc = 'Einstellung' or
        @content-desc = 'הגדרות' or
        @content-desc = '通知をオンにする'
      ]`
    );
  }

  /** Row on the Settings page */
  get personalDataManagementMenu() {
    return $(
      `//*[
        @content-desc = 'Personal Data Management' or
        @content-desc = 'Gestion des données personnelles' or
        @content-desc = 'إدارة البيانات الشخصية' or
        @content-desc = 'Gestión de datos personales' or
        @content-desc = 'Manajemen Data Pribadi' or
        @content-desc = 'Gestione dei dati personali' or
        @content-desc = 'Verwaltung der personenbezogenen Daten' or
        @content-desc = 'Beheer van persoonlijke gegevens' or
        @content-desc = '个人数据管理' or
        @content-desc = 'Zarządzanie danymi osobowymi' or
        @content-desc = 'Hantering av personuppgifter' or
        @content-desc = 'Quản lý Dữ liệu Cá nhân' or
        @content-desc = '個人資料管理' or
        @content-desc = 'การจัดการข้อมูลส่วนตัว' or
        @content-desc = 'Správa osobních údajů' or
        @content-desc = 'Personenbezogene Daten verwalten' or
        @content-desc = 'Személyes adatok kezelése' or
        @content-desc = 'Gestionare date cu caracter personal' or
        @content-desc = 'Kişisel Verilerin Yönetimi' or
        @content-desc = 'Persönliche Daten verwalten' or
        @content-desc = 'マーケティングに関する設定' or
        @content-desc = 'Gestão de dados pessoais' or
        contains(@content-desc, 'ניהול מידע אישי')
      ]`
    );
  }

  /** Row on the Personal Data Management page */
  get cookiePreferencesMenu() {
    return $(
      `//*[
        @content-desc = 'Cookie Preferences' or
        @content-desc = 'Préférences en matière de témoins' or
        @content-desc = 'Cookies' or
        @content-desc = 'Mes préférences de cookies' or
        @content-desc = 'Preferenze Cookie' or
        @content-desc = 'Cookie-voorkeuren' or
        @content-desc = 'Preferencje plików cookie' or
        @content-desc = 'Cookie inställningar' or
        @content-desc = 'Cookie-Einstellungen' or
        @content-desc = 'Předvolby souborů cookies' or
        @content-desc = 'Süti beállítások' or
        @content-desc = 'Preferințe de marketing' or
        @content-desc = 'Política de Cookies' or
        @content-desc = 'Çerez tercihleri'
      ]`
    );
  }

  /** Opens the per-category choices when the consent shows its summary first */
  get trustArcMoreInfoButton() {
    return $(
      `//android.widget.Button[
        contains(@text, 'Plus de renseignements') or
        contains(@text, 'Anpassen') or
        contains(@text, 'Více informací') or
        contains(@text, 'Más información') or
        contains(@text, 'En savoir plus') or
        contains(@text, 'További információ') or
        contains(@text, 'Più informazioni') or
        contains(@text, 'Cookies beheren') or
        contains(@text, 'Więcej informacji') or
        contains(@text, 'Mai multe informaţii') or
        contains(@text, 'Daha fazla bilgi') or
        contains(@text, 'More Info') or
        contains(@text, 'Hantera val') or
        contains(@text, 'More info')
      ]`
    );
  }

  /** "Save" under the per-category choices */
  get trustArcSaveButton() {
    return $(
      `//android.widget.Button[
        contains(@text, 'Enregistrer') or
        contains(@text, 'Speichern') or
        contains(@text, 'Uložit') or
        contains(@text, 'Guardar') or
        contains(@text, 'Mentés') or
        contains(@text, 'Salva') or
        contains(@text, 'Bewaar Voorkeuren') or
        contains(@text, 'Zapisz swoje wybory i zamknij') or
        contains(@text, 'Salvare') or
        contains(@text, 'Kaydet') or
        contains(@text, 'Save') or
        contains(@text, 'Opslaan') or
        contains(@text, 'Sauvegarder') or
        contains(@text, 'Spara')
      ]`
    );
  }

  get trustArcPreferencesContent() {
    return $('#cm-preferences-content');
  }

  /** "NO" inputs of the cookie categories (WebView) */
  get trustArcNoInputs() {
    return $$('input[id*="no"]');
  }

  /** Row on the Settings page */
  get pushNotificationMenu() {
    return $(
      `//*[
        @content-desc = 'الإشعارات' or
        @content-desc = 'Push Notifications' or
        @content-desc = 'Push notifications' or
        @content-desc = 'Notifications poussées' or
        @content-desc = 'Notificações Push' or
        @content-desc = 'Mis Notificaciones' or
        @content-desc = 'Notificaciones push' or
        @content-desc = 'Notificaciones' or
        @content-desc = 'Mes notifications' or
        @content-desc = 'Notifikasi' or
        @content-desc = 'Notifiche Push' or
        @content-desc = '推送通知接收提醒' or
        @content-desc = 'Push-Benachrichtigungen' or
        @content-desc = 'Pushberichten' or
        @content-desc = 'Powiadomienia push' or
        @content-desc = 'تنبيهات التطبيق' or
        @content-desc = 'Notiser' or
        @content-desc = 'บริการการแจ้งเตือน' or
        @content-desc = '通知' or
        @content-desc = 'Thông báo' or
        @content-desc = 'Push notifikace' or
        @content-desc = '推送通知' or
        @content-desc = 'Értesítések' or
        @content-desc = 'Push Notification' or
        @content-desc = 'Notificaciones Push' or
        @content-desc = 'Notificare push' or
        @content-desc = 'Bildirimler' or
        @content-desc = 'התראות  ' or
        @content-desc = '通知をオンにする'
      ]`
    );
  }

  get selectCountryMenu() {
    return $(
      `//android.view.View[
        contains(@content-desc, 'Select Country') or
        contains(@content-desc, 'Land auswählen') or
        contains(@content-desc, 'Sélectionner un pays') or
        contains(@content-desc, 'Sélectionnez le pays') or
        contains(@content-desc, 'Seleziona Paese') or
        contains(@content-desc, 'Selecciona el país') or
        contains(@content-desc, 'Seleccionar país') or
        contains(@content-desc, 'Selecionar país') or
        contains(@content-desc, 'Chọn Quốc gia') or
        contains(@content-desc, 'Pilih Negara') or
        contains(@content-desc, 'เลือกประเทศ') or
        contains(@content-desc, 'Välj land') or
        contains(@content-desc, 'Selecteer land') or
        contains(@content-desc, 'Wybierz kraj') or
        contains(@content-desc, 'Selectare țară') or
        contains(@content-desc, 'Vyberte zemi') or
        contains(@content-desc, 'Ország kiválasztása') or
        contains(@content-desc, 'Ülke Seçin') or
        contains(@content-desc, '選取國家') or
        contains(@content-desc, '選擇語言／地區') or
        contains(@content-desc, 'Language / Region') or
        contains(@content-desc, 'البلد') or
        contains(@content-desc, 'בחירת מדינה')
      ]`
    );
  }

  /** The switch on the Push Notification page */
  get pushNotificationSwitch() {
    return $(`//android.widget.Switch`);
  }

  get selectStoreButton() {
    return $(
      `//android.widget.Button[
        @content-desc = 'Select Store' or
        @content-desc = 'تحديد المتجر' or
        @content-desc = 'Selecionar loja' or
        @content-desc = 'Sélectionner la boutique' or
        @content-desc = 'Seleccionar tienda' or
        @content-desc = 'Sélectionner le magasin' or
        @content-desc = 'Pilih Toko' or
        @content-desc = 'Accedi allo Student Store' or
        @content-desc = 'Wybierz sklep' or
        @content-desc = 'เลือกร้านค้า' or
        @content-desc = '選取商店' or
        @content-desc = 'Chọn cửa hàng' or
        @content-desc = 'Wähle einen Store' or
        @content-desc = '選擇商店' or
        @content-desc = 'Select your store' or
        @content-desc = 'Select store' or
        @content-desc = 'Bir mağaza seç' or
        @content-desc = '选择商店' or
        @content-desc = 'ショップを選ぶ'
      ]`
    );
  }

  get studentStoreOption() {
    const desc = `translate(@content-desc, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')`;
    return $(
      `//android.widget.ImageView[
        ${desc} = 'student store' or
        ${desc} = 'الطالب ' or
        contains(@content-desc, 'Loja Samsung Educação') or
        ${desc} = 'student offer program' or
        ${desc} = '教育優惠商店' or
        ${desc} = 'estudiante' or
        ${desc} = 'studente' or
        ${desc} = 'education shop' or
        ${desc} = 'education store' or
        ${desc} = 'samsung education' or
        ${desc} = 'samsung education store' or
        ${desc} = 'magasin étudiant' or
        ${desc} = 'beneficios estudiantes' or
        ${desc} = 'tienda estudiantes' or
        ${desc} = 'tienda para estudiantes' or
        ${desc} = 'samsung 教育商店' or
        ${desc} = 'pelajar' or
        ${desc} = 'tienda samsung para estudiantes' or
        ${desc} = 'student' or
        ${desc} = 'tienda oficial para estudiantes' or
        ${desc} = 'sklep samsung dla edukacji' or
        ${desc} = 'loja educação' or
        ${desc} = 'متجر الطالب' or
        ${desc} = 'ร้านค้าสำหรับนักเรียน-นักศึกษา' or
        contains(@content-desc, 'Eğitim İndirim Programı mağazası') or
        ${desc} = '進入教育優惠商店' or
        contains(@content-desc, 'Cửa hàng Giáo dục')
      ]`
    );
  }

  get corporateStoreOption() {
    const desc = `translate(@content-desc, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')`;
    return $(
      `//android.widget.ImageView[
        ${desc} = 'corporate store' or
        ${desc} = 'موظفي الشركات' or
        ${desc} = 'corporate employee' or
        ${desc} = 'corporate shop' or
        ${desc} = 'samsung government store' or
        ${desc} = 'متجر موظفي الشركات' or
        ${desc} = 'tienda para alianzas corporativas' or
        ${desc} = 'samsung 合作夥伴商店' or
        ${desc} = 'samsung partnership store' or
        ${desc} = 'samsung ksa corporate' or
        contains(@content-desc, 'İş ortaklarına özel mağaza') or
        contains(@content-desc, 'Ưu đãi Doanh nghiệp')
      ]`
    );
  }

  storeOption(store: StoreOption) {
    return store === 'studentStore' ? this.studentStoreOption : this.corporateStoreOption;
  }

  get browserUrlBar() {
    return $(`//android.widget.EditText[@resource-id = 'com.android.chrome:id/url_bar']`);
  }
}
