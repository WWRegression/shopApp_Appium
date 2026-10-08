import { BACK_BUTTON_XPATH } from './header.locator';
import { getRunConfig } from '../../config/run.config';
import type { Site } from '../../config/site';

/** Shop L0 (Mobiles / Phones / …), all locales. */
const MOBILE_L0 = `//android.widget.ImageView[
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

const WEARABLE_L0 = `//*[@class = 'android.view.View' and (
	@content-desc = '穿戴式裝置' or
	@content-desc = 'Wearables' or
	@content-desc = '智能穿戴' or
	@content-desc = '智能穿戴设备' or
	@content-desc = '可穿戴式裝置' or
	@content-desc = 'Watches'
)]`;

/** Shop L1 (Smartphones / …), all locales. */
const SMARTPHONE_L1 = `//*[@class = 'android.view.View']/descendant::*[@class = 'android.widget.ImageView' and (
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

const WATCH_L1 = `//android.widget.ImageView[
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

/** US-only: "See All X" instead of a named L1 tab. */
const VIEW_ALL_L1 = `//android.widget.ImageView[
	@content-desc="See All Phones" or
	@content-desc="See All TVs" or
	@content-desc="See All Watches"
]`;

export type ShopCategory = 'mobile' | 'watch';

/** L0 banner xpath + L1 tab xpath to reach PF for a shop category. */
interface ShopCategoryPath {
  L0: string;
  L1: string;
}

const DEFAULT_CATEGORY_PATH: Record<ShopCategory, ShopCategoryPath> = {
  mobile: { L0: MOBILE_L0, L1: SMARTPHONE_L1 },
  watch: { L0: MOBILE_L0, L1: WATCH_L1 },
};

const SITE_CATEGORY_PATH: Record<string, Partial<Record<ShopCategory, ShopCategoryPath>>> = {
  HK: { watch: { L0: WEARABLE_L0, L1: WATCH_L1 } },
  HK_EN: { watch: { L0: WEARABLE_L0, L1: WATCH_L1 } },
  MX: { watch: { L0: WEARABLE_L0, L1: WATCH_L1 } },
  CN: { watch: { L0: WEARABLE_L0, L1: WATCH_L1 } },
  US: {
    mobile: { L0: MOBILE_L0, L1: VIEW_ALL_L1 },
    watch: { L0: WEARABLE_L0, L1: VIEW_ALL_L1 },
  },
};

/** Shop footer menus — which ones a site shows is defined in sites-data shopMenuList. */
export type ShopMenu = keyof NonNullable<Site['shopMenuList']>;

/** Customer Support sub-menus that have a Katalon Shop/VerifyMenu page. */
export type ShopSubMenu = 'supportHome' | 'shopQnA' | 'contact' | 'services';

/** Menus whose landing page has a verify locator (`<menu>Page`). */
export type ShopMenuPage = Exclude<ShopMenu, 'customerSupport'> | ShopSubMenu;

export class ShopLocator {
  private readonly site = getRunConfig().siteCode;

  categoryPath(siteCode: string, category: ShopCategory): ShopCategoryPath {
    return SITE_CATEGORY_PATH[siteCode.toUpperCase()]?.[category] ?? DEFAULT_CATEGORY_PATH[category];
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
    return $(`//android.widget.Button[contains(@content-desc, '${pageTitle}')],
      (//android.view.View[@content-desc='${pageTitle}' and not(@clickable='true')])[1]`);
  }

  pageTitle() {
    if (this.site === 'CN') {
      return $(`(//android.view.View[@content-desc and not(@clickable='true')])[1]`);
    }
    return $(`(//android.view.View[@index='0']//android.view.View[@index='1']//android.widget.Button)[1]`);
  }

  /** Katalon Shop/Menus/studentStore */
  get studentStore() {
    return $(
      `//android.view.View[
	@content-desc = 'student store' or
	@content-desc = 'education shop' or
	@content-desc = 'education store' or
	@content-desc = 'samsung education store' or
	@content-desc = 'magasin étudiant' or
	@content-desc = 'beneficios estudiantes' or
	@content-desc = 'tienda estudiantes' or
	@content-desc = 'tienda para estudiantes' or
	@content-desc = 'samsung 教育商店' or
	@content-desc = 'pelajar' or
	@content-desc = 'tienda samsung para estudiantes' or
	@content-desc = 'student' or
	@content-desc = 'tienda oficial para estudiantes' or
	@content-desc = 'sklep samsung dla edukacji' or
	@content-desc = 'loja educação' or
	@content-desc = 'متجر الطالب' or
	@content-desc = 'ร้านค้าสำหรับนักเรียน-นักศึกษา' or
	@content-desc = 'eğitim indirim programı mağazası' or
	@content-desc = '進入教育優惠商店' or
	@content-desc = 'cửa hàng giáo dục'
]`
    );
  }

  /** Katalon Shop/Menus/corporateStore */
  get corporateStore() {
    return $(
      `//android.view.View[
	@content-desc = 'corporate store' or
	@content-desc = 'corporate shop' or
	@content-desc = 'samsung government store' or
	@content-desc = 'متجر موظفي الشركات' or
	@content-desc = 'tienda para alianzas corporativas' or
	@content-desc = 'samsung 合作夥伴商店' or
	@content-desc = 'samsung partnership store' or
	@content-desc = 'samsung ksa corporate' or
	@content-desc = 'iş ortaklarına özel mağaza' or
	@content-desc = 'ưu đãi doanh nghiệp'
]`
    );
  }

  /** Katalon Shop/Menus/inStoreMode */
  get inStoreMode() {
    return $(
      `//android.view.View[
	@content-desc = 'in-store mode' or 
	@content-desc = 'โหมด in-store' or
	@content-desc = 'chế độ cửa hàng'
]`
    );
  }

  /** Katalon Shop/Menus/samsungPlus */
  get samsungPlus() {
    return $(
      `//android.view.View[
	@content-desc = 'samsung +'
]`
    );
  }

  /** Katalon Shop/Menus/samsungCarePlus */
  get samsungCarePlus() {
    return $(
      `//android.view.View[
	@content-desc = 'samsung care+'
]`
    );
  }

  /** Katalon Shop/Menus/samsungLive */
  get samsungLive() {
    return $(
      `//android.view.View[
	@content-desc='Samsung Live' or
	@content-desc = 'samsung live' or
	@content-desc = 'samsung en direct' or
	@content-desc = 'live shop' or
	@content-desc = 'samsung live shopping' or
	@content-desc = 'élő közvetítések' or
	@content-desc = 'liveshop' or
	@content-desc = 'samsung live shop'
]`
    );
  }

  /** Katalon Shop/Menus/moreSamsungApps */
  get moreSamsungApps() {
    return $(
      `//android.view.View[
@content-desc = "more samsung apps" or
@content-desc = "المزيد من تطبيقات سامسونج" or
@content-desc = "weitere samsung-apps" or
@content-desc = "meer samsung apps" or
@content-desc = "plus d'applis samsung" or
@content-desc = "plus d’applications samsung" or
@content-desc = "más aplicaciones samsung" or
@content-desc = "更多三星应用" or
@content-desc = "více aplikací samsung" or
@content-desc = "weitere samsung apps" or
@content-desc = "更多 samsung 應用程式" or
@content-desc = "több samsung alkalmazás" or
@content-desc = "samsung apps lainnya" or
@content-desc = "altre app di samsung" or
@content-desc = "mas apps de samsung" or
@content-desc = "más apps de samsung" or
@content-desc = "więcej aplikacji samsung" or
@content-desc = "mais  apps samsung" or
@content-desc = "mai multe aplicații samsung" or
@content-desc = "fler appar från samsung" or
@content-desc = "แอปอื่นๆ จากซัมซุง" or
@content-desc = "diğer samsung uygulamaları" or
@content-desc = "更多三星的app" or
@content-desc = "các ứng dụng khác của samsung" or
@content-desc="apps   services"
]`
    );
  }

  /** Katalon Shop/Menus/customerSupport */
  get customerSupport() {
    return $(
      `(//*[@class='android.view.View'
    and (
        (contains(@content-desc, 'support') and contains(@content-desc, 'Collapsed')) or
        (contains(@content-desc, 'الدعم') and contains(@content-desc, 'منهار')) or
        (contains(@content-desc, 'support') and contains(@content-desc, 'Zusammengebrochen')) or
        (contains(@content-desc, 'support') and contains(@content-desc, 'Ingestort')) or
        (contains(@content-desc, 'assistance') and contains(@content-desc, 'Effondré')) or
        (contains(@content-desc, 'aide') and contains(@content-desc, 'Effondré')) or
        (contains(@content-desc, 'soporte') and contains(@content-desc, 'Colapsado')) or
        (contains(@content-desc, 'podpora') and contains(@content-desc, 'Zřícený')) or
        (contains(@content-desc, 'asistencia técnica') and contains(@content-desc, 'Colapsado')) or
        (contains(@content-desc, 'guide et solutions') and contains(@content-desc, 'Effondré')) or
        (contains(@content-desc, '支援') and contains(@content-desc, '崩塌')) or
        (contains(@content-desc, 'támogatás') and contains(@content-desc, 'Összeomlott')) or
        (contains(@content-desc, 'dukungan') and contains(@content-desc, 'Runtuh')) or
        (contains(@content-desc, 'supporto') and contains(@content-desc, 'Crollato')) or
        (contains(@content-desc, 'pomoc') and contains(@content-desc, 'Zawalony')) or
        (contains(@content-desc, 'suporte') and contains(@content-desc, 'Colapsado')) or
        (contains(@content-desc, 'asistenţă') and contains(@content-desc, 'Prăbușit')) or
        (contains(@content-desc, 'support') and contains(@content-desc, 'Kollapsad')) or
        (contains(@content-desc, 'สนับสนุน') and contains(@content-desc, 'ยุบตัว')) or
        (contains(@content-desc, 'destek') and contains(@content-desc, 'Çökmüş')) or
        (contains(@content-desc, 'hỗ trợ') and contains(@content-desc, 'Sụp đổ')) or
        (contains(@content-desc, 'שירות לקוחות') and contains(@content-desc, 'Collapsed')) or
        contains(@content-desc, 'digital service center')

    )
])`
    );
  }

  /** Katalon Shop/VerifyMenu/studentStore */
  get studentStorePage() {
    return $(
      `${BACK_BUTTON_XPATH}/following-sibling::android.view.View[
	@content-desc = 'Education Offers' or 
	@content-desc = 'Student Store' or 
	@content-desc = 'Student store' or 
	@content-desc = 'Samsung Education Shop' or
	@content-desc = 'Samsung Student Store' or
	@content-desc = 'Promotion' or
	@content-desc = 'Sklep Samsung dla Edukacji' or
	@content-desc = '教育優惠商店' or
	@content-desc = 'متجر الطالب'
] |
//android.view.View[
	@content-desc = 'EPPLoginEDU' or
	@content-desc = 'Vérifiez votre courriel d’étudiant' or
	@content-desc = 'Prepárate para la vida en el campus' or
	@content-desc = 'Club Samsung Estudiantes' or
	@content-desc = 'Gear up for  school life' or
	@content-desc = 'Verifikasi email pelajar kamu' or
	@content-desc = 'preparate para la vida en el campus' or
	@content-desc = 'epp_educationMKV' or
	@content-desc = 'EDU EPP MKV' or
	@content-desc = 'Prepárate para la vida académica' or
	@content-desc = 'Verifique o seu email de estudante' or
	@content-desc = 'Education site' or
	@content-desc = 'ยืนยันอีเมลนักเรียนของคุณ' or
	@content-desc = 'Welcome to Samsung for Education Store' or
	@content-desc = 'Confirma o teu email de estudante' or
	@content-desc = 'Verify your student email address' or
	@content-desc = 'Verifica tu correo electrónico de estudiante' or
	@content-desc = 'Verify your Student email' or
	@content-desc = 'تحقق من البريد الإلكتروني للطالب' or
	@content-desc = 'Verifica tu correo estudiantil' or
	@content-desc = 'Xác nhận email của bạn' or
	@content-desc = 'Verifica tu correo' or
	@content-desc = 'Verify your student email' or
	@content-desc = 'قم بتأكيد بريدك الإلكتروني ' or
	@content-desc= '教職員優惠7折起' or
	contains(@content-desc, 'Login to access student')
] |
//android.widget.TextView[contains(@text, "Eğitim İndirim Programı’na kaydolmak")]`
    );
  }

  /** Katalon Shop/VerifyMenu/corporateStore */
  get corporateStorePage() {
    return $(
      `${BACK_BUTTON_XPATH}/following-sibling::android.view.View[
	@content-desc='Corporate Store' or 
	@content-desc='Corporate offer' or 
	@content-desc='Samsung Corporate Shop' or
    @content-desc= 'التحقق من البريد الإلكتروني لشركتك' or
	@content-desc='İş Ortaklarına Özel Mağaza'
] |
//android.view.View[
	@content-desc = 'Verify your Corporate email' or
	@content-desc = 'GOVLoginEDU' or
	@content-desc = 'Potencia tu trabajo con Samsung' or
	@content-desc = '驗證您的企業電郵' or
	@content-desc= 'Verifica tu correo corporativo' or
	@content-desc='Xác nhận email của bạn' or
	@content-desc='Hesabınızı doğrulayın'
]`
    );
  }

  /** Katalon Shop/VerifyMenu/inStoreMode */
  get inStoreModePage() {
    return $(
      `//android.view.View[(
	contains(@content-desc, 'In-Store Mode!') or
	contains(@content-desc, 'โหลด In-Store!') or
	contains(@content-desc, 'Chế độ cửa hàng!')
) and .//android.widget.Button ]`
    );
  }

  /** Katalon Shop/VerifyMenu/samsungPlus */
  get samsungPlusPage() {
    return $(
      `//android.webkit.WebView[contains(@text, 'Samsung +')]`
    );
  }

  /** Katalon Shop/VerifyMenu/samsungCarePlus */
  get samsungCarePlusPage() {
    return $(
      `//android.webkit.WebView[contains(@text, 'Samsung Care+')]`
    );
  }

  /** Katalon Shop/VerifyMenu/samsungLive */
  get samsungLivePage() {
    return $(
      `//android.webkit.WebView[
	contains(@text, 'Samsung Live') or
	contains(@text, 'Live Shopping') or
	contains(@text, 'Live Shop') or
	contains(@text, 'LiveShop')
] |
 ${BACK_BUTTON_XPATH}/following-sibling::android.view.View[@content-desc='Samsung Live'] |
 //android.view.View[@content-desc='Live Shop'] |
 //android.widget.Button[contains(@content-desc, 'Live Shop')]`
    );
  }

  /** Katalon Shop/VerifyMenu/moreSamsungApps */
  get moreSamsungAppsPage() {
    return $(
      `//android.widget.ImageView[
	contains(@content-desc, 'Samsung Health') or
	contains(@content-desc, '三星健康') or
	contains(@content-desc, 'Samsung Members')
]`
    );
  }

  /** Katalon Shop/VerifyMenu/supportHome */
  get supportHomePage() {
    return $(
      `//android.webkit.WebView[
    contains(@text, 'Product Help & Support') or
    contains(@text, 'مساعدة ودعم المنتج') or
    contains(@text, 'دعم المنتج') or
    contains(@text, 'Hilfe & Support für Produkte') or
    contains(@text, 'Hilfe und Support für Samsung Produkte') or
    contains(@text, 'Hulp en ondersteuning voor producten') or
    contains(@text, 'Aide et assistance produit') or
    contains(@text, 'Aide et assistance : produits') or
    contains(@text, 'Ayuda y soporte del producto') or
    contains(@text, 'Ayuda y soporte') or
    contains(@text, 'Soporte y ayuda con tus productos Samsung') or
    contains(@text, 'Soporte Remoto') or
    contains(@text, 'Podpora a nápověda k produktům') or
    contains(@text, 'Pomoc dotycząca') or
    contains(@text, 'assistência técnica') or
    contains(@text, 'Ajutor și asistență pentru produs') or
    contains(@text, 'Produktdesign och Support') or
    contains(@text, 'ความช่วยเหลือและการสนับสนุนผลิตภัณฑ์ซัมซุง') or
    contains(@text, 'Ürün Yardımı ve Destek') or
    contains(@text, 'Trợ giúp và hỗ trợ sản phẩm') or
    contains(@text, '產品支援') or
    contains(@text, 'Terméktámogatás') or
    contains(@text, 'Samsung Product Helps & Online Support') or
    contains(@text, 'תמיכה')
] | //android.widget.TextView[contains(@text, 'Supporto')]
|
//android.webkit.WebView[contains(@text, 'Temukan Bantuan & Support Produk')]//.//android.widget.Image[@content-desc='Samsung Support']
|
//android.webkit.WebView[contains(@text, 'Ayuda y soporte')]/.//android.widget.Image[@content-desc='Soporte Samsung']
|
//android.webkit.WebView[contains(@text, 'Contattaci | Supporto ufficiale Samsung')]//.//android.widget.TextView[@text='Contattaci']
|
//android.webkit.WebView[contains(@text, 'Support Home') and @package='com.android.chrome']`
    );
  }

  /** Katalon Shop/VerifyMenu/shopQnA */
  get shopQnAPage() {
    return $(
      `//android.webkit.WebView[
    contains(@text, 'Samsung Online Shop Support') or
    contains(@text, 'Shop FAQ') or
    contains(@text, 'Soutien aux achats en ligne Samsung') or
    contains(@text, 'Soporte de la tienda en línea de Samsung') or
    contains(@text, 'Soporte de la Tienda Samsung') or
    contains(@text, 'Samsung podpora e-shopu') or
    contains(@text, 'FAQ Shop - Assistance Samsung Shop') or
    contains(@text, 'Samsung webáruház támogatás') or
    contains(@text, 'FAQ Toko Online Samsung') or
    contains(@text, 'Supporto Samsung Shop') or
    contains(@text, 'Wsparcie sklepu internetowego') or
    contains(@text, 'Suporte Loja Samsung') or
    contains(@text, 'asistenta magazin online') or
    contains(@text, 'FAQ คำถามที่พบบ่อย - Samsung Online Shop') or
    contains(@text, 'Samsung Online Mağaza Desteği') or
    contains(@text, '三星商城常見問題') or
    contains(@text, 'Samsung Online Shop Help & Support FAQs') or
    contains(@text, 'Hỗ trợ cửa hàng trực tuyến Samsung') or
    contains(@text, 'תמיכת Samsung ישראל | Samsung ישראל') or
    contains(@text, 'Sıkça Sorulan Sorular')
]
|
//android.widget.TextView[contains(@text, 'Frequently asked questions') and @package='com.android.chrome']`
    );
  }

  /** Katalon Shop/VerifyMenu/contact */
  get contactPage() {
    return $(
      `//android.webkit.WebView[
    contains(@text, 'Contact Us') or
    contains(@text, 'help contact us') or
    contains(@text, 'Help&Contact Us') or
    contains(@text, 'Help & Contact Us') or
    contains(@text, 'Kontaktiere uns') or
    contains(@text, 'Neem contact op met onze support afdeling') or
    contains(@text, 'Neem contact op') or
    contains(@text, 'Contactez-nous') or
    contains(@text, 'Ayuda y soporte del producto') or
    contains(@text, 'Ayuda y contacto') or
    contains(@text, 'Ayuda y soporte') or
    contains(@text, 'Contáctanos') or
    contains(@text, 'Kontaktuj nás') or
    contains(@text, 'Samsung Kontakt') or
    contains(@text, 'Atención al Cliente') or
    contains(@text, 'Contact Samsung') or
    contains(@text, 'NZ Online Support and Customer Service') or
    contains(@text, 'Kontakt z nami') or
    contains(@text, 'Contacte-nos') or
    contains(@text, 'Contact | Ajutor și asistență') or
    contains(@text, 'تواصل معنا') or
    contains(@text, 'Contact Us for Support') or
    contains(@text, 'Kontakta oss') or
    contains(@text, 'Contact Us - Call, Email, or Chat with Us Online') or
    contains(@text, 'ช่องทางติดต่อสอบถามเกี่ยวกับผลิตภัณฑ์ซัมซุง') or
    contains(@text, 'Trợ giúp và Liên hệ') or
    contains(@text, 'SAMSUNG | 三星電子 香港') or
    contains(@text, 'Lépj velünk kapcsolatba') or
    contains(@text, "צור קשר")
]
|
//android.webkit.WebView[contains(@text, 'Temukan Bantuan & Support Produk')]//.//android.widget.TextView[@text='Chat']
|
//android.webkit.WebView[contains(@text, 'Contattaci | Supporto ufficiale Samsung')]//.//android.widget.TextView[@text='Contattaci']
|
//android.webkit.WebView[contains(@text, 'Ayuda y soporte')]/.//android.view.View[contains(@resource-id, 'contact')]
|
//android.webkit.WebView[contains(@text, 'Contact Us') and @package='com.android.chrome']`
    );
  }

  /** Katalon Shop/VerifyMenu/services */
  get servicesPage() {
    return $(
      `//*[@class = 'android.view.View' and @content-desc = 'Online Support']`
    );
  }

  /** Footer menu by its shopMenuList key. */
  shopMenu(menu: ShopMenu) {
    return this[menu];
  }

  /** Katalon Shop/VerifyMenu — landing page of the menu. */
  shopMenuPage(menu: ShopMenuPage) {
    return this[`${menu}Page`];
  }

  /**
   * Customer Support items, counted at runtime.
   * Expanded footer: clickable rows after the (non-clickable) footer menus.
   * Online Support page (digital service center): clickable tiles.
   */
  get customerSupportItems() {
    return $$(
      `//android.view.View[@clickable = 'true' and preceding-sibling::android.view.View[@clickable = 'false' and @content-desc != '']]
      | //android.view.View[@content-desc = 'Online Support']//android.widget.ImageView[@clickable = 'true']`
    );
  }

  /** Customer Support item at `index` (0-based), same match as customerSupportItems. */
  customerSupportItem(index: number) {
    return this.customerSupportItems[index];
  }

  /** Katalon Shop/Menus/subMoreSamsungApps */
  moreSamsungAppIcon(name: string) {
    return $(`//android.widget.ImageView[starts-with(@content-desc,'${name}')]`);
  }

  get moreSamsungAppIcons() {
    return $$('//android.widget.ImageView[@content-desc]');
  }

  /**
   * Shop footer country row. UK dump: android.view.View content-desc="country/united kingdom".
   * Not a Button, and the label is lowercase with a slash.
   */
  get countryMenu() {
    return $(
      `//android.view.View[
        contains(@content-desc, 'country/') or
        contains(@content-desc, 'pays/') or
        contains(@content-desc, 'país/') or
        contains(@content-desc, 'paese/') or
        contains(@content-desc, 'land/') or
        contains(@content-desc, 'negara/') or
        contains(@content-desc, 'البلد') or
        contains(@content-desc, 'الدولة') or
        contains(@content-desc, '國家')
      ]`
    );
  }

  /** Country picker row. Full label, including the parenthesis, e.g. "Chile (Español)". */
  countryListItem(countryName: string) {
    const name = countryName.replace(/'/g, '');
    return $(`//android.widget.RadioButton[contains(@content-desc, '${name}')]`);
  }

  /** Katalon Initialization/continueBtn — confirm on the country list. */
  get countryContinueButton() {
    return $(
      `//android.widget.Button[
        @content-desc = 'Continue' or
        @content-desc = 'Ok' or
        @content-desc = 'OK' or
        @content-desc = 'ACEPTAR' or
        @content-desc = 'Weiter' or
        @content-desc = 'Continuar' or
        @content-desc = 'Siguiente' or
        @content-desc = 'Next' or
        @content-desc = 'Következő' or
        @content-desc = 'Onayla'
      ]`
    );
  }
}
