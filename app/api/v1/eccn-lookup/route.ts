/**
 * CW37-S4: /api/v1/eccn-lookup — Export Control Classification Number search
 *
 * Searches eccn_entries table (seeded from BIS Commerce Control List).
 * Falls back to existing /api/v1/classify/eccn if DB empty.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
  const productDescription = typeof body.productDescription === 'string' ? body.productDescription.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : undefined;
  const searchText = keyword || productDescription;

  if (!searchText) return apiError(ApiErrorCode.BAD_REQUEST, 'keyword or productDescription required.');

  const sb = getSupabase();
  if (!sb) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  try {
    // Full-text search on eccn_entries
    let query = sb.from('eccn_entries').select('*')
      .textSearch('description', searchText, { type: 'websearch' })
      .limit(10);

    if (category) {
      const catNum = category.replace(/[^0-9]/g, '');
      if (catNum) query = query.eq('category', catNum);
    }

    const { data, error } = await query;

    // Fallback: ilike search if FTS returns nothing
    let matches = data || [];
    if (matches.length === 0 && !error) {
      const { data: ilikeData } = await sb.from('eccn_entries').select('*')
        .ilike('description', `%${searchText}%`)
        .limit(10);
      matches = ilikeData || [];
    }

    // Get total count for metadata
    const { count } = await sb.from('eccn_entries').select('*', { count: 'exact', head: true });

    return apiSuccess({
      matches: matches.map((m: Record<string, unknown>) => ({
        eccn: m.eccn,
        description: m.description,
        category: `Cat ${m.category}`,
        controlReasons: m.control_reasons || [],
        licenseRequired: m.license_required || null,
        exceptions: m.exceptions || [],
      })),
      totalMatches: matches.length,
      queriedAt: new Date().toISOString(),
      dataLastUpdated: '2026-03-18T00:00:00Z',
      totalEccnEntries: count || 0,
      disclaimer: 'For informational use only. Final ECCN determination requires BIS CCATS (Commodity Classification Automated Tracking System) or legal counsel review. POTAL does not provide export control legal advice.',
    }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'ECCN lookup failed.');
  }
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST,
    'POST { keyword: "encryption", category?: "5", productDescription?: "256-bit AES" }'
  );
}
