/**
 * Buy Configurator (WebView) locators.
 * CSS는 Hybris BC 기준. 앱 변경 시 Inspector로 보정.
 */
export class BcLocator {
  tradeInYesOption() {
    return $(
      [
        '.s-option-trade a[an-la="trade-in:yes" i]',
        '.js-tradein-popup a[an-la="trade-in:yes" i]',
        '.wearable-option.trade-in button[an-la="trade-in:yes" i]',
        '.watch-bc-buyflow.trade-in-option button[an-la="trade-in:yes" i]',
        'input[an-la="trade-in:yes" i] + label',
        '[class*="TradeInOptIn_tradein__select__card"] [role="button"][aria-label*="yes" i]',
      ].join(', ')
    );
  }

  tradeInNoOption() {
    return $(
      [
        '.s-option-trade a[an-la="trade-in:no" i]',
        '.js-tradein-popup a[an-la="trade-in:no" i]',
        'input[an-la="trade-in:no" i] + label',
        '[class*="TradeInOptIn_tradein__select__card"] [role="button"][aria-label*="no" i]',
      ].join(', ')
    );
  }

  get tradeInRemoveButton() {
    return $(
      [
        'button[an-la="trade-in:delete" i]',
        'button[an-la="trade-in:remove" i]',
        'a.s-btn-text[an-la="trade-in:delete" i]',
        '.result-trade-in [an-la="trade-in:delete" i]',
        '.s-cta-delete button[an-la="trade-in:delete"]',
      ].join(', ')
    );
  }

  get tradeInEditButton() {
    return $('button[an-la*="trade-in:edit" i], [an-la*="edit trade-in" i]');
  }

  get tradeInPriceLabel() {
    return $(
      '.s-trade-price, .s-apply-discount, #card-price[class*="TradeInCard_tradein__card__price"] span'
    );
  }

  deviceOption(label: string) {
    return $(
      [
        `.s-option-device :has(> input[data-displayname="${label}" i])`,
        `.s-option-device :has(> input[data-englishname="${label}" i])`,
        `[role="button"][an-la="device:${label}" i]`,
      ].join(', ')
    );
  }

  storageOption(storage: string) {
    const value = storage.replace(/\s+/g, '');
    return $(
      [
        `.s-option-storage :has(> input[data-englishname*="${value}" i])`,
        `.s-option-storage :has(> input[data-displayname*="${value}" i])`,
        `#device_info [role="button"][data-modeldisplay*="${value}" i]`,
      ].join(', ')
    );
  }

  colorOption(color: string) {
    return $(
      [
        `.s-option-color-special :has(> input[data-englishname="${color}" i])`,
        `.hubble-pd-radio:has([data-englishname="${color}" i])`,
        `div[id="#color_container"] [an-la="color:${color}" i]`,
        `[an-la="color:${color}" i]`,
      ].join(', ')
    );
  }

  get addToCartButton() {
    return $(
      [
        '[an-la="top sticky bar:add to cart"].price-bar-confirm-btn',
        '.wearable-bc-calculator__price-cta button[an-la="sticky bar:continue"]',
        '[an-la="top sticky bar:buy now"].price-bar-cart-btn',
        'div.hubble-price-bar__price-cta .price-bar-cart-btn',
        '[an-la*="sticky bar" i][an-la*="cart" i]',
      ].join(', ')
    );
  }

  get continueSplashButton() {
    return $(
      [
        '[an-la="free gift:continue"]',
        '[an-la="add-on:continue"]',
        '[an-la="add-on:go to cart"]',
        '[an-la="evoucher:go to cart"]',
        '#giftContinue',
        '#skipGoCartAddOn',
      ].join(', ')
    );
  }

  // legacy aliases used by older service stubs
  get tradeInAddButton() {
    return this.tradeInYesOption();
  }

  get tradeInNoButton() {
    return this.tradeInNoOption();
  }

  get tradeInAppliedLabel() {
    return this.tradeInRemoveButton;
  }

  get scPlusAddButton() {
    return $('[an-la*="care+" i], [an-la*="samsung care" i]');
  }

  get scPlusNoButton() {
    return $('[an-la*="care+" i][an-la*="no" i], [an-la*="none" i]');
  }

  get eupAddButton() {
    return $('[an-la*="eup" i][an-la*="yes" i], [an-la*="upgrade" i]');
  }

  get eupNoButton() {
    return $('[an-la*="eup" i][an-la*="no" i]');
  }

  get simAddButton() {
    return $('[an-la*="sim" i][an-la*="yes" i], [an-la*="add sim" i]');
  }

  get simNoButton() {
    return $('[an-la*="sim" i][an-la*="no" i]');
  }
}
