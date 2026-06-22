/* ============================================================
   NADI — Hero Section Module with Live DataStore Status
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let timerInterval = null;
  let popInterval = null;
  let basePopulation = 34219400;

  function init() {
    if (initialized) return;
    initialized = true;

    const container = document.getElementById('section-hero-content');
    if (!container) return;

    renderSection(container);
    startTickers();
    initDataStatusTracker();
  }

  function renderSection(container) {
    container.innerHTML = `
      <div class="hero-bg" data-parallax="0.2"></div>
      <div class="container" style="position:relative; z-index:10;">
        <h1 class="hero-title reveal">
          <span data-i18n="hero.title">The Pulse of</span>
          <span class="gradient-text" data-i18n="hero.title.highlight">Malaysia</span>
        </h1>
        <p class="hero-subtitle reveal" data-i18n="hero.subtitle">
          Real-time data, insights, and essential information — all in one place.
          For Malaysians, expats, and visitors.
        </p>

        <div class="reveal mt-lg" style="display:flex; gap:var(--space-md); flex-wrap:wrap;">
          <a href="#weather" class="btn btn-primary btn-lg" data-i18n="hero.cta">Explore Data →</a>
          <a href="#cost" class="btn btn-outline btn-lg">Fuel &amp; Cost</a>
        </div>

        <!-- Live Stats Ticker Grid -->
        <div class="hero-stats reveal stagger mt-xl">
          <div class="glass-card hero-stat">
            <div class="stat-number glow" id="hero-pop-counter">34,219,400</div>
            <div class="stat-label" data-i18n="hero.stat.population">Population (Live Est.)</div>
          </div>

          <div class="glass-card hero-stat">
            <div class="stat-number" id="hero-live-time">00:00:00</div>
            <div class="stat-label" id="hero-live-date">Malaysia Time (MYT)</div>
          </div>

          <div class="glass-card hero-stat">
            <div class="stat-number" style="font-size:1.4rem; display:flex; align-items:center; justify-content:center; gap:8px;">
              <span class="live-dot"></span>
              <span id="hero-status-label">LOADING...</span>
            </div>
            <div class="stat-label">Data Sync Status</div>
          </div>
        </div>

        <!-- Data Sync Progress (shown while loading) -->
        <div id="hero-sync-bar" class="reveal mt-lg glass-card" style="display:none; padding:var(--space-md);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:var(--fs-small); color:var(--text-secondary);">📡 Reading cached data files...</span>
            <span id="hero-sync-count" style="font-size:var(--fs-xs); color:var(--text-muted);">0 / 13</span>
          </div>
          <div style="background:var(--glass-bg); border-radius:4px; overflow:hidden; height:4px;">
            <div id="hero-sync-progress" style="height:100%; background:var(--primary); transition:width 0.5s ease; width:0%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <p id="hero-sync-msg" style="font-size:var(--fs-xs); color:var(--text-muted); margin:0;">Starting...</p>
            <span id="hero-last-data-refresh" style="font-size:var(--fs-xs); color:var(--text-muted);"></span>
          </div>
        </div>

        <!-- Category Quick-Links -->
        <div class="hero-quick-links reveal mt-xl">
          ${[
            { href: '#weather', icon: '🌦️', label: 'Weather', sub: 'Live forecasts' },
            { href: '#cost', icon: '⛽', label: 'Cost of Living', sub: 'Fuel & prices' },
            { href: '#economy', icon: '📈', label: 'Economy', sub: 'GDP & jobs' },
            { href: '#society', icon: '👥', label: 'Society', sub: 'People & transit' },
            { href: '#safety', icon: '🚨', label: 'Safety', sub: 'Alerts & warnings' },
            { href: '#government', icon: '🏛️', label: 'Gov Support', sub: 'Incentives & grants' },
            { href: '#environment', icon: '🌿', label: 'Environment', sub: 'Energy & green' },
            { href: '#visitor', icon: '🌴', label: 'Visitor Guide', sub: 'Travel essentials' }
          ].map(q => `
            <a href="${q.href}" class="quick-link-card reveal">
              <div class="ql-icon">${q.icon}</div>
              <div class="ql-label">${q.label}</div>
              <div class="ql-sub">${q.sub}</div>
            </a>`).join('')}
        </div>
      </div>
    `;

    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  function startTickers() {
    if (timerInterval) clearInterval(timerInterval);

    function updateTime() {
      const timeEl = document.getElementById('hero-live-time');
      const dateEl = document.getElementById('hero-live-date');
      if (!timeEl) return;

      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const myt = new Date(utc + 3600000 * 8);

      const hh = String(myt.getHours()).padStart(2, '0');
      const mm = String(myt.getMinutes()).padStart(2, '0');
      const ss = String(myt.getSeconds()).padStart(2, '0');
      timeEl.textContent = `${hh}:${mm}:${ss}`;

      if (dateEl) {
        const lang = NadiI18n.getLang() === 'bm' ? 'ms-MY' : 'en-US';
        dateEl.textContent = myt.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }) + ' (MYT)';
      }
    }

    updateTime();
    timerInterval = setInterval(updateTime, 1000);

    // Population ticker
    if (popInterval) clearInterval(popInterval);
    const popEl = document.getElementById('hero-pop-counter');
    if (popEl) {
      popEl.textContent = basePopulation.toLocaleString();
      popInterval = setInterval(() => {
        basePopulation += 1;
        if (popEl) popEl.textContent = basePopulation.toLocaleString();
      }, 15000);
    }
  }

  function initDataStatusTracker() {
    if (!window.NadiStore) return;

    // Show last data refresh time from manifest
    const manifest = NadiStore.getManifest ? NadiStore.getManifest() : null;
    const lastUpdatedEl = document.getElementById('hero-last-data-refresh');
    if (lastUpdatedEl) {
      if (manifest && manifest._meta && manifest._meta.generated_at) {
        const fetchedAt = new Date(manifest._meta.generated_at);
        const minsAgo = Math.round((Date.now() - fetchedAt) / 60000);
        lastUpdatedEl.textContent = `Data last refreshed: ${minsAgo < 60 ? minsAgo + ' min ago' : fetchedAt.toLocaleTimeString('en-MY')}`;
      } else {
        lastUpdatedEl.textContent = 'Loading data...';
      }
    }

    const TOTAL_DATASETS = 13;
    let done = 0;
    const syncBar = document.getElementById('hero-sync-bar');
    const syncCount = document.getElementById('hero-sync-count');
    const syncProgress = document.getElementById('hero-sync-progress');
    const syncMsg = document.getElementById('hero-sync-msg');
    const statusLabel = document.getElementById('hero-status-label');

    if (syncBar) syncBar.style.display = 'block';

    const messages = {
      fuel: 'Fuel prices ✓',
      weather_forecast: 'Weather data ✓',
      weather_warnings: 'Weather warnings ✓',
      earthquake: 'Seismic data ✓',
      gdp: 'GDP data ✓',
      inflation: 'Inflation data ✓',
      unemployment: 'Employment data ✓',
      population: 'Population stats ✓',
      tourism_data: 'Tourism data ✓',
      exchange: 'Exchange rates ✓',
      flood_warnings: 'Flood alerts ✓',
      trade: 'Trade data ✓',
      openmeteo_all: 'Weather maps ✓'
    };

    NadiStore.onAny((key, data, stat) => {
      if (stat === 'done' || stat === 'error') {
        done = Math.min(done + 1, TOTAL_DATASETS);
        const pct = Math.round((done / TOTAL_DATASETS) * 100);

        if (syncCount) syncCount.textContent = `${done} / ${TOTAL_DATASETS}`;
        if (syncProgress) syncProgress.style.width = `${pct}%`;
        if (syncMsg && messages[key]) syncMsg.textContent = messages[key];

        if (done >= TOTAL_DATASETS) {
          if (syncBar) {
            setTimeout(() => {
              syncBar.style.opacity = '0';
              syncBar.style.transition = 'opacity 1s';
              setTimeout(() => { if (syncBar) syncBar.style.display = 'none'; }, 1000);
            }, 3000);
          }
          if (statusLabel) {
            statusLabel.textContent = 'LIVE';
            statusLabel.style.color = 'var(--success)';
          }
        } else {
          if (statusLabel) {
            statusLabel.textContent = `SYNCING ${pct}%`;
            statusLabel.style.color = 'var(--warning)';
          }
        }
      }
    });
  }

  function translate() {
    const container = document.getElementById('section-hero-content');
    if (container) {
      NadiI18n.applyTranslations();
      startTickers();
    }
  }

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.hero = { init, translate };
})();
