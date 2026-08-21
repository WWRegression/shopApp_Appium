export class MypageLocator {
  menuButton(label: string) {
    return $(`//android.widget.ImageView[contains(@content-desc, '${label}')]`);
  }
  
  get subMenuItems() {
    return $$('//android.view.View[@content-desc and .//android.widget.ImageView]');
  }

  get loginButton() {
    return $('~YOUR_MYPAGE_LOGIN_SELECTOR');
  }

  get accountName() {
    return $('~YOUR_MYPAGE_ACCOUNT_NAME_SELECTOR');
  }
}
