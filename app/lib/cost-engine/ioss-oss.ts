/**
 * POTAL F033 — IOSS / OSS Support
 *
 * EU Import One-Stop Shop (IOSS) and One-Stop Shop (OSS) VAT handling.
 *
 * IOSS: For consignments ≤€150 from non-EU sellers to EU buyers.
 *   - Seller registers for IOSS and collects VAT at point of sale.
 *   - No import VAT or customs duty at border.
 *   - Seller remits VAT via monthly IOSS return.
 *
 * OSS: For intra-EU distance sales (EU seller → EU buyer in another member state).
 *   - Seller registers in one EU member state.
 *   - Applies destination country VAT rate.
 *   - Reports via quarterly OSS return.
 *
 * Key thresholds:
 *   IOSS: ≤€150 intrinsic value (excl. transport/insurance)
 *   OSS: €10,000 annual cross-border sales threshold
 */

// ─── Types ──────────────────────────────────────────

export interface IossRegistration {
  /** IOSS identification number (IM followed by 10 digits) */
  iossNumber: string;
  /** Member state of registration */
  registrationCountry: string;
  /** Whether registration is active */
  isActive: boolean;
}

export interface IossCalculation {
  /** Whether IOSS applies */
  iossApplicable: boolean;
  /** Reason IOSS does not apply (if not applicable) */
  notApplicableReason?: string;
  /** Whether the seller has an IOSS registration */
  sellerRegistered: boolean;
  /** VAT rate at destination */
  vatRate: number;
  /** VAT amount collected at point of sale */
  vatAmount: number;
  /** Whether customs duty is waived (always true under IOSS ≤€150) */
  dutyWaived: boolean;
  /** Threshold value in EUR */
  thresholdEur: number;
  /** Declared value in EUR */
  declaredValueEur: number;
  /** IOSS number (if registered) */
  iossNumber?: string;
  /** Filing obligation */
  filingObligation: string;
}

export interface OssCalculation {
  /** Whether OSS applies */
  ossApplicable: boolean;
  /** OSS scheme type: 'union' (EU seller) | 'non-union' (non-EU services) | 'import' (same as IOSS) */
  schemeType?: 'union' | 'non-union' | 'import';
  /** Destination country VAT rate */
  vatRate: number;
  /** VAT amount */
  vatAmount: number;
  /** Whether the €10K threshold has been exceeded */
  thresholdExceeded?: boolean;
  /** Filing obligation */
  filingObligation: string;
}

// ─── EU Member State VAT Rates ──────────────────────

const EU_VAT_RATES: Record<string, number> = {
  AT: 0.20, BE: 0.21, BG: 0.20, HR: 0.25, CY: 0.19,
  CZ: 0.21, DK: 0.25, EE: 0.22, FI: 0.255, FR: 0.20,
  DE: 0.19, GR: 0.24, HU: 0.27, IE: 0.23, IT: 0.22,
  LV: 0.21, LT: 0.21, LU: 0.17, MT: 0.18, NL: 0.21,
  PL: 0.23, PT: 0.23, RO: 0.19, SK: 0.20, SI: 0.22,
  ES: 0.21, SE: 0.25,
};

const EU_COUNTRIES = new Set(Object.keys(EU_VAT_RATES));

// IOSS threshold: €150 intrinsic value
const IOSS_THRESHOLD_EUR = 150;

// OSS intra-EU threshold: €10,000 annual
const OSS_THRESHOLD_EUR = 10000;

// ─── IOSS Calculation ───────────────────────────────

/**
 * Calculate IOSS VAT for a shipment to an EU destination.
 *
 * @param declaredValueEur - Intrinsic value in EUR (excl. transport/insurance)
 * @param destinationCountry - EU member state ISO code
 * @param originCountry - Seller's country ISO code
 * @param iossNumber - Seller's IOSS number (if registered)
 */
export function calculateIoss(
  declaredValueEur: number,
  destinationCountry: string,
  originCountry: string,
  iossNumber?: string,
): IossCalculation {
  const dest = destinationCountry.toUpperCase();
  const origin = originCountry.toUpperCase();

  // Check if destination is EU
  if (!EU_COUNTRIES.has(dest)) {
    return {
      iossApplicable: false,
      notApplicableReason: `${dest} is not an EU member state.`,
      sellerRegistered: !!iossNumber,
      vatRate: 0,
      vatAmount: 0,
      dutyWaived: false,
      thresholdEur: IOSS_THRESHOLD_EUR,
      declaredValueEur,
      filingObligation: 'N/A',
    };
  }

  // Check if origin is EU (IOSS is for non-EU → EU only)
  if (EU_COUNTRIES.has(origin)) {
    return {
      iossApplicable: false,
      notApplicableReason: 'IOSS is for non-EU to EU shipments. Use OSS for intra-EU distance sales.',
      sellerRegistered: !!iossNumber,
      vatRate: EU_VAT_RATES[dest] || 0.21,
      vatAmount: 0,
      dutyWaived: false,
      thresholdEur: IOSS_THRESHOLD_EUR,
      declaredValueEur,
      filingObligation: 'OSS (intra-EU)',
    };
  }

  // Check threshold
  if (declaredValueEur > IOSS_THRESHOLD_EUR) {
    return {
      iossApplicable: false,
      notApplicableReason: `Value €${declaredValueEur.toFixed(2)} exceeds IOSS threshold of €${IOSS_THRESHOLD_EUR}. Standard import VAT and customs duty apply.`,
      sellerRegistered: !!iossNumber,
      vatRate: EU_VAT_RATES[dest] || 0.21,
      vatAmount: 0,
      dutyWaived: false,
      thresholdEur: IOSS_THRESHOLD_EUR,
      declaredValueEur,
      filingObligation: 'Standard import declaration',
    };
  }

  const vatRate = EU_VAT_RATES[dest] || 0.21;
  const vatAmount = Math.round(declaredValueEur * vatRate * 100) / 100;

  return {
    iossApplicable: true,
    sellerRegistered: !!iossNumber,
    vatRate,
    vatAmount,
    dutyWaived: true,
    thresholdEur: IOSS_THRESHOLD_EUR,
    declaredValueEur,
    iossNumber,
    filingObligation: iossNumber
      ? 'Monthly IOSS VAT return via registration member state'
      : 'Register for IOSS to collect VAT at point of sale and avoid border delays',
  };
}

// ─── OSS Calculation ────────────────────────────────

/**
 * Calculate OSS VAT for intra-EU distance sales.
 *
 * @param saleValueEur - Sale value in EUR
 * @param destinationCountry - Buyer's EU member state
 * @param originCountry - Seller's EU member state
 * @param annualCrossBorderSalesEur - Seller's annual cross-border EU sales
 */
export function calculateOss(
  saleValueEur: number,
  destinationCountry: string,
  originCountry: string,
  annualCrossBorderSalesEur?: number,
): OssCalculation {
  const dest = destinationCountry.toUpperCase();
  const origin = originCountry.toUpperCase();

  if (!EU_COUNTRIES.has(dest)) {
    return {
      ossApplicable: false,
      vatRate: 0,
      vatAmount: 0,
      filingObligation: `${dest} is not an EU member state.`,
    };
  }

  // Non-EU seller → EU: this is IOSS territory for goods, non-union OSS for services
  if (!EU_COUNTRIES.has(origin)) {
    return {
      ossApplicable: false,
      schemeType: 'non-union',
      vatRate: EU_VAT_RATES[dest] || 0.21,
      vatAmount: 0,
      filingObligation: 'Non-EU sellers: use IOSS for goods ≤€150, or standard import for goods >€150.',
    };
  }

  // Intra-EU: same country = domestic sale
  if (dest === origin) {
    const vatRate = EU_VAT_RATES[origin] || 0.21;
    return {
      ossApplicable: false,
      vatRate,
      vatAmount: Math.round(saleValueEur * vatRate * 100) / 100,
      filingObligation: 'Domestic sale — report via standard domestic VAT return.',
    };
  }

  // Check threshold
  const thresholdExceeded = annualCrossBorderSalesEur !== undefined
    ? annualCrossBorderSalesEur > OSS_THRESHOLD_EUR
    : true; // Default: assume threshold exceeded (conservative)

  const vatRate = EU_VAT_RATES[dest] || 0.21;
  const vatAmount = Math.round(saleValueEur * vatRate * 100) / 100;

  if (!thresholdExceeded) {
    // Below €10K: seller can apply home country VAT rate
    const homeVatRate = EU_VAT_RATES[origin] || 0.21;
    return {
      ossApplicable: false,
      schemeType: 'union',
      vatRate: homeVatRate,
      vatAmount: Math.round(saleValueEur * homeVatRate * 100) / 100,
      thresholdExceeded: false,
      filingObligation: `Annual cross-border sales ≤€${OSS_THRESHOLD_EUR}. Home country VAT (${(homeVatRate * 100).toFixed(0)}%) applies. Opt into OSS for destination rate.`,
    };
  }

  return {
    ossApplicable: true,
    schemeType: 'union',
    vatRate,
    vatAmount,
    thresholdExceeded: true,
    filingObligation: 'Quarterly OSS VAT return via registration member state. Destination country VAT rate applies.',
  };
}

// ─── Combined IOSS/OSS Check ────────────────────────

export interface IossOssResult {
  ioss?: IossCalculation;
  oss?: OssCalculation;
  recommendation: string;
}

/**
 * Determine which VAT scheme applies (IOSS or OSS) based on the shipment details.
 */
export function checkIossOss(params: {
  declaredValueEur: number;
  destinationCountry: string;
  originCountry: string;
  iossNumber?: string;
  annualCrossBorderSalesEur?: number;
}): IossOssResult {
  const { destinationCountry, originCountry } = params;
  const dest = destinationCountry.toUpperCase();
  const origin = originCountry.toUpperCase();

  // Non-EU → EU: check IOSS
  if (!EU_COUNTRIES.has(origin) && EU_COUNTRIES.has(dest)) {
    const ioss = calculateIoss(
      params.declaredValueEur,
      dest,
      origin,
      params.iossNumber,
    );

    return {
      ioss,
      recommendation: ioss.iossApplicable
        ? (ioss.sellerRegistered
          ? `Collect €${ioss.vatAmount.toFixed(2)} VAT at checkout. No duty at border.`
          : 'Register for IOSS to simplify EU imports ≤€150 and avoid buyer delays at customs.')
        : 'Value exceeds €150 — standard import VAT and customs duty apply at border.',
    };
  }

  // EU → EU: check OSS
  if (EU_COUNTRIES.has(origin) && EU_COUNTRIES.has(dest)) {
    const oss = calculateOss(
      params.declaredValueEur,
      dest,
      origin,
      params.annualCrossBorderSalesEur,
    );

    return {
      oss,
      recommendation: oss.ossApplicable
        ? `Apply ${dest} VAT rate (${(oss.vatRate * 100).toFixed(0)}%). Report via OSS quarterly return.`
        : oss.filingObligation,
    };
  }

  return {
    recommendation: 'Neither IOSS nor OSS applies for this origin/destination combination.',
  };
}
