/* ============================================================
   KTMY — Government Incentives & Support Section Module
   ============================================================
   Loads curated incentive data from /data/incentives.json
   Falls back to hardcoded data if JSON unavailable.
   Uses KtmyStore.on() event pattern for reliable data loading.
   ============================================================ */

(function () {
  'use strict';
  let rendered = false;
  let activeTab = 'aid';
  let lastData = null;

  function escapeHTML(str) {
    if (typeof str !== 'string') {
      if (str === null || str === undefined) return '';
      return String(str);
    }
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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
    // KtmyStore strips _meta and returns data contents directly,
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
        link: 'https://budimadani.gov.my/'
      });
    }
    if (d.bsh && d.bsh.status) {
      result.aid.push({
        name: d.bsh.name,
        agency: 'LHDN',
        coverage: 'Merged into STR',
        amount: 'N/A',
        desc: d.bsh.note || d.bsh.description,
        link: d.bsh.website || 'https://bantuantunai.hasil.gov.my/'
      });
    }
    // Fuel Subsidies — detail the BUDI & quota info
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
        result.study.push({
          name: p.name,
          agency: 'Government',
          coverage: p.eligibility || 'Various',
          amount: p.amount || 'Subsidised',
          desc: p.description || p.name,
          link: p.website || p.link || '#'
        });
      });
    } else {
      result.study = FALLBACK.study;
    }

    // Healthcare
    if (d.healthcare?.programs) {
      d.healthcare.programs.forEach(p => {
        result.healthcare.push({
          name: p.name,
          agency: 'MOH',
          coverage: p.eligibility || 'Various',
          amount: p.amount || p.description || 'Free / subsidised',
          desc: p.description,
          link: p.website || '#'
        });
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
          agency: 'MOF / KPDN',
          coverage: p.coverage,
          amount: p.amount,
          desc: (p.quota ? `Quota: ${p.quota} | ` : '') + (p.eligibility?.join('; ') || ''),
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
        agency: 'MOF / KPDN',
        coverage: 'Malaysian citizens (with driving licence)',
        amount: 'RM1.99/litre (200L quota)',
        desc: d.fuel_quota.details?.eligibility_rules?.join('; ') || d.fuel_quota.description,
        link: d.fuel_quota.website || '#'
      });
    }

    // Fuel Subsidy summary
    if (d.fuel_subsidy?.prices) {
      const priceSummary = Object.entries(d.fuel_subsidy.prices)
        .map(([k, v]) => `${k}: ${v}`).join(' | ');
      result.aid.push({
        name: 'Fuel Prices (Current)',
        agency: 'MOF / KPDN',
        coverage: 'All registered vehicle owners',
        amount: 'From RM1.99/litre',
        desc: priceSummary,
        link: 'https://budimadani.gov.my'
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
    // Business
    if (d.business?.programs) {
      d.business.programs.forEach(p => {
        result.business.push({
          name: p.name,
          agency: p.name.includes('TERAJU') ? 'TERAJU' : p.name.includes('TEKUN') ? 'TEKUN' : 'MDEC / BSN',
          coverage: p.eligibility || 'SMEs',
          amount: p.amount || 'Variable',
          desc: p.description || p.name,
          link: p.website || p.link || '#'
        });
      });
    } else {
      result.business = FALLBACK.business;
    }

    return result;
  }

  function init() {
    const container = document.getElementById('section-government-content');
    if (!container) return;
    
    // Always reset rendered flag to ensure re-render on navigation
    rendered = false;

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
        <p>${KtmyI18n.t('common.loading')}</p>
      </div>`;

    // Subscribe to DataStore — fires immediately if cached
    let dataCallback = null;
    const unsubscribe = KtmyStore.on('incentives', (data, status) => {
      if (status === 'loading') {
        if (!rendered) container.innerHTML = `
          <div class="loading-state">
            <div class="spinner"></div>
            <p>${KtmyI18n.t('common.loading')}</p>
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
    if (!rendered && KtmyStore.status('incentives') === 'done') {
      const existing = KtmyStore.get('incentives');
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
        if (!rendered && KtmyStore.status('incentives') === 'done') {
          const existing = KtmyStore.get('incentives');
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

  function translateIncentive(inc, isBm) {
    if (!isBm) return inc;
    const copy = { ...inc };

    const dict = {
      // Names
      'Sumbangan Tunai Rahmah (STR)': 'Sumbangan Tunai Rahmah (STR)',
      'BUDI Madani Subsidies': 'Subsidi BUDI Madani',
      'JPA Program Khas': 'Program Khas JPA',
      'MARA Education Loans (SPIP)': 'Pinjaman Pendidikan MARA (SPIP)',
      'PTPTN Study Financing': 'Pembiayaan Pendidikan PTPTN',
      'SME Digitalisation Grant': 'Geran Pendigitalan PKS',
      'TERAJU Superb Grant': 'Geran Superb TERAJU',
      'TEKUN Niaga Financing': 'Pembiayaan TEKUN Niaga',
      'Bantuan Sara Hidup (BSH)': 'Bantuan Sara Hidup (BSH)',
      'EPF i-Saraan': 'KWSP i-Saraan',
      'EPF i-Suri': 'KWSP i-Suri',
      'Personal Tax Relief': 'Pelepasan Cukai Peribadi',
      'e-Wallet Credit': 'Kredit e-Dompet',
      'RON95 Targeted Subsidy System': 'Sistem Subsidi Bersasar RON95',
      'RON95 Targeted Subsidy': 'Subsidi Bersasar RON95',
      'SKDS Fleet Card': 'Kad Fleet SKDS',
      'Subsidised Diesel Control System (SKDS) Fleet Card': 'Kad Fleet Sistem Kawalan Diesel Bersubsidi (SKDS)',
      
      // Coverages / Targets
      'B40 & M40 Households / Singles': 'Isi Rumah / Bujang B40 & M40',
      'B40 and M40 households': 'Isi rumah B40 dan M40',
      'Smallholders, Farmers & Diesel Vehicle Owners': 'Pekebun Kecil, Petani & Pemilik Kenderaan Diesel',
      'Post-SPM Top Scorers': 'Pelajar Cemerlang Pasca-SPM',
      'Bumiputera students': 'Pelajar Bumiputera',
      'All college/university students': 'Semua pelajar kolej/universiti',
      'Micro-businesses & SMEs': 'Perniagaan Mikro & PKS',
      'Bumiputera Startups': 'Syarikat Pemula Bumiputera',
      'Micro-entrepreneurs': 'Usahawan Mikro',
      'Self-employed & gig workers': 'Bekerja sendiri & pekerja gig',
      'Housewives': 'Suri rumah',
      'All taxpayers': 'Semua pembayar cukai',
      'STR recipients': 'Penerima STR',
      'Malaysian citizens (with driving licence)': 'Warganegara Malaysia (dengan lesen memandu)',
      'Covers 85% of all Malaysian citizens': 'Meliputi 85% daripada semua warganegara Malaysia',
      'Private diesel vehicle owners, smallholders, & farmers': 'Pemilik kenderaan diesel persendirian, pekebun kecil, & petani',
      'Approved logistics, public transport, & commercial operators': 'Pengendali logistik, pengangkutan awam, & komersial yang diluluskan',
      'Targeted eligible groups': 'Kumpulan layak yang disasarkan',
      'All registered vehicle owners': 'Semua pemilik kenderaan berdaftar',
      'Merged into STR': 'Digabungkan ke dalam STR',
      
      // Amounts
      'Up to RM3,700 / year': 'Sehingga RM3,700 / tahun',
      'RM200 / month': 'RM200 / bulan',
      'Full tuition + living allowance': 'Yuran pengajian penuh + elaun sara hidup',
      'Convertible loans (up to 90% discount)': 'Pinjaman boleh ubah (sehingga 90% diskaun)',
      'Up to RM20,000 / year': 'Sehingga RM20,000 / tahun',
      '50% matching grant up to RM5,000': 'Geran padanan 50% sehingga RM5,000',
      'Up to RM500,000': 'Sehingga RM500,000',
      'RM1,000 to RM100,000': 'RM1,000 hingga RM100,000',
      'Up to RM300/year': 'Sehingga RM300/tahun',
      'Up to RM300/year (15% match on first RM2,000 contributed)': 'Sehingga RM300/tahun (padanan 15% untuk RM2,000 pertama yang dicarum)',
      'RM60/year': 'RM60/tahun',
      'RM100': 'RM100',
      'Variable': 'Pelbagai',
      'RM2.05/litre (Unlimited)': 'RM2.05/liter (Tanpa Had)',
      'RM2.10/litre (200L/month)': 'RM2.10/liter (200L/bulan)',
      'RM1.88 - RM2.15/litre (Volume limits)': 'RM1.88 - RM2.15/liter (Had isipadu)',
      'From RM2.05/litre': 'Dari RM2.05/liter',
      'N/A': 'N/A'
    };

    if (dict[copy.name]) copy.name = dict[copy.name];
    if (dict[copy.coverage]) copy.coverage = dict[copy.coverage];
    if (dict[copy.amount]) copy.amount = dict[copy.amount];
    if (dict[copy.agency]) copy.agency = dict[copy.agency];

    const descDict = {
      'Direct cash assistance for low-to-medium income households.': 'Bantuan tunai langsung untuk isi rumah berpendapatan rendah hingga sederhana.',
      'Targeted diesel subsidy aid for eligible individuals.': 'Bantuan subsidi diesel bersasar untuk individu yang layak.',
      'Scholarship for outstanding SPM scorers.': 'Biasiswa untuk pelajar cemerlang SPM.',
      'Study loans for STEM subjects.': 'Pinjaman pengajian untuk subjek STEM.',
      'Education loans for diploma and degree courses.': 'Pinjaman pendidikan untuk kursus diploma dan ijazah.',
      'Helping small businesses adopt digital tools.': 'Membantu perniagaan kecil menggunakan alat digital.',
      'Funding for innovative tech-enabled startups.': 'Pembiayaan untuk syarikat pemula berasaskan teknologi inovatif.',
      'Fast micro-financing for small traders.': 'Pembiayaan mikro cepat untuk peniaga kecil.',
      'Voluntary contributions for self-employed and gig workers.': 'Caruman sukarela untuk individu yang bekerja sendiri dan pekerja gig.',
      'Contribution program for housewives.': 'Program caruman untuk suri rumah.',
      'Annual income tax deductions for individuals.': 'Potongan cukai pendapatan tahunan untuk individu.',
      'Cash aid for eligible B40 and M40 households': 'Bantuan tunai untuk isi rumah B40 dan M40 yang layak',
      'Household living cost assistance (predecessor to STR, now merged)': 'Bantuan sara hidup isi rumah (pendahulu kepada STR, kini digabungkan)',
      'BSH has been replaced by Sumbangan Tunai Rahmah (STR)': 'BSH telah digantikan oleh Sumbangan Tunai Rahmah (STR)',
      'Voluntary contributions for self-employed and gig workers': 'Caruman sukarela untuk pekerja sendiri dan pekerja gig',
      'Contribution program for housewives': 'Program caruman untuk suri rumah',
      'Government fuel subsidy system covering RON95, diesel, and LPG': 'Sistem subsidi bahan api kerajaan meliputi RON95, diesel, dan LPG',
      'Annual tax deductions for individuals': 'Potongan cukai tahunan untuk individu'
    };
    
    if (descDict[copy.desc]) {
      copy.desc = descDict[copy.desc];
    } else if (copy.desc) {
      copy.desc = copy.desc
        .replace(/Quota:/g, 'Kuota:')
        .replace(/Private diesel vehicle owners/g, 'Pemilik kenderaan diesel persendirian')
        .replace(/General targeted subsidy/g, 'Subsidi bersasar am')
        .replace(/unlimited volume/g, 'isipadu tanpa had')
        .replace(/covers 85% of citizens/g, 'meliputi 85% warganegara')
        .replace(/top 15% earn/g, '15% pendapatan tertinggi')
        .replace(/top 15% earning class/g, 'golongan pendapatan T15 tertinggi')
        .replace(/foreign nationals/g, 'warga asing')
        .replace(/MyKad verification/g, 'pengesahan MyKad')
        .replace(/at the pump/g, 'di pam')
        .replace(/private pickup\/jeep owners/g, 'pemilik pikap/jeep persendirian')
        .replace(/eligible private diesel vehicle owners/g, 'pemilik kenderaan diesel persendirian yang layak')
        .replace(/smallholders/g, 'pekebun kecil')
        .replace(/commercial transport/g, 'pengangkutan komersial')
        .replace(/fleet cards/g, 'kad fleet');
    }
    
    return copy;
  }

  function renderSection(container, data) {
    lastData = data;
    const isBm = KtmyI18n.getLang() === 'bm';
    const { budget, incentives } = data;

    const tabsHtml = `
      <div class="tabs reveal mb-lg">
        <button class="tab-btn ${activeTab === 'aid' ? 'active' : ''}" data-tab="aid">${isBm ? 'Bantuan Sosial & Subsidi' : 'Social Aid & Subsidies'}</button>
        <button class="tab-btn ${activeTab === 'study' ? 'active' : ''}" data-tab="study">${isBm ? 'Pinjaman Pendidikan' : 'Education Loans'}</button>
        <button class="tab-btn ${activeTab === 'business' ? 'active' : ''}" data-tab="business">${isBm ? 'Geran PKS' : 'SME Grants'}</button>
        <button class="tab-btn ${activeTab === 'healthcare' ? 'active' : ''}" data-tab="healthcare">${isBm ? 'Kesihatan' : 'Healthcare'}</button>
        <button class="tab-btn ${activeTab === 'retirement' ? 'active' : ''}" data-tab="retirement">${isBm ? 'KWSP & Persaraan' : 'EPF & Retirement'}</button>
      </div>
    `;

    const items = incentives[activeTab] || [];
    const directoryHtml = items.map((inc, i) => {
      const translatedInc = translateIncentive(inc, isBm);
      return `
        <div class="glass-card reveal mb-md" style="text-align: left;">
          <div class="flex-between">
            <h4 style="color: var(--primary); font-weight: var(--fw-bold); font-size: var(--fs-h4);">${escapeHTML(translatedInc.name)}</h4>
            <span class="tag tag-primary">${escapeHTML(translatedInc.amount)}</span>
          </div>
          <div class="text-muted mt-xs" style="font-size: var(--fs-xs); font-weight: 500;">
            ${isBm ? 'Agensi' : 'Agency'}: ${escapeHTML(translatedInc.agency)} | ${isBm ? 'Sasaran' : 'Target'}: ${escapeHTML(translatedInc.coverage)}
          </div>
          <p class="mt-sm" style="font-size: var(--fs-small); color: var(--text-secondary);">${escapeHTML(translatedInc.desc)}</p>
          ${translatedInc.link && translatedInc.link !== '#' ? `
            <div class="mt-md">
              <a href="${escapeHTML(translatedInc.link)}" target="_blank" class="btn btn-outline" style="padding: 6px 16px; font-size: var(--fs-xs);">${isBm ? 'Ketahui Lanjut →' : 'Learn More →'}</a>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="grid grid-3 stagger mb-xl">
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">RM ${budget.revenue.toFixed(1)}B</div>
          <div class="stat-label">${isBm ? 'Hasil Fiskal' : 'Fiscal Revenue'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">${isBm ? 'Unjuran Belanjawan' : 'Projected Budget'} ${budget.year}</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow text-danger">RM ${budget.expenditure.toFixed(1)}B</div>
          <div class="stat-label">${isBm ? 'Perbelanjaan Fiskal' : 'Fiscal Expenditure'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">${isBm ? 'Mengurus + Pembangunan' : 'Operating + Development'}</div>
        </div>
        <div class="glass-card reveal">
          <div class="stat-number glow text-warning">${((budget.deficit / budget.expenditure) * 100).toFixed(1)}%</div>
          <div class="stat-label">${isBm ? 'Nisbah Defisit Belanjawan' : 'Budget Deficit Ratio'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">${isBm ? 'Defisit' : 'Deficit'}: RM ${Math.abs(budget.deficit).toFixed(1)}B</div>
        </div>
      </div>

      <h3 class="chart-title reveal mb-md">${isBm ? 'Direktori Insentif & Sokongan Kerajaan' : 'Government Incentives & Support Directory'}</h3>
      ${tabsHtml}

      <div class="flex-col mt-md">
        ${directoryHtml || `<div class="glass-card text-center"><p class="text-muted">${isBm ? 'Tiada data tersedia untuk kategori ini.' : 'No data available for this category.'}</p></div>`}
      </div>
    `;

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTab = e.currentTarget.getAttribute('data-tab');
        renderSection(container, data);
      });
    });

    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  function translate() {
    const container = document.getElementById('section-government-content');
    if (container && lastData) {
      renderSection(container, lastData);
    }
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.government = { init, translate };
})();
