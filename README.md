# Appium Samsung Automation

Samsung ShopApp 자동화 Framework (Appium + TypeScript + WebdriverIO)

> **공유 시점 안내:** 하이브리드 Context/Window helper 정리와 샘플 spec 위주로 작업 중입니다.  
> TC 전체 이식·상세 walkthrough는 추후 회의에서 이어갈 예정입니다.

## Prerequisites

| 항목 | 비고 |
|------|------|
| Node.js | 18 이상 (`package.json` engines) |
| Android 기기/에뮬레이터 | USB 디버깅 ON, `adb devices`에 device 표시 |
| Android SDK platform-tools | `adb` PATH 등록 |
| ShopApp APK | site region에 맞는 패키지 설치 (`config/site.ts`의 package/activity) |

Appium 서버는 `@wdio/appium-service`가 테스트 실행 시 자동으로 띄웁니다.

## 실행 Flow (npm 시작부터)

```text
npm run test:sanity | test:phase3 | test:flagship:* | test:spec
  │
  │  package.json scripts
  │    · cross-env TEST_TYPE=… APP_ENV=…   (sanity/phase3/flagship)
  │    · wdio run wdio.conf.ts [--spec …] [--site …] [--release …] …
  ▼
wdio CLI 기동
  │
  ▼
wdio.conf.ts 로드
  │  1) getRunConfig()
  │       CLI(--site/--env/--release/--report-db) > env(SITE/APP_ENV/…) > defaults
  │  2) loadSite(siteCode)
  │       getAppIdentity → package/activity
  │       data/sites-data/{SITE}.json → 테스트 픽스처
  │       site-features.json → features / searchApiPath
  │  3) getSpecsForTestType(testType)
  │       sanity/phase3 → test/specs/regression/**
  │       flagship      → test/specs/flagship/**
  │       (--spec 있으면 해당 파일만)
  │  4) capabilities에 appPackage / appActivity 설정
  ▼
Appium service 기동  (@wdio/appium-service)
  ▼
Session 생성  (UiAutomator2 ↔ Device)
  ▼
before hook
  │  driver.activateApp(package)
  ▼
Mocha Spec 실행
  │  Page / Service / Locator
  │  context.helper (필요 시 Native ↔ WebView ↔ Window)
  ▼
afterTest
  │  reportDb=true 이면 report.helper → DB 업로드
  ▼
Session 종료 / Appium 종료
```

### Hybrid Context / Window (Spec 내부)

```text
Native (NATIVE_APP)
  │  switchToWebView() / hasAppWebViewContext()
  ▼
WebView context (WEBVIEW_<package>)
  │  switchToWindowByPage('cart'|'bc'|…)
  │    · detailed getContexts → url 매칭
  │    · switchToWindow(webviewPageId)
  ▼
Focused window → Page actions
```

## Quick start

```bash
npm install

# 기기 연결 확인
adb devices

# 기본 site는 config/run.config.ts (CLI로 덮어쓰기 가능)
npm run test:sanity -- --site DE

# 단일 spec
npm run test:spec -- test/specs/sample/test-debug.spec.ts --site AT
```

### Windows PowerShell

`npm`이 `npm.ps1` 실행 정책에 막히면:

```powershell
npm.cmd run test:spec -- test/specs/sample/test-debug.spec.ts --site AT
```

또는 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## 프로젝트 구조

```text
config/
  run.config.ts          ← site / testType / environment / releaseName
  site.ts                ← package/activity, loadSite
  site-features.json     ← site별 features · searchApiPath override
  tc-exclusions.json
data/
  sites-data/{SITE}.json ← 계정·주소·검색 픽스처
  flagship-data/
    skus/{SITE}.json     ← Flagship SKU 카탈로그
    generator/           ← Products.csv, sku-from-csv.ts
test/
  helpers/               ← context, device, env, db, gesture, flagship SKU 로드, …
  pages/ / locators/     ← Page Object
  services/              ← trade-in, sc+, … 도메인 로직
  specs/
    regression/          ← Sanity + Phase3
    flagship/            ← UAT / PostUnpack
    sample/              ← 디버그·샘플
```

## Specs 구조

```text
test/specs/
├── regression/                 ← Sanity + Phase3
│   ├── home/prod-home-01.spec.ts
│   ├── buy/prod-buy-01.spec.ts
│   └── ...
├── flagship/                   ← Flagship (UAT / PostUnpack)
│   ├── uat-app-01.spec.ts
│   └── ...
└── sample/
    └── sample-pf-bc-cart.spec.ts
```

## 실행 설정

`config/run.config.ts` (우선순위: CLI > env > defaults)

| 필드 | 설명 |
|------|------|
| `site` | 대상 사이트 (DE, US, AT, …) |
| `testType` | sanity / phase3 / flagship |
| `environment` | `stg` (Flagship UAT) / `prod` (PostUnpack·Sanity) |
| `releaseName` | DB releaseName |
| `reportDb` | 결과 DB 업로드 on/off |

APK identity: `config/site.ts`의 `getAppIdentity(site)` → region별 **package + activity**.

## 실행

```bash
npm install

npm run test:sanity
npm run test:phase3

# Flagship UAT (STG) — WDS 로그인 가능
npm run test:flagship:uat -- --site DE --release R26

# Flagship PostUnpack (PROD)
npm run test:flagship:postunpack -- --site DE --release R26

# env만 바꿀 때
npm run test:flagship:uat -- --site US --env prod

# 단일 파일
npm run test:spec -- test/specs/sample/sample-pf-bc-cart.spec.ts --site AU
```

### STG (WDS) 로그인

- `environment=stg`일 때만 `LoginPage.wdsLoginIfNeeded()` 동작
- 계정: `test/pages/login.page.ts`의 `WDS_CREDENTIALS` (공유 시 계정 취급 주의)

### DB 결과 업로드

1. `test/helpers/db.helper.ts`의 `REPORT_DB` 설정 (비밀번호 등 커밋/공유 주의)
2. `reportDb: true` 또는 `--report-db`

```bash
npm run test:sanity -- --site DE --release R26 --report-db
```

## Native ↔ WebView (context.helper)

하이브리드 앱은 **Context**와 **Window**를 나눕니다.

| Layer | API | 역할 |
|-------|-----|------|
| Context | `switchToNative` / `switchToWebView` / `hasAppWebViewContext` | `NATIVE_APP` ↔ `WEBVIEW_<package>` |
| Window | `getCurrentWindowUrl` / `switchToWindowByPage` | URL 패턴으로 WebView 안 page(탭) 포커스 |
| Prepare | `prepareWebViewPage` | context + window + layout ready |
| Detect | `getCurrentWebViewPage` / `isCurrentWebViewPage` | Hybris WebView 페이지 판별 (Native context OK, 전환 없음) |

```text
switchToWebView()                         → WEBVIEW_<package> context
switchToWindowByPage('cart')              → cart URL window focus
prepareWebViewPage('bc', layout)          → context + window + layout
getCurrentWebViewPage({ waitMs: 5000 })   → 'bc' | 'pd' | … (PF card 직후 등)
```

- Context wait: Appium `getContexts({ waitForWebviewMs })`
- Window wait/focus: detailed `getContexts`의 `url` + `webviewPageId`로 `switchToWindow`
- Detect: focused URL 또는 detailed contexts URL (`matchPageByUrl`) — context 전환 없음
- Native에서 URL만 볼 때: `device.helper`의 `getBrowserPageList` (Appium context 전환 없음)

## Helpers

| Helper | 용도 |
|--------|------|
| `context.helper` | Native ↔ WebView, window/URL, page detect |
| `device.helper` | `getBrowserPageList`, adb, package version |
| `env.helper` | stg/prod, shop/API base URL |
| `db.helper` + `report.helper` | TC 결과 DB |
| `element` / `gesture` / `validation` | 공통 UI 조작·검증 |
| `LoginPage.wdsLoginIfNeeded` | STG WDS 로그인 |
