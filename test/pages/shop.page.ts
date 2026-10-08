import { BasePage } from './base.page';
import { ShopLocator, ShopCategory, type ShopMenu, type ShopMenuPage, type ShopSubMenu } from '../locators/shop.locator';
import type { LoadedSite } from '../../config/site';
import { flingToStart, gestureByBoundary, swipeByBoundary, scrollByBoundary, tapAtCoordinates } from '../helpers/gesture.helper'
import {
  switchToNative,
  getCurrentWebViewPage,
  getDetailedWebViewWindows,
  hasAppWebViewContext,
  targetPackage,
} from '../helpers/context.helper';
import { closeExternalBrowserIfOpen, forceStopPackage } from '../helpers/device.helper';
import { currentSiteCode } from '../helpers/tc-filter.helper';
import {
  clickElement,
  clickIfDisplayed,
  getElementLabel,
  isDisplayedOrFalse,
  waitForDisplayedOrFalse,
} from '../helpers/element.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';
export type CategoryMismatch = string;
export type { ShopMenu };

/** Katalon Shop/MoreSamsungApps — icon name to expected Android package. */
const MORE_SAMSUNG_APPS = [
  { labels: ['Smart Switch'], packageName: 'com.sec.android.easyMover' },
  { labels: ['SmartThings'], packageName: 'com.samsung.android.oneconnect' },
  { labels: ['Samsung Health', '三星健康'], packageName: 'com.sec.android.app.shealth' },
  { labels: ['Bixby'], packageName: 'com.samsung.android.bixby.agent' },
  { labels: ['Samsung Wallet', '三星钱包'], packageName: 'com.samsung.android.spay' },
  { labels: ['Samsung Browser', '三星浏览器', '三星瀏覽器'], packageName: 'com.sec.android.app.sbrowser' },
  { labels: ['Galaxy Store', '三星应用商店'], packageName: 'com.sec.android.app.samsungapps' },
  { labels: ['PENUP'], packageName: 'com.sec.penup' },
  { labels: ['Samsung Members', '盖乐世社区'], packageName: 'com.samsung.android.voc' },
  { labels: ['Samsung TV Plus'], packageName: 'com.samsung.android.tvplus' },
  {
    labels: ['Samsung Find', 'Samsung Zoeken', 'Buscador de Samsung'],
    packageName: 'com.samsung.android.app.find',
  },
  { labels: ['Samsung Notes'], packageName: 'com.samsung.android.app.notes' },
  { labels: ['Samsung Pass'], packageName: 'com.samsung.android.samsungpass' },
  { labels: ['Samsung Cloud', '三星云', '三星雲端'], packageName: 'com.samsung.android.scloud' },
  {
    labels: [
      'Find My Mobile',
      'Find my mobile',
      'البحث عن هاتفي المحمول.',
      'Zoek mijn mobiel',
      'Traçage du mobile',
      'Localizar mi móvil',
      '查找我的手机',
      'Najít moje mobilní zařízení',
      'Buscar mi móvil',
      '尋找我的手機',
      'Mobil megkeresése',
      'Temukan Ponsel Saya',
      'Trova dispositivo personale',
      'Znajdź mój telefon',
      'Buscar meu telefone',
      'Găsire dispozitiv mobil',
      'البحث عن هاتفي المحمول',
      'Hitta min mobila enhet',
      'ค้นหาโทรศัพท์ส่วนตัว',
      'Cihazımı Bul',
      'Tìm di động của bạn',
    ],
    packageName: 'com.samsung.android.fmm',
  },
  {
    labels: [
      'Call & text on other devices',
      'الاتصال وإرسال رسائل نصية على أجهزة أخرى',
      'Anrufe/SMS auf anderen Geräten',
      'Bel/sms op andere apparaten',
      'Appels/SMS sur autres appar.',
      'Appels/textos sur autres appar.',
      'Llamadas/mensajes en otros disp.',
      'Volání a zprávy na dal. zař.',
      'Llamadas/mensajes en otros disp',
      '在其他裝置上通話與收發文字訊息',
      'Hívás és üzenet más eszközön',
      'Chiam. e testo su altri disp.',
      'Poł. i SMS-y na innych urz.',
      'Chamadas e msg noutros disp.',
      'Apel./mes. text pe alte disp.',
      'Ring och skriv på annan enhet',
      'โทรและส่งข้อความบนอุปกรณ์อื่น',
      'Başka cihazlarda arama/mesaj',
      '跨裝置接續通話與簡訊',
      'Gọi & n.tin trên t.bị khác',
      'שיחות וטקסטים במכשירים אחרים',
    ],
    packageName: 'shopApp',
  },
  { labels: ['Samsung Visit in', 'Samsung Visit In'], packageName: 'com.samsung.android.ipsgeofence' },
  {
    labels: [
      'Group Sharing',
      'مشاركة المجموعة',
      'Compartir con grupos',
      '群组分享',
      'Sdílení skupin',
      'Gruppenfreigabe',
      '群組共享',
      'Delen in groep',
      'Udostępnianie grupom',
      'Compartilhamento de grupos',
      'Partajare de grup',
      'Gruppdelning',
      'การแชร์ในกลุ่ม',
      'Grup Paylaşımı',
      'Chia sẻ nhóm',
      'Berbagi Grup',
    ],
    packageName: 'groupSharing',
  },
] as const;

/** Katalon Shop/Menus — Customer Support item label to its VerifyMenu page. Unlisted items only need to leave the list. */
const SHOP_SUB_MENU_LABELS: Record<ShopSubMenu, string[]> = {
  supportHome: [
    'Support Home', 'Support', 'الصفحة الرئيسية للدعم', 'Support-Startseite', 'Accueil assistance',
    'Accueil de l’assistance', 'Soporte en casa', 'Domácí stránka Podpora', '支援首頁', 'Terméktámogatás kezdőoldala',
    'Bantuan Utama', 'Supporto', 'Soporte', 'Strona główna Obsługi klienta', 'Home do Apoio', 'Asistență acasă',
    'Produktsupport', 'หน้าหลักของบริการช่วยเหลือ', 'Samsung Destek Ana Sayfası', 'Trang chủ hỗ trợ', 'עמוד שירות', 'Service',
  ],
  shopQnA: [
    "Online Shop FAQ's", 'FAQ الخاصة بالتسوّق', 'Shop FAQ', 'Preguntas Frecuentes', 'FAQ sobre la compra', 'E-shop podpora',
    'FAQs Tienda online', 'FAQ Shop', '網上商店常見問題', 'Online Shop FAQ', 'Webáruház GYIK', 'FAQ Toko', 'Samsung Shop FAQ',
    'FAQ - Sklepu internetowego', 'FAQs Loja Online', 'Întrebări frecvente magazin online', 'คำถามที่พบบ่อย',
    'Mağaza Hakkında SSS', '三星商城常見問題', 'Shop FAQs', 'FAQ Hỗ trợ mua trực tuyến', 'שאלות נפוצות – חנות', 'Online Shop FAQs',
  ],
  contact: [
    'Contact us', 'اتصل بنا', 'Kontaktiere uns', 'Contact opnemen', 'Contactez-nous', 'Nous contacter', 'Contáctanos',
    'Kontaktuj nás', 'Kontakt zum Service', 'Contacta con nosotros', '聯絡我們', 'Elérhetőség', 'Hubungi Kami', 'Contattaci',
    'Kontakt z nami', 'Contacte-nos', 'Contactează-ne', 'Kontakta oss', 'ติดต่อเรา', 'Bize Ulaşın', 'Liên Hệ', 'יצירת קשר', 'Contact',
  ],
  services: ['Services'],
};

/** URL path of menus that open inside the app WebView, where the native tree shows no page text (e.g. UK). */
const SHOP_MENU_URL_PATHS: Partial<Record<ShopMenuPage, string>> = {
  samsungCarePlus: '/samsung-care-plus',
  samsungLive: '/samsung-live',
  supportHome: '/support/',
  contact: '/support/contact',
  shopQnA: '/shop-faq',
};

/** Play Store / Galaxy Store — Katalon treats these as pass when an app install is redirected. */
const STORE_PACKAGES = [
  'com.android.vending',
  'com.sec.android.app.samsungapps',
  'com.sec.android.app.samsungappsmini',
];

export class ShopPage extends BasePage {
  private readonly shoplocator = new ShopLocator();

  /** Shop tab -> L0 category -> L1 subcategory, down to the PF list. Katalon Shop.moveToPF. */
  async openCategory(category: ShopCategory): Promise<void> {
    await this.selectBnbMenu('shop');

    const path = this.shoplocator.categoryPath(currentSiteCode(), category);
    // L0 is required; L1 is optional — some sites land on PF from L0 alone (Katalon taps L1 only when present)
    await clickElement($(path.L0), { timeout: 15000 });
    await clickIfDisplayed($(path.L1), 5000);
  }

  /** Shop -> first L0 category. */
  async openFirstCategory(): Promise<void> {
    await clickElement(this.shoplocator.L0Categories[0], { timeout: 15000 });
  }

  /** Katalon Shop.getCategoryList — category titles of the current depth, scrolling until no new one appears. */
  async getCategories(depth: 'L0' | 'L1', maxScrolls = 10): Promise<string[]> {
    const categoryTitleList = new Set<string>();
    let previousLastCategoryY = -1;
    let previousCount = 0;

    if (depth === 'L0') {
      await browser.pause(2000);
    }

    for (let attempt = 0; attempt < maxScrolls; attempt++) {
      const categories = depth === 'L0' ? this.shoplocator.L0Categories : this.shoplocator.L1Categories;
      const categoryList = [...(await categories)];

      for (const category of categoryList) {
        const categoryTitle = await category.getAttribute('content-desc');
        if (!categoryTitle?.trim() || categoryTitle === 'null') {
          continue;
        }

        const { width, height } = await category.getSize();
        const isValid = depth === 'L0' ? width < 920 : width > 920 && 53 < height && height < 400;
        if (isValid) {
          categoryTitleList.add(categoryTitle);
        }
      }

      const lastCategory = categoryList[categoryList.length - 1];
      if (!lastCategory) {
        await browser.pause(500);
        continue;
      }
      const currentLastCategoryY = (await lastCategory.getLocation()).y;

      if (currentLastCategoryY === previousLastCategoryY) {
        break;
      }
      if (categoryTitleList.size === previousCount) {
        console.log('[getCategories] no new categories found, ending scroll');
        break;
      }

      previousLastCategoryY = currentLastCategoryY;
      previousCount = categoryTitleList.size;

      await gestureByBoundary('scroll', 'down', 1000);
    }

    if (depth === 'L0') {
      markFailed([{ label: 'No L0 category banners were found on the Shop page', pass: categoryTitleList.size > 0 }], 'getCategories');
    }
    await gestureByBoundary('scroll', 'up', 1.0, { height: 1000 }, 3);
    console.log(`[getCategories] ${depth}=[ ${[...categoryTitleList].join(', ')} ]`);
    return Array.from(categoryTitleList);
  }

  /** Katalon Shop.tapCategoryListItem — scrolls (up to 3 times) to the category and taps it. */
  async selectCategory(categoryTitle: string): Promise<boolean> {
    const targetCategory = this.shoplocator.categoryTitleByName(categoryTitle);
    const maxAttempts = 3;

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      if (await isDisplayedOrFalse(targetCategory)) {
        await clickElement(targetCategory);
        return true;
      }
      if (attempt < maxAttempts) {
        await gestureByBoundary('scroll', 'down', 1.0, { height: 1000 }, 1);
      }
    }

    console.log(`[selectCategory] "${categoryTitle}" not found after ${maxAttempts} scrolls`);
    return false;
  }

  /** The landing page title must show the selected category (L1 when given, else L0). */
  async verifyCategoryTitle(mismatches: CategoryMismatch[], L0Title: string, L1Title?: string): Promise<boolean> {
    const expectedTitle = L1Title ?? L0Title;
    const shown = await waitForDisplayedOrFalse(this.shoplocator.pageTitleByName(expectedTitle), { timeout: 3000 });
    console.log(`[verifyCategoryTitle] expected="${expectedTitle}" actual=${shown ? 'shown' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    if (!shown) {
      mismatches.push(L1Title ? `L1 title mismatch: ${L0Title} > ${L1Title}` : `L0 title mismatch: ${L0Title}`);
    }
    return shown;
  }

  private async currentShopPage(
    targetPage : 'L0' | 'L1' | 'pf' | undefined,
    L0CategoryList?: string[],
    L1CategoryList?: string[],
    timeout: number = 1000
  ): Promise<'L0' | 'L1' | 'pf' | 'unknown'> {
    if (!targetPage || targetPage === 'L0') {
      const headerTitle = this.headerLocator.title;
      if (await waitForDisplayedOrFalse(headerTitle, { timeout })) {
        const headerTitleContentDesc = await headerTitle.getAttribute('content-desc');
        if (headerTitleContentDesc && BasePage.titleTexts['SHOP'].includes(headerTitleContentDesc)) {
          return 'L0';
        }
      }
    }

    if (!targetPage || targetPage === 'L1' || targetPage === 'pf') {
      const pageTitle = this.shoplocator.pageTitle();
      if (await waitForDisplayedOrFalse(pageTitle, { timeout })) {
        const pageTitleContentDesc = (await pageTitle.getAttribute('content-desc'))
          ?.split('\n')
          .pop()
          ?.trim() ?? '';
        if (pageTitleContentDesc) {
          if ((!targetPage || targetPage === 'pf') && L1CategoryList?.includes(pageTitleContentDesc)) {
            return 'pf';
          }
          if ((!targetPage || targetPage === 'L1') && L0CategoryList?.includes(pageTitleContentDesc)) {
            return 'L1';
          }
        }
      }
    }

    return 'unknown';
  }

  private async getCurrentPageType(
    L0CategoryList?: string[],
    L1CategoryList?: string[],
    targetPage?: 'L0' | 'L1' | 'pf' | 'webviewpage',
    timeout: number = 1000
  ): Promise<'L0' | 'L1' | 'pf' | 'webviewpage' | 'unknown'> {
    if (targetPage === 'L0' || targetPage === 'L1' || targetPage === 'pf') {
      return this.currentShopPage(targetPage, L0CategoryList, L1CategoryList, timeout);
    }

    if (targetPage === 'webviewpage') {
      const { page } = await getCurrentWebViewPage();
      return page !== 'unknown' ? 'webviewpage' : 'unknown';
    }

    await switchToNative();
    const nativePage = await this.currentShopPage(undefined, L0CategoryList, L1CategoryList, timeout);
    if (nativePage !== 'unknown') return nativePage;

    if (await hasAppWebViewContext()) {
      return 'webviewpage';
    }
    return 'unknown';
  }

  async goToPreviousPage(
    mismatches: CategoryMismatch[],
    targetPage: 'L0' | 'L1' | 'pf' | 'webviewpage',
    L0category: string,
    L0CategoryList?: string[],
    L1CategoryList?: string[]
  ): Promise<void> {
    const maxAttempts = targetPage === 'L1' ? 2 : 3;
    const currentPage = await this.getCurrentPageType(L0CategoryList, L1CategoryList);
    
    if (currentPage === targetPage) {
      return;
    }

    const order = { L0: 0, L1: 1, pf: 2, webviewpage: 3 };
    if (currentPage === 'unknown' || order[currentPage] < order[targetPage]) {
      await this.selectBnbMenu('shop');
      if (targetPage === 'L1') {
        await this.selectCategory(L0category);
      }
      const reason = currentPage === 'unknown'
        ? 'current page is unknown'
        : `Cannot go back from "${currentPage}" to "${targetPage}"`;
      mismatches.push(`goToPreviousPage: ${reason}. Returned to shop.`);
      return;
    }
    
    for (let i = 0; i < maxAttempts; i++) {
      await driver.pressKeyCode(4);
      
      if (await this.getCurrentPageType(L0CategoryList, L1CategoryList, targetPage) === targetPage) {
        return;
      }
    }
    
    await this.selectBnbMenu('shop');
    if (targetPage === 'L1') {
      await this.selectCategory(L0category);
    }
    mismatches.push(
      `goToPreviousPage: failed to reach page "${targetPage}" after ${maxAttempts} attempts. Returned to shop.`
    );
  }

  /** True when the header title matches the Shop title texts (BasePage.titleTexts.SHOP). */
  async isOnShop(): Promise<boolean> {
    return this.matchesHeaderTitle('SHOP');
  }

  /** Katalon Shop.moveToShopAndVerify — selects Shop on BNB, then verifies the Shop header title. */
  async prepareShopPage(timeoutMs = 5000): Promise<void> {
    await switchToNative();
    if (await this.isOnShop()) {
      return;
    }
    await markFailedAndStop(() => this.selectBnbMenu('shop'), '[prepareShopPage] Shop tab not available on BNB');

    const ready = await driver
      .waitUntil(() => this.isOnShop(), { timeout: timeoutMs, interval: 500 })
      .then(() => true, () => false);
    markFailed([{ label: 'Shop not shown (header title does not match)', pass: ready }], 'prepareShopPage');
  }

  /** Katalon Shop.getShopMenuListForSite — footer menus the site shows (sites-data shopMenuList). */
  getShopMenus(site: LoadedSite): ShopMenu[] {
    const menuList = site.shopMenuList ?? {};
    return (Object.keys(menuList) as ShopMenu[]).filter((menu) => menuList[menu]);
  }

  /** Katalon Shop.scrollUntilMenuVisible + tap. A missing menu is left to the page verify that follows. */
  async selectShopMenu(menu: ShopMenu): Promise<void> {
    await switchToNative();
    const menuElement = this.shoplocator.shopMenu(menu);
    await this.scrollUntilMenuVisible(menuElement);
    await clickElement(menuElement, { timeout: 3000 }).catch(() => console.log(`[selectShopMenu] menu not found on Shop: ${menu}`));
  }

  /** Katalon Shop/VerifyMenu — the landing page is shown natively, or the app WebView opened the menu's URL. */
  async verifyShopMenuPage(mismatches: CategoryMismatch[], menu: ShopMenuPage): Promise<void> {
    await switchToNative();
    const urlPath = SHOP_MENU_URL_PATHS[menu];
    let actual = 'not shown';
    const shown = await driver
      .waitUntil(
        async () => {
          if (await isDisplayedOrFalse(this.shoplocator.shopMenuPage(menu))) {
            actual = 'native page';
            return true;
          }
          const url = urlPath && (await getDetailedWebViewWindows()).find((window) => window.url.includes(urlPath))?.url;
          if (url) {
            actual = url.split('?')[0] ?? url;
            return true;
          }
          return false;
        },
        { timeout: 10000, interval: 1000 }
      )
      .then(() => true, () => false);
    console.log(`[verifyShopMenuPage] menu=${menu} expected=${menu}Page${urlPath ? ` or ${urlPath}` : ''} actual=${actual} result=${shown ? 'PASS' : 'FAIL'}`);
    if (!shown) {
      mismatches.push(`${menu}: landing page not shown`);
    }
  }

  /** Number of Customer Support items on screen (expanded list or Online Support page). */
  async getCustomerSupportItemCount(): Promise<number> {
    await driver
      .waitUntil(async () => (await this.shoplocator.customerSupportItems.length) > 0, { timeout: 5000, interval: 500 })
      .catch(() => undefined);
    const count = await this.shoplocator.customerSupportItems.length;
    console.log(`[getCustomerSupportItemCount] ${count}`);
    return count;
  }

  /** Katalon Shop.tapShopDropdownMenu — taps item `index` and returns its label. Re-opens Customer Support if Back closed it. */
  async selectCustomerSupportItem(index: number): Promise<string> {
    await switchToNative();
    if ((await this.shoplocator.customerSupportItems.length) === 0) {
      await this.prepareShopPage();
      await this.selectShopMenu('customerSupport');
    }
    const item = this.shoplocator.customerSupportItem(index);
    await this.scrollUntilMenuVisible(item, 3);
    const label = await getElementLabel(item);
    if (!label) {
      console.log(`[selectCustomerSupportItem] item ${index} not found`);
      return '';
    }
    // Tiles only react on their left (icon/label) part — a center tap on a wide row is ignored
    const { x, y } = await item.getLocation();
    const { width, height } = await item.getSize();
    await tapAtCoordinates(Math.round(x + width * 0.2), Math.round(y + height / 2));
    return label;
  }

  /** Mapped labels check their VerifyMenu page; other items only have to leave the Customer Support list. */
  async verifyCustomerSupportPage(mismatches: CategoryMismatch[], label: string): Promise<void> {
    const subMenu = (Object.keys(SHOP_SUB_MENU_LABELS) as ShopSubMenu[]).find((menu) =>
      SHOP_SUB_MENU_LABELS[menu].some((text) => text.toLowerCase() === label.toLowerCase())
    );
    if (subMenu) {
      await this.verifyShopMenuPage(mismatches, subMenu);
      return;
    }

    const left = await driver
      .waitUntil(async () => (await this.shoplocator.customerSupportItems.length) === 0, { timeout: 10000, interval: 500 })
      .then(() => true, () => false);
    console.log(`[verifyCustomerSupportPage] item="${label}" expected=leaves the list actual=${left ? 'left' : 'still on list'} result=${left ? 'PASS' : 'FAIL'}`);
    if (!left) {
      mismatches.push(`customer support "${label}": page did not open`);
    }
  }

  /** Katalon Shop.verifyMenu — external browser/app is closed, otherwise Android Back (skipped when already on Shop). */
  async closeShopMenuPage(): Promise<void> {
    await switchToNative();
    if (await closeExternalBrowserIfOpen()) {
      return;
    }
    if (!(await this.isOnShop())) {
      await driver.back();
    }
  }

  /**
   * Katalon Shop.verifyMoreSamsungAppsNavigation — tap each More Samsung Apps icon
   * and check the launched Android package (store packages also pass).
   */
  async verifyMoreSamsungApps(mismatches: CategoryMismatch[]): Promise<void> {
    await switchToNative();
    const shopPackage = targetPackage();
    const names = await this.collectMoreSamsungAppNames();
    console.log(`[verifyMoreSamsungApps] apps=[ ${names.join(', ')} ]`);
    await swipeByBoundary('down', 1);

    for (const name of names) {
      const app = MORE_SAMSUNG_APPS.find((entry) => (entry.labels as readonly string[]).includes(name));
      if (!app) {
        mismatches.push(`More Samsung Apps: unmapped app "${name}"`);
        continue;
      }

      const icon = this.shoplocator.moreSamsungAppIcon(name);
      if (!(await isDisplayedOrFalse(icon)) && !(await this.scrollToMoreSamsungApp(icon))) {
        mismatches.push(`More Samsung Apps: icon not on screen "${name}"`);
        continue;
      }

      const expected = this.expectedMoreSamsungAppPackages(app.packageName);
      await clickElement(icon, { timeout: 5000 }).catch(() => undefined);
      const actual = await this.launchedPackage(expected, shopPackage);
      const pass = expected.includes(actual) || STORE_PACKAGES.includes(actual);
      console.log(`[verifyMoreSamsungApps] ${name} expected=${expected.join(',')} actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
      if (!pass) {
        mismatches.push(`More Samsung Apps: "${name}" opened ${actual || 'nothing'} (expected ${expected.join(' / ')})`);
      }
      if (actual && actual !== shopPackage) {
        await forceStopPackage(actual);
        await driver.pause(1000);
      }
    }

    await swipeByBoundary('down', 1);
  }

  private expectedMoreSamsungAppPackages(packageName: string): string[] {
    if (packageName === 'shopApp') {
      return [targetPackage()];
    }
    if (packageName === 'groupSharing') {
      return ['com.samsung.android.mobileservice', 'com.samsung.android.fmm'];
    }
    return [packageName];
  }

  /** Katalon waits 3s after tap; wait a bit more if the shop app is still in front. */
  private async launchedPackage(expected: string[], shopPackage: string): Promise<string> {
    await driver.pause(3000);
    let actual = String((await driver.getCurrentPackage().catch(() => '')) ?? '');
    if ((actual && actual !== shopPackage) || expected.includes(shopPackage)) {
      return actual;
    }
    await driver
      .waitUntil(
        async () => {
          actual = String((await driver.getCurrentPackage().catch(() => '')) ?? '');
          return Boolean(actual) && actual !== shopPackage;
        },
        { timeout: 5000, interval: 500 }
      )
      .catch(() => undefined);
    return actual;
  }

  /** Icon names across the whole More Samsung Apps list (swipes until no new name appears). */
  private async collectMoreSamsungAppNames(maxSwipes = 5): Promise<string[]> {
    const names = new Set<string>();
    for (let swipe = 0; swipe < maxSwipes; swipe += 1) {
      const sizeBefore = names.size;
      for (const icon of await this.shoplocator.moreSamsungAppIcons) {
        const name = String((await icon.getAttribute('content-desc').catch(() => '')) ?? '').split('\n')[0]?.trim();
        if (name) names.add(name);
      }
      await swipeByBoundary('up', 1);
      await driver.pause(1000);
      if (sizeBefore === names.size) break;
    }
    return [...names];
  }

  private async scrollToMoreSamsungApp(icon: ChainablePromiseElement): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await swipeByBoundary('up', 1);
      if (await isDisplayedOrFalse(icon)) {
        return true;
      }
    }
    return false;
  }

  /** Opens Shop > Country and confirms `countryName` (e.g. "Chile (Español)"). */
  async changeCountry(countryName: string): Promise<void> {
    await this.prepareShopPage();

    const menu = this.shoplocator.countryMenu;
    if (!(await isDisplayedOrFalse(menu))) {
      await this.scrollUntilMenuVisible(menu);
    }
    await markFailedAndStop(
      () => clickElement(menu, { timeout: 5000 }),
      `[changeCountry] Country menu not found`
    );

    const item = this.shoplocator.countryListItem(countryName);
    let found = await isDisplayedOrFalse(item);
    if (!found) {
      await flingToStart();
      found = await isDisplayedOrFalse(item);
    }
    markFailed(
      [{ label: 'target country not found in the list', pass: found, detail: countryName }],
      'changeCountry'
    );
    await clickElement(item, { timeout: 5000 });
    await clickElement(this.shoplocator.countryContinueButton, { timeout: 8000 });
    console.log(`[changeCountry] selected "${countryName}"`);
  }

  /** Shop footer country row must show the country name (text before the language parenthesis). */
  async verifyCountry(countryName: string): Promise<void> {
    await this.prepareShopPage();
    const menu = this.shoplocator.countryMenu;
    const shown = (await isDisplayedOrFalse(menu)) || (await this.scrollUntilMenuVisible(menu));
    const expected = countryName.match(/^(.*?)\s\(/)?.[1]?.trim() || countryName.trim();
    const actual = shown ? await getElementLabel(menu) : '';
    const pass = shown && actual.toLowerCase().includes(expected.toLowerCase());
    console.log(`[verifyCountry] expected="${expected}" actual="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed(
      [{ label: 'shop country did not change', pass, detail: `expected "${expected}", actual "${actual}"` }],
      'verifyCountry'
    );
  }

  /** Katalon Shop.scrollUntilMenuVisible — scroll until the footer menu is on screen (displayed, not just in the tree). */
  private async scrollUntilMenuVisible(
    menuElement: ChainablePromiseElement,
    maxScroll = 10
  ): Promise<boolean> {
    for (let i = 0; i < maxScroll; i += 1) {
      if (await waitForDisplayedOrFalse(menuElement, { timeout: 2000 })) {
        return true;
      }
      await scrollByBoundary('down', 1, { left: 250, top: 400, width: 200, height: 800 }, 2);
    }
    return isDisplayedOrFalse(menuElement);
  }
}
