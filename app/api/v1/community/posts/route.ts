/**
 * G-2: Community Posts API
 *
 * GET  /api/v1/community/posts — List posts (public, no auth required)
 * POST /api/v1/community/posts — Create post (auth required)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7); // Will be validated by Supabase
}

const VALID_TYPES = ['bug', 'question', 'suggestion'];
const VALID_STATUS = ['open', 'resolved', 'closed'];
const VALID_SORT = ['latest', 'popular'];

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  const url = new URL(req.url);
  const featureSlug = url.searchParams.get('feature_slug') || '';
  const featureCategory = url.searchParams.get('category') || '';
  const postType = url.searchParams.get('type') || '';
  const status = url.searchParams.get('status') || '';
  const sort = url.searchParams.get('sort') || 'latest';
  const search = url.searchParams.get('q') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('community_posts')
    .select('*', { count: 'exact' });

  if (featureSlug) query = query.eq('feature_slug', featureSlug);
  if (featureCategory) query = query.eq('feature_category', featureCategory);
  if (postType && VALID_TYPES.includes(postType)) query = query.eq('post_type', postType);
  if (status && VALID_STATUS.includes(status)) query = query.eq('status', status);
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

  if (sort === 'popular') {
    query = query.order('upvote_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    data: {
      posts: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });

  // Auth check via Supabase session cookie
  const { createServerClient } = await import('@supabase/ssr');
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required. Please sign in.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const postType = typeof body.post_type === 'string' ? body.post_type : '';
  const featureSlug = typeof body.feature_slug === 'string' ? body.feature_slug : null;
  const featureCategory = typeof body.feature_category === 'string' ? body.feature_category : null;
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];

  if (!title || title.length < 3) return NextResponse.json({ success: false, error: 'Title must be at least 3 characters.' }, { status: 400 });
  if (!content || content.length < 20) return NextResponse.json({ success: false, error: 'Content must be at least 20 characters.' }, { status: 400 });
  if (!VALID_TYPES.includes(postType)) return NextResponse.json({ success: false, error: `post_type must be: ${VALID_TYPES.join(', ')}` }, { status: 400 });

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      user_id: user.id,
      title,
      content,
      post_type: postType,
      feature_slug: featureSlug,
      feature_category: featureCategory,
      attachments: JSON.stringify(attachments.slice(0, 5)),
    })
    .select('id, title, post_type, feature_slug, status, created_at')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: { post: data } }, { status: 201 });
}
