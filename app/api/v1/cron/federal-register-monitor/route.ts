/**
 * POTAL Cron — /api/v1/cron/federal-register-monitor
 *
 * Monitors US Federal Register for tariff/customs changes.
 * Uses the Federal Register API (federalregister.gov/api/v1).
 * Checks for new documents from USITC, CBP, USTR related to tariffs.
 *
 * Vercel Cron: daily 06:00 UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logImportResult, isAutoImportEnabled } from '@/app/lib/data-management/import-trigger';

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

const FR_API_BASE = 'https://www.federalregister.gov/api/v1';

const AGENCIES = ['international-trade-commission', 'customs-and-border-protection', 'trade-representative'];

const TARIFF_TERMS = ['tariff', 'customs duty', 'harmonized tariff', 'HTS', 'trade remedy', 'antidumping', 'countervailing'];

interface FRDocument {
  title: string;
  type: string;
  abstract?: string;
  document_number: string;
  html_url: string;
  publication_date: string;
  agencies: Array<{ slug: string; name: string }>;
}

async function fetchRecentDocuments(): Promise<FRDocument[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const allDocs: FRDocument[] = [];

  for (const agency of AGENCIES) {
    try {
      const url = `${FR_API_BASE}/documents.json?conditions[agencies][]=${agency}&conditions[publication_date][gte]=${dateStr}&per_page=50&order=newest`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const data = await res.json();
        if (data.results) allDocs.push(...data.results);
      }
    } catch {
      // Skip failed agency
    }
  }

  return allDocs;
}

function filterTariffRelated(docs: FRDocument[]): FRDocument[] {
  return docs.filter(doc => {
    const text = `${doc.title} ${doc.abstract || ''}`.toLowerCase();
    return TARIFF_TERMS.some(term => text.includes(term.toLowerCase()));
  });
}

async function sendAlert(docs: FRDocument[]): Promise<boolean> {
  if (!RESEND_API_KEY || docs.length === 0) return false;

  const kstTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const rows = docs.map(d =>
    `<tr>
      <td style="padding:6px 8px;font-size:13px;">${d.publication_date}</td>
      <td style="padding:6px 8px;font-size:13px;"><a href="${d.html_url}">${d.title}</a></td>
      <td style="padding:6px 8px;font-size:12px;">${d.type}</td>
      <td style="padding:6px 8px;font-size:12px;">${d.agencies.map(a => a.name).join(', ')}</td>
    </tr>`
  ).join('');

  const html = `
<div style="font-family:sans-serif;max-width:700px;margin:0 auto;">
  <div style="background:#1e40af;color:white;padding:16px 20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:16px;">📋 US Federal Register — ${docs.length} Tariff-Related Updates</h2>
    <p style="margin:4px 0 0;font-size:12px;color:#bfdbfe;">${kstTime}</p>
  </div>
  <div style="background:white;padding:16px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <th style="padding:8px;text-align:left;font-size:12px;">Date</th>
        <th style="padding:8px;text-align:left;font-size:12px;">Title</th>
        <th style="padding:8px;text-align:left;font-size:12px;">Type</th>
        <th style="padding:8px;text-align:left;font-size:12px;">Agency</th>
      </tr>
      ${rows}
    </table>
  </div>
</div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: [EMAIL_TO], subject: `📋 US Federal Register — ${docs.length} tariff updates`, html }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  let status: 'green' | 'yellow' | 'red' = 'green';
  let message = '';

  try {
    const allDocs = await fetchRecentDocuments();
    const tariffDocs = filterTariffRelated(allDocs);

    if (tariffDocs.length > 0) {
      status = 'yellow';
      message = `${tariffDocs.length} tariff-related Federal Register documents found`;
      await sendAlert(tariffDocs);

      // Auto-import: add to country_regulatory_notes
      if (isAutoImportEnabled('FEDERAL_REGISTER')) {
        try {
          const supabaseImport = getSupabase();
          const notes = tariffDocs.map(doc => ({
            country: 'US',
            category: doc.title.match(/301/i) ? 'section_301' : doc.title.match(/232/i) ? 'section_232' : 'trade',
            title: doc.title.substring(0, 500),
            summary: (doc.abstract || '').substring(0, 500),
            effective_date: null,
            source_url: doc.html_url,
            created_at: new Date().toISOString(),
          }));
          await supabaseImport.from('country_regulatory_notes').insert(notes);
          await logImportResult({ success: true, source: 'federal_register', recordsUpdated: notes.length, triggeredBy: 'federal-register-monitor', triggeredAt: new Date().toISOString() });
        } catch {
          await logImportResult({ success: false, source: 'federal_register', recordsUpdated: 0, error: 'Insert failed', triggeredBy: 'federal-register-monitor', triggeredAt: new Date().toISOString() });
        }
      }
    } else {
      message = `Checked ${allDocs.length} documents, no tariff changes detected`;
    }

    // Log to health_check_logs
    try {
      const supabase = getSupabase();
      await supabase.from('health_check_logs').insert({
        checked_at: new Date().toISOString(),
        overall_status: status,
        checks: [{
          name: 'federal-register-monitor',
          status,
          message,
          totalDocs: allDocs.length,
          tariffDocs: tariffDocs.length,
          documents: tariffDocs.slice(0, 10).map(d => ({ title: d.title, url: d.html_url, date: d.publication_date })),
        }],
        duration_ms: Date.now() - start,
      });
    } catch { /* silent */ }

    return NextResponse.json({ success: true, status, message, totalDocs: allDocs.length, tariffDocs: tariffDocs.length, durationMs: Date.now() - start });
  } catch (err) {
    status = 'red';
    message = `Federal Register monitor failed: ${err instanceof Error ? err.message : 'Unknown'}`;

    try {
      const supabase = getSupabase();
      await supabase.from('health_check_logs').insert({
        checked_at: new Date().toISOString(),
        overall_status: 'red',
        checks: [{ name: 'federal-register-monitor', status: 'red', message }],
        duration_ms: Date.now() - start,
      });
    } catch { /* silent */ }

    return NextResponse.json({ success: false, status: 'red', message, durationMs: Date.now() - start });
  }
}
