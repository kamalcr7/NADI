/* ============================================================
   KTMY — Chart.js Factory with Dark Theme
   ============================================================ */

(function () {
  'use strict';

  /* --- Utility: Hex to RGBA --- */
  function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  let lineShadowPluginRegistered = false;

  /* --- Default Dark Theme Config --- */
  const CHART_COLORS = {
    primary: '#00C9A7',
    primaryLight: 'rgba(0, 201, 167, 0.2)',
    blue: '#4D7CFE',
    blueLight: 'rgba(77, 124, 254, 0.2)',
    gold: '#FFD700',
    goldLight: 'rgba(255, 215, 0, 0.2)',
    crimson: '#DC143C',
    crimsonLight: 'rgba(220, 20, 60, 0.2)',
    purple: '#A855F7',
    purpleLight: 'rgba(168, 85, 247, 0.2)',
    orange: '#FF8C00',
    orangeLight: 'rgba(255, 140, 0, 0.2)',
    success: '#00FF88',
    danger: '#FF4757',
    grid: 'rgba(255, 255, 255, 0.05)',
    gridBorder: 'rgba(255, 255, 255, 0.1)',
    text: '#8892B0',
    textLight: '#5A6380',
  };

  const PALETTE = [
    CHART_COLORS.primary,
    CHART_COLORS.blue,
    CHART_COLORS.gold,
    CHART_COLORS.crimson,
    CHART_COLORS.purple,
    CHART_COLORS.orange,
    '#00E5FF',
    '#FF6B6B',
    '#69DB7C',
    '#FFA94D',
  ];

  const PALETTE_LIGHT = [
    CHART_COLORS.primaryLight,
    CHART_COLORS.blueLight,
    CHART_COLORS.goldLight,
    CHART_COLORS.crimsonLight,
    CHART_COLORS.purpleLight,
    CHART_COLORS.orangeLight,
    'rgba(0, 229, 255, 0.2)',
    'rgba(255, 107, 107, 0.2)',
    'rgba(105, 219, 124, 0.2)',
    'rgba(255, 169, 77, 0.2)',
  ];

  /* --- Set Chart.js Defaults --- */
  function setDefaults() {
    if (!window.Chart) return;

    if (!lineShadowPluginRegistered) {
      const lineShadowPlugin = {
        id: 'lineShadowPlugin',
        beforeDatasetDraw: (chart, args) => {
          try {
            const { ctx } = chart;
            const { meta } = args;
            if (meta && meta.type === 'line') {
              let color = '#00C9A7';
              if (meta.dataset && meta.dataset.options) {
                color = meta.dataset.options.borderColor || color;
              }
              ctx.shadowColor = hexToRgba(color, 0.35);
              ctx.shadowBlur = 10;
              ctx.shadowOffsetY = 4;
            }
          } catch (e) {
            console.error('[KTMY Charts Plugin] beforeDatasetDraw error:', e);
          }
        },
        afterDatasetDraw: (chart, args) => {
          try {
            const { ctx } = chart;
            const { meta } = args;
            if (meta && meta.type === 'line') {
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetY = 0;
            }
          } catch (e) {
            console.error('[KTMY Charts Plugin] afterDatasetDraw error:', e);
          }
        }
      };
      Chart.register(lineShadowPlugin);
      lineShadowPluginRegistered = true;
    }

    Chart.defaults.color = CHART_COLORS.text;
    Chart.defaults.borderColor = CHART_COLORS.grid;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 20;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(10, 14, 39, 0.95)';
    Chart.defaults.plugins.tooltip.titleColor = '#E8ECF4';
    Chart.defaults.plugins.tooltip.bodyColor = '#8892B0';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.enabled = true;
    Chart.defaults.animation.duration = 1000;
    Chart.defaults.animation.easing = 'easeOutQuart';
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;

    // Default tooltip formatting for absolute numbers
    if (Chart.defaults.plugins.tooltip && Chart.defaults.plugins.tooltip.callbacks) {
      Chart.defaults.plugins.tooltip.callbacks.label = function(context) {
        try {
          let label = (context.dataset && context.dataset.label) || '';
          if (label) {
            label += ': ';
          }
          const val = context.raw;
          if (typeof val === 'number') {
            label += val.toLocaleString();
          } else {
            label += val !== undefined && val !== null ? val : '';
          }
          return label;
        } catch (e) {
          console.error('[KTMY Charts Tooltip] Callback error:', e);
          return '';
        }
      };
    }
  }

  /* --- Factory: Line Chart --- */
  function createLineChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;

    const ctx = canvas.getContext('2d');
    const { labels, datasets, title, yLabel, showLegend = true } = config;

    const chartDatasets = datasets.map((ds, i) => {
      const color = ds.color || PALETTE[i % PALETTE.length];
      
      let background = 'transparent';
      if (ds.fill) {
        try {
          const gradientHeight = canvas.offsetHeight || 300;
          const grad = ctx.createLinearGradient(0, 0, 0, gradientHeight);
          grad.addColorStop(0, hexToRgba(color, 0.25));
          grad.addColorStop(1, hexToRgba(color, 0.0));
          background = grad;
        } catch (e) {
          console.warn('[KTMY Charts] Failed to create vertical linear gradient, falling back to light color:', e);
          background = PALETTE_LIGHT[i % PALETTE_LIGHT.length];
        }
      }

      return {
        label: ds.label,
        data: ds.data,
        borderColor: color,
        backgroundColor: background,
        borderWidth: 2.5,
        pointRadius: ds.pointRadius !== undefined ? ds.pointRadius : 3,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: 'transparent',
        tension: 0.4,
        fill: ds.fill || false,
        ...ds.extra
      };
    });

    return new Chart(canvas, {
      type: 'line',
      data: { labels, datasets: chartDatasets },
      options: {
        plugins: {
          legend: { display: showLegend },
          title: title ? { display: true, text: title, font: { size: 14, weight: '600' } } : { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            grid: { color: CHART_COLORS.grid, drawBorder: false },
            ticks: { maxTicksLimit: 8, font: { size: 11 } }
          },
          y: {
            grid: { color: CHART_COLORS.grid, drawBorder: false },
            ticks: {
              font: { size: 11 },
              callback: function(value) {
                return typeof value === 'number' ? value.toLocaleString() : value;
              }
            },
            title: yLabel ? { display: true, text: yLabel, font: { size: 11 } } : undefined
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }

  /* --- Factory: Bar Chart --- */
  function createBarChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;

    const ctx = canvas.getContext('2d');
    const { labels, datasets, title, horizontal = false, showLegend = false, stacked = false } = config;

    const chartDatasets = datasets.map((ds, i) => {
      const baseColor = ds.color || PALETTE[i % PALETTE.length];
      
      let background = baseColor;
      if (!ds.colors) {
        try {
          const width = canvas.offsetWidth || 500;
          const height = canvas.offsetHeight || 300;
          let grad;
          if (horizontal) {
            grad = ctx.createLinearGradient(0, 0, width, 0);
          } else {
            grad = ctx.createLinearGradient(0, height, 0, 0);
          }
          grad.addColorStop(0, baseColor);
          const secondary = ds.colorSecondary || CHART_COLORS.blue;
          grad.addColorStop(1, secondary);
          background = grad;
        } catch (e) {
          console.warn('[KTMY Charts] Failed to create bar linear gradient, falling back to solid color:', e);
          background = baseColor;
        }
      } else {
        try {
          const height = canvas.offsetHeight || 300;
          const width = canvas.offsetWidth || 500;
          background = ds.colors.map(col => {
            let grad;
            if (horizontal) {
              grad = ctx.createLinearGradient(0, 0, width, 0);
            } else {
              grad = ctx.createLinearGradient(0, height, 0, 0);
            }
            grad.addColorStop(0, col);
            grad.addColorStop(1, hexToRgba(col, 0.45));
            return grad;
          });
        } catch (e) {
          console.warn('[KTMY Charts] Failed to create multi-bar gradients, falling back to solid colors:', e);
          background = ds.colors;
        }
      }

      return {
        label: ds.label || '',
        data: ds.data,
        backgroundColor: background,
        borderColor: 'transparent',
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        ...ds.extra
      };
    });

    return new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: chartDatasets },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
           legend: { display: showLegend },
           title: title ? { display: true, text: title, font: { size: 14, weight: '600' } } : { display: false },
           tooltip: { enabled: true }
        },
        scales: {
          x: {
            grid: { color: CHART_COLORS.grid, drawBorder: false },
            ticks: {
              font: { size: 11 },
              callback: function(value) {
                if (horizontal) {
                  return typeof value === 'number' ? value.toLocaleString() : value;
                } else {
                  return this.getLabelForValue(value);
                }
              }
            },
            stacked
          },
          y: {
            grid: { color: horizontal ? CHART_COLORS.grid : CHART_COLORS.grid, drawBorder: false },
            ticks: {
              font: { size: 11 },
              callback: function(value) {
                if (!horizontal) {
                  return typeof value === 'number' ? value.toLocaleString() : value;
                } else {
                  return this.getLabelForValue(value);
                }
              }
            },
            stacked
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }

  /* --- Factory: Doughnut / Pie Chart --- */
  function createDoughnutChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;

    const { labels, data, colors, title, cutout = '65%' } = config;

    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors || PALETTE.slice(0, data.length),
          borderColor: 'rgba(10, 14, 39, 0.8)',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        cutout,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 }
          },
          title: title ? { display: true, text: title, font: { size: 14, weight: '600' } } : { display: false },
          tooltip: { enabled: true }
        }
      }
    });
  }

  /* --- Factory: Area Chart --- */
  function createAreaChart(canvasId, config) {
    return createLineChart(canvasId, {
      ...config,
      datasets: config.datasets.map(ds => ({ ...ds, fill: true }))
    });
  }

  /* --- Factory: Mini Sparkline --- */
  function createSparkline(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data,
          borderColor: color || CHART_COLORS.primary,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          fill: false
        }]
      },
      options: {
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        animation: { duration: 500 },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  /* --- Destroy chart by canvas ID --- */
  function destroyChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
  }

  /* --- Init --- */
  function init() {
    setDefaults();
  }

  /* --- Expose --- */
  window.KtmyCharts = {
    init,
    createLineChart,
    createBarChart,
    createDoughnutChart,
    createAreaChart,
    createSparkline,
    destroyChart,
    COLORS: CHART_COLORS,
    PALETTE,
    PALETTE_LIGHT
  };
})();
