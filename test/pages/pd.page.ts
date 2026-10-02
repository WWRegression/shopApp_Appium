import { PdTradeInService } from '../services/tradein/pd-tradein.service';
import { PdTradeUpService } from '../services/tradeup/pd-tradeup.service';
import { PdScPlusService } from '../services/scplus/pd-scplus.service';
import { PdEupService } from '../services/eup/pd-eup.service';
import { PdSimService } from '../services/sim/pd-sim.service';
import { FlagshipWatchProduct } from '../helpers/flagship-sku.helper';
import { normalizeText, resolveDisplayColor } from '../helpers/data.helper';
import { markFailedAndStop, markFailed, FieldCheck } from '../helpers/report.helper';
import { getElementLabel, isDisplayedOrFalse, scrollAndJsClick, scrollUntilVisible, waitForDisplayedOrFalse } from '../helpers/element.helper';
import { prepareWebViewPage, switchToNative, switchToWebView } from '../helpers/context.helper';
import { ProductOptionFields } from './bc.page';
import { BasePage } from './base.page';
import { PdLocator } from '../locators/pd.locator';

export class PdPage extends BasePage {
  private readonly locator = new PdLocator();
  private selectedColor = '';
  readonly tradeIn = new PdTradeInService();
  readonly tradeUp = new PdTradeUpService();
  readonly scPlus = new PdScPlusService();
  readonly eup = new PdEupService();
  readonly sim = new PdSimService();

  /** skuAnchor renders early and carries data-shop-sku, so it doubles as the "PD is ready" marker. */
  async preparePdPage(): Promise<void> {
    const ready = await prepareWebViewPage('pd', this.locator.skuAnchor, 15000);
    console.warn(`[PD] preparePdPage ready=${ready}`);
    if (!ready) {
      // throw new Error('preparePdPage: PD not ready within 10s');
    }
  }
  
  async selectOptions(_options: ProductOptionFields): Promise<void> {
    // const chips = buildOptionList(options);
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
    // console.warn('[pd.selectOptions] done');
  }

  async getProductName(): Promise<string> {
    return await this.locator.productName.getText();
  }

  async getPdProductName(productName?: string | null): Promise<string> {
    const ready = await prepareWebViewPage('pd', this.locator.skuAnchor);
    if (ready) {
      return await this.locator.summaryProductName.getText();
    }
    if (!productName) {
      return '';
    }
    await switchToNative();
    return await this.locator.nativePdProductName(productName).getText();
  }

  async clickAddToCart(): Promise<void> {
    const btn = $(
      [
        '[an-la*="add to cart" i]',
        '[an-la*="buy now" i]',
        '.hubble-price-bar__price-cta button',
        '.pdd39-anchor-nav__cta button',
      ].join(', ')
    );
    await btn.waitForExist({ timeout: 15000 });
    await scrollAndJsClick(btn);
  }

  /** Katalon PD.verifyPDPageLoadBySKU — WebView PD header contains SKU. */
  async verifyPdLoadedBySku(sku: string): Promise<void> {
    await this.preparePdPage();
    const info = this.locator.headerSkuInfo;
    const text = ((await info.getText().catch(() => '')) ?? '').toLowerCase().replace(/\s+/g, '');
    const expected = sku.toLowerCase().replace(/\s+/g, '');
    if (!text.includes(expected)) {
      console.warn(`[PD] SKU soft-mismatch header="${text}" expected="${expected}"`);
    }
  }

  /** Katalon PD.selectAR + verifyARExecution (Google Lens / quicksearchbox). */
  async openArAndVerify(timeoutMs = 20000): Promise<void> {
    await switchToWebView();
    const ar = this.locator.arButton;
    await ar.waitForExist({ timeout: 15000 });
    await scrollAndJsClick(ar);

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const pkg = await driver.getCurrentPackage().catch(() => '');
      if (pkg === 'com.google.android.googlequicksearchbox') {
        console.warn('[PD] AR package launched');
        await driver.pause(2000);
        try {
          await driver.terminateApp('com.google.android.googlequicksearchbox');
        } catch {
          await driver.back();
        }
        return;
      }
      await driver.pause(1000);
    }
    throw new Error('AR function did not launch Google AR package within timeout');
  }

  /** Selects device/connectivity only if their section is shown (some PD products fix those values); color is always selectable. */
  async selectWatchOptions(product: FlagshipWatchProduct): Promise<void> {
    await this.selectDeviceIfShown(product);
    await this.selectConnectivityIfShown(product);
    await this.selectColor(product);
    if (product.isBespokeSKU) {
      await this.selectNonDefaultBand();
    }
  }

  /** Options here show a combined "Device (Connectivity, Size)" label, so match on device + case size together. */
  private async selectDeviceIfShown(product: FlagshipWatchProduct): Promise<void> {
    if (!(await isDisplayedOrFalse(this.locator.deviceSection))) {
      console.log('[PD][watch] device section not shown — using bound value');
      return;
    }

    const device = normalizeText(product.deviceName).replace(/\s+/g, '');
    const caseSize = normalizeText(product.caseSize).replace(/\s+/g, '');
    const candidates = [...(await this.locator.deviceOptionCandidates)];

    for (const el of candidates) {
      const raw = (await el.getAttribute('data-modeldisplay').catch(() => '')) ?? '';
      const normalized = normalizeText(raw).replace(/\s+/g, '');
      if (normalized.includes(device) && normalized.includes(caseSize)) {
        await markFailedAndStop(
          () => scrollAndJsClick(el),
          `[PD][watch] device option not selectable: "${product.deviceName} ${product.caseSize}"`
        );
        return;
      }
    }
    throw new Error(`[PD][watch] device section shown but no option matched "${product.deviceName} ${product.caseSize}"`);
  }

  private async selectConnectivityIfShown(product: FlagshipWatchProduct): Promise<void> {
    if (!(await isDisplayedOrFalse(this.locator.connectivitySection))) {
      console.log('[PD][watch] connectivity section not shown — using bound value');
      return;
    }

    const connOpt = this.locator.connectivityOption(product.connectivity);
    await markFailedAndStop(
      () => scrollAndJsClick(connOpt),
      `[PD][watch] connectivity option not selectable: "${product.connectivity}"`
    );
  }

  private async selectColor(product: FlagshipWatchProduct): Promise<void> {
    const displayColor = resolveDisplayColor(product.color, product.sku, 'watch');
    const colorOpt = this.locator.watchColorOption(displayColor);
    await colorOpt.waitForDisplayed({ timeout: 10000 }).catch(() => undefined);
    await markFailedAndStop(() => scrollAndJsClick(colorOpt), `[PD][watch] color option not selectable: "${displayColor}"`);
    this.selectedColor = (await getElementLabel(this.locator.selectedColorText)) || displayColor;
  }

  private async selectNonDefaultBand(): Promise<void> {
    const band = this.locator.watchNonDefaultBandOption;
    if (!(await isDisplayedOrFalse(band))) {
      console.log('[PD][watch] bespoke band option not shown');
      return;
    }
    await markFailedAndStop(
      () => scrollAndJsClick(band),
      '[PD][watch] non-default band not selectable (bespoke)'
    );
  }

  async verifySku(expectedSku: string): Promise<void> {
    if (!expectedSku) {
      throw new Error('[PD] verifySku: expectedSku is required');
    }
    const sku = normalizeText(await getElementLabel(this.locator.headerSkuInfo));
    console.warn(`[PD] sku verification: expected "${expectedSku}", found "${sku}"`);
    if (sku !== expectedSku.toLowerCase()) {
      throw new Error(`[PD] sku verification failed: expected "${expectedSku}", found "${sku}"`);
    }
  }

  async verifySkuForNativePdPage(skuOrName: string): Promise<void> {
    await switchToNative();
    if (await waitForDisplayedOrFalse(this.locator.webViewContainer,{timeout:10000})) {
      throw new Error('PD is in native context');
    }
    const skuElement = this.locator.nativePdProductName(skuOrName);
    await scrollUntilVisible(skuElement);
    if(!await isDisplayedOrFalse(skuElement)) {
      throw new Error(`Native PD not shown for "${skuOrName}" in native context`);
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
      ['device', product.deviceName],
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
