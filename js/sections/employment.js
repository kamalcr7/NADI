/* ============================================================
   NADI — Employment & Jobs Section (DataStore-powered)
   ============================================================ */

(function () {
  'use strict';

  function parseDS(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }

  function init() {
    const container = document.getElementById('section-employment-content');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading labour force data...</p></div>`;

    NadiStore.on('unemployment', (data, status) => {
      if (status === 'loading') return;
      const records = parseDS(data);
      if (status === 'error' || records.length === 0) {
        renderFallback(container);
        return;
      }
      renderSection(container, records);
    });
  }

  function renderFallback(container) {
    // Show static data if API unavailable
    const staticData = {
      unemploymentRate: 3.3,
      labourForce: 16.9,
      employed: 16.3,
      participation: 70.8
    };
    renderSection(container, [], staticData);
  }

  function renderSection(container, records, fallback = null) {
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1] || {};

    const uRate = latest.u_rate !== undefined ? parseFloat(latest.u_rate) : (fallback?.unemploymentRate || 3.3);
    const lfVal = latest.lf !== undefined ? (parseFloat(latest.lf) / 1000).toFixed(1) : (fallback?.labourForce || '16.9');
    const employedVal = latest.lf_employed !== undefined ? (parseFloat(latest.lf_employed) / 1000).toFixed(1) : (fallback?.employed || '16.3');
    const pRate = latest.p_rate !== undefined ? parseFloat(latest.p_rate) : (fallback?.participation || 70.8);

    const fmtDate = latest.date ? new Date(latest.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Latest';

    container.innerHTML = `
      <!-- Labour Market KPIs -->
      <div class="grid grid-4 stagger mb-xl">
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">📊</div>
          <div class="stat-number ${uRate < 4 ? 'text-success' : uRate < 5 ? 'text-warning' : 'text-danger'}">${uRate.toFixed(1)}%</div>
          <div class="stat-label">Unemployment Rate</div>
          <div class="stat-date">${fmtDate}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">👷</div>
          <div class="stat-number gradient-text">${lfVal}M</div>
          <div class="stat-label">Labour Force</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">💼</div>
          <div class="stat-number text-success">${employedVal}M</div>
          <div class="stat-label">Employed</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">📈</div>
          <div class="stat-number">${pRate.toFixed(1)}%</div>
          <div class="stat-label">Participation Rate</div>
        </div>
      </div>

      <!-- Unemployment Trend Chart -->
      ${sorted.length > 2 ? `
        <div class="glass-card reveal mb-lg">
          <h3 class="chart-title">📉 Unemployment Rate Trend</h3>
          <div class="chart-container" style="height:280px;">
            <canvas id="chart-unemployment-trend"></canvas>
          </div>
        </div>` : ''}

      <!-- Sector Info Cards -->
      <div class="grid grid-3 stagger mt-lg">
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🏗️</div>
          <h4>Construction</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            Key employer in infrastructure. Rapid growth due to major development projects.
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🏭</div>
          <h4>Manufacturing</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            Electronics and semiconductor sector drives significant exports and employment.
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🖥️</div>
          <h4>Digital Economy</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            Malaysia's Digital Economy Blueprint targets 22.6% GDP contribution by 2025.
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🌾</div>
          <h4>Agriculture</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            Palm oil and rubber remain key exports. Agri-tech modernisation underway.
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🛍️</div>
          <h4>Retail & Services</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            Largest employment sector. Tourism and hospitality recovery post-pandemic.
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🔬</div>
          <h4>Science & Tech</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            Cyberjaya and MSC Malaysia foster tech startups and R&D investment.
          </p>
        </div>
      </div>
    `;

      setTimeout(() => {
        if (sorted.length > 2) {
          NadiCharts.destroyChart('chart-unemployment-trend');
          NadiCharts.createAreaChart('chart-unemployment-trend', {
            labels: sorted.map(r => new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })),
            datasets: [{
              label: 'Unemployment Rate (%)',
              data: sorted.map(r => parseFloat(r.u_rate || r.rate || r.unemployment || 0)),
              color: NadiCharts.COLORS.gold
            }],
            yLabel: '%'
          });
        }
      }, 0);

    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.employment = {
    init,
    translate() { NadiI18n.applyTranslations(); }
  };
})();
