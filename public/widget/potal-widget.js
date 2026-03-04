/**
 * POTAL Widget — Embeddable Total Landed Cost Calculator
 * Version: 1.0.0
 *
 * Usage:
 * <script src="https://potal.app/widget/potal-widget.js"
 *   data-api-key="pk_live_..."
 *   data-origin="CN"
 *   data-destination="US"
 *   data-theme="light">
 * </script>
 *
 * Or programmatic:
 * PotalWidget.init({ apiKey: 'pk_live_...', origin: 'CN', destination: 'US' });
 * PotalWidget.calculate({ price: 49.99, shippingPrice: 5.00, zipcode: '10001' });
 */

(function () {
  'use strict';

  var API_BASE = 'https://potal.app/api/v1';
  var WIDGET_VERSION = '1.0.0';

  // ─── Configuration ─────────────────────────────────

  var config = {
    apiKey: '',
    origin: 'CN',
    destination: 'US',
    theme: 'light',
    position: 'inline', // 'inline' | 'popup'
    currency: 'USD',
    locale: 'en',
    containerId: 'potal-widget',
  };

  // ─── Auto-init from script tag ─────────────────────

  function autoInit() {
    var scripts = document.querySelectorAll('script[data-api-key]');
    var script = scripts[scripts.length - 1];
    if (!script) return;

    config.apiKey = script.getAttribute('data-api-key') || '';
    config.origin = script.getAttribute('data-origin') || 'CN';
    config.destination = script.getAttribute('data-destination') || 'US';
    config.theme = script.getAttribute('data-theme') || 'light';
    config.containerId = script.getAttribute('data-container') || 'potal-widget';
  }

  // ─── API Call ──────────────────────────────────────

  function calculate(params) {
    if (!config.apiKey) {
      console.error('[POTAL Widget] API key is required.');
      return Promise.reject(new Error('API key required'));
    }

    var body = {
      price: params.price,
      shippingPrice: params.shippingPrice || 0,
      origin: params.origin || config.origin,
      zipcode: params.zipcode || '',
      destinationCountry: params.destination || config.destination,
    };

    return fetch(API_BASE + '/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify(body),
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json.success) {
          throw new Error(json.error ? json.error.message : 'Calculation failed');
        }
        return json.data;
      });
  }

  // ─── Render Widget ─────────────────────────────────

  function render(container, data) {
    var isDark = config.theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#ffffff';
    var text = isDark ? '#e0e0e0' : '#333333';
    var accent = '#2563eb';
    var border = isDark ? '#333' : '#e5e7eb';

    var html = '<div style="' +
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif;' +
      'background:' + bg + ';color:' + text + ';' +
      'border:1px solid ' + border + ';border-radius:12px;' +
      'padding:16px;max-width:320px;font-size:14px;">' +
      '<div style="font-weight:600;font-size:16px;margin-bottom:12px;' +
      'display:flex;align-items:center;gap:6px;">' +
      '<span style="color:' + accent + '">&#x1F4E6;</span> Total Landed Cost</div>';

    if (data && data.breakdown) {
      for (var i = 0; i < data.breakdown.length; i++) {
        var item = data.breakdown[i];
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;' +
          'border-bottom:1px solid ' + border + ';">' +
          '<span>' + item.label + (item.note ? ' <small style="opacity:0.6">(' + item.note + ')</small>' : '') + '</span>' +
          '<span>$' + item.amount.toFixed(2) + '</span></div>';
      }

      html += '<div style="display:flex;justify-content:space-between;padding:8px 0;' +
        'font-weight:700;font-size:16px;margin-top:4px;">' +
        '<span>Total</span>' +
        '<span style="color:' + accent + '">$' + data.totalLandedCost.toFixed(2) + '</span></div>';
    }

    html += '<div style="margin-top:8px;font-size:11px;opacity:0.5;text-align:right;">' +
      'Powered by <a href="https://potal.app" target="_blank" ' +
      'style="color:' + accent + ';text-decoration:none;">POTAL</a></div></div>';

    container.innerHTML = html;
  }

  // ─── Loading State ─────────────────────────────────

  function renderLoading(container) {
    var isDark = config.theme === 'dark';
    container.innerHTML = '<div style="' +
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif;' +
      'background:' + (isDark ? '#1a1a2e' : '#ffffff') + ';' +
      'border:1px solid ' + (isDark ? '#333' : '#e5e7eb') + ';' +
      'border-radius:12px;padding:24px;max-width:320px;text-align:center;' +
      'color:' + (isDark ? '#e0e0e0' : '#333') + ';">' +
      'Calculating landed cost...</div>';
  }

  // ─── Error State ───────────────────────────────────

  function renderError(container, message) {
    container.innerHTML = '<div style="' +
      'font-family:-apple-system,sans-serif;background:#fef2f2;' +
      'border:1px solid #fecaca;border-radius:12px;padding:16px;' +
      'max-width:320px;color:#991b1b;font-size:14px;">' +
      'Unable to calculate: ' + message + '</div>';
  }

  // ─── Public API ────────────────────────────────────

  window.PotalWidget = {
    version: WIDGET_VERSION,

    init: function (opts) {
      if (opts.apiKey) config.apiKey = opts.apiKey;
      if (opts.origin) config.origin = opts.origin;
      if (opts.destination) config.destination = opts.destination;
      if (opts.theme) config.theme = opts.theme;
      if (opts.containerId) config.containerId = opts.containerId;
    },

    calculate: function (params) {
      var container = document.getElementById(config.containerId);
      if (container) renderLoading(container);

      return calculate(params)
        .then(function (data) {
          if (container) render(container, data);
          return data;
        })
        .catch(function (err) {
          if (container) renderError(container, err.message);
          throw err;
        });
    },

    // Headless mode — just get data, no rendering
    calculateRaw: calculate,

    getConfig: function () {
      return Object.assign({}, config);
    },
  };

  // Auto-init on load
  autoInit();
})();
