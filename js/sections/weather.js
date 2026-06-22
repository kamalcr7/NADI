/* ============================================================
   NADI — Advanced Weather Station Module
   Uses Open-Meteo API (free, no key) for real wind/rain/temp
   data with animated wind field visualization.
   ============================================================ */

(function () {
  'use strict';

  let initialized = false;
  let selectedCityName = 'Kuala Lumpur';
  let windCanvas = null;
  let windCtx = null;
  let animFrame = null;
  let particles = [];
  let cityData = null; // current city open-meteo data

  /* --- Wind Particle System --- */
  const PARTICLE_COUNT = 200;

  function initWindParticles(w, h) {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        age: Math.floor(Math.random() * 80),
        maxAge: 60 + Math.floor(Math.random() * 60),
        speed: 0
      });
    }
  }

  function animateWind(windSpeed, windDirDeg) {
    if (!windCtx || !windCanvas) return;
    const w = windCanvas.width;
    const h = windCanvas.height;

    // Convert wind direction to radians (meteorological: 0=from N, 90=from E)
    const radians = ((windDirDeg + 180) % 360) * Math.PI / 180;
    const vx = Math.sin(radians) * (windSpeed / 40);
    const vy = -Math.cos(radians) * (windSpeed / 40);

    windCtx.clearRect(0, 0, w, h);

    particles.forEach(p => {
      p.age++;
      if (p.age > p.maxAge) {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
        p.age = 0;
        p.maxAge = 60 + Math.floor(Math.random() * 60);
      }

      const prevX = p.x;
      const prevY = p.y;

      // Add slight turbulence
      const turbX = (Math.random() - 0.5) * 0.3;
      const turbY = (Math.random() - 0.5) * 0.3;
      p.x += vx * 2.5 + turbX;
      p.y += vy * 2.5 + turbY;

      // Wrap around
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      // Fade based on age
      const alpha = Math.sin((p.age / p.maxAge) * Math.PI) * 0.7;
      const speedNorm = windSpeed / 60; // normalize 0-1

      // Color by wind speed (blue=calm, cyan=moderate, yellow=strong, red=gale)
      let r, g, b;
      if (speedNorm < 0.3) { r = 77; g = 200; b = 255; }
      else if (speedNorm < 0.6) { r = 0; g = 201; b = 167; }
      else if (speedNorm < 0.8) { r = 255; g = 215; b = 0; }
      else { r = 255; g = 71; b = 87; }

      windCtx.beginPath();
      windCtx.moveTo(prevX, prevY);
      windCtx.lineTo(p.x, p.y);
      windCtx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      windCtx.lineWidth = 1.2 + speedNorm * 1.5;
      windCtx.stroke();
    });

    animFrame = requestAnimationFrame(() => animateWind(windSpeed, windDirDeg));
  }

  function stopWind() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  }

  /* --- Weather Code Helpers --- */
  function wmoToDesc(code) {
    return (NadiStore.WMO_CODES && NadiStore.WMO_CODES[code]) || 'Unknown';
  }

  function wmoToEmoji(code) {
    return (NadiStore.WMO_EMOJI && NadiStore.WMO_EMOJI[code]) || '⛅';
  }

  function windDirLabel(deg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  function uvIndex(hour) {
    // Estimate UV from hour (peak at 12-14)
    const h = hour % 24;
    if (h < 6 || h > 19) return 0;
    return Math.round(Math.max(0, 10 * Math.sin((h - 6) * Math.PI / 13)));
  }

  /* --- Section Render --- */
  async function init() {
    const container = document.getElementById('section-weather-content');
    if (!container) return;
    if (initialized) { updateCityDisplay(); return; }
    initialized = true;

    renderShell(container);

    // Subscribe to Open-Meteo data
    NadiStore.on('openmeteo_all', (data, status) => {
      if (status === 'loading') {
        showStatus('loading');
        return;
      }
      if (status === 'error' || !data) {
        showStatus('error');
        return;
      }
      // Data loaded — select default city and render
      const cityEntry = data.find(r => r.city.name === selectedCityName) || data[0];
      if (cityEntry) {
        cityData = data;
        renderWeatherDisplay(data);
      }
    });

    // If already cached, data callback fires immediately; also trigger fetch
    NadiStore.fetchWeather();
  }

  function showStatus(type) {
    const display = document.getElementById('weather-live-display');
    if (!display) return;
    if (type === 'loading') {
      display.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Fetching real-time weather data from Open-Meteo...</p>
        </div>`;
    } else {
      display.innerHTML = `
        <div class="error-state">
          <div class="error-icon">🌡️</div>
          <p>Could not load weather data. Please check your connection.</p>
          <button class="btn btn-outline" onclick="NadiSections.weather.init()">Retry</button>
        </div>`;
    }
  }

  function renderShell(container) {
    const cities = NadiStore.getCities();
    const cityOptions = cities.map(c =>
      `<option value="${c.name}" ${c.name === selectedCityName ? 'selected' : ''}>${c.name} (${c.state})</option>`
    ).join('');

    container.innerHTML = `
      <!-- City Selector Bar -->
      <div class="weather-controls reveal">
        <div class="glass-card" style="padding: var(--space-md); display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: center;">
          <label style="color: var(--text-secondary); font-size: var(--fs-small); font-weight: var(--fw-medium);">📍 Location</label>
          <select id="weather-city-select" class="city-select">
            ${cityOptions}
          </select>
          <div id="weather-last-updated" style="margin-left: auto; font-size: var(--fs-xs); color: var(--text-muted);"></div>
        </div>
      </div>

      <!-- Live Display Area (populated by data) -->
      <div id="weather-live-display" class="reveal">
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Connecting to weather satellites...</p>
        </div>
      </div>
    `;

    document.getElementById('weather-city-select')?.addEventListener('change', e => {
      selectedCityName = e.target.value;
      updateCityDisplay();
    });
  }

  function renderWeatherDisplay(allData) {
    const display = document.getElementById('weather-live-display');
    if (!display) return;

    const entry = allData.find(r => r.city.name === selectedCityName) || allData[0];
    if (!entry) return;

    const { city, data } = entry;
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const windSpeed = current.wind_speed_10m;
    const windDir = current.wind_direction_10m;
    const code = current.weather_code;
    const emoji = wmoToEmoji(code);
    const desc = wmoToDesc(code);

    // Build 7-day forecast cards
    const now = new Date();
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const forecastCards = (daily.time || []).map((dateStr, i) => {
      const d = new Date(dateStr);
      const name = i === 0 ? 'Today' : dayNames[d.getDay()];
      const hi = daily.temperature_2m_max[i];
      const lo = daily.temperature_2m_min[i];
      const dayCode = daily.weather_code[i];
      const rain = daily.precipitation_probability_max[i];
      const wMax = daily.wind_speed_10m_max[i];
      return `
        <div class="forecast-day-card reveal">
          <div class="forecast-day-name">${name}</div>
          <div class="forecast-emoji">${wmoToEmoji(dayCode)}</div>
          <div class="forecast-desc">${wmoToDesc(dayCode)}</div>
          <div class="forecast-temps">
            <span class="forecast-hi">${Math.round(hi)}°</span>
            <span class="forecast-lo">${Math.round(lo)}°</span>
          </div>
          <div class="forecast-meta">
            <span title="Rain probability">🌧️ ${rain}%</span>
            <span title="Wind">💨 ${Math.round(wMax)}</span>
          </div>
        </div>`;
    }).join('');

    // Hourly chart data (next 24h)
    const hourlyLabels = (hourly.time || []).slice(0, 24).map(t => {
      const d = new Date(t);
      return d.getHours() + ':00';
    });
    const hourlyTemps = (hourly.temperature_2m || []).slice(0, 24);
    const hourlyHumidity = (hourly.relative_humidity_2m || []).slice(0, 24);
    const hourlyWinds = (hourly.wind_speed_10m || []).slice(0, 24);
    const hourlyRain = (hourly.precipitation_probability || []).slice(0, 24);

    // Current UV estimate
    const currentHour = now.getHours();
    const uvVal = uvIndex(currentHour);

    // Determine heat index / feel
    const heatIndex = Math.round(temp + (humidity - 40) * 0.1);

    display.innerHTML = `
      <!-- Current Conditions Hero -->
      <div class="weather-current-hero glass-card reveal mb-lg">
        <div class="weather-main-info">
          <div class="weather-emoji-large">${emoji}</div>
          <div class="weather-temp-block">
            <div class="weather-temp-main">${Math.round(temp)}<span class="weather-unit">°C</span></div>
            <div class="weather-desc">${desc}</div>
            <div class="weather-city-name">📍 ${city.name}, ${city.state}</div>
            <div class="weather-feels">Feels like ${heatIndex}°C</div>
          </div>
        </div>

        <!-- Atmospheric Gauges Row -->
        <div class="weather-gauges-row">
          <div class="weather-gauge-item">
            <div class="gauge-icon">💧</div>
            <div class="gauge-val">${humidity}%</div>
            <div class="gauge-label">Humidity</div>
            <div class="gauge-bar"><div class="gauge-fill" style="width:${humidity}%; background: var(--accent-blue);"></div></div>
          </div>
          <div class="weather-gauge-item">
            <div class="gauge-icon">💨</div>
            <div class="gauge-val">${Math.round(windSpeed)} <small>km/h</small></div>
            <div class="gauge-label">Wind ${windDirLabel(windDir)}</div>
            <div class="gauge-bar"><div class="gauge-fill" style="width:${Math.min(windSpeed, 100)}%; background: var(--primary);"></div></div>
          </div>
          <div class="weather-gauge-item">
            <div class="gauge-icon">☀️</div>
            <div class="gauge-val">${uvVal}</div>
            <div class="gauge-label">UV Index</div>
            <div class="gauge-bar"><div class="gauge-fill" style="width:${uvVal * 9}%; background: ${uvVal > 7 ? 'var(--danger)' : uvVal > 4 ? 'var(--warning)' : 'var(--success)'};"></div></div>
          </div>
          <div class="weather-gauge-item">
            <div class="gauge-icon">🌧️</div>
            <div class="gauge-val">${hourlyRain[currentHour] || 0}%</div>
            <div class="gauge-label">Rain Chance</div>
            <div class="gauge-bar"><div class="gauge-fill" style="width:${hourlyRain[currentHour] || 0}%; background: var(--accent-purple);"></div></div>
          </div>
        </div>
      </div>

      <!-- Wind Field Visualization -->
      <div class="glass-card reveal mb-lg" style="position:relative; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-md);">
          <h3 style="margin:0; font-size: var(--fs-h4);">🌬️ Live Wind Field</h3>
          <div style="font-size: var(--fs-xs); color: var(--text-muted);">
            Wind: <strong style="color:var(--primary)">${Math.round(windSpeed)} km/h ${windDirLabel(windDir)}</strong>
          </div>
        </div>
        <div style="position:relative; border-radius: var(--radius-md); overflow:hidden;">
          <canvas id="wind-field-canvas" style="width:100%; height:220px; display:block; background: radial-gradient(ellipse at center, rgba(0,201,167,0.05) 0%, rgba(10,14,39,0.9) 100%);"></canvas>
          <div style="position:absolute; bottom:8px; right:8px; font-size:var(--fs-xs); color: var(--text-muted); background: rgba(10,14,39,0.7); padding:4px 8px; border-radius:4px;">
            Particle density indicates wind strength
          </div>
        </div>
      </div>

      <!-- 7-Day Forecast Carousel -->
      <div class="reveal mb-lg">
        <h3 style="margin-bottom: var(--space-md);">📅 7-Day Forecast</h3>
        <div class="forecast-days-container">
          ${forecastCards}
        </div>
      </div>

      <!-- 24-Hour Charts -->
      <div class="grid grid-2 reveal mb-lg" style="gap: var(--space-md);">
        <div class="glass-card">
          <h4 class="chart-title">🌡️ Temperature (24h)</h4>
          <div class="chart-container" style="height:220px;"><canvas id="chart-hourly-temp"></canvas></div>
        </div>
        <div class="glass-card">
          <h4 class="chart-title">🌧️ Rain Probability (24h)</h4>
          <div class="chart-container" style="height:220px;"><canvas id="chart-hourly-rain"></canvas></div>
        </div>
      </div>
      <div class="glass-card reveal mb-lg">
        <h4 class="chart-title">💨 Wind Speed (24h)</h4>
        <div class="chart-container" style="height:200px;"><canvas id="chart-hourly-wind"></canvas></div>
      </div>

      <!-- Malaysia-Wide Status Grid -->
      <div class="reveal">
        <h3 style="margin-bottom: var(--space-md);">🗺️ Malaysia Weather Overview</h3>
        <div id="malaysia-city-grid" class="city-weather-grid">
          ${buildCityGrid(allData)}
        </div>
      </div>
    `;

    // Start wind field animation
    requestAnimationFrame(() => {
      stopWind();
      windCanvas = document.getElementById('wind-field-canvas');
      if (windCanvas) {
        const rect = windCanvas.getBoundingClientRect();
        windCanvas.width = rect.width || 700;
        windCanvas.height = 220;
        windCtx = windCanvas.getContext('2d');
        initWindParticles(windCanvas.width, windCanvas.height);
        animateWind(windSpeed, windDir);
      }

      // Draw hourly charts
      NadiCharts.destroyChart('chart-hourly-temp');
      NadiCharts.destroyChart('chart-hourly-rain');
      NadiCharts.destroyChart('chart-hourly-wind');

      NadiCharts.createLineChart('chart-hourly-temp', {
        labels: hourlyLabels,
        datasets: [{
          label: 'Temperature (°C)',
          data: hourlyTemps,
          color: NadiCharts.COLORS.gold
        }],
        yLabel: '°C'
      });

      NadiCharts.createBarChart('chart-hourly-rain', {
        labels: hourlyLabels,
        datasets: [{
          label: 'Rain Probability (%)',
          data: hourlyRain,
          color: NadiCharts.COLORS.purple
        }],
        yLabel: '%'
      });

      NadiCharts.createLineChart('chart-hourly-wind', {
        labels: hourlyLabels,
        datasets: [{
          label: 'Wind Speed (km/h)',
          data: hourlyWinds,
          color: NadiCharts.COLORS.primary
        }],
        yLabel: 'km/h'
      });
    });

    // Update last-updated timestamp
    const lastUpdated = document.getElementById('weather-last-updated');
    if (lastUpdated) {
      lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString('en-MY')}`;
    }

    NadiI18n.applyTranslations();
    NadiAnimations.initScrollReveals();
  }

  function buildCityGrid(allData) {
    return allData.map(({ city, data }) => {
      if (!data || !data.current) return '';
      const t = Math.round(data.current.temperature_2m);
      const h = data.current.relative_humidity_2m;
      const w = Math.round(data.current.wind_speed_10m);
      const c = data.current.weather_code;
      const isActive = city.name === selectedCityName;
      return `
        <div class="city-weather-tile ${isActive ? 'active' : ''}" 
             onclick="NadiSections.weather.selectCity('${city.name}')"
             style="cursor:pointer;">
          <div class="city-emoji">${wmoToEmoji(c)}</div>
          <div class="city-name">${city.name}</div>
          <div class="city-state">${city.state}</div>
          <div class="city-temp">${t}°C</div>
          <div class="city-meta">💧${h}% 💨${w}km/h</div>
        </div>`;
    }).join('');
  }

  function updateCityDisplay() {
    const all = NadiStore.get('openmeteo_all');
    if (!all) return;
    renderWeatherDisplay(all);

    // Also update city select dropdown
    const sel = document.getElementById('weather-city-select');
    if (sel) sel.value = selectedCityName;
  }

  /* --- Public API --- */
  window.NadiSections = window.NadiSections || {};
  window.NadiSections.weather = {
    init,
    translate() {
      NadiI18n.applyTranslations();
    },
    selectCity(name) {
      selectedCityName = name;
      updateCityDisplay();
    },
    destroy() {
      stopWind();
    }
  };
})();
