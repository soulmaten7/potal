/**
 * POTAL EU VAT — HS Chapter-Based Reduced Rates
 *
 * EU member states apply reduced VAT rates to specific product categories.
 * This module maps HS chapters to the applicable reduced rates.
 *
 * Standard VAT remains in vat_gst_rates table; this provides overrides
 * when the product's HS chapter qualifies for a reduced rate.
 *
 * Sources: EU VAT Directive 2006/112/EC, Annex III (reduced rate categories)
 */

interface EuVatOverride {
  /** Reduced VAT rate (decimal, e.g. 0.07 = 7%) */
  rate: number;
  /** Category label */
  label: string;
}

/**
 * EU country → HS chapter → reduced VAT rate.
 * Only chapters with reduced rates are listed; unlisted chapters use standard rate.
 */
const EU_REDUCED_VAT: Record<string, Record<string, EuVatOverride>> = {
  // Germany: Standard 19%, Reduced 7%
  DE: {
    '01': { rate: 0.07, label: 'Reduced (live animals)' },
    '02': { rate: 0.07, label: 'Reduced (meat)' },
    '03': { rate: 0.07, label: 'Reduced (fish)' },
    '04': { rate: 0.07, label: 'Reduced (dairy)' },
    '06': { rate: 0.07, label: 'Reduced (plants)' },
    '07': { rate: 0.07, label: 'Reduced (vegetables)' },
    '08': { rate: 0.07, label: 'Reduced (fruit)' },
    '09': { rate: 0.07, label: 'Reduced (coffee/tea)' },
    '10': { rate: 0.07, label: 'Reduced (cereals)' },
    '11': { rate: 0.07, label: 'Reduced (milling)' },
    '12': { rate: 0.07, label: 'Reduced (oil seeds)' },
    '15': { rate: 0.07, label: 'Reduced (fats/oils)' },
    '16': { rate: 0.07, label: 'Reduced (food preparations)' },
    '17': { rate: 0.07, label: 'Reduced (sugar)' },
    '18': { rate: 0.07, label: 'Reduced (cocoa)' },
    '19': { rate: 0.07, label: 'Reduced (bakery)' },
    '20': { rate: 0.07, label: 'Reduced (preserved food)' },
    '21': { rate: 0.07, label: 'Reduced (misc food)' },
    '22': { rate: 0.07, label: 'Reduced (water/juice only)' },
    '49': { rate: 0.07, label: 'Reduced (books/newspapers)' },
  },
  // France: Standard 20%, Reduced 5.5%, Super-reduced 2.1%
  FR: {
    '01': { rate: 0.055, label: 'Reduced (live animals)' },
    '02': { rate: 0.055, label: 'Reduced (meat)' },
    '03': { rate: 0.055, label: 'Reduced (fish)' },
    '04': { rate: 0.055, label: 'Reduced (dairy)' },
    '07': { rate: 0.055, label: 'Reduced (vegetables)' },
    '08': { rate: 0.055, label: 'Reduced (fruit)' },
    '09': { rate: 0.055, label: 'Reduced (coffee/tea)' },
    '10': { rate: 0.055, label: 'Reduced (cereals)' },
    '15': { rate: 0.055, label: 'Reduced (fats/oils)' },
    '16': { rate: 0.055, label: 'Reduced (food preparations)' },
    '19': { rate: 0.055, label: 'Reduced (bakery)' },
    '20': { rate: 0.055, label: 'Reduced (preserved food)' },
    '21': { rate: 0.055, label: 'Reduced (misc food)' },
    '30': { rate: 0.021, label: 'Super-reduced (pharmaceuticals)' },
    '49': { rate: 0.055, label: 'Reduced (books)' },
  },
  // Italy: Standard 22%, Reduced 10%, Super-reduced 4%
  IT: {
    '01': { rate: 0.10, label: 'Reduced (live animals)' },
    '02': { rate: 0.10, label: 'Reduced (meat)' },
    '03': { rate: 0.10, label: 'Reduced (fish)' },
    '04': { rate: 0.04, label: 'Super-reduced (milk/dairy)' },
    '07': { rate: 0.04, label: 'Super-reduced (vegetables)' },
    '08': { rate: 0.04, label: 'Super-reduced (fruit)' },
    '09': { rate: 0.10, label: 'Reduced (coffee/tea)' },
    '10': { rate: 0.04, label: 'Super-reduced (cereals/bread)' },
    '15': { rate: 0.04, label: 'Super-reduced (olive oil)' },
    '19': { rate: 0.04, label: 'Super-reduced (bread/pasta)' },
    '30': { rate: 0.10, label: 'Reduced (pharmaceuticals)' },
    '49': { rate: 0.04, label: 'Super-reduced (books)' },
  },
  // Spain: Standard 21%, Reduced 10%, Super-reduced 4%
  ES: {
    '01': { rate: 0.10, label: 'Reduced (live animals)' },
    '02': { rate: 0.10, label: 'Reduced (meat)' },
    '03': { rate: 0.10, label: 'Reduced (fish)' },
    '04': { rate: 0.04, label: 'Super-reduced (milk/eggs)' },
    '07': { rate: 0.04, label: 'Super-reduced (vegetables)' },
    '08': { rate: 0.04, label: 'Super-reduced (fruit)' },
    '09': { rate: 0.10, label: 'Reduced (coffee/tea)' },
    '10': { rate: 0.04, label: 'Super-reduced (bread/cereals)' },
    '15': { rate: 0.10, label: 'Reduced (oils)' },
    '19': { rate: 0.04, label: 'Super-reduced (bread)' },
    '30': { rate: 0.04, label: 'Super-reduced (pharmaceuticals)' },
    '49': { rate: 0.04, label: 'Super-reduced (books)' },
  },
  // Netherlands: Standard 21%, Reduced 9%
  NL: {
    '01': { rate: 0.09, label: 'Reduced (live animals)' },
    '02': { rate: 0.09, label: 'Reduced (meat)' },
    '03': { rate: 0.09, label: 'Reduced (fish)' },
    '04': { rate: 0.09, label: 'Reduced (dairy)' },
    '07': { rate: 0.09, label: 'Reduced (vegetables)' },
    '08': { rate: 0.09, label: 'Reduced (fruit)' },
    '09': { rate: 0.09, label: 'Reduced (coffee/tea)' },
    '10': { rate: 0.09, label: 'Reduced (cereals)' },
    '19': { rate: 0.09, label: 'Reduced (bakery)' },
    '30': { rate: 0.09, label: 'Reduced (pharmaceuticals)' },
    '49': { rate: 0.09, label: 'Reduced (books)' },
  },
  // Belgium: Standard 21%, Reduced 6%
  BE: {
    '01': { rate: 0.06, label: 'Reduced (live animals)' },
    '02': { rate: 0.06, label: 'Reduced (meat)' },
    '03': { rate: 0.06, label: 'Reduced (fish)' },
    '04': { rate: 0.06, label: 'Reduced (dairy)' },
    '07': { rate: 0.06, label: 'Reduced (vegetables)' },
    '08': { rate: 0.06, label: 'Reduced (fruit)' },
    '09': { rate: 0.06, label: 'Reduced (coffee/tea)' },
    '10': { rate: 0.06, label: 'Reduced (cereals)' },
    '19': { rate: 0.06, label: 'Reduced (bakery)' },
    '30': { rate: 0.06, label: 'Reduced (pharmaceuticals)' },
    '49': { rate: 0.06, label: 'Reduced (books)' },
  },
  // Austria: Standard 20%, Reduced 10%, Super-reduced 5% (cancelled)
  AT: {
    '01': { rate: 0.10, label: 'Reduced (live animals)' },
    '02': { rate: 0.10, label: 'Reduced (meat)' },
    '03': { rate: 0.10, label: 'Reduced (fish)' },
    '04': { rate: 0.10, label: 'Reduced (dairy)' },
    '07': { rate: 0.10, label: 'Reduced (vegetables)' },
    '08': { rate: 0.10, label: 'Reduced (fruit)' },
    '10': { rate: 0.10, label: 'Reduced (cereals)' },
    '19': { rate: 0.10, label: 'Reduced (bakery)' },
    '30': { rate: 0.10, label: 'Reduced (pharmaceuticals)' },
    '49': { rate: 0.10, label: 'Reduced (books)' },
  },
  // Poland: Standard 23%, Reduced 8%, Super-reduced 5%
  PL: {
    '01': { rate: 0.05, label: 'Super-reduced (live animals)' },
    '02': { rate: 0.05, label: 'Super-reduced (meat)' },
    '03': { rate: 0.05, label: 'Super-reduced (fish)' },
    '04': { rate: 0.05, label: 'Super-reduced (dairy)' },
    '07': { rate: 0.05, label: 'Super-reduced (vegetables)' },
    '08': { rate: 0.05, label: 'Super-reduced (fruit)' },
    '10': { rate: 0.05, label: 'Super-reduced (cereals)' },
    '19': { rate: 0.08, label: 'Reduced (bakery)' },
    '30': { rate: 0.08, label: 'Reduced (pharmaceuticals)' },
    '49': { rate: 0.05, label: 'Super-reduced (books)' },
  },
  // Sweden: Standard 25%, Reduced 12%, Super-reduced 6%
  SE: {
    '01': { rate: 0.12, label: 'Reduced (live animals)' },
    '02': { rate: 0.12, label: 'Reduced (meat)' },
    '03': { rate: 0.12, label: 'Reduced (fish)' },
    '04': { rate: 0.12, label: 'Reduced (dairy)' },
    '07': { rate: 0.12, label: 'Reduced (vegetables)' },
    '08': { rate: 0.12, label: 'Reduced (fruit)' },
    '10': { rate: 0.12, label: 'Reduced (cereals)' },
    '19': { rate: 0.12, label: 'Reduced (bakery)' },
    '49': { rate: 0.06, label: 'Super-reduced (books)' },
  },
  // Portugal: Standard 23%, Reduced 13%, Super-reduced 6%
  PT: {
    '01': { rate: 0.06, label: 'Super-reduced (live animals)' },
    '02': { rate: 0.06, label: 'Super-reduced (meat)' },
    '03': { rate: 0.06, label: 'Super-reduced (fish)' },
    '04': { rate: 0.06, label: 'Super-reduced (dairy)' },
    '07': { rate: 0.06, label: 'Super-reduced (vegetables)' },
    '08': { rate: 0.06, label: 'Super-reduced (fruit)' },
    '10': { rate: 0.06, label: 'Super-reduced (cereals)' },
    '19': { rate: 0.06, label: 'Super-reduced (bread)' },
    '30': { rate: 0.06, label: 'Super-reduced (pharmaceuticals)' },
    '49': { rate: 0.06, label: 'Super-reduced (books)' },
  },
  // Ireland: Standard 23%, Reduced 13.5%, Second reduced 9%, Zero 0%
  IE: {
    '01': { rate: 0.0, label: 'Zero-rated (live animals)' },
    '02': { rate: 0.0, label: 'Zero-rated (meat)' },
    '03': { rate: 0.0, label: 'Zero-rated (fish)' },
    '04': { rate: 0.0, label: 'Zero-rated (dairy)' },
    '07': { rate: 0.0, label: 'Zero-rated (vegetables)' },
    '08': { rate: 0.0, label: 'Zero-rated (fruit)' },
    '10': { rate: 0.0, label: 'Zero-rated (cereals)' },
    '19': { rate: 0.0, label: 'Zero-rated (bread)' },
    '30': { rate: 0.0, label: 'Zero-rated (oral medicines)' },
    '49': { rate: 0.0, label: 'Zero-rated (books)' },
  },
  // Denmark: Standard 25%, no reduced rates (one of few EU countries)
  // DK has no reduced rates — all at 25%. Not listed here.

  // Greece: Standard 24%, Reduced 13%, Super-reduced 6%
  GR: {
    '01': { rate: 0.13, label: 'Reduced (live animals)' },
    '02': { rate: 0.13, label: 'Reduced (meat)' },
    '03': { rate: 0.13, label: 'Reduced (fish)' },
    '04': { rate: 0.13, label: 'Reduced (dairy)' },
    '07': { rate: 0.13, label: 'Reduced (vegetables)' },
    '08': { rate: 0.13, label: 'Reduced (fruit)' },
    '10': { rate: 0.13, label: 'Reduced (cereals)' },
    '19': { rate: 0.13, label: 'Reduced (bakery)' },
    '30': { rate: 0.06, label: 'Super-reduced (pharmaceuticals)' },
    '49': { rate: 0.06, label: 'Super-reduced (books)' },
  },
  // ── Added CW18: 15 EU member states (EU TEDB) ──
  // Finland: Standard 25.5%, Reduced 14%, Super-reduced 10%
  FI: {
    '01':{rate:0.14,label:'Reduced'},'02':{rate:0.14,label:'Reduced'},'03':{rate:0.14,label:'Reduced'},
    '04':{rate:0.14,label:'Reduced'},'07':{rate:0.14,label:'Reduced'},'08':{rate:0.14,label:'Reduced'},
    '09':{rate:0.14,label:'Reduced'},'10':{rate:0.14,label:'Reduced'},'11':{rate:0.14,label:'Reduced'},
    '15':{rate:0.14,label:'Reduced'},'16':{rate:0.14,label:'Reduced'},'19':{rate:0.14,label:'Reduced'},
    '20':{rate:0.14,label:'Reduced'},'21':{rate:0.14,label:'Reduced'},
    '30':{rate:0.10,label:'Super-reduced (pharma)'},'49':{rate:0.10,label:'Super-reduced (books)'},
  },
  // Denmark: Standard 25%, NO reduced rate — empty entry
  DK: {},
  // Czech Republic: Standard 21%, Reduced 12%
  CZ: {
    '01':{rate:0.12,label:'Reduced'},'02':{rate:0.12,label:'Reduced'},'03':{rate:0.12,label:'Reduced'},
    '04':{rate:0.12,label:'Reduced'},'07':{rate:0.12,label:'Reduced'},'08':{rate:0.12,label:'Reduced'},
    '09':{rate:0.12,label:'Reduced'},'10':{rate:0.12,label:'Reduced'},'15':{rate:0.12,label:'Reduced'},
    '16':{rate:0.12,label:'Reduced'},'19':{rate:0.12,label:'Reduced'},'20':{rate:0.12,label:'Reduced'},
    '30':{rate:0.12,label:'Reduced (pharma)'},'49':{rate:0.12,label:'Reduced (books)'},
  },
  // Romania: Standard 19%, Reduced 9%, Super-reduced 5%
  RO: {
    '01':{rate:0.09,label:'Reduced'},'02':{rate:0.09,label:'Reduced'},'03':{rate:0.09,label:'Reduced'},
    '04':{rate:0.09,label:'Reduced'},'07':{rate:0.09,label:'Reduced'},'08':{rate:0.09,label:'Reduced'},
    '10':{rate:0.09,label:'Reduced'},'15':{rate:0.09,label:'Reduced'},'16':{rate:0.09,label:'Reduced'},
    '19':{rate:0.09,label:'Reduced'},'20':{rate:0.09,label:'Reduced'},
    '30':{rate:0.09,label:'Reduced (pharma)'},'49':{rate:0.05,label:'Super-reduced (books)'},
  },
  // Hungary: Standard 27%, Reduced 18%, Super-reduced 5%
  HU: {
    '01':{rate:0.18,label:'Reduced'},'02':{rate:0.18,label:'Reduced'},'03':{rate:0.18,label:'Reduced'},
    '04':{rate:0.18,label:'Reduced'},'07':{rate:0.18,label:'Reduced'},'08':{rate:0.18,label:'Reduced'},
    '10':{rate:0.18,label:'Reduced'},'16':{rate:0.18,label:'Reduced'},'19':{rate:0.18,label:'Reduced'},
    '20':{rate:0.18,label:'Reduced'},'21':{rate:0.18,label:'Reduced'},
    '30':{rate:0.05,label:'Super-reduced (pharma)'},'49':{rate:0.05,label:'Super-reduced (books)'},
  },
  // Bulgaria: Standard 20%, Reduced 9%
  BG: {
    '01':{rate:0.09,label:'Reduced'},'02':{rate:0.09,label:'Reduced'},'03':{rate:0.09,label:'Reduced'},
    '04':{rate:0.09,label:'Reduced'},'07':{rate:0.09,label:'Reduced'},'08':{rate:0.09,label:'Reduced'},
    '10':{rate:0.09,label:'Reduced'},'49':{rate:0.09,label:'Reduced (books)'},
  },
  // Croatia: Standard 25%, Reduced 13%, Super-reduced 5%
  HR: {
    '01':{rate:0.13,label:'Reduced'},'02':{rate:0.13,label:'Reduced'},'03':{rate:0.13,label:'Reduced'},
    '04':{rate:0.13,label:'Reduced'},'07':{rate:0.05,label:'Super-reduced'},
    '08':{rate:0.05,label:'Super-reduced'},'10':{rate:0.05,label:'Super-reduced'},
    '30':{rate:0.05,label:'Super-reduced (pharma)'},'49':{rate:0.05,label:'Super-reduced (books)'},
  },
  // Slovakia: Standard 23%, Reduced 10%, Super-reduced 5%
  SK: {
    '01':{rate:0.10,label:'Reduced'},'02':{rate:0.10,label:'Reduced'},'03':{rate:0.10,label:'Reduced'},
    '04':{rate:0.10,label:'Reduced'},'07':{rate:0.10,label:'Reduced'},'08':{rate:0.10,label:'Reduced'},
    '10':{rate:0.10,label:'Reduced'},'30':{rate:0.10,label:'Reduced (pharma)'},
    '49':{rate:0.05,label:'Super-reduced (books)'},
  },
  // Slovenia: Standard 22%, Reduced 9.5%, Super-reduced 5%
  SI: {
    '01':{rate:0.095,label:'Reduced'},'02':{rate:0.095,label:'Reduced'},'03':{rate:0.095,label:'Reduced'},
    '04':{rate:0.095,label:'Reduced'},'07':{rate:0.095,label:'Reduced'},'08':{rate:0.095,label:'Reduced'},
    '30':{rate:0.095,label:'Reduced (pharma)'},'49':{rate:0.05,label:'Super-reduced (books)'},
  },
  // Lithuania: Standard 21%, Reduced 9%, Super-reduced 5%
  LT: {
    '01':{rate:0.09,label:'Reduced'},'02':{rate:0.09,label:'Reduced'},'03':{rate:0.09,label:'Reduced'},
    '04':{rate:0.09,label:'Reduced'},'07':{rate:0.09,label:'Reduced'},'08':{rate:0.09,label:'Reduced'},
    '30':{rate:0.05,label:'Super-reduced (pharma)'},'49':{rate:0.09,label:'Reduced (books)'},
  },
  // Latvia: Standard 21%, Reduced 12%, Super-reduced 5%
  LV: {
    '01':{rate:0.12,label:'Reduced'},'02':{rate:0.12,label:'Reduced'},'03':{rate:0.12,label:'Reduced'},
    '04':{rate:0.12,label:'Reduced'},'07':{rate:0.12,label:'Reduced'},'08':{rate:0.12,label:'Reduced'},
    '30':{rate:0.12,label:'Reduced (pharma)'},'49':{rate:0.05,label:'Super-reduced (books)'},
  },
  // Estonia: Standard 22%, Reduced 9%
  EE: {
    '01':{rate:0.09,label:'Reduced'},'02':{rate:0.09,label:'Reduced'},'03':{rate:0.09,label:'Reduced'},
    '04':{rate:0.09,label:'Reduced'},'07':{rate:0.09,label:'Reduced'},'08':{rate:0.09,label:'Reduced'},
    '30':{rate:0.09,label:'Reduced (pharma)'},'49':{rate:0.09,label:'Reduced (books)'},
  },
  // Luxembourg: Standard 17%, Reduced 8%, Super-reduced 3%
  LU: {
    '01':{rate:0.03,label:'Super-reduced'},'02':{rate:0.03,label:'Super-reduced'},
    '03':{rate:0.03,label:'Super-reduced'},'04':{rate:0.03,label:'Super-reduced'},
    '07':{rate:0.03,label:'Super-reduced'},'08':{rate:0.03,label:'Super-reduced'},
    '10':{rate:0.03,label:'Super-reduced'},
    '30':{rate:0.03,label:'Super-reduced (pharma)'},'49':{rate:0.03,label:'Super-reduced (books)'},
  },
  // Cyprus: Standard 19%, Reduced 9%, Super-reduced 5%
  CY: {
    '01':{rate:0.05,label:'Super-reduced'},'02':{rate:0.05,label:'Super-reduced'},
    '03':{rate:0.05,label:'Super-reduced'},'04':{rate:0.05,label:'Super-reduced'},
    '07':{rate:0.05,label:'Super-reduced'},'08':{rate:0.05,label:'Super-reduced'},
    '30':{rate:0.05,label:'Super-reduced (pharma)'},'49':{rate:0.05,label:'Super-reduced (books)'},
  },
  // Malta: Standard 18%, Reduced 7%, Super-reduced 5%
  MT: {
    '01':{rate:0.05,label:'Super-reduced'},'02':{rate:0.05,label:'Super-reduced'},
    '03':{rate:0.05,label:'Super-reduced'},'04':{rate:0.05,label:'Super-reduced'},
    '07':{rate:0.05,label:'Super-reduced'},'08':{rate:0.05,label:'Super-reduced'},
    '30':{rate:0.05,label:'Super-reduced (pharma)'},'49':{rate:0.05,label:'Super-reduced (books)'},
  },
};

/**
 * Get the EU reduced VAT rate for a specific country + HS code combination.
 *
 * @param countryCode  EU member state ISO2
 * @param hsCode       HS code (at least 2 digits)
 * @returns Reduced rate override, or null if standard rate applies
 */
export function getEuReducedVatRate(
  countryCode: string,
  hsCode: string,
): { rate: number; label: string } | null {
  const country = countryCode.toUpperCase();
  const chapter = hsCode.replace(/\./g, '').substring(0, 2);

  const countryRates = EU_REDUCED_VAT[country];
  if (!countryRates) return null;

  const override = countryRates[chapter];
  if (!override) return null;

  return { rate: override.rate, label: override.label };
}

/**
 * Check if a country has EU reduced VAT rate data.
 */
export function hasEuReducedVatData(countryCode: string): boolean {
  return countryCode.toUpperCase() in EU_REDUCED_VAT;
}
