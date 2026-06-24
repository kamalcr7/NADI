/* ============================================================
   KTMY — Safety Alerts Console (DataStore-powered)
   ============================================================ */

(function () {
  'use strict';

  function init() {
    const container = document.getElementById('section-safety-content');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Checking safety alerts...</p></div>`;

    let warnings = null;
    let earthquakes = null;
    let floods = null;

    function tryRender() {
      if (warnings !== null && earthquakes !== null && floods !== null) {
        renderSection(container, warnings, earthquakes, floods);
      }
    }

    KtmyStore.on('weather_warnings', (data, status) => {
      if (status !== 'loading') { warnings = data || []; tryRender(); }
    });
    KtmyStore.on('earthquake', (data, status) => {
      if (status !== 'loading') { earthquakes = data || []; tryRender(); }
    });
    KtmyStore.on('flood_warnings', (data, status) => {
      if (status !== 'loading') { floods = data || []; tryRender(); }
    });
  }

  function parseList(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }

  function renderSection(container, warningsRaw, earthquakesRaw, floodsRaw) {
    const warnings = parseList(warningsRaw);
    const allEarthquakes = parseList(earthquakesRaw);
    const allFloods = parseList(floodsRaw);

    // 1. Filter Flood Alerts to only warning-state stations (DANGER, WARNING, ALERT)
    const activeFloods = allFloods.filter(f => 
      ['ALERT', 'WARNING', 'DANGER'].includes(f.water_level_indicator)
    );
    // Sort active floods: DANGER first, then WARNING, then ALERT
    const floodSeverityOrder = { 'DANGER': 3, 'WARNING': 2, 'ALERT': 1 };
    activeFloods.sort((a, b) => (floodSeverityOrder[b.water_level_indicator] || 0) - (floodSeverityOrder[a.water_level_indicator] || 0));

    // 2. Filter Seismic Events (earthquakes) to the last 30 days relative to the latest record
    const sortedEarthquakes = [...allEarthquakes].sort((a, b) => new Date(b.localdatetime || b.utcdatetime) - new Date(a.localdatetime || a.utcdatetime));
    const latestEarthquakeDate = sortedEarthquakes[0] ? new Date(sortedEarthquakes[0].localdatetime || sortedEarthquakes[0].utcdatetime) : new Date();
    const earthquakeCutoffMs = latestEarthquakeDate.getTime() - 30 * 24 * 60 * 60 * 1000;
    const recentEarthquakes = sortedEarthquakes.filter(e => {
      const d = new Date(e.localdatetime || e.utcdatetime);
      return d.getTime() >= earthquakeCutoffMs;
    });

    const totalAlerts = warnings.length + activeFloods.length + recentEarthquakes.length;
    const alertLevel = totalAlerts === 0 ? 'safe' : totalAlerts < 3 ? 'moderate' : 'high';
    const alertColors = { safe: 'var(--success)', moderate: 'var(--warning)', high: 'var(--danger)' };
    const alertLabels = { safe: 'All Clear', moderate: 'Moderate Alerts', high: 'High Alert' };

    const isBm = KtmyI18n.getLang() === 'bm';

    container.innerHTML = `
      <!-- Status Banner -->
      <div class="glass-card reveal mb-lg" style="border-left: 4px solid ${alertColors[alertLevel]}; background: rgba(${alertLevel === 'safe' ? '0,255,136' : alertLevel === 'moderate' ? '255,184,0' : '255,71,87'},0.05);">
        <div style="display:flex; align-items:center; gap:var(--space-md);">
          <div style="font-size:2.5rem;">${alertLevel === 'safe' ? '✅' : alertLevel === 'moderate' ? '⚠️' : '🚨'}</div>
          <div>
            <h3 style="margin:0; color:${alertColors[alertLevel]};">${alertLabels[alertLevel]}</h3>
            <p style="margin:0; color:var(--text-secondary); font-size:var(--fs-small);">
              ${totalAlerts} active alert${totalAlerts !== 1 ? 's' : ''} · Last checked: ${new Date().toLocaleTimeString('en-MY')}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-3 stagger mb-xl">
        <div class="glass-card reveal" style="border-top: 3px solid var(--warning);">
          <div style="font-size:2rem; margin-bottom:8px;">🌩️</div>
          <h4>Weather Warnings</h4>
          <div class="stat-number" style="color:var(--warning); font-size:2rem;">${warnings.length}</div>
          <p style="color:var(--text-muted); font-size:var(--fs-small);">Active MET warnings</p>
        </div>
        <div class="glass-card reveal" style="border-top: 3px solid var(--danger);">
          <div style="font-size:2rem; margin-bottom:8px;">🌊</div>
          <h4>Flood Alerts</h4>
          <div class="stat-number" style="color:var(--danger); font-size:2rem;">${activeFloods.length}</div>
          <p style="color:var(--text-muted); font-size:var(--fs-small);">Active flood warnings</p>
        </div>
        <div class="glass-card reveal" style="border-top: 3px solid var(--accent-orange);">
          <div style="font-size:2rem; margin-bottom:8px;">🫨</div>
          <h4>Seismic Events</h4>
          <div class="stat-number" style="color:var(--accent-orange); font-size:2rem;">${recentEarthquakes.length}</div>
          <p style="color:var(--text-muted); font-size:var(--fs-small);">Recent earthquakes</p>
        </div>
      </div>

      <!-- Weather Warnings List -->
      ${renderAlertList('🌩️ Weather Warnings', warnings, w => {
        return {
          title: isBm ? (w.heading_bm || w.warning_issue?.title_bm || 'Amaran Cuaca') : (w.heading_en || w.warning_issue?.title_en || 'Weather Warning'),
          body: isBm ? (w.text_bm || 'Cuaca buruk dijangka berlaku.') : (w.text_en || 'Severe weather conditions expected.'),
          meta: 'MET Malaysia',
          severity: 'warning'
        };
      }, isBm ? 'Semua tiada amaran cuaca aktif.' : 'No active weather warnings.')}

      <!-- Flood Warnings List -->
      ${renderAlertList('🌊 Active Flood Alerts', activeFloods, f => {
        const isDanger = f.water_level_indicator === 'DANGER';
        const isWarning = f.water_level_indicator === 'WARNING';
        return {
          title: `${f.station_name || 'Station'}, ${f.district || ''}`,
          body: isBm ? 
            `Aras Air Semasa: ${f.water_level_current || '?'}m (${f.water_level_indicator || 'NORMAL'}) · Kemaskini: ${f.water_level_update_datetime || ''}` :
            `Current Water Level: ${f.water_level_current || '?'}m (${f.water_level_indicator || 'NORMAL'}) · Updated: ${f.water_level_update_datetime || ''}`,
          meta: f.state || '',
          severity: isDanger ? 'danger' : isWarning ? 'orange' : 'warning'
        };
      }, isBm ? 'Semua stesen paras air sungai di tahap normal.' : 'All monitored river basins are at normal levels.')}

      <!-- Earthquake List -->
      ${renderAlertList('🫨 Recent Seismic Activity (30 Days)', recentEarthquakes, e => {
        return {
          title: isBm ? 
            `Magnitud ${e.magdefault || '?'} — ${e.location || 'Lokasi Tidak Diketahui'}` :
            `Magnitude ${e.magdefault || '?'} — ${e.location_original || e.location || 'Unknown Location'}`,
          body: isBm ?
            `Kedalaman: ${e.depth || '?'}km · Masa Tempatan: ${e.localdatetime || ''}` :
            `Depth: ${e.depth || '?'}km · Local Time: ${e.localdatetime || ''}`,
          meta: e.status || '',
          severity: 'orange'
        };
      }, isBm ? 'Tiada aktiviti seismik dikesan dalam tempoh 30 hari yang lalu.' : 'No seismic activity recorded in the past 30 days.')}

      <!-- General Safety Tips -->
      <div class="glass-card reveal mt-xl">
        <h3>🛡️ Emergency Contacts Malaysia</h3>
        <div class="grid grid-3 stagger mt-md">
          ${[
            { icon: '🚒', label: 'Fire & Rescue (Bomba)', num: '994' },
            { icon: '👮', label: 'Police Emergency', num: '999' },
            { icon: '🚑', label: 'Ambulance', num: '999' },
            { icon: '🆘', label: 'Civil Defence (APM)', num: '991' },
            { icon: '🌊', label: 'Flood Ops Centre', num: '03-8064 2400' },
            { icon: '☎️', label: 'General Emergency', num: '112' }
          ].map(c => `
            <div class="glass-card" style="text-align:center; padding:var(--space-md); cursor:pointer;" onclick="window.location='tel:${c.num}'">
              <div style="font-size:1.8rem;">${c.icon}</div>
              <div style="font-size:var(--fs-xs); color:var(--text-secondary); margin:4px 0;">${c.label}</div>
              <div style="font-size:1.5rem; font-weight:700; color:var(--danger);">${c.num}</div>
            </div>`).join('')}
        </div>
      </div>
    `;

    KtmyI18n.applyTranslations();
    KtmyAnimations.initScrollReveals();
  }

  function renderAlertList(title, items, mapFn, fallbackMsg = '') {
    if (!items || items.length === 0) {
      if (fallbackMsg) {
        return `
          <div class="reveal mb-lg">
            <h3 style="margin-bottom:var(--space-md);">${title}</h3>
            <div class="glass-card" style="padding:var(--space-md); text-align:center; border-left:3px solid var(--success); background: rgba(0, 255, 136, 0.02);">
              <span style="font-size:1.1rem; margin-right:6px;">✅</span>
              <span style="color:var(--text-secondary); font-size:var(--fs-small);">${fallbackMsg}</span>
            </div>
          </div>`;
      }
      return '';
    }
    const SEVERITY_COLOR = { warning: 'var(--warning)', danger: 'var(--danger)', orange: 'var(--accent-orange)' };

    const cards = items.slice(0, 10).map(item => {
      const { title: t, body, meta, severity } = mapFn(item);
      return `
        <div class="glass-card reveal" style="border-left:3px solid ${SEVERITY_COLOR[severity] || 'var(--warning)'}; margin-bottom:var(--space-sm);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:var(--space-sm);">
            <strong style="color:var(--text-primary); font-size:var(--fs-small);">${t}</strong>
            ${meta ? `<span style="font-size:var(--fs-xs); color:var(--text-muted); white-space:nowrap;">${meta}</span>` : ''}
          </div>
          <p style="margin:4px 0 0; color:var(--text-secondary); font-size:var(--fs-xs);">${body}</p>
        </div>`;
    }).join('');

    return `
      <div class="reveal mb-lg">
        <h3 style="margin-bottom:var(--space-md);">${title}</h3>
        ${cards}
      </div>`;
  }

  window.KtmySections = window.KtmySections || {};
  window.KtmySections.safety = {
    init,
    translate() { KtmyI18n.applyTranslations(); }
  };
})();
