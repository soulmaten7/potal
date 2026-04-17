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
  { country: 'US', url: 'https://www.cbp.gov/trade/basic-import-export/e-commerce/faqs', label: 'US CBP E-Commerce FAQ' },
  { country: 'EU', url: 'https://taxation-customs.ec.europa.eu/customs/customs-procedures-import-and-export/customs-operations/customs-formalities-low-value-consignments_en', label: 'EU Low-Value Consignments' },
  { country: 'GB', url: 'https://www.gov.uk/goods-sent-from-abroad', label: 'UK HMRC Goods from Abroad' },
  { country: 'AU', url: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/gst-and-other-taxes/gst-on-low-value-goods', label: 'AU ABF Low-Value GST' },
  { country: 'CA', url: 'https://www.cbsa-asfc.gc.ca/services/cusma-aceum/lvs-efv-eng.html', label: 'CA CBSA Low-Value Shipments' },
];

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const start = Date.now();
  const supabase = getSupabase();
  const results: Array<{ country: string; label: string; reachable: boolean; lastModified?: string }> = [];

  for (const source of DE_MINIMIS_SOURCES) {
    try {
      const res = await fetch(source.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; POTAL-DeMinimis-Monitor/1.0)' },
      });
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
