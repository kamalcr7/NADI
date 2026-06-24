# KTMY v1.2 — Changelog & Developer Guide

**Release date:** 2026-06-23

---

## What's New in v1.2

### 1. TNB Electricity Tariffs Section (`#tariffs`)
A comprehensive, tabbed reference for all Tenaga Nasional Berhad (TNB) electricity tariff categories:

| Tab | Content |
|---|---|
| **Residential (Domestic)** | 5-tier progressive tariff table (RM 0.218/kWh → RM 0.571/kWh), incl. rebate/threshold details |
| **Commercial** | Low voltage, Medium voltage, High voltage rate cards |
| **Industrial** | 3-tier progressive rates by voltage category |
| **Agriculture** | Flat rate card (RM 0.335/kWh) |

- **Data source:** `data/tnb_tariffs.json` (curated static data)
- **Section module:** `js/sections/tariffs.js`
- **No API** — TNB publishes tariffs as PDFs; this data is manually curated and updated when rates change.

### 2. Enhanced Government Incentives Section (`#government`)
Upgraded from a simple placeholder to a full 5-tab incentive directory:

| Tab | Programs |
|---|---|
| **Social Aid & Subsidies** | STR (Sumbangan Tunai Rahmah), Targeted Diesel Subsidy, BSH |
| **Education Loans** | BAP, PTPTN, JPA Scholarship, MARA Scholarship, Bank Negara Scholarship, HRD Corp Training |
| **SME Grants** | SME Digitalisation Grant, SME Corp Advisory |
| **Healthcare** | PeKa B40, mySalam, MySejahtera, Talian Kasih |
| **EPF & Retirement** | EPF i-Saraan, EPF i-Suri |

- **Data source:** `data/incentives.json` (curated static data)
- **Section module:** `js/sections/government.js`
- Budget summary cards (RM 339.7B revenue, RM 421.0B expenditure, -19.3% deficit) remain.

### 3. Transport Fares Data (`data/transport_fares.json`)
- Curated fare reference data for LRT, MRT, monorail, KTM, bus, and e-hailing services
- Loaded by DataStore but not yet rendered in the transport section UI (planned for v1.3)

### 4. Fetch Script Upgrade (`scripts/fetch-data.js`)
Phase 4 added to the cron pipeline:
- **Curated data guard:** Never overwrites existing `tnb_tariffs.json`, `incentives.json`, or `transport_fares.json` — only creates them if missing
- New datasets included in `data/manifest.json`

---

## Architecture Overview (for developers / agents)

```
┌─────────────────────────────────────────────────────────┐
│                    Data Pipeline                         │
│                                                         │
│  GitHub Actions cron (every 2h)                         │
│       │                                                 │
│       └──► scripts/fetch-data.js                        │
│            ├── Phase 1: Weather (data.gov.my)            │
│            ├── Phase 2: Economic/Social (data.gov.my)   │
│            ├── Phase 3: Open-Meteo (weather details)    │
│            └── Phase 4: Curated static data (guard)     │
│                     │                                   │
│                     ▼                                   │
│              data/*.json (committed to git)             │
│                     │                                   │
│                     ▼                                   │
│  Cloudflare Pages auto-deploys on push                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Frontend                              │
│                                                         │
│  index.html (SPA shell)                                │
│       │                                                 │
│       ├── js/datastore.js (KtmyStore)                  │
│       │     Loads data/*.json via fetch()               │
│       │     Caches in localStorage (prefix: ktmy_v7_)  │
│       │     Event pattern: KtmyStore.on(key, callback) │
│       │                                                 │
│       ├── js/app.js (Router)                           │
│       │     Hash routing: #government, #tariffs, etc.   │
│       │     Tab switching + lazy module init            │
│       │                                                 │
│       └── js/sections/*.js (Modules)                   │
│             Each exports: KtmySections.<name>.init()    │
│             Subscribe to data via KtmyStore.on()        │
│             Render HTML into #section-<name>-content    │
└─────────────────────────────────────────────────────────┘
```

---

## How to Add a New Content Section

### Step 1: Create the data file
```json
// data/my_new_data.json
{
  "_meta": {
    "fetched_at": "2026-06-23T00:00:00Z",
    "source": "Manual curation or API"
  },
  "data": {
    "your_key": [...]
  }
}
```

### Step 2: Register in DataStore
In `js/datastore.js`, add the key to the `DATASETS` array:
```js
{ key: 'my_new_data', file: 'my_new_data.json', label: 'My New Data' },
```

### Step 3: Create the section module
```js
// js/sections/my_section.js
(function() {
  'use strict';
  let initialized = false;

  function init() {
    const container = document.getElementById('section-my-section-content');
    if (!container || initialized) return;
    initialized = true;

    KtmyStore.on('my_new_data', (data, status) => {
      if (status === 'loading' || !data) {
        container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
        return;
      }
      renderSection(container, data);
    });
  }

  function renderSection(container, data) {
    // Build HTML and insert
    container.innerHTML = `<div class="section-header">...</div>`;
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.my_section = { init };
})();
```

### Step 4: Register in app.js
Add to the `TABS` object:
```js
my_section: { label: 'My Section', modules: ['my_section'] },
```

### Step 5: Add to index.html
1. **Sidebar nav link:**
```html
<a class="tab-link" href="#my_section">🆕 My Section</a>
```

2. **Tab content container:**
```html
<div class="tab-content" id="tab-my_section">
  <div id="section-my-section-content"></div>
</div>
```

3. **Script tag** (with cache-busting version):
```html
<script src="js/sections/my_section.js?v=8"></script>
```

### Step 6: Bump cache version
In `index.html`, update all `?v=7` to `?v=8` (or new version).

---

## Data Update Strategy

### API-fed data (automatic)
These datasets are fetched every 2 hours by the cron job from live APIs:
- Fuel prices, exchange rates, GDP, CPI, unemployment, trade, tourism, transport ridership
- Weather forecasts, warnings, earthquakes, floods
- Open-Meteo weather for 16 Malaysian cities

### Curated/static data (manual update)
These datasets contain hand-curated content that doesn't have public APIs:
- `tnb_tariffs.json` — Update when TNB announces new rates
- `incentives.json` — Update when government announces new incentives or changes eligibility
- `transport_fares.json` — Update when transport operators change fares

**To update curated data:**
1. Edit the JSON file directly in `data/`
2. Commit and push — Cloudflare Pages auto-deploys
3. Or: edit via GitHub web UI

**The fetch script will NOT overwrite these files** — it only creates them if they don't exist.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `data/tnb_tariffs.json` | TNB electricity tariffs (5-tier residential, commercial, industrial, agriculture) |
| `data/incentives.json` | Government incentives directory (STR, PTPTN, PeKa B40, EPF schemes, etc.) |
| `data/transport_fares.json` | Public transport fare reference data |
| `js/sections/tariffs.js` | TNB Tariffs section renderer |
| `js/sections/government.js` | Government Incentives section renderer (5-tab directory) |
| `js/datastore.js` | Central data manager — loads all JSON, caches in localStorage |
| `js/app.js` | SPA router and tab switcher |
| `scripts/fetch-data.js` | Server-side data fetcher (GitHub Actions cron, every 2h) |
| `CHANGES-v1.2.md` | This file |

---

## Deployment

- **Hosting:** Cloudflare Pages (project: `ktmy-malaysia`)
- **Domain:** `ktmy.kamalrajnaidu.com` (CNAME → ktmy-malaysia.pages.dev)
- **Deploy trigger:** Any git push to `main` branch
- **Data refresh:** GitHub Actions cron every 2 hours → fetch script → commit data → Pages auto-deploys
