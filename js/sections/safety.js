/* ============================================================
   NADI — Safety Alerts Console (DataStore-powered)
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

    NadiStore.on('weather_warnings', (data, status) => {
      if (status !== 'loading') { warnings = data || []; tryRender(); }
    });
    NadiStore.on('earthquake', (data, status) => {
      if (status !== 'loading') { earthquakes = data || []; tryRender(); }
    });
    NadiStore.on('flood_warnings', (data, status) => {
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
    const earthquakes = parseList(earthquakesRaw);
    const floods = parseList(floodsRaw);

    const totalAlerts = warnings.length + earthquakes.length + floods.length;
    const alertLevel = totalAlerts === 0 ? 'safe' : totalAlerts < 3 ? 'moderate' : 'high';
    const alertColors = { safe: 'var(--success)', moderate: 'var(--warning)', high: 'var(--danger)' };
    const alertLabels = { safe: 'All Clear', moderate: 'Moderate Alerts', high: 'High Alert' };

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
          <div class="stat-number" style="color:var(--danger); font-size:2rem;">${floods.length}</div>
          <p style="color:var(--text-muted); font-size:var(--fs-small);">Active flood warnings</p>
        </div>
        <div class="glass-card reveal" style="border-top: 3px solid var(--accent-orange);">
          <div style="font-size:2rem; margin-bottom:8px;">🫨</div>
          <h4>Seismic Events</h4>
          <div class="stat-number" style="color:var(--accent-orange); font-size:2rem;">${earthquakes.length}</div>
          <p style="color:var(--text-muted); font-size:var(--fs-small);">Recent earthquakes</p>
        </div>
      </div>

      <!-- Weather Warnings List -->
      ${renderAlertList('🌩️ Weather Warnings', warnings, w => ({
        title: w.title || w.warning_type || 'Weather Warning',
        body: w.text || w.description || w.detail || 'Severe weather conditions expected.',
        meta: w.area || w.location || w.state || '',
        severity: 'warning'
      }))}

      <!-- Flood Warnings List -->
      ${renderAlertList('🌊 Flood Alerts', floods, f => ({
        title: f.district || f.location || 'Flood Warning',
        body: f.level ? `Flood Level: ${f.level}` : (f.detail || 'Flooding reported in this area.'),
        meta: f.state || '',
        severity: 'danger'
      }))}

      <!-- Earthquake List -->
      ${renderAlertList('🫨 Seismic Activity', earthquakes, e => ({
        title: `Magnitude ${e.magnitude || e.mag || '?'} — ${e.location || e.place || 'Unknown Location'}`,
        body: `Depth: ${e.depth || '?'}km · ${e.date || e.time || ''}`,
        meta: e.felt ? `Felt in: ${e.felt}` : '',
        severity: 'orange'
      }))}

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

    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  function renderAlertList(title, items, mapFn) {
    if (!items || items.length === 0) return '';
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

  window.NadiSections = window.NadiSections || {};
  window.NadiSections.safety = {
    init,
    translate() { NadiI18n.applyTranslations(); }
  };
})();
