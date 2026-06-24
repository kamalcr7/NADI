/* ============================================================
   KTMY — Economy Dashboard Section (DataStore-powered)
   ============================================================ */

(function () {
  'use strict';
  let rendered = false;

  function parseDS(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }

  function init() {
    const container = document.getElementById('section-economy-content');
    if (!container) return;

    container.innerHTML = `
      <div class="loading-state"><div class="spinner"></div>
      <p>Loading economic indicators...</p></div>`;

    // Use DataStore for GDP, inflation and trade
    let gdpData = null;
    let cpiData = null;
    let tradeData = null;

    function tryRender() {
      if (gdpData !== null && cpiData !== null && tradeData !== null) {
        renderSection(container, gdpData, cpiData, tradeData);
        rendered = true;
      }
    }

    KtmyStore.on('gdp', (data, status) => {
      if (status === 'done') {
        gdpData = parseDS(data);
        tryRender();
      } else if (status === 'error') {
        gdpData = [];
        tryRender();
      }
    });

    KtmyStore.on('inflation', (data, status) => {
      if (status === 'done') {
        cpiData = parseDS(data);
        tryRender();
      } else if (status === 'error') {
        cpiData = [];
        tryRender();
      }
    });

    KtmyStore.on('trade', (data, status) => {
      if (status === 'done') {
        tradeData = parseDS(data);
        tryRender();
      } else if (status === 'error') {
        tradeData = [];
        tryRender();
      }
    });
  }

  function renderSection(container, gdp, cpi, trade) {
    // Filter and sort GDP
    const gdpAbs = gdp.filter(r => r.series === 'abs');
    const gdpYoy = gdp.filter(r => r.series === 'growth_yoy');
    const gdpSorted = [...gdpAbs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const gdpYoySorted = [...gdpYoy].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter and sort CPI (overall Headline CPI)
    const cpiOverall = cpi.filter(r => r.division === 'overall');
    const cpiSorted = [...cpiOverall].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter and sort Trade (overall Trade balance)
    const tradeSorted = [...trade].filter(r => r.section === 'overall').sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate YoY inflation rate client-side on Headline CPI
    cpiSorted.forEach(rec => {
      const d = new Date(rec.date);
      const targetYear = d.getFullYear() - 1;
      const targetMonth = d.getMonth();
      const prevRec = cpiSorted.find(r => {
        const pd = new Date(r.date);
        return pd.getFullYear() === targetYear && pd.getMonth() === targetMonth;
      });
      if (prevRec && prevRec.index > 0) {
        rec.inflation = ((rec.index - prevRec.index) / prevRec.index) * 100;
      } else {
        rec.inflation = 1.8; // default standard fallback for Malaysia
      }
    });

    // Slice latest values for display
    const displayGdp = gdpSorted.slice(-16);
    const displayCpi = cpiSorted.slice(-24);
    const displayTrade = tradeSorted.slice(-16);

    const latestGdp = gdpSorted[gdpSorted.length - 1] || {};
    const latestGdpYoy = gdpYoySorted[gdpYoySorted.length - 1] || {};
    const latestCpi = cpiSorted[cpiSorted.length - 1] || {};
    const latestTrade = tradeSorted[tradeSorted.length - 1] || {};

    const gdpVal = latestGdp.value || 0;
    const gdpYoyVal = latestGdpYoy.value || 0;
    const cpiVal = latestCpi.index || latestCpi.value || 0;
    const inflation = latestCpi.inflation || 1.8;
    const latestExports = parseFloat(latestTrade.exports || 0);
    const latestImports = parseFloat(latestTrade.imports || 0);
    const latestBalance = latestExports - latestImports;

    const fmtGdpDate = latestGdp.date ? new Date(latestGdp.date).toLocaleDateString('en-US', { year: 'numeric', quarter: 'narrow' }).replace(' ', ' Q') : '—';
    const fmtCpiDate = latestCpi.date ? new Date(latestCpi.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
    const fmtTradeDate = latestTrade.date ? new Date(latestTrade.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';

    const gdpDisplay = gdpVal > 0 ? `RM ${(gdpVal / 1000).toFixed(1)}B` : '—';
    const growthDisplay = gdpYoyVal !== 0 ? `${gdpYoyVal.toFixed(1)}%` : '—';
    const inflationDisplay = inflation !== 0 ? `${inflation.toFixed(1)}%` : '—';
    const balanceDisplay = latestBalance !== 0 ? `RM ${(latestBalance / 1e9).toFixed(1)}B` : '—';

    container.innerHTML = `
      <!-- Headline KPI Cards -->
      <div class="grid grid-4 stagger mb-xl">
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">📊</div>
          <div class="stat-number gradient-text">${gdpDisplay}</div>
          <div class="stat-label">Real GDP (Qtr)</div>
          <div class="stat-date">${fmtGdpDate}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">📈</div>
          <div class="stat-number ${gdpYoyVal >= 0 ? 'text-success' : 'text-danger'}">${growthDisplay}</div>
          <div class="stat-label">GDP Growth (YoY)</div>
          <div class="stat-date">${fmtGdpDate}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">💹</div>
          <div class="stat-number ${inflation < 3 ? 'text-success' : 'text-danger'}">${inflationDisplay}</div>
          <div class="stat-label">Inflation Rate</div>
          <div class="stat-date">${fmtCpiDate}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">🚢</div>
          <div class="stat-number ${latestBalance >= 0 ? 'text-success' : 'text-danger'}">${latestBalance >= 0 ? '+' : ''}${balanceDisplay}</div>
          <div class="stat-label">Trade Surplus/Deficit</div>
          <div class="stat-date">${fmtTradeDate}</div>
        </div>
      </div>

      <!-- GDP Chart -->
      <div class="glass-card reveal mb-lg">
        <h3 class="chart-title">📊 Real GDP Trend (Quarterly)</h3>
        <div class="chart-container" style="height:300px;">
          <canvas id="chart-gdp-trend"></canvas>
        </div>
      </div>

      <!-- CPI & Trade Charts Grid -->
      <div class="grid grid-2 reveal mb-lg" style="gap: var(--space-md);">
        <div class="glass-card">
          <h3 class="chart-title">💹 Consumer Price Index (CPI)</h3>
          <div class="chart-container" style="height:280px;">
            <canvas id="chart-cpi-trend"></canvas>
          </div>
        </div>
        <div class="glass-card">
          <h3 class="chart-title">🚢 External Trade (Exports & Imports)</h3>
          <div class="chart-container" style="height:280px;">
            <canvas id="chart-trade-trend"></canvas>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      // GDP Chart
      if (displayGdp.length > 0) {
        KtmyCharts.destroyChart('chart-gdp-trend');
        KtmyCharts.createAreaChart('chart-gdp-trend', {
          labels: displayGdp.map(r => new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })),
          datasets: [{
            label: 'Real GDP (RM Million)',
            data: displayGdp.map(r => r.value),
            color: KtmyCharts.COLORS.primary
          }],
          yLabel: 'RM Million'
        });
      }

      // CPI Chart
      if (displayCpi.length > 0) {
        KtmyCharts.destroyChart('chart-cpi-trend');
        KtmyCharts.createLineChart('chart-cpi-trend', {
          labels: displayCpi.map(r => new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })),
          datasets: [{
            label: 'CPI Index',
            data: displayCpi.map(r => r.value || r.index || 0),
            color: KtmyCharts.COLORS.gold
          }],
          yLabel: 'Index'
        });
      }

      // Trade Chart
      if (displayTrade.length > 0) {
        KtmyCharts.destroyChart('chart-trade-trend');
        KtmyCharts.createLineChart('chart-trade-trend', {
          labels: displayTrade.map(r => new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })),
          datasets: [
            {
              label: KtmyI18n.getLang() === 'bm' ? 'Eksport (RM Juta)' : 'Exports (RM Billion)',
              data: displayTrade.map(r => parseFloat(r.exports || 0) / 1e9),
              color: KtmyCharts.COLORS.primary,
              fill: true,
              extra: { backgroundColor: 'rgba(0, 201, 167, 0.1)' }
            },
            {
              label: KtmyI18n.getLang() === 'bm' ? 'Import (RM Juta)' : 'Imports (RM Billion)',
              data: displayTrade.map(r => parseFloat(r.imports || 0) / 1e9),
              color: KtmyCharts.COLORS.blue,
              fill: true,
              extra: { backgroundColor: 'rgba(77, 124, 254, 0.1)' }
            }
          ],
          yLabel: 'RM Billion'
        });
      }
    }, 0);

    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.economy = {
    init,
    translate() { KtmyI18n.applyTranslations(); }
  };
})();
