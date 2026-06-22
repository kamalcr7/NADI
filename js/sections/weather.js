/* ============================================================
   NADI — Advanced Weather Station Module
   Uses Open-Meteo API for local city forecasts &
   Windy.com interactive satellite/radar/wind map.
   ============================================================ */

(function () {
  'use strict';

  let initialized = false;
  let selectedCityName = 'Kuala Lumpur';
  let cityData = null; // current city open-meteo data

  /* --- Weather Code Helpers --- */
  function wmoToDesc(code) {
    return (NadiStore.WMO_CODES && NadiStore.WMO_CODES[code]) || 'Unknown';
  }

  // WMO Weather Emoji mapping helper
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

      <!-- Live Interactive Weather Map -->
      <div class="glass-card reveal mb-lg" style="position:relative; overflow:hidden; padding: 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding: var(--space-md) var(--space-xl); border-bottom: 1px solid var(--glass-border); flex-wrap: wrap; gap: var(--space-sm);">
          <h3 style="margin:0; font-size: var(--fs-h4); display: flex; align-items: center; gap: 8px;">📡 Live Interactive Weather Map</h3>
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <a href="https://zoom.earth/#view=${city.lat},${city.lon},8z" target="_blank" class="btn btn-outline" style="font-size: 0.72rem; padding: 4px 10px; display: flex; align-items: center; gap: 4px; text-decoration: none;">
              🌍 Open in Zoom Earth
            </a>
            <span class="nav-badge" style="background: var(--primary); color: var(--text-inverse); font-size: 9px; padding: 2px 5px;">LIVE</span>
          </div>
        </div>
        
        <!-- Map Layer Selector -->
        <div class="map-layer-selector" style="display: flex; gap: 8px; padding: 8px 16px; background: rgba(10, 14, 39, 0.4); border-bottom: 1px solid var(--glass-border); overflow-x: auto; scrollbar-width: none;">
          <button class="map-layer-btn active" data-overlay="wind" style="background: rgba(0, 201, 167, 0.12); border: 1px solid var(--primary); color: var(--primary); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.2s; border-style: solid;">
            💨 Wind Flow
          </button>
          <button class="map-layer-btn" data-overlay="temp" style="background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.2s; border-style: solid;">
            🌡️ Temperature
          </button>
          <button class="map-layer-btn" data-overlay="rain" style="background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.2s; border-style: solid;">
            🌧️ Rain / Precip
          </button>
          <button class="map-layer-btn" data-overlay="radar" style="background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.2s; border-style: solid;">
            📡 Weather Radar
          </button>
          <button class="map-layer-btn" data-overlay="satellite" style="background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.2s; border-style: solid;">
            🛰️ Satellite
          </button>
          <button class="map-layer-btn" data-overlay="clouds" style="background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.2s; border-style: solid;">
            ☁️ Cloud Cover
          </button>
        </div>

        <div style="position:relative; width: 100%; height: 480px; overflow: hidden; background: #0b0e27;">
          <iframe 
            id="windy-weather-map"
            src="https://embed.windy.com/embed2.html?lat=${city.lat}&lon=${city.lon}&zoom=7&level=surface&overlay=wind&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1" 
            style="width: 100%; height: 100%; border: none;" 
            allowfullscreen>
          </iframe>
        </div>
      </div>

      <!-- 7-Day Forecast -->
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

    // Render charts & Map bindings
    setTimeout(() => {
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

      // Bind Map layer buttons
      const mapButtons = display.querySelectorAll('.map-layer-btn');
      const iframe = display.querySelector('#windy-weather-map');
      mapButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          mapButtons.forEach(b => {
            b.classList.remove('active');
            b.style.background = 'var(--glass-bg)';
            b.style.borderColor = 'var(--glass-border)';
            b.style.color = 'var(--text-secondary)';
            b.style.fontWeight = '500';
          });
          btn.classList.add('active');
          btn.style.background = 'rgba(0, 201, 167, 0.12)';
          btn.style.borderColor = 'var(--primary)';
          btn.style.color = 'var(--primary)';
          btn.style.fontWeight = '600';
          
          const overlay = btn.getAttribute('data-overlay');
          iframe.src = `https://embed.windy.com/embed2.html?lat=${city.lat}&lon=${city.lon}&zoom=7&level=surface&overlay=${overlay}&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;
        });
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
    destroy() {}
  };
})();
