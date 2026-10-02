export class HomeLocator {
  get onboardingTitle() {
    return $('~YOUR_HOME_ONBOARDING_TITLE_SELECTOR');
  }

  get getStartedButton() {
    return $('~YOUR_HOME_GET_STARTED_SELECTOR');
  }

  /** Katalon Home/rewardsPointsBtn — Rewards points under the greeting, e.g. "0 pts" (English), "10 星钻" (CN) */
  get rewardsPoints() {
    return $(`//android.view.View[contains(@content-desc, ' pts') or contains(@content-desc, '星钻')]`);
  }

  /** Katalon Home/rewardsJoinNowBtn — shown instead of the points when the account has not joined Rewards (English, CN) */
  get rewardsJoinButton() {
    return $(
      `//*[contains(@content-desc, 'Join now') or contains(@content-desc, 'Join Now') or contains(@content-desc, 'Join Samsung Rewards') or contains(@content-desc, '立即加入')]`
    );
  }
}
