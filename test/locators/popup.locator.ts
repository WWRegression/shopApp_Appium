export class PopupLocator {
  get closeButton() {
    return $(
      `//*[@class = 'android.widget.Image' and @resource-id = 'qa-closeButton']
      | //*[@class = 'android.view.View' and contains(@resource-id, 'close-button')]/*[@class = 'android.widget.Image']
      | //*[@class = 'android.widget.Button' and (
          contains(@resource-id, 'wrap-close-button')
          or @resource-id = 'qa-closeButton'
        )]
      | //android.webkit.WebView//*[
          @resource-id = 'qa-closeButton'
          or contains(@resource-id, 'wrap-close-button')
        ]
      | //android.webkit.WebView//*[
          @class = 'android.view.View'
          and contains(@resource-id, 'close-button')
        ]/*[@class = 'android.widget.Image']
      | //android.widget.Button[2][@index = 5]
      | //android.widget.Button[
          contains(@content-desc, "Aceptar")
          or contains(@content-desc, "Accept")
          or contains(@text, "Alles aanvaarden")
          or contains(@content-desc, "Chấp nhận")
          or contains(@content-desc, "Terima")
          or contains(@content-desc, "ตกลง")
          or contains(@content-desc, "同意")
          or contains(@content-desc, "Acceptera alla")
          or contains(@content-desc, "قبول")
          or contains(@content-desc, "موافق")
          or @content-desc = '接受'
          or @content-desc = '承諾'
          or @content-desc = ' אישור'
        ]
      | //android.widget.Button[
          (
            contains(@text, "close")
            or contains(@content-desc, "Close")
            or contains(@content-desc, "Cerrar")
            or contains(@content-desc, "Sluiten")
            or contains(@content-desc, "Đóng")
            or contains(@content-desc, "Fermer")
            or contains(@content-desc, "إلغاء")
            or contains(@content-desc, "Cancel")
            or contains(@content-desc, "Annuler")
            or contains(@content-desc, "Anuluj")
            or contains(@content-desc, "Hủy bỏ")
            or contains(@content-desc, "Hủy")
            or contains(@content-desc, "Schliessen")
            or contains(@content-desc, "Kembali")
            or contains(@content-desc, "ยกเลิก")
          )
          and not(
            preceding-sibling::android.view.View[
              @content-desc = "Select profile to continue"
            ]
          )
        ]
      | //*[@class = 'android.view.View' and @content-desc = "Don't ask again"]`
    );
  }

  get cookieAcceptButton() {
    return $(
     `//android.widget.Button[
      @content-desc="Accept" or
      @content-desc="Aceptar" or
      @content-desc="Terima" or
      @content-desc="Chấp nhận" or
      @content-desc="ตกลง" or
      @content-desc="同意" or
      @content-desc="接受" or
      @content-desc="承諾" or
      @content-desc="אישור" or
      contains(@content-desc, "قبول") or
      contains(@content-desc, "موافق")
      ]`
    );
  }
}
