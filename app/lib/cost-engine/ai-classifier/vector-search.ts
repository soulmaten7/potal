/**
 * POTAL AI Classifier — Vector Search (pgvector)
 *
 * Cosine similarity-based HS code classification using pgvector.
 * Searches hs_classification_vectors table for nearest neighbors.
 *
 * Pipeline stage 1: Vector matching (cosine > 0.85)
 * Falls back to keyword matching and LLM if no match found.
 */

import { createClient } from '@supabase/supabase-js';
import type { HsClassificationResult } from '../hs-code/types';

// ─── Supabase Client ──────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Types ────────────────────────────────────────

export interface VectorSearchResult {
  productName: string;
  hsCode: string;
  category: string | null;
  similarity: number;
  source: string;
}

export interface VectorSearchConfig {
  /** Minimum cosine similarity threshold (default: 0.85) */
  minSimilarity: number;
  /** Maximum number of results to return (default: 5) */
  topK: number;
  /** Whether vector search is enabled */
  enabled: boolean;
}

export function getVectorSearchConfig(): VectorSearchConfig {
  return {
    minSimilarity: parseFloat(process.env.VECTOR_SEARCH_MIN_SIMILARITY || '0.85'),
    topK: parseInt(process.env.VECTOR_SEARCH_TOP_K || '5', 10),
    enabled: process.env.VECTOR_SEARCH_ENABLED !== 'false',
  };
}

// ─── Embedding Generation ─────────────────────────

/**
 * Generate embedding vector for a product name using OpenAI API.
 * Returns 1536-dimension vector (text-embedding-3-small).
 *
 * Falls back to null if API key not configured or call fails.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.toLowerCase().trim(),
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

// ─── Vector Search (Cosine Similarity) ────────────

/**
 * Search hs_classification_vectors for top-k nearest neighbors.
 * Uses pgvector's cosine distance operator (<=>).
 *
 * @param embedding - 1536-dim vector
 * @param config - Search configuration
 * @returns Array of matches above similarity threshold
 */
export async function searchByVector(
  embedding: number[],
  config?: Partial<VectorSearchConfig>,
): Promise<VectorSearchResult[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const cfg = { ...getVectorSearchConfig(), ...config };

  try {
    // Use Supabase RPC for vector similarity search
    const { data, error } = await supabase.rpc('match_hs_vectors', {
      query_embedding: embedding,
      match_threshold: cfg.minSimilarity,
      match_count: cfg.topK,
    });

    if (error || !data) return [];

    return (data as any[]).map(row => ({
      productName: row.product_name,
      hsCode: row.hs_code,
      category: row.category,
      similarity: row.similarity,
      source: row.source,
    }));
  } catch {
    return [];
  }
}

// ─── Classify with Vector Search ──────────────────

/**
 * Classify a product using vector similarity search.
 * Stage 1 of the 3-stage pipeline.
 *
 * @param productName - Product name/description
 * @param category - Optional category hint
 * @returns Classification result or null if no match above threshold
 */
export async function classifyWithVectorSearch(
  productName: string,
  category?: string,
): Promise<HsClassificationResult | null> {
  const config = getVectorSearchConfig();
  if (!config.enabled) return null;

  // Generate embedding for the query
  const queryText = category ? `${productName} ${category}` : productName;
  const embedding = await generateEmbedding(queryText);
  if (!embedding) return null;

  // Search for nearest neighbors
  const results = await searchByVector(embedding, config);
  if (results.length === 0) return null;

  const best = results[0];

  // Build alternatives from remaining results
  const alternatives = results.slice(1).map(r => ({
    hsCode: r.hsCode,
    description: r.productName,
    confidence: r.similarity,
  }));

  return {
    hsCode: best.hsCode,
    description: best.productName,
    confidence: best.similarity,
    method: 'ai' as const, // Vector search is AI-assisted
    alternatives,
  };
}

// ─── Store New Vectors ────────────────────────────

/**
 * Store a product-HS mapping with its embedding vector.
 * Used to grow the vector database over time.
 */
export async function storeClassificationVector(
  productName: string,
  hsCode: string,
  category?: string,
  source: string = 'ai_classified',
  confidence: number = 0.9,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const embedding = await generateEmbedding(
    category ? `${productName} ${category}` : productName
  );

  try {
    await supabase.from('hs_classification_vectors').insert({
      product_name: productName,
      category: category || null,
      hs_code: hsCode,
      embedding,
      source,
      confidence,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Batch store classification vectors.
 */
export async function storeClassificationVectorsBatch(
  entries: Array<{
    productName: string;
    hsCode: string;
    category?: string;
    source?: string;
    confidence?: number;
  }>,
): Promise<number> {
  let stored = 0;
  for (const entry of entries) {
    const ok = await storeClassificationVector(
      entry.productName,
      entry.hsCode,
      entry.category,
      entry.source || 'batch_import',
      entry.confidence || 0.9,
    );
    if (ok) stored++;
  }
  return stored;
}
