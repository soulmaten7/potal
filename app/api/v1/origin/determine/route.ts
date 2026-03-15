/**
 * POTAL API v1 — /api/v1/origin/determine
 *
 * Determine preferential origin based on Rules of Origin.
 * Checks CTH/CC/PSR criteria for tariff shift analysis.
 *
 * POST /api/v1/origin/determine
 * Body: { raw_material_hs, finished_product_hs, manufacturing_country, fta_code? }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

// HS chapter descriptions for human-readable explanations
const CHAPTER_DESC: Record<string, string> = {
  '01': 'Live animals', '02': 'Meat', '03': 'Fish', '04': 'Dairy', '05': 'Animal products',
  '06': 'Live trees/plants', '07': 'Vegetables', '08': 'Fruit/nuts', '09': 'Coffee/tea/spices',
  '10': 'Cereals', '11': 'Milling products', '12': 'Oil seeds', '15': 'Fats/oils',
  '16': 'Meat/fish preparations', '17': 'Sugar', '18': 'Cocoa', '19': 'Cereal preparations',
  '20': 'Vegetable preparations', '21': 'Food preparations', '22': 'Beverages', '24': 'Tobacco',
  '27': 'Mineral fuels', '28': 'Inorganic chemicals', '29': 'Organic chemicals',
  '30': 'Pharmaceuticals', '31': 'Fertilizers', '32': 'Dyes/paints', '33': 'Cosmetics',
  '34': 'Soap/wax', '35': 'Albumins/glues', '38': 'Chemical products', '39': 'Plastics',
  '40': 'Rubber', '41': 'Hides/leather', '42': 'Leather articles', '43': 'Furskins',
  '44': 'Wood', '48': 'Paper', '49': 'Books/printed', '50': 'Silk', '51': 'Wool',
  '52': 'Cotton', '53': 'Vegetable fibers', '54': 'Man-made filaments', '55': 'Man-made staple fibers',
  '56': 'Wadding/nonwovens', '57': 'Carpets', '58': 'Special woven fabrics',
  '59': 'Coated textiles', '60': 'Knitted fabrics', '61': 'Knitted apparel',
  '62': 'Woven apparel', '63': 'Textile articles', '64': 'Footwear', '65': 'Headgear',
  '69': 'Ceramics', '70': 'Glass', '71': 'Jewellery', '72': 'Iron/steel',
  '73': 'Iron/steel articles', '74': 'Copper', '76': 'Aluminum',
  '84': 'Machinery', '85': 'Electronics', '87': 'Vehicles', '88': 'Aircraft',
  '90': 'Instruments', '94': 'Furniture', '95': 'Toys', '96': 'Miscellaneous',
};

function getChapterDesc(chapter: string): string {
  return CHAPTER_DESC[chapter] || `Chapter ${chapter}`;
}

export const POST = withApiAuth(async (req: NextRequest, _context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const rawHs = typeof body.raw_material_hs === 'string' ? body.raw_material_hs.replace(/[^0-9]/g, '') : '';
  const finishedHs = typeof body.finished_product_hs === 'string' ? body.finished_product_hs.replace(/[^0-9]/g, '') : '';
  const mfgCountry = typeof body.manufacturing_country === 'string' ? body.manufacturing_country.toUpperCase().trim() : '';
  const ftaCode = typeof body.fta_code === 'string' ? body.fta_code.toUpperCase().trim() : undefined;

  if (!rawHs || rawHs.length < 4) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide valid raw_material_hs (at least 4 digits).');
  }
  if (!finishedHs || finishedHs.length < 4) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide valid finished_product_hs (at least 4 digits).');
  }
  if (!mfgCountry || mfgCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide valid manufacturing_country (ISO 2-letter code).');
  }

  const rawChapter = rawHs.substring(0, 2);
  const finishedChapter = finishedHs.substring(0, 2);
  const rawHeading = rawHs.substring(0, 4);
  const finishedHeading = finishedHs.substring(0, 4);
  const rawSubheading = rawHs.substring(0, 6);
  const finishedSubheading = finishedHs.substring(0, 6);

  // Determine tariff shift levels
  const ccMet = rawChapter !== finishedChapter; // Change of Chapter
  const cthMet = rawHeading !== finishedHeading; // Change of Tariff Heading
  const ctshMet = rawSubheading !== finishedSubheading; // Change of Tariff Sub-Heading

  const rawChapterDesc = getChapterDesc(rawChapter);
  const finishedChapterDesc = getChapterDesc(finishedChapter);

  // Build explanation
  let ruleMet: string;
  let explanation: string;

  if (ccMet) {
    ruleMet = 'CC';
    explanation = `Raw material ${rawHs} (${rawChapterDesc}, Ch.${rawChapter}) → Finished product ${finishedHs} (${finishedChapterDesc}, Ch.${finishedChapter}): Chapter change ${rawChapter}→${finishedChapter} = CC (Change of Chapter) met`;
  } else if (cthMet) {
    ruleMet = 'CTH';
    explanation = `Raw material ${rawHs} (Heading ${rawHeading}) → Finished product ${finishedHs} (Heading ${finishedHeading}): Heading change ${rawHeading}→${finishedHeading} = CTH (Change of Tariff Heading) met`;
  } else if (ctshMet) {
    ruleMet = 'CTSH';
    explanation = `Raw material ${rawHs} (Subheading ${rawSubheading}) → Finished product ${finishedHs} (Subheading ${finishedSubheading}): Subheading change = CTSH (Change of Tariff Sub-Heading) met`;
  } else {
    ruleMet = 'NONE';
    explanation = `Raw material ${rawHs} and finished product ${finishedHs} are in the same subheading (${rawSubheading}). No tariff shift — substantial transformation not demonstrated by CTC alone. Consider RVC or specific processing rules.`;
  }

  // Check PSR if fta_code provided
  let psrResult: {
    fta_code: string;
    rule_type: string;
    rule_text: string | null;
    threshold_pct: number | null;
    psr_met: boolean;
    psr_explanation: string;
  } | null = null;

  if (ftaCode) {
    const supabase = getSupabase();
    const hs6 = finishedHs.substring(0, 6);

    try {
      const { data: psr } = await supabase
        .from('product_specific_rules')
        .select('rule_type, rule_text, threshold_pct')
        .eq('fta_code', ftaCode)
        .or(`hs6_code.eq.${hs6},hs6_code.like.${finishedHs.substring(0, 4)}%`)
        .limit(1)
        .single();

      if (psr) {
        // Check if the PSR criterion is met
        let psrMet = false;
        let psrExplanation = '';

        switch (psr.rule_type) {
          case 'CC':
            psrMet = ccMet;
            psrExplanation = ccMet
              ? `${ftaCode} PSR requires CC (Change of Chapter): Met — Chapter ${rawChapter}→${finishedChapter}`
              : `${ftaCode} PSR requires CC: Not met — same chapter ${rawChapter}`;
            break;
          case 'CTH':
            psrMet = cthMet;
            psrExplanation = cthMet
              ? `${ftaCode} PSR requires CTH (Change of Tariff Heading): Met — Heading ${rawHeading}→${finishedHeading}`
              : `${ftaCode} PSR requires CTH: Not met — same heading ${rawHeading}`;
            break;
          case 'CTSH':
            psrMet = ctshMet;
            psrExplanation = ctshMet
              ? `${ftaCode} PSR requires CTSH (Change of Sub-Heading): Met — Subheading ${rawSubheading}→${finishedSubheading}`
              : `${ftaCode} PSR requires CTSH: Not met — same subheading ${rawSubheading}`;
            break;
          case 'RVC':
            psrMet = false; // Cannot determine without value data
            psrExplanation = `${ftaCode} PSR requires RVC (Regional Value Content) of ${psr.threshold_pct}%. Use /api/v1/roo/rvc-calc to calculate.`;
            break;
          case 'SP':
            psrMet = false; // Cannot determine automatically
            psrExplanation = `${ftaCode} PSR requires specific processing: "${psr.rule_text}". Manual verification needed.`;
            break;
          default:
            psrMet = cthMet;
            psrExplanation = `${ftaCode} PSR rule type ${psr.rule_type}: ${psr.rule_text}`;
        }

        psrResult = {
          fta_code: ftaCode,
          rule_type: psr.rule_type,
          rule_text: psr.rule_text,
          threshold_pct: psr.threshold_pct,
          psr_met: psrMet,
          psr_explanation: psrExplanation,
        };
      }
    } catch { /* no PSR found */ }
  }

  // Determine if preferential treatment is possible
  const preferentialEligible = psrResult
    ? psrResult.psr_met
    : (ccMet || cthMet); // Default: CTH or CC generally qualifies

  return apiSuccess({
    origin_country: mfgCountry,
    raw_material_hs: rawHs,
    finished_product_hs: finishedHs,
    tariff_shift: {
      cc_met: ccMet,
      cth_met: cthMet,
      ctsh_met: ctshMet,
      raw_chapter: `${rawChapter} (${rawChapterDesc})`,
      finished_chapter: `${finishedChapter} (${finishedChapterDesc})`,
      raw_heading: rawHeading,
      finished_heading: finishedHeading,
    },
    rule_met: ruleMet,
    explanation,
    preferential_eligible: preferentialEligible,
    psr: psrResult,
    recommendation: !preferentialEligible
      ? 'Tariff shift criteria not met. Consider: (1) Use different raw materials from a different HS chapter, (2) Meet RVC threshold, (3) Check if specific processing rules apply.'
      : `Product manufactured in ${mfgCountry} qualifies for preferential origin treatment based on ${ruleMet} criteria.`,
  }, {
    sellerId: _context.sellerId,
    plan: _context.planId,
  });
});
