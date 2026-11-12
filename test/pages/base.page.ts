import { PopupLocator } from '../locators/popup.locator';
import { HeaderLocator, type HeaderIcon } from '../locators/header.locator';
import { BnbLocator, BNB_MENUS, type BnbMenu } from '../locators/bnb.locator';
import { LoginLocator } from '../locators/login.locator';
import { switchToNative, getCurrentContext } from '../helpers/context.helper';
import { getRunConfig } from '../../config/run.config';
import { scrollUp } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop, markStepSkipped } from '../helpers/report.helper';
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
  protected readonly headerLocator = new HeaderLocator();
  protected readonly bnbLocator = new BnbLocator();
  protected readonly popupLocator = new PopupLocator();
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
      'Startsida123',
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
			' חנות',
			'ショップ',
			'Comprar',
			'Sklep',
			'Loja',
			'Magazin online',
			'Handla',
			'หมวดสินค้า',
			'Mağaza',
			'商店',
      'Shoppa'
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
        this.popupLocator.assuranceCancelButton,
        this.popupLocator.insiderBannerCloseButton,
        this.appEntryLocator.purposeSkipButton,
        this.popupLocator.cookieAcceptButton,
        this.popupLocator.promoCloseButton,
      ];
      const selectors = await Promise.all(popups.map(async (popup) => String((await popup).selector)));
      BasePage.anyPopupXpath = selectors.join(' | ');
    }
    return isDisplayedOrFalse($(BasePage.anyPopupXpath));
  }

  /** Closes the popup on top (permission, Adobe Assurance, CN ad splash, "SHOP NOW" ad, Insider banner, purpose pages, cookie, welcome / promotion) — one per call; false when nothing was closed. */
  async closeTopPopup(options: { keepCookie?: boolean } = {}): Promise<boolean> {
    if (!(await this.isAnyPopupShown())) {
      return false;
    }
    if (await this.isPermissionPopupShown()) {
      await this.dismissPermissionPopups(1000);
      return true;
    }
    // Adobe Assurance is a separate screen over the app and can open on any restart
    if (await clickIfDisplayed(this.popupLocator.assuranceCancelButton, 0)) {
      // A second Assurance screen can follow the first Cancel
      await clickIfDisplayed(this.popupLocator.assuranceCancelButton, 1000);
      return true;
    }
    if ((await clickIfDisplayed(this.popupLocator.adSkipButton)) || (await clickIfDisplayed(this.popupLocator.adCloseButton))) {
      return true;
    }
    // The Insider web banner sits over the welcome promo — close it first so the promo X does not tap the banner
    if (await this.closeInsiderBannerIfShown()) {
      return true;
    }
    // The interest / purpose pages can open again after login completes (IN, UK) — "Skip" closes one page
    if (await clickIfDisplayed(this.appEntryLocator.purposeSkipButton)) {
      return true;
    }
    // Before the welcome / promotion X — the same locator matches the cookie popup's X
    if (await isDisplayedOrFalse(this.popupLocator.cookieAcceptButton)) {
      // The cookie popup stays up until verifyAndCloseCookiePopup has checked it
      return !options.keepCookie && (await clickIfDisplayed(this.popupLocator.cookieAcceptButton));
    }
    return clickIfDisplayed(this.popupLocator.promoCloseButton);
  }

  /** Closes the Insider web banner; a coupon banner opens again unless its code is copied first (SE). */
  private async closeInsiderBannerIfShown(): Promise<boolean> {
    if (!(await isDisplayedOrFalse(this.popupLocator.insiderBannerCloseButton))) {
      return false;
    }
    if (await clickIfDisplayed(this.popupLocator.insiderBannerCopyCodeButton)) {
      console.log('[closeInsiderBannerIfShown] coupon code copied');
    }
    await clickIfDisplayed(this.popupLocator.insiderBannerCloseButton);
    console.log('[closeInsiderBannerIfShown] Insider banner closed');
    return true;
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

  /** Waits for the first app screen (Home, login page or "Select profile"), closing the popups that open on top of it. */
  async waitForAppLoaded(timeoutMs: number): Promise<void> {
    await driver
      .waitUntil(
        async () => {
          // The first-launch cookie popup covers Home and stays up for verifyAndCloseCookiePopup, so it counts as loaded
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

  /** Header *************************************************************************************/
  protected async getHeaderTitle(): Promise<string> {
    await this.prepareHeaderBnb();
    return getElementLabel(this.headerLocator.headerTitle);
  }

  async matchesHeaderTitle(expected: keyof typeof BasePage.titleTexts ): Promise<boolean> {
    const title = (await this.getHeaderTitle()).trim().replace(/\s+/g, ' ');
    if (!title) {
      return false;
    }
    console.warn('[matchesHeaderTitle] title:', title, 'expected:', expected);
    // includes: "Samsung Chat", "Samsung My Page" still match Chat / My Page
    return BasePage.titleTexts[expected].some((text) => {
      const expectedText = text.trim();
      return matchesText(title, expectedText) || title.includes(expectedText);
    });
  }

  async selectHeaderIcon(icon: HeaderIcon): Promise<void> {
    await this.prepareHeaderBnb();
    await clickElement(this.headerLocator.icon(icon));
  }

  /** Taps header Chat, then checks the chat page opened (title Chat). UK has no header chat icon. */
  async openAndVerifyHeaderChat(): Promise<void> {
    if (getRunConfig().siteCode === 'UK') {
      console.log('[openAndVerifyHeaderChat] UK — skipped');
      return;
    }
    await this.selectHeaderIcon('chat');
    const pass = await driver
      .waitUntil(() => this.matchesHeaderTitle('CHAT'), { timeout: 5000, interval: 500 })
      .then(() => true, () => false);
    console.log(`[openAndVerifyHeaderChat] header title Chat=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'Header Chat did not open chat page', pass }], 'openAndVerifyHeaderChat');
  }

  /** A tapped link/KV must open another page — one with a Back button in the header (BNB pages have none). */
  async verifySubPageOpened(source: string): Promise<void> {
    await switchToNative();
    const opened = await waitForDisplayedOrFalse(this.headerLocator.backButton, { timeout: 10000 });
    console.log(`[verifySubPageOpened] ${source} expected=page with Back opened actual=${opened ? 'opened' : 'not opened'} result=${opened ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: `${source}: page navigation failed`, pass: opened }], 'verifySubPageOpened');
  }

  /** Presses the Android Back key in any context; driver.back() in a WebView would only go back in that page's history. */
  async pressDeviceBack(): Promise<void> {
    await driver.pressKeyCode(4);
  }

  /** Presses Back until `isArrived` is true, up to `maxPresses` times; returns whether it arrived. */
  async pressBackUntil(isArrived: () => Promise<boolean>, maxPresses: number): Promise<boolean> {
    // Arrival is read from native context: the page's window can close with the Back
    await switchToNative();
    for (let press = 1; press <= maxPresses; press++) {
      await this.pressDeviceBack();
      // BE_FR, CL: a Back right after returning to Cart from Checkout can be ignored
      if (await driver.waitUntil(isArrived, { timeout: 5000, interval: 1000 }).then(() => true, () => false)) {
        return true;
      }
      console.log(`[pressBackUntil] not arrived after Back ${press}/${maxPresses}`);
    }
    return false;
  }

  /** BNB *************************************************************************************/
  /** Reads the item count from the BNB cart tab's content-desc (leading number). */
  async getBNBCartCount(): Promise<number> {
    await switchToNative();
    // Swipe only when the cart tab is hidden; a swipe right after a quantity change can drop the update
    if (!(await isDisplayedOrFalse(this.bnbLocator.menu('cart')))) {
      await scrollUp();
    }
    await this.ensureBnbVisible('cart');
    const desc = await getElementLabel(this.bnbLocator.menu('cart'));
    const firstLine = desc.split(/\r?\n/)[0] ?? '';
    const match = firstLine.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /** Records a failure when the BNB is not shown on `pageName`. */
  async verifyBnbDisplayed(pageName: string): Promise<void> {
    // US, IN: Cart has no BNB
    const siteCode = getRunConfig().siteCode;
    if ((siteCode === 'US' || siteCode === 'IN') && pageName === 'Cart') {
      markStepSkipped(`[verifyBnbDisplayed] page=${pageName} ${siteCode} Cart has no BNB`);
      return;
    }
    const shown = await this.isBnbHomeShown(5000);
    console.log(`[verifyBnbDisplayed] page=${pageName} expected BNB="shown" actual="${shown ? 'shown' : 'hidden'}" result=${shown ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: `${pageName} BNB shown`, pass: shown }], 'verifyBnbDisplayed');
  }

  /** Records a failure when the BNB is shown on `pageName`, a page that must hide it (Checkout). */
  async verifyBnbNotDisplayed(pageName: string): Promise<void> {
    const shown = await this.isBnbHomeShown(3000);
    console.log(`[verifyBnbNotDisplayed] page=${pageName} expected BNB="hidden" actual="${shown ? 'shown' : 'hidden'}" result=${shown ? 'FAIL' : 'PASS'}`);
    markFailed([{ label: `${pageName} BNB hidden`, pass: !shown }], 'verifyBnbNotDisplayed');
  }

  /** True when the BNB Home tab exists within `timeoutMs`, checked in native context; returns to the starting context. */
  private async isBnbHomeShown(timeoutMs: number): Promise<boolean> {
    const startContext = await getCurrentContext();
    await switchToNative();
    const shown = await this.bnbLocator.homeButton.waitForExist({ timeout: timeoutMs }).then(() => true, () => false);
    if (startContext !== 'NATIVE_APP') {
      await driver.switchContext(startContext).catch(() => undefined);
    }
    return shown;
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

  /** Header title matches the page, and that BNB tab is selected. US/IN Cart has no BNB. */
  async verifyPageByTitleAndBnb(menu: BnbMenu): Promise<void> {
    const title = { home: 'HOME', shop: 'SHOP', offers: 'OFFERS', cart: 'CART', mypage: 'MY_PAGE' } as const;
    const titleOk = await driver
      .waitUntil(() => this.matchesHeaderTitle(title[menu]), { timeout: 10000, interval: 500 })
      .then(() => true, () => false);
    const skipBnb = (getRunConfig().siteCode === 'US' || getRunConfig().siteCode === 'IN') && menu === 'cart';
    const bnbOk = skipBnb ? true : await this.matchesBnbMenu(menu);
    console.log(`[verifyPageByTitleAndBnb] ${menu} title=${titleOk ? 'PASS' : 'FAIL'} bnb=${bnbOk ? 'PASS' : 'FAIL'}`);
    markFailed(
      [
        { label: `${menu} header title does not match`, pass: titleOk },
        { label: `${menu} BNB tab is not selected`, pass: bnbOk },
      ],
      'verifyPageByTitleAndBnb'
    );
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
    if (await isDisplayedOrFalse(this.bnbLocator.menu(menu))) {
      return;
    }

    // The Insider banner sits over the BNB while the BNB still reads as displayed, so a tap would hit the banner (CL)
    await this.closeInsiderBannerIfShown();

    // The search area has no BNB. Closing it with header Back returns to a page that has one.
    const { SearchPage } = await import('./search.page');
    if (await new SearchPage().closeSearchIfOpen()) {
      if (await waitForDisplayedOrFalse(this.bnbLocator.menu(menu), { timeout: 3000 })) {
        return;
      }
    }

    // Popups cover BNB (permission a few seconds after launch, CN ad splash, cookie, welcome / promotion) — close them one by one
    for (let closed = 0; closed < 5 && (await this.closeTopPopup()); closed += 1) {
      // BNB comes back only after the popup's close animation; another popup can be underneath
      if (await waitForDisplayedOrFalse(this.bnbLocator.menu(menu), { timeout: 1500 })) {
        return;
      }
    }

    // Some pages (e.g., checkout) don't show BNB at all. Recover BNB via a header icon.
    for (const icon of ['search', 'back', 'chat'] as const) {
      if (!(await isDisplayedOrFalse(this.headerLocator.icon(icon)))) continue;
      await this.selectHeaderIcon(icon);
      if (await isDisplayedOrFalse(this.bnbLocator.menu(menu))) return;
    }

    // Search (e.g. from checkout) focuses its input, and the keyboard covers BNB
    if (await driver.isKeyboardShown().catch(() => false)) {
      await driver.hideKeyboard().catch(() => undefined);
      if (await waitForDisplayedOrFalse(this.bnbLocator.menu(menu), { timeout: 2000 })) {
        return;
      }
    }

    await this.selectHeaderIcon('back');
    if (await isDisplayedOrFalse(this.bnbLocator.menu(menu))) {
      return;
    }

    throw new Error(`BNB is not visible: ${menu}`);
  }
}
