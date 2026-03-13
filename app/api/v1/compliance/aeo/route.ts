/**
 * POTAL API v1 — /api/v1/compliance/aeo
 *
 * AEO (Authorized Economic Operator) certification support.
 * Provides AEO eligibility assessment, documentation checklists,
 * and mutual recognition program information.
 *
 * POST /api/v1/compliance/aeo
 * Body: {
 *   country: string,              // required — where to apply for AEO
 *   companyInfo?: {
 *     yearsInBusiness?: number,
 *     annualImportValue?: number,
 *     annualExportValue?: number,
 *     hasCustomsBroker?: boolean,
 *     hasComplianceOfficer?: boolean,
 *     previousViolations?: number,
 *   },
 *   action?: string,              // "assess" | "checklist" | "mutual_recognition"
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── AEO Programs by Country ──────────────────────

interface AeoProgram {
  country: string;
  programName: string;
  authority: string;
  types: { code: string; name: string; description: string }[];
  benefits: string[];
  requirements: string[];
  processingTime: string;
  mutualRecognition: string[];
  applicationUrl?: string;
}

const AEO_PROGRAMS: Record<string, AeoProgram> = {
  US: {
    country: 'United States', programName: 'C-TPAT (Customs-Trade Partnership Against Terrorism)',
    authority: 'US Customs and Border Protection (CBP)',
    types: [
      { code: 'C-TPAT-1', name: 'Tier 1', description: 'Basic C-TPAT certification' },
      { code: 'C-TPAT-2', name: 'Tier 2', description: 'Enhanced validation with site visit' },
      { code: 'C-TPAT-3', name: 'Tier 3 (Green Lane)', description: 'Highest tier with maximum benefits' },
    ],
    benefits: ['Reduced inspections', 'Priority processing', 'Shorter wait times', 'Front of line for cargo exams', 'Access to FAST lanes (Canada/Mexico border)'],
    requirements: ['Valid importer/exporter license', 'Clean compliance history (3 years)', 'Supply chain security plan', 'Employee background checks', 'IT security measures'],
    processingTime: '90-120 days', mutualRecognition: ['EU', 'KR', 'JP', 'NZ', 'CA', 'MX', 'SG', 'IL', 'JO', 'TW'],
  },
  EU: {
    country: 'European Union', programName: 'AEO (Authorised Economic Operator)',
    authority: 'National customs authorities (EU-wide recognition)',
    types: [
      { code: 'AEOC', name: 'AEO-C (Customs Simplifications)', description: 'Simplified customs procedures' },
      { code: 'AEOS', name: 'AEO-S (Security & Safety)', description: 'Security-related facilitation' },
      { code: 'AEOF', name: 'AEO-F (Full)', description: 'Combined customs + security benefits' },
    ],
    benefits: ['Fewer customs checks', 'Priority treatment during alerts', 'Reduced data requirements', 'Self-assessment', 'Mutual recognition with partner countries'],
    requirements: ['Compliance track record', 'Satisfactory accounting system', 'Financial solvency', 'Security and safety standards', 'Professional competency'],
    processingTime: '120 days (max per UCC)', mutualRecognition: ['US', 'JP', 'CH', 'NO', 'CN', 'KR', 'UK'],
  },
  GB: {
    country: 'United Kingdom', programName: 'AEO (UK)',
    authority: 'HMRC',
    types: [
      { code: 'AEOC-UK', name: 'AEO-C', description: 'Customs simplifications' },
      { code: 'AEOS-UK', name: 'AEO-S', description: 'Security and safety' },
      { code: 'AEOF-UK', name: 'AEO-F', description: 'Full authorization' },
    ],
    benefits: ['Fewer customs checks', 'Simplified declarations', 'Priority treatment', 'Trusted trader status'],
    requirements: ['Clean customs compliance record', 'Accounting and logistical records', 'Financial solvency', 'Security standards'],
    processingTime: '120 days', mutualRecognition: ['US', 'JP', 'CH', 'NO'],
  },
  JP: {
    country: 'Japan', programName: 'AEO (Japan)',
    authority: 'Japan Customs',
    types: [
      { code: 'AEO-IMP', name: 'AEO Importer', description: 'Simplified import procedures' },
      { code: 'AEO-EXP', name: 'AEO Exporter', description: 'Simplified export procedures' },
      { code: 'AEO-LOG', name: 'AEO Logistics', description: 'Warehouse/logistics operator' },
    ],
    benefits: ['Release before duty payment', 'Simplified examination', 'Reduced inspections', 'Expedited clearance'],
    requirements: ['Compliance record', 'Internal audit system', 'Cargo security measures', 'Management structure'],
    processingTime: '3-6 months', mutualRecognition: ['US', 'EU', 'KR', 'NZ', 'CA', 'SG', 'AU'],
  },
  KR: {
    country: 'South Korea', programName: 'AEO (수출입안전관리우수업체)',
    authority: 'Korea Customs Service (KCS)',
    types: [
      { code: 'AEO-KR-S', name: 'S Grade', description: 'Basic AEO' },
      { code: 'AEO-KR-A', name: 'A Grade', description: 'Advanced AEO' },
      { code: 'AEO-KR-AA', name: 'AA Grade', description: 'Highest grade' },
    ],
    benefits: ['Reduced inspection rate', 'Fast customs clearance', 'Lower bond requirements', 'Monthly/quarterly duty payment'],
    requirements: ['Internal compliance program', 'Financial stability', 'Security management', 'Information system'],
    processingTime: '90-120 days', mutualRecognition: ['US', 'EU', 'JP', 'CA', 'NZ', 'SG', 'CN'],
  },
  CN: {
    country: 'China', programName: 'AEO / Credit Management',
    authority: 'General Administration of Customs (GACC)',
    types: [
      { code: 'AEO-CN-G', name: 'General Credit', description: 'Standard enterprises' },
      { code: 'AEO-CN-A', name: 'Advanced Certified', description: 'Highest trust level' },
    ],
    benefits: ['Lower inspection rate (<5%)', 'Priority clearance', 'Reduced bond', 'Simplified procedures'],
    requirements: ['Credit scoring system', 'Trade compliance', 'Financial solvency', 'Internal controls'],
    processingTime: '3-6 months', mutualRecognition: ['EU', 'KR', 'SG', 'HK', 'NZ'],
  },
};

function assessEligibility(
  program: AeoProgram,
  companyInfo: Record<string, unknown>,
): { eligible: boolean; score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  const yearsInBusiness = (companyInfo.yearsInBusiness as number) || 0;
  const previousViolations = (companyInfo.previousViolations as number) || 0;
  const hasComplianceOfficer = companyInfo.hasComplianceOfficer as boolean;

  if (yearsInBusiness < 3) {
    score -= 30;
    issues.push('Most AEO programs require 3+ years of business history.');
  }

  if (previousViolations > 0) {
    score -= previousViolations * 20;
    issues.push(`${previousViolations} previous violation(s) may disqualify or delay application.`);
  }

  if (!hasComplianceOfficer) {
    score -= 15;
    issues.push('A designated compliance officer is typically required.');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    eligible: score >= 50,
    score,
    issues,
  };
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const action = typeof body.action === 'string' ? body.action.toLowerCase().trim() : 'assess';
  const companyInfo = (body.companyInfo as Record<string, unknown>) || {};

  if (!country || country.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"country" must be a 2-letter ISO code.');
  }

  const program = AEO_PROGRAMS[country];

  if (action === 'mutual_recognition') {
    // Show all mutual recognition agreements
    const mrList = Object.entries(AEO_PROGRAMS).map(([code, p]) => ({
      country: code,
      programName: p.programName,
      mutualRecognitionPartners: p.mutualRecognition,
    }));

    return apiSuccess(
      { mutualRecognitionPrograms: mrList },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  if (!program) {
    return apiSuccess(
      {
        country,
        programFound: false,
        message: `No specific AEO program data for ${country}. Many countries have WCO SAFE Framework-based AEO programs. Contact local customs authority.`,
        wcoSafeFramework: 'WCO SAFE Framework of Standards provides the basis for national AEO programs.',
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  const assessment = Object.keys(companyInfo).length > 0 ? assessEligibility(program, companyInfo) : null;

  return apiSuccess(
    {
      country,
      program: {
        name: program.programName,
        authority: program.authority,
        types: program.types,
        benefits: program.benefits,
        requirements: action === 'checklist' ? program.requirements : undefined,
        processingTime: program.processingTime,
        mutualRecognition: program.mutualRecognition,
        applicationUrl: program.applicationUrl || null,
      },
      assessment,
      checklist: action === 'checklist' ? program.requirements.map((r, i) => ({
        step: i + 1,
        requirement: r,
        status: 'pending',
      })) : undefined,
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "US", action?: "assess"|"checklist"|"mutual_recognition", companyInfo?: {yearsInBusiness, ...} }');
}
