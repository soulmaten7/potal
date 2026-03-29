/**
 * Community Comment API
 * PATCH  /api/v1/community/comments/[id] — Edit comment (owner only)
 * DELETE /api/v1/community/comments/[id] — Delete comment (owner only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function getUser(req: NextRequest) {
  const { createServerClient } = await import('@supabase/ssr');
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  const { data: existing } = await supabase.from('community_comments').select('user_id').eq('id', id).single();
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'You can only edit your own comments' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || content.length < 2) {
    return NextResponse.json({ success: false, error: 'Comment must be at least 2 characters.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('community_comments')
    .update({ content })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { comment: data } });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  const { data: existing } = await supabase.from('community_comments').select('user_id, post_id').eq('id', id).single();
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'You can only delete your own comments' }, { status: 403 });
  }

  await supabase.from('community_comments').delete().eq('id', id);

  // Decrement comment count (best-effort)
  try {
    const { data: post } = await supabase.from('community_posts').select('comment_count').eq('id', existing.post_id).single();
    await supabase.from('community_posts')
      .update({ comment_count: Math.max(0, ((post as { comment_count: number } | null)?.comment_count || 1) - 1), updated_at: new Date().toISOString() })
      .eq('id', existing.post_id);
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
