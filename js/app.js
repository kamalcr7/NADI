/* ============================================================
   NADI — Main Application Router & Orchestrator
   ============================================================ */

(function () {
  'use strict';

  // Tab definitions: id -> { label, modules[] }
  const TABS = {
    overview:    { label: 'Overview',               modules: ['hero'] },
    weather:     { label: 'Weather Station',         modules: ['weather'] },
    cost:        { label: 'Cost of Living',          modules: ['fuel', 'prices'] },
    economy:     { label: 'Economy & GDP',           modules: ['economy', 'employment'] },
    society:     { label: 'Society & Transit',       modules: ['population', 'transport', 'education', 'healthcare'] },
    safety:      { label: 'Safety Alerts',           modules: ['safety'] },
    government:  { label: 'Government Incentives',   modules: ['government'] },
    tariffs:     { label: 'TNB Electricity Tariffs',  modules: ['tariffs'] },
    environment: { label: 'Environment & Energy',    modules: ['environment'] },
    visitor:     { label: 'Visitor Guide',           modules: ['tourism'] },
  };

  let activeTabId = 'overview';
  window._activeTab = 'overview';

  /* ---- Tab Switching ---- */
  function switchTab(tabId) {
    if (!TABS[tabId]) tabId = 'overview';
    activeTabId = tabId;
    window._activeTab = tabId;

    // Show/hide content panels
    document.querySelectorAll('.tab-content').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    // Update sidebar active state
    document.querySelectorAll('[data-tab]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-tab') === tabId);
    });

    // Update topbar breadcrumb
    const breadcrumb = document.getElementById('topbar-section-name');
    if (breadcrumb) breadcrumb.textContent = TABS[tabId].label;

    // Initialize section modules
    const { modules } = TABS[tabId];
    modules.forEach(name => {
      if (window.NadiSections?.[name]) {
        window.NadiSections[name].init();
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update last-updated indicator
    const lu = document.getElementById('topbar-last-updated');
    if (lu) lu.textContent = `Refreshed: ${new Date().toLocaleTimeString('en-MY')}`;
  }

  /* ---- Hash Routing ---- */
  function handleRouting() {
    let hash = window.location.hash.replace('#', '') || 'overview';
    // Route aliases for common navigation paths
    const ALIASES = {
      transport: 'society',
      transit: 'society',
      population: 'society',
      education_module: 'society',
      healthcare_module: 'society',
      fuel: 'cost',
      prices: 'cost',
      employment: 'economy',
      gdp: 'economy',
      trade: 'economy',
      tourism: 'visitor',
    };
    if (ALIASES[hash]) hash = ALIASES[hash];
    switchTab(hash);
  }

  /* ---- Mobile Drawer ---- */
  function initMobileMenu() {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById('mobile-menu-btn');
    const moreBtn = document.getElementById('mobile-more-btn');
    const sidebarLinks = document.querySelectorAll('.tab-link');

    if (!sidebar || !overlay) return;

    function open() {
      sidebar.classList.add('mobile-open');
      overlay.classList.add('visible');
      document.body.classList.add('no-scroll');
    }
    function close() {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('visible');
      document.body.classList.remove('no-scroll');
    }

    if (menuBtn) menuBtn.addEventListener('click', () => sidebar.classList.contains('mobile-open') ? close() : open());
    if (moreBtn) moreBtn.addEventListener('click', open);
    if (overlay) overlay.addEventListener('click', close);
    sidebarLinks.forEach(link => link.addEventListener('click', close));
  }

  /* ---- Language Switchers ---- */
  function initLanguageSelector() {
    const pairs = [
      { en: 'lang-en', bm: 'lang-bm' },
      { en: 'lang-en-mob', bm: 'lang-bm-mob' },
      { en: 'lang-en-top', bm: 'lang-bm-top' }
    ];

    function updateBtns(lang) {
      pairs.forEach(({ en, bm }) => {
        document.getElementById(en)?.classList.toggle('active', lang === 'en');
        document.getElementById(bm)?.classList.toggle('active', lang === 'bm');
      });
    }

    updateBtns(NadiI18n.getLang());

    pairs.forEach(({ en, bm }) => {
      document.getElementById(en)?.addEventListener('click', () => NadiI18n.setLang('en'));
      document.getElementById(bm)?.addEventListener('click', () => NadiI18n.setLang('bm'));
    });

    NadiI18n.on(lang => {
      updateBtns(lang);
      // Re-translate currently active modules
      (TABS[activeTabId]?.modules || []).forEach(name => {
        if (window.NadiSections?.[name]?.translate) {
          window.NadiSections[name].translate();
        }
      });
      NadiI18n.applyTranslations();
    });
  }

  /* ---- Back to Top ---- */
  function initBackToTop() {
    document.getElementById('back-to-top')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Main Init ---- */
  function init() {
    // Apply initial translations
    NadiI18n.applyTranslations();

    // Init Chart.js global settings
    NadiCharts.init();

    // Init scroll animations
    NadiAnimations.init();

    // Setup handlers
    initMobileMenu();
    initLanguageSelector();
    initBackToTop();

    // Start background data fetching (staggered, respects rate limits)
    NadiStore.start();

    // Start hash router
    window.addEventListener('hashchange', handleRouting);
    handleRouting();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
