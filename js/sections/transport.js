/* ============================================================
   KTMY — Transportation Section Module
   ------------------------------------------------------------
   Data Sources:
   1. Ridership Trends: Live daily boarding data fetched from
      Ministry of Transport API (data.gov.my).
   2. Fares & Info: Hand-curated from official operator matrices
      (RapidKL, KTMB, ERL, and Grab).
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let cachedData = null;
  let chartInstance = null;

  async function init() {
    const container = document.getElementById('section-transport-content');
    if (!container) return;

    if (initialized && cachedData) {
      renderSection(container, cachedData.ridership, cachedData.fares);
      return;
    }
    initialized = true;

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p data-i18n="common.loading">${KtmyI18n.t('common.loading')}</p>
      </div>
    `;

    let ridershipData = null;
    let faresData = null;

    function tryRender() {
      if (ridershipData !== null && faresData !== null) {
        cachedData = { ridership: ridershipData, fares: faresData };
        renderSection(container, ridershipData, faresData);
      }
    }

    // Subscribe to KTMY transport ridership data
    KtmyStore.on('transport', (data, status) => {
      if (status === 'loading') return;

      let records = [];
      if (data) {
        records = Array.isArray(data) ? data : (data.data || []);
      }

      if (records.length === 0) {
        records = getMockRidershipData();
      }

      // Check if data is daily or already monthly
      const isDaily = records.some(r => r.rail_mrt_kajang !== undefined || r.bus_rkl !== undefined);

      let processedRecords = [];
      if (isDaily) {
        const monthlyMap = {};
        records.forEach(r => {
          if (!r.date) return;
          const monthKey = r.date.substring(0, 7); // "YYYY-MM"
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { date: monthKey + '-01', rail: 0, bus: 0 };
          }
          const railSum = (parseFloat(r.rail_ets) || 0) +
                          (parseFloat(r.rail_lrt_kj) || 0) +
                          (parseFloat(r.rail_tebrau) || 0) +
                          (parseFloat(r.rail_komuter) || 0) +
                          (parseFloat(r.rail_mrt_pjy) || 0) +
                          (parseFloat(r.rail_monorail) || 0) +
                          (parseFloat(r.rail_intercity) || 0) +
                          (parseFloat(r.rail_lrt_ampang) || 0) +
                          (parseFloat(r.rail_mrt_kajang) || 0) +
                          (parseFloat(r.rail_komuter_utara) || 0);

          const busSum = (parseFloat(r.bus_rkl) || 0) +
                         (parseFloat(r.bus_rpn) || 0) +
                         (parseFloat(r.bus_rkn) || 0);

          monthlyMap[monthKey].rail += railSum;
          monthlyMap[monthKey].bus += busSum;
        });
        processedRecords = Object.values(monthlyMap);
      } else {
        processedRecords = records.map(r => ({
          date: r.date,
          rail: parseFloat(r.rail || 0) * 1000,
          bus: parseFloat(r.bus || 0) * 1000
        }));
      }

      processedRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
      ridershipData = processedRecords;
      tryRender();
    });

    // Subscribe to KTMY transport fares data
    KtmyStore.on('transport_fares', (data, status) => {
      if (status === 'loading') return;
      faresData = data || getMockFaresData();
      tryRender();
    });
  }

  function getMockRidershipData() {
    return [
      { date: '2025-07-01', rail: 22400, bus: 5600, total: 28000 },
      { date: '2025-08-01', rail: 23100, bus: 5800, total: 28900 },
      { date: '2025-09-01', rail: 22900, bus: 5900, total: 28800 },
      { date: '2025-10-01', rail: 23800, bus: 6100, total: 29900 },
      { date: '2025-11-01', rail: 24200, bus: 6200, total: 30400 },
      { date: '2025-12-01', rail: 25100, bus: 6800, total: 31900 },
      { date: '2026-01-01', rail: 24500, bus: 6300, total: 30800 },
      { date: '2026-02-01', rail: 23200, bus: 6000, total: 29200 },
      { date: '2026-03-01', rail: 25800, bus: 6900, total: 32700 },
      { date: '2026-04-01', rail: 26100, bus: 7100, total: 33200 },
      { date: '2026-05-01', rail: 26900, bus: 7400, total: 34300 },
      { date: '2026-06-01', rail: 27800, bus: 7900, total: 35700 }
    ];
  }

  function getMockFaresData() {
    return {
      mrt_lrt: {
        name: "MRT & LRT Fares",
        operator: "RapidKL",
        currency: "MYR",
        minimum_fare: "RM1.00",
        maximum_fare: "RM6.40 (single trip)",
        day_pass: "RM5.00 (unlimited rides)",
        notes: "Fares calculated by distance. Touch 'n Go required."
      },
      kktm: {
        name: "KTM Komuter Fares",
        operator: "KTMB",
        routes: [
          { route: "KL Sentral - Batu Caves", fare: "RM2.50", duration: "30 min" },
          { route: "KL Sentral - Port Klang", fare: "RM4.80", duration: "70 min" },
          { route: "KL Sentral - Rawang", fare: "RM3.90", duration: "50 min" },
          { route: "KL Sentral - Seremban", fare: "RM7.50", duration: "120 min" }
        ]
      },
      ets: {
        name: "ETS (Electric Train Service)",
        operator: "KTMB",
        routes: [
          { route: "KL Sentral - Ipoh", fare: "RM35-55", duration: "2h 15m", classes: ["Platinum", "Gold", "Silver"] },
          { route: "KL Sentral - Butterworth", fare: "RM55-80", duration: "4h", classes: ["Platinum", "Gold"] },
          { route: "Ipoh - Butterworth", fare: "RM25-40", duration: "1h 45m", classes: ["Platinum", "Gold", "Silver"] }
        ]
      },
      klia_express: {
        name: "KLIA Ekspres",
        operator: "ERL",
        fare: "RM55.00 (single) / RM100.00 (return)",
        duration: "33 minutes",
        frequency: "Every 20 minutes"
      },
      grab: {
        name: "Grab (Ride-hailing)",
        estimated_fares: [
          { route: "KLIA - KLCC", fare: "RM70-100", duration: "45-60 min" },
          { route: "KL Sentral - Bukit Bintang", fare: "RM8-15", duration: "15 min" },
          { route: "KL Sentral - Petaling Jaya", fare: "RM25-40", duration: "30 min" }
        ],
        note: "Fares vary by demand (surge pricing)"
      }
    };
  }

  function renderSection(container, ridership, faresData) {
    const latest = ridership[ridership.length - 1];
    
    // Total rail and bus ridership (formatted)
    const railRidership = parseFloat(latest.rail || 27800000);
    const busRidership = parseFloat(latest.bus || 7900000);

    const isBm = KtmyI18n.getLang() === 'bm';
    const fares = faresData.data || faresData;

    // Build LRT/MRT card HTML
    const lrt = fares.mrt_lrt || {};
    const lrtHtml = `
      <div class="glass-card reveal flex-col gap-sm">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.5rem;">🚇</span>
          <h4 style="margin:0; font-size:var(--fs-body);">${lrt.name || 'MRT & LRT Fares'}</h4>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${isBm ? 'Pengendali' : 'Operator'}: ${lrt.operator || 'RapidKL'}</div>
        <div class="divider" style="margin:4px 0;"></div>
        <div class="flex-between">
          <span style="font-size:0.78rem; color:var(--text-secondary);">${isBm ? 'Tambang Minimum' : 'Minimum Fare'}</span>
          <strong style="color:var(--text-primary); font-size:0.85rem;">${lrt.minimum_fare || 'RM 1.00'}</strong>
        </div>
        <div class="flex-between">
          <span style="font-size:0.78rem; color:var(--text-secondary);">${isBm ? 'Tambang Maksimum' : 'Maximum Fare'}</span>
          <strong style="color:var(--text-primary); font-size:0.85rem;">${lrt.maximum_fare || 'RM 6.40'}</strong>
        </div>
        <div class="flex-between" style="background: rgba(0, 201, 167, 0.08); padding: 6px 10px; border-radius: 6px; border: 1px dashed var(--primary);">
          <span style="font-size:0.78rem; color:var(--primary); font-weight:600;">🎫 ${isBm ? 'Pas Harian MyCity' : 'MyCity Day Pass'}</span>
          <strong style="color:var(--primary); font-size:0.85rem;">${lrt.day_pass || 'RM 5.00'}</strong>
        </div>
        <div class="mt-xs">
          <a href="https://www.myrapid.com.my" target="_blank" class="btn btn-outline" style="padding: 4px 12px; font-size: 0.65rem; width:100%; display:block; text-align:center; text-decoration:none;">
            🔗 ${isBm ? 'Portal Rasmi RapidKL' : 'RapidKL Official Portal'}
          </a>
        </div>
        <p style="font-size:0.68rem; color:var(--text-muted); margin:4px 0 0; line-height:1.3;">
          ℹ️ ${isBm ? 'Tambang berdasarkan jarak perjalanan. Touch \'n Go diperlukan.' : 'Fares calculated by distance. Touch \'n Go required.'}
        </p>
      </div>
    `;

    // Build KLIA Ekspres card HTML
    const klia = fares.klia_express || {};
    const kliaHtml = `
      <div class="glass-card reveal flex-col gap-sm">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.5rem;">✈️</span>
          <h4 style="margin:0; font-size:var(--fs-body);">${klia.name || 'KLIA Ekspres'}</h4>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${isBm ? 'Pengendali' : 'Operator'}: ${klia.operator || 'ERL'}</div>
        <div class="divider" style="margin:4px 0;"></div>
        <div class="flex-between">
          <span style="font-size:0.78rem; color:var(--text-secondary);">${isBm ? 'Tambang' : 'Fares'}</span>
          <strong style="color:var(--text-primary); font-size:0.75rem; text-align:right;">${isBm ? 'RM55 (Hala Selesa) / RM100 (Dua Hala)' : 'RM55 (Single) / RM100 (Return)'}</strong>
        </div>
        <div class="flex-between">
          <span style="font-size:0.78rem; color:var(--text-secondary);">${isBm ? 'Tempoh Perjalanan' : 'Duration'}</span>
          <strong style="color:var(--text-primary); font-size:0.85rem;">${klia.duration || '33 mins'}</strong>
        </div>
        <div class="flex-between">
          <span style="font-size:0.78rem; color:var(--text-secondary);">${isBm ? 'Kekerapan' : 'Frequency'}</span>
          <strong style="color:var(--text-primary); font-size:0.85rem;">${klia.frequency || 'Every 20 mins'}</strong>
        </div>
        <div class="mt-xs">
          <a href="https://www.kliaekspres.com" target="_blank" class="btn btn-outline" style="padding: 4px 12px; font-size: 0.65rem; width:100%; display:block; text-align:center; text-decoration:none;">
            🔗 ${isBm ? 'Portal Rasmi KLIA Ekspres' : 'KLIA Ekspres Official Portal'}
          </a>
        </div>
        <p style="font-size:0.68rem; color:var(--text-muted); margin:4px 0 0; line-height:1.3;">
          ℹ️ ${isBm ? 'Hubungan tanpa henti antara KL Sentral dan Lapangan Terbang (KLIA T1 & T2).' : 'Non-stop connection between KL Sentral and Airport (KLIA T1 & T2).'}
        </p>
      </div>
    `;

    // Build Grab card HTML
    const grab = fares.grab || {};
    const grabRows = (grab.estimated_fares || []).map(r => `
      <div class="flex-between" style="font-size:0.75rem; margin-bottom:4px;">
        <span style="color:var(--text-secondary);">${r.route}</span>
        <strong style="color:var(--text-primary);">${r.fare} <span style="font-size:0.65rem; color:var(--text-muted);">(${r.duration})</span></strong>
      </div>
    `).join('');
    const grabHtml = `
      <div class="glass-card reveal flex-col gap-sm">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.5rem;">🚗</span>
          <h4 style="margin:0; font-size:var(--fs-body);">${grab.name || 'Grab (Ride-hailing)'}</h4>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${isBm ? 'Anggaran Tambang Laluan Utama' : 'Estimated Fares for Key Routes'}</div>
        <div class="divider" style="margin:4px 0;"></div>
        <div class="flex-col gap-xs">
          ${grabRows}
        </div>
        <div class="mt-xs">
          <a href="https://www.grab.com/my/" target="_blank" class="btn btn-outline" style="padding: 4px 12px; font-size: 0.65rem; width:100%; display:block; text-align:center; text-decoration:none;">
            🔗 ${isBm ? 'Layari Laman Web Grab' : 'Visit Grab Website'}
          </a>
        </div>
        <p style="font-size:0.68rem; color:var(--warning); margin:4px 0 0; line-height:1.3;">
          ⚠️ ${isBm ? 'Tambang berubah mengikut permintaan (harga lonjakan).' : 'Fares vary by demand (surge pricing).'}
        </p>
      </div>
    `;

    // Build KTM Komuter table HTML
    const ktm = fares.kktm || {};
    const ktmRows = (ktm.routes || []).map(r => `
      <tr>
        <td style="font-weight: 500; font-size: 0.78rem;">${r.route}</td>
        <td style="font-weight: bold; color: var(--primary); font-size: 0.78rem; text-align: center;">${r.fare}</td>
        <td style="color: var(--text-muted); font-size: 0.78rem; text-align: center;">${r.duration}</td>
      </tr>
    `).join('');
    const ktmHtml = `
      <div class="glass-card reveal" style="padding: 0; overflow-x: auto;">
        <div style="padding: var(--space-md) var(--space-lg) 0; display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.5rem;">🚆</span>
            <h4 style="margin:0; font-size:var(--fs-body);">${ktm.name || 'KTM Komuter Fares'}</h4>
          </div>
          <a href="https://www.ktmb.com.my" target="_blank" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.62rem; text-decoration:none;">
            🔗 ${isBm ? 'Beli Tiket KTMB' : 'Buy KTMB Tickets'}
          </a>
        </div>
        <div style="padding: 2px var(--space-lg) 10px; font-size:0.72rem; color:var(--text-muted);">${isBm ? 'Pengendali' : 'Operator'}: KTMB · ${isBm ? 'Laluan popular dari KL Sentral' : 'Popular routes from KL Sentral'}</div>
        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th style="text-align: left; font-size: 0.72rem;">${isBm ? 'Laluan' : 'Route'}</th>
              <th style="text-align: center; font-size: 0.72rem; width: 80px;">${isBm ? 'Tambang' : 'Fare'}</th>
              <th style="text-align: center; font-size: 0.72rem; width: 100px;">${isBm ? 'Tempoh' : 'Duration'}</th>
            </tr>
          </thead>
          <tbody>
            ${ktmRows}
          </tbody>
        </table>
      </div>
    `;

    // Build ETS table HTML
    const ets = fares.ets || {};
    const etsRows = (ets.routes || []).map(r => `
      <tr>
        <td style="font-weight: 500; font-size: 0.78rem;">${r.route}</td>
        <td style="font-weight: bold; color: var(--primary); font-size: 0.78rem; text-align: center;">${r.fare}</td>
        <td style="color: var(--text-muted); font-size: 0.78rem; text-align: center;">${r.duration}</td>
        <td style="font-size: 0.7rem; text-align: center;">
          ${(r.classes || []).map(c => `<span style="background: rgba(255,255,255,0.06); padding: 2px 4px; border-radius: 4px; margin-right:2px; font-size:0.6rem; color:var(--text-secondary); border: 1px solid var(--glass-border);">${c}</span>`).join('')}
        </td>
      </tr>
    `).join('');
    const etsHtml = `
      <div class="glass-card reveal" style="padding: 0; overflow-x: auto;">
        <div style="padding: var(--space-md) var(--space-lg) 0; display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.5rem;">⚡</span>
            <h4 style="margin:0; font-size:var(--fs-body);">${ets.name || 'ETS (Electric Train Service)'}</h4>
          </div>
          <a href="https://www.ktmb.com.my" target="_blank" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.62rem; text-decoration:none;">
            🔗 ${isBm ? 'Beli Tiket KTMB' : 'Buy KTMB Tickets'}
          </a>
        </div>
        <div style="padding: 2px var(--space-lg) 10px; font-size:0.72rem; color:var(--text-muted);">${isBm ? 'Pengendali' : 'Operator'}: KTMB · ${isBm ? 'Tren antara bandar kelajuan tinggi' : 'High-speed intercity train service'}</div>
        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th style="text-align: left; font-size: 0.72rem;">${isBm ? 'Laluan' : 'Route'}</th>
              <th style="text-align: center; font-size: 0.72rem; width: 90px;">${isBm ? 'Tambang' : 'Fare'}</th>
              <th style="text-align: center; font-size: 0.72rem; width: 90px;">${isBm ? 'Tempoh' : 'Duration'}</th>
              <th style="text-align: center; font-size: 0.72rem; width: 150px;">${isBm ? 'Kelas' : 'Classes'}</th>
            </tr>
          </thead>
          <tbody>
            ${etsRows}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = `
      <!-- Transport stats row -->
      <div class="grid grid-3 mb-xl stagger">
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color" id="kpi-rail-ridership">${(railRidership / 1e6).toFixed(2)}M</div>
          <div class="stat-label" data-i18n="transport.rail">Monthly Rail Boardings</div>
        </div>

        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color" id="kpi-bus-ridership">${(busRidership / 1e6).toFixed(2)}M</div>
          <div class="stat-label" data-i18n="transport.bus">Monthly Bus Boardings</div>
        </div>

        <div class="glass-card reveal">
          <div class="stat-number glow text-success" id="kpi-transit-routes">14 Lines</div>
          <div class="stat-label" data-i18n="transport.coverage">Rapid Rail & KTM Lines</div>
        </div>
      </div>

      <!-- Network details and ridership chart -->
      <div class="grid grid-2 stagger">
        <!-- Transit operator cards -->
        <div class="flex-col gap-md">
          <div class="info-card reveal">
            <div class="info-icon">🚇</div>
            <div class="info-content">
              <h4 data-i18n="transport.operator.prasarana">Prasarana Malaysia</h4>
              <p data-i18n="transport.operator.prasarana.desc">Operates Rapid KL LRT (Kelana Jaya, Ampang, Sri Petaling, Shah Alam), MRT (Kajang, Putrajaya), Monorail, and Rapid Bus networks.</p>
            </div>
          </div>
          
          <div class="info-card reveal">
            <div class="info-icon">🚆</div>
            <div class="info-content">
              <h4 data-i18n="transport.operator.ktmb">KTMB (Keretapi Tanah Melayu)</h4>
              <p data-i18n="transport.operator.ktmb.desc">Runs KTM Komuter (Central & Northern sectors), ETS (Intercity high-speed rail), and KTM Intercity lines.</p>
            </div>
          </div>

          <div class="info-card reveal">
            <div class="info-icon">🚌</div>
            <div class="info-content">
              <h4 data-i18n="transport.operator.mybas">myBAS / bas.my</h4>
              <p data-i18n="transport.operator.mybas.desc">National initiative improving stage bus service integration across regional cities (Ipoh, Johor Bahru, Kangar, Kuala Terengganu, etc.).</p>
            </div>
          </div>
        </div>

        <!-- Ridership chart -->
        <div class="glass-card reveal">
          <h3 class="chart-title" data-i18n="transport.chart.title">12-Month Transit Ridership Trend</h3>
          <div class="chart-container" style="height: 300px;">
            <canvas id="chart-transport-ridership"></canvas>
          </div>
        </div>
      </div>

      <!-- Public Transport Fares & Rates Section -->
      <div class="section-header mt-2xl reveal">
        <div class="section-badge">
          <span class="badge-dot"></span>
          <span>${isBm ? 'Maklumat Tambang' : 'Fares & Rates'}</span>
        </div>
        <h2 class="section-title" style="font-size: var(--fs-h3);">${isBm ? '🎫 Tambang Pengangkutan & Ride-Hailing' : '🎫 Transit & Ride-Hailing Fares'}</h2>
        <p class="section-subtitle" style="font-size: var(--fs-small);">${isBm ? 'Panduan tambang rujukan untuk LRT, MRT, KTM, ETS, KLIA Ekspres dan perkhidmatan teksi persendirian.' : 'Reference fare guides for RapidKL rail, KTM Komuter, ETS, KLIA Ekspres, and ride-hailing services.'}</p>
      </div>

      <!-- Fares Grid -->
      <div class="grid grid-3 stagger mb-xl">
        ${lrtHtml}
        ${kliaHtml}
        ${grabHtml}
      </div>

      <!-- Rail routes fares tables -->
      <div class="grid grid-2 stagger">
        ${ktmHtml}
        ${etsHtml}
      </div>
    `;

    // Render chart
    setTimeout(() => {
      KtmyCharts.destroyChart('chart-transport-ridership');

      const labels = ridership.map(r => new Date(r.date).toLocaleDateString(
        KtmyI18n.getLang() === 'bm' ? 'ms-MY' : 'en-US',
        { month: 'short', year: '2-digit' }
      ));

      const railData = ridership.map(r => parseFloat(r.rail || 0) / 1e6); // in millions
      const busData = ridership.map(r => parseFloat(r.bus || 0) / 1e6);

      chartInstance = KtmyCharts.createLineChart('chart-transport-ridership', {
        labels,
        datasets: [
          {
            label: KtmyI18n.t('transport.rail'),
            data: railData,
            color: KtmyCharts.COLORS.primary,
            fill: true,
            extra: { backgroundColor: 'rgba(0, 201, 167, 0.1)' }
          },
          {
            label: KtmyI18n.t('transport.bus'),
            data: busData,
            color: KtmyCharts.COLORS.blue,
            fill: true,
            extra: { backgroundColor: 'rgba(77, 124, 254, 0.1)' }
          }
        ],
        yLabel: 'Millions / Month'
      });
    }, 0);

    // Apply translations
    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  function translate() {
    const container = document.getElementById('section-transport-content');
    if (container && cachedData) {
      renderSection(container, cachedData.ridership, cachedData.fares);
    }
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.transport = { init, translate };
})();
