/**
 * POTAL API v1 — /api/v1/admin/intelligence
 *
 * D15 Intelligence — Returns competitor scan history from health_check_logs.
 * Powers the /admin/intelligence dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  const secret = req.nextUrl.searchParams.get('secret');
  return secret === CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!CRON_SECRET || !verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Fetch competitor scan logs (last 30 entries, ~30 weeks of weekly scans)
    const { data, error } = await supabase
      .from('health_check_logs')
      .select('id, checked_at, overall_status, checks, duration_ms')
      .filter('checks->0->>name', 'like', 'competitor:%')
      .order('checked_at', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logs: data || [],
      count: data?.length || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
