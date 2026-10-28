import { BasePage } from './base.page';
import { PfLocator } from '../locators/pf.locator';
import { BcLocator } from '../locators/bc.locator';
import { PdLocator } from '../locators/pd.locator';
import { switchToNative, getCurrentWebViewPage } from '../helpers/context.helper';
import { scrollByBoundary, scrollDown } from '../helpers/gesture.helper';
import { currentSiteCode } from '../helpers/tc-filter.helper';
import { normalizeText, isExactTokenMatch, stripMarkerText, normalizeProductName, parsePriceToNumber } from '../helpers/data.helper';
import { clickElement, getElementLabel, isDisplayedOrFalse, scrollUntilVisible, waitForDisplayedOrFalse, readDisplayedText } from '../helpers/element.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';
import { ShopPage, type CategoryMismatch } from './shop.page';
import { BcPage } from './bc.page';
import { PdPage } from './pd.page';

export type PfFilterKind = 'price' | 'product' | 'resolution';
export type PfSortKind = 'price' | 'rating';

/** One filter option. `count` is the product total shown on Apply. */
export type PfFilterChoice = { kind: PfFilterKind; value: string; count: number };

/** One sort option. Price sort is high to low. */
export type PfSortChoice = { kind: PfSortKind; value: string };

type PfProduct = { name: string; price: number; rating: number; outOfStock: boolean };

const FILTER_EXCEPTION_KEYWORDS: Record<string, string[]> = {
  'galaxy z': ['fold', 'flip', 'فولد', 'فليب'],
  fhd: ['flip', 'فليب', 'a57'],
  'fhd+': ['s25'],
  qxga: ['fold', 'فولد'],
};

const PRICE_BELOW_WORDS = ['below', 'under', 'less', 'up to', 'น้อยกว่า', '以下', 'moins', "jusqu'à", '低於', 'legfeljebb', 'do', '<'];

const OUT_OF_STOCK_WORDS = [
  'agotado', 'ausverkauft', 'brak w magazynie', 'esaurito', 'en rupture de stock', 'hàng không bán',
  'inventario', 'není na skladě', 'niet op voorraad', 'nicht auf lager', 'no disponible', 'nincs készleten',
  'rupture de stock', 'slut i lager', 'stoc epuizat', 'stok habis', 'stokta yok', 'stock', 'غير متاح',
  'نفذ من المخزون', '售罄', '缺货', 'สินค้าหมดชั่วคราว', 'אזל במלאי', 'out of stock',
];

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
        await driver.pause(1000);
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

  /** Opens the filter popup, selects one option, and applies. Returns the Apply product count after it updates. */
  async applyFilter(): Promise<PfFilterChoice> {
    await this.clickFilter();
    await waitForDisplayedOrFalse(this.pflocator.filterApplyButton, { timeout: 5000 });
    const before = await this.getFilterProductCount();
    const filter = await this.selectFirstFilter();
    const count = await this.waitForApplyCountUpdate(before);
    await this.clickFilterApply();
    return { ...filter, count };
  }

  /** Opens the sort list beside the filter button and selects price, high to low. */
  async applySort(): Promise<PfSortChoice> {
    await this.clickSort();
    const sort = await this.selectPriceSort();
    await this.clickSortApply();
    return sort;
  }

  /** Apply count equals the PF cards. Cards match the filter, and each stock group is sorted by price descending. */
  async verifyFilterAndSort(filter: PfFilterChoice, sort: PfSortChoice): Promise<void> {
    console.log('[verifyFilterAndSort] filter=', filter, 'sort=', sort);
    const products = await this.collectPfProducts();
    const countMatches = products.length === filter.count;
    console.log(
      `[verifyFilterAndSort] Filter count=${filter.count} | PFcards=${products.length} | result=${countMatches ? 'PASS' : 'FAIL'} | filter=${filter.kind}:"${filter.value}" sort=${sort.kind}`
    );
    markFailed(
      [{ label: 'PF card count does not match Filter count', pass: countMatches, detail: `FilterCount: ${filter.count} | PFcards: ${products.length}` }],
      'verifyFilterAndSort'
    );
    const failures = [
      ...this.checkFilter(products, filter),
      ...this.checkSort(products.filter((product) => !product.outOfStock), sort, 'in stock'),
      ...this.checkSort(products.filter((product) => product.outOfStock), sort, 'out of stock'),
    ];
    markFailed(failures, 'verifyFilterAndSort');
  }

  async clickFilter(): Promise<void> {
    await switchToNative();
    await markFailedAndStop(
      () => clickElement(this.pflocator.filterIcon, { timeout: 10000 }),
      '[clickFilter] filter icon not found'
    );
    console.log('[clickFilter] filter sheet opened');
  }

  async clickFilterApply(): Promise<void> {
    const apply = this.pflocator.filterApplyButton;
    await markFailedAndStop(() => clickElement(apply, { timeout: 5000 }), '[clickFilterApply] Apply button not found');
    await driver.pause(1000);
    if (await isDisplayedOrFalse(apply)) {
      await clickElement(apply, { timeout: 5000 });
      await driver.pause(1000);
    }
    console.log('[clickFilterApply] applied');
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

  /** Product total written on the filter Apply button. */
  async getFilterProductCount(): Promise<number> {
    const label = await getElementLabel(this.pflocator.filterApplyButton);
    const count = this.parseApplyCount(label);
    console.log(`[getFilterProductCount] label="${label}" count=${count}`);
    return count;
  }

  /** Apply stays on the previous total until the filter selection is applied in the sheet. */
  private async waitForApplyCountUpdate(previous: number): Promise<number> {
    let latest = previous;
    const updated = await driver
      .waitUntil(
        async () => {
          latest = await this.getFilterProductCount();
          return latest !== previous;
        },
        { timeout: 10000, interval: 500 }
      )
      .then(() => true, () => false);
    console.log(`[getFilterProductCount] previous=${previous} updated=${latest} result=${updated ? 'changed' : 'unchanged'}`);
    return latest;
  }

  private parseApplyCount(label: string): number {
    const numbers = label.match(/\d[\d.,]*/g);
    return numbers ? Number(numbers[numbers.length - 1].replace(/[.,]/g, '')) : 0;
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

  async clickSort(): Promise<void> {
    await markFailedAndStop(
      () => clickElement(this.pflocator.sortIcon, { timeout: 10000 }),
      '[clickSort] sort button not found'
    );
    console.log('[clickSort] sort list opened');
  }

  async clickSortApply(): Promise<void> {
    const apply = this.pflocator.sortApplyButton;
    await markFailedAndStop(() => clickElement(apply, { timeout: 5000 }), '[clickSortApply] Apply button not found');
    await driver.pause(1000);
    if (await isDisplayedOrFalse(apply)) {
      await clickElement(apply, { timeout: 5000 });
      await driver.pause(1000);
    }
    console.log('[clickSortApply] applied');
  }

  private async selectFirstFilter(): Promise<Omit<PfFilterChoice, 'count'>> {
    const found = await this.kindOfFilterOption();
    markFailedAndStop([{ label: 'no price, product, or resolution filter', pass: Boolean(found) }], 'selectFirstFilter');
    const { kind, option } = found!;
    await option.waitForDisplayed({ timeout: 5000 });
    await option.click();
    const chipShown = await waitForDisplayedOrFalse(this.pflocator.selectedFilterChip, { timeout: 3000 });
    const value = chipShown ? (await getElementLabel(this.pflocator.selectedFilterChip)).trim() : '';
    console.log(`[selectFirstFilter] ${kind}="${value}"`);
    return { kind, value };
  }

  /** First on-screen checkbox under a price, product, or resolution section. In stock is not one of these. */
  private async kindOfFilterOption(): Promise<{ kind: PfFilterKind; option: WebdriverIO.Element } | undefined> {
    const sections: { kind: PfFilterKind; options: ChainablePromiseArray }[] = [
      { kind: 'price', options: this.pflocator.priceOptions },
      { kind: 'product', options: this.pflocator.productOptions },
      { kind: 'resolution', options: this.pflocator.resolutionOptions },
    ];
    for (let scroll = 0; scroll < 5; scroll += 1) {
      const shown: { kind: PfFilterKind; option: WebdriverIO.Element; top: number }[] = [];
      for (const section of sections) {
        for (const option of [...(await section.options)]) {
          if (!(await isDisplayedOrFalse(option))) {
            continue;
          }
          const { y } = await option.getLocation();
          shown.push({ kind: section.kind, option, top: y });
        }
      }
      shown.sort((a, b) => a.top - b.top);
      const first = shown[0];
      if (first) {
        console.log(`[kindOfFilterOption] ${first.kind}`);
        return first;
      }
      console.log(`[kindOfFilterOption] scroll ${scroll + 1}: no price, product, or resolution option`);
      if (!(await scrollDown())) {
        break;
      }
    }
    return undefined;
  }

  private async selectPriceSort(): Promise<PfSortChoice> {
    const option = this.pflocator.priceHighToLowOption;
    const shown = await this.scrollUntilShown(option, 5);
    markFailedAndStop([{ label: 'price sort option not found', pass: shown }], 'selectPriceSort');
    const value = (await getElementLabel(option)).trim();
    await clickElement(option, { timeout: 5000 });
    console.log(`[selectPriceSort] price="${value}"`);
    return { kind: 'price', value };
  }

  private async scrollUntilShown(element: ChainablePromiseElement, scrolls: number): Promise<boolean> {
    for (let attempt = 0; attempt <= scrolls; attempt += 1) {
      if (await isDisplayedOrFalse(element)) {
        return true;
      }
      await scrollDown();
    }
    return false;
  }

  private async collectPfProducts(): Promise<PfProduct[]> {
    await switchToNative();
    const products = new Map<string, PfProduct & { ratingText: string }>();
    let missed = 0;
    for (let scroll = 0; scroll < 30; scroll += 1) {
      const cards = [...(await this.pflocator.productGrid)];
      console.log(`[collectPfProducts] scroll ${scroll + 1}: visible cards=${cards.length}, stored=${products.size}`);
      let added = false;
      for (const [index, card] of cards.entries()) {
        const cardDesc = ((await card.getAttribute('content-desc').catch(() => '')) ?? '').trim();
        const name = await this.cardProductName(card);
        const priceText = this.isPriceLabel(cardDesc) ? cardDesc : await this.firstContentDesc([...(await this.pflocator.cardPrices(card))]);
        if (!name || !priceText) {
          console.log(
            `[collectPfProducts] scroll ${scroll + 1} card ${index + 1}: not stored (name="${name}" price="${priceText}" card="${cardDesc}")`
          );
          continue;
        }
        const ratingText = await this.firstContentDesc([...(await this.pflocator.cardRatings(card))]);
        const ratingMatch = ratingText.match(/(\d+(?:[.,]\d+)?)\s*\/\s*5/) ?? ratingText.match(/(\d+(?:\.\d+)?)/);
        const outOfStock = this.isOutOfStock(`${cardDesc}\n${name}`);
        const product = {
          name,
          price: this.parseCardPrice(priceText),
          rating: Number((ratingMatch?.[1] ?? '0').replace(',', '.')),
          ratingText,
          outOfStock,
        };
        const key = `${name}|${product.price}|${product.rating}`;
        const sameCard = [...products.entries()].find(([, stored]) => this.isSamePfCard(stored, product));
        if (sameCard) {
          const [previousKey, previous] = sameCard;
          if (name.length > previous.name.length) {
            products.delete(previousKey);
            products.set(key, product);
            console.log(`[collectPfProducts] scroll ${scroll + 1} card ${index + 1}: name "${previous.name}" -> "${name}"`);
          } else {
            console.log(`[collectPfProducts] scroll ${scroll + 1} card ${index + 1}: same card "${previous.name}", skipped "${name}"`);
          }
          continue;
        }
        if (products.has(key)) {
          console.log(`[collectPfProducts] scroll ${scroll + 1} card ${index + 1}: duplicate "${name}"`);
          continue;
        }
        products.set(key, product);
        added = true;
        console.log(
          `[collectPfProducts] stored ${products.size}: name="${name}" priceText="${priceText}" price=${product.price} ratingText="${ratingText}" rating=${product.rating} stock=${outOfStock ? 'out' : 'in'}`
        );
      }
      if (!added) {
        missed += 1;
        console.log(`[collectPfProducts] no new card, empty scroll ${missed}/5`);
        if (missed >= 5) {
          break;
        }
      } else {
        missed = 0;
      }
      if (!(await scrollDown())) {
        console.log('[collectPfProducts] list cannot scroll further');
        break;
      }
    }
    const list = [...products.values()];
    console.log(`[collectPfProducts] done stored=${list.length}`);
    list.forEach((product, index) => {
      console.log(`[collectPfProducts] [${index}] name="${product.name}" price=${product.price} rating=${product.rating} stock=${product.outOfStock ? 'out' : 'in'}`);
    });
    return list;
  }

  /**
   * A color chip such as "Lavender" shares the price and rating text with its card, and neither name contains the other.
   * "Galaxy Z Fold8 Ultra" and "Galaxy Z Fold8 Ultra (chỉ có tại Samsung.com)" share a price and a 9999+ rating, but one name contains the other, so both stay.
   */
  private isSamePfCard(stored: { name: string; price: number; ratingText: string }, next: { name: string; price: number; ratingText: string }): boolean {
    if (!next.ratingText || stored.ratingText !== next.ratingText || stored.price !== next.price) {
      return false;
    }
    const longer = next.name.length >= stored.name.length ? next.name : stored.name;
    const shorter = next.name.length >= stored.name.length ? stored.name : next.name;
    return !longer.toLowerCase().includes(shorter.toLowerCase());
  }

  /** Longest clickable label on the card. A scrolled card can leave only a color chip such as "Lavender". */
  private async cardProductName(card: WebdriverIO.Element): Promise<string> {
    const labels: string[] = [];
    for (const node of [...(await this.pflocator.pfCardTitles(card))]) {
      const text = ((await node.getAttribute('content-desc').catch(() => '')) ?? '').trim();
      if (text && !this.isPriceLabel(text)) {
        labels.push(text);
      }
    }
    return labels.sort((a, b) => b.length - a.length)[0] ?? '';
  }

  /** First match only. `$$` returns at once, so a missing child does not sit on `waitforTimeout`. */
  private async firstContentDesc(nodes: WebdriverIO.Element[]): Promise<string> {
    const found = nodes[0];
    if (!found) {
      return '';
    }
    return ((await found.getAttribute('content-desc').catch(() => '')) ?? '').trim();
  }

  /** Card content-desc on this PF is the price, e.g. "52.990.000 VND". "." groups thousands. */
  private isPriceLabel(label: string): boolean {
    return /\d/.test(label) && /vnd|usd|eur|krw|\$|€|£|₩|¥|₫/i.test(label);
  }

  private parseCardPrice(priceText: string): number {
    const compact = priceText.replace(/[^\d.,]/g, '');
    if (/^\d{1,3}(\.\d{3})+$/.test(compact)) {
      return Number(compact.replace(/\./g, ''));
    }
    return parsePriceToNumber(priceText);
  }

  private checkFilter(products: PfProduct[], filter: Omit<PfFilterChoice, 'count'>): { label: string; pass: boolean }[] {
    if (filter.kind === 'price') {
      const [min, max] = this.priceBounds(filter.value);
      const failures = products
        .filter((product) => product.price < min || product.price > max)
        .map((product) => ({ label: `price out of range: ${product.name} (${product.price})`, pass: false }));
      console.log(`[checkFilter] price="${filter.value}" range=${min}..${max === Number.POSITIVE_INFINITY ? '∞' : max} cards=${products.length}`);
      products.forEach((product, index) => {
        const pass = product.price >= min && product.price <= max;
        console.log(`[checkFilter] [${index}] name="${product.name}" price=${product.price} result=${pass ? 'PASS' : 'FAIL'}`);
      });
      return failures;
    }
    const keyword = filter.value.toLowerCase();
    const accepted = FILTER_EXCEPTION_KEYWORDS[keyword] ?? [keyword];
    const failures = products
      .filter((product) => !accepted.some((word) => product.name.toLowerCase().includes(word)))
      .map((product) => ({ label: `filter mismatch: ${product.name} does not match "${filter.value}"`, pass: false }));
    console.log(`[checkFilter] ${filter.kind}="${filter.value}" accepted=${accepted.join(' | ')} cards=${products.length}`);
    products.forEach((product, index) => {
      const matched = accepted.find((word) => product.name.toLowerCase().includes(word));
      console.log(`[checkFilter] [${index}] name="${product.name}" matched="${matched ?? ''}" result=${matched ? 'PASS' : 'FAIL'}`);
    });
    return failures;
  }

  private checkSort(products: PfProduct[], sort: PfSortChoice, label: string): { label: string; pass: boolean }[] {
    if (products.length === 0) {
      return [];
    }
    const actual = products.map((product) => (sort.kind === 'rating' ? product.rating : product.price));
    const expected = [...actual].sort((a, b) => b - a);
    const pass = actual.every((value, index) => value === expected[index]);
    console.log(`[verifyFilterAndSort] ${label} ${sort.kind}=${actual.join(', ')} result=${pass ? 'PASS' : 'FAIL'}`);
    return pass ? [] : [{ label: `${label} products are not sorted by ${sort.kind}`, pass: false }];
  }

  private priceBounds(label: string): [number, number] {
    const numbers = [...label.matchAll(/(\d[\d\s.,]*)/g)].map((match) => Number(match[1].replace(/[\s.,]/g, '')));
    if (numbers.length >= 2) {
      return [numbers[0], numbers[1]];
    }
    if (numbers.length === 1) {
      const below = PRICE_BELOW_WORDS.some((word) => label.toLowerCase().includes(word));
      return below ? [0, numbers[0]] : [numbers[0], Number.POSITIVE_INFINITY];
    }
    return [0, Number.POSITIVE_INFINITY];
  }

  /** "Out of stock" is the first line of the card content-desc, not the product title. */
  private isOutOfStock(label: string): boolean {
    const lower = label.toLowerCase();
    return OUT_OF_STOCK_WORDS.some((word) => lower.includes(word));
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
