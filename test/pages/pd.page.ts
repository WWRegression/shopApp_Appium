import { BasePage } from './base.page';
import { PdLocator } from '../locators/pd.locator';
import { PdTradeInService } from '../services/tradein/pd-tradein.service';
import { PdScPlusService } from '../services/scplus/pd-scplus.service';
import { PdEupService } from '../services/eup/pd-eup.service';
import { PdSimService } from '../services/sim/pd-sim.service';
import { switchToWebView, switchToWindowByPage } from '../helpers/context.helper';

export class PdPage extends BasePage {
  private readonly locator = new PdLocator();

  readonly tradeIn = new PdTradeInService();
  readonly scPlus = new PdScPlusService();
  readonly eup = new PdEupService();
  readonly sim = new PdSimService();

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
}