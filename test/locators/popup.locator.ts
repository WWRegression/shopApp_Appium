export class PopupLocator {
  get closeButton() {
    return $(
      "[an-la*='close' i], button[aria-label*='close' i], .cookie-notice button.close, [class*='Popup'] button[class*='close']"
    );
  }

  get cookieAcceptButton() {
    return $(
      "button[an-la*='cookie' i], #truste-consent-button, button[id*='accept' i], .trustarc-agree-btn"
    );
  }
}
