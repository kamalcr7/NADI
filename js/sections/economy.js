/* ============================================================
   KTMY — Economy Dashboard Section (DataStore-powered)
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let cacheGdp = null;
  let cacheCpi = null;
  let cacheTrade = null;

  function parseDS(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }

  function getQuarterString(dateStr, isBm) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const q = Math.floor(d.getMonth() / 3) + 1;
    return isBm ? `S${q} ${year}` : `Q${q} ${year}`;
  }

  function init() {
    const container = document.getElementById('section-economy-content');
    if (!container) return;

    if (cacheGdp && cacheCpi && cacheTrade) {
      renderSection(container, cacheGdp, cacheCpi, cacheTrade);
      return;
    }

    if (initialized) return;
    initialized = true;

    const isBm = KtmyI18n.getLang() === 'bm';
    container.innerHTML = `
      <div class="loading-state"><div class="spinner"></div>
      <p>${isBm ? 'Memuatkan petunjuk ekonomi...' : 'Loading economic indicators...'}</p></div>`;

    function tryRender() {
      if (cacheGdp !== null && cacheCpi !== null && cacheTrade !== null) {
        renderSection(container, cacheGdp, cacheCpi, cacheTrade);
      }
    }

    KtmyStore.on('gdp', (data, status) => {
      if (status === 'done') {
        cacheGdp = parseDS(data);
        tryRender();
      } else if (status === 'error') {
        cacheGdp = [];
        tryRender();
      }
    });

    KtmyStore.on('inflation', (data, status) => {
      if (status === 'done') {
        cacheCpi = parseDS(data);
        tryRender();
      } else if (status === 'error') {
        cacheCpi = [];
        tryRender();
      }
    });

    KtmyStore.on('trade', (data, status) => {
      if (status === 'done') {
        cacheTrade = parseDS(data);
        tryRender();
      } else if (status === 'error') {
        cacheTrade = [];
        tryRender();
      }
    });
  }

  function renderSection(container, gdp, cpi, trade) {
    const isBm = KtmyI18n.getLang() === 'bm';

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

    const fmtGdpDate = latestGdp.date ? getQuarterString(latestGdp.date, isBm) : '—';
    const fmtCpiDate = latestCpi.date ? new Date(latestCpi.date).toLocaleDateString(isBm ? 'ms-MY' : 'en-US', { month: 'short', year: 'numeric' }) : '—';
    const fmtTradeDate = latestTrade.date ? new Date(latestTrade.date).toLocaleDateString(isBm ? 'ms-MY' : 'en-US', { month: 'short', year: 'numeric' }) : '—';

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
          <div class="stat-label">${isBm ? 'KDNK Sebenar (Suku)' : 'Real GDP (Qtr)'}</div>
          <div class="stat-date">${fmtGdpDate}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">📈</div>
          <div class="stat-number ${gdpYoyVal >= 0 ? 'text-success' : 'text-danger'}">${growthDisplay}</div>
          <div class="stat-label">${isBm ? 'Pertumbuhan KDNK (YoY)' : 'GDP Growth (YoY)'}</div>
          <div class="stat-date">${fmtGdpDate}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">💹</div>
          <div class="stat-number ${inflation < 3 ? 'text-success' : 'text-danger'}">${inflationDisplay}</div>
          <div class="stat-label">${isBm ? 'Kadar Inflasi' : 'Inflation Rate'}</div>
          <div class="stat-date">${fmtCpiDate}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">🚢</div>
          <div class="stat-number ${latestBalance >= 0 ? 'text-success' : 'text-danger'}">${latestBalance >= 0 ? '+' : ''}${balanceDisplay}</div>
          <div class="stat-label">${isBm ? 'Lebihan/Defisit Perdagangan' : 'Trade Surplus/Deficit'}</div>
          <div class="stat-date">${fmtTradeDate}</div>
        </div>
      </div>

      <!-- GDP Chart -->
      <div class="glass-card reveal mb-lg">
        <h3 class="chart-title">${isBm ? '📊 Trend KDNK Sebenar (Suku Tahunan)' : '📊 Real GDP Trend (Quarterly)'}</h3>
        <div class="chart-container" style="height:360px;">
          <canvas id="chart-gdp-trend"></canvas>
        </div>
      </div>

      <!-- CPI & Trade Charts Grid -->
      <div class="grid grid-2 reveal mb-lg" style="gap: var(--space-md);">
        <div class="glass-card">
          <h3 class="chart-title">${isBm ? '💹 Indeks Harga Pengguna (IHP)' : '💹 Consumer Price Index (CPI)'}</h3>
          <div class="chart-container" style="height:340px;">
            <canvas id="chart-cpi-trend"></canvas>
          </div>
        </div>
        <div class="glass-card">
          <h3 class="chart-title">${isBm ? '🚢 Perdagangan Luar (Eksport & Import)' : '🚢 External Trade (Exports & Imports)'}</h3>
          <div class="chart-container" style="height:340px;">
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
          labels: displayGdp.map(r => new Date(r.date).toLocaleDateString(isBm ? 'ms-MY' : 'en-US', { year: 'numeric', month: 'short' })),
          datasets: [{
            label: isBm ? 'KDNK Sebenar (RM Juta)' : 'Real GDP (RM Million)',
            data: displayGdp.map(r => r.value),
            color: KtmyCharts.COLORS.primary
          }],
          yLabel: isBm ? 'RM Juta' : 'RM Million'
        });
      }

      // CPI Chart
      if (displayCpi.length > 0) {
        KtmyCharts.destroyChart('chart-cpi-trend');
        KtmyCharts.createLineChart('chart-cpi-trend', {
          labels: displayCpi.map(r => new Date(r.date).toLocaleDateString(isBm ? 'ms-MY' : 'en-US', { year: 'numeric', month: 'short' })),
          datasets: [{
            label: isBm ? 'Indeks IHP' : 'CPI Index',
            data: displayCpi.map(r => r.value || r.index || 0),
            color: KtmyCharts.COLORS.gold
          }],
          yLabel: isBm ? 'Indeks' : 'Index'
        });
      }

      // Trade Chart
      if (displayTrade.length > 0) {
        KtmyCharts.destroyChart('chart-trade-trend');
        KtmyCharts.createLineChart('chart-trade-trend', {
          labels: displayTrade.map(r => new Date(r.date).toLocaleDateString(isBm ? 'ms-MY' : 'en-US', { year: 'numeric', month: 'short' })),
          datasets: [
            {
              label: isBm ? 'Eksport (RM Bilion)' : 'Exports (RM Billion)',
              data: displayTrade.map(r => parseFloat(r.exports || 0) / 1e9),
              color: KtmyCharts.COLORS.primary,
              fill: true,
              extra: { backgroundColor: 'rgba(0, 201, 167, 0.1)' }
            },
            {
              label: isBm ? 'Import (RM Bilion)' : 'Imports (RM Billion)',
              data: displayTrade.map(r => parseFloat(r.imports || 0) / 1e9),
              color: KtmyCharts.COLORS.blue,
              fill: true,
              extra: { backgroundColor: 'rgba(77, 124, 254, 0.1)' }
            }
          ],
          yLabel: isBm ? 'RM Bilion' : 'RM Billion'
        });
      }
    }, 0);

    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.economy = {
    init,
    translate() {
      const container = document.getElementById('section-economy-content');
      if (container && cacheGdp && cacheCpi && cacheTrade) {
        renderSection(container, cacheGdp, cacheCpi, cacheTrade);
      }
    }
  };
})();
