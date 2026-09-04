import { BasePage } from './base.page';
import { ShopLocator, ShopCategory } from '../locators/shop.locator';
import { gestureByBoundary } from '../helpers/gesture.helper'
import { switchToNative, getCurrentWebViewPage, hasAppWebViewContext } from '../helpers/context.helper';
import { currentSiteCode } from '../helpers/tc-filter.helper';
import { clickElement } from '../helpers/element.helper';
export type CategoryMismatch = string;

export class ShopPage extends BasePage {
	private readonly shoplocator = new ShopLocator();

  /** Shop → L0 → L1. Lands on PF. */
  async openCategory(category: ShopCategory): Promise<void> {
    await this.selectBnbMenu('shop');

    const site = currentSiteCode();
    await clickElement(this.shoplocator.L0(site, category), { timeout: 15000 });
    await clickElement(this.shoplocator.L1(site, category), { timeout: 15000 });
  }

  /** Shop tab -> L0 category -> L1 subcategory, down to the PF list. Katalon moveToPF. */
  async openPfList(category: ShopCategory): Promise<void> {
    await this.selectBnbMenu('shop');

    const path = this.shoplocator.categoryPath(currentSiteCode(), category);
    for (const xpath of [path.L0, path.L1]) {
      const el = $(xpath);
      if (await el.isDisplayed().catch(() => false)) {
        await el.click();
      }
    }
  }

  async openFirstCategory(): Promise<void> {
    // TODO: Implement category navigation
    const firstCategory = (await this.shoplocator.L0Categories)[0];
    if (firstCategory) {
      await firstCategory.click();
    }
  }

	async getCategories(depth: 'L0' | 'L1', maxScrolls = 10): Promise<string[]> {
		const categoryTitleList = new Set<string>();
		let previousLastcategoryY = -1;
		let previousCount = 0;

    if (depth === 'L0') {
      await browser.pause(2000);
    }

		for (let attempt = 0; attempt < maxScrolls; attempt++) {
			const categories = depth === 'L0' ? this.shoplocator.L0Categories : this.shoplocator.L1Categories;
      const categoryList = [...(await categories)];

			for (const category of categoryList) {
				const categoryTitle = await category.getAttribute('content-desc');
				if (!categoryTitle?.trim() || categoryTitle === 'null') {
					continue;
				}

				const { width, height } = await category.getSize();
				const isValid = depth === 'L0' ? width < 920 : (width > 920 && 53 < height && height < 400);
				if (isValid) {
					categoryTitleList.add(categoryTitle);
				}
			}

			const lastcategory = categoryList[categoryList.length - 1];
			const currentLastcategoryY = (await lastcategory.getLocation()).y;

			if (currentLastcategoryY === previousLastcategoryY) {
				break;
			}
			if (categoryTitleList.size === previousCount) {
				console.log('No new categories found. Ending scroll.');
				break;
			}

			previousLastcategoryY = currentLastcategoryY;
			previousCount = categoryTitleList.size;

      await gestureByBoundary('scroll', 'down', 1000);
		}

    if (categoryTitleList.size === 0 && depth === 'L0') {
      throw new Error('No L0 category banners were found on the Shop page');
    }
    await gestureByBoundary('scroll', 'up', 1.0, { height: 1000 }, 3);
		return Array.from(categoryTitleList);
	}

  async selectCategory(categoryTitle: string): Promise<boolean> {
    const targetCategory = this.shoplocator.categoryTitleByName(categoryTitle);
    const maxAttempts = 3;

    if (await targetCategory.isDisplayed()) {
      await targetCategory.click();
      return true;
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await gestureByBoundary('scroll', 'down', 1.0, { height: 1000 }, 1);

      if (await targetCategory.isDisplayed()) {
        await targetCategory.click();
        return true;
      }
    }

    console.log(`Category "${categoryTitle}" not found after ${maxAttempts} scroll attempts.`);
    return false;
  }

	async verifyCategoryTitle(
    mismatches: CategoryMismatch[],
    L0Title: string,
    L1Title?: string
  ): Promise<boolean> {
    const expectedTitle = L1Title ?? L0Title;
    const titleElement = this.shoplocator.pageTitleByName(expectedTitle);
  
    if (!(await titleElement.waitForDisplayed({ timeout: 3000 }).catch(() => false)))  {
      mismatches.push(
        L1Title
      ? `L1 title mismatch: ${L0Title} > ${L1Title}`
      : `L0 title mismatch: ${L0Title}`
      );
      return false;
    }
    return true;
  }

  private async currentShopPage(
    targetPage : 'L0' | 'L1' | 'pf' | undefined,
    L0CategoryList?: string[],
    L1CategoryList?: string[],
    timeout: number = 1000
  ): Promise<'L0' | 'L1' | 'pf' | 'unknown'> {
    if (!targetPage || targetPage === 'L0') {
      const headerTitle = this.headerLocator.title;
      const isTitleDisplayed = await headerTitle.waitForDisplayed({ timeout }).catch(() => false);
      if (isTitleDisplayed) {
        const headerTitleContentDesc = await headerTitle.getAttribute('content-desc');
        if (headerTitleContentDesc && BasePage.titleTexts['SHOP'].includes(headerTitleContentDesc)) {
          return 'L0';
        }
      }
    }

    if (!targetPage || targetPage === 'L1' || targetPage === 'pf') {
      const pageTitle = this.shoplocator.pageTitle();
      const isTitleDisplayed = await pageTitle.waitForDisplayed({ timeout }).catch(() => false);
      if (isTitleDisplayed) {
        const pageTitleContentDesc = await pageTitle.getAttribute('content-desc');
        if (pageTitleContentDesc) {
          if ((!targetPage || targetPage === 'pf') && L1CategoryList?.includes(pageTitleContentDesc)) {
            return 'pf';
          }
          if ((!targetPage || targetPage === 'L1') && L0CategoryList?.includes(pageTitleContentDesc)) {
            return 'L1';
          }
        }
      }
    }

    return 'unknown';
  }

  private async getCurrentPageType(
    L0CategoryList?: string[],
    L1CategoryList?: string[],
    targetPage?: 'L0' | 'L1' | 'pf' | 'webviewpage',
    timeout: number = 1000
  ): Promise<'L0' | 'L1' | 'pf' | 'webviewpage' | 'unknown'> {
    if (targetPage === 'L0' || targetPage === 'L1' || targetPage === 'pf') {
      return this.currentShopPage(targetPage, L0CategoryList, L1CategoryList, timeout);
    }

    if (targetPage === 'webviewpage') {
      const { page } = await getCurrentWebViewPage();
      return page !== 'unknown' ? 'webviewpage' : 'unknown';
    }

    await switchToNative();
    const nativePage = await this.currentShopPage(undefined, L0CategoryList, L1CategoryList, timeout);
    if (nativePage !== 'unknown') return nativePage;

    if (await hasAppWebViewContext()) {
      return 'webviewpage';
    }
    return 'unknown';
  }

  async goToPreviousPage(
    mismatches: CategoryMismatch[],
    targetPage: 'L0' | 'L1' | 'pf' | 'webviewpage',
    L0category: string,
    L0CategoryList?: string[],
    L1CategoryList?: string[]
  ): Promise<void> {
    const maxAttempts = targetPage === 'L1' ? 2 : 3;
    const currentPage = await this.getCurrentPageType(L0CategoryList, L1CategoryList);
    
    if (currentPage === targetPage) {
      return;
    }

    const order = { L0: 0, L1: 1, pf: 2, webviewpage: 3 };
    if (currentPage === 'unknown' || order[currentPage] < order[targetPage]) {
      await this.selectBnbMenu('shop');
      if (targetPage === 'L1') {
        await this.selectCategory(L0category);
      }
      const reason = currentPage === 'unknown'
        ? 'current page is unknown'
        : `Cannot go back from "${currentPage}" to "${targetPage}"`;
      mismatches.push(`goToPreviousPage: ${reason}. Returned to shop.`);
      return;
    }
    
    for (let i = 0; i < maxAttempts; i++) {
      await driver.pressKeyCode(4);
      
      if (await this.getCurrentPageType(L0CategoryList, L1CategoryList, targetPage) === targetPage) {
        return;
      }
    }
    
    await this.selectBnbMenu('shop');
    if (targetPage === 'L1') {
      await this.selectCategory(L0category);
    }
    mismatches.push(
      `goToPreviousPage: failed to reach page "${targetPage}" after ${maxAttempts} attempts. Returned to shop.`
    );
  }
}
