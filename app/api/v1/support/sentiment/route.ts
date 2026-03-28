/**
 * F144: Customer Feedback Sentiment Analysis
 *
 * POST /api/v1/support/sentiment
 * Analyze customer feedback text for sentiment, urgency, and topic classification.
 * Uses keyword-based analysis (no external AI calls, $0 cost).
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── Sentiment Lexicon ─────────────────────────────

const POSITIVE_WORDS = new Set([
  'great', 'excellent', 'amazing', 'awesome', 'love', 'perfect', 'fantastic',
  'wonderful', 'brilliant', 'outstanding', 'impressive', 'helpful', 'easy',
  'fast', 'quick', 'reliable', 'accurate', 'smooth', 'intuitive', 'saves',
  'recommend', 'best', 'happy', 'satisfied', 'thank', 'thanks', 'good',
  'nice', 'super', 'clean', 'simple', 'powerful', 'efficient', 'seamless',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'broken',
  'slow', 'bug', 'error', 'crash', 'fail', 'failed', 'wrong', 'incorrect',
  'confusing', 'complicated', 'expensive', 'overpriced', 'useless', 'waste',
  'disappointed', 'frustrating', 'annoying', 'issue', 'problem', 'missing',
  'difficult', 'poor', 'unreliable', 'inaccurate', 'delay', 'delayed',
]);

const URGENCY_WORDS = new Set([
  'urgent', 'asap', 'immediately', 'critical', 'emergency', 'blocking',
  'blocked', 'down', 'outage', 'production', 'deadline', 'stuck',
]);

// Topic classification keywords
const TOPICS: Record<string, string[]> = {
  billing: ['price', 'pricing', 'cost', 'charge', 'invoice', 'bill', 'payment', 'subscription', 'refund', 'plan'],
  api: ['api', 'endpoint', 'request', 'response', 'authentication', 'key', 'rate limit', 'webhook', 'sdk', 'curl'],
  classification: ['hs code', 'classify', 'classification', 'tariff', 'category', 'product name', 'harmonized'],
  shipping: ['shipping', 'carrier', 'tracking', 'delivery', 'package', 'freight', 'dim weight', 'insurance'],
  widget: ['widget', 'shopify', 'woocommerce', 'bigcommerce', 'install', 'embed', 'display', 'theme'],
  duty: ['duty', 'tax', 'vat', 'gst', 'customs', 'landed cost', 'import', 'de minimis'],
  account: ['account', 'login', 'password', 'signup', 'profile', 'settings', 'dashboard'],
  general: ['feedback', 'suggestion', 'feature', 'request', 'question', 'help'],
};

function analyzeSentiment(text: string): { score: number; label: 'positive' | 'negative' | 'neutral'; confidence: number } {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.has(word)) positiveCount++;
    if (NEGATIVE_WORDS.has(word)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return { score: 0, label: 'neutral', confidence: 0.5 };

  const score = Math.round(((positiveCount - negativeCount) / total) * 100) / 100;
  const confidence = Math.round(Math.min(0.95, 0.5 + (total / words.length) * 2) * 100) / 100;

  let label: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (score > 0.2) label = 'positive';
  else if (score < -0.2) label = 'negative';

  return { score, label, confidence };
}

function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPICS)) {
    if (topic === 'general') continue;
    if (keywords.some(kw => lower.includes(kw))) {
      detected.push(topic);
    }
  }

  return detected.length > 0 ? detected : ['general'];
}

function detectUrgency(text: string): { isUrgent: boolean; urgencyScore: number } {
  const lower = text.toLowerCase();
  let urgencyHits = 0;
  for (const word of URGENCY_WORDS) {
    if (lower.includes(word)) urgencyHits++;
  }
  // Exclamation marks and caps also indicate urgency
  const exclamations = (text.match(/!/g) || []).length;
  const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(1, text.length);

  const urgencyScore = Math.min(1, (urgencyHits * 0.3 + exclamations * 0.1 + capsRatio * 2));
  return { isUrgent: urgencyScore > 0.3, urgencyScore: Math.round(urgencyScore * 100) / 100 };
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const source = typeof body.source === 'string' ? body.source : 'unknown';
  const customerId = typeof body.customerId === 'string' ? body.customerId : undefined;

  if (!text) return apiError(ApiErrorCode.BAD_REQUEST, '"text" required.');
  if (text.length > 5000) return apiError(ApiErrorCode.BAD_REQUEST, '"text" must be under 5000 characters.');

  // Batch analysis support
  const texts = Array.isArray(body.texts) ? body.texts as string[] : null;

  if (texts && texts.length > 0) {
    if (texts.length > 100) return apiError(ApiErrorCode.BAD_REQUEST, 'Maximum 100 texts per batch.');

    const results = texts.map((t, i) => {
      const trimmed = typeof t === 'string' ? t.trim() : '';
      if (!trimmed) return { index: i, error: 'Empty text' };
      const sentiment = analyzeSentiment(trimmed);
      const topics = detectTopics(trimmed);
      const urgency = detectUrgency(trimmed);
      return { index: i, text: trimmed.slice(0, 100) + (trimmed.length > 100 ? '...' : ''), sentiment, topics, urgency };
    });

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    for (const r of results) {
      if ('sentiment' in r && r.sentiment) {
        sentimentCounts[r.sentiment.label as keyof typeof sentimentCounts]++;
      }
    }

    return apiSuccess({
      batch: true,
      totalAnalyzed: results.length,
      results,
      summary: {
        sentimentDistribution: sentimentCounts,
        averageScore: Math.round((results.filter(r => 'sentiment' in r).reduce((s, r) => s + (('sentiment' in r && r.sentiment) ? r.sentiment.score : 0), 0) / Math.max(1, results.length)) * 100) / 100,
        urgentCount: results.filter(r => 'urgency' in r && (r as { urgency: { isUrgent: boolean } }).urgency.isUrgent).length,
      },
    }, { sellerId: ctx.sellerId, plan: ctx.planId });
  }

  // Single text analysis
  const sentiment = analyzeSentiment(text);
  const topics = detectTopics(text);
  const urgency = detectUrgency(text);

  // Word-level breakdown
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const positiveFound = words.filter(w => POSITIVE_WORDS.has(w));
  const negativeFound = words.filter(w => NEGATIVE_WORDS.has(w));

  return apiSuccess({
    sentiment,
    topics,
    urgency,
    details: {
      textLength: text.length,
      wordCount: words.length,
      positiveWords: [...new Set(positiveFound)],
      negativeWords: [...new Set(negativeFound)],
    },
    source,
    customerId: customerId || null,
    suggestedAction: urgency.isUrgent
      ? 'PRIORITY: Escalate to support team immediately.'
      : sentiment.label === 'negative'
        ? 'Follow up with customer to address concerns.'
        : sentiment.label === 'positive'
          ? 'Consider requesting a testimonial or review.'
          : 'Standard follow-up within SLA.',
    analyzedAt: new Date().toISOString(),
  }, { sellerId: ctx.sellerId, plan: ctx.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { text: "feedback text", source?, customerId? } or { texts: ["text1", "text2"] } for batch.');
}
