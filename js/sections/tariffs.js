/* ============================================================
   NADI — TNB Electricity Tariffs Section Module (DataStore-powered)
   ============================================================ */

(function () {
  'use strict';
  let rendered = false;

  const CATEGORY_ICONS = {
    residential: '🏠',
    commercial:  '🏢',
    industrial:  '🏭',
    agriculture: '🌾',
  };

  const CATEGORY_COLORS = {
    residential: 'var(--primary)',
    commercial:  'var(--accent-blue)',
    industrial:  'var(--accent-gold)',
    agriculture: 'var(--accent-purple)',
  };

  function init() {
    const container = document.getElementById('section-tariffs-content');
    if (!container) return;

    // Subscribe to DataStore — fires immediately if cached
    NadiStore.on('tnb_tariffs', (data, status) => {
      if (status === 'loading') {
        if (!rendered) showLoading(container);
        return;
      }
      if (status === 'error' || !data) {
        showError(container);
        return;
      }

      const tariffs = data.data || data;
      if (!tariffs || Object.keys(tariffs).length === 0) {
        showError(container);
        return;
      }

      renderSection(container, tariffs);
      rendered = true;
    });

    if (NadiStore.status('tnb_tariffs') === 'idle') {
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
        <div class="error-icon">⚡</div>
        <p class="error-message">${NadiI18n.t('common.error')}</p>
        <button class="btn btn-outline" onclick="NadiStore.refresh('tnb_tariffs')">Retry</button>
      </div>`;
  }

  function renderSection(container, tariffs) {
    const categories = Object.keys(tariffs);

    // Summary cards from residential tier 1
    const res = tariffs.residential || {};
    const tiers = res.tiers || [];
    const minRate = tiers.length > 0 ? tiers[0].rate : 0;
    const midTier = tiers.find(t => t.tier === 3) || {};
    const maxTier = tiers.length > 0 ? tiers[tiers.length - 1] : {};

    const summaryCardsHtml = `
      <div class="grid grid-4 stagger mb-xl">
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">RM ${minRate.toFixed(3)}</div>
          <div class="stat-label">Residential Tier 1</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">1-200 kWh</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow" style="color: var(--accent-gold);">RM ${midTier.rate ? midTier.rate.toFixed(3) : '0.571'}</div>
          <div class="stat-label">Residential Tier 3</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">301-600 kWh</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow text-danger">RM ${maxTier.rate ? maxTier.rate.toFixed(3) : '1.022'}</div>
          <div class="stat-label">Residential Tier 5</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">901+ kWh</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">${res.minimum_charge || 'RM3.00'}</div>
          <div class="stat-label">Minimum Monthly</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">Residential</div>
        </div>
      </div>
    `;

    // Tariff detail cards for each category
    const tariffCardsHtml = categories.map(cat => {
      const tariff = tariffs[cat];
      const icon = CATEGORY_ICONS[cat] || '⚡';
      const color = CATEGORY_COLORS[cat] || 'var(--primary)';

      const tierRows = (tariff.tiers || []).map(t => `
        <tr style="border-bottom: 1px solid var(--glass-border);">
          <td style="padding: 10px 8px; font-weight: 600; color: var(--text-primary);">Tier ${t.tier}</td>
          <td style="padding: 10px 8px;">${t.range}</td>
          <td style="padding: 10px 8px; font-weight: 700; color: ${color};">RM ${t.rate.toFixed(3)}</td>
          <td class="text-muted" style="padding: 10px 8px;">${t.monthly_min || '-'}</td>
          <td class="text-muted" style="padding: 10px 8px;">${t.monthly_max || '-'}</td>
        </tr>
      `).join('');

      return `
        <div class="glass-card reveal mb-md" style="text-align: left;">
          <div class="flex-between mb-md">
            <h4 style="color: ${color}; font-weight: var(--fw-bold); font-size: var(--fs-h4);">
              ${icon} ${tariff.name || cat}
            </h4>
            <span class="tag tag-primary">${tariff.minimum_charge || 'N/A'}</span>
          </div>
          <p class="text-muted mb-md" style="font-size: var(--fs-sm);">${tariff.description || ''}</p>
          <div style="overflow-x: auto;">
            <table style="width:100%; border-collapse:collapse; font-size: var(--fs-sm);">
              <thead>
                <tr style="border-bottom: 2px solid var(--glass-border);">
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">Tier</th>
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">Usage Range</th>
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">Rate (RM/kWh)</th>
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">Min Monthly</th>
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">Max Monthly</th>
                </tr>
              </thead>
              <tbody>
                ${tierRows}
              </tbody>
            </table>
          </div>
          <div class="mt-md flex-between" style="font-size: var(--fs-xs); color: var(--text-muted);">
            <span>Service charge: ${tariff.service_charge || 'N/A'}</span>
            <span>Effective: ${tariff.effective_date || 'N/A'}</span>
          </div>
          ${tariff.kwtbb_levy ? `<div class="mt-xs" style="font-size: var(--fs-xs); color: var(--text-muted);">KWTBB levy: ${tariff.kwtbb_levy}</div>` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <h3 class="chart-title reveal mb-md" data-i18n="tariffs.title">⚡ TNB Electricity Tariffs</h3>
      <p class="text-muted reveal mb-xl" style="font-size: var(--fs-small);">
        Current Tenaga Nasional Berhad (TNB) tariff rates by category. 
        Effective from ${res.effective_date || 'January 2024'}.
      </p>

      ${summaryCardsHtml}

      <h3 class="chart-title reveal mb-md">Tariff Details by Category</h3>
      <div class="flex-col stagger">
        ${tariffCardsHtml}
      </div>

      <div class="glass-card reveal mt-xl" style="text-align: left; border-left: 3px solid var(--primary);">
        <h4 style="color: var(--primary); margin-bottom: 8px;">💡 Tips to Reduce Your TNB Bill</h4>
        <ul style="font-size: var(--fs-sm); color: var(--text-secondary); line-height: 1.8;">
          <li>Use energy-efficient appliances (5-star rated)</li>
          <li>Set air conditioning to 24-25°C</li>
          <li>Switch off lights and fans when not in use</li>
          <li>Use timer switches for water heaters</li>
          <li>Check for phantom loads (standby power)</li>
        </ul>
      </div>
    `;

    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  function translate() {
    const container = document.getElementById('section-tariffs-content');
    if (container && rendered) {
      NadiI18n.applyTranslations();
    }
  }

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.tariffs = { init, translate };
})();
