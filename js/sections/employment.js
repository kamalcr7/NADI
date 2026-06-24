/* ============================================================
   KTMY — Employment & Jobs Section (DataStore-powered)
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
  let cachedFallback = null;

  function init() {
    const container = document.getElementById('section-employment-content');
    if (!container) return;

    if (cachedRecords || cachedFallback) {
      renderSection(container, cachedRecords || [], cachedFallback);
      return;
    }

    if (initialized) return;
    initialized = true;

    const isBm = KtmyI18n.getLang() === 'bm';
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${isBm ? 'Memuatkan data tenaga buruh...' : 'Loading labour force data...'}</p></div>`;

    KtmyStore.on('unemployment', (data, status) => {
      if (status === 'loading') return;
      const records = parseDS(data);
      if (status === 'error' || records.length === 0) {
        cachedRecords = [];
        cachedFallback = {
          unemploymentRate: 3.3,
          labourForce: 16.9,
          employed: 16.3,
          participation: 70.8
        };
        renderFallback(container);
        return;
      }
      cachedRecords = records;
      cachedFallback = null;
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
    const isBm = KtmyI18n.getLang() === 'bm';
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1] || {};

    const uRate = latest.u_rate !== undefined ? parseFloat(latest.u_rate) : (fallback?.unemploymentRate || 3.3);
    const lfVal = latest.lf !== undefined ? (parseFloat(latest.lf) / 1000).toFixed(1) : (fallback?.labourForce || '16.9');
    const employedVal = latest.lf_employed !== undefined ? (parseFloat(latest.lf_employed) / 1000).toFixed(1) : (fallback?.employed || '16.3');
    const pRate = latest.p_rate !== undefined ? parseFloat(latest.p_rate) : (fallback?.participation || 70.8);

    const fmtDate = latest.date ? new Date(latest.date).toLocaleDateString(isBm ? 'ms-MY' : 'en-US', { month: 'long', year: 'numeric' }) : (isBm ? 'Terkini' : 'Latest');

    container.innerHTML = `
      <!-- Labour Market KPIs -->
      <div class="grid grid-4 stagger mb-xl">
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">📊</div>
          <div class="stat-number ${uRate < 4 ? 'text-success' : uRate < 5 ? 'text-warning' : 'text-danger'}">${uRate.toFixed(1)}%</div>
          <div class="stat-label">${isBm ? 'Kadar Pengangguran' : 'Unemployment Rate'}</div>
          <div class="stat-date">${fmtDate}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">👷</div>
          <div class="stat-number gradient-text">${lfVal}M</div>
          <div class="stat-label">${isBm ? 'Tenaga Buruh' : 'Labour Force'}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">💼</div>
          <div class="stat-number text-success">${employedVal}M</div>
          <div class="stat-label">${isBm ? 'Bekerja' : 'Employed'}</div>
        </div>
        <div class="glass-card reveal stat-highlight">
          <div class="stat-icon">📈</div>
          <div class="stat-number">${pRate.toFixed(1)}%</div>
          <div class="stat-label">${isBm ? 'Kadar Penyertaan' : 'Participation Rate'}</div>
        </div>
      </div>

      <!-- Unemployment Trend Chart -->
      ${sorted.length > 2 ? `
        <div class="glass-card reveal mb-lg">
          <h3 class="chart-title">${isBm ? '📉 Trend Kadar Pengangguran' : '📉 Unemployment Rate Trend'}</h3>
          <div class="chart-container" style="height:340px;">
            <canvas id="chart-unemployment-trend"></canvas>
          </div>
        </div>` : ''}

      <!-- Sector Info Cards -->
      <div class="grid grid-3 stagger mt-lg">
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🏗️</div>
          <h4>${isBm ? 'Pembinaan' : 'Construction'}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            ${isBm ? 'Majikan utama dalam infrastruktur. Pertumbuhan pesat didorong oleh projek pembangunan besar.' : 'Key employer in infrastructure. Rapid growth due to major development projects.'}
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🏭</div>
          <h4>${isBm ? 'Pembuatan' : 'Manufacturing'}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            ${isBm ? 'Sektor elektronik dan semikonduktor memacu eksport dan pekerjaan yang ketara.' : 'Electronics and semiconductor sector drives significant exports and employment.'}
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🖥️</div>
          <h4>${isBm ? 'Ekonomi Digital' : 'Digital Economy'}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            ${isBm ? 'Rangka Tindakan Ekonomi Digital Malaysia menyasarkan sumbangan KDNK sebanyak 22.6% menjelang 2025.' : 'Malaysia\'s Digital Economy Blueprint targets 22.6% GDP contribution by 2025.'}
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🌾</div>
          <h4>${isBm ? 'Pertanian' : 'Agriculture'}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            ${isBm ? 'Kelapa sawit dan getah kekal sebagai eksport utama. Pemodenan teknologi pertanian sedang berjalan.' : 'Palm oil and rubber remain key exports. Agri-tech modernisation underway.'}
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🛍️</div>
          <h4>${isBm ? 'Peruncitan & Perkhidmatan' : 'Retail & Services'}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            ${isBm ? 'Sektor pekerjaan terbesar. Pemulihan pelancongan dan hospitaliti pasca-pandemik.' : 'Largest employment sector. Tourism and hospitality recovery post-pandemic.'}
          </p>
        </div>
        <div class="glass-card reveal">
          <div style="font-size:2rem; margin-bottom:8px;">🔬</div>
          <h4>${isBm ? 'Sains & Teknologi' : 'Science & Tech'}</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-small);">
            ${isBm ? 'Cyberjaya dan MSC Malaysia memupuk syarikat pemula teknologi dan pelaburan R&D.' : 'Cyberjaya and MSC Malaysia foster tech startups and R&D investment.'}
          </p>
        </div>
      </div>
    `;

    setTimeout(() => {
      if (sorted.length > 2) {
        KtmyCharts.destroyChart('chart-unemployment-trend');
        KtmyCharts.createAreaChart('chart-unemployment-trend', {
          labels: sorted.map(r => new Date(r.date).toLocaleDateString(isBm ? 'ms-MY' : 'en-US', { year: 'numeric', month: 'short' })),
          datasets: [{
            label: isBm ? 'Kadar Pengangguran (%)' : 'Unemployment Rate (%)',
            data: sorted.map(r => parseFloat(r.u_rate || r.rate || r.unemployment || 0)),
            color: KtmyCharts.COLORS.gold
          }],
          yLabel: '%'
        });
      }
    }, 0);

    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.employment = {
    init,
    translate() {
      const container = document.getElementById('section-employment-content');
      if (container && (cachedRecords || cachedFallback)) {
        renderSection(container, cachedRecords || [], cachedFallback);
      }
    }
  };
})();
