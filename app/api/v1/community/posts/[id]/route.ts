/**
 * G-2: Single Post API
 *
 * GET    /api/v1/community/posts/[id] — Post detail + comments
 * PUT    /api/v1/community/posts/[id] — Edit post (owner only)
 * DELETE /api/v1/community/posts/[id] — Delete post (owner only)
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

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  const { data: post, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });

  const { data: comments } = await supabase
    .from('community_comments')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    success: true,
    data: { post, comments: comments || [] },
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  // Verify ownership
  const { data: existing } = await supabase.from('community_posts').select('user_id').eq('id', id).single();
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'You can only edit your own posts' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === 'string' && body.title.trim().length >= 3) updates.title = body.title.trim();
  if (typeof body.content === 'string' && body.content.trim().length >= 20) updates.content = body.content.trim();
  if (typeof body.status === 'string' && ['open', 'resolved', 'closed'].includes(body.status)) updates.status = body.status;

  const { data, error } = await supabase.from('community_posts').update(updates).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: { post: data } });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  const { data: existing } = await supabase.from('community_posts').select('user_id').eq('id', id).single();
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ success: false, error: 'You can only delete your own posts' }, { status: 403 });
  }

  const { error } = await supabase.from('community_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: { deleted: true } });
}
