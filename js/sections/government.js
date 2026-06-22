/* ============================================================
   NADI — Government Incentives & Finance Section Module
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let cachedData = null;
  let activeTab = 'aid'; // aid, study, business

  const INCENTIVES = {
    aid: [
      {
        name: 'Sumbangan Tunai Rahmah (STR)',
        agency: 'Lembaga Hasil Dalam Negeri (LHDN)',
        coverage: 'B40 & M40 Households / Singles',
        amount: 'Up to RM3,700 / year',
        desc: 'Direct cash assistance program designed to ease the cost of living for low-to-medium income households and individuals.',
        link: 'https://bantuantunai.hasil.gov.my/'
      },
      {
        name: 'BUDI Madani Subsidies',
        agency: 'Kementerian Kewangan (MOF)',
        coverage: 'Smallholders, Farmers & Diesel Vehicle Owners',
        amount: 'RM200 / month',
        desc: 'Targeted diesel subsidy aid for eligible individual diesel vehicle owners, farmers, and agriculture smallholders.',
        link: 'https://budimadani.gov.my/'
      },
      {
        name: 'Sumbangan Asas Rahmah (SARA)',
        agency: 'Lembaga Hasil Dalam Negeri (LHDN)',
        coverage: 'Hardcore Poor STR Recipients',
        amount: 'RM1,200 / year (RM100/month)',
        desc: 'Targeted cashless food aid credit credited into the identity card (MyKad) of recipients to purchase basic groceries.',
        link: 'https://bantuantunai.hasil.gov.my/'
      }
    ],
    study: [
      {
        name: 'JPA Program Khas (Scholarships)',
        agency: 'Jabatan Perkhidmatan Awam (JPA)',
        coverage: 'Post-SPM Top Scorers',
        amount: 'Full tuition fees + living allowance',
        desc: 'Sponsorship for outstanding SPM scorers to pursue tertiary education at prestigious local or foreign universities.',
        link: 'https://esilav2.jpa.gov.my/'
      },
      {
        name: 'MARA Education Loans (SPIP)',
        agency: 'Majlis Amanah Rakyat (MARA)',
        coverage: 'Bumiputera tertiary students',
        amount: 'Convertible loans (up to 90% discount)',
        desc: 'Convertible study loans for tertiary education in science, technology, engineering, and vocational subjects.',
        link: 'https://www.mara.gov.my/'
      },
      {
        name: 'PTPTN Study Financing',
        agency: 'Perbadanan Tabung Pendidikan Tinggi Nasional',
        coverage: 'All registered college/university students',
        amount: 'Up to RM20,000 / year',
        desc: 'Secondary education loans covering tuition fees for diploma and degree courses at public and private colleges.',
        link: 'https://www.ptptn.gov.my/'
      }
    ],
    business: [
      {
        name: 'SME Digitalisation Matching Grant',
        agency: 'MDEC / BSN',
        coverage: 'Micro-businesses & SMEs',
        amount: '50% matching grant up to RM5,000',
        desc: 'Government subsidy helping small businesses adopt digital tools like POS systems, accounting software, and e-commerce.',
        link: 'https://mdec.my/'
      },
      {
        name: 'TERAJU Superb Grant',
        agency: 'Unit Peneraju Agenda Bumiputera (TERAJU)',
        coverage: 'Bumiputera Startups & Entrepreneurs',
        amount: 'Up to RM500,000 grant',
        desc: 'Funding for innovative, tech-enabled startups to validate products, commercialise ideas, and scale businesses.',
        link: 'https://www.teraju.gov.my/'
      },
      {
        name: 'TEKUN Niaga Financing',
        agency: 'Tabung Ekonomi Kumpulan Usaha Niaga',
        coverage: 'Micro-entrepreneurs',
        amount: 'RM1,000 to RM100,000 micro-loans',
        desc: 'Fast micro-financing with minimal documentation for small traders, retail shops, and home businesses.',
        link: 'https://www.tekun.gov.my/'
      }
    ]
  };

  async function init() {
    const container = document.getElementById('section-government-content');
    if (!container) return;

    // We can show a budget comparison (Revenue: RM340B vs Expenditure: RM421B)
    cachedData = {
      budget: {
        revenue: 339.7, // RM Billion
        expenditure: 421.0, // RM Billion
        deficit: -81.3,
        year: 2025
      }
    };
    
    renderSection(container, cachedData);
  }

  function renderSection(container, data) {
    const { budget } = data;

    // Tabs navigation
    const tabsHtml = `
      <div class="tabs reveal mb-lg">
        <button class="tab-btn ${activeTab === 'aid' ? 'active' : ''}" data-tab="aid" data-i18n="government.tab.aid">Social Aid & Subsidies</button>
        <button class="tab-btn ${activeTab === 'study' ? 'active' : ''}" data-tab="study" data-i18n="government.tab.study">Education Loans & JPA</button>
        <button class="tab-btn ${activeTab === 'business' ? 'active' : ''}" data-tab="business" data-i18n="government.tab.business">SME Grants & TEKUN</button>
      </div>
    `;

    // Dynamic Directory List
    const items = INCENTIVES[activeTab] || [];
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
        <div class="mt-md">
          <a href="${inc.link}" target="_blank" class="btn btn-outline" style="padding: 6px 16px; font-size: var(--fs-xs);">Apply Now →</a>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="grid grid-3 stagger mb-xl">
        <!-- Fiscal Card 1: Revenue -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">RM ${budget.revenue.toFixed(1)}B</div>
          <div class="stat-label" data-i18n="government.revenue">Fiscal Revenue</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">Projected Budget ${budget.year}</div>
        </div>

        <!-- Fiscal Card 2: Expenditure -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-danger">RM ${budget.expenditure.toFixed(1)}B</div>
          <div class="stat-label" data-i18n="government.expenditure">Fiscal Expenditure</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">Operating + Development</div>
        </div>

        <!-- Fiscal Card 3: Deficit -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-warning">${((budget.deficit / budget.expenditure) * 100).toFixed(1)}%</div>
          <div class="stat-label" data-i18n="government.deficit">Budget Deficit Ratio</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">Deficit: RM ${Math.abs(budget.deficit).toFixed(1)}B</div>
        </div>
      </div>

      <h3 class="chart-title reveal mb-md" data-i18n="government.incentives.title">Government Incentives & Support Directory</h3>
      ${tabsHtml}

      <div class="flex-col mt-md">
        ${directoryHtml}
      </div>
    `;

    // Hook tab switches
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTab = e.currentTarget.getAttribute('data-tab');
        renderSection(container, data);
      });
    });

    // Apply translations
    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  function translate() {
    const container = document.getElementById('section-government-content');
    if (container && cachedData) {
      renderSection(container, cachedData);
    }
  }

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.government = { init, translate };
})();
