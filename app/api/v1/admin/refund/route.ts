/**
 * POTAL API v1 — /api/v1/admin/refund
 *
 * Admin endpoint to process refunds via Paddle API.
 * Protected by CRON_SECRET (admin auth).
 *
 * POST /api/v1/admin/refund
 * Body: { transactionId: string, reason?: string }
 *
 * Paddle Refund API: POST /transactions/{id}/refund
 * https://developer.paddle.com/api-reference/transactions/refund-transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPaddleHeaders, getPaddleBaseUrl } from '@/app/lib/billing/paddle';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  if (!CRON_SECRET || !verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let transactionId: string;
  let reason: string | undefined;

  try {
    const body = await req.json();
    transactionId = body.transactionId;
    reason = body.reason;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId is required' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const start = Date.now();

  try {
    const baseUrl = getPaddleBaseUrl();
    const headers = getPaddleHeaders();

    // Paddle Refund API
    const refundRes = await fetch(
      `${baseUrl}/transactions/${transactionId}/refund`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(reason ? { reason } : {}),
      }
    );

    const refundData = await refundRes.json();

    if (!refundRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: refundData.error?.detail || `Paddle API error: ${refundRes.status}`,
          paddleError: refundData.error,
        },
        { status: refundRes.status }
      );
    }

    // Log refund to Supabase
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      await supabase.from('health_check_logs').insert({
        checked_at: new Date().toISOString(),
        overall_status: 'green',
        checks: [{
          name: 'admin-refund',
          status: 'green',
          transactionId,
          reason: reason || 'No reason provided',
        }],
        duration_ms: Date.now() - start,
      });
    } catch { /* silent */ }

    return NextResponse.json({
      success: true,
      transactionId,
      refund: refundData.data,
      durationMs: Date.now() - start,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Refund failed' },
      { status: 500 }
    );
  }
}
