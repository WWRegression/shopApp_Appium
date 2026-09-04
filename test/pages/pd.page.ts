import { BasePage } from './base.page';
import { PdLocator } from '../locators/pd.locator';
import { PdTradeInService } from '../services/tradein/pd-tradein.service';
import { PdScPlusService } from '../services/scplus/pd-scplus.service';
import { PdEupService } from '../services/eup/pd-eup.service';
import { PdSimService } from '../services/sim/pd-sim.service';
import { FlagshipWatchProduct } from '../helpers/flagship-sku.helper';
import { normalizeText, resolveDisplayColor } from '../helpers/data.helper';
import { markFailedAndStop, markFailed, FieldCheck } from '../helpers/report.helper';
import { getElementLabel, isDisplayedSafe, clickOptionInput } from '../helpers/element.helper';
import { prepareWebViewPage, switchToWebView, switchToWindowByPage } from '../helpers/context.helper';
import { BcProductOptions, optionSelections } from './bc.page';
import { scrollElementToCenter } from '../helpers/gesture.helper';

export class PdPage extends BasePage {
  private readonly locator = new PdLocator();
  private selectedColor = '';

  readonly tradeIn = new PdTradeInService();
  readonly scPlus = new PdScPlusService();
  readonly eup = new PdEupService();
  readonly sim = new PdSimService();

  /** skuAnchor renders early and carries data-shop-sku, so it doubles as the "PD is ready" marker. */
  async preparePdPage(): Promise<boolean> {
    return prepareWebViewPage('pd', this.locator.skuAnchor);
  }
  
  async selectOptions(options: BcProductOptions): Promise<void> {
    // const chips = optionSelections(options);
    // console.warn(
    //   `[pd.selectOptions] start ${chips.map(({ field, value }) => `${field}=${value}`).join(', ')}`
    // );
    // const ready = await this.preparePdPage();
    // console.warn(`[pd.selectOptions] preparePdPage ready=${ready}`);
    // if (!ready) {
    //   throw new Error('PD page not ready');
    // }
    // const pdLocator = new PdLocator();
    // for (const { field, value } of chips) {
    //   let target;
    //   switch (field) {
    //     case 'deviceName':
    //       target = pdLocator.deviceOption(value);
    //       break;
    //     case 'storage':
    //       target = pdLocator.storageOption(value);
    //       break;
    //     case 'caseSize':
    //       target = pdLocator.caseSizeOption(value);
    //       break;
    //     case 'connectivity':
    //       target = pdLocator.connectivityOption(value);
    //       break;
    //     case 'color':
    //       target = pdLocator.colorOption(value);
    //       break;
    //   }
    //   const displayed = await target.isDisplayed().catch(() => false);
    //   console.warn(`[pd.selectOptions] ${field}=${value} displayed=${displayed}`);
    //   if (!displayed) {
    //     continue;
    //   }
    //   await scrollElementToCenter(target).catch(() => undefined);
    //   await target.waitForClickable({ timeout: 10000 });
    //   await target.click();
    //   console.warn(`[pd.selectOptions] ${field}=${value} clicked`);
    // }
    console.warn('[pd.selectOptions] done');
  }

  async getProductName(): Promise<string> {
    return await this.locator.productName.getText();
  }

  async getPdProductName(): Promise<string> {
    await switchToWebView();
    await switchToWindowByPage('pd');
    return await this.locator.pdProductName.getText();
  }

  async getNativePdProductName(productName: string): Promise<string> {
    return await this.locator.nativePdProductName(productName).getText();
  }

  async addToCart(): Promise<void> {
    // TODO: Implement add to cart from PD
  }

  /** Selects device/connectivity only if their section is shown (some PD products fix those values); color is always selectable. */
  async selectWatchOptions(product: FlagshipWatchProduct): Promise<void> {
    await this.selectDeviceIfShown(product);
    await this.selectConnectivityIfShown(product);
    await this.selectColor(product);
  }

  /** Options here show a combined "Device (Connectivity, Size)" label, so match on device + case size together. */
  private async selectDeviceIfShown(product: FlagshipWatchProduct): Promise<void> {
    if (!(await isDisplayedSafe(this.locator.deviceSection))) {
      console.log('[PD][watch] device section not shown — using bound value');
      return;
    }

    const device = normalizeText(product.device).replace(/\s+/g, '');
    const caseSize = normalizeText(product.caseSize).replace(/\s+/g, '');
    const candidates = [...(await this.locator.deviceOptionCandidates)];

    for (const el of candidates) {
      const raw = (await el.getAttribute('data-modeldisplay').catch(() => '')) ?? '';
      const normalized = normalizeText(raw).replace(/\s+/g, '');
      if (normalized.includes(device) && normalized.includes(caseSize)) {
        await markFailedAndStop(
          () => clickOptionInput(el),
          `[PD][watch] device option not selectable: "${product.device} ${product.caseSize}"`
        );
        return;
      }
    }
    throw new Error(`[PD][watch] device section shown but no option matched "${product.device} ${product.caseSize}"`);
  }

  private async selectConnectivityIfShown(product: FlagshipWatchProduct): Promise<void> {
    if (!(await isDisplayedSafe(this.locator.connectivitySection))) {
      console.log('[PD][watch] connectivity section not shown — using bound value');
      return;
    }

    const connOpt = this.locator.connectivityOption(product.connectivity);
    await markFailedAndStop(
      () => clickOptionInput(connOpt),
      `[PD][watch] connectivity option not selectable: "${product.connectivity}"`
    );
  }

  private async selectColor(product: FlagshipWatchProduct): Promise<void> {
    const displayColor = resolveDisplayColor(product.color, product.sku, 'watch');
    const colorOpt = this.locator.watchColorOption(displayColor);
    await colorOpt.waitForDisplayed({ timeout: 10000 }).catch(() => undefined);
    await markFailedAndStop(() => clickOptionInput(colorOpt), `[PD][watch] color option not selectable: "${displayColor}"`);
    this.selectedColor = (await getElementLabel(this.locator.selectedColorText)) || displayColor;
  }

  async verifySku(product: FlagshipWatchProduct): Promise<void> {
    const sku = (await this.locator.skuAnchor.getAttribute('data-shop-sku').catch(() => '')) ?? '';
    if (sku.toLowerCase() !== product.sku.toLowerCase()) {
      throw new Error(`[PD][watch] sku verification failed: expected "${product.sku}", found "${sku}"`);
    }
  }

  /** Checks color against our own selection, and device/connectivity/caseSize against the product data. */
  async verifyOptions(product: FlagshipWatchProduct): Promise<void> {
    const header = normalizeText(await getElementLabel(this.locator.headerSpec));
    const choiceEls = [...(await this.locator.summaryChoices)];
    const choiceTexts = await Promise.all(choiceEls.map((el) => el.getText()));
    const productName = await getElementLabel(this.locator.summaryProductName);
    const summary = normalizeText(`${productName} ${choiceTexts.join(' ')}`);

    const checks: FieldCheck[] = [
      {
        label: 'color',
        pass: summary.includes(normalizeText(this.selectedColor)),
        detail: `expected "${this.selectedColor}"`,
      },
    ];
    const fields: [string, string][] = [
      ['device', product.device],
      ['connectivity', product.connectivity],
      ['caseSize', product.caseSize],
    ];
    for (const [label, value] of fields) {
      const normalized = normalizeText(value);
      checks.push({ label, pass: summary.includes(normalized) || header.includes(normalized), detail: `expected "${value}"` });
    }
    markFailed(checks, '[PD][watch] options');
  }
}
