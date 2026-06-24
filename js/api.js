/* ============================================================
   KTMY — API Client with Caching & Rate Limiting
   ============================================================ */

(function () {
  'use strict';

  const BASE_URL = 'https://api.data.gov.my';

  /* --- Cache Configuration (TTL in ms) --- */
  const CACHE_TTL = {
    weather: 60 * 60 * 1000,           // 1 hour
    fuel: 24 * 60 * 60 * 1000,         // 24 hours
    exchange: 6 * 60 * 60 * 1000,      // 6 hours
    population: 7 * 24 * 60 * 60 * 1000, // 7 days
    economy: 24 * 60 * 60 * 1000,      // 24 hours
    default: 12 * 60 * 60 * 1000       // 12 hours
  };

  /* --- Rate Limiter (4 req/min) --- */
  const RATE_LIMIT = 4;
  const RATE_WINDOW = 60 * 1000; // 1 minute
  let requestTimestamps = [];
  let requestQueue = [];
  let isProcessing = false;

  function canMakeRequest() {
    const now = Date.now();
    requestTimestamps = requestTimestamps.filter(t => now - t < RATE_WINDOW);
    return requestTimestamps.length < RATE_LIMIT;
  }

  function waitForSlot() {
    return new Promise(resolve => {
      const check = () => {
        if (canMakeRequest()) {
          resolve();
        } else {
          const oldest = requestTimestamps[0];
          const waitTime = RATE_WINDOW - (Date.now() - oldest) + 100;
          setTimeout(check, Math.min(waitTime, 5000));
        }
      };
      check();
    });
  }

  async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (requestQueue.length > 0) {
      await waitForSlot();
      const { resolve, reject, fn } = requestQueue.shift();
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }

    isProcessing = false;
  }

  function enqueue(fn) {
    return new Promise((resolve, reject) => {
      requestQueue.push({ resolve, reject, fn });
      processQueue();
    });
  }

  /* --- LocalStorage Cache --- */
  function getCacheKey(endpoint, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
    return `ktmy_cache_${endpoint}_${sortedParams}`;
  }

  function getFromCache(key, ttlCategory) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      const ttl = CACHE_TTL[ttlCategory] || CACHE_TTL.default;
      if (Date.now() - cached.timestamp > ttl) {
        localStorage.removeItem(key);
        return null;
      }
      return cached.data;
    } catch {
      return null;
    }
  }

  function setCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));
    } catch (e) {
      /* localStorage full — clear old KTMY entries */
      clearOldCache();
      try {
        localStorage.setItem(key, JSON.stringify({
          timestamp: Date.now(),
          data: data
        }));
      } catch {
        /* Silently fail — cache is a nice-to-have */
      }
    }
  }

  function clearOldCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('ktmy_cache_'));
    /* Remove oldest half */
    const entries = keys.map(k => {
      try {
        const d = JSON.parse(localStorage.getItem(k));
        return { key: k, ts: d.timestamp || 0 };
      } catch {
        return { key: k, ts: 0 };
      }
    }).sort((a, b) => a.ts - b.ts);

    const removeCount = Math.ceil(entries.length / 2);
    for (let i = 0; i < removeCount; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }

  /* --- Deduplicate in-flight requests --- */
  const inFlight = new Map();

  /* --- Core fetch with retry --- */
  async function apiFetch(endpoint, params = {}, options = {}) {
    const { ttlCategory = 'default', retries = 2 } = options;

    /* Build URL */
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    const urlStr = url.toString();
    const cacheKey = getCacheKey(endpoint, params);

    /* Check cache first */
    const cached = getFromCache(cacheKey, ttlCategory);
    if (cached) return cached;

    /* Deduplicate */
    if (inFlight.has(urlStr)) {
      return inFlight.get(urlStr);
    }

    const promise = enqueue(async () => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          requestTimestamps.push(Date.now());

          const response = await fetch(urlStr, {
            headers: { 'Accept': 'application/json' }
          });

          if (response.status === 429) {
            /* Rate limited — wait and retry */
            const waitTime = Math.pow(2, attempt) * 15000;
            await new Promise(r => setTimeout(r, waitTime));
            continue;
          }

          if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          setCache(cacheKey, data);
          return data;
        } catch (err) {
          lastError = err;
          if (attempt < retries) {
            const backoff = Math.pow(2, attempt) * 1000;
            await new Promise(r => setTimeout(r, backoff));
          }
        }
      }
      throw lastError;
    });

    inFlight.set(urlStr, promise);
    try {
      const result = await promise;
      return result;
    } finally {
      inFlight.delete(urlStr);
    }
  }

  /* --- Public API --- */
  window.KtmyAPI = {
    /**
     * Generic fetch from any endpoint
     * @param {string} endpoint - e.g. '/weather/forecast'
     * @param {Object} params - query params
     * @param {Object} options - { ttlCategory, retries }
     * @returns {Promise<Array|Object>}
     */
    fetch: apiFetch,

    /**
     * Fetch from data catalogue
     * @param {string} id - dataset ID (e.g. 'fuelprice')
     * @param {Object} params - additional query params
     * @param {Object} options
     */
    catalogue(id, params = {}, options = {}) {
      return apiFetch('/data-catalogue', { id, ...params }, options);
    },

    /**
     * Fetch from OpenDOSM
     * @param {string} id - dataset ID (e.g. 'gdp_qtr_real')
     * @param {Object} params
     * @param {Object} options
     */
    dosm(id, params = {}, options = {}) {
      return apiFetch('/opendosm', { id, ...params }, options);
    },

    /**
     * Weather forecast
     */
    weather(params = {}) {
      return apiFetch('/weather/forecast', params, { ttlCategory: 'weather' });
    },

    /**
     * Weather warnings
     */
    weatherWarnings() {
      return apiFetch('/weather/warning', {}, { ttlCategory: 'weather' });
    },

    /**
     * Earthquake warnings
     */
    earthquakeWarnings() {
      return apiFetch('/weather/warning/earthquake', {}, { ttlCategory: 'weather' });
    },

    /**
     * Flood warnings
     */
    floodWarnings(params = {}) {
      return apiFetch('/flood-warning', params, { ttlCategory: 'weather' });
    },

    /**
     * Clear all cached data
     */
    clearCache() {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('ktmy_cache_'));
      keys.forEach(k => localStorage.removeItem(k));
    },

    /**
     * Get queue status
     */
    getQueueStatus() {
      return {
        queueLength: requestQueue.length,
        requestsInWindow: requestTimestamps.filter(t => Date.now() - t < RATE_WINDOW).length,
        isProcessing
      };
    }
  };
})();
