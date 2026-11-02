import { BasePage } from './base.page';
import { OfferLocator, ALL_OFFERS_TAB_LABELS } from '../locators/offer.locator';
import { switchToNative, targetPackage } from '../helpers/context.helper';
import { forceStopPackage } from '../helpers/device.helper';
import { clickElement, isDisplayedOrFalse, waitForDisplayedOrFalse } from '../helpers/element.helper';
import { scrollByElement } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop, FieldCheck } from '../helpers/report.helper';

export class OfferPage extends BasePage {
  private readonly locator = new OfferLocator();

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
      await this.verifyRtbPageOpened(title);
      await this.returnToOffers(title);
    }
  }

  /** After an RTB tap: a new page (WebView URL, another app, or another app screen) must open, Offers must be left, and no error page shown. */
  private async verifyRtbPageOpened(title: string): Promise<void> {
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
    console.log(`[verifyRtbPageOpened] RTB="${title}" expected=linked page opened (not Offers, not error page) actual=${actual} result=${pass ? 'PASS' : 'FAIL'}`);
    // Recorded only, so the remaining RTBs are still checked
    markFailed([{ label: `RTB link not opened: ${title}`, pass, detail: actual }], 'verifyRtbPageOpened');
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
   * False when Offers has no category tabs (nothing to verify; not a failure).
   */
  async hasCategoryTabs(): Promise<boolean> {
    if (await waitForDisplayedOrFalse(this.locator.categoryTabBar, { timeout: 2000 })) {
      return true;
    }
    const noOffers = await isDisplayedOrFalse(this.locator.noOngoingOffers);
    console.log(
      noOffers
        ? '[hasCategoryTabs] no ongoing offers and no category tabs — nothing to verify'
        : '[hasCategoryTabs] offers shown without category tabs (fewer than 3 categories) — nothing to verify'
    );
    return false;
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
        (await waitForDisplayedOrFalse(this.locator.tncArea, { timeout: 3000 }));
      if (!hasContent) {
        // Stops here: a category without offers or T&C should not have a tab at all
        failures.push({ label: `[${name}] has no ongoing offer contents or T&C, but its tab is still shown`, pass: false });
        break;
      }
      console.log(`[verifyEachCategoryTab] [${name}] verified`);
    }

    markFailed(failures, 'verifyEachCategoryTab');
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
