/* ============================================================
   NADI — Government Incentives & Support Section Module
   ============================================================
   Loads curated incentive data from /data/incentives.json
   Falls back to hardcoded data if JSON unavailable.
   Uses NadiStore.on() event pattern for reliable data loading.
   ============================================================ */

(function () {
  'use strict';
  let rendered = false;
  let activeTab = 'aid';

  /* --- Fallback data (used if incentives.json fails) --- */
  const FALLBACK = {
    aid: [
      { name: 'Sumbangan Tunai Rahmah (STR)', agency: 'LHDN', coverage: 'B40 & M40 Households / Singles', amount: 'Up to RM3,700 / year', desc: 'Direct cash assistance for low-to-medium income households.', link: 'https://bantuantunai.hasil.gov.my/' },
      { name: 'BUDI Madani Subsidies', agency: 'MOF', coverage: 'Smallholders, Farmers & Diesel Vehicle Owners', amount: 'RM200 / month', desc: 'Targeted diesel subsidy aid for eligible individuals.', link: 'https://budimadani.gov.my/' }
    ],
    study: [
      { name: 'JPA Program Khas', agency: 'JPA', coverage: 'Post-SPM Top Scorers', amount: 'Full tuition + living allowance', desc: 'Scholarship for outstanding SPM scorers.', link: 'https://esilav2.jpa.gov.my/' },
      { name: 'MARA Education Loans (SPIP)', agency: 'MARA', coverage: 'Bumiputera students', amount: 'Convertible loans (up to 90% discount)', desc: 'Study loans for STEM subjects.', link: 'https://www.mara.gov.my/' },
      { name: 'PTPTN Study Financing', agency: 'PTPTN', coverage: 'All college/university students', amount: 'Up to RM20,000 / year', desc: 'Education loans for diploma and degree courses.', link: 'https://www.ptptn.gov.my/' }
    ],
    business: [
      { name: 'SME Digitalisation Grant', agency: 'MDEC / BSN', coverage: 'Micro-businesses & SMEs', amount: '50% matching grant up to RM5,000', desc: 'Helping small businesses adopt digital tools.', link: 'https://mdec.my/' },
      { name: 'TERAJU Superb Grant', agency: 'TERAJU', coverage: 'Bumiputera Startups', amount: 'Up to RM500,000', desc: 'Funding for innovative tech-enabled startups.', link: 'https://www.teraju.gov.my/' },
      { name: 'TEKUN Niaga Financing', agency: 'TEKUN', coverage: 'Micro-entrepreneurs', amount: 'RM1,000 to RM100,000', desc: 'Fast micro-financing for small traders.', link: 'https://www.tekun.gov.my/' }
    ],
    healthcare: [],
    retirement: []
  };

  /* --- Map from incentives.json structure to display format --- */
  function mapIncentiveData(json) {
    // NadiStore strips _meta and returns data contents directly,
    // so json is already {str: ..., bsh: ..., education_aid: ..., etc.}
    // But handle both formats just in case.
    const d = json?.data || json || {};
    const result = { aid: [], study: [], business: [], healthcare: [], retirement: [] };

    // Financial Aid
    if (d.str) {
      result.aid.push({
        name: d.str.name,
        agency: 'LHDN',
        coverage: 'B40 & M40 Households / Singles',
        amount: d.str.eligibility?.household?.aid_amount || 'Up to RM3,700 / year',
        desc: d.str.description,
        link: d.str.website
      });
    }
    if (d.fuel_subsidy) {
      result.aid.push({
        name: d.fuel_subsidy.name,
        agency: 'MOF',
        coverage: 'Targeted eligible groups',
        amount: 'Variable',
        desc: d.fuel_subsidy.description,
        link: 'https://budimadani.gov.my/'
      });
    }
    if (d.sara) {
      result.aid.push({
        name: d.sara.name,
        agency: 'LHDN',
        coverage: 'Hardcore Poor STR Recipients',
        amount: d.sara.amount || 'RM1,200 / year',
        desc: d.sara.description,
        link: 'https://bantuantunai.hasil.gov.my/'
      });
    }
    if (d.bsh && d.bsh.status) {
      result.aid.push({
        name: d.bsh.name,
        agency: 'LHDN',
        coverage: 'Merged into STR',
        amount: 'N/A',
        desc: d.bsh.note || d.bsh.description,
        link: 'https://bantuantunai.hasil.gov.my/'
      });
    }
    if (d.tax_reliefs) {
      // Add tax reliefs as a bonus aid item
      const tr = d.tax_reliefs;
      if (tr.personal_relief) {
        result.aid.push({
          name: 'Personal Tax Relief',
          agency: 'LHDN',
          coverage: 'All taxpayers',
          amount: 'Up to RM' + (tr.personal_relief.self_reliefs?.reduce?.((a,b) => a + (parseInt(b.amount) || 0), 0) || '9,000'),
          desc: 'Annual income tax deductions for individuals.',
          link: 'https://mytax.hasil.gov.my/'
        });
      }
    }

    // Education
    if (d.education_aid?.programs) {
      d.education_aid.programs.forEach(p => {
        result.study.push({ name: p.name, agency: 'Government', coverage: p.eligibility || 'Various', amount: p.amount, desc: p.name, link: '#' }); // education programs — link from JSON data if available
      });
    }

    // Healthcare
    if (d.healthcare?.programs) {
      d.healthcare.programs.forEach(p => {
        result.healthcare.push({ name: p.name, agency: 'MOH', coverage: p.eligibility || 'Various', amount: p.coverage || p.description, desc: p.description, link: p.website || '#' });
      });
    }

    // Retirement/EPF
    if (d.epf_isaraan) {
      result.retirement.push({
        name: d.epf_isaraan.name,
        agency: 'EPF',
        coverage: 'Self-employed & gig workers',
        amount: d.epf_isaraan.contribution?.government_match || 'Up to RM300/year',
        desc: d.epf_isaraan.description,
        link: d.epf_isaraan.website
      });
    }
    if (d.epf_isuri) {
      result.retirement.push({
        name: d.epf_isuri.name,
        agency: 'EPF',
        coverage: 'Housewives',
        amount: d.epf_isuri.contribution?.government_match || 'RM60/year',
        desc: d.epf_isuri.description,
        link: d.epf_isuri.website
      });
    }

    // Fuel Subsidies — detail the BUDI & quota info
    if (d.budi_madani?.programs) {
      d.budi_madani.programs.forEach(p => {
        result.aid.push({
          name: p.name,
          agency: 'MOF/KPWKM',
          coverage: p.coverage,
          amount: p.amount,
          desc: p.eligibility?.join('; ') || '',
          link: p.website || '#'
        });
      });
    }

    // RM100 e-Wallet Credit
    if (d.ewallet_credit) {
      result.aid.push({
        name: d.ewallet_credit.name,
        agency: 'MOF',
        coverage: d.ewallet_credit.details?.target || 'STR recipients',
        amount: d.ewallet_credit.details?.amount || 'RM100',
        desc: d.ewallet_credit.description,
        link: d.ewallet_credit.website || '#'
      });
    }

    // Fuel Quota
    if (d.fuel_quota) {
      result.aid.push({
        name: d.fuel_quota.name,
        agency: 'KPWKM/MOF',
        coverage: 'B40/M40 vehicle owners',
        amount: 'RM2.05/litre subsidised',
        desc: d.fuel_quota.details?.proposed_quota?.join('; ') || d.fuel_quota.description,
        link: d.fuel_quota.website || '#'
      });
    }

    // Fuel Subsidy summary
    if (d.fuel_subsidy?.prices) {
      const priceSummary = Object.entries(d.fuel_subsidy.prices)
        .map(([k, v]) => `${k}: ${v}`).join(' | ');
      result.aid.push({
        name: 'Fuel Prices (Current)',
        agency: 'KPWKM',
        coverage: 'All registered vehicle owners',
        amount: 'From RM2.05/litre',
        desc: priceSummary,
        link: 'https://www.kpwkm.gov.my'
      });
    }

    // SARA
    if (d.sara) {
      result.aid.push({
        name: d.sara.name,
        agency: 'LHDN',
        coverage: 'Hardcore Poor STR Recipients',
        amount: d.sara.details?.amount || 'RM1,200 / year',
        desc: d.sara.description,
        link: d.sara.website || '#'
      });
    }

    // Business (use fallback)
    result.business = FALLBACK.business;

    return result;
  }

  function init() {
    const container = document.getElementById('section-government-content');
    if (!container) return;

    const budget = {
      revenue: 339.7,
      expenditure: 421.0,
      deficit: -81.3,
      year: 2025
    };

    // Show loading state
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>${NadiI18n.t('common.loading')}</p>
      </div>`;

    // Subscribe to DataStore — fires immediately if cached
    let dataCallback = null;
    const unsubscribe = NadiStore.on('incentives', (data, status) => {
      if (status === 'loading') {
        if (!rendered) container.innerHTML = `
          <div class="loading-state">
            <div class="spinner"></div>
            <p>${NadiI18n.t('common.loading')}</p>
          </div>`;
        return;
      }

      let incentives = FALLBACK;
      if (data && status !== 'error') {
        try {
          incentives = mapIncentiveData(data);
        } catch (e) {
          console.warn('[Government] Failed to map incentives data:', e);
        }
      }

      const allData = { budget, incentives };
      renderSection(container, allData);
      rendered = true;
    });

    // Fallback: if data is already loaded (status 'done') but init was called
    // before the on() handler could fire (e.g. data was loaded between the
    // 'loading' emission and listener registration), re-check and render.
    if (!rendered && NadiStore.status('incentives') === 'done') {
      const existing = NadiStore.get('incentives');
      if (existing) {
        let incentives = FALLBACK;
        try { incentives = mapIncentiveData(existing); } catch (e) {}
        renderSection(container, { budget, incentives });
        rendered = true;
      }
    }

    // Final fallback: retry after a short delay if still not rendered
    if (!rendered) {
      const retryTimer = setTimeout(() => {
        if (!rendered && NadiStore.status('incentives') === 'done') {
          const existing = NadiStore.get('incentives');
          if (existing) {
            let incentives = FALLBACK;
            try { incentives = mapIncentiveData(existing); } catch (e) {}
            renderSection(container, { budget, incentives });
            rendered = true;
          }
        }
        // If still not rendered after 3s, force-render with FALLBACK
        if (!rendered) {
          renderSection(container, { budget, incentives: FALLBACK });
          rendered = true;
        }
      }, 3000);
    }
  }

  function renderSection(container, data) {
    const { budget, incentives } = data;

    const tabsHtml = `
      <div class="tabs reveal mb-lg">
        <button class="tab-btn ${activeTab === 'aid' ? 'active' : ''}" data-tab="aid">Social Aid & Subsidies</button>
        <button class="tab-btn ${activeTab === 'study' ? 'active' : ''}" data-tab="study">Education Loans</button>
        <button class="tab-btn ${activeTab === 'business' ? 'active' : ''}" data-tab="business">SME Grants</button>
        <button class="tab-btn ${activeTab === 'healthcare' ? 'active' : ''}" data-tab="healthcare">Healthcare</button>
        <button class="tab-btn ${activeTab === 'retirement' ? 'active' : ''}" data-tab="retirement">EPF & Retirement</button>
      </div>
    `;

    const items = incentives[activeTab] || [];
    const directoryHtml = items.map((inc, i) => `
      <div class="glass-card reveal mb-md" style="text-align: left;">
        <div class="flex-between">
          <h4 style="color: var(--primary); font-weight: var(--fw-bold); font-size: var(--fs-h4);">${inc.name}</h4>
          <span class="tag tag-primary">${inc.amount}</span>
        </div>
        <div class="text-muted mt-xs" style="font-size: var(--fs-xs); font-weight: 500;">
          Agency: ${inc.agency} | Target: ${inc.coverage}
        </div>
        <p class="mt-sm" style="font-size: var(--fs-small); color: var(--text-secondary);">${inc.desc}</p>
        ${inc.link && inc.link !== '#' ? `
          <div class="mt-md">
            <a href="${inc.link}" target="_blank" class="btn btn-outline" style="padding: 6px 16px; font-size: var(--fs-xs);">Learn More →</a>
          </div>
        ` : ''}
      </div>
    `).join('');

    container.innerHTML = `
      <div class="grid grid-3 stagger mb-xl">
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">RM ${budget.revenue.toFixed(1)}B</div>
          <div class="stat-label">Fiscal Revenue</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">Projected Budget ${budget.year}</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow text-danger">RM ${budget.expenditure.toFixed(1)}B</div>
          <div class="stat-label">Fiscal Expenditure</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">Operating + Development</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow text-warning">${((budget.deficit / budget.expenditure) * 100).toFixed(1)}%</div>
          <div class="stat-label">Budget Deficit Ratio</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">Deficit: RM ${Math.abs(budget.deficit).toFixed(1)}B</div>
        </div>
      </div>

      <h3 class="chart-title reveal mb-md">Government Incentives & Support Directory</h3>
      ${tabsHtml}

      <div class="flex-col mt-md">
        ${directoryHtml || '<div class="glass-card text-center"><p class="text-muted">No data available for this category.</p></div>'}
      </div>
    `;

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTab = e.currentTarget.getAttribute('data-tab');
        renderSection(container, data);
      });
    });

    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  function translate() {
    if (rendered) {
      const container = document.getElementById('section-government-content');
      if (container) NadiI18n.applyTranslations();
    }
  }

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.government = { init, translate };
})();
