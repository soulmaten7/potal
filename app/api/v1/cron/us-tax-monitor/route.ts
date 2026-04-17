/**
 * CW38 Phase 2 — US State Sales Tax Monitor
 * Monitors Tax Foundation for state sales tax rate changes.
 * Schedule: monthly 1st, 10:00 UTC
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

const TAX_FOUNDATION_URL = 'https://taxfoundation.org/data/all/state/sales-tax-rates/';

async function simpleHash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const start = Date.now();
  const supabase = getSupabase();
  let status: 'green' | 'yellow' | 'red' = 'green';
  let message = '';
  let pageHash: string | null = null;

  try {
    // Fetch Tax Foundation page
    const res = await fetch(TAX_FOUNDATION_URL, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const body = await res.text();
      pageHash = await simpleHash(body);
      message = `US tax monitor: Tax Foundation page checked (hash: ${pageHash.slice(0, 16)}...)`;
    } else {
      status = 'yellow';
      message = `US tax monitor: Tax Foundation returned ${res.status}`;
    }
  } catch (e) {
    status = 'yellow';
    message = `US tax monitor: fetch failed (${e instanceof Error ? e.message : 'timeout'})`;
  }

  try {
    await supabase.from('health_check_logs').insert({
      checked_at: new Date().toISOString(),
      overall_status: status,
      checks: [{ name: 'us-tax-monitor', status, message, pageHash }],
      duration_ms: Date.now() - start,
    });
  } catch { /* silent */ }

  return NextResponse.json({ success: true, status, message, durationMs: Date.now() - start });
}
