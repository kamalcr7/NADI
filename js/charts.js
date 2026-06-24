/* ============================================================
   KTMY — Chart.js Factory with Dark Theme
   ============================================================ */

(function () {
  'use strict';

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
    Chart.defaults.animation.duration = 1000;
    Chart.defaults.animation.easing = 'easeOutQuart';
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;

    // Default tooltip formatting for absolute numbers
    Chart.defaults.plugins.tooltip.callbacks = {
      label: function(context) {
        let label = context.dataset.label || '';
        if (label) {
          label += ': ';
        }
        const val = context.raw;
        if (typeof val === 'number') {
          label += val.toLocaleString();
        } else {
          label += val;
        }
        return label;
      }
    };
  }

  /* --- Factory: Line Chart --- */
  function createLineChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;

    const { labels, datasets, title, yLabel, showLegend = true } = config;

    const chartDatasets = datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || PALETTE[i % PALETTE.length],
      backgroundColor: ds.fill ? (ds.bgColor || PALETTE_LIGHT[i % PALETTE_LIGHT.length]) : 'transparent',
      borderWidth: 2,
      pointRadius: ds.pointRadius !== undefined ? ds.pointRadius : 3,
      pointHoverRadius: 6,
      pointBackgroundColor: ds.color || PALETTE[i % PALETTE.length],
      pointBorderColor: 'transparent',
      tension: 0.4,
      fill: ds.fill || false,
      ...ds.extra
    }));

    return new Chart(canvas, {
      type: 'line',
      data: { labels, datasets: chartDatasets },
      options: {
        plugins: {
          legend: { display: showLegend },
          title: title ? { display: true, text: title, font: { size: 14, weight: '600' } } : { display: false }
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

    const { labels, datasets, title, horizontal = false, showLegend = false, stacked = false } = config;

    const chartDatasets = datasets.map((ds, i) => ({
      label: ds.label || '',
      data: ds.data,
      backgroundColor: ds.colors || ds.color || PALETTE[i % PALETTE.length],
      borderColor: 'transparent',
      borderRadius: 6,
      borderSkipped: false,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
      ...ds.extra
    }));

    return new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: chartDatasets },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          legend: { display: showLegend },
          title: title ? { display: true, text: title, font: { size: 14, weight: '600' } } : { display: false }
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
        }
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
          title: title ? { display: true, text: title, font: { size: 14, weight: '600' } } : { display: false }
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
    if (!canvas) return;
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
