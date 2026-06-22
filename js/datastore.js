/* ============================================================
   NADI — DataStore v2 (Static JSON-First)
   ============================================================
   Priority order:
   1. /data/*.json  — pre-fetched by GitHub Actions cron (server-side)
   2. localStorage  — cached in-browser from last successful load
   3. Live API      — last resort fallback only
   ============================================================ */

(function () {
  'use strict';

  const STORE_VERSION = 'v4';
  const LS_PREFIX = `nadi_${STORE_VERSION}_`;

  /* --- File Map: dataset key → static JSON path --- */
  const DATA_FILES = {
    fuel:             '/data/fuel.json',
    exchange:         '/data/exchange.json',
    population:       '/data/population.json',
    gdp:              '/data/gdp.json',
    inflation:        '/data/inflation.json',
    unemployment:     '/data/unemployment.json',
    tourism_data:     '/data/tourism.json',
    trade:            '/data/trade.json',
    weather_forecast: '/data/weather_forecast.json',
    weather_warnings: '/data/weather_warnings.json',
    earthquake:       '/data/earthquake.json',
    flood_warnings:   '/data/flood_warnings.json',
    openmeteo_all:    '/data/openmeteo_all.json',
  };

  /* --- Fallback Live API URLs (used only if /data/*.json missing) --- */
  const LIVE_API_FALLBACKS = {
    fuel:             'https://api.data.gov.my/data-catalogue?id=fuelprice&limit=52&sort=-date',
    exchange:         'https://api.data.gov.my/data-catalogue?id=exchangerates_daily_1200&limit=30&sort=-date',
    population:       'https://api.data.gov.my/data-catalogue?id=population_malaysia&limit=30&sort=-date',
    gdp:              'https://api.data.gov.my/data-catalogue?id=gdp_qtr_real&limit=20&sort=-date',
    inflation:        'https://api.data.gov.my/data-catalogue?id=cpi_headline&limit=24&sort=-date',
    unemployment:     'https://api.data.gov.my/data-catalogue?id=lfs_month&limit=36&sort=-date',
    tourism_data:     'https://api.data.gov.my/data-catalogue?id=arrivals&limit=24&sort=-date',
    trade:            'https://api.data.gov.my/data-catalogue?id=trade_sitc_1d&limit=24&sort=-date',
    weather_forecast: 'https://api.data.gov.my/weather/forecast',
    weather_warnings: 'https://api.data.gov.my/weather/warning',
    earthquake:       'https://api.data.gov.my/weather/warning/earthquake',
    flood_warnings:   'https://api.data.gov.my/flood-warning?limit=50',
  };

  /* --- Open-Meteo city list (shared with weather.js) --- */
  const MALAYSIA_CITIES = [
    { name: 'Kuala Lumpur',     lat: 3.1390,  lon: 101.6869, state: 'W.P. Kuala Lumpur' },
    { name: 'Penang',           lat: 5.4141,  lon: 100.3288, state: 'Penang' },
    { name: 'Johor Bahru',      lat: 1.4927,  lon: 103.7414, state: 'Johor' },
    { name: 'Kota Kinabalu',    lat: 5.9788,  lon: 116.0753, state: 'Sabah' },
    { name: 'Kuching',          lat: 1.5533,  lon: 110.3592, state: 'Sarawak' },
    { name: 'Alor Setar',       lat: 6.1248,  lon: 100.3678, state: 'Kedah' },
    { name: 'Ipoh',             lat: 4.5975,  lon: 101.0901, state: 'Perak' },
    { name: 'Shah Alam',        lat: 3.0733,  lon: 101.5185, state: 'Selangor' },
    { name: 'Kota Bharu',       lat: 6.1248,  lon: 102.2381, state: 'Kelantan' },
    { name: 'Kuala Terengganu', lat: 5.3296,  lon: 103.1370, state: 'Terengganu' },
    { name: 'Seremban',         lat: 2.7297,  lon: 101.9381, state: 'Negeri Sembilan' },
    { name: 'Melaka',           lat: 2.1896,  lon: 102.2501, state: 'Melaka' },
    { name: 'Kangar',           lat: 6.4414,  lon: 100.1986, state: 'Perlis' },
    { name: 'Kuala Lipis',      lat: 4.1833,  lon: 102.0500, state: 'Pahang' },
    { name: 'Sandakan',         lat: 5.8415,  lon: 118.1175, state: 'Sabah' },
    { name: 'Miri',             lat: 4.3995,  lon: 113.9914, state: 'Sarawak' }
  ];

  /* --- WMO Weather Code Lookups --- */
  const WMO_CODES = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm heavy hail'
  };

  const WMO_EMOJI = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '❄️', 73: '❄️', 75: '❄️',
    80: '🌦️', 81: '🌧️', 82: '⛈️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
  };

  /* ─── Internal State ─────────────────────────────────────── */
  const store = {};
  const status = {};
  const listeners = {};
  let manifest = null;

  /* ─── Helpers ────────────────────────────────────────────── */
  function lsKey(key) { return `${LS_PREFIX}${key}`; }

  function saveToLS(key, data) {
    try {
      localStorage.setItem(lsKey(key), JSON.stringify({ ts: Date.now(), data }));
    } catch {
      // Storage full — clear old NADI entries first
      Object.keys(localStorage)
        .filter(k => k.startsWith(LS_PREFIX))
        .slice(0, 5)
        .forEach(k => localStorage.removeItem(k));
      try { localStorage.setItem(lsKey(key), JSON.stringify({ ts: Date.now(), data })); } catch {}
    }
  }

  function loadFromLS(key, maxAgeMs = 4 * 60 * 60 * 1000) {
    try {
      const raw = localStorage.getItem(lsKey(key));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > maxAgeMs) { localStorage.removeItem(lsKey(key)); return null; }
      return parsed.data;
    } catch { return null; }
  }

  function emitGlobal(key, data, stat) {
    status[key] = stat;
    store[key] = data;
    // Key-specific listeners get (data, status)
    (listeners[key] || []).forEach(cb => { try { cb(data, stat); } catch {} });
    // Global '*' listeners get (key, data, status)
    (listeners['*'] || []).forEach(cb => { try { cb(key, data, stat); } catch {} });
  }

  /* ─── Load Static JSON File ──────────────────────────────── */
  async function loadStaticFile(key) {
    const file = DATA_FILES[key];
    if (!file) return null;

    try {
      const res = await fetch(file + '?v=' + (manifest?._meta?.generated_at || Date.now()), {
        cache: 'no-store'
      });
      if (!res.ok) return null;
      const json = await res.json();
      // Extract data array from wrapper format { _meta, data }
      return json.data || json;
    } catch {
      return null;
    }
  }

  /* ─── Load from Live API (last resort) ──────────────────── */
  async function loadFromLiveAPI(key) {
    const url = LIVE_API_FALLBACKS[key];
    if (!url) return null;
    try {
      console.warn(`[DataStore] Falling back to live API for: ${key}`);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || null);
    } catch { return null; }
  }

  /* ─── Primary Load Strategy ──────────────────────────────── */
  async function load(key) {
    if (store[key] !== undefined) {
      // Already loaded — call listeners immediately if not already called
      return store[key];
    }

    emitGlobal(key, null, 'loading');

    // 1. Try static JSON file (fastest, no rate limit)
    let data = await loadStaticFile(key);

    // 2. Try localStorage cache (survives reloads)
    if (!data) {
      data = loadFromLS(key);
      if (data) console.log(`[DataStore] Cache hit (localStorage): ${key}`);
    }

    // 3. Try live API as last resort
    if (!data) {
      data = await loadFromLiveAPI(key);
    }

    if (data) {
      saveToLS(key, data);
      emitGlobal(key, data, 'done');
    } else {
      emitGlobal(key, null, 'error');
    }

    return data;
  }

  /* ─── Fetch Open-Meteo Weather ───────────────────────────── */
  async function fetchOpenMeteoCity(city) {
    const params = new URLSearchParams({
      latitude: city.lat, longitude: city.lon,
      hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation',
      wind_speed_unit: 'kmh',
      timezone: 'Asia/Kuala_Lumpur',
      forecast_days: 7
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  async function fetchAllCitiesWeather() {
    // 1. Try static pre-fetched file first
    const staticData = await loadStaticFile('openmeteo_all');
    if (staticData && Array.isArray(staticData) && staticData.length > 0) {
      saveToLS('openmeteo_all', staticData, 6 * 60 * 60 * 1000);
      emitGlobal('openmeteo_all', staticData, 'done');
      return staticData;
    }

    // 2. Try localStorage
    const cached = loadFromLS('openmeteo_all', 6 * 60 * 60 * 1000);
    if (cached) {
      emitGlobal('openmeteo_all', cached, 'done');
      return cached;
    }

    // 3. Fetch live (Open-Meteo has no rate limit)
    emitGlobal('openmeteo_all', null, 'loading');
    try {
      const results = [];
      for (const city of MALAYSIA_CITIES) {
        try {
          const data = await fetchOpenMeteoCity(city);
          results.push({ city, data });
        } catch (e) {
          console.warn(`[DataStore] Open-Meteo failed for ${city.name}`);
        }
        await new Promise(r => setTimeout(r, 200));
      }
      if (results.length > 0) {
        saveToLS('openmeteo_all', results);
        emitGlobal('openmeteo_all', results, 'done');
        return results;
      }
    } catch {}

    emitGlobal('openmeteo_all', null, 'error');
    return null;
  }

  /* ─── Start: load all datasets in priority order ─────────── */
  const LOAD_ORDER = [
    'openmeteo_all',      // Weather first (fetched from static, fast)
    'fuel',
    'weather_forecast',
    'weather_warnings',
    'earthquake',
    'flood_warnings',
    'gdp',
    'inflation',
    'exchange',
    'population',
    'unemployment',
    'tourism_data',
    'trade',
  ];

  async function start() {
    // Load manifest to know when data was last updated
    try {
      const mRes = await fetch('/data/manifest.json?v=' + Date.now(), { cache: 'no-store' });
      if (mRes.ok) {
        manifest = await mRes.json();
        console.log(`[DataStore] Manifest loaded. Data age: ${manifest._meta?.generated_at}`);
      }
    } catch {}

    // Start Open-Meteo in parallel (no rate limit)
    fetchAllCitiesWeather();

    // Load static files sequentially (fast, no delays needed)
    for (const key of LOAD_ORDER) {
      if (key === 'openmeteo_all') continue; // already started above
      await load(key);
      // Small gap to not overwhelm any connections
      await new Promise(r => setTimeout(r, 50));
    }
  }

  /* ─── Public API ─────────────────────────────────────────── */
  window.NadiStore = {
    /**
     * Subscribe to a dataset key.
     * Fires immediately if data already loaded.
     */
    on(key, cb) {
      if (!listeners[key]) listeners[key] = [];
      listeners[key].push(cb);

      if (store[key] !== undefined) {
        try { cb(store[key], status[key] || 'done'); } catch {}
      } else if (status[key] === 'loading') {
        try { cb(null, 'loading'); } catch {}
      }

      return () => {
        listeners[key] = (listeners[key] || []).filter(f => f !== cb);
      };
    },

    /** Listen to ALL dataset updates: (key, data, status) */
    onAny(cb) {
      if (!listeners['*']) listeners['*'] = [];
      listeners['*'].push(cb);
      return () => { listeners['*'] = (listeners['*'] || []).filter(f => f !== cb); };
    },

    /** Get data synchronously */
    get(key) { return store[key] ?? null; },

    /** Get status */
    status(key) { return status[key] || 'idle'; },

    getAllStatus() { return { ...status }; },

    /** Force re-fetch a specific key */
    async refresh(key) {
      delete store[key];
      localStorage.removeItem(lsKey(key));
      await load(key);
    },

    /** Start all background loads */
    start,

    /** Open-Meteo helpers */
    fetchWeather: fetchAllCitiesWeather,
    getCities: () => MALAYSIA_CITIES,
    getCityWeather(cityName) {
      const all = store['openmeteo_all'];
      if (!all) return null;
      return all.find(r => r.city.name === cityName) || null;
    },

    /** Get manifest info (when was data last fetched) */
    getManifest: () => manifest,

    /** Clear all cached data */
    clearAll() {
      Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX)).forEach(k => localStorage.removeItem(k));
      Object.keys(store).forEach(k => delete store[k]);
    },

    WMO_CODES,
    WMO_EMOJI,
  };

})();
