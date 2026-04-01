/**
 * POTAL API v1 — /api/v1/support
 *
 * AI Support Agent — Multilingual FAQ-based auto-response.
 * 25 FAQs, 50 languages supported, keyword scoring with multi-match bonus.
 *
 * POST /api/v1/support
 * Body: { question: string, language?: string, context?: { sellerId?: string, plan?: string } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── Supported Languages ──────────────────────────

const SUPPORTED_LANGUAGES = new Set([
  'en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'ru', 'ar',
  'hi', 'th', 'vi', 'id', 'tr', 'pl', 'nl', 'sv', 'da', 'fi',
  'nb', 'cs', 'ro', 'hu', 'uk', 'el', 'he', 'ms', 'it', 'bg',
  'hr', 'sk', 'sl', 'lt', 'lv', 'et', 'mt', 'ga', 'cy', 'is',
  'mk', 'sq', 'sr', 'bs', 'me', 'ka', 'hy', 'az', 'kk', 'uz',
]);

// ─── FAQ Knowledge Base (25 entries) ─────────────────

interface FaqEntry {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  i18n?: Record<string, { question: string; answer: string }>;
  category: string;
}

const FAQ_DATABASE: FaqEntry[] = [
  // ─── Pricing & Plans ───
  {
    id: 'pricing',
    keywords: ['pricing', 'price', 'cost', 'plan', 'plans', 'free', 'subscription', '가격', '요금', '플랜', '料金', 'プラン', '价格', '套餐', 'precio', 'prix'],
    question: 'What are the pricing plans?',
    answer: 'POTAL offers 4 plans: Free (200 calc/month, $0), Basic (2,000 calc/month, $20/mo), Pro (10,000 calc/month, $80/mo), Enterprise (50,000 calc/month, $300/mo). Annual billing saves 20%. Overage: $0.015-$0.008/calc depending on plan.',
    i18n: {
      ko: { question: '요금제는 어떻게 되나요?', answer: 'POTAL은 4개 요금제를 제공합니다: Free (월 200건, $0), Basic (월 2,000건, $20/월), Pro (월 10,000건, $80/월), Enterprise (월 50,000건, $300/월). 연간 결제 시 20% 할인.' },
      ja: { question: '料金プランは？', answer: 'POTALは4つのプラン: Free (月200件, $0), Basic (月2,000件, $20/月), Pro (月10,000件, $80/月), Enterprise (月50,000件, $300/月)。年払いで20%割引。' },
      zh: { question: '价格方案是什么？', answer: 'POTAL提供4个方案：Free（月200次，$0），Basic（月2,000次，$20/月），Pro（月10,000次，$80/月），Enterprise（月50,000次，$300/月）。年付享8折。' },
      es: { question: '¿Cuáles son los planes?', answer: 'POTAL ofrece 4 planes: Free (200/mes, $0), Basic (2,000/mes, $20/mes), Pro (10,000/mes, $80/mes), Enterprise (50,000/mes, $300/mes). -20% anual.' },
      fr: { question: 'Quels sont les plans ?', answer: 'POTAL propose 4 plans : Free (200/mois, $0), Basic (2 000/mois, $20/mois), Pro (10 000/mois, $80/mois), Enterprise (50 000/mois, $300/mois). -20% annuel.' },
      de: { question: 'Welche Pläne gibt es?', answer: 'POTAL bietet 4 Pläne: Free (200/Monat, $0), Basic (2.000/Monat, $20), Pro (10.000/Monat, $80), Enterprise (50.000/Monat, $300). -20% jährlich.' },
    },
    category: 'pricing',
  },
  {
    id: 'api-key',
    keywords: ['api key', 'api-key', 'authentication', 'auth', 'key', 'token'],
    question: 'How do I get an API key?',
    answer: 'Sign up at potal.app, go to Dashboard → API Keys. You\'ll get a publishable key (pk_live_...) for frontend and a secret key (sk_live_...) for server-side. Never expose your secret key in client-side code.',
    category: 'setup',
  },
  {
    id: 'countries',
    keywords: ['countries', 'country', 'supported', 'coverage', 'how many'],
    question: 'Which countries are supported?',
    answer: 'POTAL supports 240+ countries and territories. Duty rates from 7 government APIs (USITC, UK, EU TARIC, Canada CBSA, Australia ABF, Japan, Korea KCS) plus MacMap data covering 53 countries with 100M+ tariff lines.',
    category: 'coverage',
  },
  {
    id: 'hs-code',
    keywords: ['hs code', 'hs-code', 'classify', 'classification', 'tariff code', 'HS코드', '분류', 'HSコード', 'HS编码'],
    question: 'How does HS code classification work?',
    answer: 'POTAL uses AI-powered 3-stage classification: DB cache → keyword matching → AI model. Just provide a product name and we classify automatically. You can also provide your own HS code.',
    i18n: {
      ko: { question: 'HS 코드 분류는 어떻게 작동하나요?', answer: 'POTAL은 3단계 AI 분류: DB 캐시 → 키워드 매칭 → AI 모델. 상품명만 입력하면 자동 분류됩니다.' },
      ja: { question: 'HSコード分類はどのように？', answer: 'POTALは3段階AI分類: DBキャッシュ → キーワード → AIモデル。商品名を入力するだけで自動分類。' },
      zh: { question: 'HS编码分类如何工作？', answer: 'POTAL使用3阶段AI分类：DB缓存→关键词匹配→AI模型。只需提供产品名称即可自动分类。' },
    },
    category: 'technical',
  },
  {
    id: 'accuracy',
    keywords: ['duty', 'tariff', 'rate', 'accuracy', 'accurate', 'confidence'],
    question: 'How accurate are the duty rates?',
    answer: 'Each calculation includes a confidence score. Our 4-stage fallback (AGR → MIN → NTLC MFN → hardcoded) ensures the best available rate. Government API data scores 85%+ confidence. With HS classification, accuracy typically exceeds 95%.',
    category: 'technical',
  },
  {
    id: 'ddp-ddu',
    keywords: ['ddp', 'ddu', 'delivered', 'shipping terms', 'buyer pays', 'incoterms'],
    question: 'What\'s the difference between DDP and DDU?',
    answer: 'DDP (Delivered Duty Paid): Seller pays all duties/taxes upfront. DDU (Delivered Duty Unpaid): Buyer pays at delivery. Use shippingTerms parameter ("DDP" or "DDU") in your API call.',
    category: 'features',
  },
  {
    id: 'integrations',
    keywords: ['woocommerce', 'shopify', 'bigcommerce', 'magento', 'plugin', 'integration', 'wordpress'],
    question: 'Which platforms are supported?',
    answer: 'Shopify (Theme App Extension), WooCommerce (WordPress plugin), BigCommerce (Script Manager), Magento 2 (Composer module). REST and GraphQL APIs for custom integrations.',
    category: 'integration',
  },
  {
    id: 'trade-remedies',
    keywords: ['anti-dumping', 'countervailing', 'safeguard', 'trade remedy', 'section 301', 'section 232', 'ad/cvd'],
    question: 'Does POTAL include trade remedies?',
    answer: 'Yes! Auto-checks AD, CVD, and safeguard measures (119,706 cases). For US: Section 301 (China Lists 1-4A) and Section 232 (steel 25%, aluminum 10%) are automatically applied.',
    category: 'features',
  },
  {
    id: 'vat-gst',
    keywords: ['vat', 'gst', 'tax', 'ioss', 'sales tax', 'consumption tax'],
    question: 'How does VAT/GST calculation work?',
    answer: 'Country-specific: US state sales tax (by ZIP), Canada GST/HST/PST, EU IOSS (≤€150), UK VAT (£135), Australia GST ($1000 LVG), Brazil IPI/PIS/COFINS/ICMS, India IGST+SWS, China CBEC, Mexico IVA+IEPS, GCC VAT.',
    category: 'technical',
  },
  {
    id: 'rate-limits',
    keywords: ['rate limit', 'throttle', 'limit', 'quota', 'overage', 'exceed'],
    question: 'What are the rate limits?',
    answer: 'Forever Free: 100,000 API calls/month (soft cap for DDoS protection), 60 req/min. Enterprise customers can contact us for custom limits.',
    category: 'pricing',
  },
  {
    id: 'webhooks',
    keywords: ['webhook', 'callback', 'notification', 'alert', 'event'],
    question: 'Do you support webhooks?',
    answer: 'Yes! Subscribe to tariff changes, trade remedy updates, and Section 301/232 changes via /api/v1/alerts. Delivery via webhook URL or email. Automatic retry on failure (3 attempts, exponential backoff).',
    category: 'features',
  },
  // ─── New FAQs (12 additions) ───
  {
    id: 'batch',
    keywords: ['batch', 'bulk', 'multiple', 'mass', 'many products', 'batch api'],
    question: 'How does the Batch API work?',
    answer: 'POST to /api/v1/calculate/batch with an array of products (up to 50 per Free, 100 Basic, 500 Pro, 5000 Enterprise). Each item needs productName, price, destinationCountry. Results return in the same order. Batch API is included in all plans.',
    category: 'features',
  },
  {
    id: 'sandbox',
    keywords: ['sandbox', 'test', 'testing', 'development', 'staging', 'trial', 'demo'],
    question: 'Is there a sandbox/test mode?',
    answer: 'Yes! Use your API key with the /api/v1/sandbox prefix for testing. Sandbox calls don\'t count toward your quota. Test with any product name and country to verify integration before going live.',
    category: 'setup',
  },
  {
    id: 'roo',
    keywords: ['origin', 'roo', 'fta', 'preferential', 'certificate', 'rules of origin', 'free trade'],
    question: 'How do Rules of Origin / FTA work?',
    answer: 'POTAL checks 63 FTAs automatically. Provide originCountry and destinationCountry — if an FTA exists, preferential rates are applied (MIN/AGR). The response includes ftaApplied flag and savings amount vs MFN rate.',
    category: 'features',
  },
  {
    id: 'gdpr',
    keywords: ['gdpr', 'privacy', 'data', 'retention', 'delete', 'compliance', 'ccpa'],
    question: 'What is your data/privacy policy?',
    answer: 'POTAL is GDPR and CCPA compliant. We store calculation results for 30 days for caching, then auto-delete. No PII is stored beyond what\'s needed for billing. Request data deletion anytime via support@potal.app.',
    category: 'legal',
  },
  {
    id: 'sla',
    keywords: ['sla', 'uptime', 'availability', 'guarantee', 'downtime', 'reliability'],
    question: 'What is the SLA/uptime guarantee?',
    answer: '99.9% uptime SLA for Pro and Enterprise plans. API response time < 200ms for cached calculations, < 2s for new classifications. Status page at status.potal.app. Enterprise gets dedicated support with 4-hour response time.',
    category: 'technical',
  },
  {
    id: 'sdk',
    keywords: ['sdk', 'library', 'package', 'npm', 'pip', 'python', 'javascript', 'node'],
    question: 'Are there SDKs available?',
    answer: 'Yes! JavaScript/TypeScript: `npm install @potal/sdk`. Python: `pip install potal`. Both support async operations, batch calculations, and TypeScript types. cURL examples in our docs at potal.app/developers/docs.',
    category: 'setup',
  },
  {
    id: 'migration',
    keywords: ['migrate', 'migration', 'switch', 'transfer', 'competitor', 'avalara', 'zonos', 'simplyduty'],
    question: 'How do I migrate from a competitor?',
    answer: 'POTAL\'s API is designed for easy migration. Our REST endpoints follow standard patterns. We offer: 1) API mapping guides for Avalara/Zonos, 2) Free migration support for Pro+, 3) 30-day parallel run to validate accuracy. Contact support@potal.app.',
    category: 'setup',
  },
  {
    id: 'image-classify',
    keywords: ['image', 'photo', 'picture', 'classify', 'visual', 'camera', 'scan'],
    question: 'Can I classify products by image?',
    answer: 'Yes! POST to /api/v1/classify with an image URL or base64 data. Our AI analyzes the image to identify the product and assign an HS code. Best results with clear product photos on white backgrounds.',
    category: 'features',
  },
  {
    id: 'optimize',
    keywords: ['optimize', 'cheapest', 'lowest', 'save', 'reduce', 'minimize', 'fta', 'duty savings'],
    question: 'How can I reduce/optimize duty costs?',
    answer: 'POTAL automatically optimizes: 1) FTA preferential rates (63 agreements), 2) MIN rates from 53 countries, 3) De minimis thresholds (ship under threshold = $0 duty), 4) HS code selection for lowest applicable rate. The response includes a tariffOptimization field with savings amount.',
    category: 'features',
  },
  {
    id: 'custom-hs',
    keywords: ['custom', 'override', 'manual', 'submit', 'own hs code', 'my hs code'],
    question: 'Can I submit my own HS code?',
    answer: 'Yes! Include hsCode in your API request to skip auto-classification. Supports 4-10 digit codes. We\'ll validate the format and calculate duties based on your provided code. Useful when you have certified classifications.',
    category: 'technical',
  },
  {
    id: 'multilang',
    keywords: ['language', 'translate', 'korean', 'japanese', 'chinese', 'multilingual', 'i18n', 'localize'],
    question: 'How many languages are supported?',
    answer: 'POTAL supports 50 languages for the widget, dashboard, and API responses. Major languages: English, Korean, Japanese, Chinese, Spanish, French, German, Portuguese, Arabic, Hindi, Thai, Vietnamese, Turkish, and more.',
    category: 'features',
  },
  {
    id: 'sanctions',
    keywords: ['sanctions', 'ofac', 'sdn', 'screening', 'denied', 'blocked', 'embargo'],
    question: 'How does sanctions screening work?',
    answer: 'POTAL screens against OFAC SDN, BIS Entity List, EU, UN, and UK sanctions lists (21,301+ entries). The /api/v1/sanctions/screen endpoint checks names with fuzzy matching. Results include match confidence and list details.',
    category: 'features',
  },
  {
    id: 'currency',
    keywords: ['currency', 'exchange', 'conversion', 'usd', 'eur', 'rate', 'forex'],
    question: 'How are currency conversions handled?',
    answer: 'POTAL uses daily-updated exchange rates (ECB + Fed). All calculations default to USD but you can specify currency in the request. Duty amounts are converted at the rate applicable on the calculation date.',
    category: 'technical',
  },
  {
    id: 'mcp-server',
    keywords: ['mcp', 'model context', 'ai agent', 'claude', 'llm', 'chatgpt', 'ai integration'],
    question: 'What is the POTAL MCP server?',
    answer: 'POTAL provides an MCP (Model Context Protocol) server that lets AI agents (Claude, ChatGPT, etc.) call POTAL APIs directly. Install via `npx potal-mcp-server`. 9 tools available: calculate, classify, screen sanctions, and more. Registered at registry.modelcontextprotocol.io.',
    category: 'integration',
  },
];

// ─── FAQ Matching Engine ────────────────────────────

function findBestMatch(question: string): { entry: FaqEntry; score: number } | null {
  const q = question.toLowerCase();
  const scored: Array<{ entry: FaqEntry; score: number }> = [];

  for (const entry of FAQ_DATABASE) {
    let score = 0;
    let matchCount = 0;

    for (const keyword of entry.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        score += keyword.length;
        matchCount++;
      }
    }

    // Multi-keyword bonus: 2+ matches → 1.5x score
    if (matchCount >= 2) {
      score = Math.round(score * 1.5);
    }

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  // Minimum score 5 to prevent false matches on short words
  if (scored.length > 0 && scored[0].score >= 5) {
    return scored[0];
  }

  return null;
}

function getSuggestions(question: string): Array<{ id: string; title: string; score: number }> {
  const q = question.toLowerCase();
  const scored: Array<{ id: string; title: string; score: number }> = [];

  for (const entry of FAQ_DATABASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }
    if (score > 0) {
      scored.push({ id: entry.id, title: entry.question, score });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

// ─── Localized Fallback Messages (20 languages) ─────

const FALLBACK_MESSAGES: Record<string, string> = {
  en: 'I couldn\'t find a specific answer. Please contact support@potal.app or visit potal.app/developers/docs.',
  ko: '해당 질문에 대한 답변을 찾지 못했습니다. support@potal.app으로 문의해주세요.',
  ja: 'ご質問に対する回答が見つかりませんでした。support@potal.appまでお問い合わせください。',
  zh: '未找到相关答案。请联系 support@potal.app。',
  es: 'No encontramos una respuesta. Contacte support@potal.app.',
  fr: 'Aucune réponse trouvée. Contactez support@potal.app.',
  de: 'Keine Antwort gefunden. Kontaktieren Sie support@potal.app.',
  pt: 'Nenhuma resposta encontrada. Contate support@potal.app.',
  ru: 'Ответ не найден. Свяжитесь с support@potal.app.',
  ar: 'لم يتم العثور على إجابة. تواصل مع support@potal.app.',
  hi: 'कोई उत्तर नहीं मिला। support@potal.app से संपर्क करें।',
  th: 'ไม่พบคำตอบ กรุณาติดต่อ support@potal.app',
  vi: 'Không tìm thấy câu trả lời. Liên hệ support@potal.app.',
  tr: 'Yanıt bulunamadı. support@potal.app ile iletişime geçin.',
  pl: 'Nie znaleziono odpowiedzi. Skontaktuj się z support@potal.app.',
  nl: 'Geen antwoord gevonden. Neem contact op met support@potal.app.',
  sv: 'Inget svar hittades. Kontakta support@potal.app.',
  da: 'Intet svar fundet. Kontakt support@potal.app.',
  it: 'Nessuna risposta trovata. Contatta support@potal.app.',
  id: 'Jawaban tidak ditemukan. Hubungi support@potal.app.',
};

// ─── POST Handler ───────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const language = typeof body.language === 'string' ? body.language.toLowerCase().trim() : 'en';
  const context = typeof body.context === 'object' && body.context !== null
    ? body.context as Record<string, string>
    : {};

  if (!question) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'question field is required.');
  }

  if (question.length > 1000) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Question must be under 1000 characters.');
  }

  if (language !== 'en' && !SUPPORTED_LANGUAGES.has(language)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Unsupported language "${language}".`);
  }

  const match = findBestMatch(question);

  if (match) {
    const { entry } = match;
    const localized = language !== 'en' && entry.i18n?.[language];
    let responseAnswer = localized ? localized.answer : entry.answer;
    const responseQuestion = localized ? localized.question : entry.question;

    // Plan-based context enrichment
    const plan = context.plan;
    if (plan === 'free' && entry.id === 'pricing') {
      responseAnswer += '\n\n💡 You\'re on the Forever Free plan — 100,000 API calls/month with all features included.';
    } else if (plan === 'enterprise') {
      responseAnswer += '\n\nAs an Enterprise customer, you have a dedicated CSM. Contact your account manager for personalized assistance.';
    }

    return NextResponse.json({
      success: true,
      data: {
        answered: true,
        question: responseQuestion,
        answer: responseAnswer,
        category: entry.category,
        faqId: entry.id,
        confidence: 'high',
        source: 'faq',
        language,
        availableLanguages: ['en', ...(entry.i18n ? Object.keys(entry.i18n) : [])],
      },
    });
  }

  // No FAQ match — return fallback with suggestions
  const suggestions = getSuggestions(question);
  const fallbackAnswer = FALLBACK_MESSAGES[language] || FALLBACK_MESSAGES['en'];

  return NextResponse.json({
    success: true,
    data: {
      answered: false,
      question,
      answer: fallbackAnswer,
      category: 'general',
      confidence: 'low',
      source: 'fallback',
      language,
      matched: false,
      suggestions,
      helpfulLinks: [
        { label: 'API Documentation', url: 'https://www.potal.app/developers/docs' },
        { label: 'Quick Start Guide', url: 'https://www.potal.app/developers/quickstart' },
        { label: 'Contact Support', url: 'mailto:support@potal.app' },
      ],
    },
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'POTAL AI Support Agent — Multilingual',
    usage: 'POST with { question: "How do I get an API key?", language?: "ko" }',
    categories: ['pricing', 'setup', 'coverage', 'technical', 'features', 'integration', 'legal'],
    faqCount: FAQ_DATABASE.length,
    supportedLanguages: Array.from(SUPPORTED_LANGUAGES),
  });
}
