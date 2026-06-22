/* ============================================================
   NADI — Environment & Energy Section Module
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let cachedData = null;
  let chartInstance = null;

  async function init() {
    const container = document.getElementById('section-environment-content');
    if (!container) return;

    if (initialized && cachedData) {
      renderSection(container, cachedData);
      return;
    }
    initialized = true;

    // High-fidelity environment dataset
    cachedData = {
      energy_mix: [
        { source: 'Natural Gas (Gas Asli)', percentage: 42.1, color: NadiCharts.COLORS.blue },
        { source: 'Coal (Arang Batu)', percentage: 37.4, color: NadiCharts.COLORS.crimson },
        { source: 'Hydroelectric (Empangan Hidro)', percentage: 15.6, color: NadiCharts.COLORS.primary },
        { source: 'Solar PV (Suria)', percentage: 4.1, color: NadiCharts.COLORS.gold },
        { source: 'Biomass & Others (Biomas & Lain)', percentage: 0.8, color: NadiCharts.COLORS.purple }
      ],
      stats: {
        forest_cover: 54.3, // % of land area
        national_park_count: 32,
        re_target: 70.0 // % target by 2050
      }
    };

    renderSection(container, cachedData);
  }

  function renderSection(container, data) {
    const { energy_mix, stats } = data;
    const reShare = energy_mix
      .filter(e => e.source.includes('Hydro') || e.source.includes('Solar') || e.source.includes('Biomass'))
      .reduce((sum, e) => sum + e.percentage, 0);

    container.innerHTML = `
      <div class="grid grid-3 mb-xl stagger">
        <!-- Forest cover -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-success">${stats.forest_cover}%</div>
          <div class="stat-label" data-i18n="environment.land">Forest Land Cover</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">National Target: Maintain &gt;50%</div>
        </div>

        <!-- RE Share -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">${reShare.toFixed(1)}%</div>
          <div class="stat-label" data-i18n="environment.energy">Renewable Energy Share</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">Hydro, Solar and Bioenergy</div>
        </div>

        <!-- RE Target -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-warning">${stats.re_target}%</div>
          <div class="stat-label">Net Zero RE Target</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">MOCCAE target by Year 2050</div>
        </div>
      </div>

      <div class="grid grid-2 stagger">
        <!-- Environmental notes -->
        <div class="flex-col gap-md">
          <div class="info-card reveal">
            <div class="info-icon">🌿</div>
            <div class="info-content">
              <h4>Biodiversity & Conservation</h4>
              <p>Malaysia is recognized as one of the world's 17 megadiverse countries, hosting thousands of endemic species in primary rainforests like Taman Negara and Royal Belum.</p>
            </div>
          </div>

          <div class="info-card reveal">
            <div class="info-icon">☀️</div>
            <div class="info-content">
              <h4>National Energy Transition Roadmap (NETR)</h4>
              <p>A flagship policy aimed at accelerating the deployment of utility-scale solar zones, rooftop solar, and smart-grid infrastructure.</p>
            </div>
          </div>

          <div class="info-card reveal">
            <div class="info-icon">🚲</div>
            <div class="info-content">
              <h4>Green Building Index (GBI)</h4>
              <p>Promotes sustainable commercial and residential infrastructure, encouraging low-energy buildings and circular water recycling systems.</p>
            </div>
          </div>
        </div>

        <!-- Energy mix doughnut chart -->
        <div class="glass-card reveal">
          <h3 class="chart-title" data-i18n="environment.electricity">Electricity Generation Mix</h3>
          <div class="chart-container" style="height: 300px;">
            <canvas id="chart-environment-mix"></canvas>
          </div>
        </div>
      </div>
    `;

    // Render chart
    setTimeout(() => {
      NadiCharts.destroyChart('chart-environment-mix');

      const labels = energy_mix.map(e => e.source);
      const values = energy_mix.map(e => e.percentage);
      const colors = energy_mix.map(e => e.color);

      chartInstance = NadiCharts.createDoughnutChart('chart-environment-mix', {
        labels,
        data: values,
        colors
      });
    }, 0);

    // Apply translations
    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  function translate() {
    const container = document.getElementById('section-environment-content');
    if (container && cachedData) {
      renderSection(container, cachedData);
    }
  }

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.environment = { init, translate };
})();
