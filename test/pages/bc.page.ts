import { BasePage } from './base.page';
import { BcLocator } from '../locators/bc.locator';
import { BcTradeInService } from '../services/tradein/bc-tradein.service';
import { BcScPlusService } from '../services/scplus/bc-scplus.service';
import { BcEupService } from '../services/eup/bc-eup.service';
import { BcSimService } from '../services/sim/bc-sim.service';
import { BcGalaxyClubService } from '../services/galaxyclub/bc-galaxyclub.service';
import { prepareWebViewPage, isCurrentWebViewPage, getCurrentWebViewPage, switchToNative } from '../helpers/context.helper';
import { getRunConfig } from '../../config/run.config';
import { storageCapacityMatches, pickStorageLabel, normalizeProductName, productNameMatches, parsePriceValues, isSamePrice } from '../helpers/data.helper';
import { clickIfDisplayed, scrollAndJsClick, scrollAndWdioClick, scrollUntilVisibleInWebView, readDisplayedText } from '../helpers/element.helper';
import { markFailedAndStop } from '../helpers/report.helper';
import type { CartItemOptions } from './cart.page';


/** Fields BC accepts from site JSON / Flagship phone / watch. kind, ram, isPFDefaultSKU are catalog-only. */
export type ProductOptionFields = {
  sku: string;
  deviceName: string;
  color: string;
  storage?: string;
  caseSize?: string;
  connectivity?: string;
  isBespokeSKU?: boolean;
};

/** Option chips selected on BC and checked in the summary; isBespokeSKU only clicks a band and is not compared. */
const OPTION_FIELDS = ['deviceName', 'storage', 'caseSize', 'connectivity', 'color'] as const;
type OptionField = (typeof OPTION_FIELDS)[number];

export interface SelectedDisplayValues {
  device: string;
  storage?: string;
  caseSize?: string;
  connectivity?: string;
  color: string;
}

/** Summary area text as read; the option text is one string, not split by option. */
export type BcSummary = { sku: string; deviceName: string; optionsText: string; servicePrice: string };

/** What verifyOptions returns: the summary as read, and the selected value of each option (chip label, or product data). */
export type BcProductInfo = { summary: BcSummary; selected: CartItemOptions };

export class BcPage extends BasePage {
  private readonly locator = new BcLocator();
  readonly tradeIn = new BcTradeInService();
  readonly scPlus = new BcScPlusService();
  readonly eup = new BcEupService();
  readonly sim = new BcSimService();
  readonly galaxyClub = new BcGalaxyClubService();

  /**
   * Wait up to 20s for BC after PF/search navigation (WebView + buy URL + layout).
   * Longer than cart: PF to BC often needs extra time for the buy window to appear.
   */
  async prepareBcPage(): Promise<void> {
    // A fresh IN app asks for the location permission when the product page opens
    if (getRunConfig().siteCode === 'IN') {
      await clickIfDisplayed(this.popupLocator.locationAllowButton, 5000);
    }
    const ready = await prepareWebViewPage('bc', () => this.locator.bcLayout, 20000);
    if (!ready) {
      throw new Error('prepareBcPage: BC not ready within 20s');
    }
  }

  /** Clicks the option chip of each value in the product data; skips a chip not shown on BC. */
  async selectOptions(product: ProductOptionFields): Promise<void> {
    for (const field of [...OPTION_FIELDS, 'isBespokeSKU'] as const) {
      const value = product[field];
      if (!value) {
        continue;
      }
      let target: ChainablePromiseElement;
      switch (field) {
        case 'deviceName':
          target = this.locator.deviceOption(String(value));
          break;
        case 'storage':
          target = this.locator.storageOption(String(value));
          break;
        case 'caseSize':
          target = this.locator.caseSizeOption(String(value));
          break;
        case 'connectivity':
          target = this.locator.connectivityOption(String(value));
          break;
        case 'color':
          target = this.locator.colorOption(String(value));
          break;
        case 'isBespokeSKU':
          target = this.locator.watchNonDefaultBandOption;
          break;
      }
      // Some sites show no chip for an option (e.g. no device chip), so a missing chip is skipped
      if (!(await scrollUntilVisibleInWebView(target))) {
        console.log(`[BC.selectOptions] ${field}=${value} : chip not found, skip`);
        continue;
      }
      console.log(`[BC.selectOptions] ${field}=${value} : chip clicked`);
      // Option boxes are divs wrapping the radio input — HTMLElement.click() on the div doesn't select it, a real tap does
      await scrollAndWdioClick(target);
    }
  }

  /** Checks the selected chip (or product data) of each option is in the summary, and returns the summary with the selected values. */
  async verifyOptions(product: ProductOptionFields): Promise<BcProductInfo> {
    const summary = await this.readSummary();
    console.log(`[BC.verifyOptions] summary=${JSON.stringify(summary)}`);

    // Stops the TC at the first field not in the summary
    const check = (field: string, expected: string, actual: string, pass: boolean) => {
      console.log(`[BC.verifyOptions] ${field} : expected=${expected} || actual=${actual} || result=${pass ? 'PASS' : 'FAIL'}`);
      markFailedAndStop([{ label: `${field} not in the BC summary`, pass, detail: `expected "${expected}", actual "${actual}"` }], 'BC.verifyOptions');
    };

    check('sku', product.sku, summary.sku, this.matchesSummary('sku', summary.sku, product.sku));

    const selected: CartItemOptions = {};
    for (const field of OPTION_FIELDS) {
      const inputData = product[field];
      if (!inputData) {
        continue;
      }
      // The selected chip label, or the product data when the site shows no chip for this option
      const expected = (await this.readSelectedOption(field)) || inputData;
      const actual = field === 'deviceName' ? summary.deviceName : summary.optionsText;
      check(field, expected, actual, this.matchesSummary(field, actual, expected));
      selected[field] = expected;
    }

    return { summary, selected };
  }

  /** Verify only the SKU displayed in the Summary, and return the confirmed SKU string. */
  async verifySku(expectedSku: string): Promise<void> {
    const actual = await readDisplayedText(() => this.locator.summarySku);
    if (!this.matchesSummary('sku', actual, expectedSku)) {
      throw new Error(
        `BC summary SKU mismatch: expected=${expectedSku} || actual=${actual}`
      );
    }
    console.warn(`[BC.verifySku] Done: expected=${expectedSku} || actual=${actual}`);
  }

  /** Display text of the selected chip of an option; '' when no chip is selected. */
  private async readSelectedOption(field: OptionField): Promise<string> {
    // Watch BC (e.g. /uk/watches/.../buy/): case colour / size / connectivity are radios.
    // Prefer data-modeldisplay on the checked input — section .is-checked text often includes disclaimers.
    const watchInputClass: Partial<Record<string, string>> = {
      color: 'input-case-color',
      caseSize: 'input-case-size',
      connectivity: 'input-connectivity',
      deviceName: 'input-device',
    };
    const inputClass = watchInputClass[field];
    if (inputClass) {
      const checked = $(`input.${inputClass}:checked`);
      if (await checked.isExisting().catch(() => false)) {
        const fromAttr = ((await checked.getAttribute('data-modeldisplay').catch(() => '')) ?? '').trim();
        if (fromAttr) {
          return fromAttr;
        }
      }
    }

    const el = this.locator.optionSelectedResult(field);
    if (!(await el?.isDisplayed().catch(() => false))) {
      return '';
    }
    const text = ((await el?.getText().catch(() => '')) ?? '').trim();
    if (field === 'storage') {
      return pickStorageLabel(text);
    }
    // The device box also shows the price lines under the name (UK)
    return field === 'deviceName' ? text.split('\n')[0].trim() : text;
  }

  /** Summary area text as shown; the option text holds every option in one string (e.g. "256GB｜12GBPistachio"). */
  private async readSummary(): Promise<BcSummary> {
    return {
      sku: await readDisplayedText(() => this.locator.summarySku),
      deviceName: await readDisplayedText(() => this.locator.summaryDeviceName),
      optionsText: await readDisplayedText(() => this.locator.summaryOptions, true),
      servicePrice: await readDisplayedText(() => this.locator.summaryServicePrice, true),
    };
  }

  /** True when value appears in the summary text, ignoring spaces and case; storage also treats GB/Go and TB/To as equal. */
  private matchesSummary(field: OptionField | 'sku', summaryText: string, value: string): boolean {
    if (field === 'storage') {
      return storageCapacityMatches(summaryText, value);
    }
    const a = summaryText.replace(/\s+/g, '').toLowerCase();
    const b = value.replace(/\s+/g, '').toLowerCase();
    return Boolean(a) && Boolean(b) && (a.includes(b) || b.includes(a));
  }

  async isBcPage(): Promise<boolean> {
    return isCurrentWebViewPage('bc');
  }

  /** Verifies the BC page is shown (checked from native context so a closed window cannot hold the check). */
  async verifyBcPage(): Promise<void> {
    await switchToNative();
    const onBc = await driver
      .waitUntil(() => this.isBcPage(), { timeout: 8000, interval: 1000 })
      .then(() => true, () => false);
    const actual = onBc ? 'bc' : (await getCurrentWebViewPage()).page;
    console.log(`[verifyBcPage] expected=bc actual=${actual} result=${onBc ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'BC page not shown', pass: onBc, detail: `actual ${actual}` }], 'verifyBcPage');
  }


  async getSummaryPrice(_kind: string): Promise<string> {
    return this.getTotalPrice();
  }

  /** Sticky bar total / summary total text (digits compared by caller). */
  async getTotalPrice(): Promise<string> {
    const el = this.locator.summaryTotalPrice;
    await el.waitForExist({ timeout: 10000 }).catch(() => undefined);
    return ((await el.getText().catch(() => '')) ?? '').trim();
  }

  /** The BC total must show the PF price; the text can also hold the monthly price ("£47.20/mo. or £1,699.00"). */
  async verifyTotalPrice(pfPrice: number): Promise<void> {
    const text = await this.getTotalPrice();
    const pass = parsePriceValues(text).some((price) => isSamePrice(price, pfPrice));
    console.log(`[verifyTotalPrice] expected=${pfPrice} (PF) actual="${text}" (BC total) result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'BC total price does not match the PF price', pass, detail: `PF ${pfPrice}, BC "${text}"` }], 'verifyTotalPrice');
  }

  /** Click Add to Cart only. Cart arrival is confirmed later by cartPage.prepareCartPage(). */
  async clickAddToCart(): Promise<void> {
    const button = this.locator.addToCartButton;
    await button.waitForDisplayed({ timeout: 15000 });
    await scrollAndJsClick(button);
  }

  /** Verifies the sticky bar product name matches the expected (PF) product name. */
  async verifyProductName(expected: string | null): Promise<void> {
    await this.prepareBcPage();
    // getText only: the extra displayed check costs seconds per call while BC keeps loading
    const stickyBarName = ((await this.locator.bcProductName.getText().catch(() => '')) ?? '').trim();
    const actual = normalizeProductName(stickyBarName);
    const pass = productNameMatches(expected, actual);
    console.log(`[BC.verifyProductName] expected="${expected}" actual="${actual}" (raw="${stickyBarName}") result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'BC sticky bar product name mismatch', pass, detail: `expected "${expected}", actual "${stickyBarName}"` }], 'BC.verifyProductName');
  }
}

