/** Names of the default "all products" category tab per language */
export const ALL_OFFERS_TAB_LABELS = [
  'Featured',
  'All offers',
  'Ausgewählt',
  'Alle Angebote',
  'AI',
  'Todas las oferta',
  'Destacados',
  'Favoritos',
  'Todas as campanhas',
  'Doporučené',
  'Kiemelt',
  'In primo piano',
  'Alle deals',
  'Polecane',
  'Oferte',
  'Alla erbjudanden',
  'Nổi Bật',
  '推荐',
  '精選優惠',
  'All categories',
];

export class OfferLocator {
  /** RTB banner currently shown at the top of Offers */
  get rtbItem() {
    return $(
      `(//android.widget.ScrollView//android.view.View[@scrollable = 'true']/android.view.View[@clickable = 'true']
      | //android.widget.ScrollView/android.view.View[@clickable = 'true' and @content-desc != ''])[1]`
    );
  }

  /** Indicators under the RTB banner — one Button per RTB, content-desc = RTB title */
  get rtbIndicators() {
    return $$(`//android.widget.ScrollView//android.view.View[@scrollable = 'true']/../following-sibling::android.widget.Button`);
  }

  /** Error / empty page shown when a redirect fails */
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

  /** Row of category tabs: a HorizontalScrollView, or a plain row when the tabs fit the screen (3 tabs, SG) — found by its first "all products" tab */
  get categoryTabBar() {
    const firstTab = ALL_OFFERS_TAB_LABELS.map((label) => `starts-with(@content-desc, '${label}')`).join(' or ');
    return $(
      `(//android.widget.HorizontalScrollView
      | //android.view.View[android.view.View[@clickable = 'true' and contains(@content-desc, '\n') and (${firstTab})]])[1]`
    );
  }

  /** Category tabs currently in the row; content-desc = "<name>\\nTab N of M" */
  get categoryTabs() {
    return this.categoryTabBar.$$(`.//android.view.View[@clickable = 'true']`);
  }

  /** Category tab by its name */
  categoryTab(name: string) {
    return this.categoryTabBar.$(`.//android.view.View[@clickable = 'true' and starts-with(@content-desc, '${name}')]`);
  }

  /** The category tab that is selected now */
  get selectedCategoryTab() {
    return this.categoryTabBar.$(`.//android.view.View[@selected = 'true']`);
  }

  /** Offer shown in the content block below the category tabs */
  get offerContents() {
    return $(`//android.widget.ScrollView/android.view.View[last()]//*[@clickable = 'true']`);
  }

  /** T&C at the bottom of Offers; when opened, header and content are one view whose content-desc starts with the header */
  get tncSection() {
    return $(
      `//android.view.View[
        starts-with(@content-desc, 'Terms and Conditions') or starts-with(@content-desc, 'Terms and Condition')
        or starts-with(@content-desc, 'Termes et conditions') or starts-with(@content-desc, 'Conditions générales')
        or starts-with(@content-desc, 'Términos y Condiciones') or starts-with(@content-desc, 'Términos y condiciones')
        or starts-with(@content-desc, 'Aktionsbedingungen') or starts-with(@content-desc, 'Algemene voorwaarden') or starts-with(@content-desc, 'Actievoorwaarden')
        or starts-with(@content-desc, 'Pravidla a Podmínky') or starts-with(@content-desc, 'Podmínky & Pravidla')
        or starts-with(@content-desc, 'Általános szerződési feltételek') or starts-with(@content-desc, 'Termeni și condiții') or starts-with(@content-desc, 'Villkor')
        or starts-with(@content-desc, 'Warunki i ograniczenia') or starts-with(@content-desc, 'Notas Legais') or starts-with(@content-desc, 'Termos e Condições')
        or starts-with(@content-desc, 'Điều khoản và điều kiện') or starts-with(@content-desc, 'Kampanya koşulları için buraya tıklayınız')
        or starts-with(@content-desc, '條款和條件') or starts-with(@content-desc, '條款及細則') or starts-with(@content-desc, '条款声明') or starts-with(@content-desc, '商城公告')
        or starts-with(@content-desc, ' تطبق الشروط والأحكام') or starts-with(@content-desc, 'בכפוף לתנאי השימוש') or starts-with(@content-desc, 'Termini e Condizioni')
      ]`
    );
  }

  /** First content node under the T&C header; exists only while the T&C is open */
  get tncContent() {
    return this.tncSection.$('./*');
  }

  /** "no ongoing offers" image */
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
