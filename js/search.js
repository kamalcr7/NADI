/* ============================================================
   KTMY — Global Search Module
   ============================================================ */

(function () {
  'use strict';

  // Search items list (English/BM names, descriptions, tags, and corresponding tab ID)
  const SEARCH_ITEMS = [
    { id: 'overview', key: 'overview', tab: 'overview', en: { name: 'Overview', desc: 'Main landing page summarizing key stats.' }, bm: { name: 'Gambaran Keseluruhan', desc: 'Halaman utama yang merangkumi statistik utama.' }, tags: ['landing', 'home', 'main', 'gdp', 'population'] },
    { id: 'weather', key: 'weather', tab: 'weather', en: { name: 'Weather Forecast', desc: '7-day meteorological forecast and warnings.' }, bm: { name: 'Ramalan Cuaca', desc: 'Ramalan cuaca 7 hari dan amaran met.' }, tags: ['weather', 'forecast', 'rain', 'hujan', 'cuaca', 'temp', 'wind'] },
    { id: 'safety', key: 'safety', tab: 'safety', en: { name: 'Safety Alerts', desc: 'Active flood levels and seismic warnings.' }, bm: { name: 'Amaran Keselamatan', desc: 'Tahap banjir aktif dan amaran gempa bumi.' }, tags: ['flood', 'earthquake', 'alerts', 'banjir', 'gempa', 'safety'] },
    { id: 'cost', key: 'cost', tab: 'cost', en: { name: 'Cost of Living & Fuel Prices', desc: 'Subsidised RON95, Diesel, and LPG price matrices.' }, bm: { name: 'Kos Sara Hidup & Harga Minyak', desc: 'Matriks harga RON95, Diesel, dan LPG bersubsidi.' }, tags: ['fuel', 'ron95', 'diesel', 'budi madani', 'prices', 'minyak', 'kos'] },
    { id: 'economy', key: 'economy', tab: 'economy', en: { name: 'Economy & GDP', desc: 'National economic growth, CPI inflation, and SITC trade balance.' }, bm: { name: 'Ekonomi & KDNK', desc: 'Pertumbuhan ekonomi negara, inflasi CPI, dan imbangan perdagangan.' }, tags: ['economy', 'gdp', 'inflation', 'cpi', 'trade', 'sitc', 'kdnk', 'eksport'] },
    { id: 'society', key: 'society', tab: 'society', en: { name: 'Society & Transit', desc: 'Demographics, population charts, and public transport ridership.' }, bm: { name: 'Masyarakat & Transit', desc: 'Demografi, carta penduduk, dan jumlah penumpang transit.' }, tags: ['population', 'ridership', 'lrt', 'mrt', 'ktm', 'rapidkl', 'transit', 'penduduk'] },
    { id: 'government', key: 'government', tab: 'government', en: { name: 'Government Incentives & Support', desc: 'STR financial aid, JPA/PTPTN loans, and SME grants.' }, bm: { name: 'Insentif & Sokongan Kerajaan', desc: 'Bantuan kewangan STR, pinjaman JPA/PTPTN, dan geran PKS.' }, tags: ['str', 'ptptn', 'jpa', 'sme', 'grants', 'epf', 'kwsp', 'bantuan', 'loans'] },
    { id: 'tariffs', key: 'tariffs', tab: 'tariffs', en: { name: 'TNB Electricity Tariffs', desc: 'Domestic, commercial, and industrial electricity rates.' }, bm: { name: 'Tarif Elektrik TNB', desc: 'Kadar elektrik domestik, komersial, dan perindustrian.' }, tags: ['electricity', 'tnb', 'tariff', 'elektrik', 'tenaga', 'bil', 'bill'] },
    { id: 'environment', key: 'environment', tab: 'environment', en: { name: 'Environment & Energy', desc: 'Primary species biodiversity, energy supply, and land usage.' }, bm: { name: 'Alam Sekitar & Tenaga', desc: 'Biodiversiti spesies utama, bekalan tenaga, dan penggunaan tanah.' }, tags: ['environment', 'energy', 'land', 'species', 'hutan', 'biodiversiti'] },
    { id: 'visitor', key: 'visitor', tab: 'visitor', en: { name: 'Visitor Guide & Tourism', desc: 'Travel tips, MYR currency converter, public holidays, and arrival trends.' }, bm: { name: 'Panduan Pelawat & Pelancongan', desc: 'Tips perjalanan, penukar mata wang MYR, cuti umum, dan trend ketibaan.' }, tags: ['tourism', 'travel', 'holiday', 'converter', 'currency', 'forex', 'pelancong', 'cuti'] }
  ];

  function init() {
    const searchInputs = [
      { inputId: 'global-search', resultsId: 'search-results' },
      { inputId: 'sidebar-search', resultsId: 'sidebar-search-results' }
    ];

    searchInputs.forEach(({ inputId, resultsId }) => {
      const input = document.getElementById(inputId);
      const resultsDiv = document.getElementById(resultsId);
      if (!input || !resultsDiv) return;

      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
          resultsDiv.style.display = 'none';
          resultsDiv.innerHTML = '';
          return;
        }

        const lang = KtmyI18n.getLang();
        const matches = SEARCH_ITEMS.filter(item => {
          const itemData = item[lang] || item['en'];
          const nameMatch = itemData.name.toLowerCase().includes(query);
          const descMatch = itemData.desc.toLowerCase().includes(query);
          const tagMatch = item.tags.some(tag => tag.includes(query));
          return nameMatch || descMatch || tagMatch;
        });

        renderResults(matches, resultsDiv, input);
      });

      // Close dropdowns on clicking outside
      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultsDiv.contains(e.target)) {
          resultsDiv.style.display = 'none';
        }
      });
    });
  }

  function renderResults(matches, resultsDiv, inputEl) {
    const lang = KtmyI18n.getLang();
    if (matches.length === 0) {
      resultsDiv.innerHTML = `<div class="search-result-no-match">${lang === 'bm' ? 'Tiada seksyen yang sepadan' : 'No matching sections found'}</div>`;
      resultsDiv.style.display = 'block';
      return;
    }

    resultsDiv.innerHTML = matches.map(item => {
      const itemData = item[lang] || item['en'];
      return `
        <div class="search-result-item" data-tab="${item.tab}">
          <div class="search-result-title">${itemData.name}</div>
          <div class="search-result-desc">${itemData.desc}</div>
        </div>
      `;
    }).join('');

    resultsDiv.style.display = 'block';

    // Hook click event
    resultsDiv.querySelectorAll('.search-result-item').forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        const tabId = e.currentTarget.getAttribute('data-tab');
        
        // Clear search
        inputEl.value = '';
        resultsDiv.style.display = 'none';

        // Navigate to tab
        navigateToTab(tabId);
      });
    });
  }

  function navigateToTab(tabId) {
    // Locate the tab link button
    const tabLink = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
    if (tabLink) {
      tabLink.click();
      
      // Close mobile sidebar if open
      document.getElementById('app-sidebar')?.classList.remove('active');
      document.getElementById('sidebar-overlay')?.classList.remove('active');
      
      // Highlight the targeted section
      setTimeout(() => {
        const sectionHeader = document.querySelector(`#tab-${tabId} .section-header`) || document.querySelector(`#tab-${tabId} .glass-card`);
        if (sectionHeader) {
          sectionHeader.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add brief flash glow highlight animation
          sectionHeader.style.outline = '2px solid var(--primary)';
          sectionHeader.style.outlineOffset = '4px';
          sectionHeader.style.borderRadius = 'var(--radius-lg)';
          sectionHeader.style.transition = 'outline var(--duration-normal) var(--ease-out)';
          
          setTimeout(() => {
            sectionHeader.style.outline = '2px solid transparent';
          }, 1500);
        }
      }, 300);
    }
  }

  window.KtmySearch = { init, navigateToTab };
})();
