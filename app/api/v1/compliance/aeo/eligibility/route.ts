/**
 * POTAL API v1 — /api/v1/compliance/aeo/eligibility
 * AEO eligibility checker: assess qualification for AEO programs.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { AEO_PROGRAMS } from '@/app/lib/compliance/aeo-programs';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase() : '';
  const businessType = typeof body.business_type === 'string' ? body.business_type : 'importer';
  const yearsInBusiness = typeof body.years_in_business === 'number' ? body.years_in_business : 0;
  const annualVolume = typeof body.annual_volume === 'number' ? body.annual_volume : 0;
  const complianceViolations = typeof body.compliance_violations === 'number' ? body.compliance_violations : 0;
  const hasComplianceOfficer = body.has_compliance_officer === true;
  const hasSecurityPlan = body.has_security_plan === true;
  const hasAuditSystem = body.has_audit_system === true;

  if (!country) return apiError(ApiErrorCode.BAD_REQUEST, '"country" required.');

  const program = AEO_PROGRAMS[country];
  if (!program) {
    return apiSuccess({ country, eligible: false, message: `No AEO program data for ${country}. Check WCO SAFE Framework.` }, { sellerId: ctx.sellerId });
  }

  // Score calculation
  let score = 100;
  const missing: string[] = [];
  const recommendations: string[] = [];

  if (yearsInBusiness < 3) {
    score -= 30;
    missing.push(`Business history: ${yearsInBusiness} years (minimum 3 required)`);
  } else if (yearsInBusiness >= 5) {
    score += 5;
  }

  if (complianceViolations > 0) {
    score -= complianceViolations * 20;
    missing.push(`${complianceViolations} compliance violation(s) — may disqualify`);
    recommendations.push('Resolve all outstanding violations before applying.');
  }

  if (!hasComplianceOfficer) {
    score -= 15;
    missing.push('No designated compliance officer');
    recommendations.push('Appoint a compliance officer or outsource to a qualified customs broker.');
  }

  if (!hasSecurityPlan) {
    score -= 15;
    missing.push('No supply chain security plan');
    recommendations.push('Develop a written supply chain security plan per WCO SAFE Framework.');
  }

  if (!hasAuditSystem) {
    score -= 10;
    missing.push('No internal audit system');
    recommendations.push('Implement an internal audit system for customs compliance.');
  }

  if (annualVolume < 100000) {
    score -= 5;
    recommendations.push('While not mandatory, higher trade volume strengthens your application.');
  }

  score = Math.max(0, Math.min(100, score));

  // Recommend best program type
  let recommendedType = program.types[0];
  if (businessType === 'importer' && program.types.find(t => t.name.includes('Import'))) {
    recommendedType = program.types.find(t => t.name.includes('Import'))!;
  } else if (businessType === 'exporter' && program.types.find(t => t.name.includes('Export'))) {
    recommendedType = program.types.find(t => t.name.includes('Export'))!;
  } else if (program.types.length > 2) {
    recommendedType = program.types[program.types.length - 1]; // Highest tier
  }

  return apiSuccess({
    country,
    programName: program.programName,
    eligible: score >= 50,
    score,
    missingRequirements: missing,
    recommendations,
    recommendedProgram: recommendedType,
    allProgramTypes: program.types,
    estimatedTimeline: program.processingTime,
    renewalPeriod: program.renewalPeriod,
    applicationUrl: program.applicationUrl,
  }, { sellerId: ctx.sellerId });
});
