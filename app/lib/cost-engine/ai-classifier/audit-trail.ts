/**
 * POTAL F008 — Classification Audit Trail
 *
 * Records every HS Code classification event for compliance and debugging.
 * Stores: input, result, method, confidence, timestamp, seller context.
 *
 * Table: hs_classification_audit (created via migration)
 */

import { createClient } from '@supabase/supabase-js';
import type { HsClassificationResult } from '../hs-code/types';
import type { ClassificationConfidenceScore } from './confidence-score';

// ─── Types ──────────────────────────────────────────

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  sellerId?: string;
  productName: string;
  productCategory?: string;
  hsCodeInput?: string;
  hsCodeResult: string;
  hsDescription: string;
  confidence: number;
  confidenceGrade?: string;
  classificationSource: string;
  alternatives: { hsCode: string; description: string; confidence: number }[];
  processingTimeMs: number;
  ipAddress?: string;
}

export interface AuditTrailQuery {
  sellerId?: string;
  hsCode?: string;
  source?: string;
  minConfidence?: number;
  maxConfidence?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditTrailResponse {
  entries: AuditTrailEntry[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Supabase Client ────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Record Classification Event ────────────────────

/**
 * Log a classification event to the audit trail.
 * Non-blocking — failures are silently ignored.
 */
export async function recordClassificationAudit(params: {
  sellerId?: string;
  productName: string;
  productCategory?: string;
  hsCodeInput?: string;
  result: HsClassificationResult;
  classificationSource: string;
  confidenceScore?: ClassificationConfidenceScore;
  processingTimeMs: number;
  ipAddress?: string;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('hs_classification_audit').insert({
      seller_id: params.sellerId || null,
      product_name: params.productName,
      product_category: params.productCategory || null,
      hs_code_input: params.hsCodeInput || null,
      hs_code_result: params.result.hsCode,
      hs_description: params.result.description,
      confidence: params.result.confidence,
      confidence_grade: params.confidenceScore?.grade || null,
      classification_source: params.classificationSource,
      alternatives: params.result.alternatives || [],
      processing_time_ms: params.processingTimeMs,
      ip_address: params.ipAddress || null,
    });
  } catch {
    // Audit logging should never break the main flow
  }
}

// ─── Query Audit Trail ──────────────────────────────

/**
 * Query classification audit trail with filters.
 */
export async function queryClassificationAudit(
  query: AuditTrailQuery
): Promise<AuditTrailResponse | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const limit = Math.min(query.limit || 50, 200);
  const offset = query.offset || 0;

  try {
    let q = supabase
      .from('hs_classification_audit')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.sellerId) q = q.eq('seller_id', query.sellerId);
    if (query.hsCode) q = q.eq('hs_code_result', query.hsCode);
    if (query.source) q = q.eq('classification_source', query.source);
    if (query.minConfidence !== undefined) q = q.gte('confidence', query.minConfidence);
    if (query.maxConfidence !== undefined) q = q.lte('confidence', query.maxConfidence);
    if (query.startDate) q = q.gte('created_at', query.startDate);
    if (query.endDate) q = q.lte('created_at', query.endDate);

    const { data, error, count } = await q;

    if (error || !data) return null;

    const entries: AuditTrailEntry[] = data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      timestamp: row.created_at as string,
      sellerId: row.seller_id as string | undefined,
      productName: row.product_name as string,
      productCategory: row.product_category as string | undefined,
      hsCodeInput: row.hs_code_input as string | undefined,
      hsCodeResult: row.hs_code_result as string,
      hsDescription: row.hs_description as string,
      confidence: row.confidence as number,
      confidenceGrade: row.confidence_grade as string | undefined,
      classificationSource: row.classification_source as string,
      alternatives: (row.alternatives || []) as { hsCode: string; description: string; confidence: number }[],
      processingTimeMs: row.processing_time_ms as number,
      ipAddress: row.ip_address as string | undefined,
    }));

    return {
      entries,
      total: count || 0,
      limit,
      offset,
    };
  } catch {
    return null;
  }
}
