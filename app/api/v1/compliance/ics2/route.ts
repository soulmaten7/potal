/**
 * POTAL API v1 — /api/v1/compliance/ics2
 *
 * EU ICS2 (Import Control System 2) compliance check.
 * Validates shipment data against ICS2 ENS (Entry Summary Declaration) requirements.
 *
 * ICS2 requires advance cargo information for all goods entering the EU.
 * Release 3 (2024+): All transport modes — full dataset required.
 *
 * POST /api/v1/compliance/ics2
 * Body: {
 *   shipper: { name, address, country, eori? },
 *   consignee: { name, address, country, eori? },
 *   goods: [{ description, hsCode, quantity, weight, value, countryOfOrigin }],
 *   transport: { mode: 'air'|'sea'|'road'|'rail', carrierName?, mawb?, hawb? },
 *   routing: { departureCountry, entryPoint? }
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── Types ─────────────────────────────────────────

interface Party {
  name?: string;
  address?: string;
  country?: string;
  eori?: string;
}

interface GoodsItem {
  description?: string;
  hsCode?: string;
  quantity?: number;
  weight?: number;
  value?: number;
  countryOfOrigin?: string;
}

interface Transport {
  mode?: string;
  carrierName?: string;
  mawb?: string;
  hawb?: string;
}

interface ICS2Issue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
  ics2Reference?: string;
}

// EU member states
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

const VALID_TRANSPORT_MODES = ['air', 'sea', 'road', 'rail'];

// EORI format: 2-letter country code + up to 15 alphanumeric characters
const EORI_PATTERN = /^[A-Z]{2}[A-Z0-9]{1,15}$/;

// ─── ICS2 Validation ───────────────────────────────

function validateICS2(
  shipper: Party,
  consignee: Party,
  goods: GoodsItem[],
  transport: Transport,
  departureCountry?: string,
): ICS2Issue[] {
  const issues: ICS2Issue[] = [];

  // Check if destination is EU
  if (consignee.country && !EU_COUNTRIES.has(consignee.country.toUpperCase())) {
    issues.push({
      field: 'consignee.country',
      severity: 'warning',
      message: `ICS2 applies to EU imports. Consignee country "${consignee.country}" is not an EU member state.`,
    });
  }

  // Shipper validation
  if (!shipper.name) {
    issues.push({ field: 'shipper.name', severity: 'error', message: 'Shipper name is required for ICS2 ENS.', ics2Reference: 'Art. 127(1) UCC' });
  }
  if (!shipper.address) {
    issues.push({ field: 'shipper.address', severity: 'error', message: 'Shipper full address is required.', ics2Reference: 'Art. 127(1) UCC' });
  }
  if (!shipper.country) {
    issues.push({ field: 'shipper.country', severity: 'error', message: 'Shipper country is required.', ics2Reference: 'Art. 127(1) UCC' });
  }

  // Consignee validation
  if (!consignee.name) {
    issues.push({ field: 'consignee.name', severity: 'error', message: 'Consignee name is required for ICS2 ENS.', ics2Reference: 'Art. 127(2) UCC' });
  }
  if (!consignee.address) {
    issues.push({ field: 'consignee.address', severity: 'error', message: 'Consignee full address is required.', ics2Reference: 'Art. 127(2) UCC' });
  }

  // EORI validation (required for EU-established entities)
  if (consignee.eori) {
    if (!EORI_PATTERN.test(consignee.eori.toUpperCase())) {
      issues.push({ field: 'consignee.eori', severity: 'error', message: 'EORI format invalid. Expected: 2-letter country code + up to 15 alphanumeric chars.' });
    }
  } else if (consignee.country && EU_COUNTRIES.has(consignee.country.toUpperCase())) {
    issues.push({ field: 'consignee.eori', severity: 'warning', message: 'EORI number recommended for EU-based consignees.', ics2Reference: 'Art. 9 UCC' });
  }

  // Goods validation
  if (!goods || goods.length === 0) {
    issues.push({ field: 'goods', severity: 'error', message: 'At least one goods item is required.', ics2Reference: 'Art. 127(3) UCC' });
  } else {
    goods.forEach((item, i) => {
      if (!item.description || item.description.length < 3) {
        issues.push({
          field: `goods[${i}].description`,
          severity: 'error',
          message: `Goods item ${i + 1}: Description is required and must be specific (min 3 chars). ICS2 rejects vague descriptions like "goods" or "samples".`,
          ics2Reference: 'ICS2 Release 3 Data Requirements',
        });
      }

      // HS code — at least 6 digits required for ICS2
      if (!item.hsCode) {
        issues.push({
          field: `goods[${i}].hsCode`,
          severity: 'error',
          message: `Goods item ${i + 1}: HS code is required (minimum 6 digits).`,
          ics2Reference: 'ICS2 Release 3 — commodity code',
        });
      } else {
        const cleanHs = item.hsCode.replace(/\./g, '');
        if (cleanHs.length < 6) {
          issues.push({
            field: `goods[${i}].hsCode`,
            severity: 'error',
            message: `Goods item ${i + 1}: HS code must be at least 6 digits. Got "${item.hsCode}".`,
            ics2Reference: 'ICS2 Release 3 — commodity code',
          });
        }
      }

      if (!item.weight || item.weight <= 0) {
        issues.push({
          field: `goods[${i}].weight`,
          severity: 'error',
          message: `Goods item ${i + 1}: Gross weight in kg is required.`,
          ics2Reference: 'Art. 127(4) UCC',
        });
      }

      if (!item.value || item.value <= 0) {
        issues.push({
          field: `goods[${i}].value`,
          severity: 'warning',
          message: `Goods item ${i + 1}: Declared value is recommended.`,
        });
      }

      if (!item.countryOfOrigin) {
        issues.push({
          field: `goods[${i}].countryOfOrigin`,
          severity: 'warning',
          message: `Goods item ${i + 1}: Country of origin recommended for risk assessment.`,
        });
      }
    });
  }

  // Transport validation
  if (!transport.mode || !VALID_TRANSPORT_MODES.includes(transport.mode)) {
    issues.push({
      field: 'transport.mode',
      severity: 'error',
      message: `Transport mode is required. Valid: ${VALID_TRANSPORT_MODES.join(', ')}`,
      ics2Reference: 'ICS2 Release 3',
    });
  }

  // Air transport requires MAWB/HAWB
  if (transport.mode === 'air') {
    if (!transport.mawb) {
      issues.push({
        field: 'transport.mawb',
        severity: 'warning',
        message: 'Master Air Waybill (MAWB) number is recommended for air shipments.',
        ics2Reference: 'ICS2 Release 2+ Air Cargo',
      });
    }
  }

  // Departure country
  if (!departureCountry) {
    issues.push({
      field: 'routing.departureCountry',
      severity: 'error',
      message: 'Departure country is required for ENS filing.',
      ics2Reference: 'Art. 127(1) UCC',
    });
  }

  return issues;
}

// ─── Handler ───────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const shipper: Party = body.shipper && typeof body.shipper === 'object'
    ? body.shipper as Party : {};
  const consignee: Party = body.consignee && typeof body.consignee === 'object'
    ? body.consignee as Party : {};
  const goods: GoodsItem[] = Array.isArray(body.goods)
    ? body.goods as GoodsItem[] : [];
  const transport: Transport = body.transport && typeof body.transport === 'object'
    ? body.transport as Transport : {};
  const routing = body.routing && typeof body.routing === 'object'
    ? body.routing as Record<string, unknown> : {};
  const departureCountry = typeof routing.departureCountry === 'string'
    ? routing.departureCountry.toUpperCase().trim() : undefined;

  const issues = validateICS2(shipper, consignee, goods, transport, departureCountry);

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  const status: 'compliant' | 'non_compliant' | 'warnings' =
    errorCount > 0 ? 'non_compliant'
      : warningCount > 0 ? 'warnings'
        : 'compliant';

  return apiSuccess(
    {
      ics2Status: status,
      compliant: errorCount === 0,
      errors: errorCount,
      warnings: warningCount,
      issues,
      filingRequirements: {
        ensRequired: true,
        ensDeadline: transport.mode === 'air' ? '4 hours before loading at last airport'
          : transport.mode === 'sea' ? '24 hours before loading at port of departure'
            : transport.mode === 'road' ? '1 hour before arrival at EU border'
              : '2 hours before arrival at EU border',
        system: 'ICS2 Release 3',
        applicableFrom: '2024-06-03',
      },
      recommendations: errorCount > 0
        ? ['Fix all errors before filing ENS. Non-compliant shipments may be held at customs.']
        : warningCount > 0
          ? ['Address warnings to avoid potential delays. All data fields recommended for smooth clearance.']
          : ['Shipment data appears ICS2 compliant. Proceed with ENS filing.'],
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
    'Use POST method. Body: { shipper: {name, address, country}, consignee: {...}, goods: [{description, hsCode, weight}], transport: {mode: "air"} }'
  );
}
