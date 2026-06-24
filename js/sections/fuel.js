/* ============================================================
   KTMY — Fuel Prices Section Module (DataStore-powered)
   ------------------------------------------------------------
   Data Source: Real weekly retail fuel prices fetched from
   Ministry of Finance API (data.gov.my) and BUDI Madani guidelines.
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let rendered = false;
  let chartInstance = null;
  let lastRecords = null;
  let storeUnsubscribe = null;

  function init() {
    const container = document.getElementById('section-fuel-content');
    if (!container) return;

    if (lastRecords) {
      renderSection(container, lastRecords);
      return;
    }

    if (initialized) return;
    initialized = true;

    // Subscribe to DataStore — will fire immediately if data is cached
    storeUnsubscribe = KtmyStore.on('fuel', (data, status) => {
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
      lastRecords = records;
      renderSection(container, records);
      rendered = true;
    });

    if (KtmyStore.status('fuel') === 'idle') {
      showLoading(container);
    }
  }

  function showLoading(container) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>${KtmyI18n.t('common.loading')}</p>
      </div>`;
  }

  function showError(container) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⛽</div>
        <p class="error-message">${KtmyI18n.t('common.error')}</p>
        <button class="btn btn-outline" onclick="KtmyStore.refresh('fuel')">Retry</button>
      </div>`;
  }

  function formatChange(change) {
    const isBm = KtmyI18n.getLang() === 'bm';
    if (Math.abs(change) < 0.001) return `<span class="stat-change neutral">${isBm ? 'Tiada Perubahan' : 'Unchanged'}</span>`;
    const sign = change > 0 ? '+' : '';
    const cls = change > 0 ? 'down' : 'up'; // price up = bad (red), price down = good (green)
    const icon = change > 0 ? '↑' : '↓';
    return `<span class="stat-change ${cls}">${icon} ${sign}${change.toFixed(2)}</span>`;
  }

  function renderSection(container, records) {
    const isBm = KtmyI18n.getLang() === 'bm';
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
      isBm ? 'ms-MY' : 'en-US',
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
          <span class="price-unit">${isBm ? 'seliter' : 'per litre'}</span>
          <div class="mt-sm">${formatChange(c95)}</div>
        </div>
        <div class="price-tag reveal">
          <span class="price-label" style="color:var(--primary);">RON 97</span>
          <span class="price-value">RM ${ron97.toFixed(2)}</span>
          <span class="price-unit">${isBm ? 'seliter' : 'per litre'}</span>
          <div class="mt-sm">${formatChange(c97)}</div>
        </div>
        <div class="price-tag reveal">
          <span class="price-label" style="color:var(--accent-blue);">${isBm ? 'Diesel (Semenanjung)' : 'Diesel (Peninsular)'}</span>
          <span class="price-value">RM ${dieselP.toFixed(2)}</span>
          <span class="price-unit">${isBm ? 'seliter' : 'per litre'}</span>
          <div class="mt-sm">${formatChange(cDP)}</div>
        </div>
        <div class="price-tag reveal">
          <span class="price-label" style="color:var(--accent-purple);">${isBm ? 'Diesel (Sabah/Sarawak)' : 'Diesel (East MY)'}</span>
          <span class="price-value">RM ${dieselE.toFixed(2)}</span>
          <span class="price-unit">${isBm ? 'seliter' : 'per litre'}</span>
          <div class="mt-sm">${formatChange(cDE)}</div>
        </div>
      </div>

      <div class="glass-card reveal mb-xl">
        <h3 class="chart-title">${isBm ? 'Sejarah Harga (12 Bulan)' : 'Price History (12 Months)'}</h3>
        <div class="chart-container" style="height:380px;">
          <canvas id="chart-fuel-history"></canvas>
        </div>
      </div>

      <div class="glass-card reveal flex-col gap-md mb-xl" style="text-align: left;">
        <h3 class="chart-title">${isBm ? 'Subsidi & Kuota (Peraturan Rasmi)' : 'Subsidy & Quotas (Official Rules)'}</h3>
        
        <div class="grid grid-2 stagger" style="gap: var(--space-md);">
          <div class="info-card" style="padding: var(--space-md); margin-bottom: 0;">
            <div class="info-icon" style="width: 36px; height: 36px; font-size: 1.1rem; background: rgba(255, 215, 0, 0.1); border: 1px solid var(--accent-gold); color: var(--accent-gold);">⛽</div>
            <div class="info-content">
              <h4 style="color: var(--accent-gold);">${isBm ? 'Subsidi Bersasar RON 95' : 'RON 95 Targeted Subsidy'}</h4>
              <p style="font-size: 0.72rem; line-height: 1.4; color: var(--text-secondary);">
                ${isBm ? `
                  Kadar Bersubsidi: <strong>RM2.05/liter</strong> (Kadar pasaran diapungkan pada ~RM3.25/liter).<br>
                  <strong>Kelayakan:</strong> Meliputi 85% warganegara Malaysia (termasuk B40, M40, dan T20 rendah). Golongan berpendapatan tinggi T15 dan warga asing tidak layak. Pengesahan dilakukan melalui MyKad di pam minyak atau pendaftaran PADU.<br>
                  <strong>Had Kuota:</strong> Tiada had kuota (Isipadu tanpa had sebulan untuk rakyat yang layak).
                ` : `
                  Subsidised Rate: <strong>RM2.05/litre</strong> (Market rate floated at ~RM3.25/litre).<br>
                  <strong>Eligibility:</strong> Covers 85% of all Malaysian citizens (including B40, M40, and lower T20 groups). Only the top 15% high-income class (T15) and foreign nationals are ineligible. MyKad verification at the pump or PADU registration is required.<br>
                  <strong>Quota Limit:</strong> Unlimited volume per transaction/month for all eligible citizens (no specific volume cap).
                `}
              </p>
            </div>
          </div>

          <div class="info-card" style="padding: var(--space-md); margin-bottom: 0;">
            <div class="info-icon" style="width: 36px; height: 36px; font-size: 1.1rem; background: rgba(77, 124, 254, 0.1); border: 1px solid var(--accent-blue); color: var(--accent-blue);">🚛</div>
            <div class="info-content">
              <h4 style="color: var(--accent-blue);">${isBm ? 'Kuota & Subsidi Diesel (BUDI Madani)' : 'Diesel & Fuel Quotas (BUDI Madani)'}</h4>
              <p style="font-size: 0.72rem; line-height: 1.4; color: var(--text-secondary);">
                ${isBm ? `
                  Kadar Pam Bersubsidi: <strong>RM2.15/liter</strong> (Sabah/Sarawak) dan kadar pasaran <strong>RM3.35/liter</strong> (Semenanjung).<br>
                  <strong>Kuota Isipadu BUDI Madani:</strong> Pemilik kenderaan diesel persendirian dan pekebun kecil yang layak menerima kuota bulanan sebanyak <strong>200 liter</strong> pada kadar subsidi <strong>RM2.10/liter</strong> (fleksibel untuk diesel dan RON95) melalui pengesahan MyKad di pam. Pemilik pikap/jeep persendirian boleh memohon tambahan 100 liter (jumlah <strong>300 liter/bulan</strong>).<br>
                  <strong>Kad Fleet SKDS (Komersial):</strong> Logistik, pengangkutan awam, dan perkhidmatan kecemasan yang diluluskan diperuntukkan kuota isipadu bulanan tertentu (antara 1,000 hingga 5,000+ liter) melalui kad fleet pada kadar RM1.88/liter atau RM2.15/liter.
                ` : `
                  Subsidised Pump Rate: <strong>RM2.15/litre</strong> (Sabah/Sarawak) and market rate of <strong>RM3.35/litre</strong> (Peninsular).<br>
                  <strong>BUDI Madani Volume Quota:</strong> Entitles eligible private diesel vehicle owners and smallholders to a monthly quota of <strong>200 litres</strong> at a subsidised rate of <strong>RM2.10/litre</strong> (flexible for both diesel and RON95) via MyKad verification at the pump. Private pickup/jeep owners can apply for an additional 100 litres, bringing the total quota to <strong>300 litres/month</strong>.<br>
                  <strong>SKDS Fleet Cards (Commercial):</strong> Approved logistics, public transport, and emergency services vehicles are allocated specific monthly volume quotas (ranging from 1,000 to 5,000+ litres) via fleet cards at RM1.88/litre or RM2.15/litre.
                `}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      KtmyCharts.destroyChart('chart-fuel-history');
      const chartRecords = records.slice(-30);
      const labels = chartRecords.map(r => new Date(r.date).toLocaleDateString(isBm ? 'ms-MY' : 'en-US', { day: 'numeric', month: 'short' }));
      chartInstance = KtmyCharts.createLineChart('chart-fuel-history', {
        labels,
        datasets: [
          { label: 'RON 95', data: chartRecords.map(r => parseFloat(r.ron95)), color: KtmyCharts.COLORS.gold },
          { label: 'RON 97', data: chartRecords.map(r => parseFloat(r.ron97)), color: KtmyCharts.COLORS.primary },
          { label: isBm ? 'Diesel (Semenanjung)' : 'Diesel (Peninsular)', data: chartRecords.map(r => parseFloat(r.diesel_peninsular || r.diesel)), color: KtmyCharts.COLORS.blue },
        ],
        yLabel: isBm ? 'RM / liter' : 'RM / litre'
      });
    }, 0);

    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.fuel = {
    init,
    translate() {
      const container = document.getElementById('section-fuel-content');
      if (container && lastRecords) {
        renderSection(container, lastRecords);
      }
    }
  };
})();
