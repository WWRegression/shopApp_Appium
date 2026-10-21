/** X of the full-screen ad overlay ("SHOP NOW") — no ids, so the image beside the ad box */
const AD_OVERLAY_CLOSE = `//android.widget.Button[@text = 'SHOP NOW' or @content-desc = 'SHOP NOW']/ancestor::android.widget.RelativeLayout[2]/android.widget.ImageView`;

/** X of a native popup over a scrim (promotion sheet, welcome dialog; the cookie popup has the same X) — no ids or fixed texts, so an unlabelled image while a full-screen scrim is up */
const SCRIM_POPUP_CLOSE = `//android.widget.ImageView[@clickable = 'true' and not(@content-desc)][//android.view.View[@clickable = 'true' and @content-desc and starts-with(@bounds, '[0,0]')]]`;

export class PopupLocator {
  /** Ad overlay close only — for screens where the broad closeButton could hit a real button (e.g. CN guest button) */
  get adCloseButton() {
    return $(AD_OVERLAY_CLOSE);
  }

  /** CN ad splash shown while Home loads (Onboarding_Advertisement, a few seconds) — "跳过" (skip) at the top right */
  get adSkipButton() {
    return $(`//android.widget.Button[@content-desc = '跳过']`);
  }

  get assuranceCancelButton() {
    return $(
      `//android.view.View[@clickable = 'true'][android.widget.TextView[@text = 'Cancel']][//android.widget.TextView[@text = 'Assurance']]`
    );
  }

  get insiderBannerCloseButton() {
    return $(`//*[@resource-id = 'ins-responsive-banner']//android.widget.Button[contains(@resource-id, 'close-button')]`);
  }

  /** Promotion / welcome popup X — also matches the cookie popup's X, so use it only when the cookie popup is not shown */
  get promoCloseButton() {
    return $(SCRIM_POPUP_CLOSE);
  }

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
      | //*[@class = 'android.view.View' and @content-desc = "Don't ask again"]
      | ${AD_OVERLAY_CLOSE}`
    );
  }

  /** Android notification permission "Allow" */
  get notificationAllowButton() {
    return $(`//android.widget.Button[@resource-id = 'com.android.permissioncontroller:id/permission_allow_button']`);
  }

  /** Android notification permission "Don't allow". Every permission dialog shares this deny id, so the location dialog is excluded. */
  get notificationDenyButton() {
    return $(
      `//android.widget.Button[
        (
          @resource-id = 'com.android.permissioncontroller:id/permission_deny_button'
          or @resource-id = 'com.android.permissioncontroller:id/permission_deny_and_dont_ask_again_button'
        )
        and not(
          ancestor::*[@resource-id = 'com.android.permissioncontroller:id/grant_dialog']
            //*[@resource-id = 'com.android.permissioncontroller:id/permission_allow_foreground_only_button']
        )
      ]`
    );
  }

  /** Android location permission "While using the app" */
  get locationAllowButton() {
    return $(`//*[@resource-id = 'com.android.permissioncontroller:id/permission_allow_foreground_only_button']`);
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
