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

  /** Katalon Common.navigateToPage("OFFERS") — waits for the app's first screen, selects Offers on BNB, then verifies the Offers header title. */
  async prepareOfferPage(): Promise<void> {
    await switchToNative();
    await this.waitForAppLoaded(60000);
    await markFailedAndStop(() => this.selectBnbMenu('offers'), '[prepareOfferPage] Offers tab not available on BNB');

    const ready = await driver
      .waitUntil(() => this.isOnOffer(), { timeout: 5000, interval: 500 })
      .then(() => true, () => false);
    markFailed([{ label: 'Offers not shown (header title does not match)', pass: ready }], 'prepareOfferPage');
  }

  /** Katalon Offer.isRTBPresent — the RTB banner must be shown at the top of Offers. */
  async verifyRtbShown(): Promise<void> {
    const shown = await waitForDisplayedOrFalse(this.locator.rtbItem, { timeout: 5000 });
    markFailed([{ label: 'RTB section not found on Offers', pass: shown }], 'verifyRtbShown');
  }

  /** Katalon Offer.redirectAndValidateRTBs — opens every RTB and checks that it does not land on an error page. */
  async verifyRtbRedirects(): Promise<void> {
    const count = await this.locator.rtbIndicators.length;
    console.log(`[verifyRtbRedirects] RTBs to verify: ${count}`);

    for (let index = 0; index < count; index++) {
      const title = await this.selectRtb(index);

      await clickElement(this.locator.rtbItem);
      // The tap must leave Offers — the RTB banner is gone once another page opens
      const leftOffers = await this.locator.rtbItem
        .waitForDisplayed({ timeout: 5000, reverse: true })
        .then(() => true)
        .catch(() => false);
      markFailed([{ label: `RTB did not open a page (still on Offers): ${title}`, pass: leftOffers }], 'verifyRtbRedirects');

      // Katalon checkErrorPage: an error page within 3s means the redirect failed
      const errorShown = await waitForDisplayedOrFalse(this.locator.errorPage, { timeout: 3000 });
      markFailed([{ label: `RTB redirected to an error page: ${title}`, pass: !errorShown }], 'verifyRtbRedirects');
      console.log(`[verifyRtbRedirects] redirected: ${title}`);

      await this.returnToOffers();
    }
  }

  /** Shows the RTB at index via its indicator (no swiping) and returns the banner title once it has stopped sliding. */
  private async selectRtb(index: number): Promise<string> {
    await clickElement(this.locator.rtbIndicators[index]);

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

  /** Katalon Offer.recoverToOfferPage — Back, close an external app if the RTB opened one, then the Offers tab as a last resort. */
  private async returnToOffers(): Promise<void> {
    await switchToNative();
    await driver.back();

    const currentPackage = await driver.getCurrentPackage();
    if (currentPackage !== targetPackage()) {
      console.log(`[returnToOffers] in external package ${currentPackage} — closing it`);
      await forceStopPackage(currentPackage);
      await driver.activateApp(targetPackage());
    }

    if (!(await waitForDisplayedOrFalse(this.locator.rtbItem, { timeout: 3000 }))) {
      console.log('[returnToOffers] Offers not shown after Back — opening the Offers tab');
      await this.selectBnbMenu('offers');
    }
  }

  /** Opens the RTB currently shown at the top of Offers. */
  async openRtbSection(): Promise<void> {
    await clickElement(this.locator.rtbItem);
  }

  /**
   * Katalon Offer.verifyOfferContentsWithoutCategory — false when Offers has no category tabs (nothing to verify; not a failure).
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

  /** Katalon Offer.verifyFeaturedCategory — the tab selected by default must be the "all products" tab (e.g. "All offers"). */
  async verifyAllOffersTabSelected(): Promise<void> {
    const selected = await waitForDisplayedOrFalse(this.locator.selectedCategoryTab, { timeout: 3000 });
    markFailed([{ label: 'no category tab is selected by default', pass: selected }], 'verifyAllOffersTabSelected');

    const name = await this.getCategoryTabName(this.locator.selectedCategoryTab);
    const isAllOffers = ALL_OFFERS_TAB_LABELS.some((label) => name.includes(label));
    console.log(`[verifyAllOffersTabSelected] default tab="${name}" allOffers=${isAllOffers}`);
    markFailed(
      [{ label: `the tab selected by default is not the "all products" tab: ${name}`, pass: isAllOffers }],
      'verifyAllOffersTabSelected'
    );
  }

  /** Katalon Offer.getOfferCategoryListCount — names of every category tab, collected while scrolling the tab row. */
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

  /** Katalon Offer.verifyCategoryFilterIconCount — the tab row is only shown with 3 or more categories. */
  verifyCategoryTabCount(names: string[]): void {
    markFailed(
      [{ label: 'category tabs are shown, but there are fewer than 3', pass: names.length >= 3, detail: `count=${names.length}` }],
      'verifyCategoryTabCount'
    );
  }

  /**
   * Katalon Offer.validateEachOfferCategory — every tab must become selected when tapped and show offers or T&C.
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
        // Katalon stops here: a category without offers or T&C should not have a tab at all
        failures.push({ label: `[${name}] has no ongoing offer contents or T&C, but its tab is still shown`, pass: false });
        break;
      }
      console.log(`[verifyEachCategoryTab] [${name}] verified`);
    }

    markFailed(failures, 'verifyEachCategoryTab');
  }

  /** Katalon Offer.tapOfferCategoryListItem — scrolls the tab row back until the tab is in it, then taps it. */
  private async selectCategoryTab(name: string): Promise<void> {
    for (let attempt = 0; attempt < 4 && !(await isDisplayedOrFalse(this.locator.categoryTab(name))); attempt++) {
      await scrollByElement(this.locator.categoryTabBar, 'left', 0.8);
    }
    // Optional like Katalon — a tab that could not be tapped is reported as "was not selected"
    await clickElement(this.locator.categoryTab(name), { timeout: 3000 }).catch(() => undefined);
  }

  /** Tab name = first line of its content-desc ("Smartphones\nTab 2 of 8" → "Smartphones"). */
  private async getCategoryTabName(tab: ChainablePromiseElement): Promise<string> {
    const description = (await tab.getAttribute('content-desc').catch(() => '')) ?? '';
    return description.split('\n')[0].trim();
  }
}
