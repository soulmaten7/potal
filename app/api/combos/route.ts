/**
 * POTAL API — /api/combos
 * CRUD endpoints for user combo management.
 *
 * GET    /api/combos          — list combos for authenticated user
 * POST   /api/combos          — create a new combo
 * PATCH  /api/combos          — update an existing combo
 * DELETE /api/combos          — delete a combo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  listCombos,
  createCombo,
  updateCombo,
  deleteCombo,
} from '@/lib/custom/combo-storage';

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

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization required.' } },
        { status: 401 },
      );
    }

    const { supabase, user } = auth;
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'recent';
    const q = searchParams.get('q') || '';

    let combos = await listCombos(supabase, user.id);

    // Filter by search query
    if (q) {
      const lower = q.toLowerCase();
      combos = combos.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          (c.description && c.description.toLowerCase().includes(lower)),
      );
    }

    // Sort
    switch (sort) {
      case 'popular':
        combos.sort((a, b) => b.use_count - a.use_count);
        break;
      case 'name':
        combos.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'favorite':
        combos.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
        break;
      case 'recent':
      default:
        // Already sorted by updated_at desc from listCombos
        break;
    }

    return NextResponse.json({ success: true, data: combos });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization required.' } },
        { status: 401 },
      );
    }

    const { supabase, user } = auth;
    const body = await req.json();
    const { name, selected_features, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: { message: 'Name is required.' } },
        { status: 400 },
      );
    }

    if (!Array.isArray(selected_features) || selected_features.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'At least one feature must be selected.' } },
        { status: 400 },
      );
    }

    const combo = await createCombo(
      supabase,
      user.id,
      name.trim(),
      selected_features,
      description,
    );

    return NextResponse.json({ success: true, data: combo }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization required.' } },
        { status: 401 },
      );
    }

    const { supabase } = auth;
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Combo ID is required.' } },
        { status: 400 },
      );
    }

    const combo = await updateCombo(supabase, id, updates);
    return NextResponse.json({ success: true, data: combo });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization required.' } },
        { status: 401 },
      );
    }

    const { supabase } = auth;
    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Combo ID is required.' } },
        { status: 400 },
      );
    }

    await deleteCombo(supabase, id);
    return NextResponse.json({ success: true, data: { deleted: id } });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 },
    );
  }
}
