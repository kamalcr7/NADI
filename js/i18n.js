/* ============================================================
   KTMY — Internationalization (BM / EN)
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'ktmy_lang';
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
      'footer.copyright': '© 2025 KTMY. Open data, open future.',
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

      /* --- Search & Feedback --- */
      'search.placeholder': 'Search sections, tags, metrics...',
      'search.placeholder_short': 'Search...',
      'feedback.title': 'Feedback & Support',
      'feedback.form_link': 'Google Form (Suggest Features & Bugs)',
      'feedback.github_link': 'GitHub Issues (Tech Reports)',
      'feedback.close': 'Close',

      /* --- Sidebar Nav --- */
      'sidebar.subtitle': 'Malaysia Data Portal',
      'sidebar.overview': 'Overview',
      'sidebar.weather_station': 'Weather Station',
      'sidebar.safety_alerts': 'Safety Alerts',
      'sidebar.cost_of_living': 'Cost of Living',
      'sidebar.economy_gdp': 'Economy & GDP',
      'sidebar.society_transit': 'Society & Transit',
      'sidebar.incentives_support': 'Incentives & Support',
      'sidebar.tnb_tariffs': 'TNB Tariffs',
      'sidebar.environment_energy': 'Environment & Energy',
      'sidebar.visitor_guide': 'Visitor Guide',
      'sidebar.about_ktmy': 'About KTMY',
      'sidebar.terms_privacy': 'Terms & Privacy',
      'sidebar.group.live_data': 'Live Data',
      'sidebar.group.economics': 'Economics',
      'sidebar.group.government': 'Government',
      'sidebar.group.travel': 'Travel & Lifestyle',
      'sidebar.group.about': 'About',
      'sidebar.badge.live': 'LIVE',
      'sidebar.badge.new': 'NEW',
      'sidebar.badge.exp': 'EXP',
      'sidebar.data_sources': 'Data: data.gov.my · Open-Meteo',

      /* --- Section Headers --- */
      'section.weather.badge': 'Live Weather',
      'section.weather.title': 'Weather Station',
      'section.weather.subtitle': 'Real-time forecasts powered by Open-Meteo. Wind field, 7-day outlook, hourly charts.',
      'section.cost.badge': 'Weekly Update',
      'section.cost.title': 'Cost of Living',
      'section.cost.subtitle': 'Fuel prices, consumer goods, and daily essential cost tracking.',
      'section.prices.badge': 'PriceCatcher',
      'section.prices.title': 'Consumer Prices',
      'section.prices.subtitle': 'Real prices of daily essentials tracked by the Ministry of Domestic Trade.',
      'section.economy.badge': 'Economic Indicators',
      'section.economy.title': 'Economy Dashboard',
      'section.economy.subtitle': 'GDP, CPI, inflation and trade data from DOSM.',
      'section.employment.badge': 'Labour Market',
      'section.employment.title': 'Employment & Jobs',
      'section.employment.subtitle': 'Labour force, unemployment trends, and sector breakdown.',
      'section.population.badge': 'Demographics',
      'section.population.title': 'Population & Demographics',
      'section.population.subtitle': 'Population by state, ethnic groups, and historical trends.',
      'section.transport.badge': 'Public Transport',
      'section.transport.title': 'Transportation',
      'section.transport.subtitle': 'KTM, LRT, MRT ridership and public transit network.',
      'section.education.badge': 'Education Data',
      'section.education.title': 'Education Infrastructure',
      'section.education.subtitle': 'School enrollment, university stats, and education metrics.',
      'section.healthcare.badge': 'Public Health',
      'section.healthcare.title': 'Healthcare',
      'section.healthcare.subtitle': 'Hospital capacity, medical personnel and health indicators.',
      'section.safety.badge': 'Safety Alerts',
      'section.safety.title': 'Safety Alerts Console',
      'section.safety.subtitle': 'Active weather warnings, flood alerts, and seismic events across Malaysia.',
      'section.government.badge': 'Public Finance',
      'section.government.title': 'Government Incentives & Support',
      'section.government.subtitle': 'Federal subsidies, grants, aids, sponsorships and fiscal data.',
      'section.tariffs.badge': 'Energy Tariffs',
      'section.tariffs.title': '⚡ TNB Electricity Tariffs',
      'section.tariffs.subtitle': 'Current TNB tariff rates by category — residential, commercial, industrial, and agriculture.',
      'section.environment.badge': 'Environmental Data',
      'section.environment.title': 'Environment & Green Energy',
      'section.environment.subtitle': 'Renewable energy capacity, air quality, and sustainability metrics.',
      'section.visitor.badge': 'Visitor Guide',
      'section.visitor.title': 'Tourist Essentials & Tools',
      'section.visitor.subtitle': 'Currency converter, public holidays, emergency contacts, and travel tips.',

      /* --- Topbar --- */
      'topbar.refresh': '⟳ Refresh',

      /* --- Mobile Nav --- */
      'mobile.home': 'Home',
      'mobile.weather': 'Weather',
      'mobile.cost': 'Cost',
      'mobile.economy': 'Economy',
      'mobile.more': 'More',

      /* --- Footer --- */
      'footer.copyright_full': '© 2025 KTMY. Open data, open future. 🇲🇾',
      'footer.back_to_top': '↑ Top',

      /* --- Disclaimer --- */
      'disclaimer.badge': 'ALPHA / BETA PHASE',
      'disclaimer.title': 'Platform Terms & Disclaimer',
      'disclaimer.early_title': 'Early Stage Release',
      'disclaimer.early_text': 'KTMY is currently in its early alpha/beta development stage. Features, interfaces, and layouts are subject to regular updates, enhancements, and potential downtime.',
      'disclaimer.data_title': 'Data Accuracy Notice',
      'disclaimer.data_text': 'This platform aggregates and displays public data using official government APIs (such as data.gov.my, DOSM, and MOH portals). Although we strive for accuracy, the displayed information is not guaranteed to be 100% accurate, complete, or updated in real-time at all times.',
      'disclaimer.liability_title': 'No Liability & Verification',
      'disclaimer.liability_text': 'All information is provided strictly on an "as-is" basis. KTMY, its developers, and contributors hold no liability for decisions or actions taken based on the datasets, weather alerts, or policy information on this site. Please verify critical facts with official gazettes.',
      'disclaimer.accept': 'I Understand & Accept',

      /* --- Tab Labels (breadcrumb) --- */
      'tab.overview': 'Overview',
      'tab.weather': 'Weather Station',
      'tab.cost': 'Cost of Living',
      'tab.economy': 'Economy & GDP',
      'tab.society': 'Society & Transit',
      'tab.safety': 'Safety Alerts',
      'tab.government': 'Government Incentives',
      'tab.tariffs': 'TNB Electricity Tariffs',
      'tab.environment': 'Environment & Energy',
      'tab.visitor': 'Visitor Guide',
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
      'hero.title': 'Ktmy',
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
      'footer.copyright': '© 2025 KTMY. Data terbuka, masa depan terbuka.',
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

      /* --- Search & Feedback --- */
      'search.placeholder': 'Cari seksyen, tag, metrik...',
      'search.placeholder_short': 'Cari...',
      'feedback.title': 'Maklum Balas & Sokongan',
      'feedback.form_link': 'Borang Google (Cadang Ciri & Lapor Pepijat)',
      'feedback.github_link': 'Isu GitHub (Laporan Teknikal)',
      'feedback.close': 'Tutup',

      /* --- Sidebar Nav --- */
      'sidebar.subtitle': 'Portal Data Malaysia',
      'sidebar.overview': 'Gambaran Keseluruhan',
      'sidebar.weather_station': 'Stesen Cuaca',
      'sidebar.safety_alerts': 'Amaran Keselamatan',
      'sidebar.cost_of_living': 'Kos Sara Hidup',
      'sidebar.economy_gdp': 'Ekonomi & KDNK',
      'sidebar.society_transit': 'Masyarakat & Transit',
      'sidebar.incentives_support': 'Insentif & Sokongan',
      'sidebar.tnb_tariffs': 'Tarif TNB',
      'sidebar.environment_energy': 'Alam Sekitar & Tenaga',
      'sidebar.visitor_guide': 'Panduan Pelawat',
      'sidebar.about_ktmy': 'Tentang KTMY',
      'sidebar.terms_privacy': 'Terma & Privasi',
      'sidebar.group.live_data': 'Data Langsung',
      'sidebar.group.economics': 'Ekonomi',
      'sidebar.group.government': 'Kerajaan',
      'sidebar.group.travel': 'Pelancongan & Gaya Hidup',
      'sidebar.group.about': 'Tentang',
      'sidebar.badge.live': 'LANGSUNG',
      'sidebar.badge.new': 'BARU',
      'sidebar.badge.exp': 'UJI',
      'sidebar.data_sources': 'Data: data.gov.my · Open-Meteo',

      /* --- Section Headers --- */
      'section.weather.badge': 'Cuaca Langsung',
      'section.weather.title': 'Stesen Cuaca',
      'section.weather.subtitle': 'Ramalan masa nyata oleh Open-Meteo. Medan angin, tinjauan 7 hari, carta setiap jam.',
      'section.cost.badge': 'Kemas Kini Mingguan',
      'section.cost.title': 'Kos Sara Hidup',
      'section.cost.subtitle': 'Harga bahan api, barangan pengguna, dan penjejakan kos keperluan harian.',
      'section.prices.badge': 'PriceCatcher',
      'section.prices.title': 'Harga Pengguna',
      'section.prices.subtitle': 'Harga barangan keperluan harian yang dijejaki oleh KPDN.',
      'section.economy.badge': 'Penunjuk Ekonomi',
      'section.economy.title': 'Papan Pemuka Ekonomi',
      'section.economy.subtitle': 'Data KDNK, IHP, inflasi dan perdagangan daripada DOSM.',
      'section.employment.badge': 'Pasaran Buruh',
      'section.employment.title': 'Pekerjaan',
      'section.employment.subtitle': 'Tenaga buruh, trend pengangguran, dan pecahan sektor.',
      'section.population.badge': 'Demografi',
      'section.population.title': 'Penduduk & Demografi',
      'section.population.subtitle': 'Penduduk mengikut negeri, kumpulan etnik, dan trend sejarah.',
      'section.transport.badge': 'Pengangkutan Awam',
      'section.transport.title': 'Pengangkutan',
      'section.transport.subtitle': 'Penumpang KTM, LRT, MRT dan rangkaian transit awam.',
      'section.education.badge': 'Data Pendidikan',
      'section.education.title': 'Infrastruktur Pendidikan',
      'section.education.subtitle': 'Pendaftaran sekolah, statistik universiti, dan metrik pendidikan.',
      'section.healthcare.badge': 'Kesihatan Awam',
      'section.healthcare.title': 'Penjagaan Kesihatan',
      'section.healthcare.subtitle': 'Kapasiti hospital, tenaga perubatan dan penunjuk kesihatan.',
      'section.safety.badge': 'Amaran Keselamatan',
      'section.safety.title': 'Konsol Amaran Keselamatan',
      'section.safety.subtitle': 'Amaran cuaca aktif, amaran banjir, dan peristiwa seismik di seluruh Malaysia.',
      'section.government.badge': 'Kewangan Awam',
      'section.government.title': 'Insentif & Sokongan Kerajaan',
      'section.government.subtitle': 'Subsidi persekutuan, geran, bantuan, tajaan dan data fiskal.',
      'section.tariffs.badge': 'Tarif Tenaga',
      'section.tariffs.title': '⚡ Tarif Elektrik TNB',
      'section.tariffs.subtitle': 'Kadar tarif TNB semasa mengikut kategori — kediaman, komersial, perindustrian, dan pertanian.',
      'section.environment.badge': 'Data Alam Sekitar',
      'section.environment.title': 'Alam Sekitar & Tenaga Hijau',
      'section.environment.subtitle': 'Kapasiti tenaga boleh baharu, kualiti udara, dan metrik kelestarian.',
      'section.visitor.badge': 'Panduan Pelawat',
      'section.visitor.title': 'Keperluan & Alat Pelancong',
      'section.visitor.subtitle': 'Penukar mata wang, cuti umum, kenalan kecemasan, dan tips perjalanan.',

      /* --- Topbar --- */
      'topbar.refresh': '⟳ Muat Semula',

      /* --- Mobile Nav --- */
      'mobile.home': 'Utama',
      'mobile.weather': 'Cuaca',
      'mobile.cost': 'Kos',
      'mobile.economy': 'Ekonomi',
      'mobile.more': 'Lagi',

      /* --- Footer --- */
      'footer.copyright_full': '© 2025 KTMY. Data terbuka, masa depan terbuka. 🇲🇾',
      'footer.back_to_top': '↑ Atas',

      /* --- Disclaimer --- */
      'disclaimer.badge': 'FASA ALFA / BETA',
      'disclaimer.title': 'Terma & Penafian Platform',
      'disclaimer.early_title': 'Pelepasan Peringkat Awal',
      'disclaimer.early_text': 'KTMY kini berada dalam peringkat pembangunan alfa/beta awal. Ciri, antara muka, dan susun atur tertakluk kepada kemas kini, penambahbaikan, dan masa henti yang kerap.',
      'disclaimer.data_title': 'Notis Ketepatan Data',
      'disclaimer.data_text': 'Platform ini mengumpul dan memaparkan data awam menggunakan API rasmi kerajaan (seperti data.gov.my, DOSM, dan portal MOH). Walaupun kami berusaha untuk ketepatan, maklumat yang dipaparkan tidak dijamin 100% tepat, lengkap, atau dikemas kini secara masa nyata pada setiap masa.',
      'disclaimer.liability_title': 'Tiada Liabiliti & Pengesahan',
      'disclaimer.liability_text': 'Semua maklumat disediakan secara "seadanya". KTMY, pembangunnya, dan penyumbang tidak bertanggungjawab atas keputusan atau tindakan yang diambil berdasarkan set data, amaran cuaca, atau maklumat dasar di laman ini. Sila sahkan fakta penting dengan warta rasmi.',
      'disclaimer.accept': 'Saya Faham & Terima',

      /* --- Tab Labels (breadcrumb) --- */
      'tab.overview': 'Gambaran Keseluruhan',
      'tab.weather': 'Stesen Cuaca',
      'tab.cost': 'Kos Sara Hidup',
      'tab.economy': 'Ekonomi & KDNK',
      'tab.society': 'Masyarakat & Transit',
      'tab.safety': 'Amaran Keselamatan',
      'tab.government': 'Insentif Kerajaan',
      'tab.tariffs': 'Tarif Elektrik TNB',
      'tab.environment': 'Alam Sekitar & Tenaga',
      'tab.visitor': 'Panduan Pelawat',
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
  window.KtmyI18n = {
    t,
    setLang,
    getLang,
    on,
    applyTranslations
  };
})();
