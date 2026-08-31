export type TestSuite = 'sanity' | 'phase3' | 'flagship';

export interface TestCaseMeta {
  tcId: string;
  suites: TestSuite[];
  description: string;
  /**
   * Feature flags required for this TC.
   * If a site does not support a feature, the TC should be skipped.
   */
  requiresFeatures?: Array<
    'tradeIn' | 'tradeUp' | 'scPlus' | 'eup' | 'sim' | 'rewards' | 'wishlist'
  >;
}

/**
 * Canonical TC catalog for this project.
 * - suites: which TEST_TYPE runs the TC (via runOrSkip)
 * - requiresFeatures: site feature gate (DEFAULT_SITE_FEATURES + sites/{SITE}.json)
 */
export const testCaseCatalog: TestCaseMeta[] = [
  // Runs first (see test/specs/regression/_call-api.spec.ts filename) — resolves a
  // valid IM/VD/HA sku per site via API so the rest of the suite picks it up.
  { tcId: 'CALL_API', suites: ['sanity', 'phase3'], description: 'Resolve valid IM/VD/HA sku per site via API' },

  // Sanity + Phase3 shared
  { tcId: 'PROD_HOME_01', suites: ['sanity', 'phase3'], description: 'Guest onboarding / TrustArc cookie' },
  { tcId: 'PROD_HOME_02', suites: ['sanity', 'phase3'], description: 'Registered auto-login / TrustArc cookie' },
  { tcId: 'PROD_SHOP_01', suites: ['sanity', 'phase3'], description: 'Shop L0>L1 to PF/PD/BC' },
  { tcId: 'PROD_SHOP_02', suites: ['sanity', 'phase3'], description: 'Wishlist add/remove and to cart', requiresFeatures: ['wishlist'] },
  { tcId: 'PROD_SHOP_03', suites: ['sanity', 'phase3'], description: 'Shop menus link correctly' },
  { tcId: 'PROD_SHOP_04', suites: ['sanity', 'phase3'], description: 'Change country and auto login' },
  { tcId: 'PROD_SHOP_05', suites: ['sanity', 'phase3'], description: 'Guest wishlist login popup', requiresFeatures: ['wishlist'] },
  { tcId: 'PROD_OFFER_01', suites: ['sanity', 'phase3'], description: 'Offers RTB redirection' },
  { tcId: 'PROD_MYPAGE_01', suites: ['sanity', 'phase3'], description: 'Account profile redirection' },
  { tcId: 'PROD_MYPAGE_02', suites: ['sanity', 'phase3'], description: 'Account dashboard menus' },
  { tcId: 'PROD_MYPAGE_03', suites: ['sanity', 'phase3'], description: 'Account menus My Orders~Inbox' },
  { tcId: 'PROD_REWARD_01', suites: ['sanity', 'phase3'], description: 'Rewards points consistency', requiresFeatures: ['rewards'] },
  { tcId: 'PROD_BUY_01', suites: ['sanity', 'phase3'], description: 'Add Trade-In on BC to cart', requiresFeatures: ['tradeIn'] },
  { tcId: 'PROD_BUY_02', suites: ['sanity', 'phase3'], description: 'Add SC+ on BC to cart', requiresFeatures: ['scPlus'] },
  { tcId: 'PROD_BUY_03', suites: ['sanity', 'phase3'], description: 'Add SIM on BC to cart', requiresFeatures: ['sim'] },
  { tcId: 'PROD_BUY_04', suites: ['sanity', 'phase3'], description: 'Add EUP on BC to cart', requiresFeatures: ['eup'] },
  { tcId: 'PROD_BUY_05', suites: ['sanity', 'phase3'], description: 'Add Trade-Up on PD to cart', requiresFeatures: ['tradeUp'] },
  { tcId: 'PROD_BUY_06', suites: ['sanity', 'phase3'], description: 'Native PD shown' },
  { tcId: 'PROD_BUY_07', suites: ['sanity', 'phase3'], description: 'AR function TV/Monitor PD' },
  { tcId: 'PROD_CART_01', suites: ['sanity', 'phase3'], description: 'Cart quantity/remove/badge' },
  { tcId: 'PROD_CART_02', suites: ['sanity', 'phase3'], description: 'Cart Trade-In to payment', requiresFeatures: ['tradeIn'] },
  { tcId: 'PROD_CART_03', suites: ['sanity', 'phase3'], description: 'Cart SC+ to payment', requiresFeatures: ['scPlus'] },
  { tcId: 'PROD_CART_04', suites: ['sanity', 'phase3'], description: 'Cart EUP to payment', requiresFeatures: ['eup'] },
  { tcId: 'PROD_CART_05', suites: ['sanity', 'phase3'], description: 'Cart Trade-Up to payment', requiresFeatures: ['tradeUp'] },
  { tcId: 'PROD_CHECKOUT_01', suites: ['sanity', 'phase3'], description: 'BC to cart to payment' },
  { tcId: 'PROD_CHECKOUT_02', suites: ['sanity', 'phase3'], description: 'Multi products to payment' },
  { tcId: 'PROD_CHECKOUT_03', suites: ['sanity', 'phase3'], description: 'Guest checkout to payment' },
  { tcId: 'PROD_SEARCH_01', suites: ['sanity', 'phase3'], description: 'Keyword search and history' },
  { tcId: 'PROD_LOGIN_01', suites: ['sanity', 'phase3'], description: 'SSO Email on Account' },
  { tcId: 'PROD_LOGIN_02', suites: ['sanity', 'phase3'], description: 'SSO Gmail on Account' },
  { tcId: 'PROD_LOGIN_03', suites: ['sanity', 'phase3'], description: 'SSO Gmail on empty cart' },
  { tcId: 'PROD_LOGIN_04', suites: ['sanity', 'phase3'], description: 'Logout/login on Account' },
  { tcId: 'PROD_LOGIN_05', suites: ['sanity', 'phase3'], description: 'Auto login Continue to checkout' },
  { tcId: 'PROD_LOGIN_06', suites: ['sanity', 'phase3'], description: 'Auto login Login CTA on cart' },
  { tcId: 'PROD_LOGIN_07', suites: ['sanity', 'phase3'], description: 'Auto login Login CTA on checkout' },
  { tcId: 'PROD_LOGIN_08', suites: ['sanity', 'phase3'], description: 'Logout after SSO delete' },
  { tcId: 'PROD_BACKWARD_01', suites: ['sanity', 'phase3'], description: 'PF to payment then back' },

  // Phase3 only
  { tcId: 'PROD_HOME_03', suites: ['phase3'], description: 'BNB redirection' },
  { tcId: 'PROD_HOME_04', suites: ['phase3'], description: 'T&C folded and links' },
  { tcId: 'PROD_HOME_05', suites: ['phase3'], description: 'Guest country change' },
  { tcId: 'PROD_SHOP_06', suites: ['phase3'], description: 'PF filter and sort' },
  { tcId: 'PROD_OFFER_02', suites: ['phase3'], description: 'Offer category filter icons' },
  { tcId: 'PROD_MYPAGE_04', suites: ['phase3'], description: 'Recommended products under devices' },
  { tcId: 'PROD_MYPAGE_05', suites: ['phase3'], description: 'Account sub-menus' },
  { tcId: 'PROD_MYPAGE_06', suites: ['phase3'], description: 'Edit address reflected on checkout' },
  { tcId: 'PROD_MYPAGE_07', suites: ['phase3'], description: 'Estore/EPP options' },
  { tcId: 'PROD_MYPAGE_08', suites: ['phase3'], description: 'Account Search/Chat icons' },
  { tcId: 'PROD_BUY_08', suites: ['phase3'], description: 'Add-on page to cart' },
  { tcId: 'PROD_BUY_09', suites: ['phase3'], description: 'Price consistency PF/BC/Cart/Checkout' },
  { tcId: 'PROD_CART_06', suites: ['phase3'], description: 'Open PD/BC from cart product name' },
  { tcId: 'PROD_CHECKOUT_04', suites: ['phase3'], description: 'Checkout edit section navigation' },
  { tcId: 'PROD_SEARCH_02', suites: ['phase3'], description: 'Trending search history' },
  { tcId: 'PROD_SEARCH_03', suites: ['phase3'], description: 'Search by SKU filter/sort' },
  { tcId: 'PROD_SEARCH_04', suites: ['phase3'], description: 'Search by product name filter/sort' },
  { tcId: 'PROD_SEARCH_05', suites: ['phase3'], description: 'Search by local language' },
  { tcId: 'PROD_SEARCH_06', suites: ['phase3'], description: 'No result for blacklist words' },
  { tcId: 'PROD_SEARCH_07', suites: ['phase3'], description: 'Search suggestions redirection' },
  { tcId: 'PROD_SEARCH_08', suites: ['phase3'], description: 'Wishlist from search PF', requiresFeatures: ['wishlist'] },
  { tcId: 'PROD_BACKWARD_02', suites: ['phase3'], description: 'Wishlist to payment then back' },
  { tcId: 'PROD_BACKWARD_03', suites: ['phase3'], description: 'Back navigation multi entry points' },

  // Flagship
  { tcId: 'UAT_APP_01', suites: ['flagship'], description: 'PF card redirection / product setup' },
  { tcId: 'UAT_APP_02', suites: ['flagship'], description: 'Product added to cart' },
  { tcId: 'UAT_APP_03', suites: ['flagship'], description: 'Trade-In validation on BC', requiresFeatures: ['tradeIn'] },
  { tcId: 'UAT_APP_04', suites: ['flagship'], description: 'Trade-In added to cart', requiresFeatures: ['tradeIn'] },
  { tcId: 'UAT_APP_05', suites: ['flagship'], description: 'SC+ validation on BC', requiresFeatures: ['scPlus'] },
  { tcId: 'UAT_APP_06', suites: ['flagship'], description: 'SC+ added to cart', requiresFeatures: ['scPlus'] },
  { tcId: 'UAT_BS_07', suites: ['flagship'], description: 'SIM validation on BC', requiresFeatures: ['sim'] },
  { tcId: 'UAT_APP_08', suites: ['flagship'], description: 'SIM added to cart', requiresFeatures: ['sim'] },
  { tcId: 'UAT_APP_09', suites: ['flagship'], description: 'EUP validation on BC', requiresFeatures: ['eup'] },
  { tcId: 'UAT_APP_10', suites: ['flagship'], description: 'EUP added to cart', requiresFeatures: ['eup'] },
  { tcId: 'UAT_APP_11', suites: ['flagship'], description: 'Category chip Flagship SKUs' },
];

export function listTestCasesForSuite(suite: TestSuite): TestCaseMeta[] {
  return testCaseCatalog.filter((tc) => tc.suites.includes(suite));
}

export function getTestCaseMeta(tcId: string): TestCaseMeta {
  const meta = testCaseCatalog.find((tc) => tc.tcId === tcId);
  if (!meta) {
    throw new Error(`Unknown test case id: ${tcId}`);
  }
  return meta;
}
