/**
 * POTAL Cron — /api/v1/cron/macmap-update-monitor
 *
 * Monitors MacMap data-availability page for tariff data updates.
 * Detects when new year's MIN/AGR/NTLC data becomes available.
 *
 * Vercel Cron: monthly 1st 08:00 UTC
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

const TARGETS = [
  { name: 'MacMap Data Availability', url: 'https://www.macmap.org/en/about/data-availability', description: 'ITC MacMap tariff data update status' },
  { name: 'WITS Home', url: 'https://wits.worldbank.org/', description: 'World Bank WITS data portal' },
  { name: 'WTO TTD', url: 'https://ttd.wto.org/en', description: 'WTO Tariff & Trade Data portal' },
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
      .limit(30);
    if (data) {
      for (const row of data) {
        const checks = row.checks as Array<{ name: string; hashes?: Record<string, string> }> | null;
        if (!checks) continue;
        const monitor = checks.find(c => c.name === 'macmap-update-monitor');
        if (monitor?.hashes) {
          prevHashes = monitor.hashes;
          break;
        }
      }
    }
  } catch { /* no previous */ }

  const results = await Promise.all(TARGETS.map(async (target) => {
    try {
      const res = await fetch(target.url, {
        signal: AbortSignal.timeout(20000),
        redirect: 'follow',
        headers: { 'User-Agent': 'POTAL-Monitor/1.0 (https://potal.app)' },
      });
      if (!res.ok) {
        return { name: target.name, status: 'red' as const, hash: null, changed: false, message: `HTTP ${res.status}` };
      }
      const body = await res.text();
      const hash = await computeHash(body);
      const prev = prevHashes[target.name] || null;
      const changed = prev !== null && hash !== prev;
      return { name: target.name, status: (changed ? 'yellow' : 'green') as 'green' | 'yellow', hash, changed, message: changed ? 'Data availability page changed — new data may be available' : 'No change' };
    } catch {
      return { name: target.name, status: 'red' as const, hash: null, changed: false, message: 'Fetch failed' };
    }
  }));

  const changed = results.filter(r => r.changed);
  const overall = changed.length > 0 ? 'yellow' : 'green';

  if (changed.length > 0 && RESEND_API_KEY) {
    const kstTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#d97706;color:white;padding:16px 20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:16px;">📊 MacMap/WITS Data Update Detected</h2>
    <p style="margin:4px 0 0;font-size:12px;">${kstTime}</p>
  </div>
  <div style="background:white;padding:16px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    ${changed.map(c => `<p><strong>${c.name}</strong>: ${c.message}</p>`).join('')}
    <p style="font-size:12px;color:#64748b;">Action: Check if MIN/AGR/NTLC data needs re-import for updated countries.</p>
    <p style="font-size:12px;color:#64748b;">Contact: marketanalysis@intracen.org (ITC MacMap team)</p>
  </div>
</div>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: EMAIL_FROM, to: [EMAIL_TO], subject: `📊 MacMap/WITS data update detected`, html }),
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
      checks: [{ name: 'macmap-update-monitor', status: overall, message: `${changed.length} sources changed`, hashes: newHashes }],
      duration_ms: Date.now() - start,
    });
  } catch { /* silent */ }

  return NextResponse.json({ success: true, status: overall, results, durationMs: Date.now() - start });
}
