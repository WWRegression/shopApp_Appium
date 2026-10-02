import { BasePage } from './base.page';
import { HomeLocator } from '../locators/home.locator';
import { switchToNative } from '../helpers/context.helper';
import { parsePoints } from '../helpers/data.helper';
import { getElementLabel, isDisplayedOrFalse, waitForDisplayedOrFalse } from '../helpers/element.helper';
import { markFailed } from '../helpers/report.helper';

export class HomePage extends BasePage {
  private readonly locator = new HomeLocator();

  async verifyOnboarding(): Promise<void> {
    await this.dismissOverlays();
    // TODO: Implement onboarding verification
    await this.locator.onboardingTitle.waitForDisplayed();
  }

  async tapGetStarted(): Promise<void> {
    // TODO: Implement get started action
    await this.locator.getStartedButton.click();
  }

  async verifyBottomNavigation(): Promise<void> {
    // TODO: Verify BNB Home/Shop/Offers/Cart/Account redirection
    await this.selectBnbMenu('home');
  }

  async verifyTermsAndConditions(): Promise<void> {
    // TODO: Verify T&C folded by default and hyperlink redirections
  }

  /** Katalon Reward.getPointsHomePage — Rewards points shown on Home; fails when the account has not joined Rewards. */
  async getRewardsPoints(): Promise<number> {
    await switchToNative();
    // The points badge shows up a few seconds after Home itself
    if (!(await waitForDisplayedOrFalse(this.locator.rewardsPoints, { timeout: 10000 }))) {
      const notJoined = await isDisplayedOrFalse(this.locator.rewardsJoinButton);
      const reason = notJoined ? 'Samsung Rewards is not joined (Join button shown on Home)' : 'Rewards points not found on Home';
      markFailed([{ label: reason, pass: false }], 'getRewardsPoints');
    }
    const points = parsePoints(await getElementLabel(this.locator.rewardsPoints));
    console.log(`[getRewardsPoints] Home points=${points}`);
    return points;
  }
}
