/**
 * POTAL API v1 — /api/v1/support
 *
 * AI Support Agent — Multilingual FAQ-based auto-response.
 * Supports 50 languages. Falls back to "contact us" for complex queries.
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

// ─── FAQ Knowledge Base ─────────────────────────────

interface FaqEntry {
  keywords: string[];
  question: string;
  answer: string;
  /** Multilingual answers — key is ISO 639-1 code */
  i18n?: Record<string, { question: string; answer: string }>;
  category: string;
}

const FAQ_DATABASE: FaqEntry[] = [
  // Pricing & Plans
  {
    keywords: ['pricing', 'price', 'cost', 'plan', 'plans', 'free', 'subscription', '가격', '요금', '플랜', '料金', 'プラン', '价格', '套餐', 'precio', 'prix'],
    question: 'What are the pricing plans?',
    answer: 'POTAL offers 4 plans: Free (200 calc/month, $0), Basic (2,000 calc/month, $20/mo), Pro (10,000 calc/month, $80/mo), Enterprise (50,000 calc/month, $300/mo). Annual billing saves 20%. Overage: $0.015-$0.008/calc depending on plan.',
    i18n: {
      ko: { question: '요금제는 어떻게 되나요?', answer: 'POTAL은 4개 요금제를 제공합니다: Free (월 200건, $0), Basic (월 2,000건, $20/월), Pro (월 10,000건, $80/월), Enterprise (월 50,000건, $300/월). 연간 결제 시 20% 할인. 초과 요금: 플랜별 $0.015-$0.008/건.' },
      ja: { question: '料金プランは？', answer: 'POTALは4つのプランを提供: Free (月200件, $0), Basic (月2,000件, $20/月), Pro (月10,000件, $80/月), Enterprise (月50,000件, $300/月)。年払いで20%割引。超過料金: プランにより$0.015-$0.008/件。' },
      zh: { question: '价格方案是什么？', answer: 'POTAL提供4个方案：Free（月200次，$0），Basic（月2,000次，$20/月），Pro（月10,000次，$80/月），Enterprise（月50,000次，$300/月）。年付享8折。超额：$0.015-$0.008/次。' },
      es: { question: '¿Cuáles son los planes de precios?', answer: 'POTAL ofrece 4 planes: Free (200 cálc/mes, $0), Basic (2,000 cálc/mes, $20/mes), Pro (10,000 cálc/mes, $80/mes), Enterprise (50,000 cálc/mes, $300/mes). Facturación anual ahorra 20%.' },
      fr: { question: 'Quels sont les plans tarifaires ?', answer: 'POTAL propose 4 plans : Free (200 calc/mois, $0), Basic (2 000 calc/mois, $20/mois), Pro (10 000 calc/mois, $80/mois), Enterprise (50 000 calc/mois, $300/mois). Facturation annuelle : -20%.' },
      de: { question: 'Welche Preispläne gibt es?', answer: 'POTAL bietet 4 Pläne: Free (200 Ber./Monat, $0), Basic (2.000 Ber./Monat, $20/Monat), Pro (10.000 Ber./Monat, $80/Monat), Enterprise (50.000 Ber./Monat, $300/Monat). Jährliche Abrechnung spart 20%.' },
    },
    category: 'pricing',
  },
  {
    keywords: ['api key', 'api-key', 'authentication', 'auth', 'key'],
    question: 'How do I get an API key?',
    answer: 'Sign up at potal.app, go to Dashboard → API Keys. You\'ll get a publishable key (pk_live_...) for frontend use and a secret key (sk_live_...) for server-side use. Never expose your secret key in client-side code.',
    category: 'setup',
  },
  // Countries & Coverage
  {
    keywords: ['countries', 'country', 'supported', 'coverage', 'how many'],
    question: 'Which countries are supported?',
    answer: 'POTAL supports 240+ countries and territories. Duty rates come from 7 government APIs (USITC, UK Trade Tariff, EU TARIC, Canada CBSA, Australia ABF, Japan Customs, Korea KCS) plus MacMap data covering 53 countries with 100M+ tariff lines.',
    category: 'coverage',
  },
  // HS Code
  {
    keywords: ['hs code', 'hs-code', 'classify', 'classification', 'tariff code', 'HS코드', '분류', 'HSコード', '分類', 'HS编码'],
    question: 'How does HS code classification work?',
    answer: 'POTAL uses AI-powered classification: DB cache → keyword matching → AI model. Just provide a product name and we\'ll classify it automatically. You can also provide your own HS code. Classification affects duty rate accuracy.',
    i18n: {
      ko: { question: 'HS 코드 분류는 어떻게 작동하나요?', answer: 'POTAL은 AI 기반 분류를 사용합니다: DB 캐시 → 키워드 매칭 → AI 모델. 상품명만 제공하면 자동으로 분류합니다. 직접 HS 코드를 입력할 수도 있습니다. 분류 정확도가 관세율 정확도에 영향을 줍니다.' },
      ja: { question: 'HSコード分類はどのように機能しますか？', answer: 'POTALはAI分類を使用: DBキャッシュ → キーワードマッチング → AIモデル。商品名を提供するだけで自動分類します。HSコードを直接入力することも可能です。' },
      zh: { question: 'HS编码分类如何工作？', answer: 'POTAL使用AI分类：DB缓存→关键词匹配→AI模型。只需提供产品名称即可自动分类。您也可以直接输入HS编码。分类准确度影响关税率准确度。' },
    },
    category: 'technical',
  },
  // Duty Rates
  {
    keywords: ['duty', 'tariff', 'rate', 'accuracy', 'accurate'],
    question: 'How accurate are the duty rates?',
    answer: 'Each calculation includes a confidence score. Our 4-stage fallback (AGR agreement rates → MIN rates → NTLC MFN → hardcoded) ensures the best available rate. Government API data scores 85%+ confidence. With HS classification, accuracy typically exceeds 95%.',
    category: 'technical',
  },
  // DDP/DDU
  {
    keywords: ['ddp', 'ddu', 'delivered', 'shipping terms', 'buyer pays'],
    question: 'What\'s the difference between DDP and DDU?',
    answer: 'DDP (Delivered Duty Paid): Seller pays all duties/taxes upfront. Buyer pays one total price with no surprise fees. DDU (Delivered Duty Unpaid): Buyer pays duties/taxes at delivery. Use shippingTerms parameter ("DDP" or "DDU") in your API call.',
    category: 'features',
  },
  // Integration
  {
    keywords: ['woocommerce', 'shopify', 'bigcommerce', 'magento', 'plugin', 'integration', 'wordpress'],
    question: 'Which platforms are supported?',
    answer: 'POTAL integrates with: Shopify (Theme App Extension + OAuth), WooCommerce (WordPress plugin), BigCommerce (Script Manager widget), and Magento 2 (Composer module). GraphQL and REST APIs available for custom integrations.',
    category: 'integration',
  },
  // Trade Remedies
  {
    keywords: ['anti-dumping', 'countervailing', 'safeguard', 'trade remedy', 'section 301', 'section 232'],
    question: 'Does POTAL include trade remedies and Section 301/232?',
    answer: 'Yes! POTAL automatically checks AD (anti-dumping), CVD (countervailing duties), and safeguard measures from our database of 119,706 cases. For US destinations, Section 301 (China Lists 1-4A) and Section 232 (steel 25%, aluminum 10%) are automatically applied.',
    category: 'features',
  },
  // VAT/GST
  {
    keywords: ['vat', 'gst', 'tax', 'ioss', 'sales tax'],
    question: 'How does VAT/GST calculation work?',
    answer: 'POTAL calculates country-specific taxes: US state sales tax (by ZIP), Canada GST/HST/PST (by province), EU IOSS (≤€150 threshold), UK VAT (£135 threshold), Australia GST (LVG $1000), Brazil cascading taxes (IPI/PIS/COFINS/ICMS), India IGST+SWS, China CBEC, Mexico IVA+IEPS, and GCC VAT.',
    category: 'technical',
  },
  // Rate Limits
  {
    keywords: ['rate limit', 'throttle', 'limit', 'quota', 'overage'],
    question: 'What are the rate limits?',
    answer: 'Rate limits depend on your plan: Free (100/month), Basic (2,000/month), Pro (10,000/month), Enterprise (50,000/month). Overage is automatically billed at plan-specific rates. API rate limit is 100 req/minute for all plans.',
    category: 'pricing',
  },
  // Webhook
  {
    keywords: ['webhook', 'callback', 'notification', 'alert'],
    question: 'Do you support webhooks?',
    answer: 'Yes! Use the alerts API (/api/v1/alerts) to subscribe to tariff changes, trade remedy updates, and Section 301/232 changes. Notifications can be sent via webhook URL or email.',
    category: 'features',
  },
];

// ─── FAQ Matching Engine ────────────────────────────

function findBestMatch(question: string): FaqEntry | null {
  const q = question.toLowerCase();
  let bestMatch: FaqEntry | null = null;
  let bestScore = 0;

  for (const entry of FAQ_DATABASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer keyword matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Require minimum score to prevent false matches
  return bestScore >= 3 ? bestMatch : null;
}

// ─── Localized Fallback Messages ────────────────────

const FALLBACK_MESSAGES: Record<string, string> = {
  en: 'I couldn\'t find a specific answer to your question. Please contact our support team at support@potal.app or visit our documentation at potal.app/developers/docs for detailed guides.',
  ko: '질문에 대한 답변을 찾을 수 없습니다. support@potal.app으로 문의하시거나 potal.app/developers/docs에서 상세 가이드를 확인하세요.',
  ja: 'ご質問に対する回答が見つかりませんでした。support@potal.appまでお問い合わせいただくか、potal.app/developers/docsで詳細ガイドをご覧ください。',
  zh: '未找到您问题的答案。请联系support@potal.app或访问potal.app/developers/docs查看详细指南。',
  es: 'No pude encontrar una respuesta específica. Contacte a support@potal.app o visite potal.app/developers/docs.',
  fr: 'Je n\'ai pas trouvé de réponse spécifique. Contactez support@potal.app ou visitez potal.app/developers/docs.',
  de: 'Ich konnte keine spezifische Antwort finden. Kontaktieren Sie support@potal.app oder besuchen Sie potal.app/developers/docs.',
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

  if (!question) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'question field is required.');
  }

  if (question.length > 1000) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Question must be under 1000 characters.');
  }

  if (language !== 'en' && !SUPPORTED_LANGUAGES.has(language)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Unsupported language "${language}". Supported: ${Array.from(SUPPORTED_LANGUAGES).join(', ')}`);
  }

  const match = findBestMatch(question);

  if (match) {
    // Get localized content or fallback to English
    const localized = language !== 'en' && match.i18n?.[language];
    const responseQuestion = localized ? localized.question : match.question;
    const responseAnswer = localized ? localized.answer : match.answer;

    return NextResponse.json({
      success: true,
      data: {
        answered: true,
        question: responseQuestion,
        answer: responseAnswer,
        category: match.category,
        confidence: 'high',
        source: 'faq',
        language,
        availableLanguages: ['en', ...(match.i18n ? Object.keys(match.i18n) : [])],
      },
    });
  }

  // No FAQ match — suggest contact (localized)
  const fallbackAnswer = FALLBACK_MESSAGES[language] || FALLBACK_MESSAGES['en'];

  return NextResponse.json({
    success: true,
    data: {
      answered: false,
      question: question,
      answer: fallbackAnswer,
      category: 'general',
      confidence: 'low',
      source: 'fallback',
      language,
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
    categories: ['pricing', 'setup', 'coverage', 'technical', 'features', 'integration'],
    supportedLanguages: Array.from(SUPPORTED_LANGUAGES),
  });
}
