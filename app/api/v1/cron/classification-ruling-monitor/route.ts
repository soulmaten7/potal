/**
 * POTAL Cron — /api/v1/cron/classification-ruling-monitor
 *
 * Monitors CBP CROSS rulings and EU EBTI for new classification decisions.
 * Used to validate product_hs_mappings accuracy.
 *
 * Vercel Cron: weekly Wednesday 06:00 UTC
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

interface SourceResult {
  source: string;
  status: 'green' | 'yellow' | 'red';
  hash: string | null;
  prevHash: string | null;
  changed: boolean;
  message: string;
  details?: string;
}

const SOURCES = [
  { name: 'CBP CROSS Rulings', url: 'https://rulings.cbp.gov/', description: 'US classification rulings (220K+)' },
  { name: 'EU EBTI Database', url: 'https://ec.europa.eu/taxation_customs/dds2/ebti/ebti_home.jsp?Lang=en', description: 'EU Binding Tariff Information' },
  { name: 'UK ATaR', url: 'https://www.tax.service.gov.uk/search-for-advance-tariff-rulings/', description: 'UK Advance Tariff Rulings (post-Brexit)' },
  { name: 'WCO Classification Decisions', url: 'https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/tools-to-assist-with-the-classification-in-the-hs/hs_classification-decisions/classification-decisions.aspx', description: 'WCO official classification decisions' },
  { name: 'SARS Tariff Determinations', url: 'https://tdn.sars.gov.za/portal/', description: 'South Africa classification rulings' },
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
        const monitor = checks.find(c => c.name === 'classification-ruling-monitor');
        if (monitor?.hashes) {
          prevHashes = monitor.hashes;
          break;
        }
      }
    }
  } catch { /* no previous */ }

  // Check all sources
  const results: SourceResult[] = await Promise.all(SOURCES.map(async (source): Promise<SourceResult> => {
    try {
      const res = await fetch(source.url, {
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
        headers: { 'User-Agent': 'POTAL-Monitor/1.0 (https://potal.app)' },
      });

      if (!res.ok) {
        return { source: source.name, status: 'red', hash: null, prevHash: prevHashes[source.name] || null, changed: false, message: `HTTP ${res.status}` };
      }

      const body = await res.text();
      const hash = await computeHash(body);
      const prev = prevHashes[source.name] || null;
      const changed = prev !== null && hash !== prev;

      // Extract ruling count from CBP CROSS if possible
      let details: string | undefined;
      if (source.name === 'CBP CROSS Rulings') {
        const match = body.match(/(\d[\d,]+)\s*rulings/i);
        if (match) details = `${match[1]} rulings in database`;
      }

      return {
        source: source.name, status: changed ? 'yellow' : 'green',
        hash, prevHash: prev, changed,
        message: changed ? 'New rulings detected (page content changed)' : (prev === null ? 'First check (baseline)' : 'No new rulings'),
        details,
      };
    } catch {
      return { source: source.name, status: 'red', hash: null, prevHash: prevHashes[source.name] || null, changed: false, message: 'Fetch failed' };
    }
  }));

  const changed = results.filter(r => r.changed);
  const failed = results.filter(r => r.status === 'red');
  const overall = changed.length > 0 ? 'yellow' : failed.length >= 3 ? 'red' : 'green';

  // Alert if changes
  if (changed.length > 0 && RESEND_API_KEY) {
    const kstTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const rows = changed.map(c =>
      `<tr><td style="padding:6px 8px;">${c.source}</td><td style="padding:6px 8px;color:#f59e0b;">New rulings</td><td style="padding:6px 8px;font-size:12px;">${c.details || c.message}</td></tr>`
    ).join('');

    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#059669;color:white;padding:16px 20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:16px;">📝 Classification Ruling Updates — ${changed.length} Sources</h2>
    <p style="margin:4px 0 0;font-size:12px;color:#a7f3d0;">${kstTime}</p>
  </div>
  <div style="background:white;padding:16px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f8fafc;"><th style="padding:8px;text-align:left;">Source</th><th style="padding:8px;text-align:left;">Status</th><th style="padding:8px;text-align:left;">Details</th></tr>
      ${rows}
    </table>
    <p style="font-size:12px;color:#64748b;margin-top:12px;">Action: Review new rulings for product_hs_mappings quality validation</p>
  </div>
</div>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: EMAIL_FROM, to: [EMAIL_TO], subject: `📝 New classification rulings from ${changed.length} sources`, html }),
        signal: AbortSignal.timeout(10000),
      });
    } catch { /* silent */ }
  }

  // Save hashes
  const newHashes: Record<string, string> = {};
  results.forEach(r => { if (r.hash) newHashes[r.source] = r.hash; });

  try {
    await supabase.from('health_check_logs').insert({
      checked_at: new Date().toISOString(),
      overall_status: overall,
      checks: [{
        name: 'classification-ruling-monitor',
        status: overall,
        message: `${changed.length} changed, ${failed.length} failed`,
        hashes: newHashes,
        sources: results.map(r => ({ source: r.source, status: r.status, changed: r.changed, details: r.details })),
      }],
      duration_ms: Date.now() - start,
    });
  } catch { /* silent */ }

  return NextResponse.json({
    success: true, status: overall,
    sources: results.map(r => ({ source: r.source, status: r.status, changed: r.changed, message: r.message, details: r.details })),
    changedCount: changed.length, failedCount: failed.length,
    durationMs: Date.now() - start,
  });
}
