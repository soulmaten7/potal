'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { FEATURES, CATEGORIES, type FeatureCategory, CATEGORY_ICONS } from '@/app/features/features-data';

const TYPE_CONFIG = {
  bug: { label: 'Bug', color: '#dc2626', bg: '#fef2f2' },
  question: { label: 'Question', color: '#2563eb', bg: '#eff6ff' },
  suggestion: { label: 'Suggestion', color: '#7c3aed', bg: '#f5f3ff' },
} as const;

const STATUS_CONFIG = {
  open: { label: 'Open', color: '#16a34a', bg: '#f0fdf4' },
  resolved: { label: 'Resolved', color: '#6b7280', bg: '#f9fafb' },
  closed: { label: 'Closed', color: '#9ca3af', bg: '#f9fafb' },
} as const;

interface Post {
  id: string;
  title: string;
  content: string;
  post_type: keyof typeof TYPE_CONFIG;
  feature_slug: string | null;
  feature_category: string | null;
  status: keyof typeof STATUS_CONFIG;
  upvote_count: number;
  comment_count: number;
  created_at: string;
  user_id: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommunityPage() {
  const router = useRouter();
  const { session } = useSupabase();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [category, setCategory] = useState('');
  const [postType, setPostType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [search, setSearch] = useState('');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (postType) params.set('type', postType);
    if (status) params.set('status', status);
    if (search) params.set('q', search);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/v1/community/posts?${params}`);
      const json = await res.json();
      if (json.success) {
        setPosts(json.data.posts);
        setTotal(json.data.pagination.total);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [category, postType, status, sort, search, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const totalPages = Math.ceil(total / 20);
  const featureMap = Object.fromEntries(FEATURES.map(f => [f.id, f.name]));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-500 mt-1">Share feedback, report bugs, ask questions about POTAL features.</p>
        </div>
        {session && (
          <Link
            href="/community/new"
            className="bg-[#F59E0B] text-[#02122c] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-amber-400 transition-colors flex-shrink-0"
          >
            New Post
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 mb-6 space-y-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[#F59E0B]"
        />

        <div className="flex flex-wrap gap-3">
          {/* Category tabs */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.filter(c => c.key !== 'All').map(c => (
              <option key={c.key} value={c.key}>{CATEGORY_ICONS[c.key as FeatureCategory] || ''} {c.key} ({c.count})</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={postType}
            onChange={(e) => { setPostType(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          >
            <option value="">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as 'latest' | 'popular'); setPage(1); }}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">No posts yet</p>
          {session ? (
            <Link href="/community/new" className="text-[#F59E0B] font-bold hover:underline">
              Be the first to post
            </Link>
          ) : (
            <Link href="/auth/signup" className="text-[#F59E0B] font-bold hover:underline">
              Sign up to post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const typeConfig = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.question;
            const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.open;
            const featureName = post.feature_slug ? (featureMap[post.feature_slug] || post.feature_slug) : null;

            return (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block border rounded-xl p-5 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: typeConfig.color, background: typeConfig.bg }}>
                        {typeConfig.label}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: statusConfig.color, background: statusConfig.bg }}>
                        {statusConfig.label}
                      </span>
                      {featureName && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {featureName}
                        </span>
                      )}
                      {post.feature_category && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                          {post.feature_category}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 text-[15px] mb-1 line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-gray-400 text-xs flex-shrink-0">
                    <div className="text-center">
                      <div className="font-bold text-gray-600 text-sm">{post.upvote_count}</div>
                      <div>votes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-600 text-sm">{post.comment_count}</div>
                      <div>replies</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Not logged in CTA */}
      {!session && (
        <div className="mt-8 p-6 bg-gray-50 rounded-xl text-center">
          <p className="text-gray-600 mb-3">Sign in to post, comment, and vote.</p>
          <Link href="/auth/signup" className="bg-[#F59E0B] text-[#02122c] px-6 py-2.5 rounded-lg font-bold text-sm inline-block hover:bg-amber-400">
            Sign Up Free
          </Link>
        </div>
      )}
    </div>
  );
}
