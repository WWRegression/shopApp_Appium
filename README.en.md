# Appium Samsung Automation

Android automation framework for the Samsung Shop app.  
Built with **Appium 2 + WebdriverIO 9 + TypeScript + Mocha**. Runs Sanity / Phase3 / Flagship scenarios per site (country).

> Korean version: [README.md](./README.md)

---

## How to read this doc (new joiners)

1. [Prerequisites](#prerequisites) — device, Node, APK  
2. [Quick start](#quick-start) — run once  
3. [Project layout](#project-layout) — where to change what  
4. [Run configuration](#run-configuration) — `--site`, suite, ports  
5. [Writing tests](#writing-tests) — Spec / Page / Locator / site data  

---

## Prerequisites

| Item | Notes |
|------|--------|
| Node.js | **18+** (`package.json` engines) |
| Android device or emulator | USB debugging ON |
| Android SDK platform-tools | `adb` on PATH |
| Shop app APK | Install the package for your site (see table below) |

```bash
adb devices          # should show "device"
node -v              # v18+
```

Appium is started automatically by `@wdio/appium-service` when tests run. You do **not** need Appium Desktop separately.

### APK (packages)

| Site | package |
|------|---------|
| Default (GLOBAL) | `com.samsung.ecomm.global.gbr` |
| CN | `com.jv.samsungeshop` |
| IN | `com.samsung.ecomm.global.in` |
| US | `com.samsung.ecomm` |

Defined in: `config/site.ts` → `appBySite`

---

## Quick start

```bash
npm install

# Sanity (default site comes from config/run.config.ts — usually override via CLI)
npm run test:sanity -- --site AU

# Single spec
npm run test:spec -- test/specs/regression/search/prod-search-01.spec.ts --site AU
```

### Windows PowerShell

If `npm` is blocked by the `npm.ps1` execution policy:

```powershell
npm.cmd run test:sanity -- --site AU
```

---

## Project layout

```text
config/
  run.config.ts           # site / suite / env / release / udid / ports (CLI > env > defaults)
  site.ts                 # Site types, APK, default features, loadSite / getSiteData
  site-features.json      # Per-site feature & searchApiPath overrides
  tc-exclusions.json      # Per-site TC exclusions
  test-case.catalog.ts    # TC ID ↔ suite (sanity/phase3/flagship) · required features
  db.config.ts            # Results DB (sensitive — handle carefully when sharing)

data/
  sites-data/{SITE}.json  # Per-country fixtures (customer / shipping / product / search …)
  flagship-data/          # Flagship SKU catalog + CSV generator

test/
  helpers/                # context, device(adb), element, gesture, report, tc-filter …
  locators/               # Selectors only
  pages/                  # Page objects (screen-level actions)
  services/               # Trade-In / SC+ / SIM / EUP / Trade-Up domain logic
  specs/
    regression/           # Sanity + Phase3 (PROD_*)
    flagship/             # Flagship UAT / PostUnpack
    sample/               # Samples & debug

wdio.conf.ts              # WDIO entry (capabilities, Appium service, hooks)
```

### Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Spec** | TC flow only. Skip by site/feature via `runOrSkip` |
| **Page** | Screen actions (search, PF cards, cart …) |
| **Service** | Add-on services on BC/PD/Cart (Trade-In, SIM …) |
| **Locator** | Selectors (minimal logic) |
| **Helper** | Shared (Native↔WebView, adb, reporting, gestures) |
| **sites-data** | Per-country test data |

---

## Site data (`data/sites-data`)

Filename = site code (e.g. `AU.json`, `SA_EN.json`).

Example `product` / `search`:

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

- `imSku` + `deviceName` / `color` / `storage` → default mobile (IM) product & options  
- `haSku` / `vdSku` → HA/VD search & checks (optional per site)  
- `localKeyword` → local search term (e.g. SEARCH_05)  
- At runtime, valid SKUs from the API may overlay `site.product` (`CALL_API` → `api.helper` cache)

Feature flags: `config/site-features.json` (+ `DEFAULT_SITE_FEATURES` in `site.ts`)  
TC exclusions: `config/tc-exclusions.json`

---

## Run configuration

Priority: **CLI > environment variables > `config/run.config.ts` defaults**

| Item | CLI / env | Description |
|------|-----------|-------------|
| Site | `--site` / `SITE` | `AU`, `DE`, `US`, … |
| Suite | npm script → `TEST_TYPE` | `sanity` / `phase3` / `flagship` |
| Environment | `--env` / `APP_ENV` | `stg` (Flagship UAT) / `prod` |
| Release | `--release` / `RELEASE_NAME` | Used when uploading results to DB |
| Results DB | `--report-db` / `REPORT_DB` | Upload in `afterTest` when true |
| Device | `--udid` / `UDID` | **Required** when multiple devices are connected |
| Ports | `--appium-port` / `--system-port` / `--chromedriver-port` | Use different values per device when parallel |

### npm scripts

```bash
npm run test:sanity              # TEST_TYPE=sanity, APP_ENV=prod
npm run test:phase3              # TEST_TYPE=phase3, APP_ENV=prod
npm run test:flagship:uat        # flagship + stg
npm run test:flagship:postunpack # flagship + prod
npm run test:spec -- <path>      # one or more specs
npm run build                    # tsc --noEmit
```

### Examples

```bash
# Sanity — AU
npm run test:sanity -- --site AU

# Flagship UAT
npm run test:flagship:uat -- --site DE --release 30RC1_SENH

# Single TC file
npm run test:spec -- test/specs/regression/buy/prod-buy-01.spec.ts --site UK

# Pin a device
npm run test:sanity -- --site DE --udid R5CTxxxx

# Two devices on one PC (two terminals; separate udid & ports)
npm run test:sanity -- --site DE --udid DEVICE_A --appium-port 4723 --system-port 8200 --chromedriver-port 9515
npm run test:sanity -- --site FR --udid DEVICE_B --appium-port 4725 --system-port 8201 --chromedriver-port 9516
```

One WDIO process = **one** device (`maxInstances: 1`). Parallelism = multiple processes (terminals).

### How specs are selected

- `testType=sanity|phase3` → only TCs listed in `test-case.catalog.ts`, in catalog order  
- File naming: `PROD_HOME_01` → `prod-home-01.spec.ts`  
- `flagship` → `test/specs/flagship/**/*.ts`  
- Inside a spec, `runOrSkip('PROD_…')` skips when the feature is off or the TC is excluded (reported as N/A)

---

## Run flow (overview)

```text
npm run test:* 
  → cross-env TEST_TYPE / APP_ENV
  → wdio run wdio.conf.ts
       · getRunConfig()
       · loadSite(siteCode)  ← sites-data + features + exclusions
       · getSpecsForTestType()
       · Appium service + UiAutomator2 session
  → before: activateApp (+ wait for app load when needed)
  → Mocha specs (Page / Service / Locator)
  → afterTest: DB upload when reportDb is on
```

---

## Writing tests

### Spec pattern

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

- Register new TCs in `config/test-case.catalog.ts` and match the file name to the catalog.  
- Avoid `if (siteCode === 'XX')` when possible; prefer **locators / data / features**.

### Page / Locator / Service

- UI actions & assertions → `test/pages/*.page.ts`  
- Selectors → `test/locators/*.locator.ts`  
- Trade-In, SC+, SIM, etc. → `test/services/...`  
- Cart Trade-In popup is **separate** from the AEM popup (`cart-tradein-popup` vs `aem-tradein-popup`).

### Native ↔ WebView

The Shop app is hybrid. Use `test/helpers/context.helper.ts`:

| API | Purpose |
|-----|---------|
| `switchToNative` / `switchToWebView` | Context switch |
| `prepareWebViewPage('cart' \| 'bc' \| …)` | WebView + URL window + layout ready |
| `getCurrentWebViewPage` | Detect current page (no switch) |

### Reporting / failures

- `markFailedAndStop` — fatal; stop the TC  
- `markFailed` — record and continue; fail at end of suite steps  
- DB status: Pass / Fail / N/A / Exception / Planned / OOS (`report.helper`)

### Typecheck

```bash
npm run build
```

---

## STG (WDS) login

- Used on Flagship (and similar) when `environment=stg`  
- Credentials live in `test/pages/login.page.ts` — **treat carefully when sharing or committing**

Device account lookup (SSO, etc.): `getGoogleAccountEmail` / `getAccountEmail` in `device.helper`  
(adb `dumpsys account`; serial is resolved by `deviceUdid()` from capabilities / runConfig)

---

## Uploading results to DB

1. Prepare DB connection (`config/db.config.ts`, etc.). Do not commit passwords/keys (see `.gitignore`, e.g. `config/db.key`).  
2. Enable `reportDb`:

```bash
npm run test:sanity -- --site DE --release R26 --report-db
```

If `releaseName` is empty while `reportDb` is on, `wdio.conf.ts` throws.

---

## Common tasks

| Goal | Where |
|------|--------|
| Edit country fixtures | `data/sites-data/{SITE}.json` |
| Feature on/off | `config/site-features.json` |
| Exclude TCs | `config/tc-exclusions.json` |
| Register TC suites | `config/test-case.catalog.ts` |
| Search / PF / cart behavior | `test/pages/search\|pf\|cart.page.ts` |
| Generate Flagship SKUs | `npm run flagship:skus` (`data/flagship-data/generator`) |

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `adb devices` empty | Cable/driver, debugging authorization |
| Multi-device session issues | `--udid` + distinct ports |
| npm fails in PowerShell | Use `npm.cmd` |
| Cannot find WebView elements | Still on Native? Did you call `prepareWebViewPage`? |
| Whole TC skipped | catalog / `requiresFeatures` / `tc-exclusions` |
| `SITE=ALL` | Run with a single site code (ALL is for the work-queue runner) |

---

## See also

- Entry config: `config/run.config.ts`, `wdio.conf.ts`  
- Site loading: `config/site.ts`  
- TC gate: `test/helpers/tc-filter.helper.ts` (`runOrSkip`)  
- Samples: `test/specs/sample/`
