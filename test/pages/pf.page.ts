import { BasePage } from './base.page';
import { PfLocator } from '../locators/pf.locator';
import { switchToNative, getCurrentWebViewPage } from '../helpers/context.helper';
import { scrollByBoundary, scrollDown } from '../helpers/gesture.helper';
import { currentSiteCode } from '../helpers/tc-filter.helper';
import { normalizeText, isExactTokenMatch, stripMarkerText, normalizeProductName } from '../helpers/data.helper';
import { clickElement, scrollUntilVisible, waitForDisplayedOrFalse } from '../helpers/element.helper';
import { markFailed } from '../helpers/report.helper';
import { ShopPage, type CategoryMismatch } from './shop.page';
import { BcPage } from './bc.page';
import { PdPage } from './pd.page';
import { isDisplayedOrFalse } from '../helpers/element.helper';

export type PfTabTarget = { tab: string } | { product: string };
export type WishState = 'add' | 'remove';

/**
 * Matching intent for a PF card, not a product type — the caller (spec) picks the mode,
 * PfPage only knows how to scroll+tap, and matchPfCard only knows how to compare text.
 * Katalon pfcardScrollandClick/matchesPfCard.
 */
export type PfCardQuery =
  | { mode: 'first' }
  | { mode: 'contains'; text: string }
  | { mode: 'exact'; product: string; exclusiveOnly?: boolean }
  | { mode: 'watch'; device: string; connectivity?: string; caseSize?: string };

/** Katalon LOCALIZE_ONLINE_EXCLUSIVE_TEXT — site → the "Online Exclusive" phrase shown on PF cards. */
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

  shopPage = new ShopPage();
  bcPage = new BcPage();
  pdPage = new PdPage();

  /** Scrolls the PF list and taps the first card matching query. Katalon pfcardScrollandClick. */
  async selectPfCard(query: PfCardQuery, maxScrolls = 30): Promise<void> {
    await switchToNative();

    for (let attempt = 0; attempt < maxScrolls; attempt += 1) {
      const cards = await this.pflocator.productGrid;
      for (const card of cards) {
        const desc = (await card.getAttribute('content-desc').catch(() => '')) ?? '';
        if (this.matchPfCard(desc, query)) {
          const image = this.pflocator.pfCardImage(card);
          if(await isDisplayedOrFalse(image)) {
            await image.click();
          } else {
            const xPos = Math.round((await card.getSize()).width/6);
            await card.click({ x: xPos});
          }
          return;
        }
      }
      await scrollDown();
    }

    throw new Error(`PF card not matched: ${JSON.stringify(query)}`);
  }


  /** Pure text match — no Appium. desc is a PF card's raw content-desc. */
  private matchPfCard(rawDesc: string, query: PfCardQuery): boolean {
    const desc = normalizeText(rawDesc);
    if (!desc) return false;

    switch (query.mode) {
      case 'first':
        return true;

      case 'contains':
        return desc.includes(normalizeText(query.text));

      case 'watch': {
        const descNoSpace = desc.replace(/\s+/g, '');
        const device = normalizeText(query.device).replace(/\s+/g, '');
        const connectivity = query.connectivity ? normalizeText(query.connectivity).replace(/\s+/g, '') : '';
        const caseSize = query.caseSize ? normalizeText(query.caseSize).replace(/\s+/g, '') : '';

        let ok = Boolean(device) && descNoSpace.includes(device);
        if (connectivity) ok = ok && descNoSpace.includes(connectivity);
        if (caseSize) ok = ok && descNoSpace.includes(caseSize);
        return ok;
      }

      case 'exact': {
        const product = normalizeText(query.product);
        if (!query.exclusiveOnly) {
          return isExactTokenMatch(desc, product);
        }
        const exclusiveText = normalizeText(this.getOnlineExclusiveText(currentSiteCode()));
        if (!exclusiveText || !desc.includes(exclusiveText)) return false;
        return isExactTokenMatch(stripMarkerText(desc, exclusiveText), product);
      }
    }
  }

  /** Falls back to the English phrase for sites not in the table (Katalon does the same). */
  private getOnlineExclusiveText(siteCode: string): string {
    return ONLINE_EXCLUSIVE_TEXT_BY_SITE[siteCode.toUpperCase()] ?? 'Samsung.com only';
  }

  async getPfProductName(query: PfCardQuery): Promise<string | null> {
    await switchToNative();

    const cards = await this.pflocator.productGrid;
    for (const card of cards) {
      const desc = (await card.getAttribute('content-desc').catch(() => '')) ?? '';
      if (this.matchPfCard(desc, query)) {
        return desc;
      }
    }
    return null;
  }

  /** Katalon Shop.verifyProductNameBetweenPFandPD (PF part) — taps the first PF card and returns its normalized product name. */
  async selectFirstPfCard(): Promise<string | null> {
    if (!(await this.isPfCardDisplayed())) {
      return null;
    }
    const pfProductName = normalizeProductName(await this.getPfProductName({ mode: 'first' }));
    await this.selectPfCard({ mode: 'first' });
    return pfProductName;
  }

  async getBcPdProductName(productName?: string | null): Promise<string | null> {
    const { page } = await getCurrentWebViewPage({ waitMs: 5000 });

    if (page === 'pd') {
      return normalizeProductName(await this.pdPage.getPdProductName(productName));
    }
    if (page === 'bc') {
      return normalizeProductName(await this.bcPage.getBcProductName());
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
    const pass = this.productNameIncludes(pfName, bcPdName);
    console.log(
      `[verifyProductNameMatch] ${L0Title}${L1Title ? ` > ${L1Title}` : ''} expected="${pfName}" actual="${bcPdName}" result=${pass ? 'PASS' : 'FAIL'}`
    );
    if (pass) {
      return;
    }

    mismatches.push(
      `PF/PD product name mismatch: ${L0Title} > ${L1Title} (PF: "${pfName}", BC/PD: "${bcPdName}")`
    );
  }

  private productNameIncludes(pfName: string | null, bcPdName: string | null): boolean {
    const pf = pfName?.trim().toLowerCase() ?? '';
    const bcPd = bcPdName?.trim().toLowerCase() ?? '';
    return Boolean(pf) && Boolean(bcPd) && (pf.includes(bcPd) || bcPd.includes(pf));
  }

  async isPfCardDisplayed(): Promise<boolean> {
    return waitForDisplayedOrFalse(this.pflocator.productGrid[0], { timeout: 5000 });
  }

  async selectPfCardExcluding(_keywords: string[]): Promise<void> {
    // TODO: Implement PF card selection excluding keywords
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

  async getPfCardMatchCount(_keywords: string[]): Promise<number> {
    // TODO: Implement PF card match count
    return 0;
  }

  async getResultCount(): Promise<number> {
    // TODO: Implement PF result count readback
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

  async verifySearchResultCount(_keywords: string[]): Promise<void> {
    // TODO: Implement search result count verification
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

  /** Katalon Shop.clickWishListBtn — taps the first "add to wishlist" heart on PF and returns that card's SKU. */
  async clickAddToWishlist(): Promise<string> {
    await switchToNative();
    const icon = this.pflocator.wishlistIcon();
    // PF cards render a few seconds after landing; scrolling earlier skips the first cards
    await waitForDisplayedOrFalse(icon, { timeout: 10000 });
    markFailed([{ label: 'add-to-wishlist heart not found on PF', pass: await scrollUntilVisible(icon) }], 'clickAddToWishlist');

    // The SKU sits anywhere in the label ("Add to wishlist SM-A185FZKDEUB", CN "添加 SM-F9710ZGDCHC 至我的收藏")
    const label = (await icon.getAttribute('content-desc')) ?? '';
    const sku = label.split(/\s+/).find((token) => /^[A-Z0-9]+-[A-Z0-9]+$/.test(token)) ?? '';
    markFailed([{ label: 'SKU not found in the wishlist heart label', pass: Boolean(sku), detail: label }], 'clickAddToWishlist');

    // Nudge so the floating Chat button cannot sit on top of the heart
    await scrollByBoundary('down', 0.1);
    await clickElement(this.pflocator.wishlistIcon(sku), { timeout: 5000 });
    console.log(`[clickAddToWishlist] sku=${sku}`);
    return sku;
  }

  /** Katalon Shop.verifyLoginPopup — a guest tapping the wishlist heart gets the login popup. */
  async verifyLoginPopup(): Promise<void> {
    await switchToNative();
    const shown = await waitForDisplayedOrFalse(this.pflocator.loginConfirmModal, { timeout: 5000 });
    console.log(`[verifyLoginPopup] expected=login popup actual=${shown ? 'login popup' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'Login popup failed to appear on guest wishlist action', pass: shown }], 'verifyLoginPopup');
  }

  /** Continue on the wishlist login popup — starts the login (auto login with a device account, else the login / SSO screens). */
  async clickContinueOnLoginPopup(): Promise<void> {
    await switchToNative();
    await clickElement(this.pflocator.loginPopupContinueButton, { timeout: 5000 });
  }
}
