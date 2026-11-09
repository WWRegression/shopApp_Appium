import { BasePage } from './base.page';
import { OnboardingLocator } from '../locators/onboarding.locator';
import { switchToNative } from '../helpers/context.helper';
import { getSiteData } from '../../config/site';
import {
  clickElement,
  clickIfDisplayed,
  isDisplayedOrFalse,
  scrollUntilVisible,
  waitForDisplayedOrFalse,
} from '../helpers/element.helper';
import { flingToStart } from '../helpers/gesture.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

/** First-launch flow: permissions, country, TrustArc, T&C, notification, Get Started. */
export class OnboardingPage extends BasePage {
  private readonly locator = new OnboardingLocator();

  /** Set by selectNotification when the choice was made on the Android permission popup (IN) — there is no Get Started screen then. */
  private notificationOnPermissionPopup = false;

  /** On the country list (first launch, Shop > Country, or Settings), selects `countryName` and confirms. */
  async selectCountry(countryName?: string): Promise<void> {
    // Single-country apps (no countryName in site data) have no country list
    if (!countryName) {
      console.log('[selectCountry] no countryName for this site — skipped');
      return;
    }
    await switchToNative();
    const item = this.locator.countryListItem(countryName);
    await waitForDisplayedOrFalse(this.locator.countryContinueButton, { timeout: 10000 });

    let found = await scrollUntilVisible(item, 15);
    if (!found) {
      // The list can open scrolled past the target
      await flingToStart();
      found = await scrollUntilVisible(item, 15);
    }
    markFailedAndStop([{ label: 'target country not found in the list', pass: found, detail: countryName }], 'selectCountry');

    await clickElement(item, { timeout: 5000 });
    await clickElement(this.locator.countryContinueButton, { timeout: 8000 });
    console.log(`[selectCountry] selected "${countryName}"`);
  }

  /** Allows location ("While using the app") when the permission popup shows. */
  async allowLocationPermissionIfShown(timeoutMs = 10000): Promise<void> {
    await switchToNative();
    const allowed = await clickIfDisplayed(this.popupLocator.locationAllowButton, timeoutMs);
    console.log(`[allowLocationPermissionIfShown] ${allowed ? 'location permission allowed' : 'no location permission popup'}`);
  }

  /** Clicks Cancel on the Adobe Assurance PIN screen when it is shown; true when it was closed. */
  async clickAssuranceCancelIfShown(timeoutMs = 3000): Promise<boolean> {
    await switchToNative();
    let closed = 0;
    // The app opens the Assurance screen twice in a row, so a second one can be left after the first Cancel
    while (closed < 2 && (await clickIfDisplayed(this.popupLocator.assuranceCancelButton, closed === 0 ? timeoutMs : 1000))) {
      closed += 1;
      console.log('[clickAssuranceCancelIfShown] clicked Cancel');
    }
    return closed > 0;
  }

  /** Selects Accept all (registered user) or Decline all (guest user) on the TrustArc consent. */
  async selectTrustArcCookie(choice: 'accept' | 'decline'): Promise<void> {
    // Only the sites marked in site data (initialSetup.trustArcCookie) show the consent
    if (!getSiteData().initialSetup?.trustArcCookie) {
      console.log('[selectTrustArcCookie] TrustArc cookie is not required for this site — skipped');
      return;
    }
    await switchToNative();
    // The consent WebView opens a moment after the country is confirmed
    await waitForDisplayedOrFalse(this.locator.trustArcWebView, { timeout: 3000 });
    const button = choice === 'accept' ? this.locator.trustArcAcceptButton : this.locator.trustArcDeclineButton;
    const shown = await waitForDisplayedOrFalse(button, { timeout: 30000 });
    console.log(`[selectTrustArcCookie] expected=TrustArc cookie shown actual=${shown ? 'shown' : 'not shown'} result=${shown ? 'PASS' : 'FAIL'}`);
    // The next step stops the TC if the consent is still in the way
    markFailed([{ label: 'TrustArc cookie not found on site', pass: shown }], 'selectTrustArcCookie');
    if (!shown) {
      return;
    }
    await clickElement(button, { timeout: 5000 });
    console.log(`[selectTrustArcCookie] selected "${choice} all"`);
  }

  /** Selects the TrustArc consent when it shows again after the build setup restart (e.g. AT, BE, CA, CZ, HU, PT, RO, TR). */
  async selectTrustArcCookieIfShown(choice: 'accept' | 'decline'): Promise<void> {
    if (!getSiteData().initialSetup?.trustArcCookie) {
      return;
    }
    await switchToNative();
    const button = choice === 'accept' ? this.locator.trustArcAcceptButton : this.locator.trustArcDeclineButton;
    const selected = await clickIfDisplayed(button, 10000);
    console.log(`[selectTrustArcCookieIfShown] ${selected ? `selected "${choice} all"` : 'TrustArc cookie not shown — skipped'}`);
  }

  /** Agrees to Privacy Policy and Terms and Conditions of Sale when the screen has a checkbox (CN: then "同意"). */
  async agreeToPrivacyAndTerms(): Promise<void> {
    await switchToNative();
    const checkbox = this.locator.tncCheckbox;
    // The checkbox, where there is one, comes before the notification options
    await driver
      .waitUntil(async () => (await isDisplayedOrFalse(checkbox)) || (await this.isNotificationOptionShown()), { timeout: 10000, interval: 500 })
      .catch(() => undefined);
    if (!(await clickIfDisplayed(checkbox))) {
      console.log('[agreeToPrivacyAndTerms] no T&C checkbox on this screen');
      return;
    }
    const agreed = await clickIfDisplayed(this.locator.tncAgreeButton, 3000);
    console.log(`[agreeToPrivacyAndTerms] checkbox clicked${agreed ? ', agree clicked' : ''}`);
  }

  /** True when the notification choice is on screen: the in-app Yes/No options, or the Android permission popup (IN). */
  private async isNotificationOptionShown(): Promise<boolean> {
    return (await isDisplayedOrFalse(this.locator.notificationRadio('no'))) || (await isDisplayedOrFalse(this.popupLocator.notificationDenyButton));
  }

  /** Selects "Yes" or "No" for notifications (IN: Allow / Don't allow on the Android permission popup). */
  async selectNotification(option: 'yes' | 'no'): Promise<void> {
    await switchToNative();
    const radio = this.locator.notificationRadio(option);
    const permissionButton = option === 'yes' ? this.popupLocator.notificationAllowButton : this.popupLocator.notificationDenyButton;
    await driver
      .waitUntil(async () => this.isNotificationOptionShown(), { timeout: 20000, interval: 500 })
      .catch(() => undefined);
    this.notificationOnPermissionPopup = await isDisplayedOrFalse(permissionButton);
    const target = this.notificationOnPermissionPopup ? permissionButton : radio;
    // Longer screens (e.g. AU, SA_EN) keep the options below the fold
    const shown = this.notificationOnPermissionPopup || (await isDisplayedOrFalse(radio)) || (await scrollUntilVisible(radio, 3));
    markFailedAndStop([{ label: `notification "${option}" option not found`, pass: shown }], 'selectNotification');
    await clickElement(target, { timeout: 5000 });
    console.log(`[selectNotification] selected "${option}"`);
  }

  /** "Get Started" closes the initial setup. */
  async clickGetStarted(): Promise<void> {
    if (this.notificationOnPermissionPopup) {
      console.log('[clickGetStarted] notification was answered on the permission popup, no Get Started screen — skipped');
      return;
    }
    await switchToNative();
    const button = this.locator.getStartedButton;
    await scrollUntilVisible(button, 3);
    await markFailedAndStop(() => clickElement(button, { timeout: 5000 }), '[clickGetStarted] Get Started button not found');
    console.log('[clickGetStarted] clicked');
  }

  /** After "Yes", Android asks for the notification permission; allows it. */
  async allowNotificationPermissionIfShown(): Promise<void> {
    await switchToNative();
    const allowed = await clickIfDisplayed(this.popupLocator.notificationAllowButton, 5000);
    console.log(`[allowNotificationPermissionIfShown] ${allowed ? 'notification permission allowed' : 'no notification permission popup'}`);
  }
}
