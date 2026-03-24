/**
 * POTAL F126 — 240-Country Regulation RAG
 *
 * Vector-based Retrieval-Augmented Generation for customs regulations.
 * Features:
 * - pgvector semantic search with RPC fallback to ilike
 * - Embedding cache (1hr TTL, 1000 entries)
 * - Reranking: similarity * 0.6 + recency * 0.2 + authority * 0.2
 * - Snippet generation with keyword highlighting context
 * - Batch insert with UPSERT + topic validation
 * - Empty table detection
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

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
  finalScore?: number;
  recencyScore?: number;
  authorityScore?: number;
  snippet?: string;
}

export interface RegulationSearchInput {
  countryCode: string;
  query: string;
  topic?: string;
  limit?: number;
}

export interface RegulationSearchResult {
  documents: RegulationDocument[];
  query: string;
  countryCode: string;
  topic?: string;
  totalFound: number;
  meta: {
    tableEmpty: boolean;
    searchMethod: 'vector' | 'fallback_ilike' | 'none';
    queryCached: boolean;
    totalRegulations: number;
  };
}

export interface RegulationInsertInput {
  countryCode: string;
  topic: string;
  title: string;
  content: string;
  sourceUrl?: string;
  effectiveDate?: string;
}

// ─── Constants ───────────────────────────────────────

export const REGULATION_TOPICS = [
  'tariff', 'vat', 'import_restriction', 'export_control', 'fta',
  'customs_procedure', 'labeling', 'packaging', 'certification',
  'sanitary', 'environmental', 'trade_remedy', 'sanctions',
  'documentation', 'valuation', 'classification',
] as const;

export type RegulationTopic = typeof REGULATION_TOPICS[number];

// ─── Embedding Cache ─────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 1000;

const embeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();

function hashText(text: string): string {
  return createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

function getCachedEmbedding(text: string): number[] | null {
  const key = hashText(text);
  const cached = embeddingCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.embedding;
  if (cached) embeddingCache.delete(key);
  return null;
}

function setCachedEmbedding(text: string, embedding: number[]): void {
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [k, v] of embeddingCache) {
      if (v.timestamp < oldestTime) { oldestTime = v.timestamp; oldestKey = k; }
    }
    if (oldestKey) embeddingCache.delete(oldestKey);
  }
  embeddingCache.set(hashText(text), { embedding, timestamp: Date.now() });
}

// ─── Supabase ────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Embedding Generation ────────────────────────────

async function generateEmbedding(text: string): Promise<number[] | null> {
  // Check cache first
  const cached = getCachedEmbedding(text);
  if (cached) return cached;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text.slice(0, 8000), model: 'text-embedding-3-small' }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;
    if (embedding) setCachedEmbedding(text, embedding);
    return embedding || null;
  } catch {
    return null;
  }
}

// ─── Scoring Utilities ───────────────────────────────

/**
 * Score source authority based on URL domain.
 * Government sites = 1.0, international orgs = 0.9, other = 0.6
 */
export function getAuthorityScore(url: string): number {
  if (!url) return 0.5;
  if (/\.(gov|go\.\w+|gc\.ca|europa\.eu|customs\.\w+)/.test(url)) return 1.0;
  if (/\.(org|int)/.test(url)) return 0.9;
  return 0.6;
}

/**
 * Generate a text snippet with query context around the matched term.
 */
export function generateSnippet(content: string, query: string, contextLen: number = 80): string {
  if (!content || !query) return '';
  const lower = content.toLowerCase();
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  // Find first matching word
  let bestIdx = -1;
  for (const word of queryWords) {
    const idx = lower.indexOf(word);
    if (idx !== -1) { bestIdx = idx; break; }
  }

  if (bestIdx === -1) return content.slice(0, contextLen * 2) + (content.length > contextLen * 2 ? '...' : '');

  const start = Math.max(0, bestIdx - contextLen);
  const end = Math.min(content.length, bestIdx + query.length + contextLen);
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}

// ─── Search ──────────────────────────────────────────

export async function searchRegulations(input: RegulationSearchInput): Promise<RegulationSearchResult> {
  const supabase = getSupabase();
  const emptyResult: RegulationSearchResult = {
    documents: [], query: input.query, countryCode: input.countryCode,
    topic: input.topic, totalFound: 0,
    meta: { tableEmpty: true, searchMethod: 'none', queryCached: false, totalRegulations: 0 },
  };

  if (!supabase) return emptyResult;

  const limit = Math.min(input.limit || 5, 20);

  // 1. Check if table has data
  try {
    const { count } = await (supabase.from('regulation_vectors') as any)
      .select('id', { count: 'exact', head: true });

    if (!count || count === 0) {
      return { ...emptyResult, meta: { ...emptyResult.meta, tableEmpty: true, totalRegulations: 0 } };
    }

    emptyResult.meta.totalRegulations = count;
    emptyResult.meta.tableEmpty = false;
  } catch {
    // Table might not exist yet — return empty
    return emptyResult;
  }

  // 2. Try vector search
  const queryCached = getCachedEmbedding(input.query) !== null;
  const embedding = await generateEmbedding(input.query);

  let results: Array<Record<string, unknown>> = [];
  let searchMethod: 'vector' | 'fallback_ilike' = 'vector';

  if (embedding) {
    try {
      const { data, error } = await (supabase as any).rpc('match_regulation_vectors', {
        query_embedding: embedding,
        match_country: input.countryCode.toUpperCase(),
        match_topic: input.topic || null,
        match_threshold: 0.7,
        match_count: limit,
      });

      if (!error && data && data.length > 0) {
        results = data;
      } else {
        throw new Error(error?.message || 'No vector results');
      }
    } catch {
      // Fallback to text search
      searchMethod = 'fallback_ilike';
    }
  } else {
    searchMethod = 'fallback_ilike';
  }

  // 3. Fallback: ilike with date ordering
  if (searchMethod === 'fallback_ilike') {
    try {
      let q = (supabase.from('regulation_vectors') as any)
        .select('id, country_code, topic, title, content, source_url, effective_date, updated_at, created_at')
        .eq('country_code', input.countryCode.toUpperCase())
        .or(`title.ilike.%${input.query}%,content.ilike.%${input.query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (input.topic) q = q.eq('topic', input.topic);

      const { data } = await q;
      results = (data || []).map((r: Record<string, unknown>) => ({ ...r, similarity: 0.5 }));
    } catch {
      results = [];
    }
  }

  // 4. Rerank: similarity * 0.6 + recency * 0.2 + authority * 0.2
  const now = Date.now();
  const documents: RegulationDocument[] = results.map((r: Record<string, unknown>) => {
    const dateStr = (r.effective_date || r.updated_at || r.created_at) as string;
    const ageMs = dateStr ? now - new Date(dateStr).getTime() : now;
    const ageDays = Math.max(0, ageMs / (1000 * 60 * 60 * 24));
    const recency = ageDays < 180 ? 1.0 : ageDays < 365 ? 0.7 : 0.3;
    const authority = getAuthorityScore((r.source_url || '') as string);
    const sim = (r.similarity as number) || 0.5;
    const finalScore = Math.round((sim * 0.6 + recency * 0.2 + authority * 0.2) * 1000) / 1000;
    const snippet = generateSnippet((r.content || '') as string, input.query);

    return {
      id: r.id as string,
      countryCode: (r.country_code || input.countryCode) as string,
      topic: r.topic as string,
      title: r.title as string,
      content: r.content as string,
      sourceUrl: r.source_url as string | undefined,
      effectiveDate: r.effective_date as string | undefined,
      similarity: sim,
      finalScore,
      recencyScore: recency,
      authorityScore: authority,
      snippet,
    };
  }).sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

  return {
    documents,
    query: input.query,
    countryCode: input.countryCode,
    topic: input.topic,
    totalFound: documents.length,
    meta: {
      tableEmpty: false,
      searchMethod,
      queryCached,
      totalRegulations: emptyResult.meta.totalRegulations,
    },
  };
}

// ─── Insert (single) ─────────────────────────────────

export async function insertRegulation(
  input: RegulationInsertInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  // Topic validation
  if (!REGULATION_TOPICS.includes(input.topic as RegulationTopic)) {
    return { success: false, error: `Invalid topic "${input.topic}". Valid: ${REGULATION_TOPICS.join(', ')}` };
  }

  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Database not available' };

  try {
    const embeddingText = `${input.title} ${input.content}`.slice(0, 8000);
    const embedding = await generateEmbedding(embeddingText);

    const { data, error } = await (supabase.from('regulation_vectors') as any)
      .upsert({
        country_code: input.countryCode.toUpperCase(),
        topic: input.topic,
        title: input.title,
        content: input.content,
        source_url: input.sourceUrl,
        effective_date: input.effectiveDate,
        embedding,
      }, { onConflict: 'country_code,topic,title' })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Insert failed' };
  }
}

// ─── Batch Insert ────────────────────────────────────

export async function insertRegulationsBatch(
  regulations: RegulationInsertInput[],
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;
  let skipped = 0;

  const supabase = getSupabase();
  if (!supabase) return { inserted: 0, skipped: regulations.length, errors: ['Database not available'] };

  // Process in chunks of 50
  const CHUNK_SIZE = 50;
  for (let i = 0; i < regulations.length; i += CHUNK_SIZE) {
    const chunk = regulations.slice(i, i + CHUNK_SIZE);

    // Validate topics
    const valid: RegulationInsertInput[] = [];
    for (const r of chunk) {
      if (!REGULATION_TOPICS.includes(r.topic as RegulationTopic)) {
        errors.push(`Invalid topic "${r.topic}" for "${r.title}"`);
        skipped++;
      } else {
        valid.push(r);
      }
    }

    if (valid.length === 0) continue;

    // Generate embeddings
    const rows = await Promise.all(valid.map(async (r) => {
      const embedding = await generateEmbedding(`${r.title} ${r.content}`.slice(0, 8000));
      return {
        country_code: r.countryCode.toUpperCase(),
        topic: r.topic,
        title: r.title,
        content: r.content,
        source_url: r.sourceUrl || null,
        effective_date: r.effectiveDate || null,
        embedding,
      };
    }));

    try {
      const { error } = await (supabase.from('regulation_vectors') as any)
        .upsert(rows, { onConflict: 'country_code,topic,title' });

      if (error) {
        errors.push(`Chunk ${i}: ${error.message}`);
        skipped += rows.length;
      } else {
        inserted += rows.length;
      }
    } catch (err) {
      errors.push(`Chunk ${i}: ${err instanceof Error ? err.message : 'Insert failed'}`);
      skipped += rows.length;
    }
  }

  return { inserted, skipped, errors };
}

// ─── Update / Delete ─────────────────────────────────

export async function updateRegulation(
  id: string,
  data: Partial<RegulationInsertInput>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Database not available' };

  try {
    const updates: Record<string, unknown> = {};
    if (data.countryCode) updates.country_code = data.countryCode.toUpperCase();
    if (data.topic) {
      if (!REGULATION_TOPICS.includes(data.topic as RegulationTopic)) {
        return { success: false, error: `Invalid topic "${data.topic}"` };
      }
      updates.topic = data.topic;
    }
    if (data.title) updates.title = data.title;
    if (data.content) updates.content = data.content;
    if (data.sourceUrl !== undefined) updates.source_url = data.sourceUrl;
    if (data.effectiveDate !== undefined) updates.effective_date = data.effectiveDate;

    // Regenerate embedding if content or title changed
    if (data.content || data.title) {
      const text = `${data.title || ''} ${(data.content || '').slice(0, 8000)}`;
      updates.embedding = await generateEmbedding(text);
    }

    const { error } = await (supabase.from('regulation_vectors') as any)
      .update(updates).eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
  }
}

export async function deleteRegulation(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Database not available' };

  try {
    const { error } = await (supabase.from('regulation_vectors') as any).delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
  }
}
