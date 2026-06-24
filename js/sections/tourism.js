/* ============================================================
   KTMY — Tourist Essentials & Holiday Directory Section Module
   ------------------------------------------------------------
   Data Sources:
   1. Tourist Arrivals: Monthly visitor stats by country fetched
      from Department of Statistics (DOSM) API (data.gov.my).
   2. Holidays & Converter: Curated calendars and exchange rates.
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let cachedData = null;
  let chartInstance = null;

  async function init() {
    const container = document.getElementById('section-tourism-content');
    if (!container) return;

    // Holidays list and exchange converter fallbacks
    cachedData = {
      holidays: [
        { date: '2026-01-01', name: 'New Year\'s Day (Tahun Baru)', states: 'National (except Kelantan, Kedah, Perlis, Terengganu)' },
        { date: '2026-02-17', name: 'Chinese New Year (Tahun Baru Cina)', states: 'National' },
        { date: '2026-03-20', name: 'Hari Raya Aidilfitri (Forecast)', states: 'National' },
        { date: '2026-05-01', name: 'Labour Day (Hari Pekerja)', states: 'National' },
        { date: '2026-05-30', name: 'Wesak Day (Hari Wesak)', states: 'National' },
        { date: '2026-05-30', name: 'Kaamatan / Gawai (East MY)', states: 'Sabah & Sarawak' },
        { date: '2026-06-03', name: 'King\'s Birthday (Hari Keputeraan Agong)', states: 'National' },
        { date: '2026-08-31', name: 'National Day (Hari Kebangsaan)', states: 'National' },
        { date: '2026-09-16', name: 'Malaysia Day (Hari Malaysia)', states: 'National' },
        { date: '2026-11-08', name: 'Deepavali (Festival of Lights)', states: 'National (except Sarawak)' },
        { date: '2026-12-25', name: 'Christmas Day (Hari Krismas)', states: 'National' }
      ],
      rates: {
        usd: 4.71,
        sgd: 3.48,
        eur: 5.06,
        gbp: 5.96,
        aud: 3.12
      },
      arrivals: []
    };

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p data-i18n="common.loading">${KtmyI18n.t('common.loading')}</p>
      </div>
    `;

    let exchangeDone = false;
    let tourismDone = false;

    function checkRender() {
      if (exchangeDone && tourismDone) {
        renderSection(container, cachedData);
      }
    }

    // Subscribe to exchange rate store
    KtmyStore.on('exchange', (data, status) => {
      let records = [];
      if (Array.isArray(data)) records = data;
      else if (data && Array.isArray(data.data)) records = data.data;

      if (records.length > 0) {
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
        const latest = records[records.length - 1];
        if (latest) {
          if (latest.usd) cachedData.rates.usd = parseFloat(latest.usd);
          if (latest.sgd) cachedData.rates.sgd = parseFloat(latest.sgd);
          if (latest.eur) cachedData.rates.eur = parseFloat(latest.eur);
          if (latest.gbp) cachedData.rates.gbp = parseFloat(latest.gbp);
          if (latest.aud) cachedData.rates.aud = parseFloat(latest.aud);
        }
      }

      if (status !== 'loading' || records.length > 0) {
        exchangeDone = true;
        checkRender();
      }
    });

    // Subscribe to tourist arrivals store
    KtmyStore.on('tourism_data', (data, status) => {
      let records = [];
      if (Array.isArray(data)) records = data;
      else if (data && Array.isArray(data.data)) records = data.data;

      if (records.length > 0) {
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
        cachedData.arrivals = records;
      }

      if (status !== 'loading' || records.length > 0) {
        tourismDone = true;
        checkRender();
      }
    });
  }

  function renderSection(container, data) {
    const { holidays, rates, arrivals } = data;

    // Build holiday list rows
    const holidayRows = holidays.map(h => {
      const formattedDate = new Date(h.date).toLocaleDateString(
        KtmyI18n.getLang() === 'bm' ? 'ms-MY' : 'en-US',
        { day: 'numeric', month: 'short' }
      );
      return `
        <div class="stat-row">
          <div class="stat-row-label" style="text-align: left;">
            <strong style="color: var(--text-primary);">${h.name}</strong>
            <div style="font-size: var(--fs-xs); color: var(--text-muted);">${h.states}</div>
          </div>
          <span class="stat-row-value text-primary-color" style="font-size: var(--fs-small);">${formattedDate}</span>
        </div>
      `;
    }).join('');

    let latestArrivalsHtml = '';
    const allArrivals = arrivals.filter(r => r.country === 'ALL');
    if (allArrivals && allArrivals.length > 0) {
      const latest = allArrivals[allArrivals.length - 1];
      const count = parseFloat(latest.arrivals || 0);
      const male = parseFloat(latest.arrivals_male || 0);
      const female = parseFloat(latest.arrivals_female || 0);
      const formattedCount = count.toLocaleString();
      const dateStr = new Date(latest.date).toLocaleDateString(
        KtmyI18n.getLang() === 'bm' ? 'ms-MY' : 'en-US',
        { month: 'long', year: 'numeric' }
      );

      latestArrivalsHtml = `
        <div class="flex-col gap-md">
          <div class="stat-highlight">
            <div class="stat-number glow text-primary-color" style="font-size: var(--fs-h1);">${formattedCount}</div>
            <div class="stat-label" data-i18n="tourism.stats.monthly">Visitors in ${dateStr}</div>
          </div>
          <div class="divider"></div>
          <div class="flex-between">
            <span style="color: var(--text-secondary); font-size: var(--fs-small);">🙋‍♂️ Male Visitors</span>
            <span style="font-weight: var(--fw-bold); color: var(--text-primary);">${male.toLocaleString()}</span>
          </div>
          <div class="flex-between">
            <span style="color: var(--text-secondary); font-size: var(--fs-small);">🙋‍♀️ Female Visitors</span>
            <span style="font-weight: var(--fw-bold); color: var(--text-primary);">${female.toLocaleString()}</span>
          </div>
          <p style="font-size:0.65rem; color:var(--text-muted); text-align:center; margin:4px 0 0; line-height:1.3;">
            ℹ️ Note: Official DOSM statistics exhibit a standard reporting lag (latest published values shown).
          </p>
        </div>
      `;
    } else {
      latestArrivalsHtml = `
        <div class="text-center text-muted" data-i18n="common.no_data" style="padding: var(--space-xl);">
          No tourist arrivals data loaded.
        </div>
      `;
    }

    container.innerHTML = `
      <div class="grid grid-3 stagger mb-xl">
        <!-- Interactive Converter Widget -->
        <div class="glass-card reveal">
          <h3 class="chart-title mb-md" data-i18n="tourism.converter.title">MYR Currency Converter</h3>
          
          <div class="flex-col gap-sm">
            <label style="font-size: var(--fs-xs); color: var(--text-secondary); text-align: left;" data-i18n="tourism.converter.amount">Amount (Foreign Currency)</label>
            <input type="number" id="converter-amount" class="price-tag" style="background: var(--bg-secondary); border: 1px solid var(--glass-border); width: 100%; border-radius: var(--radius-sm); text-align: left; padding: var(--space-sm) var(--space-md); color: var(--text-primary); font-size: var(--fs-body);" value="100">
            
            <label style="font-size: var(--fs-xs); color: var(--text-secondary); text-align: left;" data-i18n="tourism.converter.currency">Currency</label>
            <select id="converter-currency" style="background: var(--bg-secondary); border: 1px solid var(--glass-border); width: 100%; border-radius: var(--radius-sm); color: var(--text-primary); padding: var(--space-sm) var(--space-md); font-family: inherit;">
              <option value="usd">USD (US Dollar) — Middle Rate: ${rates.usd}</option>
              <option value="sgd">SGD (Singapore Dollar) — Middle Rate: ${rates.sgd}</option>
              <option value="eur">EUR (Euro) — Middle Rate: ${rates.eur}</option>
              <option value="gbp">GBP (British Pound) — Middle Rate: ${rates.gbp}</option>
              <option value="aud">AUD (Australian Dollar) — Middle Rate: ${rates.aud}</option>
            </select>
            
            <button id="converter-btn" class="btn btn-primary mt-sm" style="width: 100%;" data-i18n="tourism.converter.btn">Convert to MYR</button>
            
            <div class="divider"></div>
            
            <div class="flex-between">
              <span style="font-size: var(--fs-small); color: var(--text-secondary);" data-i18n="tourism.converter.result">Result:</span>
              <span id="converter-result" class="text-primary-color" style="font-size: var(--fs-h3); font-weight: var(--fw-black);">RM ${(100 * rates.usd).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Public Holidays -->
        <div class="glass-card reveal" style="max-height: 480px; overflow-y: auto;">
          <h3 class="chart-title mb-md" data-i18n="tourism.holidays">National Public Holidays (2026)</h3>
          ${holidayRows}
        </div>

        <!-- Travel Tips -->
        <div class="glass-card reveal">
          <h3 class="chart-title mb-md" data-i18n="tourism.tips">Essential Travel Tips</h3>
          
          <div class="info-card mb-sm" style="padding: var(--space-md);">
            <div class="info-icon" style="width: 36px; height: 36px; font-size: 1.1rem;">🔌</div>
            <div class="info-content">
              <h4>Electricity plugs</h4>
              <p>Type G (UK standard 3-pin), 240V AC, 50Hz frequency.</p>
            </div>
          </div>

          <div class="info-card mb-sm" style="padding: var(--space-md);">
            <div class="info-icon" style="width: 36px; height: 36px; font-size: 1.1rem;">💬</div>
            <div class="info-content">
              <h4>Language & Tipping</h4>
              <p>English is widely spoken. Tipping is not required; 10% service charge is pre-billed.</p>
            </div>
          </div>

          <div class="info-card" style="padding: var(--space-md);">
            <div class="info-icon" style="width: 36px; height: 36px; font-size: 1.1rem;">🛂</div>
            <div class="info-content">
              <h4>Digital Arrival Card</h4>
              <p>All visitors must fill out the Malaysia Digital Arrival Card (MDAC) within 3 days prior to arrival.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tourist Arrivals Trend Chart & Quick Stats -->
      <div class="grid grid-2 stagger">
        <div class="glass-card reveal">
          <h3 class="chart-title" data-i18n="tourism.arrivals.title">Monthly Visitor Arrivals Trend</h3>
          <div class="chart-container" style="height: 300px;">
            <canvas id="chart-tourist-arrivals"></canvas>
          </div>
        </div>

        <div class="glass-card reveal">
          <h3 class="chart-title mb-md" data-i18n="tourism.stats.title">Latest Tourist Stats</h3>
          ${latestArrivalsHtml}
        </div>
      </div>
    `;

    // Hook converter calculation
    const inputAmt = container.querySelector('#converter-amount');
    const selectCur = container.querySelector('#converter-currency');
    const convertBtn = container.querySelector('#converter-btn');
    const resultVal = container.querySelector('#converter-result');

    function calculate() {
      if (!inputAmt || !selectCur || !resultVal) return;
      const amt = parseFloat(inputAmt.value) || 0;
      const cur = selectCur.value;
      const rate = rates[cur] || 1;
      const converted = amt * rate;
      resultVal.textContent = `RM ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (convertBtn) {
      convertBtn.addEventListener('click', calculate);
    }

    // Render chart
    setTimeout(() => {
      KtmyCharts.destroyChart('chart-tourist-arrivals');

      if (arrivals && arrivals.length > 0) {
        const last12 = arrivals.filter(r => r.country === 'ALL').slice(-12);
        if (last12.length > 0) {
          const labels = last12.map(r => new Date(r.date).toLocaleDateString(
            KtmyI18n.getLang() === 'bm' ? 'ms-MY' : 'en-US',
            { month: 'short', year: 'numeric' }
          ));
          const dataValues = last12.map(r => parseFloat(r.arrivals || 0) / 1e6); // in millions

          chartInstance = KtmyCharts.createAreaChart('chart-tourist-arrivals', {
            labels,
            datasets: [{
              label: KtmyI18n.getLang() === 'bm' ? 'Pelawat (Juta)' : 'Visitors (Millions)',
              data: dataValues,
              color: KtmyCharts.COLORS.blue
            }],
            yLabel: KtmyI18n.getLang() === 'bm' ? 'Juta / Bulan' : 'Millions / Month'
          });
        }
      }
    }, 0);

    // Apply translations
    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  function translate() {
    const container = document.getElementById('section-tourism-content');
    if (container && cachedData) {
      renderSection(container, cachedData);
    }
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.tourism = { init, translate };
})();
