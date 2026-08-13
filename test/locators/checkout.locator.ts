export class CheckoutLocator {
  get orderSummary() {
    return $('~YOUR_CHECKOUT_ORDER_SUMMARY_SELECTOR');
  }

  get placeOrderButton() {
    return $('~YOUR_CHECKOUT_PLACE_ORDER_SELECTOR');
  }
}
