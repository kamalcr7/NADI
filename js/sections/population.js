/* ============================================================
   NADI — Population & Demographics Section (DataStore-powered)
   ============================================================ */

(function () {
  'use strict';

  function parseDS(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }

  function init() {
    const container = document.getElementById('section-population-content');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading population data...</p></div>`;

    NadiStore.on('population', (data, status) => {
      if (status === 'loading') return;
      const records = parseDS(data);
      if (status === 'error' || records.length === 0) {
        container.innerHTML = `
          <div class="error-state">
            <div class="error-icon">👥</div>
            <p>Could not load population data.</p>
            <button class="btn btn-outline" onclick="NadiStore.refresh('population')">Retry</button>
          </div>`;
        return;
      }
      renderSection(container, records);
    });
  }

  function renderSection(container, records) {
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1] || {};
    const prev = sorted[sorted.length - 2] || {};

    // Get population key
    const popKey = Object.keys(latest).find(k => k !== 'date' && !k.includes('state') && !k.includes('sex') && !k.includes('age')) || 'value';
    const latestPop = latest[popKey] || latest.population || latest.value || 34219400;
    const prevPop = prev[popKey] || prev.population || prev.value || latestPop;
    const growth = latestPop - prevPop;

    // State breakdown from data if available
    const stateMap = {};
    records.forEach(r => {
      if (r.state && r.state !== 'Malaysia') {
        const stateKey = r.state;
        const val = r[popKey] || r.population || r.value || 0;
        if (!stateMap[stateKey] || new Date(r.date) > new Date(stateMap[stateKey].date)) {
          stateMap[stateKey] = { ...r, value: parseFloat(val) };
        }
      }
    });

    const stateEntries = Object.entries(stateMap)
      .map(([s, d]) => ({ state: s, value: d.value }))
      .filter(e => e.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 16);

    container.innerHTML = `
      <!-- KPIs -->
      <div class="grid grid-3 stagger mb-xl">
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">🇲🇾</div>
          <div class="stat-number gradient-text">${(latestPop / 1e6).toFixed(2)}M</div>
          <div class="stat-label">Total Population</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">📈</div>
          <div class="stat-number ${growth >= 0 ? 'text-success' : 'text-danger'}">
            ${growth >= 0 ? '+' : ''}${(growth / 1000).toFixed(0)}K
          </div>
          <div class="stat-label">Annual Growth</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">🏙️</div>
          <div class="stat-number">~78%</div>
          <div class="stat-label">Urban Population</div>
        </div>
      </div>

      <!-- State Population Bar Chart -->
      ${stateEntries.length > 0 ? `
        <div class="glass-card reveal mb-lg">
          <h3 class="chart-title">🗺️ Population by State</h3>
          <div class="chart-container" style="height:400px;">
            <canvas id="chart-population-states"></canvas>
          </div>
        </div>` : ''}

      <!-- Historical Trend -->
      <div class="glass-card reveal">
        <h3 class="chart-title">📈 Population Growth Trend</h3>
        <div class="chart-container" style="height:280px;">
          <canvas id="chart-population-trend"></canvas>
        </div>
      </div>

      <!-- Malaysia Demographics Info Cards -->
      <div class="grid grid-3 stagger mt-xl">
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🌏</div>
          <h4>Ethnic Composition</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            Bumiputera ~69.9% · Chinese ~22.8% · Indian ~6.7% · Others ~0.6%
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🗣️</div>
          <h4>Languages</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            Official: Bahasa Malaysia. Widely spoken: English, Mandarin, Tamil dialects
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">⛪</div>
          <h4>Religion</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            Islam ~63.5% · Buddhism ~18.7% · Christianity ~9.1% · Hinduism ~6.1%
          </p>
        </div>
      </div>
    `;

    setTimeout(() => {
      if (stateEntries.length > 0) {
        NadiCharts.destroyChart('chart-population-states');
        NadiCharts.createBarChart('chart-population-states', {
          labels: stateEntries.map(e => e.state),
          datasets: [{
            label: 'Population',
            data: stateEntries.map(e => e.value),
            colors: NadiCharts.PALETTE.slice(0, stateEntries.length)
          }],
          horizontal: true,
          yLabel: 'People'
        });
      }

      // Historical trend
      const trendMalaysia = sorted.filter(r => !r.state || r.state === 'Malaysia').slice(-20);
      if (trendMalaysia.length > 0) {
        NadiCharts.destroyChart('chart-population-trend');
        NadiCharts.createAreaChart('chart-population-trend', {
          labels: trendMalaysia.map(r => new Date(r.date).getFullYear()),
          datasets: [{
            label: 'Malaysia Population',
            data: trendMalaysia.map(r => r[popKey] || r.population || r.value || 0),
            color: NadiCharts.COLORS.primary
          }]
        });
      }
    }, 0);

    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.population = {
    init,
    translate() { NadiI18n.applyTranslations(); }
  };
})();
