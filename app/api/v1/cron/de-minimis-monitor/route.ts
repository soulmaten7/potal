/**
 * CW38 Phase 2 — De Minimis Threshold Monitor
 * Monitors customs authority pages for de minimis threshold changes.
 * Schedule: weekly Monday, 08:00 UTC
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  return authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET || false;
}

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
}

// Key countries where de minimis changes have high impact
const DE_MINIMIS_SOURCES = [
  { country: 'US', url: 'https://www.cbp.gov/trade/trade-enforcement/tpea', label: 'US CBP TPEA' },
  { country: 'EU', url: 'https://taxation-customs.ec.europa.eu/customs-4/customs-procedures-import-and-export-0/customs-procedures/low-value-consignment-relief_en', label: 'EU Low-Value Relief' },
  { country: 'GB', url: 'https://www.gov.uk/guidance/check-if-you-can-pay-a-reduced-amount-of-customs-duty', label: 'UK HMRC Low-Value' },
  { country: 'AU', url: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/how-to-import/low-value-goods', label: 'AU ABF Low-Value' },
  { country: 'CA', url: 'https://www.cbsa-asfc.gc.ca/publications/dm-md/d8/d8-2-16-eng.html', label: 'CA CBSA D8-2-16' },
];

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const start = Date.now();
  const supabase = getSupabase();
  const results: Array<{ country: string; label: string; reachable: boolean; lastModified?: string }> = [];

  for (const source of DE_MINIMIS_SOURCES) {
    try {
      const res = await fetch(source.url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
      results.push({ country: source.country, label: source.label, reachable: res.ok, lastModified: res.headers.get('last-modified') || undefined });
    } catch {
      results.push({ country: source.country, label: source.label, reachable: false });
    }
  }

  const unreachable = results.filter(r => !r.reachable);
  const status = unreachable.length > 2 ? 'yellow' as const : 'green' as const;
  const message = `De minimis monitor: ${results.filter(r => r.reachable).length}/${DE_MINIMIS_SOURCES.length} sources reachable`;

  try {
    await supabase.from('health_check_logs').insert({
      checked_at: new Date().toISOString(),
      overall_status: status,
      checks: [{ name: 'de-minimis-monitor', status, message, results }],
      duration_ms: Date.now() - start,
    });
  } catch { /* silent */ }

  return NextResponse.json({ success: true, status, message, results, durationMs: Date.now() - start });
}
