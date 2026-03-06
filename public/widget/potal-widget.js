/**
 * POTAL Widget v2 — Embeddable Total Landed Cost Calculator
 *
 * Sellers embed this script on their store. Buyers see real import costs.
 * Supports 240 countries, sub-national tax (US/CA/BR), HS Code classification.
 *
 * Usage:
 *   <div id="potal-widget"></div>
 *   <script src="https://yourdomain.com/widget/potal-widget.js"
 *     data-api-key="pk_live_..."
 *     data-origin="CN"
 *     data-product-name="Cotton T-Shirt"
 *     data-price="49.99"
 *     data-shipping="5.00"
 *     data-theme="light">
 *   </script>
 *
 * Programmatic:
 *   PotalWidget.init({ apiKey: 'pk_live_...' });
 *   PotalWidget.show('#container', { productName: 'Shirt', price: 49.99, origin: 'CN' });
 */
(function () {
  'use strict';

  var VERSION = '2.0.0';

  // ─── Detect API base from script src ────────────────
  var scriptEl = document.currentScript || (function () {
    var scripts = document.querySelectorAll('script[data-api-key]');
    return scripts[scripts.length - 1];
  })();

  var API_BASE = (function () {
    if (scriptEl && scriptEl.src) {
      try {
        var url = new URL(scriptEl.src);
        return url.origin + '/api/v1';
      } catch (e) { /* fall through */ }
    }
    return '/api/v1';
  })();

  // ─── Default Config ─────────────────────────────────
  var config = {
    apiKey: '',
    origin: 'CN',
    destination: '',
    theme: 'light',
    containerId: 'potal-widget',
    productName: '',
    price: 0,
    shippingPrice: 0,
    showPoweredBy: true,
    locale: 'en',
    onCalculate: null,
    onError: null,
    // Custom theme overrides (from widget_configs or PotalWidget.init)
    primaryColor: '',
    borderRadius: '',
    fontFamily: '',
  };

  // ─── Country Data (embedded for instant load) ───────
  var COUNTRIES = [
    { c: 'US', n: 'United States', f: '🇺🇸', r: 'Americas' },
    { c: 'CA', n: 'Canada', f: '🇨🇦', r: 'Americas' },
    { c: 'GB', n: 'United Kingdom', f: '🇬🇧', r: 'Europe' },
    { c: 'DE', n: 'Germany', f: '🇩🇪', r: 'Europe' },
    { c: 'FR', n: 'France', f: '🇫🇷', r: 'Europe' },
    { c: 'JP', n: 'Japan', f: '🇯🇵', r: 'Asia' },
    { c: 'KR', n: 'South Korea', f: '🇰🇷', r: 'Asia' },
    { c: 'AU', n: 'Australia', f: '🇦🇺', r: 'Oceania' },
    { c: 'IT', n: 'Italy', f: '🇮🇹', r: 'Europe' },
    { c: 'ES', n: 'Spain', f: '🇪🇸', r: 'Europe' },
    { c: 'NL', n: 'Netherlands', f: '🇳🇱', r: 'Europe' },
    { c: 'BE', n: 'Belgium', f: '🇧🇪', r: 'Europe' },
    { c: 'AT', n: 'Austria', f: '🇦🇹', r: 'Europe' },
    { c: 'SE', n: 'Sweden', f: '🇸🇪', r: 'Europe' },
    { c: 'DK', n: 'Denmark', f: '🇩🇰', r: 'Europe' },
    { c: 'FI', n: 'Finland', f: '🇫🇮', r: 'Europe' },
    { c: 'IE', n: 'Ireland', f: '🇮🇪', r: 'Europe' },
    { c: 'PT', n: 'Portugal', f: '🇵🇹', r: 'Europe' },
    { c: 'GR', n: 'Greece', f: '🇬🇷', r: 'Europe' },
    { c: 'PL', n: 'Poland', f: '🇵🇱', r: 'Europe' },
    { c: 'CZ', n: 'Czech Republic', f: '🇨🇿', r: 'Europe' },
    { c: 'HU', n: 'Hungary', f: '🇭🇺', r: 'Europe' },
    { c: 'RO', n: 'Romania', f: '🇷🇴', r: 'Europe' },
    { c: 'NO', n: 'Norway', f: '🇳🇴', r: 'Europe' },
    { c: 'CH', n: 'Switzerland', f: '🇨🇭', r: 'Europe' },
    { c: 'NZ', n: 'New Zealand', f: '🇳🇿', r: 'Oceania' },
    { c: 'SG', n: 'Singapore', f: '🇸🇬', r: 'Asia' },
    { c: 'MY', n: 'Malaysia', f: '🇲🇾', r: 'Asia' },
    { c: 'TH', n: 'Thailand', f: '🇹🇭', r: 'Asia' },
    { c: 'VN', n: 'Vietnam', f: '🇻🇳', r: 'Asia' },
    { c: 'ID', n: 'Indonesia', f: '🇮🇩', r: 'Asia' },
    { c: 'PH', n: 'Philippines', f: '🇵🇭', r: 'Asia' },
    { c: 'TW', n: 'Taiwan', f: '🇹🇼', r: 'Asia' },
    { c: 'HK', n: 'Hong Kong', f: '🇭🇰', r: 'Asia' },
    { c: 'IN', n: 'India', f: '🇮🇳', r: 'Asia' },
    { c: 'CN', n: 'China', f: '🇨🇳', r: 'Asia' },
    { c: 'MX', n: 'Mexico', f: '🇲🇽', r: 'Americas' },
    { c: 'BR', n: 'Brazil', f: '🇧🇷', r: 'Americas' },
    { c: 'AR', n: 'Argentina', f: '🇦🇷', r: 'Americas' },
    { c: 'CL', n: 'Chile', f: '🇨🇱', r: 'Americas' },
    { c: 'CO', n: 'Colombia', f: '🇨🇴', r: 'Americas' },
    { c: 'PE', n: 'Peru', f: '🇵🇪', r: 'Americas' },
    { c: 'AE', n: 'UAE', f: '🇦🇪', r: 'Middle East' },
    { c: 'SA', n: 'Saudi Arabia', f: '🇸🇦', r: 'Middle East' },
    { c: 'IL', n: 'Israel', f: '🇮🇱', r: 'Middle East' },
    { c: 'TR', n: 'Turkey', f: '🇹🇷', r: 'Middle East' },
    { c: 'EG', n: 'Egypt', f: '🇪🇬', r: 'Africa' },
    { c: 'ZA', n: 'South Africa', f: '🇿🇦', r: 'Africa' },
    { c: 'NG', n: 'Nigeria', f: '🇳🇬', r: 'Africa' },
    { c: 'KE', n: 'Kenya', f: '🇰🇪', r: 'Africa' },
    { c: 'RU', n: 'Russia', f: '🇷🇺', r: 'Europe' },
    { c: 'UA', n: 'Ukraine', f: '🇺🇦', r: 'Europe' },
    { c: 'BG', n: 'Bulgaria', f: '🇧🇬', r: 'Europe' },
    { c: 'HR', n: 'Croatia', f: '🇭🇷', r: 'Europe' },
    { c: 'SK', n: 'Slovakia', f: '🇸🇰', r: 'Europe' },
    { c: 'SI', n: 'Slovenia', f: '🇸🇮', r: 'Europe' },
    { c: 'LT', n: 'Lithuania', f: '🇱🇹', r: 'Europe' },
    { c: 'LV', n: 'Latvia', f: '🇱🇻', r: 'Europe' },
    { c: 'EE', n: 'Estonia', f: '🇪🇪', r: 'Europe' },
    { c: 'QA', n: 'Qatar', f: '🇶🇦', r: 'Middle East' },
    { c: 'KW', n: 'Kuwait', f: '🇰🇼', r: 'Middle East' },
  ];

  // Countries where zipcode matters for tax
  var ZIP_COUNTRIES = { US: 'ZIP Code', CA: 'Postal Code', BR: 'CEP' };

  // ─── Region Resolver (zipcode → readable location) ──
  var US_STATES = {
    AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
    CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'Washington DC',FL:'Florida',
    GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',
    IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',
    MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
    MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
    NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
    OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',PR:'Puerto Rico',
    RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',
    UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',
    WI:'Wisconsin',WY:'Wyoming'
  };
  var CA_PROVS = {
    AB:'Alberta',BC:'British Columbia',MB:'Manitoba',NB:'New Brunswick',
    NL:'Newfoundland',NS:'Nova Scotia',NT:'Northwest Territories',NU:'Nunavut',
    ON:'Ontario',PE:'Prince Edward Island',QC:'Quebec',SK:'Saskatchewan',YT:'Yukon'
  };
  var BR_STATES = {
    AC:'Acre',AL:'Alagoas',AM:'Amazonas',AP:'Amapá',BA:'Bahia',CE:'Ceará',
    DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',
    MG:'Minas Gerais',MS:'Mato Grosso do Sul',MT:'Mato Grosso',PA:'Pará',
    PB:'Paraíba',PE:'Pernambuco',PI:'Piauí',PR:'Paraná',RJ:'Rio de Janeiro',
    RN:'Rio Grande do Norte',RO:'Rondônia',RR:'Roraima',RS:'Rio Grande do Sul',
    SC:'Santa Catarina',SE:'Sergipe',SP:'São Paulo',TO:'Tocantins'
  };

  function resolveRegion(country, zip) {
    if (!zip) return null;
    if (country === 'US') {
      var p = parseInt(zip.substring(0, 3), 10);
      var st =
        (p>=10&&p<=27)?'MA':(p>=28&&p<=29)?'RI':(p>=30&&p<=38)?'NH':
        (p>=39&&p<=49)?'ME':(p>=50&&p<=54)?'VT':(p>=60&&p<=69)?'CT':
        (p>=6&&p<=9)?'PR':
        (p>=100&&p<=149)?'NY':(p>=150&&p<=196)?'PA':(p>=197&&p<=199)?'DE':
        (p>=200&&p<=205)?'DC':(p>=206&&p<=219)?'MD':(p>=220&&p<=246)?'VA':
        (p>=247&&p<=268)?'WV':(p>=270&&p<=289)?'NC':(p>=290&&p<=299)?'SC':
        (p>=300&&p<=319)?'GA':(p>=320&&p<=349)?'FL':(p>=350&&p<=369)?'AL':
        (p>=370&&p<=385)?'TN':(p>=386&&p<=397)?'MS':(p>=400&&p<=427)?'KY':
        (p>=430&&p<=458)?'OH':(p>=460&&p<=479)?'IN':(p>=480&&p<=499)?'MI':
        (p>=500&&p<=528)?'IA':(p>=530&&p<=549)?'WI':(p>=550&&p<=567)?'MN':
        (p>=570&&p<=577)?'SD':(p>=580&&p<=588)?'ND':(p>=590&&p<=599)?'MT':
        (p>=600&&p<=629)?'IL':(p>=630&&p<=658)?'MO':(p>=660&&p<=679)?'KS':
        (p>=680&&p<=693)?'NE':(p>=700&&p<=714)?'LA':(p>=716&&p<=729)?'AR':
        (p>=730&&p<=749)?'OK':(p>=750&&p<=799)?'TX':(p>=800&&p<=816)?'CO':
        (p>=820&&p<=831)?'WY':(p>=832&&p<=838)?'ID':(p>=840&&p<=847)?'UT':
        (p>=850&&p<=865)?'AZ':(p>=870&&p<=884)?'NM':(p>=889&&p<=898)?'NV':
        (p>=900&&p<=961)?'CA':(p>=967&&p<=968)?'HI':(p>=970&&p<=979)?'OR':
        (p>=980&&p<=994)?'WA':(p>=995&&p<=999)?'AK':null;
      return st ? (US_STATES[st] || st) : null;
    }
    if (country === 'CA') {
      var caMap = {A:'NL',B:'NS',C:'PE',E:'NB',G:'QC',H:'QC',J:'QC',K:'ON',L:'ON',M:'ON',N:'ON',P:'ON',R:'MB',S:'SK',T:'AB',V:'BC',X:'NT',Y:'YT'};
      var prov = caMap[zip.charAt(0).toUpperCase()];
      return prov ? (CA_PROVS[prov] || prov) : null;
    }
    if (country === 'BR') {
      var d = zip.replace(/\D/g, '');
      if (d.length < 5) return null;
      var bp = parseInt(d.substring(0, 5), 10);
      var bs =
        (bp>=1000&&bp<=19999)?'SP':(bp>=20000&&bp<=28999)?'RJ':
        (bp>=29000&&bp<=29999)?'ES':(bp>=30000&&bp<=39999)?'MG':
        (bp>=40000&&bp<=48999)?'BA':(bp>=49000&&bp<=49999)?'SE':
        (bp>=50000&&bp<=56999)?'PE':(bp>=57000&&bp<=57999)?'AL':
        (bp>=58000&&bp<=58999)?'PB':(bp>=59000&&bp<=59999)?'RN':
        (bp>=60000&&bp<=63999)?'CE':(bp>=64000&&bp<=64999)?'PI':
        (bp>=65000&&bp<=65999)?'MA':(bp>=66000&&bp<=68899)?'PA':
        (bp>=68900&&bp<=68999)?'AP':(bp>=69000&&bp<=69299)?'AM':
        (bp>=69300&&bp<=69399)?'RR':(bp>=69400&&bp<=69899)?'AM':
        (bp>=69900&&bp<=69999)?'AC':(bp>=70000&&bp<=73699)?'DF':
        (bp>=73700&&bp<=76799)?'GO':(bp>=76800&&bp<=77999)?'TO':
        (bp>=78000&&bp<=78899)?'MT':(bp>=78900&&bp<=79999)?'MS':
        (bp>=80000&&bp<=87999)?'PR':(bp>=88000&&bp<=89999)?'SC':
        (bp>=90000&&bp<=99999)?'RS':null;
      return bs ? (BR_STATES[bs] || bs) : null;
    }
    return null;
  }

  // ─── Styles (injected into Shadow DOM) ──────────────
  function getStyles(theme) {
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e2e' : '#ffffff';
    var text = isDark ? '#cdd6f4' : '#1e293b';
    var subtext = isDark ? '#a6adc8' : '#64748b';
    var border = isDark ? '#45475a' : '#e2e8f0';
    var inputBg = isDark ? '#313244' : '#f8fafc';
    var accent = config.primaryColor || '#3b82f6';
    var accentHover = accent;
    var totalBg = isDark ? '#313244' : '#eff6ff';
    var radius = config.borderRadius || '12px';
    var font = config.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    return '\
      * { box-sizing: border-box; margin: 0; padding: 0; }\
      :host { display: block; font-family: ' + font + '; }\
      .pw-root { background: ' + bg + '; color: ' + text + '; border: 1px solid ' + border + '; border-radius: ' + radius + '; padding: 20px; max-width: 360px; font-size: 14px; line-height: 1.5; }\
      .pw-header { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; margin-bottom: 16px; }\
      .pw-header-icon { font-size: 18px; }\
      .pw-controls { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }\
      .pw-field { display: flex; flex-direction: column; gap: 4px; }\
      .pw-label { font-size: 12px; font-weight: 600; color: ' + subtext + '; text-transform: uppercase; letter-spacing: 0.5px; }\
      .pw-select, .pw-input { width: 100%; padding: 8px 12px; border: 1px solid ' + border + '; border-radius: 8px; background: ' + inputBg + '; color: ' + text + '; font-size: 14px; outline: none; transition: border-color 0.15s; appearance: none; -webkit-appearance: none; }\
      .pw-select { background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M3 5l3 3 3-3\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'1.5\'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; cursor: pointer; }\
      .pw-select:focus, .pw-input:focus { border-color: ' + accent + '; }\
      .pw-input::placeholder { color: ' + subtext + '; opacity: 0.6; }\
      .pw-divider { height: 1px; background: ' + border + '; margin: 4px 0; }\
      .pw-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }\
      .pw-row-label { color: ' + subtext + '; font-size: 13px; }\
      .pw-row-label small { opacity: 0.7; }\
      .pw-row-value { font-weight: 500; font-size: 13px; font-variant-numeric: tabular-nums; }\
      .pw-total { background: ' + totalBg + '; border-radius: 8px; padding: 10px 12px; margin-top: 8px; }\
      .pw-total .pw-row-label { font-weight: 700; font-size: 15px; color: ' + text + '; }\
      .pw-total .pw-row-value { font-weight: 700; font-size: 17px; color: ' + accent + '; }\
      .pw-footer { margin-top: 12px; text-align: right; font-size: 11px; color: ' + subtext + '; }\
      .pw-footer a { color: ' + accent + '; text-decoration: none; }\
      .pw-footer a:hover { text-decoration: underline; }\
      .pw-loading { text-align: center; padding: 32px 16px; color: ' + subtext + '; }\
      .pw-spinner { display: inline-block; width: 24px; height: 24px; border: 2.5px solid ' + border + '; border-top-color: ' + accent + '; border-radius: 50%; animation: pw-spin 0.7s linear infinite; margin-bottom: 8px; }\
      @keyframes pw-spin { to { transform: rotate(360deg); } }\
      .pw-error { background: ' + (isDark ? '#45273a' : '#fef2f2') + '; border: 1px solid ' + (isDark ? '#f38ba8' : '#fecaca') + '; border-radius: 8px; padding: 12px; color: ' + (isDark ? '#f38ba8' : '#dc2626') + '; font-size: 13px; text-align: center; }\
      .pw-badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle; }\
      .pw-badge-fta { background: #dcfce7; color: #166534; }\
      .pw-badge-deminimis { background: #e0f2fe; color: #0369a1; }\
      .pw-hidden { display: none; }\
      .pw-region-hint { font-size: 12px; color: ' + accent + '; margin-top: 2px; display: flex; align-items: center; gap: 4px; }\
      .pw-region-hint .pw-pin { font-size: 13px; }\
    ';
  }

  // ─── API Calls ──────────────────────────────────────
  function apiCalculate(params) {
    if (!config.apiKey) {
      return Promise.reject(new Error('POTAL: API key required'));
    }

    var body = {
      price: params.price || config.price,
      shippingPrice: params.shippingPrice != null ? params.shippingPrice : config.shippingPrice,
      origin: params.origin || config.origin,
      destinationCountry: params.destination || config.destination,
      productName: params.productName || config.productName,
    };
    if (params.zipcode) body.zipcode = params.zipcode;
    if (params.hsCode) body.hsCode = params.hsCode;

    return fetch(API_BASE + '/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': config.apiKey },
      body: JSON.stringify(body),
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (!json.success) throw new Error(json.error ? json.error.message : 'Calculation failed');
      return json.data;
    });
  }

  // ─── Widget Renderer ───────────────────────────────
  function createWidget(hostEl, params) {
    // Create Shadow DOM for style isolation
    var shadow = hostEl.attachShadow ? hostEl.attachShadow({ mode: 'open' }) : hostEl;

    var state = {
      destination: params.destination || config.destination || '',
      zipcode: '',
      data: null,
      loading: false,
      error: null,
    };

    function fmt(n) {
      return '$' + Number(n).toFixed(2);
    }

    function renderInner() {
      var html = '<style>' + getStyles(config.theme) + '</style>';
      html += '<div class="pw-root">';

      // Header
      html += '<div class="pw-header"><span class="pw-header-icon">&#x1F30D;</span> Total Landed Cost</div>';

      // Controls
      html += '<div class="pw-controls">';

      // Country selector
      html += '<div class="pw-field"><span class="pw-label">Ship to</span>';
      html += '<select class="pw-select" id="pw-country">';
      html += '<option value="">Select country...</option>';

      var regions = {};
      for (var i = 0; i < COUNTRIES.length; i++) {
        var co = COUNTRIES[i];
        if (!regions[co.r]) regions[co.r] = [];
        regions[co.r].push(co);
      }
      var regionOrder = ['Americas', 'Europe', 'Asia', 'Oceania', 'Middle East', 'Africa'];
      for (var ri = 0; ri < regionOrder.length; ri++) {
        var rName = regionOrder[ri];
        if (!regions[rName]) continue;
        html += '<optgroup label="' + rName + '">';
        for (var ci = 0; ci < regions[rName].length; ci++) {
          var c = regions[rName][ci];
          var sel = c.c === state.destination ? ' selected' : '';
          html += '<option value="' + c.c + '"' + sel + '>' + c.f + ' ' + c.n + '</option>';
        }
        html += '</optgroup>';
      }
      html += '</select></div>';

      // Zipcode (shown only for US/CA/BR)
      var zipLabel = ZIP_COUNTRIES[state.destination];
      if (zipLabel) {
        html += '<div class="pw-field" id="pw-zip-field"><span class="pw-label">' + zipLabel + ' <small>(for accurate tax)</small></span>';
        html += '<input class="pw-input" id="pw-zip" type="text" placeholder="Enter ' + zipLabel.toLowerCase() + '..." value="' + (state.zipcode || '') + '">';
        // Show resolved region name
        var regionName = resolveRegion(state.destination, state.zipcode);
        if (regionName) {
          html += '<div class="pw-region-hint"><span class="pw-pin">&#x1F4CD;</span> Tax rate based on <strong>' + regionName + '</strong></div>';
        }
        html += '</div>';
      }

      html += '</div>'; // end controls

      // Results
      if (state.loading) {
        html += '<div class="pw-loading"><div class="pw-spinner"></div><div>Calculating...</div></div>';
      } else if (state.error) {
        html += '<div class="pw-error">' + state.error + '</div>';
      } else if (state.data) {
        var d = state.data;

        // Breakdown rows
        html += '<div class="pw-divider"></div>';
        for (var bi = 0; bi < d.breakdown.length; bi++) {
          var item = d.breakdown[bi];
          html += '<div class="pw-row"><span class="pw-row-label">' + item.label;
          if (item.note) html += ' <small>(' + item.note + ')</small>';
          html += '</span><span class="pw-row-value">' + fmt(item.amount) + '</span></div>';
        }

        // FTA badge
        if (d.ftaApplied && d.ftaApplied.hasFta) {
          html += '<div style="padding:4px 0;"><span class="pw-badge pw-badge-fta">&#x2705; ' + d.ftaApplied.ftaCode + ' FTA Applied</span></div>';
        }

        // De minimis badge
        if (d.deMinimisApplied) {
          html += '<div style="padding:4px 0;"><span class="pw-badge pw-badge-deminimis">&#x2705; Duty Free (De Minimis)</span></div>';
        }

        // Total
        html += '<div class="pw-total"><div class="pw-row"><span class="pw-row-label">Estimated Total</span><span class="pw-row-value">' + fmt(d.totalLandedCost) + '</span></div></div>';
      } else if (state.destination) {
        // No data yet — prompt
        html += '<div class="pw-loading" style="padding:16px;">Select a country to see costs</div>';
      }

      // Footer
      if (config.showPoweredBy) {
        html += '<div class="pw-footer">Powered by <a href="https://potal.app" target="_blank" rel="noopener">POTAL</a></div>';
      }

      html += '</div>'; // end root
      shadow.innerHTML = html;

      // Bind events
      var countrySelect = shadow.getElementById('pw-country');
      if (countrySelect) {
        countrySelect.addEventListener('change', function () {
          state.destination = this.value;
          state.zipcode = '';
          state.data = null;
          state.error = null;
          renderInner();
          if (state.destination) doCalculate();
        });
      }

      var zipInput = shadow.getElementById('pw-zip');
      if (zipInput) {
        var debounceTimer;
        zipInput.addEventListener('input', function () {
          state.zipcode = this.value;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(function () {
            if (state.destination) doCalculate();
          }, 600);
        });
        // Keep focus after re-render
        zipInput.focus();
        zipInput.setSelectionRange(zipInput.value.length, zipInput.value.length);
      }
    }

    function doCalculate() {
      state.loading = true;
      state.error = null;
      renderInner();

      apiCalculate({
        price: params.price || config.price,
        shippingPrice: params.shippingPrice != null ? params.shippingPrice : config.shippingPrice,
        origin: params.origin || config.origin,
        destination: state.destination,
        zipcode: state.zipcode || undefined,
        productName: params.productName || config.productName,
        hsCode: params.hsCode,
      })
      .then(function (data) {
        state.data = data;
        state.loading = false;
        renderInner();
        if (typeof config.onCalculate === 'function') config.onCalculate(data);
      })
      .catch(function (err) {
        state.error = err.message;
        state.loading = false;
        renderInner();
        if (typeof config.onError === 'function') config.onError(err);
      });
    }

    // Initial render
    renderInner();

    // Auto-calculate if destination is preset
    if (state.destination) doCalculate();

    // Return controller
    return {
      recalculate: doCalculate,
      setDestination: function (cc) { state.destination = cc; state.zipcode = ''; doCalculate(); },
      setZipcode: function (z) { state.zipcode = z; doCalculate(); },
      getData: function () { return state.data; },
      destroy: function () { shadow.innerHTML = ''; },
    };
  }

  // ─── Fetch seller's custom theme from widget_configs ──
  function fetchThemeConfig(callback) {
    if (!config.apiKey) { callback(); return; }
    fetch(API_BASE + '/widget/config', {
      method: 'GET',
      headers: { 'X-API-Key': config.apiKey },
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json.success && json.data) {
        var d = json.data;
        var t = d.theme || {};
        if (t.mode) config.theme = t.mode;
        if (t.primaryColor) config.primaryColor = t.primaryColor;
        if (t.borderRadius) config.borderRadius = t.borderRadius;
        if (t.fontFamily) config.fontFamily = t.fontFamily;
        if (d.defaultOrigin) config.origin = d.defaultOrigin;
        if (typeof d.showPoweredBy === 'boolean') config.showPoweredBy = d.showPoweredBy;
      }
      callback();
    })
    .catch(function () { callback(); });
  }

  // ─── Auto-init from script tag ──────────────────────
  function autoInit() {
    if (!scriptEl) return;

    config.apiKey = scriptEl.getAttribute('data-api-key') || '';
    config.origin = scriptEl.getAttribute('data-origin') || 'CN';
    config.destination = scriptEl.getAttribute('data-destination') || '';
    config.theme = scriptEl.getAttribute('data-theme') || 'light';
    config.containerId = scriptEl.getAttribute('data-container') || 'potal-widget';
    config.productName = scriptEl.getAttribute('data-product-name') || '';
    config.showPoweredBy = scriptEl.getAttribute('data-powered-by') !== 'false';
    config.primaryColor = scriptEl.getAttribute('data-primary-color') || '';
    config.borderRadius = scriptEl.getAttribute('data-border-radius') || '';
    config.fontFamily = scriptEl.getAttribute('data-font-family') || '';

    var priceAttr = scriptEl.getAttribute('data-price');
    var shipAttr = scriptEl.getAttribute('data-shipping');
    if (priceAttr) config.price = parseFloat(priceAttr);
    if (shipAttr) config.shippingPrice = parseFloat(shipAttr);

    // Wait for DOM ready, then fetch theme config + render
    function boot() {
      var container = document.getElementById(config.containerId);
      if (container && config.apiKey && config.price > 0) {
        fetchThemeConfig(function () {
          createWidget(container, {
            price: config.price,
            shippingPrice: config.shippingPrice,
            origin: config.origin,
            destination: config.destination,
            productName: config.productName,
          });
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  // ─── Public API ─────────────────────────────────────
  window.PotalWidget = {
    version: VERSION,

    init: function (opts) {
      for (var key in opts) {
        if (opts.hasOwnProperty(key) && config.hasOwnProperty(key)) {
          config[key] = opts[key];
        }
      }
      // Support nested theme object: { theme: { mode, primaryColor, borderRadius, fontFamily } }
      if (opts && opts.theme && typeof opts.theme === 'object') {
        var t = opts.theme;
        if (t.mode) config.theme = t.mode;
        if (t.primaryColor) config.primaryColor = t.primaryColor;
        if (t.borderRadius) config.borderRadius = t.borderRadius;
        if (t.fontFamily) config.fontFamily = t.fontFamily;
      }
    },

    show: function (selector, params) {
      var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) {
        console.error('[POTAL] Container not found:', selector);
        return null;
      }
      return createWidget(el, params || {});
    },

    calculate: function (params) {
      return apiCalculate(params);
    },

    getConfig: function () {
      return JSON.parse(JSON.stringify(config));
    },
  };

  // Auto-init
  autoInit();
})();
