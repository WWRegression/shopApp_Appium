export type HeaderIcon = 'search' | 'back' | 'chat';

/**
 * Native app header.
 * content-desc varies by locale, so keep a small set of representative labels.
 * Extend per-site if needed.
 */
export class HeaderLocator {
  get title() {
    return $(
        `//android.widget.Button[@content-desc = 'Back']
        /following-sibling::android.view.View
        |
        //android.widget.FrameLayout[1]
        //android.view.View[1]
        //android.view.View[1]
        //android.view.View[1]
        //android.view.View[1]
        //android.view.View[1][@content-desc
          and ( ../android.widget.Button or ../android.widget.ImageView)
        ]`
    );
  }

  get searchButton() {
    return $(
      `//android.widget.Button[
      contains(@content-desc, 'Search')
      or contains(@content-desc, 'بحث')
      or contains(@content-desc, 'Suche')
      or contains(@content-desc, 'Zoeken')
      or contains(@content-desc, 'Chercher')
      or contains(@content-desc, 'Buscar')
      or contains(@content-desc, '搜索')
      or contains(@content-desc, 'Hledat')
      or (contains(@content-desc, 'Búsqueda') and not(contains(@content-desc, 'por voz')))
      or contains(@content-desc, 'Rechercher')
      or (contains(@content-desc, '搜尋') and not(contains(@content-desc, '語音')))
      or contains(@content-desc, 'Keresés')
      or contains(@content-desc, 'Cari')
      or contains(@content-desc, 'Cerca')
      or contains(@content-desc, 'Szukaj')
      or contains(@content-desc, 'Pesquisar')
      or (contains(@content-desc, 'Căutare') and not(contains(@content-desc, 'vocală')))
      or contains(@content-desc, 'ค้นหา')
      or contains(@content-desc, 'Ara')
      or contains(@content-desc, 'Sök')
      or contains(@content-desc, 'Tìm kiếm')
     ]`
    );
  }

  get backButton() {
    return $(
      `//android.widget.Button[
        contains(@content-desc, 'Back')
        or contains(@content-desc, 'رجوع')
        or contains(@content-desc, 'Zurück')
        or contains(@content-desc, 'Terug')
        or contains(@content-desc, 'Retour')
        or contains(@content-desc, 'Arrière')
        or contains(@content-desc, 'Atrás')
        or contains(@content-desc, '返回')
        or contains(@content-desc, 'Retroceder')
        or contains(@content-desc, 'Zpět')
        or contains(@content-desc, '上一頁')
        or contains(@content-desc, 'Vissza')
        or contains(@content-desc, 'Kembali')
        or contains(@content-desc, 'Indietro')
        or contains(@content-desc, 'Wstecz')
        or contains(@content-desc, 'Voltar')
        or contains(@content-desc, 'Înapoi')
        or contains(@content-desc, 'กลับ')
        or contains(@content-desc, 'Geri')
        or contains(@content-desc, 'Tillbaka')
        or contains(@content-desc, 'Quay lại')
      ]
      |
      //android.widget.FrameLayout[1]/android.view.View[1]/android.view.View[1]/android.view.View[1]/android.view.View[1]/android.widget.Button[1]`
    );
  }

  get chatButton() {
    return $(
      `//android.widget.Button[
        contains(@content-desc, 'Chat')
        or contains(@content-desc, 'محادثة مع الدعم')
        or contains(@content-desc, 'Chatten')
        or contains(@content-desc, 'Clavarder')
        or contains(@content-desc, '客服')
        or contains(@content-desc, '實時對話')
        or contains(@content-desc, 'Obrolan')
        or contains(@content-desc, 'แชท')
        or contains(@content-desc, 'Canlı destek')
        or contains(@content-desc, '聊天')
        or contains(@content-desc, 'Chatta')
        or contains(@content-desc, 'Trò chuyện')
      ]
      |
      (
        (
          //android.widget.Button[@content-desc = 'Back']
          /following-sibling::android.view.View
          |
          //android.widget.FrameLayout[1]
          /android.view.View[1]
          /android.view.View[1]
          /android.view.View[1]
          /android.view.View[1]
          /android.view.View[@content-desc and (
            ../android.widget.Button
            or ../android.widget.ImageView
          )]
        )
        /../following-sibling::android.widget.Button
      )`
    );
  }

  icon(icon: HeaderIcon) {
    switch (icon) {
      case 'search':
        return this.searchButton;
      case 'back':
        return this.backButton;
      case 'chat':
        return this.chatButton;
    }
  }
}
