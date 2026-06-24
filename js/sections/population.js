/* ============================================================
   KTMY — Population & Demographics Section (DataStore-powered)
   ============================================================ */

(function () {
  'use strict';

  function parseDS(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }

  let initialized = false;
  let cachedRecords = null;

  function init() {
    const container = document.getElementById('section-population-content');
    if (!container) return;

    if (cachedRecords) {
      renderSection(container, cachedRecords);
      return;
    }

    if (initialized) return;
    initialized = true;

    const isBm = KtmyI18n.getLang() === 'bm';
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${isBm ? 'Memuatkan data penduduk...' : 'Loading population data...'}</p></div>`;

    KtmyStore.on('population', (data, status) => {
      if (status === 'loading') return;
      const records = parseDS(data);
      if (status === 'error' || records.length === 0) {
        const isBm = KtmyI18n.getLang() === 'bm';
        container.innerHTML = `
          <div class="error-state">
            <div class="error-icon">👥</div>
            <p>${isBm ? 'Tidak dapat memuatkan data penduduk.' : 'Could not load population data.'}</p>
            <button class="btn btn-outline" onclick="KtmyStore.refresh('population')">${isBm ? 'Cuba Semula' : 'Retry'}</button>
          </div>`;
        return;
      }
      cachedRecords = records;
      renderSection(container, records);
    });
  }

  function renderSection(container, records) {
    const isBm = KtmyI18n.getLang() === 'bm';

    // Filter to get the overall national population per year
    const nationalOverall = records.filter(r => 
      r.age === 'overall' && 
      r.sex === 'both' && 
      (r.ethnicity === 'overall' || !r.ethnicity)
    );

    const sorted = [...nationalOverall].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1] || {};
    const prev = sorted[sorted.length - 2] || {};

    // In population_malaysia, population is in thousands (e.g. 34219.4)
    const latestPop = (latest.population || latest.value || 34219.4) * 1000;
    const prevPop = (prev.population || prev.value || latestPop / 1000) * 1000;
    const growth = latestPop - prevPop;

    // State breakdown from data if available (none in national population dataset)
    const stateEntries = [];

    container.innerHTML = `
      <!-- KPIs -->
      <div class="grid grid-3 stagger mb-xl">
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">🇲🇾</div>
          <div class="stat-number gradient-text">${(latestPop / 1e6).toFixed(2)}M</div>
          <div class="stat-label">${isBm ? 'Jumlah Penduduk' : 'Total Population'}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">📈</div>
          <div class="stat-number ${growth >= 0 ? 'text-success' : 'text-danger'}">
            ${growth >= 0 ? '+' : ''}${(growth / 1000).toFixed(0)}K
          </div>
          <div class="stat-label">${isBm ? 'Pertumbuhan Tahunan' : 'Annual Growth'}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">🏙️</div>
          <div class="stat-number">~78%</div>
          <div class="stat-label">${isBm ? 'Penduduk Bandar' : 'Urban Population'}</div>
        </div>
      </div>

      <!-- State Population Bar Chart -->
      ${stateEntries.length > 0 ? `
        <div class="glass-card reveal mb-lg">
          <h3 class="chart-title">${isBm ? '🗺️ Penduduk Mengikut Negeri' : '🗺️ Population by State'}</h3>
          <div class="chart-container" style="height:400px;">
            <canvas id="chart-population-states"></canvas>
          </div>
        </div>` : ''}

      <!-- Historical Trend -->
      <div class="glass-card reveal">
        <h3 class="chart-title">${isBm ? '📈 Trend Pertumbuhan Penduduk' : '📈 Population Growth Trend'}</h3>
        <div class="chart-container" style="height:350px;">
          <canvas id="chart-population-trend"></canvas>
        </div>
      </div>

      <!-- Malaysia Demographics Info Cards -->
      <div class="grid grid-3 stagger mt-xl">
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🌏</div>
          <h4>${isBm ? 'Komposisi Etnik' : 'Ethnic Composition'}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            ${isBm ? 'Bumiputera ~69.9% · Cina ~22.8% · India ~6.7% · Lain-lain ~0.6%' : 'Bumiputera ~69.9% · Chinese ~22.8% · Indian ~6.7% · Others ~0.6%'}
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🗣️</div>
          <h4>${isBm ? 'Bahasa' : 'Languages'}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            ${isBm ? 'Rasmi: Bahasa Malaysia. Dituturkan secara meluas: Inggeris, Mandarin, dialek Tamil' : 'Official: Bahasa Malaysia. Widely spoken: English, Mandarin, Tamil dialects'}
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">⛪</div>
          <h4>${isBm ? 'Agama' : 'Religion'}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            ${isBm ? 'Islam ~63.5% · Buddhisme ~18.7% · Kristian ~9.1% · Hinduisme ~6.1%' : 'Islam ~63.5% · Buddhism ~18.7% · Christianity ~9.1% · Hinduism ~6.1%'}
          </p>
        </div>
      </div>
    `;

    setTimeout(() => {
      if (stateEntries.length > 0) {
        KtmyCharts.destroyChart('chart-population-states');
        KtmyCharts.createBarChart('chart-population-states', {
          labels: stateEntries.map(e => e.state),
          datasets: [{
            label: isBm ? 'Penduduk' : 'Population',
            data: stateEntries.map(e => e.value),
            colors: KtmyCharts.PALETTE.slice(0, stateEntries.length)
          }],
          horizontal: true,
          yLabel: isBm ? 'Orang' : 'People'
        });
      }

      // Historical trend
      const trendMalaysia = sorted.filter(r => !r.state || r.state === 'Malaysia').slice(-20);
      if (trendMalaysia.length > 0) {
        KtmyCharts.destroyChart('chart-population-trend');
        KtmyCharts.createAreaChart('chart-population-trend', {
          labels: trendMalaysia.map(r => new Date(r.date).getFullYear()),
          datasets: [{
            label: isBm ? 'Penduduk Malaysia' : 'Malaysia Population',
            data: trendMalaysia.map(r => parseFloat(r.population || r.value || 0) * 1000),
            color: KtmyCharts.COLORS.primary
          }]
        });
      }
    }, 0);

    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.population = {
    init,
    translate() {
      const container = document.getElementById('section-population-content');
      if (container && cachedRecords) {
        renderSection(container, cachedRecords);
      }
    }
  };
})();
