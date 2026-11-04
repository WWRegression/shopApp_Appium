import { BasePage } from './base.page';
import { OfferLocator, ALL_OFFERS_TAB_LABELS } from '../locators/offer.locator';
import { switchToNative, targetPackage } from '../helpers/context.helper';
import { forceStopPackage } from '../helpers/device.helper';
import { clickElement, isDisplayedOrFalse, quickSwipeUntilVisible, waitForDisplayedOrFalse, withoutIdleWait } from '../helpers/element.helper';
import { quickSwipeDown, scrollByElement, tapAtCoordinates } from '../helpers/gesture.helper';
import { HomePage } from './home.page';
import { markFailed, markFailedAndStop, markStepSkipped, FieldCheck } from '../helpers/report.helper';

export class OfferPage extends BasePage {
  private readonly locator = new OfferLocator();
  // The T&C folded / link checks are the same as on Home
  private readonly homePage = new HomePage();

  /** True when the header title matches the Offers title texts (BasePage.titleTexts.OFFERS). */
  async isOnOffer(): Promise<boolean> {
    return this.matchesHeaderTitle('OFFERS');
  }

  /** Waits for the app's first screen, selects Offers on BNB, then verifies the Offers header title. */
  async prepareOfferPage(): Promise<void> {
    await switchToNative();
    await this.waitForAppLoaded(60000);
    await markFailedAndStop(() => this.selectBnbMenu('offers'), '[prepareOfferPage] Offers tab not available on BNB');

    const ready = await driver
      .waitUntil(() => this.isOnOffer(), { timeout: 5000, interval: 500 })
      .then(() => true, () => false);
    markFailedAndStop([{ label: 'Offers not shown (header title does not match)', pass: ready }], 'prepareOfferPage');
  }

  /** The RTB banner must be shown at the top of Offers. */
  async verifyRtbShown(): Promise<void> {
    const shown = await waitForDisplayedOrFalse(this.locator.rtbItem, { timeout: 5000 });
    markFailedAndStop([{ label: 'RTB section not found on Offers', pass: shown }], 'verifyRtbShown');
  }

  /** Opens every RTB; each must open its linked page. */
  async verifyRtbRedirects(): Promise<void> {
    // A single RTB has no indicators
    const count = Math.max(await this.locator.rtbIndicators.length, 1);
    console.log(`[verifyRtbRedirects] RTBs to verify: ${count}`);

    for (let index = 0; index < count; index++) {
      const title = await this.selectRtb(index);
      await this.saveWebViewBaseline();
      await clickElement(this.locator.rtbItem);
      await this.verifyLinkedPageOpened(title);
      await this.returnToOffers(title);
    }
  }

  /** After an RTB or link tap: a new page (WebView URL, another app, or another app screen) must open, Offers must be left, and no error page shown. */
  private async verifyLinkedPageOpened(title: string): Promise<void> {
    let opened = '';
    const start = Date.now();
    await driver
      .waitUntil(
        async () => {
          opened = (await this.getOpenedPageNames()).filter(Boolean).join(' | ');
          // A WebView page shows Back before its URL loads, so app screens are judged after 3s
          if (opened || Date.now() - start < 3000) {
            return opened !== '';
          }
          if (await isDisplayedOrFalse(this.headerLocator.backButton)) {
            opened = 'native page with Back';
          } else if (!(await this.isRtbShown(title)) && !(await this.isOnOffer())) {
            // e.g. an RTB that opens the Shop or My Page tab
            opened = `app screen "${await this.getHeaderTitle()}"`;
          }
          return opened !== '';
        },
        { timeout: 10000, interval: 500 }
      )
      .catch(() => undefined);
    // An error page within 3s means the link is broken
    const errorShown = await waitForDisplayedOrFalse(this.locator.errorPage, { timeout: 3000 });
    const onOffers = await this.isOnOffer();
    const pass = opened !== '' && !onOffers && !errorShown;
    const actual = errorShown ? 'error page' : onOffers ? 'still on Offers' : opened ? `page "${opened}"` : 'no new page opened';
    console.log(`[verifyLinkedPageOpened] link="${title}" expected=linked page opened (not Offers, not error page) actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
    // Recorded only, so the remaining RTBs are still checked
    markFailed([{ label: `link not opened: ${title}`, pass, detail: actual }], 'verifyLinkedPageOpened');
  }

  /** True while the RTB with this title is still on screen. */
  private async isRtbShown(title: string): Promise<boolean> {
    if (!(await isDisplayedOrFalse(this.locator.rtbItem))) {
      return false;
    }
    return ((await this.locator.rtbItem.getAttribute('content-desc').catch(() => '')) ?? '').trim() === title;
  }

  /** Shows the RTB at index via its indicator (no swiping) and returns the banner title once it has stopped sliding. */
  private async selectRtb(index: number): Promise<string> {
    if ((await this.locator.rtbIndicators.length) > 0) {
      await clickElement(this.locator.rtbIndicators[index]);
    }

    // Stopped sliding = the same title on two reads in a row
    let title = '';
    await driver
      .waitUntil(
        async () => {
          const current = ((await this.locator.rtbItem.getAttribute('content-desc').catch(() => '')) ?? '').trim();
          const settled = current !== '' && current === title;
          title = current;
          return settled;
        },
        { timeout: 3000, interval: 300 }
      )
      .catch(() => undefined);
    return title;
  }

  /** Back (skipped when the tapped RTB is still shown), close an external app if the RTB opened one, then the Offers tab as a last resort. */
  private async returnToOffers(rtbTitle: string): Promise<void> {
    await switchToNative();
    if (await this.isRtbShown(rtbTitle)) {
      return;
    }
    await driver.back();

    const currentPackage = await driver.getCurrentPackage();
    if (currentPackage !== targetPackage()) {
      console.log(`[returnToOffers] in external package ${currentPackage} — closing it`);
      await forceStopPackage(currentPackage);
      await driver.activateApp(targetPackage());
    }

    const backOnOffers = await driver
      .waitUntil(() => this.isOnOffer(), { timeout: 3000, interval: 500 })
      .then(() => true, () => false);
    if (!backOnOffers) {
      console.log('[returnToOffers] Offers not shown after Back — opening the Offers tab');
      await this.selectBnbMenu('offers');
    }
  }

  /** Clicks the first offer content (link/KV) below the category tabs. */
  async clickOfferContents(): Promise<void> {
    await switchToNative();
    await markFailedAndStop(
      () => clickElement(this.locator.offerContents, { timeout: 5000 }),
      '[clickOfferContents] offer contents not found on Offers'
    );
  }

  /** Opens the RTB currently shown at the top of Offers. */
  async openRtbSection(): Promise<void> {
    await clickElement(this.locator.rtbItem);
  }

  /**
   * False when Offers has no category tabs (no offers, or fewer than 3 categories; not a failure).
   */
  async hasCategoryTabs(): Promise<boolean> {
    if (await waitForDisplayedOrFalse(this.locator.categoryTabBar, { timeout: 2000 })) {
      return true;
    }
    const noOffers = await isDisplayedOrFalse(this.locator.noOngoingOffers);
    console.log(
      noOffers
        ? '[hasCategoryTabs] no ongoing offers and no category tabs'
        : '[hasCategoryTabs] no category tabs (fewer than 3 categories) — Main KV page expected'
    );
    return false;
  }

  /** Without the tab row: the No Offer page when no category has ongoing offers, otherwise the Main KV page (fewer than 3 categories, Featured included). */
  async verifyMainKvWithoutTabs(): Promise<void> {
    if (await isDisplayedOrFalse(this.locator.noOngoingOffers)) {
      console.log('[verifyMainKvWithoutTabs] expected page="No Offer" (no category has ongoing offers) actual="No Offer" result=PASS');
      return;
    }
    const shown = await waitForDisplayedOrFalse(this.locator.offerContents, { timeout: 3000 });
    console.log(`[verifyMainKvWithoutTabs] expected Main KV="shown" actual="${shown ? 'shown' : 'not shown'}" result=${shown ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'Main KV is not shown on Offers without category tabs', pass: shown }], 'verifyMainKvWithoutTabs');
  }

  /** The tab selected by default must be the "all products" tab (e.g. "All offers"). */
  async verifyAllOffersTabSelected(): Promise<void> {
    const selected = await waitForDisplayedOrFalse(this.locator.selectedCategoryTab, { timeout: 3000 });
    markFailedAndStop([{ label: 'no category tab is selected by default', pass: selected }], 'verifyAllOffersTabSelected');

    const name = await this.getCategoryTabName(this.locator.selectedCategoryTab);
    const isAllOffers = ALL_OFFERS_TAB_LABELS.some((label) => name.includes(label));
    console.log(`[verifyAllOffersTabSelected] default tab="${name}" allOffers=${isAllOffers}`);
    markFailedAndStop(
      [{ label: `the tab selected by default is not the "all products" tab: ${name}`, pass: isAllOffers }],
      'verifyAllOffersTabSelected'
    );
  }

  /** Names of every category tab, collected while scrolling the tab row. */
  async getCategoryTabNames(): Promise<string[]> {
    const names: string[] = [];
    for (let attempt = 0; attempt < 4; attempt++) {
      const before = names.length;
      const count = await this.locator.categoryTabs.length;
      for (let index = 0; index < count; index++) {
        const name = await this.getCategoryTabName(this.locator.categoryTabs[index]);
        if (name && !names.includes(name)) {
          names.push(name);
        }
      }
      // Nothing new after a scroll means the end of the row
      if (names.length === before) {
        break;
      }
      await scrollByElement(this.locator.categoryTabBar, 'right', 0.8);
    }
    console.log(`[getCategoryTabNames] ${names.length} tabs: ${JSON.stringify(names)}`);
    return names;
  }

  /** The tab row is only shown with 3 or more categories. */
  verifyCategoryTabCount(names: string[]): void {
    markFailedAndStop(
      [{ label: 'category tabs are shown, but there are fewer than 3', pass: names.length >= 3, detail: `count=${names.length}` }],
      'verifyCategoryTabCount'
    );
  }

  /**
   * Every tab must become selected when tapped and show offers or T&C.
   * A tab that is not selected is recorded and the rest still run; all reasons are reported together at the end.
   */
  async verifyEachCategoryTab(names: string[]): Promise<void> {
    const failures: FieldCheck[] = [];

    // Last tab first: the row is at its end after collecting the names
    for (const name of [...names].reverse()) {
      await this.selectCategoryTab(name);

      const selected = await driver
        .waitUntil(async () => (await this.getCategoryTabName(this.locator.selectedCategoryTab)) === name, { timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (!selected) {
        console.log(`[verifyEachCategoryTab] [${name}] was not selected`);
        failures.push({ label: `[${name}] was not selected`, pass: false });
        continue;
      }

      const hasContent =
        (await waitForDisplayedOrFalse(this.locator.offerContents, { timeout: 3000 })) ||
        (await waitForDisplayedOrFalse(this.locator.tncSection, { timeout: 3000 }));
      if (!hasContent) {
        // Stops here: a category without offers or T&C should not have a tab at all
        failures.push({ label: `[${name}] has no ongoing offer contents or T&C, but its tab is still shown`, pass: false });
        break;
      }
      console.log(`[verifyEachCategoryTab] [${name}] verified`);
    }

    markFailed(failures, 'verifyEachCategoryTab');
  }

  /** T&C at the bottom of Offers: shown, folded by default and opens, its links open their pages, and it folds again. */
  async verifyTerms(): Promise<void> {
    if (!(await this.isTermsShown())) {
      return;
    }
    await this.verifyTermsFolded();
    await this.homePage.verifyTermsLinks();
    await this.verifyTermsLinkButtons();
    await this.verifyTermsCollapse();
  }

  /** T&C is folded by default, and tapping it shows its content (opened for the link checks). */
  private async verifyTermsFolded(): Promise<void> {
    // Existence, not display: the opened content can start behind BNB
    const folded = !(await this.locator.tncContent.isExisting());
    console.log(`[verifyTermsFolded] expected T&C="folded" actual="${folded ? 'folded' : 'open'}" result=${folded ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'T&C is not folded by default', pass: folded }], 'verifyTermsFolded');
    if (!folded) {
      return;
    }

    await clickElement(this.locator.tncSection);
    const opened = await this.locator.tncContent.waitForExist({ timeout: 3000 }).then(() => true, () => false);
    console.log(`[verifyTermsFolded] expected T&C content="shown" actual="${opened ? 'shown' : 'not shown'}" result=${opened ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'T&C content is not shown after tapping it', pass: opened }], 'verifyTermsFolded');
  }

  /** Link buttons in the opened T&C (TW "※ 請參考三星商城常見問題") have no URL text, so each must just open a page. */
  private async verifyTermsLinkButtons(): Promise<void> {
    const count = await this.locator.tncSection.$$('.//android.widget.Button').length;
    console.log(`[verifyTermsLinkButtons] link buttons in T&C: ${count}`);
    for (let index = 0; index < count; index++) {
      if (index > 0) {
        await this.reopenTerms();
        // The opened content starts below the header, behind BNB
        await withoutIdleWait(() => quickSwipeDown());
      }
      const button = this.locator.tncSection.$$('.//android.widget.Button')[index];
      const label = ((await button.getAttribute('content-desc').catch(() => '')) ?? '').trim();
      await this.saveWebViewBaseline();
      await clickElement(button);
      await this.verifyLinkedPageOpened(label);
      await this.returnToOffers(label);
    }
  }

  /** Swipes down to the T&C at the bottom of Offers; a site without one skips the T&C steps (reason kept in the report). */
  private async isTermsShown(): Promise<boolean> {
    const shown = await this.swipeToTerms();
    console.log(`[isTermsShown] T&C ${shown ? 'shown' : 'not shown'}`);
    if (!shown) {
      markStepSkipped('[isTermsShown] no T&C at the bottom of Offers for this site — T&C checks');
    }
    return shown;
  }

  /** Swipes down until the T&C at the bottom of Offers is shown. */
  private async swipeToTerms(): Promise<boolean> {
    await switchToNative();
    return quickSwipeUntilVisible(this.locator.tncSection);
  }

  /** Back from a link leaves Offers above the T&C, which may be folded again: swipe down to it and open it. */
  private async reopenTerms(): Promise<void> {
    await this.swipeToTerms();
    // Existence, not display: the opened content can sit behind BNB
    if (!(await this.locator.tncContent.isExisting())) {
      await clickElement(this.locator.tncSection);
    }
  }

  /** The opened T&C must fold again when its header is tapped. */
  private async verifyTermsCollapse(): Promise<void> {
    await this.reopenTerms();

    // Open, the header and content are one view: the header row is between its top and the first content node
    const location = await this.locator.tncSection.getLocation();
    const size = await this.locator.tncSection.getSize();
    const contentTop = (await this.locator.tncContent.getLocation()).y;
    await tapAtCoordinates(location.x + Math.round(size.width / 2), Math.round((location.y + contentTop) / 2));

    const collapsed = await this.locator.tncContent
      .waitForExist({ timeout: 3000, reverse: true })
      .then(() => true, () => false);
    console.log(`[verifyTermsCollapse] expected T&C="folded" actual="${collapsed ? 'folded' : 'open'}" result=${collapsed ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'T&C did not collapse', pass: collapsed }], 'verifyTermsCollapse');
  }

  /** Scrolls the tab row back until the tab is in it, then taps it. */
  private async selectCategoryTab(name: string): Promise<void> {
    for (let attempt = 0; attempt < 4 && !(await isDisplayedOrFalse(this.locator.categoryTab(name))); attempt++) {
      await scrollByElement(this.locator.categoryTabBar, 'left', 0.8);
    }
    // Optional: a tab that could not be tapped is reported as "was not selected"
    await clickElement(this.locator.categoryTab(name), { timeout: 3000 }).catch(() => undefined);
  }

  /** Tab name = first line of its content-desc ("Smartphones\nTab 2 of 8" → "Smartphones"). */
  private async getCategoryTabName(tab: ChainablePromiseElement): Promise<string> {
    const description = (await tab.getAttribute('content-desc').catch(() => '')) ?? '';
    return description.split('\n')[0].trim();
  }
}
