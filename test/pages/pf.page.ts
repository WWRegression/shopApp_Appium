import { BasePage } from './base.page';
import { PfLocator } from '../locators/pf.locator';
import { BcLocator } from '../locators/bc.locator';
import { PdLocator } from '../locators/pd.locator';
import { switchToNative, getCurrentWebViewPage } from '../helpers/context.helper';
import { scrollByBoundary, scrollDown } from '../helpers/gesture.helper';
import { currentSiteCode } from '../helpers/tc-filter.helper';
import { normalizeText, isExactTokenMatch, stripMarkerText, normalizeProductName } from '../helpers/data.helper';
import { clickElement, isDisplayedOrFalse, scrollUntilVisible, waitForDisplayedOrFalse, readDisplayedText } from '../helpers/element.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';
import { ShopPage, type CategoryMismatch } from './shop.page';
import { BcPage } from './bc.page';
import { PdPage } from './pd.page';

export type PfTabTarget = { tab: string } | { product: string };
export type WishState = 'add' | 'remove';

/** How the spec picks a PF card; matchPfCard only compares text. */
export type PfCardQuery =
  | { mode: 'first'; exclude?: boolean }
  | { mode: 'contains'; text: string }
  | { mode: 'exact'; product: string; exclusiveOnly?: boolean }
  | { mode: 'watch'; device: string; connectivity?: string; caseSize?: string };

/** Cards `first` skips with exclude: bundles / out of stock / multi-device cards, US Re-Newed (opens a PD), and the US Zip Code bar that can match while PF loads. */
const PF_FIRST_EXCLUDE_KEYWORDS = [
  'set',
  'bundle',
  'e-voucher',
  'duo',
  'sin inventario',
  'out of stock',
  'nicht auf lager',
  'esaurito',
  'agotado',
  '缺货',
  '+',
  're-newed',
  'change zip code',
];

/** Site → the "Online Exclusive" phrase shown on PF cards. */
const ONLINE_EXCLUSIVE_TEXT_BY_SITE: Record<string, string> = {
  AE_AR: 'فقط عبر samsung.com',
  BE: 'Online Exclusive',
  BE_FR: 'Online Exclusive',
  NL: 'Online Exclusive',
  CA_FR: 'Uniquement sur Samsung.com',
  PL: 'ekskluzywnym kolorze tylko',
  CL: 'Exclusivo en Samsung.com',
  CN: '专属色',
  CZ: 'Pouze na samsung.cz',
  ES: 'Exclusivo Online',
  FR: 'Couleur exclusive',
  HK: '網上商店限定',
  HU: 'Online exkluzív',
  NZ: 'Online Channel Exclusive',
  IN: 'Special Colour',
  MX: 'Disponible solo en Samsung.com',
  PE: 'Disponible solo en Samsung.com',
  PT: 'Exclusivo Samsung.com',
  TR: "Samsung.com'a özel",
  TW: '三星商城限定',
  VN: 'chỉ có tại Samsung.com',
  JP: 'Samsung.com限定',
  SA: 'حصرياً عبر الإنترنت',
  RO: 'Exclusiv pe Samsung.com',
};

export class PfPage extends BasePage {
  private readonly pflocator = new PfLocator();
  private readonly bcLocator = new BcLocator();
  private readonly pdLocator = new PdLocator();

  shopPage = new ShopPage();
  bcPage = new BcPage();
  pdPage = new PdPage();

  /** Scrolls the PF list, taps the first card matching query and returns its product name. */
  async selectPfCard(query: PfCardQuery, maxScrolls = 30): Promise<string> {
    await switchToNative();

    for (let attempt = 0; attempt < maxScrolls; attempt += 1) {
      for (const card of await this.pflocator.productGrid) {
        const { desc, name } = await this.readPfCard(card);
        // Exclude keywords are checked on the product name: the UK desc holds SKU / rating / price instead
        const text = query.mode === 'first' && query.exclude ? name : desc;
        if (!this.matchPfCard(text, query)) {
          continue;
        }
        console.log(`[selectPfCard] name="${name}"`);
        const image = this.pflocator.pfCardImage(card);
        if (await isDisplayedOrFalse(image)) {
          await image.click();
        } else {
          // Left side of the card, away from Compare / wishlist
          await card.click({ x: Math.round((await card.getSize()).width / 6) });
        }
        return name;
      }
      await scrollDown();
    }

    throw new Error(`PF card not matched: ${JSON.stringify(query)}`);
  }

  /** Taps the first PF card (with exclude, skipping the PF_FIRST_EXCLUDE_KEYWORDS cards) and returns its normalized product name. */
  async selectFirstPfCard(exclude = false): Promise<string | null> {
    if (!(await this.isPfCardDisplayed())) {
      return null;
    }
    return normalizeProductName(await this.selectPfCard({ mode: 'first', exclude }));
  }

  /** desc and product name of a PF card; the name is the title view when the card has one (UK), else the desc. */
  private async readPfCard(card: WebdriverIO.Element): Promise<{ desc: string; name: string }> {
    const raw = ((await card.getAttribute('content-desc').catch(() => '')) ?? '').trim();
    // Appium returns "null" for a card the list has just re-rendered
    const desc = raw === 'null' ? '' : raw;
    // US / CN / IN: the desc is the name and the child view is the Compare / wishlist button
    if (['US', 'CN', 'IN'].includes(currentSiteCode())) {
      return { desc, name: desc };
    }
    const title = this.pflocator.pfCardTitle(card);
    const titleText = (await title.isExisting().catch(() => false))
      ? ((await title.getAttribute('content-desc').catch(() => '')) ?? '').trim()
      : '';
    return { desc, name: titleText || desc };
  }

  private matchPfCard(rawText: string, query: PfCardQuery): boolean {
    const text = normalizeText(rawText);
    if (!text) return false;

    switch (query.mode) {
      case 'first':
        return !query.exclude || !PF_FIRST_EXCLUDE_KEYWORDS.some((keyword) => text.includes(keyword));

      case 'contains':
        return text.includes(normalizeText(query.text));

      case 'watch': {
        const textNoSpace = text.replace(/\s+/g, '');
        const device = normalizeText(query.device).replace(/\s+/g, '');
        const connectivity = query.connectivity ? normalizeText(query.connectivity).replace(/\s+/g, '') : '';
        const caseSize = query.caseSize ? normalizeText(query.caseSize).replace(/\s+/g, '') : '';

        let ok = Boolean(device) && textNoSpace.includes(device);
        if (connectivity) ok = ok && textNoSpace.includes(connectivity);
        if (caseSize) ok = ok && textNoSpace.includes(caseSize);
        return ok;
      }

      case 'exact': {
        const product = normalizeText(query.product);
        if (!query.exclusiveOnly) {
          return isExactTokenMatch(text, product);
        }
        const exclusiveText = normalizeText(this.getOnlineExclusiveText(currentSiteCode()));
        if (!exclusiveText || !text.includes(exclusiveText)) return false;
        return isExactTokenMatch(stripMarkerText(text, exclusiveText), product);
      }
    }
  }

  /** Falls back to the English phrase for sites not in the table. */
  private getOnlineExclusiveText(siteCode: string): string {
    return ONLINE_EXCLUSIVE_TEXT_BY_SITE[siteCode.toUpperCase()] ?? 'Samsung.com only';
  }

  async getBcPdProductName(): Promise<string | null> {
    const { page } = await getCurrentWebViewPage({ waitMs: 10000 });

    if (page === 'pd') {
      await this.pdPage.preparePdPage().catch(() => undefined);
      return normalizeProductName(await readDisplayedText(() => this.pdLocator.summaryProductName));
    }
    if (page === 'bc') {
      await this.bcPage.prepareBcPage().catch(() => undefined);
      return normalizeProductName(await readDisplayedText(() => this.bcLocator.summaryDeviceName));
    }

    return null;
  }

  verifyProductNameMatch(
    mismatches: CategoryMismatch[],
    pfName: string | null,
    bcPdName: string | null,
    L0Title?: string,
    L1Title?: string,
  ): void {
    const where = `${L0Title ?? ''}${L1Title ? ` > ${L1Title}` : ''}`;
    if (pfName === null) {
      console.log(`[verifyProductNameMatch] ${where} PF card not shown result=FAIL`);
      mismatches.push(`PF card not shown: ${where}`);
      return;
    }
    if (!pfName) {
      console.log(`[verifyProductNameMatch] ${where} PF card name not read result=FAIL`);
      mismatches.push(`PF card name not read: ${where}`);
      return;
    }
    if (!bcPdName) {
      console.log(`[verifyProductNameMatch] ${where} BC/PD name not found result=FAIL`);
      mismatches.push(`BC/PD product name not found: ${where}`);
      return;
    }
    const pass = this.productNameIncludes(pfName, bcPdName);
    console.log(
      `[verifyProductNameMatch] ${where} expected="${pfName}" actual="${bcPdName}" result=${pass ? 'PASS' : 'FAIL'}`
    );
    if (pass) {
      return;
    }

    mismatches.push(
      `PF/PD product name mismatch: ${where} (PF: "${pfName}", BC/PD: "${bcPdName}")`
    );
  }

  private productNameIncludes(pfName: string | null, bcPdName: string | null): boolean {
    const pf = pfName?.trim().toLowerCase() ?? '';
    const bcPd = bcPdName?.trim().toLowerCase() ?? '';
    return Boolean(pf) && Boolean(bcPd) && (pf.includes(bcPd) || bcPd.includes(pf));
  }

  /** Verifies the PF page is shown (product cards displayed). */
  async verifyPfPage(): Promise<void> {
    await switchToNative();
    const shown = await this.isPfCardDisplayed();
    console.log(`[verifyPfPage] expected=PF cards actual=${shown ? 'shown' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'PF cards not shown', pass: shown }], 'verifyPfPage');
  }

  async isPfCardDisplayed(): Promise<boolean> {
    return waitForDisplayedOrFalse(this.pflocator.productGrid[0], { timeout: 5000 });
  }

  async selectFilterOption(_option: string): Promise<void> {
    // TODO: Implement filter option selection
  }

  async selectSortOption(_option: string): Promise<void> {
    // TODO: Implement sort option selection
  }

  async selectPfTab(_target: PfTabTarget): Promise<void> {
    // TODO: Implement PF tab selection (isPfTabMatch / selectPfTabUs 참고)
  }

  isPfTabMatch(_tabLabel: string, _target: PfTabTarget): boolean {
    // TODO: Implement tab label matching helper for selectPfTab
    return false;
  }

  async selectPfTabUs(_target: PfTabTarget): Promise<void> {
    // TODO: Implement US-specific tab selection variant
  }

  async getPfCardInfo(part?: string): Promise<string | Record<string, string>> {
    // TODO: Implement PF card info readback
    return part ? '' : {};
  }

  async getPfCardList(): Promise<string[]> {
    // TODO: Implement PF card list readback
    return [];
  }

  /** Scrolls the PF list to the end and counts the unique cards; stops the TC if a card lacks every keyword. */
  async getPfCardMatchCount(keywords: string[], maxScrolls = 15): Promise<number> {
    await switchToNative();
    const normalizedKeywords = keywords.map((keyword) => normalizeText(keyword));
    // Keyed by card desc so a card seen on several scrolls is counted once
    const matchedByCard = new Map<string, boolean>();
    let previousLastCardPosition: string | undefined;
    let canScrollMore = true;
    let scrolls = 0;

    for (; scrolls < maxScrolls; scrolls += 1) {
      const cards = [...(await this.pflocator.productGrid)];
      await this.collectPfCardMatches(cards, normalizedKeywords, matchedByCard);

      // Stop at the bottom, or when the list did not move (the scroll result can be wrong)
      if (!canScrollMore) break;
      const lastCardPosition = await this.getLastPfCardPosition(cards);
      if (lastCardPosition === previousLastCardPosition) break;

      previousLastCardPosition = lastCardPosition;
      canScrollMore = await scrollDown();
    }

    const unmatchedCards = [...matchedByCard].filter(([, matched]) => !matched).map(([desc]) => desc.replace(/\s+/g, ' '));
    markFailedAndStop(
      unmatchedCards.map((desc) => ({ label: `Keyword not found in PF card: ${desc}`, pass: false })),
      'getPfCardMatchCount'
    );
    console.log(`[getPfCardMatchCount] keywords=${JSON.stringify(keywords)} unique PF cards=${matchedByCard.size} scrolls=${scrolls}`);
    return matchedByCard.size;
  }

  /** Records whether each visible card's label or title contains a keyword; a card matched on an earlier scroll stays matched. */
  private async collectPfCardMatches(
    cards: WebdriverIO.Element[],
    normalizedKeywords: string[],
    matchedByCard: Map<string, boolean>
  ): Promise<void> {
    const containsKeyword = (text: string) => normalizedKeywords.some((keyword) => normalizeText(text).includes(keyword));

    for (const card of cards) {
      const desc = ((await card.getAttribute('content-desc').catch(() => '')) ?? '').trim();
      if (!desc) continue;
      let matched = matchedByCard.get(desc) || containsKeyword(desc);
      // UK keeps the product name in a child view
      const title = this.pflocator.pfCardTitle(card);
      if (!matched && (await title.isExisting().catch(() => false))) {
        matched = containsKeyword((await title.getAttribute('content-desc').catch(() => '')) ?? '');
      }
      matchedByCard.set(desc, matched);
    }
  }

  /** Label and position of the last card on screen ("desc@{x,y}"), compared across scrolls to see if the list moved. */
  private async getLastPfCardPosition(cards: WebdriverIO.Element[]): Promise<string> {
    const lastCard = cards.at(-1);
    if (!lastCard) {
      return '';
    }
    const desc = await lastCard.getAttribute('content-desc').catch(() => '');
    const location = await lastCard.getLocation().catch(() => null);
    return `${desc}@${JSON.stringify(location)}`;
  }

  /** Reads the product count from the "Products (10)" tab shown on search results; 0 when not shown. */
  async getSearchProductCount(): Promise<number> {
    await switchToNative();
    const productCount = this.pflocator.productCount;
    if (!(await waitForDisplayedOrFalse(productCount, { timeout: 15000 }))) {
      console.log('[getSearchProductCount] Products tab count not shown');
      return 0;
    }
    const digits = ((await productCount.getAttribute('content-desc')) ?? '').replace(/\D/g, '');
    return digits ? Number(digits) : 0;
  }

  /** Reads the product count next to Apply in the filter popup; used on PF opened from a category, which has no Products tab. */
  async getFilterProductCount(): Promise<number> {
    // TODO: Implement after the filter popup locators are added
    return 0;
  }

  async getPfTabs(): Promise<string[]> {
    // TODO: Implement PF tab list readback
    return [];
  }

  async getMatchedPfTabs(_product: string): Promise<string[]> {
    // TODO: Implement matched PF tab lookup
    return [];
  }

  async getWishState(): Promise<WishState> {
    // TODO: Implement wish icon state readback
    return 'remove';
  }

  /** Verifies the Products tab count equals the number of PF cards containing the keyword. */
  async verifySearchResultCount(keywords: string[]): Promise<void> {
    const productCount = await this.getSearchProductCount();
    const matchingCount = await this.getPfCardMatchCount(keywords);
    const pass = matchingCount === productCount;
    console.log(
      `[verifySearchResultCount] expected=${productCount} (Products tab count) actual=${matchingCount} (matching PF cards) result=${pass ? 'PASS' : 'FAIL'}`
    );
    markFailed(
      [{ label: 'Mismatch between Products tab count and number of matching PF cards', pass, detail: `Products tab ${productCount}, PF cards ${matchingCount}` }],
      'verifySearchResultCount'
    );
  }

  async verifyNoSearchResultsFound(): Promise<void> {
    // TODO: Implement no-results verification
  }

  async verifyFilterApplied(_selected: string, _products?: string[]): Promise<void> {
    // TODO: Implement filter-applied verification
  }

  async verifySortApplied(_selected: string, _products?: string[]): Promise<void> {
    // TODO: Implement sort-applied verification
  }

  async verifyWishState(_expected: WishState): Promise<void> {
    // TODO: Implement wish state verification
  }

  async verifyPfRedirect(_options: Record<string, string>): Promise<void> {
    // TODO: Implement PF redirect verification
  }

  async clickFilter(): Promise<void> {
    // TODO: Implement filter panel open
  }

  async clickFilterApply(): Promise<void> {
    // TODO: Implement filter apply action
  }

  async clickSort(): Promise<void> {
    // TODO: Implement sort panel open
  }

  async clickSortApply(): Promise<void> {
    // TODO: Implement sort apply action
  }

  /** Taps the first "add to wishlist" heart on PF and returns that card's SKU. */
  async clickAddToWishlist(): Promise<string> {
    await switchToNative();
    const icon = this.pflocator.wishlistIcon();
    // PF cards render a few seconds after landing; scrolling earlier skips the first cards
    await waitForDisplayedOrFalse(icon, { timeout: 10000 });
    markFailedAndStop([{ label: 'add-to-wishlist heart not found on PF', pass: await scrollUntilVisible(icon) }], 'clickAddToWishlist');

    // The SKU sits anywhere in the label ("Add to wishlist SM-A185FZKDEUB", CN "添加 SM-F9710ZGDCHC 至我的收藏")
    const label = (await icon.getAttribute('content-desc')) ?? '';
    const sku = label.split(/\s+/).find((token) => /^[A-Z0-9]+-[A-Z0-9]+$/.test(token)) ?? '';
    markFailedAndStop([{ label: 'SKU not found in the wishlist heart label', pass: Boolean(sku), detail: label }], 'clickAddToWishlist');

    // Nudge so the floating Chat button cannot sit on top of the heart
    await scrollByBoundary('down', 0.1);
    await clickElement(this.pflocator.wishlistIcon(sku), { timeout: 5000 });
    console.log(`[clickAddToWishlist] sku=${sku}`);
    return sku;
  }

  /** A guest tapping the wishlist heart gets the login popup. */
  async verifyLoginPopup(): Promise<void> {
    await switchToNative();
    const shown = await waitForDisplayedOrFalse(this.pflocator.loginConfirmModal, { timeout: 5000 });
    console.log(`[verifyLoginPopup] expected=login popup actual=${shown ? 'login popup' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'Login popup failed to appear on guest wishlist action', pass: shown }], 'verifyLoginPopup');
  }

  /** Continue on the wishlist login popup; starts the login (auto login with a device account, else the login / SSO screens). */
  async clickContinueOnLoginPopup(): Promise<void> {
    await switchToNative();
    await clickElement(this.pflocator.loginPopupContinueButton, { timeout: 5000 });
  }
}
