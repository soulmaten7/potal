/**
 * POTAL — Brand → Country of Origin (Manufacturing) Mapping
 *
 * Single source of truth for brand origin data.
 * Used by: origin-detection.ts, origin-predictor.ts, origin/route.ts
 *
 * NOTE: These map to *manufacturing* origin, not HQ country.
 * e.g., Nike HQ is US but most manufacturing is in VN.
 * For brands where HQ = manufacturing, both are the same.
 *
 * 130+ brands covered.
 */

export const BRAND_ORIGINS: Record<string, string> = {
  // ──── Electronics (CN) ────────────────────────
  huawei: 'CN', xiaomi: 'CN', oppo: 'CN', vivo: 'CN', oneplus: 'CN',
  realme: 'CN', honor: 'CN', zte: 'CN', lenovo: 'CN', tcl: 'CN',
  hisense: 'CN', haier: 'CN', midea: 'CN', dji: 'CN', anker: 'CN',
  baseus: 'CN', ugreen: 'CN', bluetti: 'CN', roborock: 'CN', ecovacs: 'CN',
  dreame: 'CN', insta360: 'CN', soundcore: 'CN', nothing: 'CN', poco: 'CN',
  redmi: 'CN', amazfit: 'CN', tineco: 'CN', narwal: 'CN', ecoflow: 'CN',
  xgimi: 'CN', jmgo: 'CN', yeelight: 'CN', aqara: 'CN', tuya: 'CN',
  meizu: 'CN', nubia: 'CN', byd: 'CN', nio: 'CN', xpeng: 'CN',
  // ──── Electronics (US) ────────────────────────
  apple: 'US', google: 'US', microsoft: 'US', dell: 'US', hp: 'US',
  ibm: 'US', intel: 'US', amd: 'US', nvidia: 'US', qualcomm: 'US',
  tesla: 'US', bose: 'US', harman: 'US', jbl: 'US', beats: 'US',
  gopro: 'US', fitbit: 'US', garmin: 'US', sonos: 'US', ring: 'US',
  wyze: 'US', roku: 'US', corsair: 'US', logitech: 'US', razer: 'US',
  // ──── Electronics (JP) ────────────────────────
  sony: 'JP', panasonic: 'JP', sharp: 'JP', toshiba: 'JP', nikon: 'JP',
  canon: 'JP', fujifilm: 'JP', olympus: 'JP', casio: 'JP', nintendo: 'JP',
  yamaha: 'JP', denon: 'JP', pioneer: 'JP', kenwood: 'JP', jvc: 'JP',
  brother: 'JP', epson: 'JP', ricoh: 'JP', konica: 'JP', minolta: 'JP',
  // ──── Electronics (KR) ────────────────────────
  samsung: 'KR', lg: 'KR', hyundai: 'KR', kia: 'KR', sk: 'KR',
  // ──── Electronics (TW) ────────────────────────
  asus: 'TW', acer: 'TW', msi: 'TW', gigabyte: 'TW', htc: 'TW',
  // ──── Electronics (EU) ────────────────────────
  philips: 'NL', nokia: 'FI', ericsson: 'SE', siemens: 'DE', bosch: 'DE',
  braun: 'DE', grundig: 'DE', miele: 'DE', sennheiser: 'DE', beyerdynamic: 'DE',
  bang: 'DK', dyson: 'GB', marshall: 'GB', cambridge: 'GB',
  // ──── Fashion (IT) ────────────────────────────
  gucci: 'IT', prada: 'IT', versace: 'IT', armani: 'IT', fendi: 'IT',
  valentino: 'IT', dolce: 'IT', bottega: 'IT', moncler: 'IT', tod: 'IT',
  ferragamo: 'IT', bvlgari: 'IT', diesel: 'IT', missoni: 'IT', marni: 'IT',
  maxmara: 'IT', etro: 'IT', brunello: 'IT', zegna: 'IT', canali: 'IT',
  ferrari: 'IT',
  // ──── Fashion (FR) ────────────────────────────
  louis: 'FR', chanel: 'FR', hermes: 'FR', dior: 'FR', givenchy: 'FR',
  ysl: 'FR', celine: 'FR', balenciaga: 'FR', lanvin: 'FR', chloe: 'FR',
  cartier: 'FR', balmain: 'FR', kenzo: 'FR', longchamp: 'FR',
  lacoste: 'FR', sandro: 'FR', maje: 'FR', zadig: 'FR',
  louis_vuitton: 'FR',
  // ──── Fashion (US) ────────────────────────────
  nike: 'US', ralph: 'US', calvin: 'US', tommy: 'US', michael: 'US',
  coach: 'US', tiffany: 'US', levis: 'US', gap: 'US', converse: 'US',
  vans: 'US', timberland: 'US', columbia: 'US', patagonia: 'US',
  // ──── Fashion (ES) ────────────────────────────
  zara: 'ES', mango: 'ES', desigual: 'ES', loewe: 'ES',
  // ──── Fashion (GB) ────────────────────────────
  burberry: 'GB', mulberry: 'GB', barbour: 'GB', vivienne: 'GB',
  alexander: 'GB', stella: 'GB',
  // ──── Fashion (DE) ────────────────────────────
  adidas: 'DE', puma: 'DE', hugo: 'DE', jil: 'DE',
  birkenstock: 'DE', montblanc: 'DE',
  // ──── Fashion (SE) ────────────────────────────
  hm: 'SE', acne: 'SE', cos: 'SE', arket: 'SE', volvo: 'SE',
  // ──── Fashion (JP) ────────────────────────────
  uniqlo: 'JP', muji: 'JP', asics: 'JP', onitsuka: 'JP', issey: 'JP',
  comme: 'JP', sacai: 'JP',
  // ──── Automotive (DE) ─────────────────────────
  bmw: 'DE', mercedes: 'DE', audi: 'DE', volkswagen: 'DE', porsche: 'DE',
  // ──── Automotive (JP) ─────────────────────────
  toyota: 'JP', honda: 'JP', mazda: 'JP', subaru: 'JP', suzuki: 'JP',
  mitsubishi: 'JP', lexus: 'JP', infiniti: 'JP',
  // ──── Automotive (US) ─────────────────────────
  ford: 'US', chevrolet: 'US', jeep: 'US', harley: 'US',
  // ──── Automotive (KR) ─────────────────────────
  genesis: 'KR', ssangyong: 'KR',
  // ──── Beauty/Cosmetics (FR) ───────────────────
  loreal: 'FR', lancome: 'FR', yves: 'FR', clarins: 'FR', sisley: 'FR',
  nars: 'FR', guerlain: 'FR', bioderma: 'FR',
  // ──── Beauty (US) ─────────────────────────────
  estee: 'US', clinique: 'US', mac: 'US', bobbi: 'US',
  revlon: 'US', maybelline: 'US', neutrogena: 'US',
  // ──── Beauty (KR) ─────────────────────────────
  innisfree: 'KR', laneige: 'KR', sulwhasoo: 'KR', etude: 'KR',
  missha: 'KR', cosrx: 'KR', banila: 'KR', amorepacific: 'KR',
  // ──── Beauty (JP) ─────────────────────────────
  shiseido: 'JP', skii: 'JP', shu: 'JP', dhc: 'JP', fancl: 'JP',
  canmake: 'JP', kate: 'JP',
  // ──── Food/Beverage (CH) ──────────────────────
  nestle: 'CH', lindt: 'CH', toblerone: 'CH',
  // ──── Food/Beverage (US) ──────────────────────
  coca: 'US', pepsi: 'US', starbucks: 'US', mcdonalds: 'US',
  // ──── Furniture/Home ──────────────────────────
  ikea: 'SE', lego: 'DK',
  // ──── Sporting Goods ──────────────────────────
  decathlon: 'FR', new_balance: 'US', under_armour: 'US', reebok: 'US',
  mizuno: 'JP', yonex: 'JP',
  li_ning: 'CN', anta: 'CN', xtep: 'CN', peak: 'CN',
};

/** Number of brand entries */
export const BRAND_COUNT = Object.keys(BRAND_ORIGINS).length;
