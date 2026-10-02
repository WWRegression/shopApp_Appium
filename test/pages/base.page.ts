import { PopupLocator } from '../locators/popup.locator';
import { HeaderLocator, type HeaderIcon } from '../locators/header.locator';
import { BnbLocator, BNB_MENUS, type BnbMenu } from '../locators/bnb.locator';
import { LoginLocator } from '../locators/login.locator';
import { switchToNative } from '../helpers/context.helper';
import { scrollUp } from '../helpers/gesture.helper';
import {
  clickElement,
  clickIfDisplayed,
  isDisplayedOrFalse,
  matchesText,
  getElementLabel,
  waitForDisplayedOrFalse,
} from '../helpers/element.helper';

export type { HeaderIcon, BnbMenu };

/**
 * Shared UI across all pages (Header, BNB, overlays).
 *
 * select*    — Header/BNB tab click (public, reveal via scrollUp if hidden)
 * matches*   — Header title / selected BNB comparison
 * dismiss*   — dismiss overlays
 * Context switching stays in context.helper.
 * Element primitives stay in element.helper.
 */
export class BasePage {
  protected readonly popupLocator = new PopupLocator();
  protected readonly headerLocator = new HeaderLocator();
  protected readonly bnbLocator = new BnbLocator();
  /** App entry screens (guest splash, profile select) — used to tell when the app is up without a permission popup */
  private readonly appEntryLocator = new LoginLocator();

  static titleTexts = {
		'HOME': [
			'Home',
			'الصفحة الرئيسية',
			'Accueil',
			'Inicio',
			'Halaman Utama',
			'主页',
			'Strona główna',
			'الرئيسية',
			'Startsida',
			'หน้าหลัก',
			'首頁',
			'Trang chủ',
			'Domů',
			'Főoldal',
			'Acasă',
			'Anasayfa',
			'Startseite',
			' בית',
			'ホーム',
			'Início'
		],
		'CART': [
			'Cart',
			'عربة التسوق',
			'Panier',
			'Carrito',
			'Keranjang',
			'Carrello',
			'购物车',
			'Warenkorb',
			'Winkelwagen',
			'Koszyk',
			'Kundvagn',
			'ตะกร้า',
			'購物車',
			'Giỏ hàng',
			'Košík',
			'Kosár',
			'Coș',
			'Sepet',
			'Carrinho',
			' עגלה',
			'Mon panier',
			'Varukorg',
			'سلتي',
			'Troli',
			'カート'
		],

		'OFFERS': [
			'Offers',
			'عروض',
			'Offres',
			'Ofertas',
			'Penawaran',
			'Offerte',
			'优惠活动',
			'Angebote',
			'Deals',
			'Oferty',
			'العروض',
			'Erbjudanden',
			'โปรโมชัน',
			'優惠',
			'Ưu đãi',
			'Akce',
			'Ajánlatok',
			'Promociones',
			'Oferte',
			'Kampanyalar',
			'Aanbiedingen',
			' מבצעים',
			'オファー'
		],
		'SHOP': [
			'Shop',
			'تسوق',
			'Magasiner',
			'Tienda',
			'分类',
			'Comprar',
			'Sklep',
			'Handla',
			'หมวดสินค้า',
			'購物',
			'Vásárlás',
			'Magazin online',
			'Mağaza',
			'商店',
			'Boutique',
			' חנות',
			'ショップ',
			'Loja'
		],

		'ACCOUNT': [
			'Account',
			'الحساب',
			'Compte',
			'Cuenta',
			'Akun',
			'我的',
			'Konto',
			'บัญชี',
			'我的帳號',
			'Trang của tôi',
			'Účet',
			'帳戶',
			'Fiókom',
			'Contul meu',
			'Hesap',
			'Mon compte',
			'My Page',
			'My page',
			'Ma page',
			'Meine Seite',
			'A Minha Página',
			'Mi página',
			'Mijn pagina',
			'صفحتي',
			'Moje stránka',
			'Mein Account',
			'Mi Cuenta',
			'Mi cuenta',
			'我的頁面',
			'Saját profilom',
			'Halaman saya',
			'Hesabım',
			'Moje Konto',
			'Pagina mea',
			'หน้าของฉัน',
			'La mia pagina',
			'个人中心',
			' חשבון',
			'アカウント'
		],
		'CHECKOUT': [
			'إتمام عملية الشراء',
			'Checkout',
			'Passer à la caisse',
			'Finalizar compra',
			'Pago',
			'Paiement',
			'Pagamento',
			'结账',
			'Kasse',
			'Finalizar la compra',
			'Betalen',
			'Do płatności',
			'Betalning',
			'ชำระเงิน',
			'結帳',
			'Thanh toán',
			'Platba',
			'Tovább a fizetéshez',
			'Validare comandă',
			'Sepeti onayla',
			'注文'
		],
		'CHAT': [
			"Chat",
			"دردشة",
			"Clavardage",
			"Live-Chat",
			"Czat na żywo z doradcą Samsung",
			"الدردشة",
			"แชท",
			"線上顧問",
			"Live Chat",
			"實時對話",
			"Élő beszélgetés",
			" צ׳אט",
			"Canlı destek",
			"客服"
		],
		'SETUP': ['Universal Build Config']
	};
  
  /** Popup */
  async dismissPopupIfShown(): Promise<void> {
    const closeButton = this.popupLocator.closeButton;
    if (await isDisplayedOrFalse(closeButton)) {
      await closeButton.click();
    }
  }

  async dismissCookieIfShown(): Promise<void> {
    const acceptButton = this.popupLocator.cookieAcceptButton;
    if (await isDisplayedOrFalse(acceptButton)) {
      await acceptButton.click();
    }
  }

  /**
   * Katalon Init.clickNotification / clickLocationPermission — deny notifications, allow location.
   * The location popup is awaited only after a notification popup; pass a long locationTimeoutMs only for a freshly wiped app.
   */
  async dismissPermissionPopups(timeoutMs = 5000, locationTimeoutMs = 1000): Promise<void> {
    await switchToNative();
    // Stop waiting as soon as an app screen is up without the popup, instead of always waiting the full timeout
    await waitForDisplayedOrFalse(this.appEntryLocator.appScreenOrPermissionPopup, { timeout: timeoutMs });

    const notificationShown = await clickIfDisplayed(this.popupLocator.notificationDenyButton, 1000);
    if (notificationShown) {
      console.log('[dismissPermissionPopups] notification permission denied');
    }
    // Location popup only follows the notification popup on a fresh app; otherwise just check what is on screen
    if (await clickIfDisplayed(this.popupLocator.locationAllowButton, notificationShown ? locationTimeoutMs : 500)) {
      console.log('[dismissPermissionPopups] location permission allowed');
    }
  }

  async dismissOverlays(): Promise<void> {
    await this.dismissPopupIfShown();
    await this.dismissCookieIfShown();
  }

  /** Katalon Common.navigateToPage("HOME") — waits for the app's first screen, then taps Home. */
  async openHome(timeoutMs = 60000): Promise<void> {
    await switchToNative();
    // The CN app sometimes takes over 20s to load; the wait ends as soon as a screen shows
    await this.waitForAppLoaded(timeoutMs);

    // No BNB on the login page / "Select profile" — nothing to tap there
    if (!(await isDisplayedOrFalse(this.bnbLocator.homeButton))) {
      console.log('[openHome] BNB not shown (login page or Select profile) — skipping');
      return;
    }
    await this.selectBnbMenu('home');
  }

  /** Waits for the first app screen (Home, login page or "Select profile"), dismissing a permission popup on top. */
  protected async waitForAppLoaded(timeoutMs: number): Promise<void> {
    // One combined lookup per poll — separate lookups each pay the UI idle wait on animated screens (CN login slider)
    await waitForDisplayedOrFalse(this.appEntryLocator.appScreenOrPermissionPopup, { timeout: timeoutMs });

    // A notification popup (e.g. IN re-asking after a deny) covers the app — close it, then wait for the screen behind it
    if (await isDisplayedOrFalse(this.popupLocator.notificationDenyButton)) {
      await this.dismissPermissionPopups();
      await waitForDisplayedOrFalse(this.appEntryLocator.appScreen, { timeout: timeoutMs });
    }
  }

  /** Switch to Native, dismiss overlays, then scroll up. */
  async prepareHeaderBnb(): Promise<void> {
    await switchToNative();
    // await this.dismissOverlays();
    await scrollUp();
  }

  /** Header */
  async selectHeaderIcon(icon: HeaderIcon): Promise<void> {
    await this.prepareHeaderBnb();
    await clickElement(this.headerLocator.icon(icon));
  }

  async matchesHeaderTitle(expected: keyof typeof BasePage.titleTexts ): Promise<boolean> {
	console.warn('[matchesHeaderTitle] start');
    const title = (await this.getHeaderTitle()).trim();
    if (!title) {
      return false;
    }
	console.warn('[matchesHeaderTitle] title:', title, 'expected:', expected);
	return BasePage.titleTexts[expected].some(
		(text) => matchesText(title, text)
	  );
  }

  private async getHeaderTitle(): Promise<string> {
    await this.prepareHeaderBnb();
    return getElementLabel(this.headerLocator.title);
  }

  /** BNB */
  async selectBnbMenu(menu: BnbMenu): Promise<void> {
    await this.prepareHeaderBnb();
    await this.ensureBnbVisible(menu);
    await clickElement(this.bnbLocator.menu(menu));
  }

  async matchesBnbMenu(menu: BnbMenu): Promise<boolean> {
    await this.prepareHeaderBnb();
    return this.isBnbMenuMarkedSelected(menu);
  }

  async getSelectedBnbMenu(): Promise<BnbMenu | null> {
    await this.prepareHeaderBnb();

    for (const menu of BNB_MENUS) {
      if (await this.isBnbMenuMarkedSelected(menu)) {
        return menu;
      }
    }
    return null;
  }

  private async isBnbMenuMarkedSelected(menu: BnbMenu): Promise<boolean> {
    const element = this.bnbLocator.menu(menu);
    if (!(await isDisplayedOrFalse(element))) {
      return false;
    }

    const selected = await element.getAttribute('selected').catch(() => 'false');
    const checked = await element.getAttribute('checked').catch(() => 'false');
    if (selected === 'true' || checked === 'true') {
      return true;
    }

    const desc = await element.getAttribute('content-desc').catch(() => '');
    return /selected|선택됨|ausgewählt/i.test(desc ?? '');
  }

  private async ensureBnbVisible(menu: BnbMenu): Promise<void> {
    // prepareHeaderBnb() already performs one scrollUp(). If BNB is still hidden,
    // try to recover it by tapping a visible header icon.
    if (await isDisplayedOrFalse(this.bnbLocator.menu(menu))) {
      return;
    }

    // A notification popup can pop up a few seconds after launch (e.g. IN re-asking after a deny) and cover BNB
    if (await isDisplayedOrFalse(this.popupLocator.notificationDenyButton)) {
      await this.dismissPermissionPopups();
      // BNB comes back only after the popup's close animation
      if (await waitForDisplayedOrFalse(this.bnbLocator.menu(menu), { timeout: 3000 })) {
        return;
      }
    }

    // Some pages (e.g., checkout) don't show BNB at all. Recover BNB via a header icon.
    const recoverIcon = await this.getFirstVisibleHeaderIcon([
      'search',
      'back',
      'chat',
    ]);
    if (!recoverIcon) {
      throw new Error(`No header icon available to recover BNB: ${menu}`);
    }

    await this.selectHeaderIcon(recoverIcon);

    if (await isDisplayedOrFalse(this.bnbLocator.menu(menu))) {
      return;
    }

    // Search (e.g. from checkout) focuses its input, and the keyboard covers BNB
    if (await driver.isKeyboardShown().catch(() => false)) {
      await driver.hideKeyboard().catch(() => undefined);
      if (await waitForDisplayedOrFalse(this.bnbLocator.menu(menu), { timeout: 2000 })) {
        return;
      }
    }

    // Some sites show no BNB on search either (e.g. US); its header Back leads Home (Katalon ensureBNBVisible 2nd attempt: headerBackBtn)
    if (await isDisplayedOrFalse(this.headerLocator.backButton)) {
      await clickElement(this.headerLocator.backButton);
      if (await waitForDisplayedOrFalse(this.bnbLocator.menu(menu), { timeout: 3000 })) {
        console.log('[ensureBnbVisible] BNB shown after header Back');
        return;
      }
    }

    throw new Error(`BNB is not visible: ${menu}`);
  }

  private async getFirstVisibleHeaderIcon(
    candidates: HeaderIcon[]
  ): Promise<HeaderIcon | null> {
    for (const icon of candidates) {
      const element = this.headerLocator.icon(icon);
      if (await isDisplayedOrFalse(element)) {
        return icon;
      }
    }
    return null;
  }
}
