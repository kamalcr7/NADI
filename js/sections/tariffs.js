/* ============================================================
   KTMY — TNB Electricity Tariffs Section Module (DataStore-powered)
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let cachedTariffs = null;

  const CATEGORY_ICONS = {
    residential: '🏠',
    commercial: '🏢',
    industrial: '🏭',
    agriculture: '🌾'
  };

  const CATEGORY_COLORS = {
    residential: 'var(--primary)',
    commercial: 'var(--accent-blue)',
    industrial: 'var(--accent-purple)',
    agriculture: 'var(--accent-gold)'
  };

  function init() {
    const container = document.getElementById('section-tariffs-content');
    if (!container) return;

    if (cachedTariffs) {
      renderSection(container, cachedTariffs);
      return;
    }

    if (initialized) return;
    initialized = true;

    // Subscribe to DataStore — fires immediately if cached
    KtmyStore.on('tnb_tariffs', (data, status) => {
      if (status === 'loading') {
        const isBm = KtmyI18n.getLang() === 'bm';
        container.innerHTML = `
          <div class="loading-state">
            <div class="spinner"></div>
            <p>${isBm ? 'Memuatkan tarif elektrik...' : 'Loading electricity tariffs...'}</p>
          </div>`;
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

      cachedTariffs = tariffs;
      renderSection(container, tariffs);
    });

    if (KtmyStore.status('tnb_tariffs') === 'idle') {
      const isBm = KtmyI18n.getLang() === 'bm';
      container.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>${isBm ? 'Memuatkan tarif elektrik...' : 'Loading electricity tariffs...'}</p>
        </div>`;
    }
  }

  function showError(container) {
    const isBm = KtmyI18n.getLang() === 'bm';
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚡</div>
        <p class="error-message">${isBm ? 'Gagal memuatkan data tarif.' : 'Could not load tariff data.'}</p>
        <button class="btn btn-outline" onclick="KtmyStore.refresh('tnb_tariffs')">${isBm ? 'Cuba Semula' : 'Retry'}</button>
      </div>`;
  }

  function renderSection(container, tariffs) {
    const isBm = KtmyI18n.getLang() === 'bm';
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
          <div class="stat-label">${isBm ? 'Kediaman Tier 1' : 'Residential Tier 1'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">1-200 kWh</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow" style="color: var(--accent-gold);">RM ${midTier.rate ? midTier.rate.toFixed(3) : '0.571'}</div>
          <div class="stat-label">${isBm ? 'Kediaman Tier 3' : 'Residential Tier 3'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">301-600 kWh</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow text-danger">RM ${maxTier.rate ? maxTier.rate.toFixed(3) : '1.022'}</div>
          <div class="stat-label">${isBm ? 'Kediaman Tier 5' : 'Residential Tier 5'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">901+ kWh</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">${res.minimum_charge || 'RM3.00'}</div>
          <div class="stat-label">${isBm ? 'Minimum Bulanan' : 'Minimum Monthly'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">${isBm ? 'Kediaman' : 'Residential'}</div>
        </div>
      </div>
    `;

    // Static translations for category names and descriptions
    const catTranslations = {
      residential: {
        name: isBm ? 'Kediaman (Tarif A)' : 'Residential (Tariff A)',
        desc: isBm ? 'Bekalan untuk rumah kediaman domestik' : 'Domestic household supply'
      },
      commercial: {
        name: isBm ? 'Komersial (Tarif B)' : 'Commercial (Tariff B)',
        desc: isBm ? 'Pejabat, kedai, hotel, dll.' : 'Office, shop, hotel, etc.'
      },
      industrial: {
        name: isBm ? 'Perindustrian (Tarif C)' : 'Industrial (Tariff C)',
        desc: isBm ? 'Kilang dan industri pembuatan' : 'Factory, manufacturing'
      },
      agriculture: {
        name: isBm ? 'Pertanian (Tarif D)' : 'Agriculture (Tariff D)',
        desc: isBm ? 'Pertanian, perikanan, dan ternakan' : 'Farming, fisheries, livestock'
      }
    };

    // Tariff detail cards for each category
    const tariffCardsHtml = categories.map(cat => {
      const tariff = tariffs[cat];
      const icon = CATEGORY_ICONS[cat] || '⚡';
      const color = CATEGORY_COLORS[cat] || 'var(--primary)';

      const tName = catTranslations[cat]?.name || tariff.name || cat;
      const tDesc = catTranslations[cat]?.desc || tariff.description || '';

      const tierRows = (tariff.tiers || []).map(t => {
        const tMax = t.monthly_max === 'No limit' ? (isBm ? 'Tiada had' : 'No limit') : (t.monthly_max || '-');
        return `
          <tr style="border-bottom: 1px solid var(--glass-border);">
            <td style="padding: 10px 8px; font-weight: 600; color: var(--text-primary);">${isBm ? 'Tier' : 'Tier'} ${t.tier}</td>
            <td style="padding: 10px 8px;">${t.range}</td>
            <td style="padding: 10px 8px; font-weight: 700; color: ${color};">RM ${t.rate.toFixed(3)}</td>
            <td class="text-muted" style="padding: 10px 8px;">${t.monthly_min || '-'}</td>
            <td class="text-muted" style="padding: 10px 8px;">${tMax}</td>
          </tr>
        `;
      }).join('');

      let svc = tariff.service_charge || 'N/A';
      if (isBm) {
        svc = svc.replace(/single phase/g, 'satu fasa').replace(/three phase/g, 'tiga fasa');
      }

      return `
        <div class="glass-card reveal mb-md" style="text-align: left;">
          <div class="flex-between mb-md">
            <h4 style="color: ${color}; font-weight: var(--fw-bold); font-size: var(--fs-h4);">
              ${icon} ${tName}
            </h4>
            <span class="tag tag-primary">${isBm ? 'Min' : 'Min'} ${tariff.minimum_charge || 'N/A'}</span>
          </div>
          <p class="text-muted mb-md" style="font-size: var(--fs-sm);">${tDesc}</p>
          <div style="overflow-x: auto;">
            <table style="width:100%; border-collapse:collapse; font-size: var(--fs-sm);">
              <thead>
                <tr style="border-bottom: 2px solid var(--glass-border);">
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">${isBm ? 'Tier' : 'Tier'}</th>
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">${isBm ? 'Julat Penggunaan' : 'Usage Range'}</th>
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">${isBm ? 'Kadar (RM/kWh)' : 'Rate (RM/kWh)'}</th>
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">${isBm ? 'Min Bulanan' : 'Min Monthly'}</th>
                  <th style="text-align:left; padding: 8px; color: var(--text-muted); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em;">${isBm ? 'Maks Bulanan' : 'Max Monthly'}</th>
                </tr>
              </thead>
              <tbody>
                ${tierRows}
              </tbody>
            </table>
          </div>
          <div class="mt-md flex-between" style="font-size: var(--fs-xs); color: var(--text-muted);">
            <span>${isBm ? 'Caj perkhidmatan' : 'Service charge'}: ${svc}</span>
            <span>${isBm ? 'Berkuat kuasa' : 'Effective'}: ${tariff.effective_date || 'N/A'}</span>
          </div>
          ${tariff.kwtbb_levy ? `<div class="mt-xs" style="font-size: var(--fs-xs); color: var(--text-muted);">${isBm ? 'Levi KWTBB' : 'KWTBB levy'}: ${tariff.kwtbb_levy}</div>` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <h3 class="chart-title reveal mb-md">⚡ ${isBm ? 'Tarif Elektrik TNB' : 'TNB Electricity Tariffs'}</h3>
      <p class="text-muted reveal mb-xl" style="font-size: var(--fs-small);">
        ${isBm ? `Kadar tarif semasa Tenaga Nasional Berhad (TNB) mengikut kategori. Berkuat kuasa dari ${new Date(res.effective_date).toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}.` : `Current Tenaga Nasional Berhad (TNB) tariff rates by category. Effective from ${new Date(res.effective_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`}
      </p>

      ${summaryCardsHtml}

      <h3 class="chart-title reveal mb-md">${isBm ? 'Butiran Tarif Mengikut Kategori' : 'Tariff Details by Category'}</h3>
      <div class="flex-col stagger">
        ${tariffCardsHtml}
      </div>

      <div class="glass-card reveal mt-xl" style="text-align: left; border-left: 3px solid var(--primary);">
        <h4 style="color: var(--primary); margin-bottom: 8px;">💡 ${isBm ? 'Tips untuk Mengurangkan Bil TNB Anda' : 'Tips to Reduce Your TNB Bill'}</h4>
        <ul style="font-size: var(--fs-sm); color: var(--text-secondary); line-height: 1.8;">
          <li>${isBm ? 'Gunakan peralatan elektrik cekap tenaga (berpenarafan 5-bintang)' : 'Use energy-efficient appliances (5-star rated)'}</li>
          <li>${isBm ? 'Tetapkan suhu penyaman udara pada 24-25°C' : 'Set air conditioning to 24-25°C'}</li>
          <li>${isBm ? 'Matikan suis lampu dan kipas apabila keluar dari bilik' : 'Switch off lights and fans when not in use'}</li>
          <li>${isBm ? 'Gunakan suis pemasa (timer) untuk pemanas air' : 'Use timer switches for water heaters'}</li>
          <li>${isBm ? 'Periksa beban fantom (kuasa elektrik siap sedia yang tidak digunakan)' : 'Check for phantom loads (standby power)'}</li>
        </ul>
      </div>
    `;

    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.tariffs = {
    init,
    translate() {
      const container = document.getElementById('section-tariffs-content');
      if (container && cachedTariffs) {
        renderSection(container, cachedTariffs);
      }
    }
  };
})();
