export class AddOnLocator {
  /**
   * 팝업(confirm-popup)이 떠 있을 때 그 안의 skip 버튼 — 이게 떠 있으면 밑에 깔린
   * continueButton 후보(예: evoucher:continue)는 어두운 오버레이(confirm-popup__dimmed)에
   * 가려져 클릭이 안 된다. 그래서 이 팝업 버튼을 항상 먼저 확인해야 한다.
   */
  get popupSkipButton() {
    return $(
      [
        '.confirm-popup__cta-wrap [an-tr~="skip"][an-la="evoucher:no addition:skip"]',
        '.confirm-popup__cta-wrap [id="skipGoCartAddOn"]',
      ].join(', ')
    );
  }

  get continueButton() {
    return $(
      [
        '[an-la="free gift:continue"]',
        '[an-la="add-on:continue"]',
        '[an-la="evoucher:over evoucher:continue"]',
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
