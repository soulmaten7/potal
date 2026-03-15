/**
 * F001: Classification Feedback Loop
 * Collects user corrections, tracks accuracy, auto-updates cache.
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type FeedbackType = 'correct' | 'incorrect' | 'ambiguous';

export interface FeedbackInput {
  originalQuery: string;
  predictedHs6: string;
  correctedHs6?: string;
  userId?: string;
  confidenceScore?: number;
  feedbackType: FeedbackType;
}

export interface FeedbackStats {
  total: number;
  correctRate: number;
  topCorrections: Array<{ predicted: string; corrected: string; count: number }>;
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('classification_feedback').insert({
    original_query: input.originalQuery,
    predicted_hs6: input.predictedHs6,
    corrected_hs6: input.correctedHs6 || null,
    corrected_by: input.userId || null,
    confidence_score: input.confidenceScore || null,
    feedback_type: input.feedbackType,
  });
  if (error) throw new Error(`Feedback save failed: ${error.message}`);
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  const sb = getSupabase();

  const { count: total } = await sb.from('classification_feedback').select('*', { count: 'exact', head: true });
  const { count: correct } = await sb.from('classification_feedback').select('*', { count: 'exact', head: true }).eq('feedback_type', 'correct');

  const { data: corrections } = await sb
    .from('classification_feedback')
    .select('predicted_hs6, corrected_hs6')
    .eq('feedback_type', 'incorrect')
    .not('corrected_hs6', 'is', null)
    .limit(100);

  const corrMap = new Map<string, number>();
  for (const c of corrections || []) {
    const key = `${c.predicted_hs6}→${c.corrected_hs6}`;
    corrMap.set(key, (corrMap.get(key) || 0) + 1);
  }

  const topCorrections = [...corrMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [predicted, corrected] = key.split('→');
      return { predicted, corrected, count };
    });

  return {
    total: total || 0,
    correctRate: total && correct ? correct / total : 0,
    topCorrections,
  };
}

export async function applyFeedbackToCache(): Promise<number> {
  const sb = getSupabase();
  const { data: corrections } = await sb
    .from('classification_feedback')
    .select('original_query, corrected_hs6')
    .eq('feedback_type', 'incorrect')
    .not('corrected_hs6', 'is', null)
    .limit(500);

  if (!corrections || corrections.length === 0) return 0;

  let updated = 0;
  for (const c of corrections) {
    const { error } = await sb.from('product_hs_mappings').upsert(
      { product_name: c.original_query.toLowerCase().trim(), hs6_code: c.corrected_hs6, source: 'feedback', confidence: 1.0 },
      { onConflict: 'product_name' }
    );
    if (!error) updated++;
  }
  return updated;
}
