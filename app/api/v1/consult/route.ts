/**
 * POTAL API v1 — /api/v1/consult
 *
 * AI Agent customs consultation endpoint.
 * Provides AI-powered answers to customs/trade compliance questions
 * using regulation RAG + POTAL's calculation engine.
 *
 * POST /api/v1/consult
 * Body: {
 *   question: string,          // required — customs/trade question
 *   context?: {
 *     originCountry?: string,
 *     destinationCountry?: string,
 *     hsCode?: string,
 *     productName?: string,
 *     value?: number,
 *     currency?: string,
 *   }
 * }
 *
 * Returns: { answer, sources[], relatedTopics[], calculations? }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { searchRegulations } from '@/app/lib/cost-engine/regulation-rag';
import { calculateGlobalLandedCostAsync } from '@/app/lib/cost-engine';
import { classifyProductAsync } from '@/app/lib/cost-engine/ai-classifier';

// ─── Types ─────────────────────────────────────────

interface ConsultContext {
  originCountry?: string;
  destinationCountry?: string;
  hsCode?: string;
  productName?: string;
  value?: number;
  currency?: string;
}

interface ConsultResponse {
  answer: string;
  sources: { title: string; countryCode: string; topic: string; sourceUrl?: string }[];
  relatedTopics: string[];
  calculations?: Record<string, unknown>;
}

// ─── Topic Detection ───────────────────────────────

const TOPIC_PATTERNS: { topic: string; patterns: RegExp[] }[] = [
  { topic: 'tariff', patterns: [/tariff|duty|duties|duty rate|import tax/i] },
  { topic: 'vat', patterns: [/vat|gst|sales tax|value.?added/i] },
  { topic: 'import_restriction', patterns: [/restrict|prohibit|ban|forbidden|embargo/i] },
  { topic: 'export_control', patterns: [/export control|ear|itar|dual.?use/i] },
  { topic: 'fta', patterns: [/fta|free trade|preferential|trade agreement|origin/i] },
  { topic: 'customs_procedure', patterns: [/procedure|clearance|customs process|declaration/i] },
  { topic: 'labeling', patterns: [/label|marking|packaging requirement|country of origin mark/i] },
  { topic: 'certification', patterns: [/certif|standard|compliance|ce mark|fcc|testing/i] },
  { topic: 'sanitary', patterns: [/sanitary|phytosanitary|sps|food safety|health/i] },
  { topic: 'trade_remedy', patterns: [/anti.?dump|countervail|safeguard|trade remedy/i] },
  { topic: 'sanctions', patterns: [/sanction|ofac|sdn|denied party|embargo/i] },
  { topic: 'documentation', patterns: [/document|invoice|packing list|bill of lading|certificate/i] },
  { topic: 'valuation', patterns: [/valuation|transaction value|customs value|declared value/i] },
  { topic: 'classification', patterns: [/hs code|classify|classification|tariff code|harmonized/i] },
];

function detectTopics(question: string): string[] {
  const topics: string[] = [];
  for (const { topic, patterns } of TOPIC_PATTERNS) {
    if (patterns.some(p => p.test(question))) {
      topics.push(topic);
    }
  }
  return topics.length > 0 ? topics : ['customs_procedure'];
}

// ─── Answer Builder ────────────────────────────────

function buildAnswer(
  question: string,
  topics: string[],
  regulationDocs: { title: string; content: string; topic: string }[],
  calculations?: Record<string, unknown>,
): string {
  const parts: string[] = [];

  // Add regulation-based context
  if (regulationDocs.length > 0) {
    parts.push('Based on relevant regulations:');
    for (const doc of regulationDocs.slice(0, 3)) {
      parts.push(`- ${doc.title}: ${doc.content.slice(0, 300)}...`);
    }
  }

  // Add calculation summary if available
  if (calculations) {
    parts.push('');
    parts.push('Calculation results are included in the response.');
  }

  // Add topic guidance
  const topicGuidance: Record<string, string> = {
    tariff: 'For accurate duty rates, use /api/v1/calculate with specific product details.',
    vat: 'VAT/GST rates vary by product category. Use /api/v1/calculate for precise rates.',
    classification: 'For HS code classification, use /api/v1/classify with your product name.',
    fta: 'For FTA eligibility and rules of origin, use /api/v1/roo.',
    sanctions: 'For sanctions screening, use /api/v1/screen.',
    documentation: 'For document generation, use /api/v1/documents.',
  };

  for (const topic of topics) {
    if (topicGuidance[topic]) {
      parts.push('');
      parts.push(topicGuidance[topic]);
    }
  }

  if (parts.length === 0) {
    parts.push(`Your question about "${question.slice(0, 100)}" relates to: ${topics.join(', ')}.`);
    parts.push('Use POTAL\'s specialized endpoints for detailed calculations and compliance checks.');
  }

  return parts.join('\n');
}

// ─── Handler ───────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"question" is required.');
  }
  if (question.length > 1000) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"question" must be under 1000 characters.');
  }

  const ctx: ConsultContext = {};
  if (body.context && typeof body.context === 'object') {
    const c = body.context as Record<string, unknown>;
    ctx.originCountry = typeof c.originCountry === 'string' ? c.originCountry.toUpperCase().trim() : undefined;
    ctx.destinationCountry = typeof c.destinationCountry === 'string' ? c.destinationCountry.toUpperCase().trim() : undefined;
    ctx.hsCode = typeof c.hsCode === 'string' ? c.hsCode.trim() : undefined;
    ctx.productName = typeof c.productName === 'string' ? c.productName.trim() : undefined;
    ctx.value = typeof c.value === 'number' ? c.value : undefined;
    ctx.currency = typeof c.currency === 'string' ? c.currency.toUpperCase().trim() : undefined;
  }

  // Detect question topics
  const topics = detectTopics(question);

  // Search regulations for relevant countries
  const sources: ConsultResponse['sources'] = [];
  const regulationDocs: { title: string; content: string; topic: string }[] = [];

  const countriesToSearch = [ctx.originCountry, ctx.destinationCountry].filter(Boolean) as string[];
  if (countriesToSearch.length === 0) countriesToSearch.push('US'); // default

  for (const country of countriesToSearch) {
    for (const topic of topics.slice(0, 2)) {
      try {
        const result = await searchRegulations({
          countryCode: country,
          query: question,
          topic,
          limit: 3,
        });
        for (const doc of result.documents) {
          sources.push({
            title: doc.title,
            countryCode: doc.countryCode,
            topic: doc.topic,
            sourceUrl: doc.sourceUrl,
          });
          regulationDocs.push({ title: doc.title, content: doc.content, topic: doc.topic });
        }
      } catch { /* regulation search failed */ }
    }
  }

  // Run TLC calculation if enough context
  let calculations: Record<string, unknown> | undefined;
  if (ctx.originCountry && ctx.destinationCountry && ctx.value) {
    try {
      let hsCode = ctx.hsCode;
      if (!hsCode && ctx.productName) {
        const classification = await classifyProductAsync(ctx.productName, undefined, context.sellerId);
        if (classification.hsCode && classification.hsCode !== '9999') {
          hsCode = classification.hsCode;
        }
      }

      if (hsCode) {
        const tlc = await calculateGlobalLandedCostAsync({
          origin: ctx.originCountry,
          destinationCountry: ctx.destinationCountry,
          hsCode,
          productName: ctx.productName || '',
          price: ctx.value.toString(),
        });

        calculations = {
          totalLandedCost: tlc.totalLandedCost,
          importDuty: tlc.importDuty,
          vat: tlc.vat,
          vatRate: tlc.vatRate,
          destinationCurrency: tlc.destinationCurrency,
          breakdown: tlc.breakdown,
        };
      }
    } catch { /* calculation failed */ }
  }

  const answer = buildAnswer(question, topics, regulationDocs, calculations);

  return apiSuccess(
    {
      answer,
      topics,
      sources,
      relatedTopics: topics.flatMap(t => {
        const related: Record<string, string[]> = {
          tariff: ['classification', 'fta', 'valuation'],
          classification: ['tariff', 'documentation'],
          fta: ['tariff', 'documentation', 'certification'],
          vat: ['tariff', 'valuation'],
          sanctions: ['export_control', 'import_restriction'],
        };
        return related[t] || [];
      }).filter((t, i, arr) => arr.indexOf(t) === i && !topics.includes(t)),
      calculations: calculations || null,
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
    'Use POST method. Body: { question: "What is the import duty for electronics from China to US?", context?: { originCountry, destinationCountry, hsCode, productName, value } }'
  );
}
