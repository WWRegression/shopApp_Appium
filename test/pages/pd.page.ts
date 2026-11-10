import { PdTradeInService } from '../services/tradein/pd-tradein.service';
import { PdTradeUpService } from '../services/tradeup/pd-tradeup.service';
import { PdScPlusService } from '../services/scplus/pd-scplus.service';
import { PdEupService } from '../services/eup/pd-eup.service';
import { PdSimService } from '../services/sim/pd-sim.service';
import { FlagshipWatchProduct } from '../helpers/flagship-sku.helper';
import { normalizeProductName, normalizeText, productNameMatches, resolveDisplayColor } from '../helpers/data.helper';
import { markFailedAndStop, FieldCheck } from '../helpers/report.helper';
import { getElementLabel, scrollAndJsClick, clickIfDisplayed, scrollUntilVisible, isDisplayedOrFalse, waitForDisplayedOrFalse } from '../helpers/element.helper';
import { getCurrentWebViewPage, isCurrentWebViewPage, prepareWebViewPage, switchToNative, switchToWebView } from '../helpers/context.helper';
import { forceStopPackage } from '../helpers/device.helper';
import { getSiteData } from '../../config/site';
import { ProductOptionFields } from './bc.page';
import { BasePage } from './base.page';
import { PdLocator } from '../locators/pd.locator';

/** IN auto-fills a located pincode; wait so typing is not overwritten. */
const DELIVERY_ZIP_SETTLE_MS = 1500;

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
    const ready = await prepareWebViewPage('pd', () => this.locator.skuAnchor, 40000);
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

  async isPdPage(): Promise<boolean> {
    return isCurrentWebViewPage('pd');
  }

  /** Verifies the PD page is shown (checked from native context so a closed window cannot hold the check). */
  async verifyPdPage(): Promise<void> {
    await switchToNative();
    const onPd = await driver
      .waitUntil(() => this.isPdPage(), { timeout: 8000, interval: 1000 })
      .then(() => true, () => false);
    const actual = onPd ? 'pd' : (await getCurrentWebViewPage()).page;
    console.log(`[verifyPdPage] expected=pd actual=${actual} result=${onPd ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'PD page not shown', pass: onPd, detail: `actual ${actual}` }], 'verifyPdPage');
  }

  /** Verifies the PD summary product name matches the expected (PF) product name. */
  async verifyProductName(expected: string | null): Promise<void> {
    await this.preparePdPage();
    // textContent: the summary can sit off screen when PD comes back scrolled
    const element = this.locator.summaryProductName;
    await element.waitForExist({ timeout: 5000 }).catch(() => undefined);
    const raw = String((await element.getProperty('textContent').catch(() => '')) ?? '').trim();
    const actual = normalizeProductName(raw);
    const pass = productNameMatches(expected, actual);
    console.log(`[PD.verifyProductName] expected="${expected}" actual="${actual}" (raw="${raw}") result=${pass ? 'PASS' : 'FAIL'}`);
    markFailedAndStop([{ label: 'PD product name mismatch', pass, detail: `expected "${expected}", actual "${raw}"` }], 'PD.verifyProductName');
  }

  async clickAddToCart(): Promise<void> {
    await this.fillDeliveryZipIfShown();
    const sticky = this.locator.addToCartButton;
    const btn = (await sticky.isExisting().catch(() => false)) ? sticky : this.locator.addToCartButtonFallback;
    await btn.waitForExist({ timeout: 15000 });
    await scrollAndJsClick(btn);
  }

  /** IN Delivery details on PD — located pincode (e.g. 04780) is often invalid; replace then Apply. */
  private async fillDeliveryZipIfShown(): Promise<void> {
    if (!(await this.deliveryZipExists())) {
      return;
    }
    const postalCode = getSiteData().shipping?.postalCode ?? getSiteData().tradeUp?.postalCode ?? '';
    if (!postalCode) {
      return;
    }
    await driver.pause(DELIVERY_ZIP_SETTLE_MS);
    const before = await this.readDeliveryZip();
    if (before && before !== postalCode) {
      console.warn(`[PD.fillDeliveryZip] replacing auto-filled "${before}"`);
    }
    let entered = await this.writeDeliveryZip(postalCode);
    await driver.pause(DELIVERY_ZIP_SETTLE_MS);
    if ((await this.readDeliveryZip()) !== postalCode) {
      entered = await this.writeDeliveryZip(postalCode);
    }
    await this.clickDeliveryZipApply();
    console.warn(`[PD.fillDeliveryZip] entered: ${entered || postalCode}`);
  }

  /** querySelector in-page so geo re-renders cannot stale a held WebElement. */
  private async deliveryZipExists(): Promise<boolean> {
    return Boolean(
      await driver.execute(
        (selector: string) => Boolean(document.querySelector(selector)),
        PdLocator.deliveryZipInputCss
      ).catch(() => false)
    );
  }

  private async readDeliveryZip(): Promise<string> {
    const value = await driver.execute(
      (selector: string) => {
        const input = document.querySelector(selector) as HTMLInputElement | null;
        return input?.value ?? '';
      },
      PdLocator.deliveryZipInputCss
    ).catch(() => '');
    return String(value ?? '').trim();
  }

  private async writeDeliveryZip(postalCode: string): Promise<string> {
    const value = await driver.execute(
      (selector: string, text: string) => {
        const input = document.querySelector(selector) as HTMLInputElement | null;
        if (!input) {
          return '';
        }
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (setter) {
          setter.call(input, text);
        } else {
          input.value = text;
        }
        for (const type of ['input', 'keyup', 'change']) {
          input.dispatchEvent(new Event(type, { bubbles: true }));
        }
        return input.value ?? '';
      },
      PdLocator.deliveryZipInputCss,
      postalCode
    );
    return String(value ?? '').trim();
  }

  private async clickDeliveryZipApply(): Promise<void> {
    await driver.execute((selector: string) => {
      const btn = document.querySelector(selector) as HTMLElement | null;
      btn?.click();
    }, PdLocator.deliveryZipCheckCss).catch(() => undefined);
  }

  async openArAndVerify(timeoutMs = 20000): Promise<void> {
    await switchToWebView();
    const ar = this.locator.arButton;
    if (!await clickIfDisplayed(ar,timeoutMs)) {
      throw new Error('AR button not displayed');
    }

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const pkg = await driver.getCurrentPackage().catch(() => '');
      if (pkg === 'com.google.android.googlequicksearchbox') {
        console.warn('[PD] AR package launched');
        await driver.pause(2000);
        try {
          await forceStopPackage('com.google.android.googlequicksearchbox');
        } catch {
          await driver.pressKeyCode(4);
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
    const displayColor = resolveDisplayColor(product.color, product.sku ?? '', 'watch');
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
      throw new Error('PD is not in native context');
    }
    console.warn('[PD.verifySkuForNativePdPage] Native PD Page');
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
    markFailedAndStop(checks, '[PD][watch] options');
  }
}
