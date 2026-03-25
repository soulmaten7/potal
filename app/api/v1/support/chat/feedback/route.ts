/**
 * POTAL API v1 — /api/v1/support/chat/feedback
 * Collect user feedback on AI chatbot responses.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const logId = typeof body.log_id === 'string' ? body.log_id.trim() : '';
  const rating = typeof body.rating === 'string' ? body.rating : '';
  const comment = typeof body.comment === 'string' ? body.comment.slice(0, 500) : undefined;

  if (!logId) {
    return NextResponse.json({ error: 'log_id is required' }, { status: 400 });
  }

  if (!['helpful', 'not_helpful'].includes(rating)) {
    return NextResponse.json({ error: 'rating must be "helpful" or "not_helpful"' }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb.from('support_chat_feedback').insert({
      log_id: logId,
      rating,
      comment,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
