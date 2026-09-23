import { BasePage } from './base.page';
import { BcLocator } from '../locators/bc.locator';
import { BcTradeInService } from '../services/tradein/bc-tradein.service';
import { BcScPlusService } from '../services/scplus/bc-scplus.service';
import { BcEupService } from '../services/eup/bc-eup.service';
import { BcSimService } from '../services/sim/bc-sim.service';
import { BcGalaxyClubService } from '../services/galaxyclub/bc-galaxyclub.service';
import { prepareWebViewPage, isCurrentWebViewPage } from '../helpers/context.helper';
import { scrollWebViewDown } from '../helpers/gesture.helper';
import { storageCapacityMatches, pickStorageLabel } from '../helpers/data.helper';
import { scrollAndJsClick, scrollUntilVisibleInWebView } from '../helpers/element.helper';


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

/** Clickable option chips. isBespokeSKU triggers band click only; its value is not compared. */
export const Options = ['deviceName', 'storage', 'caseSize', 'connectivity', 'color', 'isBespokeSKU'] as const;
export type OptionChip = (typeof Options)[number];

/** sku from input; others from selected option labels. connectivity is watch(caseSize); price TBD. */
export const verifyOptionFields = ['sku', 'deviceName', 'storage', 'caseSize', 'connectivity', 'color'] as const;
export type VerifyField = (typeof verifyOptionFields)[number];

export interface SelectedDisplayValues {
  device: string;
  storage?: string;
  caseSize?: string;
  connectivity?: string;
  color: string;
}

export type SummaryPart = 'deviceName' | 'sku' | 'options' | 'servicePrice';
export type SummaryDetails = Record<SummaryPart, string>;

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
    const ready = await prepareWebViewPage('bc', this.locator.bcLayout, 20000);
    if (!ready) {
      throw new Error('prepareBcPage: BC not ready within 20s');
    }
  }

  private buildOptionList(options: ProductOptionFields) {
    return Options.flatMap((field) => {
      const value = options[field];
      return value ? [{ field, value: String(value) }] : [];
    });
  }
  
  async selectOptions(options: ProductOptionFields): Promise<void> {
    const chips = this.buildOptionList(options);
    console.warn(
      `[BC.selectOptions] Start: ${chips
        .map((chip) => `${chip.field}=${chip.value}`)
        .join(' || ')}`
    );

    for (const chip of chips) {
      let target;
      switch (chip.field) {
        case 'deviceName':
          target = this.locator.deviceOption(chip.value);
          break;
        case 'storage':
          target = this.locator.storageOption(chip.value);
          break;
        case 'caseSize':
          target = this.locator.caseSizeOption(chip.value);
          break;
        case 'connectivity':
          target = this.locator.connectivityOption(chip.value);
          break;
        case 'color':
          target = this.locator.colorOption(chip.value);
          break;
        case 'isBespokeSKU':
          target = this.locator.watchNonDefaultBandOption;
          break;
      }
      console.warn(`[BC.selectOptions] target=` + chip.field);
      if (!(await scrollUntilVisibleInWebView(target))) {
        console.warn(`[BC.selectOptions] Skip: ${chip.field} not in DOM after scroll`);
        continue;
      }
      await scrollAndJsClick(target);
      console.warn(`[BC.selectOptions] Click: ${chip.field}`);
    }
    
    console.warn('[BC.selectOptions] Done');
  }

  async verifyOptions(options: ProductOptionFields): Promise<SummaryDetails> {
    console.warn('[BC.verifyOptions] Start');
    const summary = await this.readSummaryDetails();
    console.warn(`[BC.verifyOptions] summary=${JSON.stringify(summary)}`);

    for (const field of verifyOptionFields) {
      if (!options[field]) {
        continue;
      }
      const expected = await this.expectedSelectedValue(field, String(options[field]));
      const actual = this.summaryActual(field, summary);
      console.warn(`[BC.verifyOptions] ${field} : expected=${expected} || actual=${actual}`);
      if (!this.summaryMatches(field, actual, expected)) {
        throw new Error(`BC/PD summary mismatch : field=${field} || expected=${expected} || actual=${actual}`);
      }
    }
    console.warn('[BC.verifyOptions] Done');
    return summary;
  }

  /** Verify only the SKU displayed in the Summary, and return the confirmed SKU string. */
  async verifySku(expectedSku: string): Promise<void> {
    const actual = await this.readDisplayedText(this.locator.summarySku);
    if (!this.summaryMatches('sku', actual, expectedSku)) {
      throw new Error(
        `BC summary SKU mismatch: expected=${expectedSku} || actual=${actual}`
      );
    }
    console.warn(`[BC.verifySku] Done: expected=${expectedSku} || actual=${actual}`);
  }

  /** sku: input. The rest: label visible in the selected option, otherwise input. */
  private async expectedSelectedValue(field: string, inputData: string): Promise<string> {
    if (field === 'sku') {
      return inputData;
    }
    const shown = await this.readOptionSelectedResult(field);
    return shown || inputData || '';
  }

  private async readOptionSelectedResult(field: string): Promise<string> {
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
    return field === 'storage' ? pickStorageLabel(text) : text;
  }

  private async readSummaryDetails(): Promise<SummaryDetails> {
    return {
      deviceName: await this.readDisplayedText(this.locator.summaryDeviceName),
      sku: await this.readDisplayedText(this.locator.summarySku),
      options: await this.readDisplayedText(this.locator.summaryOptions, true),
      servicePrice: await this.readDisplayedText(this.locator.summaryServicePrice, true),
    };
  }

  /**
   * Do not resolve $$/$ first — missing nodes yield empty arrays and skip scroll chances.
   * If text cannot be read, scroll and re-query the locator.
   */
  private async readDisplayedText(
    nodes: ReturnType<typeof $$> | ReturnType<typeof $>,
    joinAll = false
  ): Promise<string> {
    for (let attempt = 0; attempt < 6; attempt++) {
      const resolved = await nodes;
      const list = Array.isArray(resolved) ? resolved : [resolved];
      const parts: string[] = [];

      for (const node of list) {
        if (!(await node.isExisting().catch(() => false))) {
          continue;
        }
        if (!(await node.isDisplayed().catch(() => false))) {
          continue;
        }
        const text = ((await node.getText().catch(() => '')) ?? '').trim();
        if (!text) {
          continue;
        }
        if (!joinAll) {
          return text;
        }
        parts.push(text);
      }

      if (parts.length > 0) {
        return parts.join(' ');
      }
      console.warn(`[BC.readDisplayedText] no text, scroll down attempt=${attempt + 1}`);
      await scrollWebViewDown();
    }
    return '';
  }

  private summaryActual(field: VerifyField, summary: SummaryDetails): string {
    if (field === 'sku') return summary.sku;
    if (field === 'deviceName') return summary.deviceName;
    // if (field === 'price') return summary.price;
    return summary.options;
  }

  private summaryMatches(field: VerifyField, actual: string, expected: string): boolean {
    return field === 'storage' ? storageCapacityMatches(actual, expected) : this.optionTextMatches(actual, expected);
  }

  private optionTextMatches(actual: string, expected: string): boolean {
    const a = actual.replace(/\s+/g, '').toLowerCase();
    const b = expected.replace(/\s+/g, '').toLowerCase();
    return Boolean(a) && Boolean(b) && (a.includes(b) || b.includes(a));
  }

  async isBcPage(): Promise<boolean> {
    return isCurrentWebViewPage('bc');
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

  /** Katalon BC.moveToAddonPage — Buy Now (or CN sticky) lands on splash (addon/gift). */
  async goToSplashPage(): Promise<void> {
    const buyNow = this.locator.buyNowButton;
    if (await buyNow.isExisting().catch(() => false)) {
      await scrollAndJsClick(buyNow);
    } else {
      await this.clickAddToCart();
    }
    await driver.pause(1500);
  }

  /** Katalon BC.selectAddOnOption — first add-on CTA; returns data-modelcode. */
  async selectAddonOption(): Promise<string> {
    const buttons = await this.locator.addonAddButtons;
    for (const btn of buttons) {
      if (!(await btn.isDisplayed().catch(() => false))) {
        continue;
      }
      if (!(await btn.isEnabled().catch(() => true))) {
        continue;
      }
      await scrollAndJsClick(btn);
      await driver.pause(1500);
      const sku =
        ((await btn.getAttribute('data-modelcode').catch(() => '')) ?? '').trim() ||
        ((await $('[data-modelcode]').getAttribute('data-modelcode').catch(() => '')) ?? '').trim();
      if (!sku) {
        throw new Error('Add-on selected but data-modelcode is empty');
      }
      return sku;
    }
    throw new Error('No clickable Add-on button found');
  }

  /** Click Add to Cart only. Cart arrival is confirmed later by cartPage.prepareCartPage(). */
  async clickAddToCart(): Promise<void> {
    const button = this.locator.addToCartButton;
    await button.waitForExist({ timeout: 15000 });
    await scrollAndJsClick(button);
  }

  async getBcProductName(): Promise<string> {
    await this.prepareBcPage();
    return this.locator.summaryDeviceName[0].getText();
  }

}

