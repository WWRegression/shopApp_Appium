import { BasePage } from './base.page';
import { HomeLocator } from '../locators/home.locator';
import { switchToNative } from '../helpers/context.helper';
import { parsePoints } from '../helpers/data.helper';
import { getElementLabel, isDisplayedOrFalse, waitForDisplayedOrFalse } from '../helpers/element.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

export class HomePage extends BasePage {
  private readonly locator = new HomeLocator();

  /** True when the header title matches the Home title texts (BasePage.titleTexts.HOME). */
  async isOnHome(): Promise<boolean> {
    return this.matchesHeaderTitle('HOME');
  }

  /** Katalon Common.navigateToPage("HOME") — waits for the app's first screen, selects Home on BNB, then verifies the Home header title. */
  async prepareHomePage(timeoutMs = 60000): Promise<void> {
    await switchToNative();
    // The CN app sometimes takes over 20s to load; the wait ends as soon as a screen shows
    await this.waitForAppLoaded(timeoutMs);
    await markFailedAndStop(() => this.selectBnbMenu('home'), '[prepareHomePage] Home tab not available on BNB');

    const ready = await driver
      .waitUntil(() => this.isOnHome(), { timeout: 5000, interval: 500 })
      .then(() => true, () => false);
    markFailed([{ label: 'Home not shown (header title does not match)', pass: ready }], 'prepareHomePage');
  }

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
