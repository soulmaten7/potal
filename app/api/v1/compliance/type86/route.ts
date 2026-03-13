/**
 * POTAL API v1 — /api/v1/compliance/type86
 *
 * US Type 86 Entry validation endpoint.
 * Type 86 = Section 321 de minimis entry ($800 threshold) for low-value shipments.
 *
 * POST /api/v1/compliance/type86
 * Body: {
 *   shipmentValue: number,       // required — total shipment value in USD
 *   currency?: string,           // default: USD
 *   goods: [{
 *     description: string,
 *     hsCode?: string,
 *     quantity: number,
 *     value: number,
 *     countryOfOrigin: string,
 *   }],
 *   consignee: { name: string, address?: string },
 *   shipper?: { name?: string, country?: string },
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── Constants ─────────────────────────────────────

const DE_MINIMIS_THRESHOLD_USD = 800;

// Products excluded from Section 321 de minimis (by HS chapter/heading)
const EXCLUDED_CATEGORIES: { chapters: string[]; description: string }[] = [
  { chapters: ['04', '15', '17', '18', '19', '20', '21'], description: 'Certain agricultural products subject to ADD/CVD' },
  { chapters: ['22'], description: 'Beverages and spirits (subject to FDA/TTB)' },
  { chapters: ['24'], description: 'Tobacco and manufactured tobacco substitutes' },
  { chapters: ['30'], description: 'Pharmaceutical products (if regulated)' },
  { chapters: ['93'], description: 'Arms and ammunition' },
  { chapters: ['97'], description: 'Works of art, antiques (if over threshold)' },
];

// Countries with Section 301 additional duties (may affect Type 86 eligibility)
const SECTION_301_COUNTRIES = new Set(['CN']);

// ─── Validation ────────────────────────────────────

interface Type86Issue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface GoodsItem {
  description?: string;
  hsCode?: string;
  quantity?: number;
  value?: number;
  countryOfOrigin?: string;
}

function validateType86(
  shipmentValue: number,
  goods: GoodsItem[],
  shipperCountry?: string,
): { eligible: boolean; issues: Type86Issue[]; entryType: string } {
  const issues: Type86Issue[] = [];
  let eligible = true;

  // Check de minimis threshold
  if (shipmentValue > DE_MINIMIS_THRESHOLD_USD) {
    eligible = false;
    issues.push({
      field: 'shipmentValue',
      severity: 'error',
      message: `Shipment value $${shipmentValue.toFixed(2)} exceeds Section 321 de minimis threshold of $${DE_MINIMIS_THRESHOLD_USD}. Use formal entry (Type 01/11) instead.`,
    });
  }

  // Check for excluded product categories
  for (const item of goods) {
    if (item.hsCode) {
      const chapter = item.hsCode.replace(/\./g, '').substring(0, 2);
      const excluded = EXCLUDED_CATEGORIES.find(cat => cat.chapters.includes(chapter));
      if (excluded) {
        eligible = false;
        issues.push({
          field: `goods.hsCode`,
          severity: 'error',
          message: `HS chapter ${chapter} (${excluded.description}) may be excluded from Type 86/Section 321 de minimis.`,
        });
      }
    }

    // Validate goods data
    if (!item.description || item.description.length < 3) {
      issues.push({
        field: 'goods.description',
        severity: 'warning',
        message: 'Specific product description required. CBP may reject vague descriptions.',
      });
    }

    if (!item.countryOfOrigin) {
      issues.push({
        field: 'goods.countryOfOrigin',
        severity: 'error',
        message: 'Country of origin is required for all Type 86 entries.',
      });
      eligible = false;
    }
  }

  // Check Section 301 countries
  const hasSection301Origin = goods.some(g =>
    g.countryOfOrigin && SECTION_301_COUNTRIES.has(g.countryOfOrigin.toUpperCase())
  );
  if (hasSection301Origin || (shipperCountry && SECTION_301_COUNTRIES.has(shipperCountry.toUpperCase()))) {
    issues.push({
      field: 'countryOfOrigin',
      severity: 'warning',
      message: 'Goods from China (Section 301 country): Type 86 is currently allowed but subject to policy changes. Some AD/CVD products from China are excluded from Section 321.',
    });
  }

  // CBP requirement: one entry per person per day
  issues.push({
    field: 'general',
    severity: 'info',
    message: 'CBP limits Section 321 to one shipment per person per day. Multiple shipments to the same consignee on the same day may be aggregated.',
  });

  const entryType = eligible ? 'Type 86 (Section 321 de minimis)' : 'Type 01/11 (Formal Entry)';

  return { eligible, issues, entryType };
}

// ─── Handler ───────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const shipmentValue = typeof body.shipmentValue === 'number' ? body.shipmentValue : NaN;
  if (isNaN(shipmentValue) || shipmentValue < 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"shipmentValue" must be a positive number.');
  }

  const goods: GoodsItem[] = Array.isArray(body.goods) ? body.goods as GoodsItem[] : [];
  if (goods.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"goods" array is required with at least one item.');
  }

  const shipper = body.shipper && typeof body.shipper === 'object'
    ? body.shipper as Record<string, unknown> : {};
  const shipperCountry = typeof shipper.country === 'string' ? shipper.country : undefined;

  const consignee = body.consignee && typeof body.consignee === 'object'
    ? body.consignee as Record<string, unknown> : {};
  if (!consignee.name) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"consignee.name" is required.');
  }

  const { eligible, issues, entryType } = validateType86(shipmentValue, goods, shipperCountry);

  return apiSuccess(
    {
      eligible,
      entryType,
      shipmentValue,
      deMinimisThreshold: DE_MINIMIS_THRESHOLD_USD,
      currency: 'USD',
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      issues,
      requirements: eligible ? {
        filingMethod: 'ACE (Automated Commercial Environment)',
        dataElements: [
          'Shipper name and address',
          'Consignee name and address',
          'Country of origin per item',
          'Product description per item',
          'HS code (6+ digits) per item',
          'Quantity and value per item',
          'Gross weight',
        ],
        timeline: 'Must be filed before arrival. Processing typically within 15 minutes.',
      } : {
        filingMethod: 'Formal entry through licensed customs broker',
        note: 'Shipment exceeds de minimis or contains excluded goods. Full entry required with bond.',
      },
    },
    {
      sellerId: context.sellerId,
      plan: context.planId,
    }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { shipmentValue: 150, goods: [{description: "...", hsCode: "...", quantity: 1, value: 150, countryOfOrigin: "CN"}], consignee: {name: "..."} }'
  );
}
