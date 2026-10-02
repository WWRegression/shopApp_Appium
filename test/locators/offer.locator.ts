/** Names of the default "all products" category tab per language — Katalon Offers/featuredCategory */
export const ALL_OFFERS_TAB_LABELS = [
  'Featured',
  'All offers',
  'Ausgewählt',
  'Alle Angebote',
  'Présenté',
  'Top Offres',
  'AI',
  'Todas las oferta',
  'Destacados',
  'Favoritos',
  'Todas as campanhas',
  'Doporučené',
  'Kiemelt',
  'Unggulan',
  'In primo piano',
  'Alle deals',
  'Polecane',
  'Oferte',
  'Alla erbjudanden',
  'Öne çıkanlar',
  'Nổi Bật',
  'แนะนำ',
  '推荐',
  '精選優惠',
  'المنتجات المميزة',
  'כרטיסייה',
];

export class OfferLocator {
  /** Katalon Offers/RTBitem — RTB banner currently shown at the top of Offers */
  get rtbItem() {
    return $(`//android.widget.ScrollView//android.view.View[@scrollable = 'true']/android.view.View[@clickable = 'true']`);
  }

  /** Indicators under the RTB banner — one Button per RTB, content-desc = RTB title */
  get rtbIndicators() {
    return $$(`//android.widget.ScrollView//android.view.View[@scrollable = 'true']/../following-sibling::android.widget.Button`);
  }

  /** Katalon Home/errorPage — error / empty page shown when a redirect fails */
  get errorPage() {
    return $(
      `//android.widget.ImageView[
        @content-desc = 'There are no ongoing offers at the moment. Return tomorrow to see what we have in store for you!'
        or @content-desc = 'There are no ongoing offers at the moment'
        or @content-desc = 'Il n’y a pas d’offre en cours'
        or @content-desc = 'No hay ofertas disponibles en este momento'
        or @content-desc = 'Saat ini tidak ada penawaran yang sedang berlangsung'
        or @content-desc = 'Al momento non sono presenti offerte in corso'
      ]
      | //android.widget.TextView[@text = 'Sidan hittades inte…']
      | //android.view.View[@content-desc = 'Tenemos algunos inconvenientes. Puedes intentar nuevamente en unos segundos.']`
    );
  }

  /** Katalon Offers/categoryFilterSection — horizontal row of category tabs (text only, e.g. "All offers", "Smartphones") */
  get categoryTabBar() {
    return $(`//android.widget.HorizontalScrollView`);
  }

  /** Katalon Offers/offerCategoryIcons — category tabs currently in the row; content-desc = "<name>\\nTab N of M" */
  get categoryTabs() {
    return $$(`//android.widget.HorizontalScrollView//android.view.View[@clickable = 'true']`);
  }

  /** Katalon Offers/selectView — category tab by its name */
  categoryTab(name: string) {
    return $(`//android.widget.HorizontalScrollView//android.view.View[@clickable = 'true' and starts-with(@content-desc, '${name}')]`);
  }

  /** Katalon Offers/selectedOfferCategory — the category tab that is selected now */
  get selectedCategoryTab() {
    return $(`//android.widget.HorizontalScrollView//android.view.View[@selected = 'true']`);
  }

  /** Katalon Offers/offerContents — offer shown in the content block below the category tabs */
  get offerContents() {
    return $(`//android.widget.ScrollView/android.view.View[last()]//*[@clickable = 'true']`);
  }

  /** Katalon Offers/tncArea — Terms and Conditions shown when a category has no offer content */
  get tncArea() {
    return $(
      `//android.view.View[
        @content-desc = 'Terms and Conditions' or @content-desc = 'Terms and Condition'
        or @content-desc = 'Termes et conditions' or @content-desc = 'Conditions générales'
        or @content-desc = 'Términos y Condiciones' or @content-desc = 'Términos y condiciones'
        or @content-desc = 'Aktionsbedingungen' or @content-desc = 'Algemene voorwaarden' or @content-desc = 'Actievoorwaarden'
        or @content-desc = 'Pravidla a Podmínky' or @content-desc = 'Podmínky & Pravidla'
        or @content-desc = 'Általános szerződési feltételek' or @content-desc = 'Termeni și condiții' or @content-desc = 'Villkor'
        or @content-desc = 'Warunki i ograniczenia' or @content-desc = 'Notas Legais' or @content-desc = 'Termos e Condições'
        or @content-desc = 'Điều khoản và điều kiện' or @content-desc = 'Kampanya koşulları için buraya tıklayınız'
        or @content-desc = '條款和條件' or @content-desc = '條款及細則' or @content-desc = '条款声明'
        or @content-desc = ' تطبق الشروط والأحكام.*' or @content-desc = 'בכפוף לתנאי השימוש'
      ]`
    );
  }

  /** Katalon Offers/noOngoingOffers — "no ongoing offers" image */
  get noOngoingOffers() {
    return $(
      `//android.widget.ScrollView//android.widget.ImageView[@clickable = 'false' and (
        contains(@content-desc, 'no ongoing offers')
        or contains(@content-desc, 'Il n’y a pas d’offre en cours')
        or contains(@content-desc, 'No hay ofertas disponibles en este momento')
        or contains(@content-desc, 'Saat ini tidak ada penawaran yang sedang')
        or contains(@content-desc, 'Al momento non sono presenti offerte in corso')
        or contains(@content-desc, 'Er zijn momenteel geen lopende aanbiedingen')
        or contains(@content-desc, 'W tej chwili nie ma żadnych aktualnych ofert')
      )]`
    );
  }
}
