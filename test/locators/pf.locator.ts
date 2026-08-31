export class PfLocator {
  /** Scoped to the scrollable list; matches on the wrapping View since the ImageView's own content-desc can lag during image load. */
  get productGrid() {
    return $$(
      "//android.view.View[@scrollable='true']//android.view.View[@content-desc and .//android.widget.ImageView]"
    );
  }
}
