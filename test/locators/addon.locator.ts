export class AddOnLocator {
  get continueButton() {
    return $(
      [
        '[an-la="free gift:continue"]',
        '[an-la="add-on:continue"]',
        '[an-la="evoucher:over evoucher:continue"]',
        '.confirm-popup__cta-wrap [an-tr~="skip"][an-la="evoucher:no addition:skip"]',
        '.confirm-popup__cta-wrap [id="skipGoCartAddOn"]',
        '[an-la="evoucher:continue"]:nth-child(2)',
        '[an-la="add-on:go to cart"]',
        '[id="giftContinue"]',
        '[an-la="evoucher:go to cart"]',
        '[an-la="evoucher:below evoucher:continue"]',
        '[class*="AddOn_footerButton"][an-la*="evoucher:continue"]',
        '.hubble-addon-page__sticky [an-la*="evoucher:continue"]',
      ].join(', ')
    );
  }
}
