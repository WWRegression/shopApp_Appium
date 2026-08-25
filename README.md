# Appium Samsung Automation

Samsung ShopApp 자동화 Framework (Appium + TypeScript + WebdriverIO)

## Specs 구조

```text
test/specs/
├── regression/                 ← Sanity + Phase3
│   ├── home/prod-home-01.spec.ts
│   ├── buy/prod-buy-01.spec.ts
│   └── ...
└── flagship/                   ← Flagship (UAT / PostUnpack)
    ├── uat-app-01.spec.ts
    └── ...
```

## 실행 설정

`config/run.config.ts`

| 필드 | 설명 |
|------|------|
| `site` | 대상 사이트 (DE, US, …) |
| `testType` | sanity / phase3 / flagship |
| `environment` | `stg` (Flagship UAT) / `prod` (PostUnpack·Sanity) |
| `releaseName` | DB releaseName |
| `reportDb` | 결과 DB 업로드 on/off |

APK는 `config/site.ts`의 `getAppIdentity(site)` → **package + activity**를 region별로 함께 반환합니다.

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
```

### STG (WDS) 로그인

- `environment=stg`일 때만 `LoginPage.wdsLoginIfNeeded()` 동작
- 계정: `test/pages/login.page.ts`의 `WDS_CREDENTIALS`

### DB 결과 업로드

1. `test/helpers/db.helper.ts`의 `REPORT_DB.password` 설정
2. `reportDb: true` 또는 `--report-db`

```bash
npm run test:sanity -- --site DE --release R26 --report-db
```

## 데이터 참조

```text
run.config (site / testType / environment / releaseName)
  → site.ts getAppIdentity + loadSite
  → sites/{SITE}.json (features override)
  → tc-exclusions.json
  → specs
```

## Helpers

| Helper | Katalon 대응 | 용도 |
|--------|--------------|------|
| `context.helper` | switchToWebView / switchToWindowByPage / getCurrentWindowUrl | Native ↔ WebView |
| `device.helper` | getBrowserPageList | Browser page list (no Appium switch) |
| `env.helper` | TestEnvContext / API base | stg/prod, URL |
| `db.helper` + `report.helper` | ReportHandler | TC 결과 DB |
| `LoginPage.wdsLoginIfNeeded` | LogIn.wdsLogin | STG WDS 로그인 |
