import { BasePage } from './base.page';
import { HomeLocator } from '../locators/home.locator';

export class HomePage extends BasePage {
  private readonly locator = new HomeLocator();

  async verifyOnboarding(): Promise<void> {
    await this.closePopupIfDisplayed();
    await this.acceptCookieBannerIfShown();
    // TODO: Implement onboarding verification
    await this.locator.onboardingTitle.waitForDisplayed();
  }

  async tapGetStarted(): Promise<void> {
    // TODO: Implement get started action
    await this.locator.getStartedButton.click();
  }

  async verifyBottomNavigation(): Promise<void> {
    // TODO: Verify BNB Home/Shop/Offers/Cart/Account redirection
    await this.clickBnbHome();
  }

  async verifyTermsAndConditions(): Promise<void> {
    // TODO: Verify T&C folded by default and hyperlink redirections
  }

  async getRewardsPoints(): Promise<string> {
    // TODO: Implement Home rewards points retrieval
    return '';
  }
}
