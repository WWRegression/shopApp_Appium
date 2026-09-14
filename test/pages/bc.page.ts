import { BasePage } from './base.page';
import { BcLocator } from '../locators/bc.locator';
import { BcTradeInService } from '../services/tradein/bc-tradein.service';
import { BcScPlusService } from '../services/scplus/bc-scplus.service';
import { BcEupService } from '../services/eup/bc-eup.service';
import { BcSimService } from '../services/sim/bc-sim.service';
import { BcGalaxyClubService } from '../services/galaxyclub/bc-galaxyclub.service';
import { switchToWebView, prepareWebViewPage, isCurrentWebViewPage } from '../helpers/context.helper';
import { scrollElementToCenter, scrollWebViewDown } from '../helpers/gesture.helper';
import { storageCapacityMatches, pickStorageLabel } from '../helpers/data.helper';
import { jsClick, clickWebViewElement } from '../helpers/element.helper';

/**
 * BC가 받는 입력. 사이트 JSON / Flagship phone / Flagship watch 모두 이 필드만 사용한다.
 * kind, ram, isPFDefaultSKU 는 카탈로그 전용 — select/verify 대상 아님.
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

/** 클릭 가능한 옵션. isBespokeSKU 는 밴드 클릭만 하고 비교할 값이 없다. */
export const Options = ['deviceName', 'storage', 'caseSize', 'color', 'connectivity', 'isBespokeSKU'] as const;
export type OptionChip = (typeof Options)[number];
type ValuedChip = Exclude<OptionChip, 'isBespokeSKU'>;

/** sku 는 input, 나머지는 선택 칩 라벨. connectivity 는 watch(caseSize)만. price 는 추후. */
export const verifyOptionFields = ['sku', 'deviceName', 'storage', 'caseSize', 'color', 'connectivity'] as const;
export type VerifyField = (typeof verifyOptionFields)[number];

export interface SelectedDisplayValues {
  device: string;
  storage?: string;
  caseSize?: string;
  color: string;
  connectivity?: string;
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

  async prepareBcPage(): Promise<boolean> {
    return prepareWebViewPage('bc', this.locator.bcLayout);
    // await this.dismissOverlays();
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
      if (!(await this.revealInWebView(target))) {
        console.warn(`[BC.selectOptions] Skip: ${chip.field} not in DOM after scroll`);
        continue;
      }
      await clickWebViewElement(target);
      console.warn(`[BC.selectOptions] Click: ${chip.field}`);
    }
    await this.dismissOverlays();
    console.warn('[BC.selectOptions] Done');
  }

  async verifyOptions(options: ProductOptionFields): Promise<void> {
    const summary = await this.readSummaryDetails();
    console.warn(`[BC.verifyOptions] summary=${JSON.stringify(summary)}`);

    for (const field of verifyOptionFields) {
      if (!options[field]) {
        continue;
      }
      const expected = await this.expectedSummaryValue(field, String(options[field]));
      const actual = this.summaryActual(field, summary);
      console.warn(`[BC.verifyOptions] ${field} : expected=${expected} || actual=${actual}`);
      if (!this.summaryMatches(field, actual, expected)) {
        throw new Error(`BC/PD summary mismatch : field=${field} || expected=${expected} || actual=${actual}`);
      }
    }
  }

  /** sku: input. 그 외: 선택된 옵션에 보이는 라벨, 없으면 input. */
  private async expectedSummaryValue(field: VerifyField, inputData: string): Promise<string> {
    if (field === 'sku') {
      return inputData;
    }
    const shown = await this.readOptionSelectedResult(field);
    return shown || inputData || '';
  }

  private async readOptionSelectedResult(field: ValuedChip): Promise<string> {
    const el = this.locator.optionSelectedResult(field);
    if (!(await el.isDisplayed().catch(() => false))) {
      return '';
    }
    const text = ((await el.getText().catch(() => '')) ?? '').trim();
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

  /** Locator가 DOM에 없으면 WebView를 내린다. 화면 중앙 이동은 clickWebViewElement({ scroll: true }). */
  private async revealInWebView(target: ChainablePromiseElement, maxAttempts = 6): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (await target.isExisting().catch(() => false)) {
        return true;
      }
      console.warn(`[BC.revealInWebView] not found, scroll down attempt=${attempt + 1}`);
      await scrollWebViewDown();
    }
    return target.isExisting().catch(() => false);
  }

  /**
   * `$$`/`$`를 먼저 resolve하면 미존재 시 빈 배열이라 스크롤 기회가 없다.
   * 텍스트를 못 읽으면 스크롤한 뒤 locator를 다시 조회한다.
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
    await switchToWebView();
    await scrollElementToCenter(this.locator.addToCartButton).catch(() => undefined);

    // JS click: sticky bar is position:fixed and native clickability can time out.
    const button = this.locator.addToCartButton;
    await button.waitForExist({ timeout: 15000 });
    await jsClick(button);
  }

  async getBcProductName(): Promise<string> {
    await this.prepareBcPage();
    return this.locator.summaryDeviceName[0].getText();
  }

}
