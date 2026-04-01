/**
 * POTAL API v1 — /api/v1/admin/billing-overage
 *
 * Cron-triggered endpoint to calculate and charge overage fees.
 * Runs on the 1st of each month for the previous month's usage.
 * Protected by CRON_SECRET.
 *
 * GET  /api/v1/admin/billing-overage              — Process previous month
 * POST /api/v1/admin/billing-overage              — Process specific month
 *   Body: { year: 2026, month: 3, dryRun?: boolean }
 *
 * Vercel Cron: "0 7 1 * *" (매월 1일 07:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateMonthlyOverages } from '@/app/lib/billing/overage';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(req: NextRequest): boolean {
  // Vercel Cron sends Authorization: Bearer {CRON_SECRET}
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

/**
 * GET — Called by Vercel Cron on the 1st of each month.
 * Processes the previous month's overages.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Calculate previous month
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  try {
    const results = await calculateMonthlyOverages(prevYear, prevMonth);

    const period = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const charged = results.filter(r => r.charged).length;

    // Log to health_check_logs for D10 monitoring
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      await supabase.from('health_check_logs').insert({
        checked_at: new Date().toISOString(),
        overall_status: 'green',
        checks: [{ name: 'billing-overage', status: 'green', period, processed: results.length, charged }],
        duration_ms: Date.now() - now.getTime(),
      });
    } catch { /* silent */ }

    return NextResponse.json({
      success: true,
      period,
      processed: results.length,
      charged,
      totalOverageCents: results.reduce((sum, r) => sum + r.chargeAmountCents, 0),
      details: results,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST — Manual trigger for specific month (admin use).
 * Body: { year: 2026, month: 3, dryRun?: boolean }
 */
export async function POST(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { year, month, dryRun } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: 'year and month are required' },
        { status: 400 }
      );
    }

    if (dryRun) {
      // Dry run: just calculate, don't charge
      // TODO: add dryRun parameter to calculateMonthlyOverages
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: 'Dry run not yet implemented. Use GET for actual processing.',
      });
    }

    const results = await calculateMonthlyOverages(year, month);

    return NextResponse.json({
      success: true,
      period: `${year}-${String(month).padStart(2, '0')}`,
      processed: results.length,
      charged: results.filter(r => r.charged).length,
      totalOverageCents: results.reduce((sum, r) => sum + r.chargeAmountCents, 0),
      details: results,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
