/* ============================================================
   NADI — Fuel Prices Section Module (DataStore-powered)
   ============================================================ */

(function () {
  'use strict';
  let rendered = false;
  let chartInstance = null;

  function init() {
    const container = document.getElementById('section-fuel-content');
    if (!container) return;

    // Subscribe to DataStore — will fire immediately if data is cached
    NadiStore.on('fuel', (data, status) => {
      if (status === 'loading') {
        if (!rendered) showLoading(container);
        return;
      }
      if (status === 'error' || !data) {
        showError(container);
        return;
      }
      let records = Array.isArray(data) ? data : (data.data || []);
      if (records.length === 0) { showError(container); return; }
      records = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
      renderSection(container, records);
      rendered = true;
    });

    if (NadiStore.status('fuel') === 'idle') {
      showLoading(container);
    }
  }

  function showLoading(container) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>${NadiI18n.t('common.loading')}</p>
      </div>`;
  }

  function showError(container) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⛽</div>
        <p class="error-message">${NadiI18n.t('common.error')}</p>
        <button class="btn btn-outline" onclick="NadiStore.refresh('fuel')">Retry</button>
      </div>`;
  }

  function formatChange(change) {
    if (Math.abs(change) < 0.001) return `<span class="stat-change neutral">Unchanged</span>`;
    const sign = change > 0 ? '+' : '';
    const cls = change > 0 ? 'down' : 'up'; // price up = bad (red), price down = good (green)
    const icon = change > 0 ? '↑' : '↓';
    return `<span class="stat-change ${cls}">${icon} ${sign}${change.toFixed(2)}</span>`;
  }

  function renderSection(container, records) {
    const latest = records[records.length - 1];
    const previous = records.length > 1 ? records[records.length - 2] : latest;

    const ron95 = parseFloat(latest.ron95 || 2.05);
    const ron97 = parseFloat(latest.ron97 || 3.47);
    const dieselP = parseFloat(latest.diesel_peninsular || latest.diesel || 3.35);
    const dieselE = parseFloat(latest.diesel_east_msia || latest.diesel_east || 2.15);

    const c95 = ron95 - parseFloat(previous.ron95 || ron95);
    const c97 = ron97 - parseFloat(previous.ron97 || ron97);
    const cDP = dieselP - parseFloat(previous.diesel_peninsular || previous.diesel || dieselP);
    const cDE = dieselE - parseFloat(previous.diesel_east_msia || previous.diesel_east || dieselE);

    const fmtDate = new Date(latest.date).toLocaleDateString(
      NadiI18n.getLang() === 'bm' ? 'ms-MY' : 'en-US',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );

    container.innerHTML = `
      <div class="mb-md reveal" style="font-size:var(--fs-small); color:var(--text-muted);">
        <span data-i18n="fuel.effective">Effective Date</span>: <strong>${fmtDate}</strong>
      </div>

      <div class="grid grid-4 stagger mb-xl">
        <div class="price-tag reveal">
          <span class="price-label" style="color:var(--accent-gold);">RON 95</span>
          <span class="price-value">RM ${ron95.toFixed(2)}</span>
          <span class="price-unit">per litre</span>
          <div class="mt-sm">${formatChange(c95)}</div>
        </div>
        <div class="price-tag reveal">
          <span class="price-label" style="color:var(--primary);">RON 97</span>
          <span class="price-value">RM ${ron97.toFixed(2)}</span>
          <span class="price-unit">per litre</span>
          <div class="mt-sm">${formatChange(c97)}</div>
        </div>
        <div class="price-tag reveal">
          <span class="price-label" style="color:var(--accent-blue);">Diesel (Peninsular)</span>
          <span class="price-value">RM ${dieselP.toFixed(2)}</span>
          <span class="price-unit">per litre</span>
          <div class="mt-sm">${formatChange(cDP)}</div>
        </div>
        <div class="price-tag reveal">
          <span class="price-label" style="color:var(--accent-purple);">Diesel (East MY)</span>
          <span class="price-value">RM ${dieselE.toFixed(2)}</span>
          <span class="price-unit">per litre</span>
          <div class="mt-sm">${formatChange(cDE)}</div>
        </div>
      </div>

      <div class="glass-card reveal">
        <h3 class="chart-title">Price History (12 Months)</h3>
        <div class="chart-container" style="height:350px;">
          <canvas id="chart-fuel-history"></canvas>
        </div>
      </div>
    `;

    setTimeout(() => {
      NadiCharts.destroyChart('chart-fuel-history');
      const chartRecords = records.slice(-30);
      const labels = chartRecords.map(r => new Date(r.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
      chartInstance = NadiCharts.createLineChart('chart-fuel-history', {
        labels,
        datasets: [
          { label: 'RON 95', data: chartRecords.map(r => parseFloat(r.ron95)), color: NadiCharts.COLORS.gold },
          { label: 'RON 97', data: chartRecords.map(r => parseFloat(r.ron97)), color: NadiCharts.COLORS.primary },
          { label: 'Diesel (Peninsular)', data: chartRecords.map(r => parseFloat(r.diesel_peninsular || r.diesel)), color: NadiCharts.COLORS.blue },
        ],
        yLabel: 'RM / litre'
      });
    }, 0);

    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.fuel = {
    init,
    translate() { NadiI18n.applyTranslations(); }
  };
})();
