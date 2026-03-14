/**
 * POTAL API — Newsletter Subscription
 * POST /api/v1/newsletter
 * Body: { email: string }
 *
 * Stores email in newsletter_subscribers table (best-effort).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await (supabase.from('newsletter_subscribers') as any)
      .upsert(
        { email: email.toLowerCase().trim(), subscribed_at: new Date().toISOString() },
        { onConflict: 'email' }
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // Fail silently — don't block UX
  }
}
