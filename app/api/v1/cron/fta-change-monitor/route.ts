/**
 * POTAL Cron — /api/v1/cron/fta-change-monitor
 *
 * Monitors WTO RTA-IS + 7 country FTA portals for new/changed FTAs.
 * Detects new FTA signings, entries into force, schedule amendments.
 *
 * Vercel Cron: weekly Friday 06:00 UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_TO = process.env.MORNING_BRIEF_EMAIL_TO || 'contact@potal.app';
const EMAIL_FROM = process.env.MORNING_BRIEF_EMAIL_FROM || 'POTAL <onboarding@resend.dev>';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) return true;
  return req.nextUrl.searchParams.get('secret') === CRON_SECRET;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

async function computeHash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const FTA_SOURCES = [
  { name: 'WTO RTA-IS', url: 'https://rtais.wto.org/UI/PublicMaintainRTAHome.aspx', description: 'Master index of 380+ RTAs' },
  { name: 'USTR FTAs', url: 'https://ustr.gov/trade-agreements/free-trade-agreements', description: 'US FTA portal (20 FTAs)' },
  { name: 'EU DG Trade', url: 'https://policy.trade.ec.europa.eu/eu-trade-relationships-country-and-region/negotiations-and-agreements_en', description: 'EU FTA portal (80+ agreements)' },
  { name: 'UK Trade Agreements', url: 'https://www.gov.uk/government/collections/the-uks-trade-agreements', description: 'UK FTA portal (40 agreements)' },
  { name: 'Canada FTAs', url: 'https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/index.aspx', description: 'Canada FTA portal (75+ agreements)' },
  { name: 'Australia DFAT', url: 'https://www.dfat.gov.au/trade/agreements', description: 'Australia FTA portal (~16 FTAs)' },
  { name: 'Japan MOFA EPAs', url: 'https://www.mofa.go.jp/policy/economy/fta/index.html', description: 'Japan EPA portal (~21 EPAs)' },
  { name: 'Korea FTA Portal', url: 'https://www.customs.go.kr/engportal/cm/cntnts/cntntsView.do?mi=7312&cntntsId=2334', description: 'Korea FTA portal (~23 FTAs)' },
];

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const supabase = getSupabase();

  // Load previous hashes
  let prevHashes: Record<string, string> = {};
  try {
    const { data } = await supabase
      .from('health_check_logs')
      .select('checks')
      .order('checked_at', { ascending: false })
      .limit(20);
    if (data) {
      for (const row of data) {
        const checks = row.checks as Array<{ name: string; hashes?: Record<string, string> }> | null;
        if (!checks) continue;
        const monitor = checks.find(c => c.name === 'fta-change-monitor');
        if (monitor?.hashes) {
          prevHashes = monitor.hashes;
          break;
        }
      }
    }
  } catch { /* no previous */ }

  const results = await Promise.all(FTA_SOURCES.map(async (source) => {
    try {
      const res = await fetch(source.url, {
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
        headers: { 'User-Agent': 'POTAL-Monitor/1.0 (https://potal.app)' },
      });
      if (!res.ok) {
        return { name: source.name, status: 'red' as const, hash: null, changed: false, message: `HTTP ${res.status}` };
      }
      const body = await res.text();
      const hash = await computeHash(body);
      const prev = prevHashes[source.name] || null;
      const changed = prev !== null && hash !== prev;
      return {
        name: source.name,
        status: (changed ? 'yellow' : 'green') as 'green' | 'yellow',
        hash, changed,
        message: changed ? 'FTA portal content changed — possible new/updated agreement' : (prev === null ? 'First check (baseline)' : 'No change'),
      };
    } catch {
      return { name: source.name, status: 'red' as const, hash: null, changed: false, message: 'Fetch failed' };
    }
  }));

  const changed = results.filter(r => r.changed);
  const failed = results.filter(r => r.status === 'red');
  const overall = changed.length > 0 ? 'yellow' : 'green';

  if (changed.length > 0 && RESEND_API_KEY) {
    const kstTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const rows = changed.map(c =>
      `<tr><td style="padding:6px 8px;">${c.name}</td><td style="padding:6px 8px;color:#f59e0b;">Changed</td><td style="padding:6px 8px;font-size:12px;">${c.message}</td></tr>`
    ).join('');

    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#0d9488;color:white;padding:16px 20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:16px;">🤝 FTA Change Monitor — ${changed.length} Portals Updated</h2>
    <p style="margin:4px 0 0;font-size:12px;color:#ccfbf1;">${kstTime}</p>
  </div>
  <div style="background:white;padding:16px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f8fafc;"><th style="padding:8px;text-align:left;">Source</th><th style="padding:8px;text-align:left;">Status</th><th style="padding:8px;text-align:left;">Details</th></tr>
      ${rows}
    </table>
    <p style="font-size:12px;color:#64748b;margin-top:12px;">Action: Check for new FTA signings or tariff schedule amendments. Current POTAL: 63 FTAs, 1,319 trade agreements.</p>
  </div>
</div>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: EMAIL_FROM, to: [EMAIL_TO], subject: `🤝 FTA portal changes detected in ${changed.length} sources`, html }),
        signal: AbortSignal.timeout(10000),
      });
    } catch { /* silent */ }
  }

  const newHashes: Record<string, string> = {};
  results.forEach(r => { if (r.hash) newHashes[r.name] = r.hash; });

  try {
    await supabase.from('health_check_logs').insert({
      checked_at: new Date().toISOString(),
      overall_status: overall,
      checks: [{
        name: 'fta-change-monitor',
        status: overall,
        message: `${changed.length} changed, ${failed.length} failed`,
        hashes: newHashes,
        changed: changed.map(c => c.name),
      }],
      duration_ms: Date.now() - start,
    });
  } catch { /* silent */ }

  return NextResponse.json({
    success: true, status: overall,
    sources: results.map(r => ({ name: r.name, status: r.status, changed: r.changed, message: r.message })),
    changedCount: changed.length, failedCount: failed.length,
    durationMs: Date.now() - start,
  });
}
