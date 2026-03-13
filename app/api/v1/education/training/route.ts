/**
 * F141: Education/training program.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const COURSES = [
  { id: 'hs-basics', title: 'HS Code Classification Basics', level: 'beginner', duration: '30min', modules: 4, topics: ['What are HS codes', '6-digit structure', 'GRI rules', 'Common mistakes'] },
  { id: 'landed-cost-101', title: 'Understanding Landed Cost', level: 'beginner', duration: '45min', modules: 6, topics: ['DDP vs DDU', 'Duty calculation', 'Tax components', 'Insurance & freight'] },
  { id: 'fta-utilization', title: 'FTA Utilization for Savings', level: 'intermediate', duration: '60min', modules: 5, topics: ['Major FTAs', 'Rules of origin', 'Certificate requirements', 'Tariff engineering'] },
  { id: 'customs-compliance', title: 'Customs Compliance Essentials', level: 'intermediate', duration: '60min', modules: 7, topics: ['Import regulations', 'Restricted goods', 'Documentation', 'Audit preparation'] },
  { id: 'vat-global', title: 'Global VAT/GST Management', level: 'intermediate', duration: '45min', modules: 5, topics: ['VAT vs GST', 'Registration thresholds', 'IOSS/OSS', 'Filing obligations'] },
  { id: 'trade-remedies', title: 'Anti-Dumping & Trade Remedies', level: 'advanced', duration: '90min', modules: 8, topics: ['AD/CVD overview', 'How duties are calculated', 'Exclusion process', 'Safeguard measures'] },
  { id: 'ecommerce-cross-border', title: 'Cross-Border eCommerce Masterclass', level: 'advanced', duration: '120min', modules: 10, topics: ['Market entry strategy', 'Localization', 'Payment methods', 'Returns management'] },
  { id: 'api-integration', title: 'POTAL API Integration Guide', level: 'developer', duration: '90min', modules: 6, topics: ['Authentication', 'Calculate endpoint', 'Batch processing', 'Webhook setup'] },
];

const CERTIFICATIONS = [
  { id: 'potal-certified', title: 'POTAL Certified Trade Professional', prerequisiteCourses: ['hs-basics', 'landed-cost-101', 'customs-compliance'], examDuration: '60min', passingScore: 80 },
  { id: 'potal-advanced', title: 'POTAL Advanced Trade Specialist', prerequisiteCourses: ['fta-utilization', 'vat-global', 'trade-remedies'], examDuration: '90min', passingScore: 85 },
];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'catalog';
  const level = typeof body.level === 'string' ? body.level.toLowerCase() : '';

  if (action === 'catalog') {
    let courses = COURSES;
    if (level) courses = courses.filter(c => c.level === level);

    return apiSuccess({
      courses,
      certifications: CERTIFICATIONS,
      resources: [
        { type: 'documentation', url: 'https://docs.potal.app', description: 'API documentation and guides' },
        { type: 'webinars', description: 'Monthly live webinars on cross-border trade topics' },
        { type: 'knowledge_base', url: 'https://www.potal.app/faq', description: 'FAQ and knowledge base articles' },
        { type: 'community', description: 'POTAL user community forum' },
      ],
      levels: ['beginner', 'intermediate', 'advanced', 'developer'],
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'enroll') {
    const courseId = typeof body.courseId === 'string' ? body.courseId : '';
    if (!courseId) return apiError(ApiErrorCode.BAD_REQUEST, '"courseId" required.');
    const course = COURSES.find(c => c.id === courseId);
    if (!course) return apiError(ApiErrorCode.BAD_REQUEST, `Course "${courseId}" not found.`);

    return apiSuccess({
      enrollment: { courseId, title: course.title, status: 'enrolled', startedAt: new Date().toISOString() },
      accessUrl: `https://learn.potal.app/courses/${courseId}`,
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid action. Use: catalog, enroll.');
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "catalog"|"enroll", level?: "beginner", courseId?: "hs-basics" }'); }
