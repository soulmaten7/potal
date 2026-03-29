/**
 * G-2: Comments API
 *
 * GET  /api/v1/community/posts/[id]/comments — List comments
 * POST /api/v1/community/posts/[id]/comments — Add comment (auth required)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  const { data, error } = await supabase
    .from('community_comments')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { comments: data || [] } });
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id: postId } = await ctx.params;

  const { createServerClient } = await import('@supabase/ssr');
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || content.length < 2) {
    return NextResponse.json({ success: false, error: 'Comment must be at least 2 characters.' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  // Verify post exists
  const { data: post } = await supabase.from('community_posts').select('id').eq('id', postId).single();
  if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });

  const { data: comment, error } = await supabase
    .from('community_comments')
    .insert({ post_id: postId, user_id: user.id, content })
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Increment comment count
  try {
    const { data: currentPost } = await supabase.from('community_posts').select('comment_count').eq('id', postId).single();
    await supabase.from('community_posts')
      .update({ comment_count: ((currentPost as any)?.comment_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', postId);
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true, data: { comment } }, { status: 201 });
}
