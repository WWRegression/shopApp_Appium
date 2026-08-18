import { PopupLocator } from '../locators/popup.locator';
import { HeaderLocator } from '../locators/header.locator';
import { BnbLocator } from '../locators/bnb.locator';
import { switchToNative, switchToWebView, isWebViewContext, pageUrlPatterns, PageUrlKey } from '../helpers/context.helper';
import { getRunConfig } from '../../config/run.config';

/**
 * isPage()가 판별할 수 있는 페이지 목록.
 * BC부터 먼저 채우고, 나머지는 필요해질 때 PAGE_URL_KEY / isWebViewPage에 추가한다.
 */
export type Page = 'BC';

/** WebView에서 렌더링되는 페이지인지 (아니면 Native 전용 페이지). */
const WEBVIEW_PAGES: ReadonlySet<Page> = new Set<Page>(['BC']);

/** Page -> context.helper의 URL 패턴 키 매핑 (switchUrl과 같은 패턴을 재사용). */
const PAGE_URL_KEY: Record<Page, PageUrlKey> = {
  BC: 'buy',
};

/**
 * 전 페이지 공통 UI 동작.
 * Context 전환 구현은 context.helper에만 둔다 (이중 API 금지).
 */
export class BasePage {
  protected readonly popupLocator = new PopupLocator();
  protected readonly headerLocator = new HeaderLocator();
  protected readonly bnbLocator = new BnbLocator();

  async closePopupIfShown(): Promise<void> {
    await switchToWebView();
    const closeButton = this.popupLocator.closeButton;
    if (await closeButton.isDisplayed().catch(() => false)) {
      await closeButton.click();
    }
  }

  async acceptCookieBannerIfShown(): Promise<void> {
    await switchToWebView();
    const acceptButton = this.popupLocator.cookieAcceptButton;
    if (await acceptButton.isDisplayed().catch(() => false)) {
      await acceptButton.click();
    }
  }

  async clickHeaderSearch(): Promise<void> {
    await switchToNative();
    await this.headerLocator.searchButton.click();
  }

  async clickBnbHome(): Promise<void> {
    await switchToNative();
    await this.hideKeyboardIfShown();
    await this.bnbLocator.homeButton.click();
  }

  async clickBnbCart(): Promise<void> {
    await switchToNative();
    await this.hideKeyboardIfShown();
    await this.bnbLocator.cartButton.click();
  }

  /**
   * 이전 실행이 검색창 등에 키보드를 띄운 채 끝난 경우, 키보드가 하단 네비게이션
   * 바를 가려서 clickBnb*()가 엘리먼트를 못 찾는다. 있으면 먼저 닫는다.
   */
  protected async hideKeyboardIfShown(): Promise<void> {
    const shown = await driver.isKeyboardShown().catch(() => false);
    if (shown) {
      await driver.hideKeyboard().catch(() => undefined);
    }
  }

  /** page 타입이 WebView에서 렌더링되는지 (아니면 Native 전용인지) — 분류용, 실측 아님. */
  protected isWebViewPageType(page: Page): boolean {
    return WEBVIEW_PAGES.has(page);
  }

  /**
   * 지금 WebView 컨텍스트일 때, WebView 후보 중 뭐가 맞는지 URL로 찾는다.
   * URL은 한 번만 읽어서 모든 후보 패턴에 재사용한다.
   *
   * 전제: switchUrl처럼 여러 윈도우를 훑지 않고 지금 활성 윈도우의 URL만 본다.
   * 그래서 이 함수(및 getCurrentPage/isPage)는 반드시 해당 페이지의 진입 메서드
   * (예: BcPage.selectOptions — 내부에서 switchUrl로 올바른 윈도우를 이미 선택해둠)
   * 호출 뒤에만 써야 한다. 그 순서 없이 단독으로 부르면 noReset으로 남아있는 이전 실행의
   * 다른 윈도우(예: 오래된 cart 탭)가 활성 상태일 때 엉뚱한 URL을 읽어 오답을 줄 수 있다.
   */
  protected async findWebViewPage(): Promise<Page | 'UNKNOWN'> {
    const currentUrl = String(await driver.execute('return window.location.href;')).toLowerCase();
    const site = getRunConfig().site;
    const match = [...WEBVIEW_PAGES].find((page) =>
      pageUrlPatterns(PAGE_URL_KEY[page], site).some((p) => currentUrl.includes(p.toLowerCase()))
    );
    return match ?? 'UNKNOWN';
  }

  /**
   * 지금 Native 컨텍스트일 때, Native 후보(전용 페이지 + WebView 페이지의 네이티브 쉘) 중
   * 뭐가 맞는지 찾는다 — 아직 미구현.
   */
  protected async findNativePage(): Promise<Page | 'UNKNOWN'> {
    // TODO: Native 전용 페이지 / WebView 페이지의 네이티브 쉘 판별이 필요해지면 구현
    return 'UNKNOWN';
  }

  /** 지금 화면이 어떤 page인지 찾는다. 컨텍스트 전환은 하지 않고, 지금 있는 곳 기준으로만 판별한다. */
  async getCurrentPage(): Promise<Page | 'UNKNOWN'> {
    const inWebView = await isWebViewContext();
    const result = inWebView ? await this.findWebViewPage() : await this.findNativePage();
    console.log(`getCurrentPage() => ${result}`);
    return result;
  }

  /**
   * 현재 화면이 page인지 판별한다.
   * page가 Native 전용인데 지금 WebView면, WebView 쪽엔 대응되는 판별 방법이 없으므로
   * 이 경우에만 Native로 강제 전환한다. 그 외(page가 WebView 타입)에는 전환하지 않고
   * getCurrentPage()가 지금 컨텍스트에 맞는 방법(URL vs 네이티브 쉘)을 알아서 고른다.
   */
  async isPage(page: Page): Promise<boolean> {
    const inWebView = await isWebViewContext();
    if (!this.isWebViewPageType(page) && inWebView) {
      await switchToNative();
    }

    const result = (await this.getCurrentPage()) === page;
    console.log(`isPage(${page}) => ${result}`);
    return result;
  }
}
