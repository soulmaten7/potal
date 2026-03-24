/**
 * POTAL API v1 — /api/v1/support/chat
 * AI-powered support chatbot (Groq LLM)
 *
 * Features:
 * - Conversation history (up to 10 turns)
 * - Regulation RAG context injection
 * - Country-aware DB lookups (240 countries)
 * - IP-based rate limiting (10 req/min)
 * - Chat logging to support_chat_logs
 * - Groq LLM fallback chain
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

// ─── System Prompt ───────────────────────────────────

const SYSTEM_PROMPT = `You are POTAL's trade compliance AI assistant. You help with tariff calculations, HS code classification, and customs regulations for 240 countries.

Key facts about POTAL:
- Total Landed Cost calculator covering 240 countries
- HS code classification with 5,371+ codes (WCO HS 2022)
- MFN tariff rates from WITS+WTO (1M+ rows) + MacMap data (113M+ MIN, 144M+ AGR rows)
- 63 Free Trade Agreements with preferential rate optimization
- VAT/GST rates for 240 countries, de minimis thresholds
- Sanctions screening (OFAC SDN, BIS, EU, UN, UK — 21,301 entries)
- Trade remedy data (AD/CVD/Safeguard — 119,706 cases)
- API at https://www.potal.app/api/v1/

Pricing: Free (200 lookups/mo), Basic $20 (2,000), Pro $80 (10,000), Enterprise $300 (50,000)

Be concise and helpful. For simple questions (VAT rates, de minimis, HS codes), provide direct answers.
For complex or uncertain questions, say: "For detailed analysis, I recommend using our API or contacting support@potal.app."
Always be accurate — never guess tax rates or duty rates.`;

// ─── Rate Limiting (IP-based, in-memory) ─────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, maxReqs: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > maxReqs;
}

// Periodic cleanup to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  }, 60000);
}

// ─── Country Matching (240 countries) ────────────────

let countriesCache: Array<{ name: string; iso2: string; iso3: string | null }> | null = null;

async function getCountries() {
  if (countriesCache) return countriesCache;
  const sb = getSupabase();
  const { data } = await sb.from('countries').select('name, iso2, iso3');
  if (data) {
    countriesCache = data.sort((a, b) => b.name.length - a.name.length);
  }
  return countriesCache || [];
}

async function matchCountryFromText(text: string): Promise<{ name: string; iso2: string } | null> {
  const countries = await getCountries();
  const lower = text.toLowerCase();

  for (const c of countries) {
    if (lower.includes(c.name.toLowerCase())) {
      return { name: c.name, iso2: c.iso2 };
    }
  }
  // Try ISO codes (exact word match)
  for (const c of countries) {
    const iso2Re = new RegExp(`\\b${c.iso2}\\b`, 'i');
    if (iso2Re.test(text)) {
      return { name: c.name, iso2: c.iso2 };
    }
  }
  return null;
}

// ─── Quick DB Lookups ────────────────────────────────

async function lookupQuickAnswer(question: string): Promise<{ answer: string } | null> {
  const q = question.toLowerCase();
  const sb = getSupabase();

  // VAT rate lookup
  if (/\b(vat|gst|tax rate|sales tax)\b/i.test(question)) {
    const country = await matchCountryFromText(question);
    if (country) {
      const { data } = await sb.from('vat_gst_rates')
        .select('rate, vat_rate, vat_name')
        .eq('country_code', country.iso2)
        .single();
      if (data) {
        const rate = data.rate ?? data.vat_rate;
        if (rate != null) {
          return { answer: `${country.name} ${data.vat_name || 'VAT'} rate is ${rate}%.` };
        }
        return { answer: `VAT rate data is not available for ${country.name}. Please check our API for the latest data.` };
      }
    }
  }

  // De minimis lookup
  if (/\b(de minimis|duty.?free|threshold)\b/i.test(q)) {
    const country = await matchCountryFromText(question);
    if (country) {
      const { data } = await sb.from('de_minimis_thresholds')
        .select('threshold_usd, amount, currency')
        .eq('country_code', country.iso2)
        .single();
      if (data) {
        const threshold = data.threshold_usd ?? data.amount;
        if (threshold != null) {
          return { answer: `${country.name} de minimis threshold is $${threshold} ${data.currency || 'USD'}.` };
        }
      }
    }
  }

  return null;
}

// ─── Conversation History ────────────────────────────

function truncateHistory(
  messages: Array<{ role: string; content: string }>,
  maxChars: number
): Array<{ role: string; content: string }> {
  let total = 0;
  const result: Array<{ role: string; content: string }> = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const len = messages[i].content.length;
    if (total + len > maxChars) break;
    total += len;
    result.unshift(messages[i]);
  }
  return result.slice(-10); // Max 10 turns
}

// ─── RAG Context ─────────────────────────────────────

async function getRagContext(query: string): Promise<string> {
  try {
    const { searchRegulations } = await import('@/app/lib/cost-engine/regulation-rag');
    const ragResult = await searchRegulations({ query, countryCode: '', limit: 3 });
    if (ragResult && ragResult.documents && ragResult.documents.length > 0) {
      return '\n\nRelevant regulations:\n' +
        ragResult.documents.map((r: { title: string; countryCode: string; topic: string; content: string }, i: number) =>
          `${i + 1}. [${r.title}] (${r.countryCode}, ${r.topic}): ${r.content?.slice(0, 200)}`
        ).join('\n');
    }
  } catch {
    // RAG not available yet — continue without it
  }
  return '';
}

// ─── Chat Logging ────────────────────────────────────

async function logChat(
  sessionId: string | undefined,
  userMsg: string,
  aiResponse: string,
  source: string,
  responseTimeMs: number
) {
  try {
    const sb = getSupabase();
    await sb.from('support_chat_logs').insert({
      session_id: sessionId || 'anonymous',
      user_message: userMsg.slice(0, 2000),
      ai_response: aiResponse.slice(0, 5000),
      source,
      response_time_ms: responseTimeMs,
    });
  } catch {
    // Log failure is non-critical
  }
}

// ─── Fallback Messages ──────────────────────────────

function getFallbackMessage(language: string): string {
  const messages: Record<string, string> = {
    en: 'Thank you for your question. For detailed assistance, please visit https://www.potal.app or email support@potal.app.',
    ko: '질문 감사합니다. 자세한 도움은 https://www.potal.app을 방문하시거나 support@potal.app으로 이메일 주세요.',
    ja: 'ご質問ありがとうございます。詳しくはhttps://www.potal.appをご覧いただくか、support@potal.appまでお問い合わせください。',
    zh: '感谢您的提问。详情请访问 https://www.potal.app 或发邮件至 support@potal.app。',
    es: 'Gracias por su pregunta. Para asistencia detallada, visite https://www.potal.app o escriba a support@potal.app.',
    fr: 'Merci pour votre question. Pour une assistance détaillée, visitez https://www.potal.app ou écrivez à support@potal.app.',
    de: 'Vielen Dank für Ihre Frage. Für detaillierte Hilfe besuchen Sie https://www.potal.app oder kontaktieren Sie support@potal.app.',
  };
  return messages[language] || messages['en'];
}

// ─── POST Handler ────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const messages = Array.isArray(body.messages) ? body.messages as Array<{ role: string; content: string }> : [];
  const language = typeof body.language === 'string' ? body.language : 'en';
  const sessionId = typeof body.session_id === 'string' ? body.session_id : undefined;

  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message must be under 2000 characters' }, { status: 400 });
  }

  // Rate limit: IP-based, 10 req/min
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip, 10, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 10 requests/minute.' },
      { status: 429 }
    );
  }

  const startTime = Date.now();

  // 1. Try quick DB lookup first (VAT, de minimis)
  try {
    const quickAnswer = await lookupQuickAnswer(message);
    if (quickAnswer) {
      await logChat(sessionId, message, quickAnswer.answer, 'database', Date.now() - startTime);
      return NextResponse.json({ response: quickAnswer.answer, source: 'database' });
    }
  } catch {
    // DB lookup failed — continue to LLM
  }

  // 2. Groq LLM
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.warn('[support/chat] GROQ_API_KEY missing — falling back to generic response');
    const fallback = getFallbackMessage(language);
    await logChat(sessionId, message, fallback, 'fallback_no_api_key', Date.now() - startTime);
    return NextResponse.json({ response: fallback, source: 'fallback_no_api_key' });
  }

  // 3. Get RAG context
  const ragContext = await getRagContext(message);

  // 4. Build conversation with history
  const historyMessages = truncateHistory(messages, 6000);
  const systemPrompt = SYSTEM_PROMPT + ragContext;

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: message },
  ];

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[support/chat] Groq error ${res.status}: ${errText.slice(0, 200)}`);

      // Retry once with longer timeout
      try {
        const retry = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            max_tokens: 500,
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(20000),
        });

        if (retry.ok) {
          const retryData = await retry.json();
          const answer = retryData.choices?.[0]?.message?.content || getFallbackMessage(language);
          const source = ragContext ? 'ai+rag' : 'ai';
          await logChat(sessionId, message, answer, source, Date.now() - startTime);
          return NextResponse.json({ response: answer, source, rag_used: !!ragContext });
        }
      } catch {
        // Retry also failed
      }

      const fallback = getFallbackMessage(language);
      await logChat(sessionId, message, fallback, 'fallback_groq_error', Date.now() - startTime);
      return NextResponse.json({ response: fallback, source: 'fallback_groq_error' });
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || getFallbackMessage(language);
    const source = ragContext ? 'ai+rag' : 'ai';

    await logChat(sessionId, message, answer, source, Date.now() - startTime);
    return NextResponse.json({ response: answer, source, rag_used: !!ragContext });

  } catch (err) {
    console.warn('[support/chat] Groq call failed:', (err as Error).message);
    const fallback = getFallbackMessage(language);
    await logChat(sessionId, message, fallback, 'fallback_timeout', Date.now() - startTime);
    return NextResponse.json({ response: fallback, source: 'fallback_timeout' });
  }
}
