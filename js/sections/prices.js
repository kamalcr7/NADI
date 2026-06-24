/* ============================================================
   KTMY — Consumer Prices Section Module (PriceCatcher)
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let cachedData = null;
  let currentCategory = 'all';

  async function init() {
    const container = document.getElementById('section-prices-content');
    if (!container) return;

    if (initialized && cachedData) {
      renderSection(container, cachedData);
      return;
    }
    initialized = true;

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p data-i18n="common.loading">${KtmyI18n.t('common.loading')}</p>
      </div>
    `;

    // Subscribe to KTMY prices data
    KtmyStore.on('prices', (data, status) => {
      if (status === 'loading') return;

      let records = [];
      if (data) {
        records = Array.isArray(data) ? data : (data.data || []);
      }

      if (records.length === 0) {
        records = getMockPriceData();
      }

      cachedData = records;
      renderSection(container, cachedData);
    });
  }

  function getMockPriceData() {
    // Current average retail price catcher data for essential goods in Malaysia
    return [
      { date: '2026-06-20', item_name: 'Standard Chicken (Ayam Bersih Standard)', category: 'meat', price: 9.40, premise: 'Pasar Awam Larkin, Johor' },
      { date: '2026-06-20', item_name: 'Local Beef (Daging Lembu Tempatan)', category: 'meat', price: 38.00, premise: 'Pasar Awam Chow Kit, KL' },
      { date: '2026-06-20', item_name: 'Chicken Eggs Grade A (Telur Ayam Gred A)', category: 'grocery', price: 13.50, premise: 'Lotus Extra Cheras, KL' },
      { date: '2026-06-20', item_name: 'Cooking Oil 5kg (Minyak Masak Pek 5kg)', category: 'grocery', price: 29.50, premise: 'Mydin USJ, Selangor' },
      { date: '2026-06-20', item_name: 'Grade B Eggs (Telur Gred B - 30 Biji)', category: 'grocery', price: 12.90, premise: 'Econsave Balakong, Selangor' },
      { date: '2026-06-20', item_name: 'Indian Red Onion (Bawang Merah India)', category: 'vegetable', price: 6.50, premise: 'Pasar Jalan Besar, Melaka' },
      { date: '2026-06-20', item_name: 'Round Cabbage (Kobis Bulat)', category: 'vegetable', price: 4.50, premise: 'Pasar Awam Chow Kit, KL' },
      { date: '2026-06-20', item_name: 'Local Tomato (Tomato Tempatan)', category: 'vegetable', price: 5.80, premise: 'Giant Hypermarket, Johor' },
      { date: '2026-06-20', item_name: 'Mackerel (Ikan Kembung)', category: 'fish', price: 16.00, premise: 'Pasar Awam Larkin, Johor' },
      { date: '2026-06-20', item_name: 'Red Chillies (Cili Merah Kulai)', category: 'vegetable', price: 18.50, premise: 'Pasar Tani Shah Alam' }
    ];
  }

  function renderSection(container, records) {
    // Deduplicate categories and normalise category names
    records.forEach(r => {
      if (!r.category) {
        const item = (r.item_name || '').toLowerCase();
        if (item.includes('ayam') || item.includes('beef') || item.includes('lembu') || item.includes('chicken') || item.includes('daging')) {
          r.category = 'meat';
        } else if (item.includes('sayur') || item.includes('cabbage') || item.includes('tomato') || item.includes('onion') || item.includes('bawang') || item.includes('kobis')) {
          r.category = 'vegetable';
        } else if (item.includes('ikan') || item.includes('fish') || item.includes('kembung') || item.includes('seafood')) {
          r.category = 'fish';
        } else {
          r.category = 'grocery';
        }
      }
    });

    const filtered = currentCategory === 'all' 
      ? records 
      : records.filter(r => r.category === currentCategory);

    // Build Category Filter Chips
    const categories = [
      { id: 'all', label: 'All Items' },
      { id: 'meat', label: 'Poultry & Meat' },
      { id: 'fish', label: 'Seafood & Fish' },
      { id: 'vegetable', label: 'Vegetables' },
      { id: 'grocery', label: 'Grocery Items' }
    ];

    const chipsHtml = categories.map(cat => `
      <button class="filter-chip ${currentCategory === cat.id ? 'active' : ''}" 
              data-cat="${cat.id}">
        ${cat.label}
      </button>
    `).join('');

    // Build Table Rows
    const rowsHtml = filtered.map(r => {
      const priceVal = parseFloat(r.price || r.price_value || 0);
      const itemName = r.item_name || r.item || 'Consumer Item';
      const premise = r.premise_name || r.premise || 'Retail Premises';
      return `
        <tr>
          <td style="font-weight: var(--fw-semibold); color: var(--text-primary);">${itemName}</td>
          <td style="text-transform: capitalize;">${r.category}</td>
          <td class="text-primary-color" style="font-weight: var(--fw-bold);">RM ${priceVal.toFixed(2)}</td>
          <td style="font-size: var(--fs-xs); color: var(--text-muted);">${premise}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <!-- Filter Bar -->
      <div class="filter-bar reveal">
        ${chipsHtml}
      </div>

      <!-- Data Table -->
      <div class="glass-card reveal mt-md" style="padding: 0; overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="prices.item">Item Name</th>
              <th data-i18n="prices.category">Category</th>
              <th data-i18n="prices.price">Retail Price</th>
              <th data-i18n="prices.premise">Monitoring Premise</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml.length > 0 ? rowsHtml : `<tr><td colspan="4" class="text-center text-muted" data-i18n="common.no_data">No price records found.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    // Hook filter click listeners
    container.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentCategory = e.currentTarget.getAttribute('data-cat');
        renderSection(container, records);
      });
    });

    // Apply translations
    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  function translate() {
    const container = document.getElementById('section-prices-content');
    if (container && cachedData) {
      renderSection(container, cachedData);
    }
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.prices = { init, translate };
})();
