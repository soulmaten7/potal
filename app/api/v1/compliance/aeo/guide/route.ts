/**
 * POTAL API v1 — /api/v1/compliance/aeo/guide
 * AEO application guide: step-by-step instructions by country.
 */
import { NextRequest, NextResponse } from 'next/server';
import { AEO_PROGRAMS, getMraPartners } from '@/app/lib/compliance/aeo-programs';

interface ApplicationStep {
  step: number;
  action: string;
  description: string;
  estimatedTime: string;
}

const APPLICATION_STEPS: Record<string, ApplicationStep[]> = {
  US: [
    { step: 1, action: 'Self-Assessment', description: 'Complete C-TPAT Security Profile using the Supply Chain Security Best Practices catalog.', estimatedTime: '2-4 weeks' },
    { step: 2, action: 'Online Application', description: 'Submit application through the C-TPAT Portal (portal.cbp.gov).', estimatedTime: '1-2 hours' },
    { step: 3, action: 'CBP Review', description: 'CBP reviews application and security profile.', estimatedTime: '30-60 days' },
    { step: 4, action: 'Validation Visit', description: 'CBP Supply Chain Security Specialist conducts site visit.', estimatedTime: '1 day' },
    { step: 5, action: 'Certification', description: 'Receive C-TPAT certification and begin receiving benefits.', estimatedTime: '30 days after visit' },
  ],
  EU: [
    { step: 1, action: 'Self-Assessment Questionnaire', description: 'Complete SAQ covering compliance, accounting, security, and solvency.', estimatedTime: '4-6 weeks' },
    { step: 2, action: 'Application Submission', description: 'Submit to national customs authority via online portal.', estimatedTime: '1 day' },
    { step: 3, action: 'Preliminary Assessment', description: 'Customs authority reviews documentation.', estimatedTime: '30 days' },
    { step: 4, action: 'On-site Audit', description: 'Customs inspector visits business premises.', estimatedTime: '1-3 days' },
    { step: 5, action: 'Decision', description: 'AEO authorization issued (valid EU-wide).', estimatedTime: '120 days max' },
  ],
  KR: [
    { step: 1, action: '자체평가 (Self-Assessment)', description: '수출입 안전관리 기준에 따른 자체평가 실시', estimatedTime: '2-4주' },
    { step: 2, action: '서류 제출', description: '관세청 전자통관시스템(UNI-PASS)을 통해 신청', estimatedTime: '1일' },
    { step: 3, action: '서류 심사', description: '관세청 심사관이 제출 서류 검토', estimatedTime: '30일' },
    { step: 4, action: '현장 심사', description: '관세청 심사관 현장 방문 및 확인', estimatedTime: '1-2일' },
    { step: 5, action: '공인 결정', description: 'AEO 공인 여부 결정 및 통보', estimatedTime: '90-120일' },
  ],
  JP: [
    { step: 1, action: 'Prepare Application', description: 'Prepare compliance program documentation and security measures.', estimatedTime: '4-8 weeks' },
    { step: 2, action: 'Submit to Regional Customs', description: 'Submit application to the regional customs office.', estimatedTime: '1 day' },
    { step: 3, action: 'Document Review', description: 'Japan Customs reviews compliance documentation.', estimatedTime: '60 days' },
    { step: 4, action: 'On-site Inspection', description: 'Customs officer inspects facilities and procedures.', estimatedTime: '1-2 days' },
    { step: 5, action: 'Authorization', description: 'AEO status granted.', estimatedTime: '3-6 months total' },
  ],
};

const REQUIRED_DOCUMENTS: Record<string, string[]> = {
  US: ['Company registration documents', 'Importer/exporter license', 'Supply chain security profile', 'Organizational chart', 'IT security policy', 'Employee screening procedures'],
  EU: ['Company registration', 'VAT certificate', 'AEO Self-Assessment Questionnaire', 'Financial statements (3 years)', 'Customs compliance records', 'Security procedures manual'],
  KR: ['사업자등록증', '수출입실적증명서', '안전관리기준 자체평가표', '재무제표 (3년)', '조직도', '정보보안 관리계획'],
  JP: ['Company registration', 'Trade license', 'Compliance program manual', 'Internal audit records', 'Security management plan'],
};

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country')?.toUpperCase() || '';

  if (!country || country.length < 2) {
    return NextResponse.json({
      success: true,
      data: {
        availableCountries: Object.keys(AEO_PROGRAMS),
        message: 'Provide ?country=XX for application guide.',
      },
    });
  }

  const program = AEO_PROGRAMS[country];
  if (!program) {
    return NextResponse.json({
      success: true,
      data: {
        country,
        guideAvailable: false,
        message: `No detailed guide for ${country}. Check WCO SAFE Framework or contact local customs.`,
      },
    });
  }

  const steps = APPLICATION_STEPS[country] || APPLICATION_STEPS['US']; // fallback to US pattern
  const documents = REQUIRED_DOCUMENTS[country] || REQUIRED_DOCUMENTS['US'];
  const partners = getMraPartners(country);

  return NextResponse.json({
    success: true,
    data: {
      country,
      programName: program.programName,
      authority: program.authority,
      applicationUrl: program.applicationUrl,
      estimatedCost: program.estimatedCost,
      processingTime: program.processingTime,
      renewalPeriod: program.renewalPeriod,
      applicationSteps: steps,
      requiredDocuments: documents,
      programTypes: program.types,
      benefits: program.benefits,
      mraPartners: partners,
      tips: [
        'Start the self-assessment early — it takes the most time.',
        'Engage a customs broker or consultant experienced with AEO applications.',
        'Ensure all compliance records are up-to-date before applying.',
        'Address any outstanding violations or disputes before submission.',
        'Document your supply chain security procedures thoroughly.',
      ],
    },
  });
}
