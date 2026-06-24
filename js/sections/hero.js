/* ============================================================
   KTMY — Hero Section Module with Live DataStore Status
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
  }

  function renderSection(container) {
    const isBm = KtmyI18n.getLang() === 'bm';
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
          <a href="#weather" class="btn btn-primary btn-lg" data-i18n="hero.cta">Explore Data</a>
          <a href="#cost" class="btn btn-outline btn-lg">${isBm ? 'Bahan Api & Kos' : 'Fuel & Cost'}</a>
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
        </div>

        <!-- Category Quick-Links -->
        <div class="hero-quick-links reveal mt-xl">
          ${[
            { href: '#weather', icon: '🌦️', label: isBm ? 'Cuaca' : 'Weather', sub: isBm ? 'Ramalan langsung' : 'Live forecasts' },
            { href: '#cost', icon: '⛽', label: isBm ? 'Kos Sara Hidup' : 'Cost of Living', sub: isBm ? 'Bahan api & harga' : 'Fuel & prices' },
            { href: '#economy', icon: '📈', label: isBm ? 'Ekonomi' : 'Economy', sub: isBm ? 'KDNK & pekerjaan' : 'GDP & jobs' },
            { href: '#society', icon: '👥', label: isBm ? 'Masyarakat' : 'Society', sub: isBm ? 'Rakyat & transit' : 'People & transit' },
            { href: '#safety', icon: '🚨', label: isBm ? 'Keselamatan' : 'Safety', sub: isBm ? 'Amaran & bahaya' : 'Alerts & warnings' },
            { href: '#government', icon: '🏛️', label: isBm ? 'Sokongan Kerajaan' : 'Gov Support', sub: isBm ? 'Insentif & geran' : 'Incentives & grants' },
            { href: '#environment', icon: '🌿', label: isBm ? 'Alam Sekitar' : 'Environment', sub: isBm ? 'Tenaga & hijau' : 'Energy & green' },
            { href: '#visitor', icon: '🌴', label: isBm ? 'Panduan Pelawat' : 'Visitor Guide', sub: isBm ? 'Keperluan travel' : 'Travel essentials' }
          ].map(q => `
            <a href="${q.href}" class="quick-link-card reveal">
              <div class="ql-icon">${q.icon}</div>
              <div class="ql-label">${q.label}</div>
              <div class="ql-sub">${q.sub}</div>
            </a>`).join('')}
        </div>
      </div>
    `;

    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
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
        const lang = KtmyI18n.getLang() === 'bm' ? 'ms-MY' : 'en-US';
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



  function translate() {
    const container = document.getElementById('section-hero-content');
    if (container) {
      renderSection(container);
      startTickers();
    }
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.hero = { init, translate };
})();
