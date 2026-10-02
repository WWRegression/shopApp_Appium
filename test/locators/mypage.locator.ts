export class MypageLocator {
  menuButton(label: string) {
    return $(`//android.widget.ImageView[contains(@content-desc, '${label}')]`);
  }
  
  get subMenuItems() {
    return $$('//android.view.View[@content-desc and .//android.widget.ImageView]');
  }

  /** Katalon MyAccount/accountPage — UK (English), CN */
  get accountPageTitle() {
    return $(
      `//android.view.View[@content-desc = 'My Page' or @content-desc = 'My page' or @content-desc = 'Mein Account' or @content-desc = '个人中心']`
    );
  }

  /** Katalon LogIn/mypageLoginBtn — English, DE; CN '登录' matched exactly since the CN logout button '退出登录' contains it */
  get loginButton() {
    return $(
      `//*[contains(@content-desc, 'Log-in') or contains(@content-desc, 'Login') or contains(@content-desc, 'Anmelden') or @content-desc = '登录']`
    );
  }

  /** Katalon LogIn/mypageLogoutBtn — English, DE, CN ('退出登录') */
  get logoutButton() {
    return $(
      `//*[contains(@content-desc, 'Logout') or contains(@content-desc, 'Log out')
        or contains(@content-desc, 'Abmelden') or contains(@content-desc, 'Ausloggen') or contains(@content-desc, 'Abmeldung')
        or contains(@content-desc, '退出')]`
    );
  }

  /** Katalon LogIn/mypageLogoutOkayBtn — logout confirm dialog */
  get logoutOkayButton() {
    return $(`//android.widget.Button[@index = '2']`);
  }

  /** Katalon MyAccount/MenuDashboard/samsungrewards — Rewards points on the My Page dashboard, e.g. "0 / Points" (English), "10 / 星钻" (CN) */
  get rewardsPoints() {
    return $(`//android.view.View[contains(@content-desc, 'Points') or contains(@content-desc, '星钻')]`);
  }

  /** Katalon MyAccount/MenuDashboard/samsungRewardBadge — "Join Samsung Rewards" tooltip (English, CN) */
  get joinRewardsTooltip() {
    return $(`//android.view.View[@content-desc = 'Join Samsung Rewards' or @content-desc = '加入 Samsung Rewards']`);
  }

  /** Katalon MyAccount/rewardsPointsWebView — points on the Samsung Rewards web page, e.g. "0 P" (global), "10" (CN) */
  get rewardsPagePoints() {
    return $('strong.js-point-info, .rewards-points-balance > span:first-of-type');
  }

  get accountName() {
    return $('~YOUR_MYPAGE_ACCOUNT_NAME_SELECTOR');
  }
}
