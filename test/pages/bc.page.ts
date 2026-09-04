import { BasePage } from './base.page';
import { BcLocator } from '../locators/bc.locator';
import { BcTradeInService } from '../services/tradein/bc-tradein.service';
import { BcScPlusService } from '../services/scplus/bc-scplus.service';
import { BcEupService } from '../services/eup/bc-eup.service';
import { BcSimService } from '../services/sim/bc-sim.service';
import { BcGalaxyClubService } from '../services/galaxyclub/bc-galaxyclub.service';
import { switchToWebView, prepareWebViewPage, isCurrentWebViewPage, switchToWindowByPage } from '../helpers/context.helper';
import { scrollElementToCenter } from '../helpers/gesture.helper';
import { FlagshipProduct } from '../helpers/flagship-sku.helper';
import { storageCapacityMatches } from '../helpers/data.helper';

/** Regression `site.product` chip fields. */
export interface SiteProduct {
  sku: string;
  deviceName: string;
  storage: string;
  color: string;
}

export type BcProductOptions = SiteProduct | FlagshipProduct;

export type OptionChip = 'deviceName' | 'storage' | 'caseSize' | 'color' | 'connectivity';

export type SummaryPart = 'deviceName' | 'sku' | 'options' | 'servicePrice';
export type SummaryDetails = Record<SummaryPart, string>;

export interface SelectedDisplayValues {
  device: string;
  color: string;
  storage?: string;
  caseSize?: string;
  connectivity?: string;
}

type VerifyField = OptionChip | 'sku';
type OptionSelection = { field: OptionChip; value: string };

export class BcPage extends BasePage {
  private readonly locator = new BcLocator();

  readonly tradeIn = new BcTradeInService();
  readonly scPlus = new BcScPlusService();
  readonly eup = new BcEupService();
  readonly sim = new BcSimService();
  readonly galaxyClub = new BcGalaxyClubService();


  async prepareBcPage(): Promise<boolean> {
    return prepareWebViewPage('bc', this.locator.bcLayout);
    // await this.dismissOverlays();
  }

  async selectOptions(options: BcProductOptions): Promise<void> {
    const chips = this.optionSelections(options);
    console.warn(`[BC.selectOptions] Start: ${chips.map(({ field, value }) => `${field}=${value}`).join(' || ')}` );
    
    for (const { field, value } of chips) {
      let target;
      switch (field) {
        case 'deviceName':
          target = this.locator.deviceOption(value);
          break;
        case 'storage':
          target = this.locator.storageOption(value);
          break;
        case 'caseSize':
          target = this.locator.caseSizeOption(value);
          break;
        case 'connectivity':
          target = this.locator.connectivityOption(value);
          break;
        case 'color':
          target = this.locator.colorOption(value);
          break;
      }
      const displayed = await target.isDisplayed().catch(() => false);
      if (!displayed) {
        console.warn(`[BC.selectOptions] Skip: ${field}=${value} displayed=${displayed}`);
        continue;
      }
      await scrollElementToCenter(target).catch(() => undefined);
      await target.waitForClickable({ timeout: 1000 });
      await target.click();
      console.warn(`[BC.selectOptions] Click: ${field}=${value}`);
    }
    await this.dismissOverlays();
    console.warn('[BC.selectOptions] Done');
  }

  async verifyOptions(options: BcProductOptions): Promise<void> {
    const summary = await this.readSummaryDetails();
    console.warn(
      `[BC.verifyOptions] deviceName=${summary.deviceName} || sku=${summary.sku} || options=${summary.options}`
    );

    if (!summary.deviceName && !summary.options && !summary.sku) {
      throw new Error('BC/PD summary not found');
    }

    for (const { field, value } of [{ field: 'sku' as const, value: options.sku }, ...this.optionSelections(options)]) {
      const expected = await this.expectedSummaryValue(field, value);
      const actual = this.summaryActual(field, summary);
      console.warn(`[BC.verifyOptions] ${field} : input=${value} || expected=${expected} || actual=${actual}`);
      if (!this.summaryMatches(field, actual, expected)) {
        throw new Error(`BC/PD summary mismatch : field=${field} || expected=${expected} || actual=${actual}`);
      }
    }
  }
  
  /** Color: summary must match displayed name on the checked swatch, not data-englishname. */
  private async expectedSummaryValue(field: VerifyField, input: string): Promise<string> {
    if (field === 'sku') {
      return input;
    }
    if (field === 'color') {
      const visibleName = await this.readSelectedColorVisibleName();
      return visibleName || input;
    }
    const shown = await this.readOptionSelectedResult(field);
    return shown || input;
  }

  private async readSelectedColorVisibleName(): Promise<string> {
    const el = this.locator.selectedColorVisibleName;
    if (!(await el.isDisplayed().catch(() => false))) {
      return '';
    }
    return ((await el.getText().catch(() => '')) ?? '').trim();
  }

  private async readOptionSelectedResult(field: OptionChip): Promise<string> {
    const el = this.locator.optionSelectedResult(field);
    if (!(await el.isDisplayed().catch(() => false))) {
      return '';
    }
    return ((await el.getText().catch(() => '')) ?? '').trim();
  }

  async verifyPrice(_kind: string): Promise<void> {
    // TODO: Implement price verification
  }

  private async readSummaryDetails(): Promise<SummaryDetails> {
    return {
      deviceName: await this.readDisplayedText(this.locator.summaryDeviceName),
      sku: await this.readDisplayedText(this.locator.summarySku),
      options: await this.readDisplayedText(this.locator.summaryOptions, true),
      servicePrice: await this.readDisplayedText(this.locator.summaryServicePrice, true),
    };
  }

  private async readDisplayedText(
    nodes: ReturnType<typeof $$> | ReturnType<typeof $>,
    joinAll = false
  ): Promise<string> {
    const resolved = await nodes;
    const list = Array.isArray(resolved) ? resolved : [resolved];
    const parts: string[] = [];
    for (const node of list) {
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
    return parts.join(' ');
  }

  private optionSelections(options: BcProductOptions): OptionSelection[] {
    if ('kind' in options && options.kind === 'watch') {
      return [
        { field: 'deviceName', value: options.device },
        { field: 'caseSize', value: options.caseSize },
        { field: 'color', value: options.color },
        { field: 'connectivity', value: options.connectivity },
      ];
    }
    if ('kind' in options && options.kind === 'phone') {
      return [
        { field: 'deviceName', value: options.device },
        { field: 'storage', value: options.storage },
        { field: 'color', value: options.color },
      ];
    }
    return [
      { field: 'deviceName', value: options.deviceName },
      { field: 'storage', value: options.storage },
      { field: 'color', value: options.color },
    ];
  }

  private summaryActual(field: VerifyField, summary: SummaryDetails): string {
    if (field === 'sku') return summary.sku;
    if (field === 'deviceName') return summary.deviceName;
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
    await switchToWebView();
    await scrollElementToCenter(this.locator.addToCartButton).catch(() => undefined);

    // JS click: sticky bar is position:fixed and native clickability can time out.
    const button = this.locator.addToCartButton;
    await button.waitForExist({ timeout: 15000 });
    await driver.execute('arguments[0].click();', await button);
  }

  async getBcProductName(): Promise<string> {
    await switchToWebView();
    await switchToWindowByPage('bc');
    return await this.locator.bcProductName.getText();
  }

  async isOptionSectionVisible(_field: keyof BcProductOptions): Promise<boolean> {
    // TODO: Implement option section visibility check
    return false;
  }
}
