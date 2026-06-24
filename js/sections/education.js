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
    const { enrollment, schools } = data;
    const totalStudents = enrollment.reduce((sum, item) => sum + item.students, 0);
    const totalSchools = schools.primary + schools.secondary;

    container.innerHTML = `
      <div class="grid grid-3 mb-xl stagger">
        <!-- Student count -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">${(totalStudents / 1e6).toFixed(2)}M</div>
          <div class="stat-label" data-i18n="education.enrollment">Total Student Enrollment</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">Pre-School to University</div>
        </div>

        <!-- School count -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-primary-color">${totalSchools.toLocaleString()}</div>
          <div class="stat-label" data-i18n="education.schools">Public Schools</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">${schools.primary.toLocaleString()} Primary | ${schools.secondary.toLocaleString()} Secondary</div>
        </div>

        <!-- Tertiary institutions -->
        <div class="glass-card reveal">
          <div class="stat-number glow text-success">${schools.universities_public + schools.universities_private}</div>
          <div class="stat-label">Higher Education Institutions</div>
          <div class="text-muted mt-sm" style="font-size: var(--fs-xs);">${schools.universities_public} Public (UA) | ${schools.universities_private} Private (IPTS)</div>
        </div>
      </div>

      <div class="grid grid-2 stagger">
        <!-- Infrastructure breakdown card -->
        <div class="flex-col gap-md">
          <a href="https://www.moe.gov.my" target="_blank" class="info-card reveal" style="text-decoration: none; transition: transform var(--duration-fast) var(--ease-out); cursor: pointer;">
            <div class="info-icon">🏫</div>
            <div class="info-content">
              <h4 style="display: flex; align-items: center; gap: 6px;">Ministry of Education (MOE) <span style="font-size:0.75rem; color:var(--primary);">🔗</span></h4>
              <p>Governs and coordinates primary, secondary, and post-secondary educational curriculums (KSSR, KSSM, SPM, STPM) across all states.</p>
            </div>
          </a>

          <a href="https://www.mohe.gov.my" target="_blank" class="info-card reveal" style="text-decoration: none; transition: transform var(--duration-fast) var(--ease-out); cursor: pointer;">
            <div class="info-icon">🎓</div>
            <div class="info-content">
              <h4 style="display: flex; align-items: center; gap: 6px;">Ministry of Higher Education (MOHE) <span style="font-size:0.75rem; color:var(--primary);">🔗</span></h4>
              <p>Oversees public universities (UA), polytechnics, community colleges, and private colleges/universities (IPTS).</p>
            </div>
          </a>

          <a href="https://www.tvet.gov.my" target="_blank" class="info-card reveal" style="text-decoration: none; transition: transform var(--duration-fast) var(--ease-out); cursor: pointer;">
            <div class="info-icon">💡</div>
            <div class="info-content">
              <h4 style="display: flex; align-items: center; gap: 6px;">TVET Malaysia <span style="font-size:0.75rem; color:var(--primary);">🔗</span></h4>
              <p>High priority national agenda providing vocational skill pathways and industry certifications for secondary graduates.</p>
            </div>
          </a>
        </div>

        <!-- Enrollment chart -->
        <div class="glass-card reveal">
          <h3 class="chart-title" data-i18n="education.chart.title">Enrollment by Educational Level</h3>
          <div class="chart-container" style="height: 300px;">
            <canvas id="chart-education-enrollment"></canvas>
          </div>
        </div>
      </div>
    `;

    // Render chart
    setTimeout(() => {
      KtmyCharts.destroyChart('chart-education-enrollment');

      const labels = enrollment.map(e => e.level);
      const values = enrollment.map(e => e.students / 1000); // in thousands

      chartInstance = KtmyCharts.createBarChart('chart-education-enrollment', {
        labels,
        datasets: [{
          label: 'Students (Thousands)',
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
