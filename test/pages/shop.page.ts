import { BasePage } from './base.page';
import { OnboardingPage } from './onboarding.page';
import { ShopLocator, ShopCategory, type ShopMenu, type ShopMenuPage, type ShopSubMenu } from '../locators/shop.locator';
import type { LoadedSite } from '../../config/site';
import { gestureByBoundary, swipeByBoundary, scrollByBoundary, tapAtCoordinates } from '../helpers/gesture.helper'
import {
  switchToNative,
  getCurrentWebViewPage,
  getDetailedWebViewWindows,
  hasAppWebViewContext,
  targetPackage,
} from '../helpers/context.helper';
import { closeExternalBrowserIfOpen, forceStopPackage, getBrowserPages } from '../helpers/device.helper';
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

/** Icon name to expected Android package. */
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

/** URL path of menus that open inside the app WebView, where the native tree shows no page text (e.g. UK). Same English paths in every country. */
export const SHOP_MENU_URL_PATHS: Partial<Record<ShopMenuPage, string>> = {
  samsungCarePlus: '/samsung-care-plus',
  samsungLive: '/samsung-live',
  supportHome: '/support/',
  contact: '/support/contact',
  shopQnA: '/shop-faq',
};

const CUSTOMER_SUPPORT_SUB_MENUS: ShopSubMenu[] = ['supportHome', 'shopQnA', 'contact', 'services'];

type CustomerSupportItem = { label: string; subMenu?: ShopSubMenu };

/** Play Store / Galaxy Store — an app-install redirect counts as a pass. */
const STORE_PACKAGES = [
  'com.android.vending',
  'com.sec.android.app.samsungapps',
  'com.sec.android.app.samsungappsmini',
];

/** Last non-empty line: "Staubsauger Zubehör\\n" and "Samsung\\nStaubsauger Zubehör\\n" → same title. */
function normalizeCategoryTitle(text: string): string {
  return text.split('\n').map((line) => line.trim()).filter(Boolean).at(-1) ?? '';
}

/** Same-meaning words between a menu and its page. Landing URLs stay English (`/shop-faq`, `/support/contact`) — do not add per-country labels here. */
export const SAME_MENU_WORDS = [
  ['inbox', 'notification', 'notificações', 'notificação', 'הודעות', 'התראות'],
  ['interest', 'category', 'like', 'intérêt', 'catégorie', 'zajm', 'thich', '兴趣', '興趣', 'erdeklod', 'zainteres', 'interes', 'สนใจ'],
  ['cookie', 'privacy', 'témoin', 'خصوصية', 'datenschutz', 'donnée', 'privasi', 'soukrom', 'confidential', 'rieng', '隐私', '隱私', '私隱', 'adatved', 'suti', 'prywatn', 'คุกกี้', 'ส่วนตัว'],
  ['contact', 'اتصل', 'hubungi', 'kontakt', 'lien', '联系', '聯絡', 'ติดต่อ'],
  ['legal', 'قانونية', 'rechtlich', 'utilisation', 'pravni', 'phap', '法律', 'jogi', 'prawn', 'juridic', 'utilizare', 'กฎหมาย', 'กฏหมาย', '服务条款'],
  ['term', 'condition', 'podmink', 'bedingung', 'khoan', '条款', '條款', 'feltetel', 'warunk', 'regulamin', 'conditii', 'ข้อกำหนด', 'เงื่อนไข', 'tnc'],
  ['license', 'licence', 'رخصة', 'licenc', 'ใบอนุญาต'],
  ['version', 'verze', 'phien', '版本', 'verzio', 'wersja', 'versiun', 'เวอร์ชัน', 'เวอร์ชั่น'],
];

/** Strips combining marks so é/á match e/a. */
export function foldAccents(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** True when `pageName` (title or URL) contains `word`, or a URL token shares a 4-letter stem (Términos → terms-and-conditions). */
export function pageHasWord(pageName: string, word: string): boolean {
  const folded = foldAccents(pageName);
  if (folded.includes(word)) {
    return true;
  }
  if (word.length < 4) {
    return false;
  }
  const stem = word.slice(0, 4);
  return folded.split(/[^a-z0-9]+/).some((token) => token.length >= 4 && (token.startsWith(stem) || word.startsWith(token.slice(0, 4))));
}

/** Words taken from a menu name, plus SAME_MENU_WORDS aliases. Apostrophes split tokens; Arabic ال / لل prefixes are dropped. */
export function getMenuWords(menuName: string): string[] {
  const fillers = ['and', 'for', 'the', 'you', 'your', 'mes'];
  const words: string[] = [];
  for (const raw of foldAccents(menuName).split(/[^\p{L}\p{N}]+/u)) {
    const word = raw.replace(/^(وال|لل|بال|كال|فال|ال)/, '');
    if (word.length > 2 && !fillers.includes(word)) {
      words.push(word.length > 4 ? word.replace(/e?s$/, '') : word);
    }
  }
  const core = words.length > 0 ? words : [foldAccents(menuName).replace(/[\s'"]/g, '')];
  const aliases: string[] = [];
  for (const word of core) {
    const group = SAME_MENU_WORDS.find((names) =>
      names.some((name) => {
        const n = foldAccents(name);
        return n === word || n.startsWith(word) || word.startsWith(n) || (n.length >= 2 && word.includes(n));
      })
    );
    if (group) {
      aliases.push(...group.map(foldAccents));
    }
  }
  return aliases.length > 0 ? [...core, ...aliases] : core;
}

export class ShopPage extends BasePage {
  protected readonly shoplocator = new ShopLocator();
  /** WebView pages open before the last menu click — page checks only read pages opened after it. */
  protected readonly knownPageIds = new Set<string>();
  private readonly knownPageUrls = new Map<string, string>();

  /** Remembers the WebView pages open now, so the next page check only reads what the next click opens. */
  protected async saveWebViewBaseline(): Promise<void> {
    this.knownPageIds.clear();
    this.knownPageUrls.clear();
    for (const page of await getBrowserPages()) {
      this.knownPageIds.add(page.id);
      this.knownPageUrls.set(page.id, page.url.split('?')[0]);
    }
  }

  /**
   * Polls up to 10s until the opened page contains one of the words.
   * A newly opened WebView page (or another app) is judged by its title / URL only; otherwise the native screen elements are searched.
   */
  protected async waitForPageContaining(words: readonly string[]): Promise<{ pass: boolean; actual: string }> {
    let actual = '';
    const pass = await driver
      .waitUntil(
        async () => {
          const pageNames = await this.getOpenedPageNames();
          if (pageNames.length === 0) {
            actual = await this.findElementContaining(words);
            return actual !== '';
          }
          const matched = pageNames.find((name) => words.some((word) => pageHasWord(name, word)));
          actual = `page "${matched ?? pageNames.join(' | ')}"`;
          return matched !== undefined;
        },
        { timeout: 10000, interval: 500 }
      )
      .then(() => true, () => false);
    return { pass, actual: actual || 'no element contains the words' };
  }

  /** Label of the first screen element containing one of the words; BNB tabs are skipped since they show on every page. Accents are folded so Versión matches version. */
  private async findElementContaining(words: readonly string[]): Promise<string> {
    const bnbHome = this.bnbLocator.menu('home');
    const bnbTop = (await bnbHome.isExisting()) ? (await bnbHome.getLocation()).y : Infinity;
    const match = async (element: WebdriverIO.Element): Promise<string> => {
      const { y } = await element.getLocation().catch(() => ({ y: Infinity }));
      if (y >= bnbTop) {
        return '';
      }
      const label = ((await element.getText().catch(() => '')) || (await element.getAttribute('content-desc').catch(() => '')) || '').trim();
      return label && words.some((word) => pageHasWord(label, word)) ? `element "${label.replace(/\n/g, ' / ').trim()}"` : '';
    };
    for (const element of await this.headerLocator.elementsContaining(words)) {
      const found = await match(element);
      if (found) {
        return found;
      }
    }
    let checked = 0;
    for (const element of await $$('//android.view.View[string-length(@content-desc) > 2] | //android.widget.TextView[string-length(@text) > 2]')) {
      if (++checked > 40) {
        break;
      }
      const found = await match(element);
      if (found) {
        return found;
      }
    }
    return '';
  }

  /** Title and URL of each WebView page opened since the click, plus the package (and Chrome URL) of another app in front; empty for a native page. */
  protected async getOpenedPageNames(): Promise<string[]> {
    const names: string[] = [];
    for (const page of await getBrowserPages()) {
      const url = page.url.split('?')[0];
      if (!this.knownPageIds.has(page.id) || this.knownPageUrls.get(page.id) !== url) {
        names.push(page.title, url);
      }
    }
    const currentPackage = await driver.getCurrentPackage().catch(() => '');
    if (currentPackage !== targetPackage()) {
      names.push(currentPackage);
      const urlBar = this.headerLocator.browserUrlBar;
      const browserUrl =
        ((await urlBar.getText().catch(() => '')) ||
          (await urlBar.getAttribute('text').catch(() => '')) ||
          (await getElementLabel(urlBar))) ??
        '';
      if (browserUrl.trim()) {
        names.push(browserUrl.trim().split('?')[0]);
      }
    }
    return names;
  }

  /** Shop tab -> L0 category -> L1 subcategory, down to the PF list. */
  async openCategory(category: ShopCategory): Promise<void> {
    await this.selectBnbMenu('shop');

    const path = this.shoplocator.categoryPath(currentSiteCode(), category);
    // L0 is required; L1 is optional — some sites land on PF from L0 alone, so L1 is tapped only when present
    await clickElement($(path.L0), { timeout: 15000 });
    await clickIfDisplayed($(path.L1), 5000);
  }

  /** Verifies the L1 list of `category` is shown (the L1 item openCategory taps). */
  async verifyCategoryL1Page(category: ShopCategory): Promise<void> {
    await switchToNative();
    const path = this.shoplocator.categoryPath(currentSiteCode(), category);
    const shown = await waitForDisplayedOrFalse($(path.L1), { timeout: 5000 });
    console.log(`[verifyCategoryL1Page] expected=${category} L1 list actual=${shown ? 'shown' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: `${category} L1 list not shown`, pass: shown }], 'verifyCategoryL1Page');
  }

  /** Verifies the Shop (L0) page is shown by its header title. */
  async verifyShopPage(timeoutMs = 5000): Promise<void> {
    const shown = await driver
      .waitUntil(() => this.isOnShop(), { timeout: timeoutMs, interval: 500 })
      .then(() => true, () => false);
    console.log(`[verifyShopPage] expected=Shop actual=${shown ? 'Shop' : 'not Shop'} result=${shown ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'Shop page not shown', pass: shown }], 'verifyShopPage');
  }

  /** Shop -> first L0 category. */
  async openFirstCategory(): Promise<void> {
    await clickElement(this.shoplocator.L0Categories[0], { timeout: 15000 });
  }

  /** Category titles of the current depth, scrolling until no new one appears. */
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
      markFailedAndStop([{ label: 'No L0 category banners were found on the Shop page', pass: categoryTitleList.size > 0 }], 'getCategories');
    }
    await gestureByBoundary('scroll', 'up', 1.0, { height: 1000 }, 4);
    console.log(`[getCategories] ${depth}=[ ${[...categoryTitleList].join(', ')} ]`);
    return Array.from(categoryTitleList);
  }

  /** Scrolls (up to 3 times) to the category and taps it. */
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
        const pageTitleContentDesc = normalizeCategoryTitle(await pageTitle.getAttribute('content-desc') ?? '');
        if (pageTitleContentDesc) {
          if ((!targetPage || targetPage === 'pf') && L1CategoryList?.some((title) => normalizeCategoryTitle(title) === pageTitleContentDesc)) {
            return 'pf';
          }
          if ((!targetPage || targetPage === 'L1') && L0CategoryList?.some((title) => normalizeCategoryTitle(title) === pageTitleContentDesc)) {
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

  /** Selects Shop on BNB, then verifies the Shop header title. */
  async prepareShopPage(timeoutMs = 5000): Promise<void> {
    await switchToNative();
    if (await this.isOnShop()) {
      return;
    }
    await markFailedAndStop(() => this.selectBnbMenu('shop'), '[prepareShopPage] Shop tab not available on BNB');

    const ready = await driver
      .waitUntil(() => this.isOnShop(), { timeout: timeoutMs, interval: 500 })
      .then(() => true, () => false);
    markFailedAndStop([{ label: 'Shop not shown (header title does not match)', pass: ready }], 'prepareShopPage');
  }

  /** Footer menus the site shows (sites-data shopMenuList). */
  getShopMenus(site: LoadedSite): ShopMenu[] {
    const menuList = site.shopMenuList ?? {};
    return (Object.keys(menuList) as ShopMenu[]).filter((menu) => menuList[menu]);
  }

  /** Scrolls until the menu is visible and taps it; false (recorded as a failure) when the menu is not on Shop. */
  async selectShopMenu(menu: ShopMenu): Promise<boolean> {
    await switchToNative();
    const menuElement = this.shoplocator.shopMenu(menu);
    await this.scrollUntilMenuVisible(menuElement);
    const clicked = await clickElement(menuElement, { timeout: 3000 }).then(() => true, () => false);
    markFailed([{ label: `menu not found on Shop: ${menu}`, pass: clicked }], 'selectShopMenu');
    return clicked;
  }

  /** The landing page is shown natively, or the app WebView opened the menu's URL. */
  async verifyShopMenuPage(menu: ShopMenuPage): Promise<void> {
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
    markFailed([{ label: `${menu}: landing page not shown`, pass: shown, detail: actual }], 'verifyShopMenuPage');
  }

  /** Customer Support items on screen (expanded list or Online Support page), each with the sub-menu its label belongs to. */
  async getCustomerSupportItems(): Promise<CustomerSupportItem[]> {
    await driver
      .waitUntil(async () => (await this.shoplocator.customerSupportItems.length) > 0, { timeout: 5000, interval: 500 })
      .catch(() => undefined);
    const items: CustomerSupportItem[] = [];
    for (const element of await this.shoplocator.customerSupportItems) {
      const label = ((await element.getAttribute('content-desc')) ?? '').trim();
      if (label) {
        items.push({ label, subMenu: await this.findCustomerSupportSubMenu(label) });
      }
    }
    console.log(`[getCustomerSupportItems] [ ${items.map((item) => `${item.label}=${item.subMenu ?? 'unmapped'}`).join(', ')} ]`);
    return items;
  }

  /** Sub-menu whose locator matches the item with this label on screen. */
  private async findCustomerSupportSubMenu(label: string): Promise<ShopSubMenu | undefined> {
    for (const subMenu of CUSTOMER_SUPPORT_SUB_MENUS) {
      const element = this.shoplocator.customerSupportSubMenu(subMenu);
      if ((await element.isExisting()) && ((await element.getAttribute('content-desc')) ?? '').trim() === label) {
        return subMenu;
      }
    }
    return undefined;
  }

  /** Taps the item with this label; false (recorded as a failure) when it is not found. Re-opens Customer Support if Back closed it. */
  async selectCustomerSupportItem(label: string): Promise<boolean> {
    await switchToNative();
    if ((await this.shoplocator.customerSupportItems.length) === 0) {
      await this.prepareShopPage();
      await this.selectShopMenu('customerSupport');
    }
    const item = this.shoplocator.customerSupportItem(label);
    await this.scrollUntilMenuVisible(item, 3);
    const shown = await isDisplayedOrFalse(item);
    markFailed([{ label: `customerSupport item not found: ${label}`, pass: shown }], 'selectCustomerSupportItem');
    if (!shown) {
      return false;
    }
    await this.saveWebViewBaseline();
    // Tiles only react on their left (icon/label) part — a center tap on a wide row is ignored
    const { x, y } = await item.getLocation();
    const { width, height } = await item.getSize();
    await tapAtCoordinates(Math.round(x + width * 0.2), Math.round(y + height / 2));
    return true;
  }

  /** After a sub-menu click: the list must be gone and the page must contain a word of the menu name. */
  protected async verifyDetailPageOpened(
    menuName: string,
    isListGone: () => Promise<boolean>,
    acceptedNames: readonly string[] = []
  ): Promise<void> {
    const words = [...getMenuWords(menuName), ...acceptedNames.map((name) => name.toLowerCase())];
    const listGone = await isListGone();
    const { pass, actual } = listGone
      ? await this.waitForPageContaining(words)
      : { pass: false, actual: 'still on the sub-menu list' };
    console.log(`[verifyDetailPageOpened] menu="${menuName}" expected=page containing "${words.join('" or "')}" actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: `sub-menu page not opened: ${menuName}`, pass, detail: actual }], 'verifyDetailPageOpened');
  }

  /** The page opened from a Customer Support item: its sub-menu page locator, or a page containing its name for other items (IN Online Support icons). */
  async verifyCustomerSupportPage(item: CustomerSupportItem): Promise<void> {
    if (item.subMenu) {
      await this.verifyShopMenuPage(item.subMenu);
      return;
    }
    await this.verifyDetailPageOpened(item.label, () =>
      driver
        .waitUntil(async () => (await this.shoplocator.customerSupportItems.length) === 0, { timeout: 10000, interval: 500 })
        .then(() => true, () => false)
    );
  }

  /** External browser/app is closed, otherwise Android Back (skipped when already on Shop). */
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
   * Tap each More Samsung Apps icon
   * and check the launched Android package (store packages also pass).
   */
  async verifyMoreSamsungApps(): Promise<void> {
    await switchToNative();
    const shopPackage = targetPackage();
    const names = await this.collectMoreSamsungAppNames();
    console.log(`[verifyMoreSamsungApps] apps=[ ${names.join(', ')} ]`);
    await swipeByBoundary('down', 1);

    for (const name of names) {
      const app = MORE_SAMSUNG_APPS.find((entry) => (entry.labels as readonly string[]).includes(name));
      if (!app) {
        markFailed([{ label: `More Samsung Apps: unmapped app "${name}"`, pass: false }], 'verifyMoreSamsungApps');
        continue;
      }

      const icon = this.shoplocator.moreSamsungAppIcon(name);
      if (!(await isDisplayedOrFalse(icon)) && !(await this.scrollToMoreSamsungApp(icon))) {
        markFailed([{ label: `More Samsung Apps: icon not on screen "${name}"`, pass: false }], 'verifyMoreSamsungApps');
        continue;
      }

      const expected = this.expectedMoreSamsungAppPackages(app.packageName);
      await clickElement(icon, { timeout: 5000 }).catch(() => undefined);
      const actual = await this.launchedPackage(expected, shopPackage);
      const pass = expected.includes(actual) || STORE_PACKAGES.includes(actual);
      console.log(`[verifyMoreSamsungApps] ${name} expected=${expected.join(',')} actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
      markFailed(
        [{ label: `More Samsung Apps: "${name}" did not open its app`, pass, detail: `expected ${expected.join(' / ')}, actual ${actual || 'nothing'}` }],
        'verifyMoreSamsungApps'
      );
      if (actual && actual !== shopPackage) {
        await forceStopPackage(actual);
        await driver
          .waitUntil(async () => (await driver.getCurrentPackage().catch(() => '')) === shopPackage, { timeout: 3000, interval: 300 })
          .catch(() => undefined);
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

  /** Waits 3s after the tap so the app is fully shown, and up to 5s more if the shop app is still in front. */
  private async launchedPackage(expected: string[], shopPackage: string): Promise<string> {
    await driver.pause(1000);
    let actual = String((await driver.getCurrentPackage().catch(() => '')) ?? '');
    if ((actual && actual !== shopPackage) || expected.includes(shopPackage)) {
      return actual;
    }
    await driver
      .waitUntil(
        async () => {
          actual = String((await driver.getCurrentPackage().catch(() => '')) ?? '');
          return actual !== '' && actual !== shopPackage;
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

    await new OnboardingPage().selectCountry(countryName);
  }

  /** Shop footer country row must show the country name (text before the language parenthesis). */
  async verifyCountry(countryName?: string): Promise<void> {
    // Single-country apps (no countryName in site data) have no country to compare
    if (!countryName) {
      console.log('[verifyCountry] no countryName for this site — skipped');
      return;
    }
    await this.prepareShopPage();
    const menu = this.shoplocator.countryMenu;
    const shown = (await isDisplayedOrFalse(menu)) || (await this.scrollUntilMenuVisible(menu));
    const expected = countryName.match(/^(.*?)\s\(/)?.[1]?.trim() || countryName.trim();
    const actual = shown ? await getElementLabel(menu) : '';
    const pass = shown && actual.toLowerCase().includes(expected.toLowerCase());
    console.log(`[verifyCountry] expected="${expected}" actual="${actual}" result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop(
      [{ label: 'shop country did not change', pass, detail: `expected "${expected}", actual "${actual}"` }],
      'verifyCountry'
    );
  }

  /** Scroll until the footer menu is on screen (displayed, not just in the tree). */
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
