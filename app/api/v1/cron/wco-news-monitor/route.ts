/**
 * POTAL Cron — /api/v1/cron/wco-news-monitor
 *
 * Monitors WCO newsroom for HS Code revision updates (HS 2028).
 * Detects correlation table publications, new classification decisions.
 *
 * Vercel Cron: monthly 15th 08:00 UTC
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
  return false;
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

const WCO_PAGES = [
  { name: 'WCO Newsroom', url: 'https://www.wcoomd.org/en/media/newsroom.aspx', keywords: ['hs 2028', 'harmonized system', 'nomenclature', 'correlation', 'classification'] },
  { name: 'WCO Nomenclature Tools', url: 'https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/tools-to-assist-with-the-classification-in-the-hs.aspx', keywords: ['correlation table', 'hs 2028', 'amendment'] },
  { name: 'WCO Classification Decisions', url: 'https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/tools-to-assist-with-the-classification-in-the-hs/hs_classification-decisions/classification-decisions.aspx', keywords: [] },
];

const HS2028_KEYWORDS = ['hs 2028', 'hs2028', 'correlation table', 'hs revision', 'nomenclature amendment', '2028 edition'];

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
        const monitor = checks.find(c => c.name === 'wco-news-monitor');
        if (monitor?.hashes) {
          prevHashes = monitor.hashes;
          break;
        }
      }
    }
  } catch { /* no previous */ }

  const results = await Promise.all(WCO_PAGES.map(async (page) => {
    try {
      const res = await fetch(page.url, {
        signal: AbortSignal.timeout(20000),
        redirect: 'follow',
        headers: { 'User-Agent': 'POTAL-Monitor/1.0 (https://potal.app)' },
      });
      if (!res.ok) {
        return { name: page.name, status: 'red' as const, hash: null, changed: false, hs2028Mentioned: false, message: `HTTP ${res.status}` };
      }
      const body = await res.text();
      const hash = await computeHash(body);
      const prev = prevHashes[page.name] || null;
      const changed = prev !== null && hash !== prev;
      const bodyLower = body.toLowerCase();
      const hs2028Mentioned = HS2028_KEYWORDS.some(kw => bodyLower.includes(kw));

      return {
        name: page.name,
        status: (changed ? 'yellow' : 'green') as 'green' | 'yellow',
        hash, changed, hs2028Mentioned,
        message: changed
          ? `Page changed${hs2028Mentioned ? ' — HS 2028 keywords detected!' : ''}`
          : 'No change',
      };
    } catch {
      return { name: page.name, status: 'red' as const, hash: null, changed: false, hs2028Mentioned: false, message: 'Fetch failed' };
    }
  }));

  const changed = results.filter(r => r.changed);
  const hs2028Alerts = results.filter(r => r.hs2028Mentioned && r.changed);
  const overall = hs2028Alerts.length > 0 ? 'yellow' : changed.length > 0 ? 'yellow' : 'green';

  if (changed.length > 0 && RESEND_API_KEY) {
    const kstTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const isHS2028 = hs2028Alerts.length > 0;

    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:${isHS2028 ? '#dc2626' : '#4338ca'};color:white;padding:16px 20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:16px;">${isHS2028 ? '🚨 WCO HS 2028 Update Detected!' : '🏛️ WCO News Update'}</h2>
    <p style="margin:4px 0 0;font-size:12px;">${kstTime}</p>
  </div>
  <div style="background:white;padding:16px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    ${results.map(r => `<p><strong>${r.name}</strong>: ${r.message} ${r.hs2028Mentioned ? '⚠️ HS 2028' : ''}</p>`).join('')}
    ${isHS2028 ? '<p style="color:#dc2626;font-weight:bold;">Action: Check if HS 2028 correlation table is now available. Plan product_hs_mappings migration.</p>' : ''}
    <p style="font-size:12px;color:#64748b;">HS 2028 timeline: Entry into force January 1, 2028</p>
  </div>
</div>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: EMAIL_FROM, to: [EMAIL_TO],
          subject: isHS2028 ? '🚨 WCO HS 2028 correlation table may be available!' : `🏛️ WCO newsroom updated`,
          html,
        }),
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
      checks: [{ name: 'wco-news-monitor', status: overall, message: `${changed.length} pages changed, HS2028 alerts: ${hs2028Alerts.length}`, hashes: newHashes }],
      duration_ms: Date.now() - start,
    });
  } catch { /* silent */ }

  return NextResponse.json({
    success: true, status: overall,
    results: results.map(r => ({ name: r.name, status: r.status, changed: r.changed, hs2028Mentioned: r.hs2028Mentioned, message: r.message })),
    durationMs: Date.now() - start,
  });
}
