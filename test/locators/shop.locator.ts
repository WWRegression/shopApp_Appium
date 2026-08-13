export class ShopLocator {
  get categoryList() {
    return $('~YOUR_SHOP_CATEGORY_LIST_SELECTOR');
  }

  get firstProduct() {
    return $('~YOUR_SHOP_FIRST_PRODUCT_SELECTOR');
  }
}
