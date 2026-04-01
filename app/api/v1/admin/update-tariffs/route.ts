/**
 * POTAL API v1 — /api/v1/admin/update-tariffs
 *
 * Cron-triggered endpoint to refresh tariff rates from government APIs.
 * Protected by CRON_SECRET or admin API key.
 *
 * POST /api/v1/admin/update-tariffs
 * Body (optional): { hsCodes?: string[], countries?: string[] }
 *
 * Designed for:
 * - Vercel Cron Jobs (vercel.json → schedule)
 * - Make.com / Zapier webhooks
 * - GitHub Actions
 * - Manual admin trigger
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runTariffUpdate } from '@/app/lib/cost-engine/updater';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

/**
 * GET — Called by Vercel Cron.
 * Vercel automatically sends Authorization: Bearer {CRON_SECRET}.
 * Also accepts ?secret= query param for manual trigger.
 */
export async function GET(req: NextRequest) {
  if (!CRON_SECRET || !verifyCronAuth(req)) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const start = Date.now();
  try {
    const summary = await runTariffUpdate();

    // Log to health_check_logs for D1 monitoring
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      await supabase.from('health_check_logs').insert({
        checked_at: new Date().toISOString(),
        overall_status: 'green',
        checks: [{ name: 'update-tariffs', status: 'green', message: 'Tariff update completed' }],
        duration_ms: Date.now() - start,
      });
    } catch { /* silent */ }

    return Response.json({ success: true, data: summary });
  } catch (err) {
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Update failed.' },
      { status: 500 }
    );
  }
}

/**
 * POST — Called by Make.com, GitHub Actions, or manual trigger.
 */
export async function POST(req: NextRequest) {
  if (!CRON_SECRET || !verifyCronAuth(req)) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let hsCodes: string[] | undefined;
  let countries: string[] | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body.hsCodes)) hsCodes = body.hsCodes.map(String);
    if (Array.isArray(body.countries)) countries = body.countries.map(String);
  } catch {
    // Use defaults
  }

  try {
    const summary = await runTariffUpdate(hsCodes, countries);
    return Response.json({ success: true, data: summary });
  } catch (err) {
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Update failed.' },
      { status: 500 }
    );
  }
}
