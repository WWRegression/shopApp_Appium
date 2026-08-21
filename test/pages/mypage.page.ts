import { BasePage } from './base.page';
import { MypageLocator } from '../locators/mypage.locator';
import { switchToNative, getAvailableUrls } from '../helpers/context.helper';
import { scrollUntilVisible } from '../helpers/gesture.helper';
import { getElementLabel } from '../helpers/element.helper';

export class MypagePage extends BasePage {
  private readonly locator = new MypageLocator();
  /** Page ids captured as a baseline before the loop starts — excluded when detecting new items. */
  private readonly knownPageIds = new Set<string>();

  /** Katalon MyPage.tapMenu() equivalent — scrolls to and clicks the menu button with this on-screen label. */
  async selectMenu(label: string): Promise<void> {
    console.log(`[selectMenu] label="${label}"`);
    const button = this.locator.menuButton(label);
    await button.waitForExist({ timeout: 3000 }).catch(() => undefined);
    const found = await scrollUntilVisible(button);
    console.log(`[selectMenu] found=${found}`);
    if (found) {
      await button.click();
      console.log(`[selectMenu] clicked "${label}"`);
    }
  }

  /**
   * subMenuItems matches on @content-desc presence alone, so loading/empty
   * placeholder rows can slip in — keep only rows with a non-empty content-desc.
   * Shared by getSubMenuCount()/clickItemAt() so both use the same criteria.
   */
  private async getValidSubMenuItems() {
    const items = this.locator.subMenuItems;
    await items[0].waitForExist({ timeout: 3000 }).catch(() => undefined);
    const all = await items;

    const valid = [];
    for (const item of all) {
      const desc = ((await item.getAttribute('content-desc').catch(() => '')) || '').trim();
      if (desc) {
        valid.push(item);
      }
    }
    return valid;
  }

  /** Sub-menu item count — read from the screen since it varies by country. */
  async getSubMenuCount(): Promise<number> {
    await switchToNative();
    const items = await this.getValidSubMenuItems();
    console.log(`[getSubMenuCount] count=${items.length}`);

    // Baseline before the loop — prevents leftover webview pages from earlier
    // sessions being mistaken for newly opened ones.
    this.knownPageIds.clear();
    const existing = await getAvailableUrls();
    for (const p of existing) {
      this.knownPageIds.add(p.id);
    }
    console.log(`[getSubMenuCount] baseline page ids=${existing.map((p) => p.id).join(',')}`);

    return items.length;
  }

  /** Clicks the item at index and returns its label (content-desc). */
  async clickItemAt(index: number): Promise<string> {
    await switchToNative();
    const items = await this.getValidSubMenuItems();
    const item = items[index];
    if (!item) {
      console.log(`[clickItemAt] index=${index} not found`);
      return '';
    }

    const itemLabel = ((await item.getAttribute('content-desc').catch(() => '')) || '')
      .trim()
      .toLowerCase();
    console.log(`[clickItemAt] index=${index} label="${itemLabel}" — clicking`);
    await item.click();
    return itemLabel;
  }

  /**
   * Verifies the clicked sub-menu actually navigated there. Katalon
   * MyPage.verifySubMenus() equivalent. Checks whether the label appears in
   * the url (webview) or header title (native). The url is read directly
   * from the chrome devtools socket, staying in NATIVE — no Appium context
   * switch (switchToWebView, several seconds) needed.
   */
  async verifyRedirected(itemLabel: string): Promise<void> {
    console.log(`[verifyRedirected] start menu="${itemLabel}"`);
    if (!itemLabel) {
      console.log('[verifyRedirected] skip — empty label');
      return;
    }

    const page = await this.findWebviewPage();
    let matched: boolean;
    if (page) {
      matched = this.matchesLabel(page.url, itemLabel);
      console.log(
        `[verifyRedirected] context=webview url="${page.url}" title="${page.title}" matched=${matched}`
      );
    } else {
      const headerTitle = await getElementLabel(this.headerLocator.title);
      matched = this.matchesLabel(headerTitle, itemLabel);
      console.log(`[verifyRedirected] context=native header="${headerTitle}" matched=${matched}`);
    }
    expect(matched).toBe(true);

    console.log(`[verifyRedirected] done menu="${itemLabel}"`);
    await this.pressBack();
  }

  /**
   * Polls briefly since the webview may not have appeared yet right after
   * the click. Only ids absent from the baseline (knownPageIds) count as
   * new — leftover webviews are always in the baseline and get excluded.
   */
  private async findWebviewPage(timeoutMs = 4000): Promise<{ url: string; title: string } | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const pages = await getAvailableUrls();
      const page = pages.find((p) => p.type === 'page' && p.url && !this.knownPageIds.has(p.id));
      if (page) {
        this.knownPageIds.add(page.id);
        return { url: page.url, title: page.title };
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return null;
  }

  /** Checks whether the label's key word appears in text — both values come from the same screen, so no per-language data is needed. */
  private matchesLabel(text: string, itemLabel: string): boolean {
    const keyword = itemLabel.split(' ').find((w) => w.length > 2) ?? itemLabel;
    return text.toLowerCase().includes(keyword);
  }

  /** Android system back — returns to the sub-menu list screen. */
  async pressBack(): Promise<void> {
    console.log('[pressBack]');
    await switchToNative();
    await driver.back();
  }

  async tapLogin(): Promise<void> {
    // TODO: Implement login navigation
    await this.locator.loginButton.click();
  }

  async getAccountName(): Promise<string> {
    // TODO: Implement account name retrieval
    return await this.locator.accountName.getText();
  }
}
