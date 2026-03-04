/**
 * POTAL API v1 — /api/v1/admin/tariffs
 *
 * Admin endpoint for managing tariff data.
 * Requires sk_live_ key (secret key only).
 *
 * GET  — List duty rates (with optional filters)
 * POST — Update duty rate(s)
 * PUT  — Bulk update duty rates
 *
 * After any update, cache is invalidated automatically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { invalidateCache } from '@/app/lib/cost-engine/db';

// ─── Admin Auth (simplified — checks for admin key in env) ─────

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials');
  }
  return createClient(url, key) as any;
}

async function verifyAdminAuth(req: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.slice(7);

  // Admin auth: must be sk_live_ key + must be admin seller
  // For now, check against POTAL_ADMIN_KEY env var
  const adminKey = process.env.POTAL_ADMIN_KEY;
  if (!adminKey) {
    return { authorized: false, error: 'Admin access not configured' };
  }

  if (token !== adminKey) {
    return { authorized: false, error: 'Invalid admin credentials' };
  }

  return { authorized: true };
}

// ─── GET: List Duty Rates ──────────────────────────

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const table = searchParams.get('table') || 'duty_rates';
  const country = searchParams.get('country');
  const chapter = searchParams.get('chapter');

  const supabase = getAdminSupabase();

  let query;

  switch (table) {
    case 'duty_rates':
      query = supabase.from('duty_rates').select('*').eq('is_active', true);
      if (country) query = query.eq('destination_country', country.toUpperCase());
      if (chapter) query = query.eq('hs_chapter', chapter);
      break;

    case 'country_profiles':
      query = supabase.from('country_profiles').select('*').eq('is_active', true);
      if (country) query = query.eq('country_code', country.toUpperCase());
      break;

    case 'fta_agreements':
      query = supabase.from('fta_agreements').select('*').eq('is_active', true);
      break;

    case 'fta_members':
      query = supabase.from('fta_members').select('*');
      if (country) query = query.eq('country_code', country.toUpperCase());
      break;

    case 'additional_tariffs':
      query = supabase.from('additional_tariffs').select('*').eq('is_active', true);
      if (country) query = query.eq('destination_country', country.toUpperCase());
      if (chapter) query = query.eq('hs_chapter', chapter);
      break;

    case 'cache_status': {
      const { getCacheStatus } = await import('@/app/lib/cost-engine/db');
      return NextResponse.json({ data: getCacheStatus() });
    }

    default:
      return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count: data?.length || 0 });
}

// ─── POST: Update Single Record ────────────────────

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const table = body.table as string;
  const action = body.action as string;
  const record = body.record as Record<string, unknown>;

  if (!table || !action || !record) {
    return NextResponse.json(
      { error: 'Required fields: table, action (upsert|delete), record' },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();

  let result;

  switch (action) {
    case 'upsert': {
      // Add updated_at
      record.updated_at = new Date().toISOString();
      record.updated_by = 'admin_api';

      const { data, error } = await supabase
        .from(table)
        .upsert(record, { onConflict: getConflictKey(table) })
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
      break;
    }

    case 'delete': {
      const id = record.id;
      if (!id) {
        return NextResponse.json({ error: 'record.id required for delete' }, { status: 400 });
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = { deleted: id };
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  // Invalidate cache after any write
  invalidateCacheForTable(table);

  // Log the update
  await logTariffUpdate(supabase, table, action, 1, `Admin API ${action} on ${table}`);

  return NextResponse.json({ success: true, data: result });
}

// ─── PUT: Bulk Update ──────────────────────────────

export async function PUT(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const table = body.table as string;
  const records = body.records as Record<string, unknown>[];

  if (!table || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json(
      { error: 'Required fields: table, records (non-empty array)' },
      { status: 400 }
    );
  }

  if (records.length > 500) {
    return NextResponse.json(
      { error: 'Maximum 500 records per bulk update' },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();

  // Add metadata to each record
  const now = new Date().toISOString();
  const enrichedRecords = records.map(r => ({
    ...r,
    updated_at: now,
    updated_by: 'admin_api_bulk',
  }));

  const { data, error } = await supabase
    .from(table)
    .upsert(enrichedRecords, { onConflict: getConflictKey(table) })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Invalidate cache
  invalidateCacheForTable(table);

  // Log
  await logTariffUpdate(supabase, table, 'BULK_UPDATE', records.length, `Bulk update: ${records.length} records`);

  return NextResponse.json({
    success: true,
    data,
    count: data?.length || 0,
  });
}

// ─── Helpers ───────────────────────────────────────

function getConflictKey(table: string): string {
  switch (table) {
    case 'duty_rates': return 'hs_chapter,hs_code,destination_country';
    case 'country_profiles': return 'country_code';
    case 'fta_agreements': return 'fta_code';
    case 'fta_members': return 'fta_code,country_code';
    case 'additional_tariffs': return 'tariff_name,origin_country,destination_country,hs_chapter';
    default: return 'id';
  }
}

function invalidateCacheForTable(table: string) {
  switch (table) {
    case 'duty_rates':
      invalidateCache('duty_rates');
      break;
    case 'country_profiles':
      invalidateCache('country_profiles');
      break;
    case 'fta_agreements':
    case 'fta_members':
      invalidateCache('fta_agreements');
      break;
    case 'additional_tariffs':
      invalidateCache('additional_tariffs');
      break;
  }
}

async function logTariffUpdate(supabase: any, table: string, action: string, count: number, description: string) {
  try {
    await supabase.from('tariff_update_log').insert({
      table_name: table,
      action,
      records_affected: count,
      description,
      updated_by: 'admin_api',
    });
  } catch {
    // Silent fail — logging shouldn't block the response
  }
}
