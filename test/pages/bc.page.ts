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
import { scrollAndJsClick, isExistingInWebView } from '../helpers/element.helper';

/**
 * BC가 받는 ?�력. ?�이??JSON / Flagship phone / Flagship watch 모두 ???�드�??�용?�다.
 * kind, ram, isPFDefaultSKU ??카탈로그 ?�용 ??select/verify ?�???�님.
 */
export type ProductOptionFields = {
  sku: string;
  deviceName: string;
  color: string;
  storage?: string;
  caseSize?: string;
  connectivity?: string;
  isBespokeSKU?: boolean;
};

/** ?�릭 가?�한 ?�션. isBespokeSKU ??밴드 ?�릭�??�고 비교??값이 ?�다. */
export const Options = ['deviceName', 'storage', 'caseSize', 'connectivity', 'color', 'isBespokeSKU'] as const;
export type OptionChip = (typeof Options)[number];

/** sku ??input, ?�머지???�택 �??�벨. connectivity ??watch(caseSize)�? price ??추후. */
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
   * Longer than cart: PF?�BC often needs extra time for the buy window to appear.
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
      await console.warn(`[BC.selectOptions] target=` + chip.field);
      if (!(await this.revealInWebView(target))) {
        await console.warn(`[BC.selectOptions] Skip: ${chip.field} not in DOM after scroll`);
        continue;
      }
      await scrollAndJsClick(target);
      await console.warn(`[BC.selectOptions] Click: ${chip.field}`);
    }
    // await this.dismissOverlays();
    await console.warn('[BC.selectOptions] Done');
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
    await console.warn(`[BC.verifySku] Done: expected=${expectedSku} || actual=${actual}`);
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
    // Prefer data-modeldisplay on the checked input ??section .is-checked text often includes disclaimers.
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

  /** If the target is not in the DOM, scroll the WebView down.  */
  private async revealInWebView(target: ChainablePromiseElement, maxAttempts = 6): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // DOM querySelector path (CSS only); same Appium bridge cost as other execute calls.
      if (await isExistingInWebView(target)) {
        await console.warn('[BC.revealInWebView] found, return true');
        return true;
      }
      await console.warn(`[BC.revealInWebView] not found, scroll down attempt=${attempt + 1}`);
      await scrollWebViewDown();
    }
    await console.warn('[BC.revealInWebView] not found, finally call isExistingInWebView to return result');
    return await isExistingInWebView(target);
  }

  /**
   * `$$`/`$` not resolved: no scroll opportunity.
   * Text not read: scroll, re-query locator.
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
    // TODO: Implement summary price readback
    return '';
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
