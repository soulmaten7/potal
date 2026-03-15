/**
 * POTAL API v1 — /api/v1/certification/waitlist
 * Certification program waitlist signup (public, no auth required)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON.' } }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: { message: 'Valid email required.' } }, { status: 400 });
  }

  const sb = getSupabase();

  // Upsert to avoid duplicates
  const { error } = await sb.from('certification_waitlist').upsert(
    { email, signed_up_at: new Date().toISOString() },
    { onConflict: 'email' }
  );

  if (error) {
    return NextResponse.json({ error: { message: 'Could not save. Please try again.' } }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Added to waitlist.' });
}
