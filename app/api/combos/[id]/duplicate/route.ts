/**
 * POTAL API — /api/combos/[id]/duplicate
 * Duplicate an existing combo with name + " (copy)".
 *
 * POST /api/combos/[id]/duplicate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getComboById, duplicateCombo } from '@/lib/custom/combo-storage';

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

    const original = await getComboById(supabase, id);
    if (!original) {
      return NextResponse.json(
        { success: false, error: { message: 'Combo not found.' } },
        { status: 404 },
      );
    }

    const copy = await duplicateCombo(supabase, id, user.id);
    return NextResponse.json({ success: true, data: copy }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 },
    );
  }
}
