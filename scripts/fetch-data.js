/**
 * NADI Data Fetcher
 * ==================
 * Runs server-side (GitHub Actions, local cron, etc.) every 2 hours.
 * Fetches all Malaysian data APIs and saves to /data/*.json
 * The website reads these static JSON files — no live API calls from users.
 *
 * Usage:
 *   node scripts/fetch-data.js
 *
 * Requirements:
 *   node >= 18 (built-in fetch)
 *   No npm dependencies needed!
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BASE_URL = 'https://api.data.gov.my';
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Rate limiting: 4 req/min for data.gov.my
const REQUEST_DELAY = 16000; // 16 seconds between requests = safe under 4/min

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeFetch(url, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[${new Date().toISOString()}] Fetching: ${label} (attempt ${attempt})`);
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'NADI-DataBot/1.0' },
        signal: AbortSignal.timeout(30000)
      });

      if (res.status === 429) {
        console.warn(`  Rate limited on ${label}. Waiting 60s...`);
        await sleep(60000);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log(`  OK: ${label}`);
      return data;
    } catch (err) {
      console.error(`  FAIL: ${label} attempt ${attempt}: ${err.message}`);
      if (attempt < 3) await sleep(5000 * attempt);
    }
  }
  return null;
}

function save(filename, data, meta = {}) {
  if (!data) {
    console.warn(`  SKIP: No data for ${filename}`);
    return false;
  }
  const payload = {
    _meta: {
      fetched_at: new Date().toISOString(),
      source: 'NADI Data Bot',
      ...meta
    },
    data: Array.isArray(data) ? data : (data.data || data)
  };
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  const size = (fs.statSync(filePath).size / 1024).toFixed(1);
  console.log(`  SAVED: ${filename} (${size} KB)`);
  return true;
}

// Dataset Definitions
const CATALOGUE_DATASETS = [
  { key: 'fuel',         file: 'fuel.json',         url: `${BASE_URL}/data-catalogue?id=fuelprice&limit=52&sort=-date`,                 label: 'Fuel Prices' },
  { key: 'exchange',     file: 'exchange.json',      url: `${BASE_URL}/data-catalogue?id=exchangerates_daily_1200&limit=30&sort=-date`,  label: 'Exchange Rates' },
  { key: 'population',   file: 'population.json',    url: `${BASE_URL}/data-catalogue?id=population_malaysia&limit=30&sort=-date`,       label: 'Population' },
  { key: 'gdp',          file: 'gdp.json',           url: `${BASE_URL}/data-catalogue?id=gdp_qtr_real&limit=20&sort=-date`,              label: 'GDP Quarterly' },
  { key: 'inflation',    file: 'inflation.json',     url: `${BASE_URL}/data-catalogue?id=cpi_headline&limit=24&sort=-date`,              label: 'CPI / Inflation' },
  { key: 'unemployment', file: 'unemployment.json',  url: `${BASE_URL}/data-catalogue?id=lfs_month&limit=36&sort=-date`,                 label: 'Unemployment' },
  { key: 'trade',        file: 'trade.json',         url: `${BASE_URL}/data-catalogue?id=trade_sitc_1d&limit=24&sort=-date`,             label: 'Trade Monthly' },
  { key: 'tourism_data', file: 'tourism.json',       url: `${BASE_URL}/data-catalogue?id=arrivals&limit=24&sort=-date`,                 label: 'Tourism Arrivals' },
  { key: 'transport',    file: 'transport.json',     url: `${BASE_URL}/data-catalogue?id=ridership_headline&limit=12&sort=-date`,        label: 'Transit Ridership' },
];

const WEATHER_DATASETS = [
  { key: 'weather_forecast', file: 'weather_forecast.json', url: `${BASE_URL}/weather/forecast`,           label: 'Weather Forecast' },
  { key: 'weather_warnings', file: 'weather_warnings.json', url: `${BASE_URL}/weather/warning`,            label: 'Weather Warnings' },
  { key: 'earthquake',       file: 'earthquake.json',       url: `${BASE_URL}/weather/warning/earthquake`, label: 'Earthquake Warnings' },
  { key: 'flood_warnings',   file: 'flood_warnings.json',   url: `${BASE_URL}/flood-warning?limit=50`,     label: 'Flood Warnings' }
];

const CITIES = [
  { name: 'Kuala Lumpur',     lat: 3.1390, lon: 101.6869, state: 'W.P. Kuala Lumpur' },
  { name: 'Penang',           lat: 5.4141, lon: 100.3288, state: 'Penang' },
  { name: 'Johor Bahru',      lat: 1.4927, lon: 103.7414, state: 'Johor' },
  { name: 'Kota Kinabalu',    lat: 5.9788, lon: 116.0753, state: 'Sabah' },
  { name: 'Kuching',          lat: 1.5533, lon: 110.3592, state: 'Sarawak' },
  { name: 'Alor Setar',       lat: 6.1248, lon: 100.3678, state: 'Kedah' },
  { name: 'Ipoh',             lat: 4.5975, lon: 101.0901, state: 'Perak' },
  { name: 'Shah Alam',        lat: 3.0733, lon: 101.5185, state: 'Selangor' },
  { name: 'Kota Bharu',       lat: 6.1248, lon: 102.2381, state: 'Kelantan' },
  { name: 'Kuala Terengganu', lat: 5.3296, lon: 103.1370, state: 'Terengganu' },
  { name: 'Seremban',         lat: 2.7297, lon: 101.9381, state: 'Negeri Sembilan' },
  { name: 'Melaka',           lat: 2.1896, lon: 102.2501, state: 'Melaka' },
  { name: 'Kangar',           lat: 6.4414, lon: 100.1986, state: 'Perlis' },
  { name: 'Kuala Lipis',      lat: 4.1833, lon: 102.0500, state: 'Pahang' },
  { name: 'Sandakan',         lat: 5.8415, lon: 118.1175, state: 'Sabah' },
  { name: 'Miri',             lat: 4.3995, lon: 113.9914, state: 'Sarawak' }
];

async function fetchOpenMeteoAll() {
  console.log('\nFetching Open-Meteo weather for all cities...');
  const results = [];

  for (const city of CITIES) {
    const params = new URLSearchParams({
      latitude: city.lat,
      longitude: city.lon,
      hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation',
      wind_speed_unit: 'kmh',
      timezone: 'Asia/Kuala_Lumpur',
      forecast_days: 7
    });

    const data = await safeFetch(`${OPEN_METEO_BASE}?${params}`, `Weather: ${city.name}`);
    if (data) results.push({ city, data });
    await sleep(300);
  }

  save('openmeteo_all.json', results, { source: 'Open-Meteo API', cities: CITIES.length });
  return results;
}

async function main() {
  console.log('NADI Data Fetcher - Starting at ' + new Date().toISOString());

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  // Phase 1: Weather (highest priority)
  console.log('\n--- Phase 1: Weather & Safety ---');
  for (const ds of WEATHER_DATASETS) {
    const data = await safeFetch(ds.url, ds.label);
    if (save(ds.file, data, { api_key: ds.key })) successCount++;
    else failCount++;
    await sleep(REQUEST_DELAY);
  }

  // Phase 2: Economic & Social Data
  console.log('\n--- Phase 2: Economic & Social ---');
  for (const ds of CATALOGUE_DATASETS) {
    const data = await safeFetch(ds.url, ds.label);
    if (save(ds.file, data, { api_key: ds.key })) successCount++;
    else failCount++;
    await sleep(REQUEST_DELAY);
  }

  // Phase 3: Open-Meteo (no rate limit)
  console.log('\n--- Phase 3: Open-Meteo Weather ---');
  await fetchOpenMeteoAll();
  successCount++;

  // Write manifest
  const manifest = {
    _meta: {
      generated_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      success: successCount,
      failed: failCount,
      next_refresh: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    },
    datasets: [
      ...WEATHER_DATASETS.map(d => d.file),
      ...CATALOGUE_DATASETS.map(d => d.file),
      'openmeteo_all.json'
    ]
  };
  fs.writeFileSync(path.join(DATA_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const mins = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\nDone! ${successCount} succeeded, ${failCount} failed. Took ${mins} minutes.`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
