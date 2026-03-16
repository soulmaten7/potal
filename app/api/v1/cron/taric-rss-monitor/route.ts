/**
 * POTAL Cron — /api/v1/cron/taric-rss-monitor
 *
 * Monitors EU TARIC RSS feed for customs tariff updates.
 * Checks data.europa.eu TARIC dataset RSS for new entries.
 *
 * Vercel Cron: daily 07:00 UTC
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

const TARIC_RSS_URL = 'https://data.europa.eu/api/hub/search/en/feeds/datasets/eu-customs-tariff-taric.rss';
const TARIC_CONSULTATION_URL = 'https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp?Lang=en';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const getTag = (tag: string) => {
      const m = content.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
    };
    items.push({
      title: getTag('title'),
      link: getTag('link'),
      pubDate: getTag('pubDate'),
      description: getTag('description'),
    });
  }
  return items;
}

async function sendAlert(items: RSSItem[], consultationHash: string | null, prevHash: string | null): Promise<boolean> {
  if (!RESEND_API_KEY) return false;

  const kstTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const rows = items.slice(0, 10).map(item =>
    `<tr>
      <td style="padding:6px 8px;font-size:13px;">${item.pubDate}</td>
      <td style="padding:6px 8px;font-size:13px;"><a href="${item.link}">${item.title}</a></td>
      <td style="padding:6px 8px;font-size:12px;">${item.description.slice(0, 200)}</td>
    </tr>`
  ).join('');

  const hashNote = consultationHash !== prevHash
    ? `<p style="color:#dc2626;font-weight:bold;">⚠️ TARIC consultation page content changed (hash: ${consultationHash?.slice(0, 16)}...)</p>`
    : '';

  const html = `
<div style="font-family:sans-serif;max-width:700px;margin:0 auto;">
  <div style="background:#1e3a8a;color:white;padding:16px 20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:16px;">🇪🇺 EU TARIC — ${items.length} RSS Updates</h2>
    <p style="margin:4px 0 0;font-size:12px;color:#bfdbfe;">${kstTime}</p>
  </div>
  <div style="background:white;padding:16px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    ${hashNote}
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <th style="padding:8px;text-align:left;font-size:12px;">Date</th>
        <th style="padding:8px;text-align:left;font-size:12px;">Title</th>
        <th style="padding:8px;text-align:left;font-size:12px;">Description</th>
      </tr>
      ${rows}
    </table>
  </div>
</div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: [EMAIL_TO], subject: `🇪🇺 EU TARIC — ${items.length} tariff updates`, html }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function simpleHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  let status: 'green' | 'yellow' | 'red' = 'green';
  let message = '';
  const supabase = getSupabase();

  try {
    // 1. Fetch TARIC RSS
    let rssItems: RSSItem[] = [];
    try {
      const rssRes = await fetch(TARIC_RSS_URL, { signal: AbortSignal.timeout(15000) });
      if (rssRes.ok) {
        const xml = await rssRes.text();
        rssItems = parseRSSItems(xml);
      }
    } catch { /* RSS fetch failed */ }

    // 2. Check TARIC consultation page hash
    let consultationHash: string | null = null;
    try {
      const pageRes = await fetch(TARIC_CONSULTATION_URL, { signal: AbortSignal.timeout(15000) });
      if (pageRes.ok) {
        const body = await pageRes.text();
        consultationHash = await simpleHash(body);
      }
    } catch { /* page check failed */ }

    // 3. Get previous hash from DB
    let prevHash: string | null = null;
    try {
      const { data } = await supabase
        .from('health_check_logs')
        .select('checks')
        .eq('overall_status', 'green')
        .order('checked_at', { ascending: false })
        .limit(1);
      if (data?.[0]?.checks) {
        const prev = (data[0].checks as Array<{ name: string; consultationHash?: string }>).find(
          (c) => c.name === 'taric-rss-monitor'
        );
        if (prev) prevHash = prev.consultationHash || null;
      }
    } catch { /* no previous hash */ }

    // 4. Filter recent RSS items (last 24h)
    const oneDayAgo = new Date(Date.now() - 86400000);
    const recentItems = rssItems.filter(item => {
      try { return new Date(item.pubDate) > oneDayAgo; } catch { return false; }
    });

    const hashChanged = consultationHash && prevHash && consultationHash !== prevHash;

    if (recentItems.length > 0 || hashChanged) {
      status = 'yellow';
      message = `${recentItems.length} new TARIC RSS items${hashChanged ? ' + consultation page changed' : ''}`;
      await sendAlert(recentItems.length > 0 ? recentItems : rssItems.slice(0, 5), consultationHash, prevHash);
    } else {
      message = `Checked TARIC RSS (${rssItems.length} total items), no new updates`;
    }

    // Log
    try {
      await supabase.from('health_check_logs').insert({
        checked_at: new Date().toISOString(),
        overall_status: status,
        checks: [{
          name: 'taric-rss-monitor',
          status,
          message,
          rssItemCount: rssItems.length,
          recentItemCount: recentItems.length,
          consultationHash,
          hashChanged: !!hashChanged,
        }],
        duration_ms: Date.now() - start,
      });
    } catch { /* silent */ }

    return NextResponse.json({ success: true, status, message, rssItems: rssItems.length, recentItems: recentItems.length, durationMs: Date.now() - start });
  } catch (err) {
    message = `TARIC RSS monitor failed: ${err instanceof Error ? err.message : 'Unknown'}`;
    try {
      await supabase.from('health_check_logs').insert({
        checked_at: new Date().toISOString(),
        overall_status: 'red',
        checks: [{ name: 'taric-rss-monitor', status: 'red', message }],
        duration_ms: Date.now() - start,
      });
    } catch { /* silent */ }

    return NextResponse.json({ success: false, status: 'red', message, durationMs: Date.now() - start });
  }
}
