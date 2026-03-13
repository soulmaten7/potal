/**
 * POTAL F126 — 240-Country Regulation RAG Foundation
 *
 * Vector-based Retrieval-Augmented Generation for customs regulations.
 * Searches regulation_vectors table (pgvector) for relevant regulation text
 * based on country, topic, and semantic similarity.
 *
 * Table: regulation_vectors (to be created via migration)
 *   - id, country_code, topic, title, content, source_url, effective_date, embedding(1536)
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────

export interface RegulationDocument {
  id: string;
  countryCode: string;
  topic: string;
  title: string;
  content: string;
  sourceUrl?: string;
  effectiveDate?: string;
  similarity?: number;
}

export interface RegulationSearchInput {
  /** ISO 2-letter country code */
  countryCode: string;
  /** Query text for semantic search */
  query: string;
  /** Filter by topic: tariff, vat, import_restriction, export_control, fta, customs_procedure, labeling, etc. */
  topic?: string;
  /** Max results to return (default 5) */
  limit?: number;
}

export interface RegulationSearchResult {
  documents: RegulationDocument[];
  query: string;
  countryCode: string;
  topic?: string;
  totalFound: number;
}

export interface RegulationInsertInput {
  countryCode: string;
  topic: string;
  title: string;
  content: string;
  sourceUrl?: string;
  effectiveDate?: string;
}

// ─── Supabase Client ───────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for regulation RAG');
  return createClient(url, key);
}

// ─── Embedding Generation ──────────────────────────

async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.slice(0, 8000),
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

// ─── Search ────────────────────────────────────────

/**
 * Search regulation documents by semantic similarity.
 */
export async function searchRegulations(input: RegulationSearchInput): Promise<RegulationSearchResult> {
  const supabase = getSupabase();
  const limit = Math.min(input.limit || 5, 20);

  // Try vector search first
  const embedding = await generateEmbedding(input.query);

  if (embedding) {
    try {
      const { data, error } = await supabase.rpc('match_regulation_vectors', {
        query_embedding: embedding,
        match_country: input.countryCode.toUpperCase(),
        match_topic: input.topic || null,
        match_threshold: 0.7,
        match_count: limit,
      });

      if (!error && data && data.length > 0) {
        return {
          documents: data.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            countryCode: d.country_code as string,
            topic: d.topic as string,
            title: d.title as string,
            content: d.content as string,
            sourceUrl: d.source_url as string | undefined,
            effectiveDate: d.effective_date as string | undefined,
            similarity: d.similarity as number | undefined,
          })),
          query: input.query,
          countryCode: input.countryCode,
          topic: input.topic,
          totalFound: data.length,
        };
      }
    } catch { /* fallback to text search */ }
  }

  // Fallback: text search with ilike
  let query = supabase
    .from('regulation_vectors')
    .select('id, country_code, topic, title, content, source_url, effective_date')
    .eq('country_code', input.countryCode.toUpperCase())
    .or(`title.ilike.%${input.query}%,content.ilike.%${input.query}%`)
    .limit(limit);

  if (input.topic) {
    query = query.eq('topic', input.topic);
  }

  const { data, error } = await query;

  if (error) {
    return { documents: [], query: input.query, countryCode: input.countryCode, topic: input.topic, totalFound: 0 };
  }

  return {
    documents: (data || []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      countryCode: d.country_code as string,
      topic: d.topic as string,
      title: d.title as string,
      content: d.content as string,
      sourceUrl: d.source_url as string | undefined,
      effectiveDate: d.effective_date as string | undefined,
    })),
    query: input.query,
    countryCode: input.countryCode,
    topic: input.topic,
    totalFound: (data || []).length,
  };
}

// ─── Insert ────────────────────────────────────────

/**
 * Insert a regulation document with its embedding vector.
 */
export async function insertRegulation(input: RegulationInsertInput): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabase();

  const embeddingText = `${input.title} ${input.content}`.slice(0, 8000);
  const embedding = await generateEmbedding(embeddingText);

  const { data, error } = await supabase
    .from('regulation_vectors')
    .insert({
      country_code: input.countryCode.toUpperCase(),
      topic: input.topic,
      title: input.title,
      content: input.content,
      source_url: input.sourceUrl,
      effective_date: input.effectiveDate,
      embedding,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}

// ─── Available Topics ──────────────────────────────

export const REGULATION_TOPICS = [
  'tariff',
  'vat',
  'import_restriction',
  'export_control',
  'fta',
  'customs_procedure',
  'labeling',
  'packaging',
  'certification',
  'sanitary',
  'environmental',
  'trade_remedy',
  'sanctions',
  'documentation',
  'valuation',
  'classification',
] as const;

export type RegulationTopic = typeof REGULATION_TOPICS[number];
