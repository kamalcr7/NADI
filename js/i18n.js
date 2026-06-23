/* ============================================================
   NADI — Internationalization (BM / EN)
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'nadi_lang';
  let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';
  const listeners = [];

  /* ---- Translation Dictionary ---- */
  const translations = {
    en: {
      /* --- Nav --- */
      'nav.weather': 'Weather',
      'nav.fuel': 'Fuel',
      'nav.economy': 'Economy',
      'nav.population': 'Population',
      'nav.exchange': 'Currency',
      'nav.transport': 'Transport',
      'nav.prices': 'Prices',
      'nav.employment': 'Jobs',
      'nav.safety': 'Safety',
      'nav.government': 'Government',
      'nav.healthcare': 'Health',
      'nav.education': 'Education',
      'nav.environment': 'Environment',
      'nav.tourism': 'Tourism',

      /* --- Hero --- */
      'hero.title': 'The Pulse of',
      'hero.title.highlight': 'Malaysia',
      'hero.subtitle': 'Real-time data, insights, and essential information — all in one place. For Malaysians, expats, and visitors.',
      'hero.cta': 'Explore Data',
      'hero.stat.population': 'Population',
      'hero.stat.gdp': 'GDP Growth',
      'hero.stat.datasets': 'Datasets',
      'hero.stat.updated': 'Last Updated',

      /* --- Weather --- */
      'weather.badge': 'Live Weather',
      'weather.title': 'Weather Forecast',
      'weather.subtitle': '7-day forecast from the Malaysian Meteorological Department (MET Malaysia).',
      'weather.morning': 'Morning',
      'weather.afternoon': 'Afternoon',
      'weather.night': 'Night',
      'weather.today': 'Today',
      'weather.warnings': 'Active Warnings',
      'weather.no_warnings': 'No active weather warnings',
      'weather.earthquake': 'Earthquake Alerts',

      /* --- Fuel --- */
      'fuel.badge': 'Weekly Update',
      'fuel.title': 'Fuel Prices',
      'fuel.subtitle': 'Current retail fuel prices set by the Malaysian government, updated weekly every Wednesday.',
      'fuel.ron95': 'RON 95',
      'fuel.ron97': 'RON 97',
      'fuel.diesel': 'Diesel',
      'fuel.diesel_east': 'Diesel (East MY)',
      'fuel.per_litre': 'RM / litre',
      'fuel.history': 'Price History (12 Months)',
      'fuel.effective': 'Effective Date',

      /* --- Economy --- */
      'economy.badge': 'Economic Indicators',
      'economy.title': 'Economy Dashboard',
      'economy.subtitle': 'Key economic indicators from the Department of Statistics Malaysia (DOSM).',
      'economy.gdp': 'GDP Growth Rate',
      'economy.cpi': 'Consumer Price Index',
      'economy.trade': 'Trade Balance',
      'economy.quarterly': 'Quarterly',
      'economy.annual': 'Annual',
      'economy.yoy': 'Year-on-Year',
      'economy.exports': 'Exports',
      'economy.imports': 'Imports',
      'economy.billion': 'billion',

      /* --- Population --- */
      'population.badge': 'Demographics',
      'population.title': 'Population & Demographics',
      'population.subtitle': 'Population statistics by state, ethnicity, and age group.',
      'population.total': 'Total Population',
      'population.by_state': 'Population by State',
      'population.by_ethnicity': 'By Ethnicity',
      'population.growth': 'Growth Rate',
      'population.citizens': 'Citizens',
      'population.non_citizens': 'Non-Citizens',

      /* --- Exchange --- */
      'exchange.badge': 'Daily Rates',
      'exchange.title': 'Currency Exchange',
      'exchange.subtitle': 'Malaysian Ringgit (MYR) exchange rates from Bank Negara Malaysia.',
      'exchange.rate': 'Rate',
      'exchange.buy': 'Buying',
      'exchange.sell': 'Selling',
      'exchange.middle': 'Middle',
      'exchange.updated': 'Rates as of',

      /* --- Transport --- */
      'transport.badge': 'Public Transport',
      'transport.title': 'Transportation',
      'transport.subtitle': 'Public transport systems, routes, and schedules across Malaysia.',
      'transport.rail': 'Rail Systems',
      'transport.bus': 'Bus Services',
      'transport.agencies': 'Transport Agencies',
      'transport.coverage': 'Coverage Areas',
      'transport.operator.prasarana': 'Prasarana Malaysia',
      'transport.operator.prasarana.desc': 'Operates Rapid KL LRT, MRT, Monorail, and Rapid Bus networks across Klang Valley.',
      'transport.operator.ktmb': 'KTMB (Keretapi Tanah Melayu)',
      'transport.operator.ktmb.desc': 'Runs KTM Komuter, ETS (Intercity high-speed rail), and KTM Intercity lines.',
      'transport.operator.mybas': 'myBAS / bas.my',
      'transport.operator.mybas.desc': 'National initiative improving stage bus service integration across regional cities.',
      'transport.chart.title': '12-Month Transit Ridership Trend',

      /* --- Prices --- */
      'prices.badge': 'PriceCatcher',
      'prices.title': 'Consumer Prices',
      'prices.subtitle': 'Real prices of daily essentials tracked by the Ministry of Domestic Trade.',
      'prices.category': 'Category',
      'prices.item': 'Item',
      'prices.price': 'Price (RM)',
      'prices.premise': 'Location',

      /* --- Employment --- */
      'employment.badge': 'Labour Market',
      'employment.title': 'Employment & Jobs',
      'employment.subtitle': 'Labour force data from the monthly Labour Force Survey.',
      'employment.rate': 'Unemployment Rate',
      'employment.participation': 'Participation Rate',
      'employment.by_sector': 'Employment by Sector',
      'employment.trend': 'Unemployment Trend',

      /* --- Safety --- */
      'safety.badge': 'Safety Alerts',
      'safety.title': 'Safety & Alerts',
      'safety.subtitle': 'Active weather, flood, and earthquake warnings across Malaysia.',
      'safety.flood': 'Flood Warnings',
      'safety.earthquake': 'Earthquake Alerts',
      'safety.weather_warnings': 'Weather Warnings',
      'safety.no_alerts': 'No active alerts — all clear!',
      'safety.level': 'Alert Level',
      'safety.station': 'Monitoring Station',
      'safety.water_level': 'Water Level',

      /* --- Government --- */
      'government.badge': 'Public Finance',
      'government.title': 'Government & Finance',
      'government.subtitle': 'Government revenue, expenditure, grants, and public aid programs.',
      'government.revenue': 'Revenue',
      'government.expenditure': 'Expenditure',
      'government.grants': 'Grants & Aid',
      'government.fiscal': 'Fiscal Overview',

      /* --- Healthcare --- */
      'healthcare.badge': 'Health Data',
      'healthcare.title': 'Healthcare',
      'healthcare.subtitle': 'Health statistics, infrastructure, and disease surveillance data.',
      'healthcare.facilities': 'Health Facilities',
      'healthcare.diseases': 'Disease Surveillance',
      'healthcare.spending': 'Health Spending',

      /* --- Education --- */
      'education.badge': 'Education Data',
      'education.title': 'Education',
      'education.subtitle': 'Education infrastructure, enrollment, and outcomes across Malaysia.',
      'education.enrollment': 'Enrollment',
      'education.schools': 'Schools',
      'education.outcomes': 'Outcomes',

      /* --- Environment --- */
      'environment.badge': 'Environmental Data',
      'environment.title': 'Environment & Energy',
      'environment.subtitle': 'Energy consumption, land use, and environmental indicators.',
      'environment.energy': 'Energy Usage',
      'environment.electricity': 'Electricity',
      'environment.land': 'Land Use',

      /* --- Tourism --- */
      'tourism.badge': 'Visitor Guide',
      'tourism.title': 'Tourist Essentials',
      'tourism.subtitle': 'Everything visitors need to know about Malaysia at a glance.',
      'tourism.weather_now': 'Current Weather',
      'tourism.currency': 'Currency Info',
      'tourism.fuel_prices': 'Fuel Prices',
      'tourism.emergency': 'Emergency Numbers',
      'tourism.holidays': 'Public Holidays',
      'tourism.tips': 'Travel Tips',
      'tourism.emergency.police': 'Police / Ambulance / Fire',
      'tourism.emergency.tourist_police': 'Tourist Police',
      'tourism.emergency.highway': 'Highway Emergency',

      /* --- Footer --- */
      'footer.description': 'Open data dashboard for Malaysia. Powered by the Malaysia Open Data API.',
      'footer.sections': 'Sections',
      'footer.resources': 'Resources',
      'footer.legal': 'Legal',
      'footer.about': 'About Us',
      'footer.terms': 'Terms & Conditions',
      'footer.privacy': 'Privacy Policy',
      'footer.api_docs': 'API Documentation',
      'footer.open_data': 'Open Data Portal',
      'footer.dosm': 'DOSM Portal',
      'footer.copyright': '© 2025 NADI. Open data, open future.',
      'footer.disclaimer': 'Data sourced from official Malaysian government APIs.',

      /* --- Common --- */
      'common.loading': 'Loading data...',
      'common.error': 'Unable to load data. Please try again later.',
      'common.retry': 'Retry',
      'common.last_updated': 'Last updated',
      'common.view_all': 'View All',
      'common.no_data': 'No data available',
      'common.million': 'million',
      'common.rm': 'RM',
      'common.percent': '%',
    },

    bm: {
      /* --- Nav --- */
      'nav.weather': 'Cuaca',
      'nav.fuel': 'Minyak',
      'nav.economy': 'Ekonomi',
      'nav.population': 'Penduduk',
      'nav.exchange': 'Mata Wang',
      'nav.transport': 'Pengangkutan',
      'nav.prices': 'Harga',
      'nav.employment': 'Pekerjaan',
      'nav.safety': 'Keselamatan',
      'nav.government': 'Kerajaan',
      'nav.healthcare': 'Kesihatan',
      'nav.education': 'Pendidikan',
      'nav.environment': 'Alam Sekitar',
      'nav.tourism': 'Pelancongan',

      /* --- Hero --- */
      'hero.title': 'Nadi',
      'hero.title.highlight': 'Malaysia',
      'hero.subtitle': 'Data masa nyata, maklumat dan panduan penting — semua di satu tempat. Untuk rakyat Malaysia, ekspatriat, dan pelancong.',
      'hero.cta': 'Terokai Data',
      'hero.stat.population': 'Penduduk',
      'hero.stat.gdp': 'Pertumbuhan KDNK',
      'hero.stat.datasets': 'Set Data',
      'hero.stat.updated': 'Kemas Kini Terakhir',

      /* --- Weather --- */
      'weather.badge': 'Cuaca Langsung',
      'weather.title': 'Ramalan Cuaca',
      'weather.subtitle': 'Ramalan 7 hari daripada Jabatan Meteorologi Malaysia (MET Malaysia).',
      'weather.morning': 'Pagi',
      'weather.afternoon': 'Petang',
      'weather.night': 'Malam',
      'weather.today': 'Hari Ini',
      'weather.warnings': 'Amaran Aktif',
      'weather.no_warnings': 'Tiada amaran cuaca aktif',
      'weather.earthquake': 'Amaran Gempa Bumi',

      /* --- Fuel --- */
      'fuel.badge': 'Kemas Kini Mingguan',
      'fuel.title': 'Harga Minyak',
      'fuel.subtitle': 'Harga runcit bahan api semasa yang ditetapkan oleh kerajaan Malaysia, dikemas kini setiap Rabu.',
      'fuel.ron95': 'RON 95',
      'fuel.ron97': 'RON 97',
      'fuel.diesel': 'Diesel',
      'fuel.diesel_east': 'Diesel (MY Timur)',
      'fuel.per_litre': 'RM / liter',
      'fuel.history': 'Sejarah Harga (12 Bulan)',
      'fuel.effective': 'Tarikh Berkuatkuasa',

      /* --- Economy --- */
      'economy.badge': 'Penunjuk Ekonomi',
      'economy.title': 'Papan Pemuka Ekonomi',
      'economy.subtitle': 'Penunjuk ekonomi utama daripada Jabatan Perangkaan Malaysia (DOSM).',
      'economy.gdp': 'Kadar Pertumbuhan KDNK',
      'economy.cpi': 'Indeks Harga Pengguna',
      'economy.trade': 'Imbangan Perdagangan',
      'economy.quarterly': 'Suku Tahunan',
      'economy.annual': 'Tahunan',
      'economy.yoy': 'Tahun ke Tahun',
      'economy.exports': 'Eksport',
      'economy.imports': 'Import',
      'economy.billion': 'bilion',

      /* --- Population --- */
      'population.badge': 'Demografi',
      'population.title': 'Penduduk & Demografi',
      'population.subtitle': 'Statistik penduduk mengikut negeri, etnik, dan kumpulan umur.',
      'population.total': 'Jumlah Penduduk',
      'population.by_state': 'Penduduk Mengikut Negeri',
      'population.by_ethnicity': 'Mengikut Etnik',
      'population.growth': 'Kadar Pertumbuhan',
      'population.citizens': 'Warganegara',
      'population.non_citizens': 'Bukan Warganegara',

      /* --- Exchange --- */
      'exchange.badge': 'Kadar Harian',
      'exchange.title': 'Pertukaran Mata Wang',
      'exchange.subtitle': 'Kadar pertukaran Ringgit Malaysia (MYR) daripada Bank Negara Malaysia.',
      'exchange.rate': 'Kadar',
      'exchange.buy': 'Belian',
      'exchange.sell': 'Jualan',
      'exchange.middle': 'Pertengahan',
      'exchange.updated': 'Kadar setakat',

      /* --- Transport --- */
      'transport.badge': 'Pengangkutan Awam',
      'transport.title': 'Pengangkutan',
      'transport.subtitle': 'Sistem pengangkutan awam, laluan, dan jadual di seluruh Malaysia.',
      'transport.rail': 'Sistem Kereta Api',
      'transport.bus': 'Perkhidmatan Bas',
      'transport.agencies': 'Agensi Pengangkutan',
      'transport.coverage': 'Kawasan Liputan',
      'transport.operator.prasarana': 'Prasarana Malaysia',
      'transport.operator.prasarana.desc': 'Mengendalikan LRT Rapid KL, MRT, Monorel, dan rangkaian Rapid Bus di Lembah Klang.',
      'transport.operator.ktmb': 'KTMB (Keretapi Tanah Melayu)',
      'transport.operator.ktmb.desc': 'Menjalankan KTM Komuter, ETS, dan perkhidmatan KTM Intercity.',
      'transport.operator.mybas': 'myBAS / bas.my',
      'transport.operator.mybas.desc': 'Inisiatif nasional menambah baik integrasi perkhidmatan bas di bandar-bandar utama.',
      'transport.chart.title': 'Trend Perjalanan Transit 12 Bulan',

      /* --- Prices --- */
      'prices.badge': 'PriceCatcher',
      'prices.title': 'Harga Pengguna',
      'prices.subtitle': 'Harga barangan keperluan harian yang dijejaki oleh KPDN.',
      'prices.category': 'Kategori',
      'prices.item': 'Barangan',
      'prices.price': 'Harga (RM)',
      'prices.premise': 'Lokasi',

      /* --- Employment --- */
      'employment.badge': 'Pasaran Buruh',
      'employment.title': 'Pekerjaan',
      'employment.subtitle': 'Data tenaga kerja daripada Survei Tenaga Buruh bulanan.',
      'employment.rate': 'Kadar Pengangguran',
      'employment.participation': 'Kadar Penyertaan',
      'employment.by_sector': 'Pekerjaan Mengikut Sektor',
      'employment.trend': 'Trend Pengangguran',

      /* --- Safety --- */
      'safety.badge': 'Amaran Keselamatan',
      'safety.title': 'Keselamatan & Amaran',
      'safety.subtitle': 'Amaran cuaca, banjir, dan gempa bumi aktif di seluruh Malaysia.',
      'safety.flood': 'Amaran Banjir',
      'safety.earthquake': 'Amaran Gempa Bumi',
      'safety.weather_warnings': 'Amaran Cuaca',
      'safety.no_alerts': 'Tiada amaran aktif — semuanya selamat!',
      'safety.level': 'Tahap Amaran',
      'safety.station': 'Stesen Pemantauan',
      'safety.water_level': 'Paras Air',

      /* --- Government --- */
      'government.badge': 'Kewangan Awam',
      'government.title': 'Kerajaan & Kewangan',
      'government.subtitle': 'Hasil kerajaan, perbelanjaan, geran, dan program bantuan awam.',
      'government.revenue': 'Hasil',
      'government.expenditure': 'Perbelanjaan',
      'government.grants': 'Geran & Bantuan',
      'government.fiscal': 'Gambaran Fiskal',

      /* --- Healthcare --- */
      'healthcare.badge': 'Data Kesihatan',
      'healthcare.title': 'Kesihatan',
      'healthcare.subtitle': 'Statistik kesihatan, infrastruktur, dan data pengawasan penyakit.',
      'healthcare.facilities': 'Kemudahan Kesihatan',
      'healthcare.diseases': 'Pengawasan Penyakit',
      'healthcare.spending': 'Perbelanjaan Kesihatan',

      /* --- Education --- */
      'education.badge': 'Data Pendidikan',
      'education.title': 'Pendidikan',
      'education.subtitle': 'Infrastruktur pendidikan, pendaftaran, dan hasil di seluruh Malaysia.',
      'education.enrollment': 'Pendaftaran',
      'education.schools': 'Sekolah',
      'education.outcomes': 'Hasil',

      /* --- Environment --- */
      'environment.badge': 'Data Alam Sekitar',
      'environment.title': 'Alam Sekitar & Tenaga',
      'environment.subtitle': 'Penggunaan tenaga, guna tanah, dan penunjuk alam sekitar.',
      'environment.energy': 'Penggunaan Tenaga',
      'environment.electricity': 'Elektrik',
      'environment.land': 'Guna Tanah',

      /* --- Tourism --- */
      'tourism.badge': 'Panduan Pelawat',
      'tourism.title': 'Keperluan Pelancong',
      'tourism.subtitle': 'Semua yang pelawat perlu tahu tentang Malaysia sepintas lalu.',
      'tourism.weather_now': 'Cuaca Semasa',
      'tourism.currency': 'Maklumat Mata Wang',
      'tourism.fuel_prices': 'Harga Minyak',
      'tourism.emergency': 'Nombor Kecemasan',
      'tourism.holidays': 'Cuti Umum',
      'tourism.tips': 'Tips Perjalanan',
      'tourism.emergency.police': 'Polis / Ambulans / Bomba',
      'tourism.emergency.tourist_police': 'Polis Pelancong',
      'tourism.emergency.highway': 'Kecemasan Lebuhraya',

      /* --- Footer --- */
      'footer.description': 'Papan pemuka data terbuka untuk Malaysia. Dikuasakan oleh API Data Terbuka Malaysia.',
      'footer.sections': 'Seksyen',
      'footer.resources': 'Sumber',
      'footer.legal': 'Undang-undang',
      'footer.about': 'Tentang Kami',
      'footer.terms': 'Terma & Syarat',
      'footer.privacy': 'Dasar Privasi',
      'footer.api_docs': 'Dokumentasi API',
      'footer.open_data': 'Portal Data Terbuka',
      'footer.dosm': 'Portal DOSM',
      'footer.copyright': '© 2025 NADI. Data terbuka, masa depan terbuka.',
      'footer.disclaimer': 'Data diperolehi daripada API rasmi kerajaan Malaysia.',

      /* --- Common --- */
      'common.loading': 'Memuatkan data...',
      'common.error': 'Tidak dapat memuatkan data. Sila cuba lagi kemudian.',
      'common.retry': 'Cuba Lagi',
      'common.last_updated': 'Kemas kini terakhir',
      'common.view_all': 'Lihat Semua',
      'common.no_data': 'Tiada data tersedia',
      'common.million': 'juta',
      'common.rm': 'RM',
      'common.percent': '%',
    }
  };

  /* ---- Core Functions ---- */
  function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'bm') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    listeners.forEach(fn => fn(lang));
  }

  function getLang() {
    return currentLang;
  }

  function on(callback) {
    listeners.push(callback);
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = t(key);
      // Only replace if a real translation was found (not the raw key)
      if (translated !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translated;
        } else {
          el.textContent = translated;
        }
      }
    });
    /* Update html lang attribute */
    document.documentElement.lang = currentLang === 'bm' ? 'ms' : 'en';
  }

  /* ---- Expose globally ---- */
  window.NadiI18n = {
    t,
    setLang,
    getLang,
    on,
    applyTranslations
  };
})();
