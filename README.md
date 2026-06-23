# NADI — Malaysia's All-in-One Data Dashboard

NADI is a premium, high-fidelity, real-time open data dashboard for Malaysia. It aggregates meteorological, economic, financial, demographic, social, and transit indicators into a responsive, unified tabbed interface.

---

## 🏗️ Architecture & Data Flow

NADI is built with a **Static-First, Server-Side Aggregation** model. It separates data retrieval from frontend rendering to maximize speed, eliminate API rate limits, and ensure 100% availability.

```mermaid
graph TD
    A[data.gov.my API] -->|scripts/fetch-data.js| C(Static data/*.json Files)
    B[Open-Meteo API] -->|scripts/fetch-data.js| C
    C -->|Fetch on page load| D[js/datastore.js]
    D -->|Local Storage Cache| D
    D -->|NadiStore.on| E[js/sections/*.js Modules]
    E -->|Render HTML & Draw Charts| F[Browser DOM]
```

### 1. The Data Bot (`scripts/fetch-data.js`)
*   **Role**: Runs server-side (via GitHub Actions cron or local schedule) every 2 hours.
*   **Function**: Pulls raw endpoints from `data.gov.my` and `Open-Meteo`, formats them, adds metadata (timestamp and source), and saves them directly to `data/*.json` files.
*   **Rate Limits**: Respects the official API rate limit (max 4 requests per minute) by incorporating a sequential 16-second delay between requests.

### 2. The DataStore (`js/datastore.js`)
*   **Role**: The frontend state manager.
*   **Caching Strategy**: On page load, it fetches the static `/data/*.json` files. It saves successful queries to `localStorage` (prefix: `nadi_v7_`).
*   **Fallbacks**: If a static file is missing or corrupted, it automatically attempts a direct fallback fetch to the live `data.gov.my` API as a last resort.

### 3. Cache-Busting Mechanism
*   **Script Cache-Busting**: Browsers heavily cache static Javascript files. To force immediate updates, all scripts in `index.html` include a versioned query parameter (e.g., `js/sections/economy.js?v=7`).
*   **Local Storage Invalidation**: Bumping the `STORE_VERSION = 'v7'` in `datastore.js` changes the `localStorage` prefix to `nadi_v7_`, instantly evicting stale cached objects across all client browsers.

---

## 📂 Project Structure

```
├── data/                    # Pre-fetched static JSON datasets
│   ├── fuel.json            # Fuel prices
│   ├── exchange.json        # Exchange rates
│   ├── gdp.json             # GDP quarterly
│   ├── inflation.json       # CPI / Inflation
│   ├── unemployment.json    # Unemployment
│   ├── trade.json           # Trade monthly
│   ├── tourism.json         # Tourism arrivals
│   ├── transport.json       # Transit ridership
│   ├── population.json      # Population data
│   ├── weather_forecast.json
│   ├── weather_warnings.json
│   ├── earthquake.json
│   ├── flood_warnings.json
│   ├── openmeteo_all.json   # Open-Meteo weather for 16 cities
│   ├── tnb_tariffs.json     # TNB electricity tariffs (v1.2, curated)
│   ├── incentives.json      # Government incentives directory (v1.2, curated)
│   ├── transport_fares.json # Transport fare reference (v1.2, curated)
│   └── manifest.json        # Fetch metadata
├── css/                     # Styling sheet hierarchy
│   ├── index.css            # Base styles, variables, typography, and theme tokens
│   ├── components.css       # Cards, tables, loaders, alerts, and navigation styles
│   └── responsive.css       # Mobile and tablet layouts
├── js/                      # Frontend Logic
│   ├── sections/            # Tab-specific UI renderers
│   │   ├── hero.js          # Overview page
│   │   ├── weather.js       # Live weather mapping and forecasts
│   │   ├── economy.js       # GDP, CPI, and external trade charts
│   │   ├── population.js    # Demographics and growth trend
│   │   ├── employment.js    # Labour force and unemployment
│   │   ├── transport.js     # Public transit aggregation
│   │   ├── tariffs.js       # TNB electricity tariffs (v1.2)
│   │   ├── government.js    # Government incentives & support directory (v1.2)
│   │   └── ...              # Other sectors (fuel, prices, safety, etc.)
│   ├── api.js               # API fetch helper utility
│   ├── datastore.js         # Unified datastore manager
│   ├── i18n.js              # Localization (English and Bahasa Malaysia translations)
│   ├── charts.js            # Wrapper functions around Chart.js
│   ├── animations.js        # Scroll reveal and UI micro-animations
│   └── app.js               # Global router and navigation handler
├── scripts/                 # Server-side scripts
│   └── fetch-data.js        # Node.js data collector cron bot
├── index.html               # Main dashboard shell
└── package.json             # Dev server config & script definitions
```

---

## What's New in v1.2

*   **TNB Electricity Tariffs** — Full residential 5-tier progressive rate table, plus commercial, industrial, and agriculture tariffs.
*   **Government Incentives Directory** — 5-tab directory covering social aid (STR, BSH), education (PTPTN, JPA, MARA), SME grants, healthcare (PeKa B40, mySalam), and EPF retirement schemes.
*   **Transport Fares Data** — Curated fare reference for LRT, MRT, monorail, KTM, bus, and e-hailing.
*   **Fetch Script Phase 4** — Cron now guards curated data files (never overwrites hand-curated content).
*   **Comprehensive Documentation** — `CHANGES-v1.2.md` with architecture overview, developer guide, and instructions for adding new sections.

See `CHANGES-v1.2.md` for full details.

---

## 🔀 Section Module Integration

Each module in `js/sections/` implements a standard lifecycle:
1.  **Registering**: Appends itself to the global `window.NadiSections` namespace.
2.  **Initializing (`init`)**: Sets up DOM containers and subscribes to data keys in `NadiStore`.
3.  **Rendering (`renderSection`)**: Sorts, filters, scales metrics, inserts layouts, and calls `NadiCharts` wrappers to draw canvas charts.
4.  **Localizing (`translate`)**: Re-renders text and formats numbers when language toggles are clicked.

### Example: Economy Section (`js/sections/economy.js`)
*   **Data Key**: Subscribes to `gdp`, `inflation`, and `trade`.
*   **Parsing Details**:
    *   Filters raw `gdp` to `series === 'abs'` for absolute quarterly values.
    *   Extracts `growth_yoy` directly from the raw DOSM YoY series.
    *   Filters raw `inflation` to `division === 'overall'` to display headline CPI.

### Example: Public Transport Section (`js/sections/transport.js`)
*   **Data Key**: Subscribes to `transport`.
*   **Aggregation**: Merges 365 daily logs into monthly groups. It sums the 10 rail subsystems (`rail_ets`, `rail_lrt_kj`, `rail_mrt_pjy`, etc.) and 3 bus networks (`bus_rkl`, `bus_rkn`, `bus_rpn`) to show overall monthly boardings in Millions.

---

## 🌐 Localization (i18n)

*   `js/i18n.js` contains a comprehensive lookup dictionary for English (`en`) and Bahasa Malaysia (`bm`).
*   Translate static HTML elements using the `data-i18n="key"` attribute.
*   Translate dynamic elements inside scripts by calling `NadiI18n.t('key')` or `NadiI18n.getLang()`.

---

## 🚀 Running Locally

### Prerequisites
*   Node.js (version 18 or higher)

### Setup & Run
1.  Clone the repository:
    ```bash
    git clone https://github.com/kamalcr7/NADI.git
    cd NADI
    ```
2.  Install development dependencies (uses `http-server` locally):
    ```bash
    npm install
    ```
3.  Refresh static data locally (optional):
    ```bash
    npm run fetch-data
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    Open **http://127.0.0.1:3500** in your browser.

---

## 💡 Developer Guidelines for Agents & Collaborators

When modifying NADI, preserve these core design guidelines:
1.  **Keep it Static-First**: Do not introduce direct live API fetches in the frontend code. If you add a new API feature, add it to `scripts/fetch-data.js` first, save it to `data/`, and fetch it via `NadiStore.on()`.
2.  **Filter Dimension Datasets**: Catalogue datasets from `data.gov.my` often merge absolute values, QoQ, YoY, and individual divisions. Always filter records (e.g. `series === 'abs'`, `division === 'overall'`) before drawing charts to avoid oscillation bugs.
3.  **Scale Correctly**: Be mindful of units. The raw APIs report some statistics in absolute figures, some in thousands, and some in millions. Document the scaling conversions in your modules.
4.  **Bust the Cache**: If you change any dynamic logic in a script file, bump the version query parameter in `index.html` (e.g., change `?v=7` to `?v=8`) and the `STORE_VERSION` in `datastore.js`.
