# Appium Samsung Automation

삼성 Shop 앱(Android) 자동화 프레임워크입니다.  
**Appium 2 + WebdriverIO 9 + TypeScript + Mocha** 기반이며, 사이트(국가)별 Sanity / Phase3 / Flagship 시나리오를 실행합니다.

> English: [README.en.md](./README.en.md)

---

## 이 문서를 읽는 순서 (신규 합류)

1. [사전 준비](#사전-준비) → 기기·Node·APK 확인  
2. [Quick start](#quick-start) → 한 번 실행해 보기  
3. [프로젝트 구조](#프로젝트-구조) → 어디를 고치면 되는지  
4. [실행 설정](#실행-설정) → `--site`, suite, 포트  
5. [테스트 작성 가이드](#테스트-작성-가이드) → Spec / Page / Locator / Site 데이터  

---

## 사전 준비

| 항목 | 비고 |
|------|------|
| Node.js | **18 이상** (`package.json` engines) |
| Android 기기 또는 에뮬레이터 | USB 디버깅 ON |
| Android SDK platform-tools | `adb`가 PATH에 있어야 함 |
| Shop 앱 APK | 사이트에 맞는 패키지 설치 (아래 APK 표) |

```bash
adb devices          # device 로 보여야 함
node -v              # v18+
```

Appium 서버는 `@wdio/appium-service`가 테스트 실행 시 **자동으로** 띄웁니다. 별도 Appium Desktop 실행은 필요 없습니다.

### APK (패키지)

| 사이트 | package |
|--------|---------|
| 기본(GLOBAL) | `com.samsung.ecomm.global.gbr` |
| CN | `com.jv.samsungeshop` |
| IN | `com.samsung.ecomm.global.in` |
| US | `com.samsung.ecomm` |

정의 위치: `config/site.ts` → `appBySite`

---

## Quick start

```bash
npm install

# Sanity (기본 site는 config/run.config.ts defaults — 보통 CLI로 덮어씀)
npm run test:sanity -- --site AU

# 단일 spec
npm run test:spec -- test/specs/regression/search/prod-search-01.spec.ts --site AU
```

### Windows PowerShell

`npm`이 `npm.ps1` 실행 정책에 막히면:

```powershell
npm.cmd run test:sanity -- --site AU
```

---

## 프로젝트 구조

```text
config/
  run.config.ts           # site / suite / env / release / udid / 포트 (CLI > env > defaults)
  site.ts                 # Site 타입, APK, feature 기본값, loadSite / getSiteData
  site-features.json      # 사이트별 feature·searchApiPath 오버라이드
  tc-exclusions.json      # 사이트별 TC 제외
  test-case.catalog.ts    # TC ID ↔ suite(sanity/phase3/flagship) · required features
  db.config.ts            # 결과 DB (민감 정보 — 공유 주의)

data/
  sites-data/{SITE}.json  # 국가별 픽스처 (고객/배송/product/search …)
  flagship-data/          # Flagship SKU 카탈로그 + CSV generator

test/
  helpers/                # context, device(adb), element, gesture, report, tc-filter …
  locators/               # 셀렉터만
  pages/                  # Page Object (화면 단위 동작)
  services/               # Trade-In / SC+ / SIM / EUP / Trade-Up 등 도메인 로직
  specs/
    regression/           # Sanity + Phase3 (PROD_*)
    flagship/             # Flagship UAT / PostUnpack
    sample/               # 샘플·디버그

wdio.conf.ts              # WDIO 진입점 (capabilities, Appium service, hooks)
```

### 레이어 역할

| 레이어 | 역할 |
|--------|------|
| **Spec** | TC 시나리오 순서만. `runOrSkip`으로 사이트/feature 스킵 |
| **Page** | 화면 단위 동작 (검색, PF 카드, 장바구니 …) |
| **Service** | BC/PD/Cart에 붙는 부가 서비스 (Trade-In, SIM …) |
| **Locator** | 셀렉터 정의 (로직 최소화) |
| **Helper** | 공통 (Native↔WebView, adb, 리포트, 제스처) |
| **sites-data** | 국가별 테스트 데이터 |

---

## 사이트 데이터 (`data/sites-data`)

파일명 = 사이트 코드 (예: `AU.json`, `SA_EN.json`).

`product` / `search` 예시:

```json
{
  "product": {
    "haSku": "…",
    "vdSku": "…",
    "imSku": "SM-…",
    "deviceName": "Galaxy …",
    "color": "…",
    "storage": "…"
  },
  "search": {
    "localKeyword": "watch"
  }
}
```

- `imSku` + `deviceName` / `color` / `storage` → 모바일(IM) 기본 상품·옵션  
- `haSku` / `vdSku` → HA/VD 검색·검증용 (사이트에 따라 생략 가능)  
- `localKeyword` → 현지 검색어 (예: SEARCH_05)  
- 실행 시 API로 유효 SKU가 해석되면 `site.product`에 오버레이됩니다 (`CALL_API` → `api.helper` 캐시)

Feature on/off: `config/site-features.json` (+ `DEFAULT_SITE_FEATURES` in `site.ts`)  
TC 제외: `config/tc-exclusions.json`

---

## 실행 설정

우선순위: **CLI > 환경변수 > `config/run.config.ts` defaults**

| 항목 | CLI / env | 설명 |
|------|-----------|------|
| 사이트 | `--site` / `SITE` | `AU`, `DE`, `US`, … |
| 스위트 | npm script → `TEST_TYPE` | `sanity` / `phase3` / `flagship` |
| 환경 | `--env` / `APP_ENV` | `stg` (Flagship UAT) / `prod` |
| 릴리즈 | `--release` / `RELEASE_NAME` | DB 업로드 시 필수에 가깝게 사용 |
| 결과 DB | `--report-db` / `REPORT_DB` | `true`면 afterTest에서 업로드 |
| 기기 | `--udid` / `UDID` | 여러 대 연결 시 **필수** |
| 포트 | `--appium-port` / `--system-port` / `--chromedriver-port` | 병렬 시 기기마다 다르게 |

### npm scripts

```bash
npm run test:sanity              # TEST_TYPE=sanity, APP_ENV=prod
npm run test:phase3              # TEST_TYPE=phase3, APP_ENV=prod
npm run test:flagship:uat        # flagship + stg
npm run test:flagship:postunpack # flagship + prod
npm run test:spec -- <path>      # 특정 spec만
npm run build                    # tsc --noEmit
```

### 실행 예시

```bash
# Sanity — AU
npm run test:sanity -- --site AU

# Flagship UAT
npm run test:flagship:uat -- --site DE --release 30RC1_SENH

# 단일 TC 파일
npm run test:spec -- test/specs/regression/buy/prod-buy-01.spec.ts --site UK

# 기기 지정
npm run test:sanity -- --site DE --udid R5CTxxxx

# 같은 PC에서 기기 2대 (터미널 2개, 포트·udid 분리)
npm run test:sanity -- --site DE --udid DEVICE_A --appium-port 4723 --system-port 8200 --chromedriver-port 9515
npm run test:sanity -- --site FR --udid DEVICE_B --appium-port 4725 --system-port 8201 --chromedriver-port 9516
```

한 WDIO 프로세스는 기기 **1대** (`maxInstances: 1`). 병렬은 프로세스(터미널)를 여러 개 띄웁니다.

### Spec이 고르는 방식

- `testType=sanity|phase3` → `test-case.catalog.ts`에 등록된 TC만, catalog 순서  
- 파일명 규칙: `PROD_HOME_01` → `prod-home-01.spec.ts`  
- `flagship` → `test/specs/flagship/**/*.ts`  
- Spec 안에서 `runOrSkip('PROD_…')` → feature 미지원·exclusion이면 skip (리포트 N/A)

---

## 실행 Flow (한눈에)

```text
npm run test:* 
  → cross-env TEST_TYPE / APP_ENV
  → wdio run wdio.conf.ts
       · getRunConfig()
       · loadSite(siteCode)  ← sites-data + features + exclusions
       · getSpecsForTestType()
       · Appium service + UiAutomator2 session
  → before: activateApp (+ 필요 시 앱 로딩 대기)
  → Mocha specs (Page / Service / Locator)
  → afterTest: reportDb 이면 DB 업로드
```

---

## 테스트 작성 가이드

### Spec 패턴

```ts
describe('PROD_SEARCH_01', () => {
  const searchPage = new SearchPage();

  it('…', async function () {
    await runOrSkip.call(this, 'PROD_SEARCH_01', async (site) => {
      await searchPage.searchByKeyword(site.search.localKeyword);
      // …
    });
  });
});
```

- 새 TC는 `config/test-case.catalog.ts`에 등록하고, 파일명을 catalog와 맞춥니다.  
- 사이트 분기(`if (siteCode === 'XX')`)는 가능한 한 피하고, **locator/데이터/feature**로 흡수합니다.

### Page / Locator / Service

- UI 조작·검증 → `test/pages/*.page.ts`  
- 셀렉터 → `test/locators/*.locator.ts`  
- Trade-In, SC+, SIM 등 → `test/services/...`  
- Cart Trade-In 팝업은 AEM 팝업과 **분리**되어 있습니다 (`cart-tradein-popup` vs `aem-tradein-popup`).

### Native ↔ WebView

Shop은 하이브리드입니다. `test/helpers/context.helper.ts` 사용:

| API | 용도 |
|-----|------|
| `switchToNative` / `switchToWebView` | Context 전환 |
| `prepareWebViewPage('cart' \| 'bc' \| …)` | WebView + URL 윈도우 + 레이아웃 대기 |
| `getCurrentWebViewPage` | 현재 페이지 판별 (전환 없이) |

### 리포트 / 실패 처리

- `markFailedAndStop` — 치명적 실패, TC 중단  
- `markFailed` — 기록 후 계속, suite 끝에서 실패로 모음  
- DB status: Pass / Fail / N/A / Exception / Planned / OOS (`report.helper`)

### 타입 체크

```bash
npm run build
```

---

## STG (WDS) 로그인

- `environment=stg`일 때 Flagship 등에서 WDS 로그인 경로 사용  
- 계정은 `test/pages/login.page.ts` 쪽 상수 — **공유·커밋 시 계정 취급 주의**

기기 계정 조회(SSO 등): `device.helper`의 `getGoogleAccountEmail` / `getAccountEmail`  
(adb `dumpsys account`, serial은 `deviceUdid()`가 capabilities / runConfig에서 자동 해석)

---

## DB 결과 업로드

1. `config/db.config.ts` 등 DB 접속 정보 준비 (비밀번호·키는 커밋하지 않음 — `.gitignore`의 `config/db.key` 등)  
2. `reportDb` 켜기:

```bash
npm run test:sanity -- --site DE --release R26 --report-db
```

`releaseName`이 비어 있으면 `reportDb` 사용 시 `wdio.conf.ts`에서 에러로 막습니다.

---

## 자주 하는 작업

| 목적 | 위치 |
|------|------|
| 국가 픽스처 수정 | `data/sites-data/{SITE}.json` |
| Feature on/off | `config/site-features.json` |
| TC 제외 | `config/tc-exclusions.json` |
| TC suite 등록 | `config/test-case.catalog.ts` |
| 검색/PF/카트 동작 | `test/pages/search|pf|cart.page.ts` |
| Flagship SKU 생성 | `npm run flagship:skus` (`data/flagship-data/generator`) |

---

## 트러블슈팅

| 증상 | 확인 |
|------|------|
| `adb devices` empty | 케이블/드라이버, 디버깅 허용 |
| 여러 기기인데 session 꼬임 | `--udid` + 포트 분리 |
| PowerShell에서 npm 실패 | `npm.cmd` 사용 |
| WebView 요소를 못 찾음 | Native에 있는지, `prepareWebViewPage` 했는지 |
| TC가 통째로 skip | catalog / `requiresFeatures` / `tc-exclusions` |
| SITE=ALL | 단일 사이트 코드로 실행 (ALL은 work-queue용) |

---

## 참고

- 진입 설정: `config/run.config.ts`, `wdio.conf.ts`  
- 사이트 로드: `config/site.ts`  
- TC 게이트: `test/helpers/tc-filter.helper.ts` (`runOrSkip`)  
- 샘플: `test/specs/sample/`
