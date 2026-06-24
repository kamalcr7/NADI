/* ============================================================
   KTMY — Education Section Module
   ------------------------------------------------------------
   Data Source: Curated enrollment and infrastructure statistics
   sourced from Ministry of Education (MOE) annual publications.
   ============================================================ */

(function () {
  'use strict';
  let initialized = false;
  let cachedData = null;
  let chartInstance = null;

  async function init() {
    const container = document.getElementById('section-education-content');
    if (!container) return;

    if (initialized && cachedData) {
      renderSection(container, cachedData);
      return;
    }
    initialized = true;

    // Load data
    cachedData = {
      enrollment: [
        { level: 'Primary (Rendah)', students: 3012000, color: KtmyCharts.COLORS.primary },
        { level: 'Lower Secondary (Menengah Rendah)', students: 1224000, color: KtmyCharts.COLORS.blue },
        { level: 'Upper Secondary (Menengah Atas)', students: 840000, color: KtmyCharts.COLORS.gold },
        { level: 'Post-Secondary (Pra-U / STPM)', students: 104000, color: KtmyCharts.COLORS.purple },
        { level: 'Tertiary (Universiti / UA)', students: 580000, color: KtmyCharts.COLORS.orange }
      ],
      schools: {
        primary: 7780,
        secondary: 2450,
        universities_public: 20,
        universities_private: 410
      }
    };

    renderSection(container, cachedData);
  }

  function renderSection(container, data) {
    const isBm = KtmyI18n.getLang() === 'bm';
    const { enrollment, schools } = data;
    const totalStudents = enrollment.reduce((sum, item) => sum + item.students, 0);
    const totalSchools = schools.primary + schools.secondary;

    container.innerHTML = `
      <div class="grid grid-3 mb-xl stagger">
        <!-- Student count -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">${(totalStudents / 1e6).toFixed(2)}M</div>
          <div class="stat-label" data-i18n="education.enrollment">${isBm ? 'Jumlah Pendaftaran Pelajar' : 'Total Student Enrollment'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">${isBm ? 'Prasekolah hingga Universiti' : 'Pre-School to University'}</div>
        </div>

        <!-- School count -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">${totalSchools.toLocaleString()}</div>
          <div class="stat-label" data-i18n="education.schools">${isBm ? 'Sekolah Awam' : 'Public Schools'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">${schools.primary.toLocaleString()} ${isBm ? 'Rendah' : 'Primary'} | ${schools.secondary.toLocaleString()} ${isBm ? 'Menengah' : 'Secondary'}</div>
        </div>

        <!-- Tertiary institutions -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-success">${schools.universities_public + schools.universities_private}</div>
          <div class="stat-label">${isBm ? 'Institusi Pengajian Tinggi' : 'Higher Education Institutions'}</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">${schools.universities_public} ${isBm ? 'Awam (UA)' : 'Public (UA)'} | ${schools.universities_private} ${isBm ? 'Swasta (IPTS)' : 'Private (IPTS)'}</div>
        </div>
      </div>

      <div class="grid grid-2 stagger">
        <!-- Infrastructure breakdown card -->
        <div class="flex-col gap-md">
          <a href="https://www.moe.gov.my" target="_blank" class="info-card reveal" style="text-decoration: none; transition: transform var(--duration-fast) var(--ease-out); cursor: pointer;">
            <div class="info-icon">🏫</div>
            <div class="info-content">
              <h4 style="display: flex; align-items: center; gap: 6px;">${isBm ? 'Kementerian Pendidikan Malaysia (KPM)' : 'Ministry of Education (MOE)'} <span style="font-size:0.75rem; color:var(--primary);">🔗</span></h4>
              <p>${isBm ? 'Mengawal dan menyelaraskan kurikulum pendidikan rendah, menengah, dan pasca-menengah (KSSR, KSSM, SPM, STPM) di semua negeri.' : 'Governs and coordinates primary, secondary, and post-secondary educational curriculums (KSSR, KSSM, SPM, STPM) across all states.'}</p>
            </div>
          </a>

          <a href="https://www.mohe.gov.my" target="_blank" class="info-card reveal" style="text-decoration: none; transition: transform var(--duration-fast) var(--ease-out); cursor: pointer;">
            <div class="info-icon">🎓</div>
            <div class="info-content">
              <h4 style="display: flex; align-items: center; gap: 6px;">${isBm ? 'Kementerian Pendidikan Tinggi (KPT)' : 'Ministry of Higher Education (MOHE)'} <span style="font-size:0.75rem; color:var(--primary);">🔗</span></h4>
              <p>${isBm ? 'Menyelia universiti awam (UA), politeknik, kolej komuniti, dan kolej/universiti swasta (IPTS).' : 'Oversees public universities (UA), polytechnics, community colleges, and private colleges/universities (IPTS).'}</p>
            </div>
          </a>

          <a href="https://www.tvet.gov.my" target="_blank" class="info-card reveal" style="text-decoration: none; transition: transform var(--duration-fast) var(--ease-out); cursor: pointer;">
            <div class="info-icon">💡</div>
            <div class="info-content">
              <h4 style="display: flex; align-items: center; gap: 6px;">TVET Malaysia <span style="font-size:0.75rem; color:var(--primary);">🔗</span></h4>
              <p>${isBm ? 'Agenda nasional berkeutamaan tinggi yang menyediakan laluan kemahiran vokasional dan pensijilan industri untuk lulusan menengah.' : 'High priority national agenda providing vocational skill pathways and industry certifications for secondary graduates.'}</p>
            </div>
          </a>
        </div>

        <!-- Enrollment chart -->
        <div class="glass-card reveal">
          <h3 class="chart-title" data-i18n="education.chart.title">${isBm ? 'Kemasukan Mengikut Tahap Pendidikan' : 'Enrollment by Educational Level'}</h3>
          <div class="chart-container" style="height: 350px;">
            <canvas id="chart-education-enrollment"></canvas>
          </div>
        </div>
      </div>
    `;

    // Render chart
    setTimeout(() => {
      KtmyCharts.destroyChart('chart-education-enrollment');

      const levelTranslations = {
        'Primary (Rendah)': isBm ? 'Rendah (Primary)' : 'Primary (Rendah)',
        'Lower Secondary (Menengah Rendah)': isBm ? 'Menengah Rendah (Lower Sec)' : 'Lower Secondary (Menengah Rendah)',
        'Upper Secondary (Menengah Atas)': isBm ? 'Menengah Atas (Upper Sec)' : 'Upper Secondary (Menengah Atas)',
        'Post-Secondary (Pra-U / STPM)': isBm ? 'Pasca-Menengah (Post-Sec / STPM)' : 'Post-Secondary (Pra-U / STPM)',
        'Tertiary (Universiti / UA)': isBm ? 'Pengajian Tinggi (Tertiary / UA)' : 'Tertiary (Universiti / UA)'
      };

      const labels = enrollment.map(e => levelTranslations[e.level] || e.level);
      const values = enrollment.map(e => e.students); // absolute values

      chartInstance = KtmyCharts.createBarChart('chart-education-enrollment', {
        labels,
        datasets: [{
          label: isBm ? 'Pelajar' : 'Students',
          data: values,
          colors: enrollment.map(e => e.color)
        }],
        horizontal: true
      });
    }, 0);

    // Apply translations
    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  function translate() {
    const container = document.getElementById('section-education-content');
    if (container && cachedData) {
      renderSection(container, cachedData);
    }
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.education = { init, translate };
})();
