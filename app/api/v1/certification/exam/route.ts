/**
 * F137: Certification Program — Exam API
 *
 * POST /api/v1/certification/exam
 * Start exam, submit answers, get score, issue certificate.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

type CertLevel = 'associate' | 'professional' | 'expert';

interface ExamQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
}

const EXAM_CONFIG: Record<CertLevel, { questions: number; passingScore: number; durationMinutes: number }> = {
  associate: { questions: 30, passingScore: 70, durationMinutes: 45 },
  professional: { questions: 50, passingScore: 75, durationMinutes: 75 },
  expert: { questions: 60, passingScore: 80, durationMinutes: 90 },
};

// Question bank (subset — full bank in production DB)
const QUESTION_BANK: ExamQuestion[] = [
  // Associate
  { id: 'a01', category: 'HS Code', question: 'The Harmonized System is maintained by which organization?', options: ['WTO', 'WCO', 'IMF', 'UNCTAD'], correctIndex: 1 },
  { id: 'a02', category: 'HS Code', question: 'How many digits are standardized internationally in an HS code?', options: ['4', '6', '8', '10'], correctIndex: 1 },
  { id: 'a03', category: 'Landed Cost', question: 'CIF stands for:', options: ['Cost, Insurance, Freight', 'Customs Import Fee', 'Commercial Invoice Form', 'Country Import Factor'], correctIndex: 0 },
  { id: 'a04', category: 'Landed Cost', question: 'De minimis threshold refers to:', options: ['Maximum duty rate', 'Minimum order value for duty-free import', 'Minimum shipment weight', 'Maximum insurance coverage'], correctIndex: 1 },
  { id: 'a05', category: 'API', question: 'POTAL API authentication uses which header?', options: ['Authorization: Bearer', 'X-API-Key', 'Cookie', 'X-Auth-Token'], correctIndex: 1 },
  { id: 'a06', category: 'Compliance', question: 'VAT is typically applied to:', options: ['Goods value only', 'CIF + duty', 'Shipping only', 'Insurance only'], correctIndex: 1 },
  { id: 'a07', category: 'HS Code', question: 'Section XI of the HS covers:', options: ['Chemicals', 'Textiles', 'Machinery', 'Vehicles'], correctIndex: 1 },
  { id: 'a08', category: 'Landed Cost', question: 'Incoterm DDP means the seller bears:', options: ['Only shipping', 'Shipping + duty', 'All costs including delivery', 'No costs after factory'], correctIndex: 2 },
  // Professional
  { id: 'p01', category: 'FTA', question: 'USMCA replaced which trade agreement?', options: ['TPP', 'NAFTA', 'CAFTA', 'MERCOSUR'], correctIndex: 1 },
  { id: 'p02', category: 'Rules of Origin', question: 'Substantial transformation typically requires:', options: ['Change in color', 'Change in tariff classification', 'Change in weight', 'Change in packaging'], correctIndex: 1 },
  { id: 'p03', category: 'Trade Remedies', question: 'Anti-dumping duties are imposed when:', options: ['Products are dangerous', 'Products are sold below fair market value', 'Products exceed quota', 'Products violate IP'], correctIndex: 1 },
  { id: 'p04', category: 'Compliance', question: 'REACH regulation primarily covers:', options: ['Food safety', 'Chemical substances', 'Electronic waste', 'Worker safety'], correctIndex: 1 },
  // Expert
  { id: 'e01', category: 'Classification', question: 'GRI Rule 3(b) applies when:', options: ['Products are unfinished', 'Goods are composite/mixtures', 'Goods are disassembled', 'Goods are in sets'], correctIndex: 1 },
  { id: 'e02', category: 'Valuation', question: 'WTO Customs Valuation uses which primary method?', options: ['Cost of production', 'Transaction value', 'Deductive value', 'Computed value'], correctIndex: 1 },
  { id: 'e03', category: 'Architecture', question: 'POTAL Layer 1 classification uses:', options: ['GPT-4 only', 'Vector search only', '9-field codified rules (0 AI)', 'Ensemble of 3 models'], correctIndex: 2 },
];

function selectQuestions(level: CertLevel, count: number): ExamQuestion[] {
  // In production, select from full DB question bank with randomization
  const allQuestions = QUESTION_BANK;
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function generateCertificateId(): string {
  const y = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `POTAL-CERT-${y}-${rand}`;
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const action = typeof body.action === 'string' ? body.action : 'info';
  const level = typeof body.level === 'string' ? body.level as CertLevel : 'associate';

  if (!EXAM_CONFIG[level]) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"level" must be: associate, professional, or expert.');
  }

  if (action === 'info') {
    return apiSuccess({
      levels: Object.entries(EXAM_CONFIG).map(([name, config]) => ({
        level: name,
        ...config,
        fee: name === 'associate' ? 0 : name === 'professional' ? 49 : 99,
      })),
      prerequisites: {
        associate: 'None',
        professional: 'POTAL Certified Associate',
        expert: 'POTAL Certified Professional',
      },
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'start') {
    const config = EXAM_CONFIG[level];
    const questions = selectQuestions(level, config.questions);
    const examId = `EXAM-${Date.now().toString(36).toUpperCase()}`;

    return apiSuccess({
      action: 'start',
      examId,
      level,
      totalQuestions: questions.length,
      durationMinutes: config.durationMinutes,
      passingScore: config.passingScore,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + config.durationMinutes * 60000).toISOString(),
      questions: questions.map((q, i) => ({
        number: i + 1,
        id: q.id,
        category: q.category,
        question: q.question,
        options: q.options,
        // correctIndex NOT sent to client
      })),
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'submit') {
    const examId = typeof body.examId === 'string' ? body.examId : '';
    const answers = body.answers as Record<string, number> | undefined;

    if (!examId) return apiError(ApiErrorCode.BAD_REQUEST, '"examId" required.');
    if (!answers || typeof answers !== 'object') return apiError(ApiErrorCode.BAD_REQUEST, '"answers" object required (questionId → selectedIndex).');

    // Score the exam
    let correct = 0;
    let total = 0;
    const results: { questionId: string; correct: boolean; yourAnswer: number; correctAnswer: number }[] = [];

    for (const [qId, selectedIndex] of Object.entries(answers)) {
      const question = QUESTION_BANK.find(q => q.id === qId);
      if (!question) continue;
      total++;
      const isCorrect = selectedIndex === question.correctIndex;
      if (isCorrect) correct++;
      results.push({
        questionId: qId,
        correct: isCorrect,
        yourAnswer: selectedIndex,
        correctAnswer: question.correctIndex,
      });
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= EXAM_CONFIG[level].passingScore;

    const certificate = passed ? {
      certificateId: generateCertificateId(),
      level: `POTAL Certified ${level.charAt(0).toUpperCase() + level.slice(1)}`,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 2 * 365 * 86400000).toISOString(),
      verificationUrl: `https://www.potal.app/verify-cert/${generateCertificateId()}`,
    } : null;

    return apiSuccess({
      action: 'submit',
      examId,
      level,
      score,
      passingScore: EXAM_CONFIG[level].passingScore,
      passed,
      correct,
      total,
      results,
      certificate,
      retryInfo: passed ? null : {
        canRetryAfter: new Date(Date.now() + 24 * 3600000).toISOString(),
        note: 'You can retake the exam after 24 hours.',
      },
    }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'action must be: info, start, or submit.');
});
