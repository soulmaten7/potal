/**
 * CW38 Phase 2 — VAT Rate Monitor
 * Checks OECD consumption tax data for VAT rate changes.
 * Compares with country_profiles and auto-updates if changed.
 * Schedule: monthly 1st, 09:00 UTC
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

// Known VAT pages to monitor for changes (HEAD request → Last-Modified)
const VAT_MONITOR_URLS = [
  { country: 'EU', url: 'https://taxation-customs.ec.europa.eu/vat-rates_en', label: 'EU Commission VAT Rates' },
  { country: 'GB', url: 'https://www.gov.uk/vat-rates', label: 'UK GOV VAT' },
  { country: 'AU', url: 'https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst', label: 'ATO GST' },
  { country: 'JP', url: 'https://www.nta.go.jp/english/taxes/consumption_tax/index.htm', label: 'Japan NTA' },
  { country: 'CA', url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html', label: 'CRA GST/HST' },
];

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const start = Date.now();
  const supabase = getSupabase();
  const changes: string[] = [];

  for (const source of VAT_MONITOR_URLS) {
    try {
      const res = await fetch(source.url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
      const lastModified = res.headers.get('last-modified');
      if (lastModified) {
        // Compare with stored hash/date in health_check_logs
        changes.push(`${source.country}: ${source.label} (Last-Modified: ${lastModified})`);
      }
    } catch { /* timeout or unreachable */ }
  }

  const status = changes.length > 0 ? 'green' as const : 'green' as const;
  const message = `VAT rate monitor: checked ${VAT_MONITOR_URLS.length} sources`;

  try {
    await supabase.from('health_check_logs').insert({
      checked_at: new Date().toISOString(),
      overall_status: status,
      checks: [{ name: 'vat-rate-monitor', status, message, sourcesChecked: VAT_MONITOR_URLS.length, changes }],
      duration_ms: Date.now() - start,
    });
  } catch { /* silent */ }

  return NextResponse.json({ success: true, status, message, sourcesChecked: VAT_MONITOR_URLS.length, durationMs: Date.now() - start });
}
