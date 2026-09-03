import { ShopPage, CategoryMismatch } from '../../../pages/shop.page';
import { PfPage } from '../../../pages/pf.page';
import { PdPage } from '../../../pages/pd.page';
import { BcPage } from '../../../pages/bc.page';
import { getBcPdProductName, verifyProductNameMatch } from '../../../helpers/element.helper';

describe('Shop L0/L1 Category Navigation', () => {
	it('L0/L1 카테고리를 순회하며 title과 상품명을 검증한다', async () => {

		const shopPage = new ShopPage();
		const pfPage = new PfPage();
		const pdPage = new PdPage();
		const bcPage = new BcPage();
		const mismatches: CategoryMismatch[] = [];

		await shopPage.selectBnbMenu('shop');

		const L0Categories = await shopPage.getCategories('L0');
		for (const L0category of L0Categories) {
			await shopPage.selectCategory(L0category);
			if (!(await shopPage.verifyCategoryTitle(mismatches, L0category))) {
				await shopPage.goToPreviousPage(mismatches, 'L0', L0category, L0Categories);
				continue;
			}

			const L1Categories = await shopPage.getCategories('L1');
			if (L1Categories.length === 0) {
				const pfProductName = await pfPage.getPfNameselectPf();
				const bcPdProductName = await getBcPdProductName({ pd: pdPage, bc: bcPage }, pfProductName);
				verifyProductNameMatch(mismatches, pfProductName, bcPdProductName, L0category);
				await shopPage.goToPreviousPage(mismatches, 'L0', L0category, L0Categories);
				continue;
			}

			for (const [i, L1category] of L1Categories.entries()) {
				await shopPage.selectCategory(L1category);
				if (!(await shopPage.verifyCategoryTitle(mismatches, L0category, L1category))) {
					await shopPage.goToPreviousPage(mismatches, 'L1', L0category, L0Categories, L1Categories);
					continue;
				}
				if (i === 0) {
					const pfProductName = await pfPage.getPfNameselectPf();
					const bcPdProductName = await getBcPdProductName({ pd: pdPage, bc: bcPage }, pfProductName);
					verifyProductNameMatch(mismatches, pfProductName, bcPdProductName, L0category, L1category);
				}
				await shopPage.goToPreviousPage(mismatches, 'L1', L0category, L0Categories, L1Categories);
			}
			await shopPage.goToPreviousPage(mismatches, 'L0', L0category, L0Categories);
		}
		mismatches.forEach((m) => console.log(`[FAIL] ${m}`));
		expect(mismatches).toHaveLength(0);
	});
});
