import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * CW34-S3-F: Weekly rulings update monitor.
 * Checks EBTI + CROSS for new rulings since last DB max date.
 * Sends Telegram alert if updates found.
 * Does NOT process data — that requires local mac with external drive.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const report: Record<string, unknown> = {
    checked_at: new Date().toISOString(),
    sources: {} as Record<string, unknown>,
    needs_refresh: false,
  };

  // 1) Get max ruling_date per source from customs_rulings
  const { data: rows } = await sb
    .from('customs_rulings')
    .select('source, ruling_date')
    .not('ruling_date', 'is', null)
    .order('ruling_date', { ascending: false })
    .limit(500);

  const maxBySource: Record<string, string> = {};
  for (const r of rows ?? []) {
    if (!maxBySource[r.source] || r.ruling_date > maxBySource[r.source]) {
      maxBySource[r.source] = r.ruling_date;
    }
  }
  report.current_max_dates = maxBySource;

  // 2) Check EBTI
  try {
    const ebti = await checkEbti(maxBySource['eu_ebti'] ?? '1900-01-01');
    (report.sources as Record<string, unknown>).ebti = ebti;
    if (ebti.possibly_updated) report.needs_refresh = true;
  } catch (e: unknown) {
    (report.sources as Record<string, unknown>).ebti = { error: (e as Error).message };
  }

  // 3) Check CROSS
  try {
    const cross = await checkCross(maxBySource['cbp_cross'] ?? '1900-01-01');
    (report.sources as Record<string, unknown>).cross = cross;
    if (cross.possibly_updated) report.needs_refresh = true;
  } catch (e: unknown) {
    (report.sources as Record<string, unknown>).cross = { error: (e as Error).message };
  }

  // 4) Telegram alert if needed
  if (report.needs_refresh) {
    await sendAlert(report);
  }

  // 5) Log to health_check_logs
  await sb.from('health_check_logs').insert({
    check_type: 'rulings-update-monitor',
    status: report.needs_refresh ? 'needs_refresh' : 'up_to_date',
    details: report,
  }).then(() => {});

  return NextResponse.json(report);
}

async function checkEbti(dbMaxDate: string) {
  const url = 'https://ec.europa.eu/taxation_customs/dds2/ebti/';
  const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
  const lastModified = res.headers.get('last-modified');

  return {
    source_url: url,
    http_status: res.status,
    last_modified: lastModified,
    db_max_date: dbMaxDate,
    possibly_updated: lastModified ? new Date(lastModified) > new Date(dbMaxDate) : false,
    note: 'HEAD request only. Run `npm run warehouse:refresh` locally to apply.',
  };
}

async function checkCross(dbMaxDate: string) {
  const url = 'https://rulings.cbp.gov/api/search?sortBy=issueDate&order=desc&pageSize=1';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      return { source_url: url, http_status: res.status, possibly_updated: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json() as Record<string, unknown>;
    const rulings = (data.rulings ?? data) as Array<Record<string, string>>;
    const latest = Array.isArray(rulings) ? rulings[0] : null;
    const latestDate = latest?.date_issued ?? latest?.rulingDate ?? null;

    return {
      source_url: 'https://rulings.cbp.gov/api/search',
      latest_ruling_date: latestDate,
      db_max_date: dbMaxDate,
      possibly_updated: latestDate ? latestDate > dbMaxDate : false,
      note: 'Run `npm run warehouse:refresh` locally to apply.',
    };
  } catch (e: unknown) {
    return { source_url: url, error: (e as Error).message, possibly_updated: false };
  }
}

async function sendAlert(report: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const sources = report.sources as Record<string, Record<string, unknown>>;
  const lines = Object.entries(sources)
    .filter(([, v]) => v.possibly_updated)
    .map(([k, v]) => `  • ${k}: latest=${v.latest_ruling_date ?? v.last_modified}`)
    .join('\n');

  const text = `🔔 POTAL Rulings Update Detected\n\n${lines}\n\nRun: npm run warehouse:refresh`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}
