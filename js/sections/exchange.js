/* ============================================================
   NADI — Currency Exchange Section Module
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let cachedData = null;
  let sparklines = {};

  const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸', key: 'usd' },
    { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', key: 'sgd' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', key: 'eur' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧', key: 'gbp' },
    { code: 'JPY', name: '100 Japanese Yen', flag: '🇯🇵', key: 'jpy' },
    { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', key: 'aud' },
    { code: 'CNY', name: 'Chinese Renminbi', flag: '🇨🇳', key: 'cny' },
    { code: 'THB', name: '100 Thai Baht', flag: '🇹🇭', key: 'thb' }
  ];

  function init() {
    const container = document.getElementById('section-exchange-content');
    if (!container) return;

    if (initialized && cachedData) {
      renderSection(container, cachedData);
      return;
    }
    initialized = true;

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading exchange rates...</p>
      </div>`;

    NadiStore.on('exchange', (data, status) => {
      if (status === 'loading') return;
      let records = [];
      if (Array.isArray(data)) records = data;
      else if (data && Array.isArray(data.data)) records = data.data;

      if (status === 'error' || records.length === 0) {
        container.innerHTML = `
          <div class="error-state">
            <div class="error-icon">💱</div>
            <p>Could not load exchange rates.</p>
            <button class="btn btn-outline" onclick="NadiStore.refresh('exchange')">Retry</button>
          </div>`;
        return;
      }
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      cachedData = records;
      renderSection(container, records);
    });
  }

  function renderSection(container, records) {
    const latest = records[records.length - 1];
    
    const formattedDate = new Date(latest.date).toLocaleDateString(
      NadiI18n.getLang() === 'bm' ? 'ms-MY' : 'en-US',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );

    // Grid layout for currencies
    const cardsHtml = CURRENCIES.map(c => {
      // Safely parse current rate, checking both column name cases (lowercase/uppercase)
      const rawRate = latest[c.key] || latest[c.code.toLowerCase()] || latest[c.code] || 0;
      const rateVal = parseFloat(rawRate);
      
      // If JPY or THB, the BNM rate is usually per 100 units. Let's make it clear.
      const rateStr = rateVal > 0 ? rateVal.toFixed(4) : 'N/A';

      return `
        <div class="currency-card reveal">
          <div class="currency-flag">${c.flag}</div>
          <div class="currency-info">
            <div class="currency-code">${c.code}</div>
            <div class="currency-name" data-i18n="exchange.${c.key}">${c.name}</div>
          </div>
          <!-- Sparkline Chart -->
          <div class="currency-sparkline">
            <canvas id="sparkline-${c.code.toLowerCase()}"></canvas>
          </div>
          <div class="currency-rate">RM ${rateStr}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="mb-md reveal" style="font-size: var(--fs-small); color: var(--text-muted);">
        <span data-i18n="exchange.updated">Rates as of</span>: <strong>${formattedDate}</strong>
      </div>
      <div class="grid grid-2 stagger">
        ${cardsHtml}
      </div>
    `;

    // Render sparklines
    setTimeout(() => {
      // Destroy old sparklines
      Object.keys(sparklines).forEach(key => NadiCharts.destroyChart(key));

      CURRENCIES.forEach(c => {
        const canvasId = `sparkline-${c.code.toLowerCase()}`;
        const dataPoints = records
          .map(r => parseFloat(r[c.key] || r[c.code.toLowerCase()] || r[c.code] || 0))
          .filter(val => val > 0);

        if (dataPoints.length > 0) {
          const color = dataPoints[dataPoints.length - 1] >= dataPoints[0] 
            ? NadiCharts.COLORS.primary 
            : NadiCharts.COLORS.danger;
          sparklines[canvasId] = NadiCharts.createSparkline(canvasId, dataPoints, color);
        }
      });
    }, 0);

    // Apply translations
    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  function translate() {
    const container = document.getElementById('section-exchange-content');
    if (container && cachedData) {
      renderSection(container, cachedData);
    }
  }

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.exchange = { init, translate };
})();
