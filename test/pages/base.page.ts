import { PopupLocator } from '../locators/popup.locator';
import { HeaderLocator, type HeaderIcon } from '../locators/header.locator';
import { BnbLocator, BNB_MENUS, type BnbMenu } from '../locators/bnb.locator';
import { LoginLocator } from '../locators/login.locator';
import { HomeLocator } from '../locators/home.locator';
import { switchToNative } from '../helpers/context.helper';
import { flingToStart, scrollUp } from '../helpers/gesture.helper';
import { assertEqual } from '../helpers/validation.helper';
import { markFailedAndStop } from '../helpers/report.helper';
import {
  clickElement,
  clickIfDisplayed,
  isDisplayedOrFalse,
  matchesText,
  getElementLabel,
  scrollUntilVisible,
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
  protected readonly homeLocator = new HomeLocator();
  /** App entry screens (guest splash, profile select) — used to tell when the app is up without a permission popup */
  private readonly appEntryLocator = new LoginLocator();

  static titleTexts = {
		'HOME': [
			'Home',
			'الصفحة الرئيسية',
			'Accueil',
			'主页',
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
			'בית',
			'ホーム',
			'Início'
		],
		'SHOP': [
			'Shop',
			'تسوق',
			'Boutique',
			'Magasiner',
			'Tienda',
			'分类',
			'購物',
			'Vásárlás',
			'חנות',
			'ショップ',
			'Comprar',
			'Sklep',
			'Loja',
			'Magazin online',
			'Handla',
			'หมวดสินค้า',
			'Mağaza',
			'商店'
		],
		'OFFERS': [
			'Offers',
			'عروض',
			'Angebote',
			'Aanbiedingen',
			'Offres',
			'Ofertas',
			'优惠活动',
			'Akce',
			'優惠',
			'Ajánlatok',
			'Penawaran',
			'מבצעים',
			'Offerte',
			'オファー',
			'Deals',
			'Promociones',
			'Oferty',
			'Oferte',
			'العروض',
			'Erbjudanden',
			'โปรโมชัน',
			'Kampanyalar',
			'Ưu đãi'
		],
		'CART': [
			'Cart',
			'عربة التسوق',
			'Warenkorb',
			'Winkelwagen',
			'Mon panier',
			'Panier',
			'Carrito',
			'购物车',
			'Košík',
			'購物車',
			'Kosár',
			'Troli',
			'עגלה',
			'Carrello',
			'カート',
			'Koszyk',
			'Carrinho',
			'Coș',
			'سلتي',
			'Varukorg',
			'ตะกร้า',
			'Sepet',
			'Giỏ hàng'
		],
		'MY_PAGE': [
			'My Page',
			'صفحتي',
			'Meine Seite',
			'Mijn pagina',
			'Ma page',
			'Mi página',
			'个人中心',
			'Moje stránka',
			'Mein Account',
			'Mi cuenta',
			'Mon compte',
			'我的頁面',
			'Saját profilom',
			'Halaman saya',
			'חשבון',
			'La mia pagina',
			'アカウント',
			'Moje Konto',
			'A Minha Página',
			'Pagina mea',
			'หน้าของฉัน',
			'Hesabım',
			'Trang của tôi'
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
  /** Union of every popup closeTopPopup handles — one lookup answers "is anything on top". */
  private static anyPopupXpath = '';

  private async isAnyPopupShown(): Promise<boolean> {
    if (!BasePage.anyPopupXpath) {
      const popups = [
        this.popupLocator.notificationDenyButton,
        this.popupLocator.locationAllowButton,
        this.popupLocator.adSkipButton,
        this.popupLocator.adCloseButton,
        this.appEntryLocator.purposeSkipButton,
        this.popupLocator.cookieAcceptButton,
        this.popupLocator.promoCloseButton,
      ];
      const selectors = await Promise.all(popups.map(async (popup) => String((await popup).selector)));
      BasePage.anyPopupXpath = selectors.join(' | ');
    }
    return isDisplayedOrFalse($(BasePage.anyPopupXpath));
  }

  /** Closes the popup on top (permission, CN ad splash, "SHOP NOW" ad, purpose pages, cookie, welcome / promotion) — one per call; false when nothing was closed. */
  async closeTopPopup(options: { keepCookie?: boolean } = {}): Promise<boolean> {
    if (!(await this.isAnyPopupShown())) {
      return false;
    }
    if (await this.isPermissionPopupShown()) {
      await this.dismissPermissionPopups(1000);
      return true;
    }
    if ((await clickIfDisplayed(this.popupLocator.adSkipButton)) || (await clickIfDisplayed(this.popupLocator.adCloseButton))) {
      return true;
    }
    // The interest / purpose pages can open again after login completes (IN, UK) — "Skip" closes one page
    if (await clickIfDisplayed(this.appEntryLocator.purposeSkipButton)) {
      return true;
    }
    // Before the welcome / promotion X — the same locator matches the cookie popup's X
    if (await isDisplayedOrFalse(this.popupLocator.cookieAcceptButton)) {
      // The cookie popup stays up until verifyCookiePopup has checked it
      return !options.keepCookie && (await clickIfDisplayed(this.popupLocator.cookieAcceptButton));
    }
    return clickIfDisplayed(this.popupLocator.promoCloseButton);
  }

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
   * Deny notifications, allow location.
   * The location popup is awaited only after a notification popup; pass a long locationTimeoutMs only for a freshly wiped app.
   */
  async dismissPermissionPopups(timeoutMs = 5000, locationTimeoutMs = 1000): Promise<void> {
    await switchToNative();
    // Stop waiting as soon as an app screen is up without the popup, instead of always waiting the full timeout
    await driver
      .waitUntil(async () => (await this.isPermissionPopupShown()) || (await this.isAppScreenShown()), {
        timeout: timeoutMs,
        interval: 500,
      })
      .catch(() => undefined);

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
    // Promotion bottom sheet (first launch on US, CN) — after the cookie popup, whose X the same locator matches
    await clickIfDisplayed(this.popupLocator.promoCloseButton);
  }

  /** On the country list (first launch or Shop > Country), selects `countryName` and confirms. */
  async selectCountry(countryName?: string): Promise<void> {
    // Single-country apps (no countryName in site data) have no country list
    if (!countryName) {
      console.log('[selectCountry] no countryName for this site — skipped');
      return;
    }
    await switchToNative();
    const item = this.homeLocator.countryListItem(countryName);
    await waitForDisplayedOrFalse(this.homeLocator.countryContinueButton, { timeout: 10000 });

    let found = await scrollUntilVisible(item, 15);
    if (!found) {
      // The list can open scrolled past the target
      await flingToStart();
      found = await scrollUntilVisible(item, 15);
    }
    markFailedAndStop([{ label: 'target country not found in the list', pass: found, detail: countryName }], 'selectCountry');

    await clickElement(item, { timeout: 5000 });
    await clickElement(this.homeLocator.countryContinueButton, { timeout: 8000 });
    console.log(`[selectCountry] selected "${countryName}"`);
  }

  /** Waits for the first app screen (Home, login page or "Select profile"), closing the popups that open on top of it. */
  async waitForAppLoaded(timeoutMs: number): Promise<void> {
    await driver
      .waitUntil(
        async () => {
          // The first-launch cookie popup covers Home and stays up for verifyCookiePopup, so it counts as loaded
          if ((await this.isAppScreenShown()) || (await isDisplayedOrFalse(this.popupLocator.cookieAcceptButton))) {
            return true;
          }
          await this.closeTopPopup({ keepCookie: true });
          return false;
        },
        { timeout: timeoutMs, interval: 1000 }
      )
      .catch(() => undefined);
  }

  /** True when an Android permission popup (notification or location) is on top of the app. */
  protected async isPermissionPopupShown(): Promise<boolean> {
    return (
      (await isDisplayedOrFalse(this.popupLocator.notificationDenyButton)) ||
      (await isDisplayedOrFalse(this.popupLocator.locationAllowButton))
    );
  }

  /** True when the app's first screen is up: Home, the login page or "Select profile". */
  private async isAppScreenShown(): Promise<boolean> {
    return (
      (await isDisplayedOrFalse(this.bnbLocator.homeButton)) ||
      (await isDisplayedOrFalse(this.appEntryLocator.continueAsGuestButton)) ||
      (await isDisplayedOrFalse(this.appEntryLocator.selectProfileTitle))
    );
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
    return BasePage.titleTexts[expected].some((text) => matchesText(title, text));
  }

  private async getHeaderTitle(): Promise<string> {
    await this.prepareHeaderBnb();
    return getElementLabel(this.headerLocator.title);
  }

  // BNB
  /** Reads the item count from the BNB cart tab's content-desc (leading number). */
  async getBNBCartCount(): Promise<number> {
    await this.prepareHeaderBnb();
    await this.ensureBnbVisible('cart');
    const desc = await getElementLabel(this.bnbLocator.menu('cart'));
    const firstLine = desc.split(/\r?\n/)[0] ?? '';
    const match = firstLine.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /** Verifies the BNB cart tab count. */
  async verifyCartIconQuantity(expected: number): Promise<void> {
    assertEqual(await this.getBNBCartCount(), expected);
  }

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

    // Popups cover BNB (permission a few seconds after launch, CN ad splash, cookie, welcome / promotion) — close them one by one
    for (let closed = 0; closed < 5 && (await this.closeTopPopup()); closed += 1) {
      // BNB comes back only after the popup's close animation; another popup can be underneath
      if (await waitForDisplayedOrFalse(this.bnbLocator.menu(menu), { timeout: 1500 })) {
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

    // Some sites show no BNB on search either (e.g. US); its header Back leads Home
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
