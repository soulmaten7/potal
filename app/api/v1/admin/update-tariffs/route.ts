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
import { runTariffUpdate } from '@/app/lib/cost-engine/updater';

const CRON_SECRET = process.env.CRON_SECRET || '';

/**
 * GET — Called by Vercel Cron.
 * Vercel automatically sends Authorization: Bearer {CRON_SECRET}.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const summary = await runTariffUpdate();
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
  // Auth: check CRON_SECRET header or Bearer token
  const authHeader = req.headers.get('authorization') || '';
  const cronHeader = req.headers.get('x-cron-secret') || '';

  const isAuthorized =
    (CRON_SECRET && cronHeader === CRON_SECRET) ||
    (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`);

  if (!isAuthorized) {
    return Response.json(
      { success: false, error: 'Unauthorized. Provide x-cron-secret header or Bearer token.' },
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
