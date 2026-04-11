/**
 * POTAL API v1 — /api/v1/verify/pre-shipment
 * @deprecated Use POST /api/v1/verify?mode=comprehensive instead.
 * This endpoint is maintained for backward compatibility.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';
import { screenParty } from '@/app/lib/cost-engine/screening';
import { checkRestrictions } from '@/app/lib/cost-engine/restrictions/check';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface CheckItem {
  item: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIP';
  detail: string;
}

export const POST = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code.replace(/[^0-9]/g, '') : '';
  const origin = typeof body.origin === 'string' ? body.origin.toUpperCase().trim() : '';
  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase().trim() : '';
  const declaredValue = typeof body.declared_value === 'number' ? body.declared_value : 0;
  const weightKg = typeof body.weight_kg === 'number' ? body.weight_kg : undefined;
  const docsProvided = Array.isArray(body.documents_provided) ? body.documents_provided as string[] : [];
  const shipperName = typeof body.shipper_name === 'string' ? body.shipper_name.trim() : undefined;

  if (!hsCode) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code required.');
  if (!destination) return apiError(ApiErrorCode.BAD_REQUEST, 'destination required.');

  const checklist: CheckItem[] = [];
  let riskScore = 0;
  const recommendations: string[] = [];
  const missingDocs: string[] = [];
  const sb = createClient(supabaseUrl, supabaseKey);

  // 1. HS Code Validity (6-digit exact match)
  if (hsCode.length >= 6) {
    const hs6 = hsCode.substring(0, 6);
    const { data } = await sb.from('product_hs_mappings').select('id').eq('hs6', hs6).limit(1);
    if (data && data.length > 0) {
      checklist.push({ item: 'HS Code Valid', status: 'PASS', detail: `HS ${hs6} found in classification DB` });
    } else {
      // Also check gov_tariff_schedules for destination-specific validation
      const { data: govData } = await sb.from('gov_tariff_schedules').select('id')
        .eq('country_code', destination).like('hs_code', `${hs6}%`).limit(1);
      if (govData && govData.length > 0) {
        checklist.push({ item: 'HS Code Valid', status: 'PASS', detail: `HS ${hs6} found in ${destination} tariff schedule` });
      } else {
        checklist.push({ item: 'HS Code Valid', status: 'WARNING', detail: `HS ${hs6} not found in DB — may still be valid` });
        riskScore += 10;
      }
    }
  } else if (hsCode.length >= 4) {
    checklist.push({ item: 'HS Code Valid', status: 'WARNING', detail: `HS ${hsCode} is only ${hsCode.length} digits — 6+ recommended` });
    riskScore += 10;
  } else {
    checklist.push({ item: 'HS Code Valid', status: 'FAIL', detail: 'HS code too short (min 4 digits)' });
    riskScore += 20;
  }

  // 2. Restrictions
  try {
    const restrictions = checkRestrictions(hsCode, destination);
    if (restrictions.isProhibited) {
      checklist.push({ item: 'Import Restrictions', status: 'FAIL', detail: `Prohibited: ${restrictions.restrictions[0]?.description || 'Restricted product'}` });
      riskScore += 40;
    } else if (restrictions.hasRestrictions) {
      checklist.push({ item: 'Import Restrictions', status: 'WARNING', detail: `${restrictions.restrictions.length} restriction(s) found` });
      riskScore += 15;
    } else {
      checklist.push({ item: 'Import Restrictions', status: 'PASS', detail: 'No import restrictions detected' });
    }
  } catch {
    checklist.push({ item: 'Import Restrictions', status: 'SKIP', detail: 'Check unavailable' });
  }

  // 3. Sanctions Screening
  if (shipperName) {
    const screenResult = await screenParty({ name: shipperName, country: origin, minScore: 0.8 });
    if (screenResult.hasMatches) {
      checklist.push({ item: 'Denied Party Screening', status: 'FAIL', detail: `${screenResult.totalMatches} match(es) found for "${shipperName}"` });
      riskScore += 40;
    } else {
      checklist.push({ item: 'Denied Party Screening', status: 'PASS', detail: 'No matches on sanctions lists' });
    }
  } else {
    checklist.push({ item: 'Denied Party Screening', status: 'SKIP', detail: 'No shipper_name provided' });
    riskScore += 5;
  }

  // 4. Embargo Check (OFAC comprehensive + sectoral)
  const EMBARGO_COMPREHENSIVE = new Set(['CU', 'IR', 'KP', 'SY']);
  const EMBARGO_SECTORAL = new Set(['RU', 'BY', 'VE', 'MM']);

  if (EMBARGO_COMPREHENSIVE.has(destination)) {
    checklist.push({ item: 'Embargo Check', status: 'FAIL', detail: `${destination} is under comprehensive US sanctions. Shipment prohibited without OFAC license.` });
    riskScore += 50;
  } else if (EMBARGO_SECTORAL.has(destination)) {
    checklist.push({ item: 'Embargo Check', status: 'WARNING', detail: `${destination} has sectoral sanctions. Verify product eligibility before shipping.` });
    riskScore += 15;
  } else {
    checklist.push({ item: 'Embargo Check', status: 'PASS', detail: 'No embargo on destination' });
  }

  // Also check origin
  if (EMBARGO_COMPREHENSIVE.has(origin)) {
    checklist.push({ item: 'Origin Embargo', status: 'FAIL', detail: `Origin ${origin} under comprehensive embargo` });
    riskScore += 30;
  }

  // 5. Export Controls
  try {
    const hsChapter = hsCode.substring(0, 2);
    const sensitiveChapters = ['27', '28', '29', '38', '84', '85', '87', '88', '89', '90', '93'];
    if (sensitiveChapters.includes(hsChapter)) {
      const { data: ecc } = await sb.from('export_control_chart').select('license_required, reason_for_control')
        .eq('country_code', destination).eq('license_required', true).limit(1);
      if (ecc && ecc.length > 0) {
        checklist.push({ item: 'Export Controls', status: 'WARNING', detail: `HS Ch.${hsChapter} may require export license to ${destination}` });
        riskScore += 10;
      } else {
        checklist.push({ item: 'Export Controls', status: 'PASS', detail: 'No export license required' });
      }
    } else {
      checklist.push({ item: 'Export Controls', status: 'PASS', detail: 'Product not in sensitive HS chapters' });
    }
  } catch {
    checklist.push({ item: 'Export Controls', status: 'SKIP', detail: 'Check unavailable' });
  }

  // 6. De Minimis
  if (declaredValue > 0) {
    try {
      const { data: dm } = await sb.from('de_minimis_thresholds').select('*').eq('country_code', destination).single();
      if (dm) {
        const threshold = parseFloat(dm.threshold_usd || dm.amount || '0');
        if (threshold > 0 && declaredValue <= threshold) {
          checklist.push({ item: 'De Minimis', status: 'PASS', detail: `Value $${declaredValue} ≤ threshold $${threshold}: duty-free` });
        } else {
          checklist.push({ item: 'De Minimis', status: 'PASS', detail: `Value $${declaredValue} > threshold: normal duty applies` });
        }
      } else {
        checklist.push({ item: 'De Minimis', status: 'SKIP', detail: 'No threshold data for destination' });
      }
    } catch {
      checklist.push({ item: 'De Minimis', status: 'SKIP', detail: 'Check unavailable' });
    }
  }

  // 7. Document Completeness
  const requiredDocs = ['commercial_invoice', 'packing_list', 'bill_of_lading'];
  if (destination === 'US' && declaredValue > 2500) requiredDocs.push('customs_bond');
  const hsChapter = hsCode.substring(0, 2);
  if (['01', '02', '03', '04', '07', '08'].includes(hsChapter)) requiredDocs.push('phytosanitary_certificate');
  if (hsChapter === '30') requiredDocs.push('drug_registration');

  const provided = new Set(docsProvided.map(d => d.toLowerCase().replace(/\s+/g, '_')));
  for (const doc of requiredDocs) {
    if (!provided.has(doc)) missingDocs.push(doc);
  }

  if (missingDocs.length === 0 && docsProvided.length > 0) {
    checklist.push({ item: 'Document Completeness', status: 'PASS', detail: 'All required documents provided' });
  } else if (docsProvided.length === 0) {
    checklist.push({ item: 'Document Completeness', status: 'SKIP', detail: 'No documents_provided specified' });
  } else {
    checklist.push({ item: 'Document Completeness', status: 'WARNING', detail: `Missing: ${missingDocs.join(', ')}` });
    riskScore += 5 * missingDocs.length;
  }

  // 8. Value Reasonableness
  if (declaredValue > 0 && weightKg && weightKg > 0) {
    const valuePerKg = declaredValue / weightKg;
    if (valuePerKg < 0.5) {
      checklist.push({ item: 'Value Reasonableness', status: 'WARNING', detail: `Very low value/kg ($${valuePerKg.toFixed(2)}/kg) — may trigger customs inspection` });
      riskScore += 10;
      recommendations.push('Declared value appears very low per kg. Ensure accurate commercial invoice.');
    } else {
      checklist.push({ item: 'Value Reasonableness', status: 'PASS', detail: `$${valuePerKg.toFixed(2)}/kg within normal range` });
    }
  }

  // Calculate risk (C4: FAIL → BLOCKED)
  riskScore = Math.min(riskScore, 100);
  const failCount = checklist.filter(c => c.status === 'FAIL').length;
  const riskLevel = failCount > 0 ? 'BLOCKED' : riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';
  const shipmentAllowed = failCount === 0;

  if (failCount > 0) recommendations.push('Resolve all FAIL items before shipping. Shipment is blocked.');
  if (riskLevel === 'HIGH') recommendations.push('Consider engaging a licensed customs broker.');

  const clearanceTimes: Record<string, string> = {
    LOW: '1-2 business days', MEDIUM: '2-4 business days', HIGH: '5-10 business days (may require additional documentation)',
  };

  const response = apiSuccess({
    _deprecated: 'This endpoint is deprecated. Use POST /api/v1/verify?mode=comprehensive instead.',
    checklist,
    summary: { total: checklist.length, pass: checklist.filter(c => c.status === 'PASS').length, fail: failCount, warning: checklist.filter(c => c.status === 'WARNING').length },
    risk_score: riskScore,
    risk_level: riskLevel,
    shipment_allowed: shipmentAllowed,
    blocked_reasons: failCount > 0 ? checklist.filter(c => c.status === 'FAIL').map(c => c.detail) : [],
    missing_documents: missingDocs,
    estimated_clearance_time: clearanceTimes[riskLevel] || '5-10 business days',
    recommendations,
    shipment: { hs_code: hsCode, origin, destination, declared_value: declaredValue, weight_kg: weightKg },
  }, { sellerId: _ctx.sellerId });
  response.headers.set('Deprecation', 'true');
  response.headers.set('Link', '</api/v1/verify?mode=comprehensive>; rel="successor-version"');
  return response;
});
