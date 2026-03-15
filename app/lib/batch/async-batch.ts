/**
 * F009: Async Batch Processing — S+ Grade
 * Queue-based with individual item tracking and webhook notification.
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface BatchItem {
  productName: string;
  origin: string;
  destination: string;
  value: number;
  hsCode?: string;
}

export interface BatchStatus {
  batchId: string;
  status: 'queued' | 'processing' | 'completed' | 'partial_failure' | 'failed';
  progress: { total: number; completed: number; failed: number; percent: number };
  results?: Array<{ index: number; status: 'success' | 'error'; result?: unknown; error?: string }>;
  estimatedSeconds?: number;
}

export async function createBatch(items: BatchItem[], userId?: string, webhookUrl?: string): Promise<{ batchId: string; status: string; itemCount: number }> {
  const sb = getSupabase();
  const { data, error } = await sb.from('batch_jobs').insert({
    user_id: userId || null,
    status: 'queued',
    total_items: items.length,
    webhook_url: webhookUrl || null,
    results: JSON.stringify(items.map((item, i) => ({ index: i, input: item, status: 'pending' }))),
  }).select('id').single();

  if (error) throw new Error(`Batch create failed: ${error.message}`);
  return { batchId: data.id, status: 'queued', itemCount: items.length };
}

export async function getBatchStatus(batchId: string): Promise<BatchStatus> {
  const sb = getSupabase();
  const { data, error } = await sb.from('batch_jobs').select('*').eq('id', batchId).single();
  if (error || !data) throw new Error('Batch not found');

  let results: BatchStatus['results'];
  try {
    const parsed = typeof data.results === 'string' ? JSON.parse(data.results) : data.results;
    if (Array.isArray(parsed)) results = parsed;
  } catch { /* ignore */ }

  const total = data.total_items || 0;
  const completed = data.completed_items || 0;
  const failed = data.failed_items || 0;

  return {
    batchId,
    status: data.status,
    progress: {
      total,
      completed,
      failed,
      percent: total > 0 ? Math.round(completed / total * 100) : 0,
    },
    results: data.status === 'completed' || data.status === 'partial_failure' ? results : undefined,
    estimatedSeconds: data.status === 'processing' ? Math.max(1, (total - completed) * 2) : undefined,
  };
}

export async function processBatchSync(batchId: string, processor: (item: BatchItem) => Promise<unknown>): Promise<void> {
  const sb = getSupabase();
  const { data } = await sb.from('batch_jobs').select('*').eq('id', batchId).single();
  if (!data) return;

  await sb.from('batch_jobs').update({ status: 'processing' }).eq('id', batchId);

  let items: Array<{ index: number; input: BatchItem; status: string }>;
  try {
    items = typeof data.results === 'string' ? JSON.parse(data.results) : data.results;
  } catch { return; }

  let completed = 0;
  let failed = 0;
  const results = [];

  for (const item of items) {
    try {
      const result = await processor(item.input);
      results.push({ index: item.index, status: 'success', result });
      completed++;
    } catch (err) {
      results.push({ index: item.index, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
      failed++;
    }
    await sb.from('batch_jobs').update({ completed_items: completed, failed_items: failed }).eq('id', batchId);
  }

  const finalStatus = failed === 0 ? 'completed' : failed === items.length ? 'failed' : 'partial_failure';
  await sb.from('batch_jobs').update({
    status: finalStatus,
    results: JSON.stringify(results),
    completed_at: new Date().toISOString(),
  }).eq('id', batchId);

  // Webhook notification
  if (data.webhook_url) {
    try {
      await fetch(data.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId, status: finalStatus, completed, failed }),
      });
    } catch { /* webhook delivery is best-effort */ }
  }
}
