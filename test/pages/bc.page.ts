import { BasePage } from './base.page';
import { BcLocator } from '../locators/bc.locator';
import { PdPage } from './pd.page';
import { BcTradeInService } from '../services/tradein/bc-tradein.service';
import { BcScPlusService } from '../services/scplus/bc-scplus.service';
import { BcEupService } from '../services/eup/bc-eup.service';
import { BcSimService } from '../services/sim/bc-sim.service';
import { BcGalaxyClubService } from '../services/galaxyclub/bc-galaxyclub.service';
import { switchToWebView, prepareWebViewPage, isCurrentWebViewPage, switchToWindowByPage } from '../helpers/context.helper';
import { scrollElementToCenter } from '../helpers/gesture.helper';
import { FlagshipProduct, FlagshipPhoneProduct, FlagshipWatchProduct } from '../helpers/flagship-sku.helper';
import { normalizeText, stripToAlnum, resolveDisplayColor } from '../helpers/data.helper';
import { markFailedAndStop, markFailed, FieldCheck } from '../helpers/report.helper';
import { getElementLabel } from '../helpers/element.helper';

/** Regression `site.product` chip fields. */
export interface SiteProduct {
  deviceName: string;
  storage: string;
  color: string;
}

export type BcProductOptions = SiteProduct | FlagshipProduct;

export type OptionChip = 'deviceName' | 'storage' | 'caseSize' | 'color' | 'connectivity';
type OptionSelection = { field: OptionChip; value: string };

export type SummaryPart = 'deviceName' | 'sku' | 'options' | 'servicePrice';
export type SummaryDetails = Record<SummaryPart, string>;

function optionTextMatches(actual: string, expected: string): boolean {
  const a = actual.replace(/\s+/g, '').toLowerCase();
  const b = expected.replace(/\s+/g, '').toLowerCase();
  return Boolean(a) && Boolean(b) && (a.includes(b) || b.includes(a));
}

export function optionSelections(options: BcProductOptions): OptionSelection[] {
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

function isFlagshipProduct(input: BcProductOptions): input is FlagshipProduct {
  return 'kind' in input;
}

function toFlagshipPhoneProduct(input: BcProductOptions): FlagshipPhoneProduct {
  return {
    kind: 'phone',
    sku: input.sku,
    device: input.deviceName,
    color: input.color,
    storage: input.storage,
    ram: '',
    isPFDefaultSKU: false,
  };
}

export interface SelectedDisplayValues {
  device: string;
  color: string;
  storage?: string;
  caseSize?: string;
  connectivity?: string;
}

export class BcPage extends BasePage {
  private readonly locator = new BcLocator();
  private readonly pdPage = new PdPage();
  private lastSelection: SelectedDisplayValues | undefined;

  readonly tradeIn = new BcTradeInService();
  readonly scPlus = new BcScPlusService();
  readonly eup = new BcEupService();
  readonly sim = new BcSimService();
  readonly galaxyClub = new BcGalaxyClubService();


  async prepareBcPage(): Promise<boolean> {
    return prepareWebViewPage('bc', this.locator.bcLayout);
  }

  /** Display values from the last selectOptions() call. Undefined for watch PD. */
  getSelectedOptions(): SelectedDisplayValues | undefined {
    return this.lastSelection;
  }

  async selectOptions(options: BcProductOptions): Promise<void> {
    await this.prepareBcPage();
    await this.dismissOverlays();

    const chips = optionSelections(options);
    console.warn(`[bc.selectOptions] start ${chips.map(({ field, value }) => `${field}=${value}`).join(', ')}` );
    
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
        console.warn(`[bc.selectOptions] ${field}=${value} displayed=${displayed}`);
        continue;
      }
      await scrollElementToCenter(target).catch(() => undefined);
      await target.waitForClickable({ timeout: 1000 });
      await target.click();
      console.warn(`[bc.selectOptions] ${field}=${value} clicked`);
    }
    await this.dismissOverlays();
    console.warn('[bc.selectOptions] done');
  }

  async verifyOptions(options: BcProductOptions): Promise<void> {
    const summary = await this.readSummaryDetails();
    console.warn( `[bc.verifyOptions] deviceName=${summary.deviceName} options=${summary.options}` );

    if (!summary.deviceName && !summary.options) {
      throw new Error('BC/PD summary not found');
    }

    for (const { field, value } of optionSelections(options)) {
      const expected = await this.expectedSummaryValue(field, value);
      const actual = field === 'deviceName' ? summary.deviceName : summary.options;
      console.warn(`[bc.verifyOptions] ${field} input=${value} expected=${expected} actual=${actual}`);
      if (!optionTextMatches(actual, expected)) {
        throw new Error(
          `BC/PD summary mismatch field=${field} expected=${expected} actual=${actual}`
        );
      }
    }
  }
  
  /** Color (and other chips) may show a localized label; summary uses that, not the English input. */
  private async expectedSummaryValue(field: OptionChip, input: string): Promise<string> {
    const shown = await this.readOptionSelectedResult(field);
    if (field === 'color') {
      const fromChecked = await this.readCheckedColorDisplayName();
      return shown || fromChecked || input;
    }
    return shown || input;
  }

  private async readOptionSelectedResult(field: OptionChip): Promise<string> {
    const el = this.locator.optionSelectedResult(field);
    if (!(await el.isDisplayed().catch(() => false))) {
      return '';
    }
    return ((await el.getText().catch(() => '')) ?? '').trim();
  }

  private async readCheckedColorDisplayName(): Promise<string> {
    const checked = $(
      '.s-option-color-special input:checked, .hubble-pd-radio input:checked, [an-la^="color:"][aria-pressed="true"]'
    );
    if (!(await checked.isExisting().catch(() => false))) {
      return '';
    }
    return (
      ((await checked.getAttribute('data-displayname').catch(() => '')) ?? '').trim() ||
      ((await checked.getText().catch(() => '')) ?? '').trim()
    );
  }

  async verifyPrice(_kind: string): Promise<void> {
    // TODO: Implement price verification
  }
  
  async verifySku(input: BcSelectInput): Promise<void> {
    const product = isFlagshipProduct(input) ? input : toFlagshipPhoneProduct(input);

    if (product.kind === 'watch' && (await this.resolveWatchPage()) === 'pd') {
      await this.pdPage.verifySku(product);
      return;
    }

    if (product.kind === 'phone') {
      await this.verifyPhoneSku(product);
    } else {
      await this.verifyWatchBcSku(product);
    }
  }

  private async readSummaryDetails(): Promise<SummaryDetails> {
    return {
      deviceName: await this.readDisplayedText(this.locator.summaryDeviceName),
      sku: await this.readDisplayedText(this.locator.summarySku),
      options: await this.readDisplayedText(this.locator.summaryOptions, true),
      servicePrice: await this.readDisplayedText(this.locator.summaryServicePrice, true),
    };
  }

  private async readDisplayedText(nodes: ReturnType<typeof $$>, joinAll = false): Promise<string> {
    const parts: string[] = [];
    for (const node of await nodes) {
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

  async isBcPage(): Promise<boolean> {
    return isCurrentWebViewPage('bc');
  }

  /** Detect watch BC vs PD by URL before either page renders. */
  private async resolveWatchPage(waitMs = 0): Promise<'bc' | 'pd'> {
    return (await isCurrentWebViewPage('pd', { waitMs })) ? 'pd' : 'bc';
  }

  /** JS click — native click is intercepted by the styled label over the radio. */
  private async clickOption(el: ChainablePromiseElement | WebdriverIO.Element): Promise<void> {
    await scrollElementToCenter(el as ChainablePromiseElement).catch(() => undefined);
    await driver.execute('arguments[0].click();', await el);
  }

  /** Read displayed value from data-displayname/data-modeldisplay, then click. Do not use an-la/data-englishname. */
  private async selectOption(
    opt: ChainablePromiseElement,
    attr: 'data-displayname' | 'data-modeldisplay',
    fallback: string,
    label: string
  ): Promise<string> {
    await opt.waitForDisplayed({ timeout: 10000 }).catch(() => undefined);
    const value = (await opt.getAttribute(attr).catch(() => '')) || fallback;
    console.log(`[BC]${label}: expected="${fallback}" displayed="${value}"`);
    await markFailedAndStop(() => this.clickOption(opt), `[BC]${label} option not selectable: "${fallback}"`);
    return value;
  }

  private async selectPhoneOptions(product: FlagshipPhoneProduct): Promise<SelectedDisplayValues> {
    const deviceOpt = this.locator.phoneDeviceOption(product.device);
    const device = await this.selectOption(deviceOpt, 'data-displayname', product.device, '[phone] device');

    const storage = await this.selectPhoneStorage(product.storage, product.ram);
    console.log(`[BC][phone] storage: expected="${product.storage}${product.ram}" displayed="${storage}"`);

    const colorOpt = this.locator.phoneColorOptionBySku(product.sku);
    const color = await this.selectOption(colorOpt, 'data-displayname', product.color, '[phone] color');

    return { device, storage, color };
  }

  /** Match storage by alnum text. Prefix-only when ram is unknown. */
  private async selectPhoneStorage(storage: string, ram: string): Promise<string> {
    const target = stripToAlnum(`${storage}${ram}`);
    const storageOnly = stripToAlnum(storage);
    const candidates = [...(await this.locator.phoneStorageOptionCandidates)];

    for (const el of candidates) {
      const raw = (await el.getAttribute('data-displayname').catch(() => '')) ?? '';
      if (!raw) continue;
      const normalized = stripToAlnum(raw);
      const matches = ram ? normalized === target : normalized.startsWith(storageOnly);
      if (matches) {
        await markFailedAndStop(() => this.clickOption(el), `[BC][phone] storage option not selectable: "${storage}${ram}"`);
        return raw;
      }
    }
    throw new Error(`[BC][phone] storage option not found: "${storage}${ram}"`);
  }

  private async selectWatchBcOptions(product: FlagshipWatchProduct): Promise<SelectedDisplayValues> {
    const device = await this.selectOption(
      this.locator.watchDeviceOption(product.device),
      'data-modeldisplay',
      product.device,
      '[watch] device'
    );
    const caseSize = await this.selectOption(
      this.locator.watchCaseSizeOption(product.caseSize),
      'data-modeldisplay',
      product.caseSize,
      '[watch] case size'
    );
    const connectivity = await this.selectOption(
      this.locator.watchConnectivityOption(product.connectivity),
      'data-modeldisplay',
      product.connectivity,
      '[watch] connectivity'
    );

    const displayColor = resolveDisplayColor(product.color, product.sku, 'watch');
    const color = await this.selectOption(
      this.locator.watchColorOption(displayColor),
      'data-modeldisplay',
      displayColor,
      '[watch] color'
    );

    if (product.isBespokeSKU) {
      const bandOpt = this.locator.watchNonDefaultBandOption;
      await bandOpt.waitForDisplayed({ timeout: 10000 }).catch(() => undefined);
      await markFailedAndStop(() => this.clickOption(bandOpt), `[BC][watch] non-default band option not selectable`);
    }

    return { device, caseSize, connectivity, color };
  }

  private async verifyPhoneSku(product: FlagshipPhoneProduct): Promise<void> {
    await this.locator.phoneSummarySku.waitForDisplayed({ timeout: 10000 }).catch(() => undefined);
    const summarySku = await getElementLabel(this.locator.phoneSummarySku);
    const found = normalizeText(summarySku).includes(normalizeText(product.sku));
    console.log(`[BC][phone] check sku: expected="${product.sku}" summary="${summarySku}" -> found=${found}`);
    if (!found) {
      throw new Error(`[BC][phone] sku verification failed: expected "${product.sku}", summary was "${summarySku}"`);
    }
  }

  private async verifyPhoneOptions(
    product: FlagshipPhoneProduct,
    selected: SelectedDisplayValues | undefined
  ): Promise<void> {
    await this.locator.phoneSummarySku.waitForDisplayed({ timeout: 10000 }).catch(() => undefined);
    const choices = [...(await this.locator.phoneSummaryChoices)];
    const choiceTexts = await Promise.all(choices.map((el) => el.getText()));
    const summary = normalizeText(choiceTexts.join(' '));

    console.log(`[BC][phone] selected (displayed on screen): ${JSON.stringify(selected)}`);
    console.log(`[BC][phone] summary choices: ${JSON.stringify(choiceTexts)}`);

    // Device skipped: title hides after re-select. SKU already covers the combination.
    const expected: [string, string | undefined][] = [
      ['storage', selected?.storage ?? product.storage],
      ['color', selected?.color ?? product.color],
    ];
    const checks: FieldCheck[] = [];
    for (const [label, value] of expected) {
      if (!value) {
        console.log(`[BC][phone] check ${label}: skipped (no value)`);
        continue;
      }
      const found = summary.includes(normalizeText(value));
      console.log(`[BC][phone] check ${label}: expected="${value}" -> found=${found}`);
      checks.push({ label, pass: found, detail: `expected "${value}"` });
    }
    markFailed(checks, '[BC][phone] options');
  }

  private async verifyWatchBcSku(product: FlagshipWatchProduct): Promise<void> {
    await this.locator.watchSummarySku.waitForDisplayed({ timeout: 10000 }).catch(() => undefined);
    const summarySku = await getElementLabel(this.locator.watchSummarySku);
    const found = normalizeText(summarySku).includes(normalizeText(product.sku));
    console.log(`[BC][watch] check sku: expected="${product.sku}" summary="${summarySku}" -> found=${found}`);
    if (!found) {
      throw new Error(`[BC][watch] sku verification failed: expected "${product.sku}", summary was "${summarySku}"`);
    }
  }

  private async verifyWatchBcOptions(
    product: FlagshipWatchProduct,
    selected: SelectedDisplayValues | undefined
  ): Promise<void> {
    // Wait for the summary panel to settle after the last option click.
    await this.locator.watchSummaryDevice.waitForDisplayed({ timeout: 10000 }).catch(() => undefined);
    const summaryDevice = await getElementLabel(this.locator.watchSummaryDevice);
    const choices = [...(await this.locator.watchSummaryChoices)];
    const choiceTexts = await Promise.all(choices.map((el) => el.getText()));
    const summary = normalizeText(`${summaryDevice} ${choiceTexts.join(' ')}`);

    const fields: [string, string | undefined][] = [
      ['device', selected?.device ?? product.device],
      ['caseSize', selected?.caseSize ?? product.caseSize],
      ['connectivity', selected?.connectivity ?? product.connectivity],
      ['color', selected?.color ?? product.color],
    ];
    const checks: FieldCheck[] = [];
    for (const [label, value] of fields) {
      if (!value) continue;
      checks.push({ label, pass: summary.includes(normalizeText(value)), detail: `expected "${value}"` });
    }
    markFailed(checks, '[BC][watch] options');
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
