/**
 * POTAL API v1 — /api/v1/support/chat
 * AI-powered support chatbot (Groq LLM) — Crisp webhook target
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const groqApiKey = process.env.GROQ_API_KEY || '';

function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

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

async function lookupQuickAnswer(question: string): Promise<string | null> {
  const q = question.toLowerCase();
  const sb = getSupabase();

  // VAT rate lookup
  const vatMatch = q.match(/vat.*(?:rate|tax).*(?:in|for)\s+(\w+)/i) || q.match(/(\w+)\s+vat/i);
  if (vatMatch) {
    const country = vatMatch[1].toUpperCase().substring(0, 2);
    const { data } = await sb.from('vat_gst_rates').select('rate, vat_rate, country_code').eq('country_code', country).single();
    if (data) return `The VAT/GST rate for ${country} is ${data.rate || data.vat_rate}%.`;
  }

  // De minimis lookup
  if (q.includes('de minimis') || q.includes('threshold')) {
    const countryMatch = q.match(/(?:for|in)\s+(\w{2})/i);
    if (countryMatch) {
      const cc = countryMatch[1].toUpperCase();
      const { data } = await sb.from('de_minimis_thresholds').select('*').eq('country_code', cc).single();
      if (data) return `De minimis threshold for ${cc}: $${data.threshold_usd || data.amount} ${data.currency || 'USD'}.`;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const question = typeof body.message === 'string' ? body.message.trim() : '';
  if (!question) return NextResponse.json({ error: 'message required' }, { status: 400 });

  // Try quick DB lookup first
  const quickAnswer = await lookupQuickAnswer(question);
  if (quickAnswer) {
    return NextResponse.json({ response: quickAnswer, source: 'database' });
  }

  // Fall back to Groq LLM
  if (!groqApiKey) {
    return NextResponse.json({
      response: 'Thank you for your question. For detailed assistance, please visit https://www.potal.app or email support@potal.app.',
      source: 'fallback',
    });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({
        response: 'I apologize, but I\'m currently unable to process your request. Please try again or contact support@potal.app.',
        source: 'error',
      });
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || 'No response generated.';

    return NextResponse.json({ response: answer, source: 'ai' });
  } catch {
    return NextResponse.json({
      response: 'Thank you for your question. For immediate assistance, please email support@potal.app.',
      source: 'fallback',
    });
  }
}
