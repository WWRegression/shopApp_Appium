import { BasePage } from './base.page';
import { MypageWishlistLocator } from '../locators/mypage-wishlist.locator';
import { MypagePage } from './mypage.page';
import { prepareWebViewPage, switchToNative } from '../helpers/context.helper';
import { clickIfDisplayed, isDisplayedOrFalse, jsClick, waitForDisplayedOrFalse } from '../helpers/element.helper';
import { markFailed, markFailedAndStop } from '../helpers/report.helper';

/** My Page > Wishlist. Ported from the wishlist part of Katalon's Shop.groovy. */
export class MypageWishlistPage extends BasePage {
  private readonly locator = new MypageWishlistLocator();
  private readonly mypagePage = new MypagePage();

  /** Katalon Shop.moveToWishList — My Page > Wishlist, then waits for the WebView to render. */
  async prepareWishlistPage(): Promise<void> {
    await this.mypagePage.prepareMypage();
    await this.mypagePage.selectDashboardMenu('wishlist');

    const ready = await prepareWebViewPage('mypageWishlist', this.locator.pageContainer);
    markFailed([{ label: 'wishlist page reached', pass: ready }], 'prepareWishlistPage');
  }

  /** Katalon Shop.removeWishList — removes cards until the empty state shows. */
  async clearWishlist(maxRemovals = 20): Promise<void> {
    await this.prepareWishlistPage();

    for (let removed = 0; removed < maxRemovals; removed += 1) {
      // Doubles as the pacing between removals: each click re-renders the list
      if (await waitForDisplayedOrFalse(this.locator.emptySection, { timeout: 1000 })) {
        break;
      }
      if (!(await isDisplayedOrFalse(this.locator.removeButton))) {
        break;
      }
      await jsClick(this.locator.removeButton).catch(() => undefined);
      console.log(`[clearWishlist] removed ${removed + 1} product(s)`);
    }

    const empty = await isDisplayedOrFalse(this.locator.emptySection);
    console.log(`[clearWishlist] wishlist empty=${empty}`);
    markFailed([{ label: 'wishlist could not be emptied', pass: empty }], 'clearWishlist');
    await switchToNative();
  }

  /** Katalon Shop.isExistProductWishList — the SKU added from PF must be listed. */
  async verifyAddedToWishlist(sku: string): Promise<void> {
    await this.prepareWishlistPage();
    const found = await waitForDisplayedOrFalse(this.locator.productCard(sku), { timeout: 10000 });
    console.log(`[verifyAddedToWishlist] expected=${sku} actual=${found ? sku : 'not listed'} result=${found ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'product was not added to the wishlist', pass: found, detail: `sku=${sku}` }], 'verifyAddedToWishlist');
  }

  /** Katalon Shop/addToCartInWishPage — "Add to cart" on the card of this SKU, then Skip/OK if a popup follows. Caller is already on the wishlist. */
  async clickAddToCart(sku: string): Promise<void> {
    const addToCart = this.locator.addToCartButton(sku);
    await markFailedAndStop(async () => {
      await addToCart.waitForDisplayed({ timeout: 10000 });
      await jsClick(addToCart);
    }, `[clickAddToCart] Add to cart not found for ${sku}`);

    // Katalon Shop/continueBtnInWishPage — free gift Skip, then the OK that can follow it
    if (await clickIfDisplayed(this.locator.continueButton, 10000)) {
      await clickIfDisplayed(this.locator.continueButton, 3000);
    }
  }

  /** Katalon Shop.removeWishList — opens the wishlist and taps remove on the card of this SKU. */
  async clickRemoveFromWishlist(sku: string): Promise<void> {
    await this.prepareWishlistPage();
    const removeButton = this.locator.productRemoveButton(sku);
    await markFailedAndStop(async () => {
      await removeButton.waitForDisplayed({ timeout: 10000 });
      await jsClick(removeButton);
    }, `[clickRemoveFromWishlist] remove button not found for ${sku}`);
  }

  /** The removed SKU's card must be gone from the wishlist. */
  async verifyRemovedFromWishlist(sku: string): Promise<void> {
    const removed = await this.locator
      .productCard(sku)
      .waitForDisplayed({ timeout: 10000, reverse: true })
      .then(() => true, () => false);
    console.log(`[verifyRemovedFromWishlist] expected=${sku} removed actual=${removed ? 'removed' : 'still listed'} result=${removed ? 'PASS' : 'FAIL'}`);
    markFailed([{ label: 'product was not removed from the wishlist', pass: removed, detail: `sku=${sku}` }], 'verifyRemovedFromWishlist');
    await switchToNative();
  }
}
