/**
 * EU Seasonal Tariffs — Entry Price System (TARIC)
 * Source: EU TARIC Entry Price System — 2026-03-18
 * Total: 13 products
 *
 * EU uses an Entry Price System (EPS) for fresh fruits & vegetables.
 * When import price falls below the entry price threshold, an additional
 * ad valorem duty applies. Rates vary by season (higher/lower duty periods).
 */

export interface EUSeasonalProduct {
  product: string;
  hs: string;
  season: string;
  /** Month ranges when HIGHER duty applies (1=Jan, 12=Dec) */
  higherMonths?: number[];
  /** Month ranges when LOWER duty applies */
  lowerMonths?: number[];
}

export interface EUSeasonalResult {
  found: boolean;
  product?: EUSeasonalProduct;
  /** Whether current month is in higher-duty period */
  isHighSeason: boolean;
  note: string;
}

// Month name → number mapping
const MONTH_MAP: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

const EU_SEASONAL_PRODUCTS: EUSeasonalProduct[] = [
  {
    product: "Tomatoes",
    hs: "0702",
    season: "Oct-Jun higher, Jul-Sep lower",
    higherMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6],
    lowerMonths: [7, 8, 9],
  },
  {
    product: "Cucumbers",
    hs: "0707",
    season: "Nov-May higher",
    higherMonths: [11, 12, 1, 2, 3, 4, 5],
    lowerMonths: [6, 7, 8, 9, 10],
  },
  {
    product: "Table grapes",
    hs: "0806.10",
    season: "Nov-Jul higher",
    higherMonths: [11, 12, 1, 2, 3, 4, 5, 6, 7],
    lowerMonths: [8, 9, 10],
  },
  {
    product: "Apples",
    hs: "0808.10",
    season: "Apr-Jul lower, Aug-Mar higher",
    higherMonths: [8, 9, 10, 11, 12, 1, 2, 3],
    lowerMonths: [4, 5, 6, 7],
  },
  {
    product: "Pears",
    hs: "0808.30",
    season: "Aug-Nov lower",
    higherMonths: [12, 1, 2, 3, 4, 5, 6, 7],
    lowerMonths: [8, 9, 10, 11],
  },
  {
    product: "Cherries",
    hs: "0809.21",
    season: "May-Jul lower",
    higherMonths: [8, 9, 10, 11, 12, 1, 2, 3, 4],
    lowerMonths: [5, 6, 7],
  },
  {
    product: "Peaches",
    hs: "0809.30",
    season: "Jun-Sep lower",
    higherMonths: [10, 11, 12, 1, 2, 3, 4, 5],
    lowerMonths: [6, 7, 8, 9],
  },
  {
    product: "Oranges",
    hs: "0805.10",
    season: "Jun-Nov lower (Southern Hemisphere)",
    higherMonths: [12, 1, 2, 3, 4, 5],
    lowerMonths: [6, 7, 8, 9, 10, 11],
  },
  {
    product: "Lemons",
    hs: "0805.50",
    season: "Jun-Oct lower",
    higherMonths: [11, 12, 1, 2, 3, 4, 5],
    lowerMonths: [6, 7, 8, 9, 10],
  },
  {
    product: "Clementines",
    hs: "0805.20",
    season: "Nov-Feb lower",
    higherMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    lowerMonths: [11, 12, 1, 2],
  },
  {
    product: "Courgettes",
    hs: "0709.93",
    season: "Apr-Dec lower",
    higherMonths: [1, 2, 3],
    lowerMonths: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    product: "Artichokes",
    hs: "0709.91",
    season: "Nov-Jun standard",
    higherMonths: [],
    lowerMonths: [],
  },
  {
    product: "Plums",
    hs: "0809.40",
    season: "Jun-Sep lower",
    higherMonths: [10, 11, 12, 1, 2, 3, 4, 5],
    lowerMonths: [6, 7, 8, 9],
  },
];

/**
 * Look up EU seasonal tariff status for a given HS code.
 * @param hsCode HS code (4+ digits)
 * @param month  Month number (1-12), defaults to current month
 */
export function lookupEUSeasonalTariff(hsCode: string, month?: number): EUSeasonalResult {
  const currentMonth = month ?? new Date().getMonth() + 1;
  const clean = hsCode.replace(/[.\s]/g, '');

  const product = EU_SEASONAL_PRODUCTS.find(p => {
    const ph = p.hs.replace(/[.\s]/g, '');
    return clean.startsWith(ph) || ph.startsWith(clean.substring(0, 4));
  });

  if (!product) {
    return { found: false, isHighSeason: false, note: 'No EU seasonal tariff applies' };
  }

  const isHighSeason = (product.higherMonths?.includes(currentMonth) ?? false);
  const isLowSeason = (product.lowerMonths?.includes(currentMonth) ?? false);

  let seasonNote = '';
  if (isHighSeason) seasonNote = 'High-duty season (entry price threshold active)';
  else if (isLowSeason) seasonNote = 'Low-duty season (reduced entry price threshold)';
  else seasonNote = 'Standard season';

  return {
    found: true,
    product,
    isHighSeason,
    note: `${product.product} (${product.hs}): ${seasonNote}. Season rule: ${product.season}`,
  };
}
