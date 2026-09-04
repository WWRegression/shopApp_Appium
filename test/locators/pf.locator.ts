export class PfLocator {
  /**
   * Anchored to the "Total N" header (all-locale), then structurally down to the card views.
   * ImageView fallback covers cases where the Total-header path misses a card.
   */
  get productGrid() {
    return $$(
      `//android.view.View[
        contains(@content-desc, 'Total') or
        contains(@content-desc, 'Totaal') or
        contains(@content-desc, 'Totale') or
        contains(@content-desc, 'Gesamt') or
        contains(@content-desc, 'Razem') or
        contains(@content-desc, 'Totalt') or
        contains(@content-desc, 'Toplam') or
        contains(@content-desc, 'Celkem') or
        contains(@content-desc, 'Összesen') or
        contains(@content-desc, 'Tổng') or
        contains(@content-desc, 'ทั้งหมด') or
        contains(@content-desc, '合计') or
        contains(@content-desc, '总计') or
        contains(@content-desc, '總計') or
        contains(@content-desc, '總共') or
        contains(@content-desc, '合計') or
        contains(@content-desc, 'الإجمالي') or
        contains(@content-desc, 'תוצאות')
      ]/following-sibling::android.view.View[1]
        /android.view.View
        /android.view.View[not(@content-desc) or @content-desc='']
        /android.view.View
        /android.view.View[@content-desc and @content-desc != '']
      |
      //android.widget.ImageView[
        @content-desc and @content-desc != '' and
        not(contains(@content-desc, 'Filter')) and
        not(contains(@content-desc, '篩選')) and
        not(contains(@content-desc, '筛选')) and
        not(contains(@content-desc, '필터')) and
        not(contains(@content-desc, 'フィルター')) and
        not(ancestor::android.widget.ImageView)
      ]`
    );
  }

  /** Product image inside a matched card. */
  cardImage(card: WebdriverIO.Element) {
    return card.$('.//android.widget.ImageView');
  }
}
