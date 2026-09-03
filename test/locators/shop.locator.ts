import { getRunConfig } from '../../config/run.config';

/** Katalon Shop.CATEGORY_MAP — L0 category tab content-desc, all locales. */
const CATEGORY_MOBILES_L0 = `//android.widget.ImageView[
	@content-desc='Mobiles' or
	@content-desc='Mobile' or
	@content-desc='Phones' or
	@content-desc='Mobilité' or
	@content-desc='Mobiel' or
	@content-desc='Urządzenia mobilne' or
	@content-desc='Mobil' or
	@content-desc='Di Động' or
	@content-desc='โทรศัพท์มือถือ' or
	@content-desc='行動裝置' or
	@content-desc='Mobilní zařízení' or
	@content-desc='智能手機及平板電腦' or
	@content-desc='Mobile & Tablets' or
	@content-desc='Mobile & Tabletss' or
	@content-desc='Móviles' or
	@content-desc='Telefoane' or
	@content-desc='الهاتف المحمول' or
	@content-desc='الأجهزة الجوالة' or
	@content-desc='手机/平板' or
	@content-desc='スマートフォン' or
	@content-desc='Dispositivos móviles'
] | //android.view.View[
	@content-desc='Mobiles' or
	@content-desc='Mobile' or
	@content-desc='Phones' or
	@content-desc='Mobilité' or
	@content-desc='Mobiel' or
	@content-desc='Urządzenia mobilne' or
	@content-desc='Mobil' or
	@content-desc='Di Động' or
	@content-desc='สมาร์ทโฟน' or
	@content-desc='行動裝置' or
	@content-desc='Mobilní zařízení' or
	@content-desc='智能手機 및 平板電腦' or
	@content-desc='Mobile & Tablets' or
	@content-desc='Mobile & Tabletss' or
	@content-desc='Móviles' or
	@content-desc='Telefoane' or
	@content-desc='الهاتف المحمول' or
	@content-desc='الأجهزة الجوالة' or
	@content-desc='手机/平板' or
	@content-desc='スマートフォン' or
	@content-desc='Mobiless' or
	@content-desc='מובייל' or
	@content-desc='智能手機及平板電腦' or
	@content-desc='流動產品' or
	@content-desc='Dispositivos móviles'
]`;

const CATEGORY_WEARABLES_L0 = `//*[@class = 'android.view.View' and (
	@content-desc = '穿戴式裝置' or
	@content-desc = 'Wearables' or
	@content-desc = '智能穿戴' or
	@content-desc = '智能穿戴设备' or
	@content-desc = '可穿戴式裝置' or
	@content-desc = 'Watches'
)]`;

/** L1 subcategory tab content-desc, all locales. */
const SUBCATEGORY_SMARTPHONES_L1 = `//*[@class = 'android.view.View']/descendant::*[@class = 'android.widget.ImageView' and (
	@content-desc='Smartphones' or
	@content-desc='Smartphone' or
	@content-desc='Smartphones Galaxy' or
	@content-desc='Téléphones Intelligents' or
	@content-desc='Mobile' or
	@content-desc='Smartfony' or
	@content-desc='Mobiltelefoner' or
	@content-desc='Galaxy mobiltelefoner' or
	@content-desc='Mobiler' or
	@content-desc='Di Động' or
	@content-desc='สมาร์ทโฟน' or
	@content-desc='智能手機' or
	@content-desc='智能手机' or
	@content-desc='Chytré telefony' or
	@content-desc='Okostelefonok' or
	@content-desc='Telefoane' or
	@content-desc='Akıllı Telefonlar' or
	@content-desc='Galaxy Smartphone' or
	@content-desc='Galaxy S' or
	@content-desc='هواتف ذكية' or
	@content-desc='الجوالات الذكية') or
	@content-desc='智慧手機' or
	@content-desc='Galaxy Akıllı Telefon' or
	@content-desc='Điện thoại thông minh' or
	@content-desc='Galaxyスマートフォン' or
	@content-desc='Téléphones intelligents Galaxy' or
	@content-desc='Galaxy Smartphones' or
	@content-desc='Galaxy okostelefonok' or
	@content-desc='Smartfony Galaxy' or
	@content-desc='Telefoane Galaxy' or
	@content-desc='أجهزة Galaxy الجوالة' or
	@content-desc='Galaxy chytré telefony' or
	@content-desc='هاتف Galaxy الذكي' or
	@content-desc='Galaxy 智能手機' or
	@content-desc='Điện thoại thông minh Galaxy'
]`;

const SUBCATEGORY_WATCHS_L1 = `//android.widget.ImageView[
	contains(@content-desc, 'Watches') or
	@content-desc='Chytré hodinky' or
	@content-desc='Smartwatches' or
	@content-desc='Smartwatche' or
	@content-desc='Smartwatch' or
	@content-desc='Relojes' or
	@content-desc='Montres' or
	@content-desc='Okosórák' or
	@content-desc='الساعات' or
	@content-desc='الساعة' or
	@content-desc='Klockor' or
	@content-desc='智慧手錶' or
	@content-desc=' นาฬิกา' or
	@content-desc='Akıllı Saatler' or
	@content-desc='Đồng Hồ Thông Minh' or
	@content-desc='手錶' or
	@content-desc='智能手表' or
	@content-desc='ساعة Galaxy' or
	@content-desc='Galaxyウォッチ' or
	contains(@content-desc, 'Watch')
]`;

/** US-only: single "See All X" button replaces the L1 subcategory tab. */
const SUBCATEGORY_VIEW_ALL_L1 = `//android.widget.ImageView[
	@content-desc="See All Phones" or
	@content-desc="See All TVs" or
	@content-desc="See All Watches"
]`;

export type ShopCategory = 'mobile' | 'watch';

interface CategorySteps {
  l0: string;
  l1: string;
}

const DEFAULT_STEPS: Record<ShopCategory, CategorySteps> = {
  mobile: { l0: CATEGORY_MOBILES_L0, l1: SUBCATEGORY_SMARTPHONES_L1 },
  watch: { l0: CATEGORY_MOBILES_L0, l1: SUBCATEGORY_WATCHS_L1 },
};

/** Katalon Shop.CATEGORY_MAP site overrides. */
const SITE_STEPS_OVERRIDE: Record<string, Partial<Record<ShopCategory, CategorySteps>>> = {
  HK: { watch: { l0: CATEGORY_WEARABLES_L0, l1: SUBCATEGORY_WATCHS_L1 } },
  HK_EN: { watch: { l0: CATEGORY_WEARABLES_L0, l1: SUBCATEGORY_WATCHS_L1 } },
  MX: { watch: { l0: CATEGORY_WEARABLES_L0, l1: SUBCATEGORY_WATCHS_L1 } },
  CN: { watch: { l0: CATEGORY_WEARABLES_L0, l1: SUBCATEGORY_WATCHS_L1 } },
  US: {
    mobile: { l0: CATEGORY_MOBILES_L0, l1: SUBCATEGORY_VIEW_ALL_L1 },
    watch: { l0: CATEGORY_WEARABLES_L0, l1: SUBCATEGORY_VIEW_ALL_L1 },
  },
};

export class ShopLocator {
  private readonly site = getRunConfig().site;

  categorySteps(siteCode: string, category: ShopCategory): CategorySteps {
    return SITE_STEPS_OVERRIDE[siteCode.toUpperCase()]?.[category] ?? DEFAULT_STEPS[category];
  }

  get L0Categories() {
    if (this.site === 'JP') {
      return $$(`//android.widget.FrameLayout[@resource-id='android:id/content']
        /android.widget.FrameLayout/android.widget.FrameLayout
        /android.view.View/android.view.View/android.view.View/android.view.View[2]
        /android.view.View/android.view.View/android.view.View/android.view.View/android.view.View[1]
        //android.view.View[@content-desc]`);
    }
    
    return $$(`//android.widget.ScrollView/android.view.View/android.view.View[1]
      /android.view.View[@content-desc]`);
  }

  get L1Categories() {
    return $$(`//android.widget.ScrollView/android.view.View[2]//android.widget.ImageView[@content-desc]
      , //android.widget.ImageView[@content-desc]`);
  }

  categoryTitleByName(categoryTitle: string) {
    return $(`//android.widget.ScrollView/android.view.View/android.view.View[1]/android.view.View[@content-desc='${categoryTitle}'] 
      | 
      //android.widget.ImageView[@content-desc='${categoryTitle}']
      | 
      //android.view.View[@content-desc='${categoryTitle}']`); 
  }

  pageTitleByName(pageTitle: string) {
    return $(`(//android.view.View[@content-desc='${pageTitle}' and not(@clickable='true')])[1]`);
  }

  pageTitle() {
    return $(`(//android.view.View[@content-desc and not(@clickable='true')])[1]`);
  }
}

