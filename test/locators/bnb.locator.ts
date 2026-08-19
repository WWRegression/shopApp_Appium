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
      `//android.view.View[
      (contains(@content-desc, "Home") and contains(@content-desc, "Tab 1"))
      or (contains(@content-desc, "الصفحة الرئيسية") and contains(@content-desc, "علامة التبويب 1"))
      or (contains(@content-desc, "Accueil") and contains(@content-desc, "Onglet 1"))
      or (contains(@content-desc, "Inicio") and contains(@content-desc, "Pestaña 1"))
      or (contains(@content-desc, "Início") and contains(@content-desc, "Separador 1"))
      or (contains(@content-desc, "Halaman Utama") and contains(@content-desc, "Tab 1"))
      or (contains(@content-desc, "Home") and contains(@content-desc, "Scheda 1"))
      or (contains(@content-desc, "主页") and contains(@content-desc, "第 1"))
      or (contains(@content-desc, "Home") and contains(@content-desc, "Tabblad 1"))
      or (contains(@content-desc, "Strona główna") and contains(@content-desc, "Karta 1"))
      or (contains(@content-desc, "الرئيسية") and contains(@content-desc, "التبويب 1"))
      or (contains(@content-desc, "Startsida") and contains(@content-desc, "Flik 1"))
      or (contains(@content-desc, "หน้าหลัก") and contains(@content-desc, "แท็บที่ 1"))
      or (contains(@content-desc, "首頁") and contains(@content-desc, "第 1"))
      or (contains(@content-desc, "Trang chủ") and contains(@content-desc, "Tab 1"))
      or (contains(@content-desc, "Startseite") and contains(@content-desc, "Tab 1"))
      or (contains(@content-desc, "Domů") and contains(@content-desc, "Karta 1"))
      or (contains(@content-desc, "Főoldal") and contains(@content-desc, "1. lap"))
      or (contains(@content-desc, "Home") and contains(@content-desc, "Pestaña 1"))
      or (contains(@content-desc, "Acasă") and contains(@content-desc, "Fila 1"))
      or (contains(@content-desc, "Anasayfa") and contains(@content-desc, "Sekme 1"))
      or (contains(@content-desc, "Home") and contains(@content-desc, "Separador 1"))
      or (contains(@content-desc, "בית") and contains(@content-desc, "כרטיסייה 1"))
      or (contains(@content-desc, "ホーム") and contains(@content-desc, "タブ"))
     ]`
    );
  }

  get shopButton() {
    return $(
      `//android.view.View[
      (contains(@content-desc, "Shop") and contains(@content-desc, "Tab 2"))
      or (contains(@content-desc, "تسوق") and contains(@content-desc, "2 علامة التبويب"))
      or (contains(@content-desc, "Magasiner") and contains(@content-desc, "Onglet 2"))
      or (contains(@content-desc, "Tienda") and contains(@content-desc, "Pestaña 2"))
      or (contains(@content-desc, "Shop") and contains(@content-desc, "Onglet 2"))
      or (contains(@content-desc, "Shop") and contains(@content-desc, "Scheda 2"))
      or (contains(@content-desc, "分类") and contains(@content-desc, "第 2"))
      or (contains(@content-desc, "Comprar") and contains(@content-desc, "Pestaña 2"))
      or (contains(@content-desc, "Shop") and contains(@content-desc, "Tabblad 2"))
      or (contains(@content-desc, "Sklep") and contains(@content-desc, "Karta 2"))
      or (contains(@content-desc, "تسوق") and contains(@content-desc, "التبويب 2"))
      or (contains(@content-desc, "Handla") and contains(@content-desc, "Flik 2"))
      or (contains(@content-desc, "หมวดสินค้า") and contains(@content-desc, "แท็บที่ 2"))
      or (contains(@content-desc, "購物") and contains(@content-desc, "第 2"))
      or (contains(@content-desc, "Shop") and contains(@content-desc, "Karta 2"))
      or (contains(@content-desc, "Vásárlás") and contains(@content-desc, "2. lap"))
      or (contains(@content-desc, "Magazin online") and contains(@content-desc, "Fila 2"))
      or (contains(@content-desc, "Mağaza") and contains(@content-desc, "Sekme 2"))
     ]`
    );
  }

  get offersButton() {
    return $(
      `//android.view.View[
      (contains(@content-desc, "Offers") and contains(@content-desc, "Tab 3"))
      or (contains(@content-desc, "عروض") and contains(@content-desc, "علامة التبويب 3"))
      or (contains(@content-desc, "Offres") and contains(@content-desc, "Onglet 3"))
      or (contains(@content-desc, "Ofertas") and contains(@content-desc, "Pestaña 3"))
      or (contains(@content-desc, "Penawaran") and contains(@content-desc, "Tab 3"))
      or (contains(@content-desc, "Offerte") and contains(@content-desc, "Scheda 3"))
      or (contains(@content-desc, "优惠活动") and contains(@content-desc, "第 3"))
      or (contains(@content-desc, "Angebote") and contains(@content-desc, "Tab 3"))
      or (contains(@content-desc, "Deals") and contains(@content-desc, "Tabblad 3"))
      or (contains(@content-desc, "Oferty") and contains(@content-desc, "Karta 3"))
      or (contains(@content-desc, "العروض") and contains(@content-desc, "التبويب 3"))
      or (contains(@content-desc, "Erbjudanden") and contains(@content-desc, "Flik 3"))
      or (contains(@content-desc, "โปรโมชัน") and contains(@content-desc, "แท็บที่ 3"))
      or (contains(@content-desc, "優惠") and contains(@content-desc, "第 3"))
      or (contains(@content-desc, "Ưu đãi") and contains(@content-desc, "Tab 3"))
      or (contains(@content-desc, "Akce") and contains(@content-desc, "Karta 3"))
      or (contains(@content-desc, "Ajánlatok") and contains(@content-desc, "3. lap"))
      or (contains(@content-desc, "Promociones") and contains(@content-desc, "Pestaña 3"))
      or (contains(@content-desc, "Oferte") and contains(@content-desc, "Fila 3"))
      or (contains(@content-desc, "Kampanyalar") and contains(@content-desc, "Sekme 3"))
     ]`
    );
  }

  get cartButton() {
    return $(
      `//android.view.View[
      (contains(@content-desc, "Cart") and contains(@content-desc, "Tab 4"))
      or (contains(@content-desc, "عربة التسوق") and contains(@content-desc, "4 علامة التبويب"))
      or (contains(@content-desc, "Panier") and contains(@content-desc, "Onglet 4"))
      or (contains(@content-desc, "Carrito") and contains(@content-desc, "Pestaña 4"))
      or (contains(@content-desc, "Mon panier") and contains(@content-desc, "Onglet 4"))
      or (contains(@content-desc, "Troli") and contains(@content-desc, "Tab 4"))
      or (contains(@content-desc, "Carrello") and contains(@content-desc, "Scheda 4"))
      or (contains(@content-desc, "购物车") and contains(@content-desc, "4 个标签"))
      or (contains(@content-desc, "Warenkorb") and contains(@content-desc, "Tab 4"))
      or (contains(@content-desc, "Winkelwagen") and contains(@content-desc, "Tabblad 4"))
      or (contains(@content-desc, "Koszyk") and contains(@content-desc, "Karta 4"))
      or (contains(@content-desc, "سلتي") and contains(@content-desc, "التبويب 4"))
      or (contains(@content-desc, "Varukorg") and contains(@content-desc, "Flik 4"))
      or (contains(@content-desc, "ตะกร้า") and contains(@content-desc, "แท็บที่ 4"))
      or (contains(@content-desc, "購物車") and contains(@content-desc, "第 4"))
      or (contains(@content-desc, "Giỏ hàng") and contains(@content-desc, "Tab 4"))
      or (contains(@content-desc, "Košík") and contains(@content-desc, "Karta 4"))
      or (contains(@content-desc, "Kosár") and contains(@content-desc, "4. lap"))
      or (contains(@content-desc, "Coș") and contains(@content-desc, "Fila 4"))
      or (contains(@content-desc, "Sepet") and contains(@content-desc, "Sekme 4"))
      ]`
    );
  }

  get mypageButton() {
    return $(
      `//android.view.View[
			(contains(@content-desc, "My Page") and contains(@content-desc, "Tab 5"))
			or (contains(@content-desc, "My page") and contains(@content-desc, "Tab 5"))
			or (contains(@content-desc, "Mein Account") and contains(@content-desc, "Tab 5"))
			or (contains(@content-desc, "Mon compte") and contains(@content-desc, "Onglet 5"))
			or (contains(@content-desc, "La mia pagina") and contains(@content-desc, "Scheda 5"))
			or (contains(@content-desc, "Mi cuenta") and contains(@content-desc, "Pestaña 5"))
			or (contains(@content-desc, "Mi Cuenta") and contains(@content-desc, "Pestaña 5"))
			or (contains(@content-desc, "A Minha Página") and contains(@content-desc, "Separador 5"))
			or (contains(@content-desc, "Trang của tôi") and contains(@content-desc, "Tab 5"))
			or (contains(@content-desc, "Halaman saya") and contains(@content-desc, "Tab 5"))
			or (contains(@content-desc, "หน้าของฉัน") and contains(@content-desc, "แท็บที่ 5"))
			or (contains(@content-desc, "Ma page") and contains(@content-desc, "Onglet 5"))
			or (contains(@content-desc, "صفحتي") and contains(@content-desc, "5 علامة التبويب"))
			or (contains(@content-desc, "Mijn pagina") and contains(@content-desc, "Tabblad 5"))
			or (contains(@content-desc, "Moje Konto") and contains(@content-desc, "Karta 5"))
			or (contains(@content-desc, "Pagina mea") and contains(@content-desc, "Fila 5"))
			or (contains(@content-desc, "Mi página") and contains(@content-desc, "Pestaña 5"))
			or (contains(@content-desc, "Moje stránka") and contains(@content-desc, "Karta 5"))
			or (contains(@content-desc, "Meine Seite") and contains(@content-desc, "Tab 5"))
			or (contains(@content-desc, "我的頁面") and contains(@content-desc, "第 5"))
			or (contains(@content-desc, "Saját profilom") and contains(@content-desc, "5. lap"))
			or (contains(@content-desc, "Hesabım") and contains(@content-desc, "Sekme 5"))
			or (contains(@content-desc, "マイページ") and contains(@content-desc, "タブ"))
			or (contains(@content-desc, "Minha página") and contains(@content-desc, "Separador 5"))
			or (contains(@content-desc, "个人中心") and contains(@content-desc, "第 5"))
			or (contains(@content-desc, "アカウント") and contains(@content-desc, "タブ"))
			or (contains(@content-desc, "חשבון") and contains(@content-desc, "כרטיסייה 5"))
		  ]`
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
        return this.mypageButton;
    }
  }
}
