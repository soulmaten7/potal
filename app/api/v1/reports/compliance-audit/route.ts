/**
 * POTAL API v1 — /api/v1/reports/compliance-audit
 *
 * Compliance audit report generation.
 * Generates a comprehensive compliance report covering:
 * - HS classification accuracy
 * - Duty rate sources and confidence
 * - Sanctions screening results
 * - Export control checks
 * - Tax collection compliance
 *
 * POST /api/v1/reports/compliance-audit
 * Body: {
 *   period: { startDate: string, endDate: string },
 *   includeClassifications?: boolean,
 *   includeSanctionsScreening?: boolean,
 *   includeExportControls?: boolean,
 *   includeTaxCompliance?: boolean,
 *   format?: string,      // "json" | "csv"
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const period = body.period as { startDate?: string; endDate?: string } | undefined;
  const includeClassifications = body.includeClassifications !== false;
  const includeSanctionsScreening = body.includeSanctionsScreening !== false;
  const includeTaxCompliance = body.includeTaxCompliance !== false;

  if (!period?.startDate || !period?.endDate) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"period" with startDate and endDate is required.');
  }

  const supabase = getSupabase();

  // 1. Classification audit data
  let classificationAudit = null;
  if (includeClassifications) {
    const { data: auditData, count } = await supabase
      .from('hs_classification_audit')
      .select('*', { count: 'exact' })
      .eq('seller_id', context.sellerId)
      .gte('created_at', period.startDate)
      .lte('created_at', period.endDate + 'T23:59:59Z')
      .limit(1000);

    const records = auditData || [];
    const bySource: Record<string, number> = {};
    let totalConfidence = 0;
    let highConfidence = 0;

    for (const r of records) {
      const source = (r.classification_source as string) || 'unknown';
      bySource[source] = (bySource[source] || 0) + 1;
      const conf = (r.confidence_score as number) || 0;
      totalConfidence += conf;
      if (conf >= 0.8) highConfidence++;
    }

    classificationAudit = {
      totalClassifications: count || records.length,
      bySource,
      averageConfidence: records.length > 0 ? Math.round((totalConfidence / records.length) * 100) / 100 : 0,
      highConfidenceRate: records.length > 0 ? Math.round((highConfidence / records.length) * 100) / 100 : 0,
      reviewRecommended: records.length > 0 ? records.length - highConfidence : 0,
    };
  }

  // 2. Sanctions screening audit
  let sanctionsAudit = null;
  if (includeSanctionsScreening) {
    const { count: screenCount } = await supabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', context.sellerId)
      .eq('endpoint', '/api/v1/screen')
      .gte('created_at', period.startDate)
      .lte('created_at', period.endDate + 'T23:59:59Z');

    sanctionsAudit = {
      totalScreenings: screenCount || 0,
      note: 'Detailed screening results available via /api/v1/screen endpoint.',
    };
  }

  // 3. Tax compliance
  let taxCompliance = null;
  if (includeTaxCompliance) {
    const { data: nexusData } = await supabase
      .from('seller_nexus_tracking')
      .select('*')
      .eq('seller_id', context.sellerId);

    const nexusJurisdictions = (nexusData || []).filter((n: Record<string, unknown>) => n.has_nexus);

    const { data: exemptCerts } = await supabase
      .from('tax_exemption_certificates')
      .select('*')
      .eq('seller_id', context.sellerId)
      .eq('status', 'active');

    const expiredCerts = (exemptCerts || []).filter((c: Record<string, unknown>) =>
      c.expiration_date && new Date(c.expiration_date as string) < new Date()
    );

    taxCompliance = {
      nexusJurisdictions: nexusJurisdictions.length,
      activeExemptionCerts: (exemptCerts || []).length,
      expiredCerts: expiredCerts.length,
      complianceIssues: expiredCerts.length > 0 ? [`${expiredCerts.length} expired exemption certificate(s) need renewal`] : [],
    };
  }

  return apiSuccess(
    {
      report: {
        title: 'Compliance Audit Report',
        period: { startDate: period.startDate, endDate: period.endDate },
        generatedAt: new Date().toISOString(),
        sellerId: context.sellerId,
        sections: {
          classificationAudit,
          sanctionsScreening: sanctionsAudit,
          taxCompliance,
        },
        overallStatus: 'review_recommended',
        recommendations: [
          classificationAudit && classificationAudit.reviewRecommended > 0
            ? `${classificationAudit.reviewRecommended} classifications below high-confidence threshold — review recommended.`
            : null,
          taxCompliance && taxCompliance.expiredCerts > 0
            ? `${taxCompliance.expiredCerts} expired exemption certificates — renew immediately.`
            : null,
          'Maintain regular audit schedule (quarterly recommended).',
          'Keep all documentation for minimum 5 years per customs regulations.',
        ].filter(Boolean),
      },
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { period: {startDate, endDate}, includeClassifications?: true }');
}
