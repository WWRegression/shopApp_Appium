export class HomeLocator {
  /** "Yes" under "Enable Webview Debugging" on the setup screen (Universal Build Config) */
  get setupWebviewYesOption() {
    return $(
      `//android.view.View[@content-desc = 'Enable Webview Debugging']/following-sibling::android.view.View[@content-desc = 'Yes'][1]`
    );
  }

  get setupMobileBackendP1Option() {
    return $(
      `//android.view.View[@content-desc = 'Mobile Backend']/following-sibling::android.view.View[@content-desc = 'P1'][1]`
    );
  }

  get setupHybrisP1Option() {
    return $(
      `//android.view.View[@content-desc = 'Hybris']/following-sibling::android.view.View[@content-desc = 'P1'][1]`
    );
  }

  get setupAEMP1Option() {
    return $(
      `//android.view.View[@content-desc = 'AEM']/following-sibling::android.view.View[@content-desc = 'prod'][1]`
    );
  }

  /** "Apply" at the bottom of the setup screen */
  get setupApplyButton() {
    return $(`//android.widget.Button[@content-desc = 'Apply' 
      or @content-desc = 'تطبيق'
      or @content-desc = 'Anwenden'
      or @content-desc = 'Toepassen'
      or @content-desc = 'Appliquer'
      or @content-desc = 'Aplicar'
      or @content-desc = 'Použít'
      or @content-desc = '確認'
      or @content-desc = 'Alkalmazás'
      or @content-desc = 'Tetapkan'
      or @content-desc = 'החל'
      or @content-desc = '適用する'
      or @content-desc = 'Zastosuj'
      or @content-desc = 'Aplică'
      or @content-desc = 'ใช้'
      or @content-desc = 'Uygula'
      or @content-desc = '送出'
      or @content-desc = 'Áp dụng'
      or @content-desc = 'Tillämpa'
      ]`);
  }

  /** Home footer Terms and Conditions row. Its content-desc starts with the label, clickable. */
  get tncSection() {
    const label = [
      'Terms & Conditions',
      'T&C',
      'Terms and Condition',
      'Conditions générales',
      'Mentions légales',
      'Términos y Condiciones',
      'Términos y condiciones',
      'Terminos y condiciones',
      'Termos e Condições',
      'Aktionsbedingungen',
      'Általános Szerződési Feltételek',
      'Villkor',
      '條款及細則',
      '條款與條件',
      '条款声明',
      'Warunki i ograniczenia',
      'תנאים והגבלות',
      'الشروط والأحكام',
      'Syarat dan ketentuan',
      'Termini e Condizioni',
      '利用規約',
      'Şart ve Koşullar',
    ]
      .map((text) => `starts-with(@content-desc, '${text}')`)
      .join(' or ');
    return $(`//android.view.View[@clickable='true' and (${label})]`);
  }

  /** Content of the opened T&C; two levels down, as a scoped XPath starts at the row itself. */
  get tncContent() {
    return this.tncSection.$('./*/*');
  }

  /** Native PDF viewer title after a T&C link opens a PDF. */
  get pdfTitle() {
    return $(`//android.view.View[contains(@content-desc, '.pdf')]`);
  }

  /** Rewards points under the greeting, e.g. "0 pts" (English), "10 星钻" (CN) */
  get rewardsPoints() {
    return $(`//android.view.View[contains(@content-desc, ' pts') 
      or contains(@content-desc, '星钻')
      or contains(@content-desc, 'b.')
      or contains(@content-desc, 'Pkt.')
      or contains(@content-desc, '分')
      or contains(@content-desc, 'pont')
      or contains(@content-desc, 'ポイント')
      or contains(@content-desc, 'puncte')
      or contains(@content-desc, 'poäng')
      ]`
    );
  }

  /** Shown instead of the points when the account has not joined Rewards (English, CN) */
  get rewardsJoinButton() {
    return $(
      `//*[contains(@content-desc, 'Join now') 
      or contains(@content-desc, 'Join Now') 
      or contains(@content-desc, 'Join Samsung Rewards') 
      or contains(@content-desc, '立即加入')
      or contains(@content-desc, 'Samsungリワードに参加')
      ]`
    );
  }

  get chatFabButton() {
    return $(`//android.widget.Button[@content-desc = 'Open chat']`);
  }

  get mainKv() {
    return $(
      `(//android.widget.ScrollView//android.view.View[@clickable = 'true' and (preceding-sibling::android.widget.ImageView or following-sibling::android.widget.ImageView)]
      | //android.widget.ScrollView/android.view.View[1]//android.view.View[android.view.View]//*[self::android.widget.ImageView or self::android.view.View][@clickable = 'true'])[1]`
    );
  }
}
