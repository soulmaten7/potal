/**
 * POTAL API v1 — /api/v1/support
 *
 * AI Support Agent — FAQ-based auto-response for common questions.
 * Falls back to "contact us" for complex queries.
 *
 * POST /api/v1/support
 * Body: { question: string, context?: { sellerId?: string, plan?: string } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── FAQ Knowledge Base ─────────────────────────────

interface FaqEntry {
  keywords: string[];
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATABASE: FaqEntry[] = [
  // Pricing & Plans
  {
    keywords: ['pricing', 'price', 'cost', 'plan', 'plans', 'free', 'subscription'],
    question: 'What are the pricing plans?',
    answer: 'POTAL offers 4 plans: Free (100 calc/month, $0), Basic (2,000 calc/month, $20/mo), Pro (10,000 calc/month, $80/mo), Enterprise (50,000 calc/month, $300/mo). Annual billing saves 20%. Overage: $0.015-$0.008/calc depending on plan.',
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
    keywords: ['hs code', 'hs-code', 'classify', 'classification', 'tariff code'],
    question: 'How does HS code classification work?',
    answer: 'POTAL uses AI-powered classification: DB cache → keyword matching → AI model. Just provide a product name and we\'ll classify it automatically. You can also provide your own HS code. Classification affects duty rate accuracy.',
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

// ─── POST Handler ───────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';

  if (!question) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'question field is required.');
  }

  if (question.length > 1000) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Question must be under 1000 characters.');
  }

  const match = findBestMatch(question);

  if (match) {
    return NextResponse.json({
      success: true,
      data: {
        answered: true,
        question: match.question,
        answer: match.answer,
        category: match.category,
        confidence: 'high',
        source: 'faq',
      },
    });
  }

  // No FAQ match — suggest contact
  return NextResponse.json({
    success: true,
    data: {
      answered: false,
      question: question,
      answer: 'I couldn\'t find a specific answer to your question. Please contact our support team at support@potal.app or visit our documentation at potal.app/developers/docs for detailed guides.',
      category: 'general',
      confidence: 'low',
      source: 'fallback',
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
    message: 'POTAL AI Support Agent',
    usage: 'POST with { question: "How do I get an API key?" }',
    categories: ['pricing', 'setup', 'coverage', 'technical', 'features', 'integration'],
  });
}
