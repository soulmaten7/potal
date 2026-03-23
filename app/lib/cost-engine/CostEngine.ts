/**
 * POTAL CostEngine — Total Landed Cost Calculator
 *
 * Standalone B2B-ready module. Zero external dependencies.
 * Calculates the TRUE cost of a product including:
 * - Product price
 * - Shipping cost
 * - Import duty (for Global: China tariffs + MPF since Aug 2025)
 * - Estimated sales tax (for Domestic: state-based)
 *
 * IMPORTANT UPDATE (2025-08-29):
 * US $800 de minimis exemption has been ELIMINATED.
 * ALL packages from China are now subject to import duties.
 * - Reciprocal tariff: ~10%
 * - Fentanyl tariff: ~10%
 * - Section 301 additional: varies by category
 * - Effective rate for Chinese goods: ~20-37%
 * - Merchandise Processing Fee (MPF): $2.69-$12.09 for informal entries
 *
 * Philosophy: Show the most accurate estimate possible.
 * User sees "Expected Total" — honest about it being an estimate.
 */

import type { CostInput, LandedCost, CostBreakdownItem } from './types';

// ─── US Import Rules (Updated 2025-08) ──────────────

/**
 * China-specific import duty rates (post de minimis elimination)
 * Base: Reciprocal 10% + Fentanyl 10% = 20%
 * With Section 301 (many consumer goods): up to 37%
 * We use a conservative average of 20% for general merchandise
 */
export const CHINA_IMPORT_DUTY_RATE = 0.20;

/**
 * Merchandise Processing Fee (MPF) for informal entries (under $2,500)
 * CBP charges $2.69 - $12.09 per shipment
 * We use the middle estimate
 */
export const MPF_INFORMAL = 5.50;

/**
 * Non-China import duty rate (general)
 * Most Favored Nation (MFN) average for consumer goods
 */
const OTHER_IMPORT_DUTY_RATE = 0.05;

/** Average US sales tax rate by state (simplified) */
export const STATE_TAX_RATES: Record<string, number> = {
  // No sales tax states
  'OR': 0, 'MT': 0, 'NH': 0, 'DE': 0, 'AK': 0,
  // Major states (approximate combined state + local average)
  'CA': 0.0875, 'NY': 0.08, 'TX': 0.0825, 'FL': 0.07,
  'WA': 0.0892, 'IL': 0.0882, 'PA': 0.0634, 'OH': 0.0723,
  'GA': 0.0732, 'NC': 0.0698, 'MI': 0.06, 'NJ': 0.0663,
  'VA': 0.057, 'AZ': 0.084, 'MA': 0.0625, 'TN': 0.0955,
  'IN': 0.07, 'MO': 0.0823, 'MD': 0.06, 'WI': 0.055,
  'CO': 0.077, 'MN': 0.0773, 'SC': 0.0746, 'AL': 0.0922,
  'LA': 0.0955, 'KY': 0.06, 'CT': 0.0635, 'UT': 0.0719,
  'IA': 0.0694, 'NV': 0.0823, 'AR': 0.0947, 'MS': 0.07,
  'KS': 0.087, 'NE': 0.0694, 'NM': 0.0781, 'ID': 0.06,
  'WV': 0.065, 'HI': 0.0444, 'ME': 0.055, 'RI': 0.07,
  'SD': 0.064, 'ND': 0.0696, 'VT': 0.063, 'WY': 0.054,
  'DC': 0.06, 'PR': 0.115,
};

const DEFAULT_TAX_RATE = 0.07;

// ─── Canada Provincial Tax Rates (GST/HST/PST for imports) ──────

/** Combined effective tax rate for cross-border imports by province */
export const CANADA_PROVINCE_TAX_RATES: Record<string, number> = {
  // HST provinces (single combined rate)
  'ON': 0.13,    // HST 13%
  'NB': 0.15,    // HST 15%
  'NS': 0.15,    // HST 15%
  'NL': 0.15,    // HST 15%
  'PE': 0.15,    // HST 15%
  // GST + PST/QST provinces
  'BC': 0.12,    // GST 5% + PST 7%
  'SK': 0.11,    // GST 5% + PST 6%
  'MB': 0.12,    // GST 5% + RST 7%
  'QC': 0.14975, // GST 5% + QST 9.975%
  // GST only
  'AB': 0.05,    // GST 5%
  'NT': 0.05,    // GST 5%
  'NU': 0.05,    // GST 5%
  'YT': 0.05,    // GST 5%
};

/**
 * Map Canadian postal code first letter to province.
 * Canadian postal codes: "A1A 1A1" — first letter = Forward Sortation Area → province.
 */
export function postalCodeToProvince(postalCode: string): string | null {
  if (!postalCode || postalCode.length < 1) return null;
  const first = postalCode.charAt(0).toUpperCase();

  const map: Record<string, string> = {
    'A': 'NL', 'B': 'NS', 'C': 'PE', 'E': 'NB',
    'G': 'QC', 'H': 'QC', 'J': 'QC',
    'K': 'ON', 'L': 'ON', 'M': 'ON', 'N': 'ON', 'P': 'ON',
    'R': 'MB', 'S': 'SK', 'T': 'AB', 'V': 'BC',
    'X': 'NT', // NT/NU share X — same 5% rate
    'Y': 'YT',
  };

  return map[first] || null;
}

// ─── Brazil State Tax Rates (ICMS for imports) ──────

/** ICMS standard rates by state for imports (2025) */
export const BRAZIL_STATE_ICMS_RATES: Record<string, number> = {
  'AC': 0.19,   'AL': 0.19,   'AM': 0.20,   'AP': 0.18,
  'BA': 0.205,  'CE': 0.20,   'DF': 0.20,   'ES': 0.17,
  'GO': 0.19,   'MA': 0.22,   'MG': 0.18,   'MS': 0.17,
  'MT': 0.17,   'PA': 0.19,   'PB': 0.20,   'PE': 0.205,
  'PI': 0.21,   'PR': 0.195,  'RJ': 0.22,   'RN': 0.18,
  'RO': 0.195,  'RR': 0.20,   'RS': 0.17,   'SC': 0.17,
  'SE': 0.19,   'SP': 0.18,   'TO': 0.20,
};

/** Brazil IPI rates by NCM chapter (simplified from TIPI table)
 * Source: Receita Federal TIPI — https://www.gov.br/receitafederal/pt-br/ */
const BRAZIL_IPI_BY_CHAPTER: Record<string, number> = {
  // 0% — essential/exempt
  '01':0,'02':0,'03':0,'04':0,'05':0,'06':0,'07':0,'08':0,'09':0,'10':0,
  '11':0,'12':0,'13':0,'14':0,'15':0,'16':0,'17':0,'18':0,'19':0,'20':0,
  '21':0,'23':0,'25':0,'26':0,'27':0,'30':0,'31':0,'41':0,'43':0,
  '44':0,'45':0,'46':0,'47':0,'48':0,'49':0,
  '50':0,'51':0,'52':0,'53':0,'54':0,'55':0,'56':0,'57':0,'58':0,'59':0,'60':0,
  '61':0,'62':0,'63':0,
  // 5%
  '34':0.05,'35':0.05,'39':0.05,'40':0.05,'64':0.05,'68':0.05,'69':0.05,'70':0.05,
  '73':0.05,'74':0.05,'76':0.05,'82':0.05,'83':0.05,'94':0.05,'96':0.05,
  // 10%
  '28':0.10,'29':0.10,'32':0.10,'36':0.10,'37':0.10,'38':0.10,
  '65':0.10,'66':0.10,'67':0.10,'84':0.10,'86':0.10,'89':0.10,
  '90':0.10,'91':0.10,'92':0.10,'97':0.10,
  // 12-25%
  '71':0.12,'33':0.22,'85':0.15,'87':0.25,'93':0.15,'95':0.20,'22':0.20,
  // 300% — tobacco
  '24':3.00,
};
export function getBrazilIpiRate(hsCode: string): number {
  return BRAZIL_IPI_BY_CHAPTER[hsCode.substring(0, 2)] ?? 0.10;
}
export const BRAZIL_IPI_DEFAULT = 0.10;       // fallback avg
export const BRAZIL_PIS_IMPORT = 0.021;       // 2.1%
export const BRAZIL_COFINS_IMPORT = 0.0965;   // 9.65%

/**
 * Map Brazilian CEP (postal code) to state.
 * CEP format: XXXXX-XXX or XXXXXXXX (8 digits).
 */
export function cepToState(cep: string): string | null {
  if (!cep) return null;
  const digits = cep.replace(/\D/g, '');
  if (digits.length < 5) return null;
  const prefix = parseInt(digits.substring(0, 5), 10);

  if (prefix >= 1000 && prefix <= 19999) return 'SP';
  if (prefix >= 20000 && prefix <= 28999) return 'RJ';
  if (prefix >= 29000 && prefix <= 29999) return 'ES';
  if (prefix >= 30000 && prefix <= 39999) return 'MG';
  if (prefix >= 40000 && prefix <= 48999) return 'BA';
  if (prefix >= 49000 && prefix <= 49999) return 'SE';
  if (prefix >= 50000 && prefix <= 56999) return 'PE';
  if (prefix >= 57000 && prefix <= 57999) return 'AL';
  if (prefix >= 58000 && prefix <= 58999) return 'PB';
  if (prefix >= 59000 && prefix <= 59999) return 'RN';
  if (prefix >= 60000 && prefix <= 63999) return 'CE';
  if (prefix >= 64000 && prefix <= 64999) return 'PI';
  if (prefix >= 65000 && prefix <= 65999) return 'MA';
  if (prefix >= 66000 && prefix <= 68899) return 'PA';
  if (prefix >= 68900 && prefix <= 68999) return 'AP';
  if (prefix >= 69000 && prefix <= 69299) return 'AM';
  if (prefix >= 69300 && prefix <= 69399) return 'RR';
  if (prefix >= 69400 && prefix <= 69899) return 'AM';
  if (prefix >= 69900 && prefix <= 69999) return 'AC';
  if (prefix >= 70000 && prefix <= 73699) return 'DF';
  if (prefix >= 73700 && prefix <= 76799) return 'GO';
  if (prefix >= 76800 && prefix <= 77999) return 'TO';
  if (prefix >= 78000 && prefix <= 78899) return 'MT';
  if (prefix >= 78900 && prefix <= 79999) return 'MS';
  if (prefix >= 80000 && prefix <= 87999) return 'PR';
  if (prefix >= 88000 && prefix <= 89999) return 'SC';
  if (prefix >= 90000 && prefix <= 99999) return 'RS';

  return null;
}

/**
 * Calculate Brazil cascading import taxes.
 * II → IPI → PIS/COFINS → ICMS (por dentro).
 */
export function calculateBrazilImportTaxes(
  declaredValue: number,
  importDuty: number,
  icmsRate: number,
  ipiRate?: number,
): { ipi: number; pisCofins: number; icms: number; totalTax: number; effectiveRate: number } {
  const ipi = (declaredValue + importDuty) * (ipiRate ?? BRAZIL_IPI_DEFAULT);
  const pisCofins = declaredValue * (BRAZIL_PIS_IMPORT + BRAZIL_COFINS_IMPORT);
  // ICMS "por dentro": base = (CIF + II + IPI + PIS + COFINS) / (1 - ICMS rate)
  const preIcmsTotal = declaredValue + importDuty + ipi + pisCofins;
  const icmsBase = preIcmsTotal / (1 - icmsRate);
  const icms = icmsBase * icmsRate;
  const totalTax = ipi + pisCofins + icms;
  const effectiveRate = declaredValue > 0 ? totalTax / declaredValue : 0;
  return { ipi, pisCofins, icms, totalTax, effectiveRate };
}

// ─── India Import Tax Constants ──────────────────────

/** India Social Welfare Surcharge — 10% of Basic Customs Duty */
export const INDIA_SWS_RATE = 0.10;

/** India standard IGST rate (most goods) */
export const INDIA_IGST_STANDARD = 0.18;

/** India IGST rates by HS chapter (97 chapters, CBIC GST Rate Schedule)
 * Source: https://cbic-gst.gov.in/gst-goods-services-rates.html */
export const INDIA_IGST_RATES: Record<string, number> = {
  // 3% — precious metals/jewelry (SPECIAL)
  '71': 0.03,   // Gold, silver, precious stones, jewelry
  // 5% — essential goods
  '01':0.05,'02':0.05,'03':0.05,'04':0.05,'05':0.05,'07':0.05,'08':0.05,'09':0.05,
  '10':0.05,'11':0.05,'12':0.05,'13':0.05,'14':0.05,'15':0.05,'17':0.05,'19':0.05,
  '23':0.05,'25':0.05,'49':0.05,'50':0.05,'51':0.05,'52':0.05,'53':0.05,
  // 12% — processed goods
  '06':0.12,'16':0.12,'18':0.12,'20':0.12,'21':0.12,'22':0.12,'30':0.12,
  '34':0.12,'48':0.12,'61':0.12,'62':0.12,'63':0.12,'64':0.12,'97':0.12,
  // 18% — standard (most manufactured goods)
  '26':0.18,'27':0.18,'28':0.18,'29':0.18,'31':0.18,'32':0.18,'33':0.18,
  '35':0.18,'36':0.18,'37':0.18,'38':0.18,'39':0.18,'40':0.18,'41':0.18,
  '42':0.18,'43':0.18,'44':0.18,'45':0.18,'46':0.18,'47':0.18,
  '54':0.18,'55':0.18,'56':0.18,'57':0.18,'58':0.18,'59':0.18,'60':0.18,
  '65':0.18,'66':0.18,'67':0.18,'68':0.18,'69':0.18,'70':0.18,
  '72':0.18,'73':0.18,'74':0.18,'75':0.18,'76':0.18,'78':0.18,'79':0.18,
  '80':0.18,'81':0.18,'82':0.18,'83':0.18,'84':0.18,'85':0.18,'86':0.18,
  '88':0.18,'89':0.18,'90':0.18,'91':0.18,'92':0.18,'94':0.18,'95':0.18,'96':0.18,
  // 28% — luxury/demerit
  '24':0.28,'87':0.28,'93':0.28,
};

/**
 * Get IGST rate for an HS chapter.
 * Defaults to 18% (standard rate) if chapter not found.
 */
export function getIndiaIgstRate(hsChapter: string): number {
  return INDIA_IGST_RATES[hsChapter] ?? INDIA_IGST_STANDARD;
}

/**
 * Calculate India cascading import taxes.
 *
 * India import duty structure:
 * 1. Basic Customs Duty (BCD) — varies by HS code (already calculated as importDuty)
 * 2. Social Welfare Surcharge (SWS) = 10% of BCD
 * 3. IGST = rate × (Assessable Value + BCD + SWS)
 *
 * Assessable Value = CIF value (product + shipping + insurance)
 */
export function calculateIndiaImportTaxes(
  declaredValue: number,
  importDuty: number,
  igstRate: number
): { sws: number; igst: number; totalTax: number; effectiveRate: number } {
  // Social Welfare Surcharge = 10% of Basic Customs Duty
  const sws = importDuty * INDIA_SWS_RATE;

  // IGST base = CIF + BCD + SWS
  const igstBase = declaredValue + importDuty + sws;
  const igst = igstBase * igstRate;

  const totalTax = sws + igst;
  const effectiveRate = declaredValue > 0 ? totalTax / declaredValue : 0;

  return { sws, igst, totalTax, effectiveRate };
}

// ─── China CBEC (Cross-Border E-Commerce) Tax ──────

/**
 * China Cross-Border E-Commerce (CBEC / 跨境电商) Tax Regime
 *
 * For imports via registered CBEC platforms (Tmall Global, JD Worldwide, etc.):
 * - Single transaction limit: ¥5,000
 * - Annual limit per person: ¥26,000
 * - Within limits: duty exempted, VAT & consumption tax at 70% of statutory rates
 * - Standard VAT: 13% (most goods), 9% (some food/books)
 * - Consumption tax: 0% (most), 15-50% (luxury/tobacco/alcohol)
 *
 * Composite CBEC tax rate for most goods:
 * = (0% duty + 13% VAT + 0% consumption) × 70% = 9.1%
 *
 * Regular imports (over limits or non-CBEC):
 * - Full duty (avg 9.8%) + VAT 13% + consumption tax
 */
const CHINA_VAT_STANDARD = 0.13;
const CHINA_VAT_REDUCED = 0.09; // food, books, agricultural products
const CHINA_CBEC_DISCOUNT = 0.70;
const CHINA_CBEC_SINGLE_LIMIT_USD = 700; // ~¥5,000 / 7.1 exchange rate
const CHINA_CBEC_ANNUAL_LIMIT_USD = 3660; // ~¥26,000

/** China Consumption Tax by HS heading (中华人民共和国消费税暂行条例)
 * Source: http://www.chinatax.gov.cn/ */
const CHINA_CONSUMPTION_TAX: Record<string, number> = {
  '22': 0.10, // Wine 10%, spirits 20% (avg 10% for chapter level)
  '24': 0.36, // Tobacco (cigarettes 56% Class A, avg 36%)
  '33': 0.15, // High-end cosmetics 15%
  '36': 0.15, // Fireworks 15%
  '71': 0.10, // Precious jewelry 10%
  '85': 0.04, // Batteries 4%
  '87': 0.09, // Vehicles 3-40% (avg ~9% for 1.5-3.0L)
  '89': 0.10, // Yachts 10%
  '91': 0.20, // Luxury watches (>¥10k) 20%
};

export function getChinaConsumptionTaxRate(hsChapter: string): number {
  return CHINA_CONSUMPTION_TAX[hsChapter] ?? 0;
}

export function calculateChinaCBECTaxes(
  declaredValue: number,
  importDuty: number,
  hsChapter: string,
  isCBEC: boolean = true,
): { vat: number; consumptionTax: number; totalTax: number; effectiveRate: number; isCBEC: boolean } {
  const consumptionTaxRate = getChinaConsumptionTaxRate(hsChapter);
  const vatRate = ['01','02','03','04','05','06','07','08','09','10','11','12','49'].includes(hsChapter)
    ? CHINA_VAT_REDUCED
    : CHINA_VAT_STANDARD;

  if (isCBEC && declaredValue <= CHINA_CBEC_SINGLE_LIMIT_USD) {
    // CBEC regime: duty exempted, VAT & consumption at 70%
    const effectiveVat = vatRate * CHINA_CBEC_DISCOUNT;
    const effectiveConsumption = consumptionTaxRate * CHINA_CBEC_DISCOUNT;
    // Formula: tax = (price / (1 - consumptionTaxRate*0.7)) * (VAT*0.7 + consumptionTax*0.7)
    const taxBase = consumptionTaxRate > 0
      ? declaredValue / (1 - effectiveConsumption)
      : declaredValue;
    const vat = taxBase * effectiveVat;
    const consumptionTax = taxBase * effectiveConsumption;
    const totalTax = vat + consumptionTax;
    return {
      vat,
      consumptionTax,
      totalTax,
      effectiveRate: declaredValue > 0 ? totalTax / declaredValue : 0,
      isCBEC: true,
    };
  }

  // Regular import: full duty + VAT + consumption tax
  const dutyPlusValue = declaredValue + importDuty;
  const taxBase = consumptionTaxRate > 0
    ? dutyPlusValue / (1 - consumptionTaxRate)
    : dutyPlusValue;
  const vat = taxBase * vatRate;
  const consumptionTax = taxBase * consumptionTaxRate;
  const totalTax = vat + consumptionTax;
  return {
    vat,
    consumptionTax,
    totalTax,
    effectiveRate: declaredValue > 0 ? totalTax / declaredValue : 0,
    isCBEC: false,
  };
}

// ─── Mexico IEPS (Excise Tax) ──────────────────────

/**
 * Mexico IEPS (Impuesto Especial sobre Producción y Servicios)
 * Applied to specific goods: alcohol, tobacco, sugary drinks, etc.
 * On top of IVA 16%.
 */
/** Mexico IEPS by HS heading (Ley del IEPS, SAT)
 * Source: https://www.sat.gob.mx/ */
const MEXICO_IEPS_RATES: Record<string, number> = {
  // Alcoholic beverages (Art. 2, Fracción I, inciso A)
  '2203': 0.265,  // Beer ≤14% ABV → 26.5%
  '2204': 0.265,  // Wine ≤14% ABV → 26.5%
  '2205': 0.265,  // Vermouth ≤14% ABV → 26.5%
  '2206': 0.265,  // Other fermented ≤14% ABV → 26.5%
  '2207': 0.53,   // Ethyl alcohol → 53%
  '2208': 0.53,   // Spirits/liqueurs >20% ABV → 53% (tequila, whisky, vodka)
  // Tobacco
  '24': 1.60,     // Tobacco 160%
  // Sugary drinks
  '2202': 0.08,   // Sugary non-alcoholic beverages ~8%
  // Junk food (>275 kcal/100g)
  '1704': 0.08,'1806': 0.08,'1905': 0.08,
};

export function getMexicoIepsRate(hsCode: string): number {
  // Try 4-digit heading first, then 2-digit chapter
  const h4 = hsCode.replace(/\./g, '').substring(0, 4);
  if (MEXICO_IEPS_RATES[h4]) return MEXICO_IEPS_RATES[h4];
  const ch = hsCode.replace(/\./g, '').substring(0, 2);
  return MEXICO_IEPS_RATES[ch] ?? 0;
}

export function calculateMexicoImportTaxes(
  declaredValue: number,
  importDuty: number,
  hsChapter: string,
): { iva: number; ieps: number; totalTax: number; effectiveRate: number } {
  const iepsRate = getMexicoIepsRate(hsChapter);
  const ivaRate = 0.16;
  const taxBase = declaredValue + importDuty;
  const ieps = taxBase * iepsRate;
  const iva = (taxBase + ieps) * ivaRate; // IVA calculated on base + IEPS
  const totalTax = iva + ieps;
  return {
    iva,
    ieps,
    totalTax,
    effectiveRate: declaredValue > 0 ? totalTax / declaredValue : 0,
  };
}

// ─── Zipcode to State Mapping (first 3 digits) ──────

export function zipcodeToState(zipcode: string): string | null {
  if (!zipcode || zipcode.length < 3) return null;
  const prefix = parseInt(zipcode.substring(0, 3), 10);

  // New England (prefix 010-069)
  if (prefix >= 10 && prefix <= 27) return 'MA';
  if (prefix >= 28 && prefix <= 29) return 'RI';
  if (prefix >= 30 && prefix <= 38) return 'NH';
  if (prefix >= 39 && prefix <= 49) return 'ME';
  if (prefix >= 50 && prefix <= 54) return 'VT';
  if (prefix >= 60 && prefix <= 69) return 'CT';
  // Puerto Rico (006-009)
  if (prefix >= 6 && prefix <= 9) return 'PR';

  if (prefix >= 100 && prefix <= 149) return 'NY';
  if (prefix >= 150 && prefix <= 196) return 'PA';
  if (prefix >= 197 && prefix <= 199) return 'DE';
  if (prefix >= 200 && prefix <= 205) return 'DC';
  if (prefix >= 206 && prefix <= 219) return 'MD';
  if (prefix >= 220 && prefix <= 246) return 'VA';
  if (prefix >= 247 && prefix <= 268) return 'WV';
  if (prefix >= 270 && prefix <= 289) return 'NC';
  if (prefix >= 290 && prefix <= 299) return 'SC';
  if (prefix >= 300 && prefix <= 319) return 'GA';
  if (prefix >= 320 && prefix <= 349) return 'FL';
  if (prefix >= 350 && prefix <= 369) return 'AL';
  if (prefix >= 370 && prefix <= 385) return 'TN';
  if (prefix >= 386 && prefix <= 397) return 'MS';
  if (prefix >= 400 && prefix <= 427) return 'KY';
  if (prefix >= 430 && prefix <= 458) return 'OH';
  if (prefix >= 460 && prefix <= 479) return 'IN';
  if (prefix >= 480 && prefix <= 499) return 'MI';
  if (prefix >= 500 && prefix <= 528) return 'IA';
  if (prefix >= 530 && prefix <= 549) return 'WI';
  if (prefix >= 550 && prefix <= 567) return 'MN';
  if (prefix >= 570 && prefix <= 577) return 'SD';
  if (prefix >= 580 && prefix <= 588) return 'ND';
  if (prefix >= 590 && prefix <= 599) return 'MT';
  if (prefix >= 600 && prefix <= 629) return 'IL';
  if (prefix >= 630 && prefix <= 658) return 'MO';
  if (prefix >= 660 && prefix <= 679) return 'KS';
  if (prefix >= 680 && prefix <= 693) return 'NE';
  if (prefix >= 700 && prefix <= 714) return 'LA';
  if (prefix >= 716 && prefix <= 729) return 'AR';
  if (prefix >= 730 && prefix <= 749) return 'OK';
  if (prefix >= 750 && prefix <= 799) return 'TX';
  if (prefix >= 800 && prefix <= 816) return 'CO';
  if (prefix >= 820 && prefix <= 831) return 'WY';
  if (prefix >= 832 && prefix <= 838) return 'ID';
  if (prefix >= 840 && prefix <= 847) return 'UT';
  if (prefix >= 850 && prefix <= 865) return 'AZ';
  if (prefix >= 870 && prefix <= 884) return 'NM';
  if (prefix >= 889 && prefix <= 898) return 'NV';
  if (prefix >= 900 && prefix <= 961) return 'CA';
  if (prefix >= 967 && prefix <= 968) return 'HI';
  if (prefix >= 970 && prefix <= 979) return 'OR';
  if (prefix >= 980 && prefix <= 994) return 'WA';
  if (prefix >= 995 && prefix <= 999) return 'AK';

  return null;
}

// ─── Origin Country Detection ────────────────────────

/** Known Chinese-origin e-commerce platforms */
const CHINESE_PLATFORMS = ['aliexpress', 'temu', 'shein', 'wish', 'dhgate', 'banggood'];

/**
 * Detect origin country from CostInput.
 * Supports both B2C (site name) and B2B (ISO country code) inputs.
 */
function detectOriginCountry(input: CostInput): 'CN' | 'OTHER' | 'DOMESTIC' {
  const origin = (input.origin || '').toLowerCase().trim();
  const shippingType = (input.shippingType || '').toLowerCase();

  // Direct country code (B2B API usage)
  if (origin === 'cn' || origin === 'china') return 'CN';
  if (origin === 'us' || origin === 'usa' || origin === 'domestic') return 'DOMESTIC';

  // Any 2-letter ISO code that isn't US → international
  if (origin.length === 2 && /^[a-z]{2}$/.test(origin)) return 'OTHER';

  // Shipping type hint
  if (shippingType.includes('domestic')) return 'DOMESTIC';

  // Chinese origin platforms (B2C compatibility)
  if (CHINESE_PLATFORMS.some(p => origin.includes(p))) return 'CN';

  // International but non-China
  if (shippingType.includes('international') || shippingType.includes('global')) return 'OTHER';

  return 'DOMESTIC';
}

// ─── Price Parser ────────────────────────────────────

export function parsePriceToNumber(price: string | number | undefined): number {
  if (typeof price === 'number') return Math.max(0, price);
  if (!price) return 0;
  const num = parseFloat(String(price).replace(/[^0-9.-]/g, ''));
  return isNaN(num) || !isFinite(num) ? 0 : Math.max(0, num);
}

// ─── Main Calculator ─────────────────────────────────

/**
 * Calculate Total Landed Cost for a single product/item.
 *
 * @example B2B API usage:
 * ```ts
 * const cost = calculateLandedCost({
 *   price: 49.99,
 *   shippingPrice: 8.50,
 *   origin: 'CN',
 *   zipcode: '10001'
 * });
 * ```
 *
 * @example B2C compatibility:
 * ```ts
 * import { toCostInput } from './adapters';
 * const cost = calculateLandedCost(toCostInput(product), { zipcode: '90210' });
 * ```
 */
export function calculateLandedCost(input: CostInput): LandedCost {
  const productPrice = parsePriceToNumber(input.price);
  const shippingCost = input.shippingPrice ?? 0;
  const originCountry = detectOriginCountry(input);
  const zipcode = input.zipcode || '';

  if (originCountry === 'DOMESTIC') {
    // ── Domestic: Product + Shipping + Sales Tax ──
    const state = zipcodeToState(zipcode);
    const taxRate = state ? (STATE_TAX_RATES[state] ?? DEFAULT_TAX_RATE) : DEFAULT_TAX_RATE;
    const salesTax = (productPrice + shippingCost) * taxRate;

    const breakdown: CostBreakdownItem[] = [
      { label: 'Product', amount: productPrice },
      { label: 'Shipping', amount: shippingCost, note: shippingCost === 0 ? 'Free' : undefined },
      { label: 'Est. Sales Tax', amount: Math.round(salesTax * 100) / 100, note: state ? `${state} ~${(taxRate * 100).toFixed(1)}%` : 'Avg ~7%' },
    ];

    return {
      productPrice,
      shippingCost,
      importDuty: 0,
      mpf: 0,
      salesTax: Math.round(salesTax * 100) / 100,
      totalLandedCost: Math.round((productPrice + shippingCost + salesTax) * 100) / 100,
      type: 'domestic',
      isDutyFree: true,
      originCountry,
      breakdown,
    };
  } else {
    // ── Global: Product + Shipping + Import Duty + MPF ──
    const totalDeclaredValue = productPrice + shippingCost;

    const dutyRate = originCountry === 'CN' ? CHINA_IMPORT_DUTY_RATE : OTHER_IMPORT_DUTY_RATE;
    const importDuty = totalDeclaredValue * dutyRate;

    // US MPF applies to ALL origins (19 CFR 24.23), not just CN
    const mpf = totalDeclaredValue <= 2500 ? 2.00 : Math.min(Math.max(totalDeclaredValue * 0.003464, 32.71), 634.04);

    const isDutyFree = originCountry === 'OTHER' && totalDeclaredValue === 0;

    const dutyNote = originCountry === 'CN'
      ? `~${(dutyRate * 100)}% (China tariff)`
      : `~${(dutyRate * 100)}% (MFN avg)`;

    const breakdown: CostBreakdownItem[] = [
      { label: 'Product', amount: productPrice },
      { label: 'Shipping', amount: shippingCost, note: shippingCost === 0 ? 'Free' : undefined },
      { label: 'Import Duty', amount: Math.round(importDuty * 100) / 100, note: dutyNote },
    ];

    if (mpf > 0) {
      breakdown.push({ label: 'Processing Fee', amount: mpf, note: 'CBP MPF' });
    }

    const total = productPrice + shippingCost + importDuty + mpf;

    return {
      productPrice,
      shippingCost,
      importDuty: Math.round(importDuty * 100) / 100,
      mpf,
      salesTax: 0,
      totalLandedCost: Math.round(total * 100) / 100,
      type: 'global',
      isDutyFree,
      originCountry,
      breakdown,
    };
  }
}

// ─── Batch Calculator ────────────────────────────────

/**
 * Calculate Total Landed Cost for multiple items.
 * @param items Array of CostInput with an id field
 */
export function calculateBatchLandedCosts(
  items: (CostInput & { id: string })[]
): Map<string, LandedCost> {
  const costMap = new Map<string, LandedCost>();
  for (const item of items) {
    costMap.set(item.id, calculateLandedCost(item));
  }
  return costMap;
}
