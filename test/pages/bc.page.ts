import { BasePage } from './base.page';
import { BcLocator } from '../locators/bc.locator';
import { BcTradeInService } from '../services/tradein/bc-tradein.service';
import { BcScPlusService } from '../services/scplus/bc-scplus.service';
import { BcEupService } from '../services/eup/bc-eup.service';
import { BcSimService } from '../services/sim/bc-sim.service';
import { BcGalaxyClubService } from '../services/galaxyclub/bc-galaxyclub.service';
import { switchToWebView, prepareWebViewPage, isCurrentWebViewPage } from '../helpers/context.helper';
import { scrollElementToCenter } from '../helpers/gesture.helper';

export interface BcProductOptions {
  deviceName: string;
  storage: string;
  color: string;
}

export class BcPage extends BasePage {
  private readonly locator = new BcLocator();

  readonly tradeIn = new BcTradeInService();
  readonly scPlus = new BcScPlusService();
  readonly eup = new BcEupService();
  readonly sim = new BcSimService();
  readonly galaxyClub = new BcGalaxyClubService();


  async prepareBcPage(): Promise<boolean> {
    return prepareWebViewPage('bc', this.locator.bcLayout);
  }

  async selectOptions(options: BcProductOptions): Promise<void> {
    await this.prepareBcPage();
    await this.dismissOverlays();

    await this.selectOption('deviceName', options.deviceName);
    await this.selectOption('storage', options.storage);
    await this.selectOption('color', options.color);
    await this.dismissOverlays();
  }

  async selectOption(field: keyof BcProductOptions, value: string): Promise<void> {
    await switchToWebView();

    const target =
      field === 'deviceName'
        ? this.locator.deviceOption(value)
        : field === 'storage'
          ? this.locator.storageOption(value)
          : this.locator.colorOption(value);

    if (await target.isDisplayed().catch(() => false)) {
      await scrollElementToCenter(target).catch(() => undefined);
      await target.waitForClickable({ timeout: 10000 });
      await target.click();
    }
  }

  /**
   * True when getCurrentWebViewPage() resolves to BC (Native context OK).
   * Prefer calling after BC entry (e.g. selectOptions / prepareBcPage).
   */
  async isBcPage(): Promise<boolean> {
    return isCurrentWebViewPage('bc');
  }

  async verifyOptions(): Promise<void> {
    // TODO: Implement selected options verification
  }

  async getSelectedOption(_field: keyof BcProductOptions): Promise<string> {
    // TODO: Implement selected option readback
    return '';
  }

  async verifySku(_sku: string): Promise<void> {
    // TODO: Implement SKU verification
  }

  async getSummaryDetails(part?: string): Promise<string | Record<string, string>> {
    // TODO: Implement summary details readback (e.g. getSummaryDetails('SKU'))
    return part ? '' : {};
  }

  async verifyPrice(_kind: string): Promise<void> {
    // TODO: Implement price verification
  }

  async getSummaryPrice(_kind: string): Promise<string> {
    // TODO: Implement summary price readback
    return '';
  }

  /**
   * 클릭만 한다 — cart 도달 확인은 여기서 안 함.
   * add-on 화면은 URL이 그대로 /buy/라서, 여기서 switchToWindowByPage('cart')를 먼저 불러버리면
   * (아직 add-on 창은 안 잡히고) 이전 실행에서 남아있는 오래된 cart 탭을 잘못 찾아
   * 거기로 전환해버릴 수 있다. cart 도달 확인은 add-on 컨티뉴까지 다 끝난 뒤
   * cartPage.prepareCartPage()에서 한다.
   */
  async clickAddToCart(): Promise<void> {
    await switchToWebView();
    await scrollElementToCenter(this.locator.addToCartButton).catch(() => undefined);

    // Sticky bar buttons are position:fixed — WebdriverIO's native clickability
    // check can time out on them, so click via JS (Katalon does the same here).
    const button = this.locator.addToCartButton;
    await button.waitForExist({ timeout: 15000 });
    await driver.execute('arguments[0].click();', await button);
  }

  async isOptionSectionVisible(_field: keyof BcProductOptions): Promise<boolean> {
    // TODO: Implement option section visibility check
    return false;
  }
}
