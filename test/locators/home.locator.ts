export class HomeLocator {
  /** Country list row. Full label, including the parenthesis, e.g. "Chile (Español)". */
  countryListItem(countryName: string) {
    const name = countryName.replace(/'/g, '');
    return $(`//android.widget.RadioButton[contains(@content-desc, '${name}')]`);
  }

  /** Confirm on the country list. */
  get countryContinueButton() {
    return $(
      `//android.widget.Button[
        @content-desc = 'Continue' or
        @content-desc = 'Ok' or
        @content-desc = 'OK' or
        @content-desc = 'ACEPTAR' or
        @content-desc = 'Weiter' or
        @content-desc = 'Continuar' or
        @content-desc = 'Siguiente' or
        @content-desc = 'Next' or
        @content-desc = 'Következő' or
        @content-desc = 'موافق' or
        @content-desc = '繼續' or
        @content-desc = ' אישור' or
        @content-desc = 'はい' or
        @content-desc = 'ตกลง' or
        @content-desc = '確認' or
        @content-desc = 'Onayla'
      ]`
    );
  }

  /** TrustArc consent screen (TrustArcConsentActivity) — WebView that holds the consent buttons */
  get trustArcWebView() {
    return $(`//android.webkit.WebView[contains(@resource-id, 'truste_web_view')]`);
  }

  /** TrustArc consent "Accept all" */
  get trustArcAcceptButton() {
    return $(
      `//android.widget.Button[
        (
          contains(@text, 'Accept') or
          contains(@text, 'Accepter') or
          contains(@text, 'Aceptar') or
          contains(@text, 'Accetta') or
          contains(@text, 'Alle akzeptieren') or
          contains(@text, 'aanvaarden') or
          contains(@text, 'Zatwierdź') or
          contains(@text, 'Přijmout') or
          contains(@text, 'elfogadása') or
          contains(@text, 'De acord cu') or
          contains(@text, 'Aceitar') or
          contains(@text, 'accepter') or
          contains(@text, 'Godkänn alla') or
          contains(@text, 'Çerezleri kabul et')
        )
        and not(contains(@text, 'Fortsätt utan att acceptera'))
      ]`
    );
  }

  /** TrustArc consent "Decline all" */
  get trustArcDeclineButton() {
    return $(
      `//android.widget.Button[
        contains(@text, 'Refuser tout') or
        contains(@text, 'Fortfahren ohne zu akzeptieren') or
        contains(@text, 'Odmítnout vše') or
        contains(@text, 'Rechazar todas') or
        contains(@text, 'Tout refuser') or
        contains(@text, 'Összes elutasítása') or
        contains(@text, 'Rifiuta tutto') or
        contains(@text, 'Alles afwijzen') or
        contains(@text, 'Odrzuć wszystkie') or
        contains(@text, 'Respinge Toate') or
        contains(@text, 'Tümünü reddet') or
        contains(@text, 'Decline All') or
        contains(@text, 'Fortsätt utan att acceptera') or
        contains(@text, 'Alles weigeren') or
        contains(@text, 'Recusar') or
        contains(@text, 'Zorunlu çerezleri kabul et') or
        contains(@text, 'Decline all')
      ]`
    );
  }

  /** First-launch Terms and Conditions checkbox */
  get tncCheckbox() {
    return $(`//android.widget.CheckBox[@resource-id = '']`);
  }

  /** CN agreement popup "同意" */
  get tncAgreeButton() {
    return $(`//android.widget.Button[@content-desc = '同意']`);
  }

  /** "Yes" is the first radio on the notification screen, "No" the second */
  notificationRadio(option: 'yes' | 'no') {
    return $(`(//android.view.View[@clickable = 'true']/android.widget.RadioButton)[${option === 'yes' ? 1 : 2}]`);
  }

  /** Disabled until a notification option is selected */
  get getStartedButton() {
    return $(
      `//android.widget.Button[
        @content-desc = 'Get Started' or
        @content-desc = 'Get started' or
        @content-desc = 'Avanti' or
        @content-desc = 'ابدأ الآن' or
        @content-desc = 'Débutez' or
        @content-desc = 'Jetzt starten' or
        @content-desc = 'Comenzar' or
        @content-desc = 'Commencer' or
        @content-desc = 'Empecemos' or
        @content-desc = 'Mulai' or
        @content-desc = 'Bắt đầu' or
        @content-desc = '开始使用' or
        @content-desc = 'Aan de slag' or
        @content-desc = 'Rozpocznij' or
        @content-desc = 'Kom igång' or
        @content-desc = 'เริ่มเลย' or
        @content-desc = 'ابدأ' or
        @content-desc = '開始' or
        @content-desc = "Los geht's" or
        @content-desc = 'Začít' or
        @content-desc = 'Kezdés' or
        @content-desc = 'Începe' or
        @content-desc = ' בואו נתחיל' or
        @content-desc = 'はじめる' or
        @content-desc = 'Começar' or
        @content-desc = 'Başlayın'
      ]`
    );
  }

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

  /** Home footer Terms and Conditions row. Exact content-desc, clickable. */
  get tncButton() {
    const label = [
      'Terms and Conditions',
      'Terms & Conditions',
      'Terms & Conditions:',
      'T&C',
      'Terms and Condition',
      'Termes et conditions',
      'Conditions générales',
      'Mentions légales',
      'Términos y Condiciones',
      'Términos y condiciones',
      'Terminos y condiciones',
      'Termos e Condições',
      'Pravidla a Podmínky',
      'Podmínky & pravidla',
      'Aktionsbedingungen',
      'Algemene voorwaarden',
      'Általános szerződési feltételek',
      'Termeni și condiții',
      'Villkor',
      'Şartlar ve Koşullar',
      '條款和條件',
      '條款及細則',
      '條款與條件',
      '条款声明',
      'Điều khoản và điều kiện',
      'Warunki i ograniczenia',
      'תנאים והגבלות',
    ]
      .map((text) => `normalize-space(@content-desc)='${text}'`)
      .join(' or ');
    return $(`//android.view.View[@clickable='true' and (${label})]`);
  }

  /** A child under the T&C row. Visible only when the section is expanded. */
  get tncExpandedChild() {
    const label = [
      'Terms and Conditions',
      'Terms and Condition',
      'Terms & Conditions',
      'Termes et conditions',
      'Términos y Condiciones',
      'Términos y condiciones',
      'Pravidla a Podmínky',
      'Aktionsbedingungen',
      'Általános szerződési feltételek',
      'Algemene voorwaarden',
      'Termeni și condiții',
      'Villkor',
      '條款和條件',
      '條款及細則',
      '条款声明',
      'Điều khoản và điều kiện',
      'Warunki i ograniczenia',
    ]
      .map((text) => `contains(@content-desc,'${text}')`)
      .join(' or ');
    return $(
      `//android.view.View[(${label})]//android.widget.ScrollView` +
        ` | //android.view.View[(${label})]//android.view.View` +
        ` | //android.view.View[@content-desc='תנאים והגבלות']/android.view.View/android.view.View`
    );
  }

  /** Links inside the expanded T&C. A country with none is a pass. */
  get tncHyperlinks() {
    return $$(
      `//android.widget.ScrollView//android.view.View[contains(@content-desc, 'https')]` +
        ` | //android.widget.ScrollView//android.view.View[contains(@content-desc, 'Les conditions générales')]` +
        ` | //android.widget.ScrollView//android.view.View[contains(@content-desc, 'actievoorwaarden')]` +
        ` | (//android.widget.ScrollView//android.view.View[contains(@content-desc, 'Samsung.com') and @clickable='true'])[1]`
    );
  }

  /** Native PDF viewer title after a T&C link opens a PDF. */
  get pdfTitle() {
    return $(`//android.view.View[contains(@content-desc, '.pdf')]`);
  }

  /** Rewards points under the greeting, e.g. "0 pts" (English), "10 星钻" (CN) */
  get rewardsPoints() {
    return $(`//android.view.View[contains(@content-desc, ' pts') or contains(@content-desc, '星钻')]`);
  }

  /** Shown instead of the points when the account has not joined Rewards (English, CN) */
  get rewardsJoinButton() {
    return $(
      `//*[contains(@content-desc, 'Join now') or contains(@content-desc, 'Join Now') or contains(@content-desc, 'Join Samsung Rewards') or contains(@content-desc, '立即加入')]`
    );
  }

  get chatFabButton() {
    return $(`//android.widget.Button[@content-desc = 'Open chat']`);
  }

  get mainKv() {
    return $(
      `(//android.widget.ScrollView//android.view.View[@clickable = 'true' and preceding-sibling::android.widget.ImageView]
      | //android.widget.ScrollView/android.view.View[1]//android.view.View[android.view.View]//*[self::android.widget.ImageView or self::android.view.View][@clickable = 'true'])[1]`
    );
  }
}
