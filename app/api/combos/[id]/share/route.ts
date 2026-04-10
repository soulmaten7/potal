/**
 * POTAL API — /api/combos/[id]/share
 * Generate or revoke a public share link for a combo.
 *
 * POST   — generate share slug + set is_public=true
 * DELETE — revoke sharing (is_public=false, share_slug=null)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getComboById, updateCombo, generateShareSlug } from '@/lib/custom/combo-storage';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = getServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return { supabase, user };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization required.' } },
        { status: 401 },
      );
    }

    const { supabase, user } = auth;
    const { id } = await params;

    const combo = await getComboById(supabase, id);
    if (!combo || combo.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Combo not found.' } },
        { status: 404 },
      );
    }

    const slug = combo.share_slug || generateShareSlug(combo.name);
    const updated = await updateCombo(supabase, id, {
      share_slug: slug,
      is_public: true,
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://potal.app';
    const shareUrl = `${baseUrl}/custom/shared/${updated.share_slug}`;

    return NextResponse.json({
      success: true,
      data: { share_url: shareUrl, slug: updated.share_slug },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization required.' } },
        { status: 401 },
      );
    }

    const { supabase, user } = auth;
    const { id } = await params;

    const combo = await getComboById(supabase, id);
    if (!combo || combo.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Combo not found.' } },
        { status: 404 },
      );
    }

    await updateCombo(supabase, id, {
      is_public: false,
      share_slug: null as any,
    });

    return NextResponse.json({ success: true, data: { unshared: id } });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 },
    );
  }
}
