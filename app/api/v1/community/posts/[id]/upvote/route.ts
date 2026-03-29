/**
 * G-2: Upvote Toggle API
 *
 * POST /api/v1/community/posts/[id]/upvote — Toggle upvote (auth required)
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

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  // Check if already upvoted
  const { data: existing } = await supabase
    .from('community_upvotes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  let upvoted: boolean;

  if (existing) {
    // Remove upvote
    await supabase.from('community_upvotes').delete().eq('post_id', postId).eq('user_id', user.id);
    await supabase.from('community_posts').update({
      upvote_count: Math.max(0, ((await supabase.from('community_posts').select('upvote_count').eq('id', postId).single()).data?.upvote_count || 1) - 1),
    }).eq('id', postId);
    upvoted = false;
  } else {
    // Add upvote
    await supabase.from('community_upvotes').insert({ post_id: postId, user_id: user.id });
    await supabase.from('community_posts').update({
      upvote_count: ((await supabase.from('community_posts').select('upvote_count').eq('id', postId).single()).data?.upvote_count || 0) + 1,
    }).eq('id', postId);
    upvoted = true;
  }

  // Get updated count
  const { data: updated } = await supabase.from('community_posts').select('upvote_count').eq('id', postId).single();

  return NextResponse.json({
    success: true,
    data: { upvoted, upvote_count: updated?.upvote_count || 0 },
  });
}
