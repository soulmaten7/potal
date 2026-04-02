'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { FEATURES, CATEGORIES, type FeatureCategory, CATEGORY_ICONS } from '@/app/features/features-data';
import { COMMUNITY_CATEGORIES, CATEGORY_MAP, type CommunityCategory } from './community-categories';

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
  community_category: string | null;
  status: keyof typeof STATUS_CONFIG;
  upvote_count: number;
  comment_count: number;
  created_at: string;
  user_id: string;
  author_email?: string;
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
  const { session } = useSupabase();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [communityCategory, setCommunityCategory] = useState('');
  const [featureCategory, setFeatureCategory] = useState('');
  const [postType, setPostType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [search, setSearch] = useState('');
  const [showFeatureGuides, setShowFeatureGuides] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const fetchPosts = useCallback(async () => {
    // Skip API call when viewing feature guides (rendered from static data)
    if (featureCategory) { setLoading(false); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (communityCategory) params.set('community_category', communityCategory);
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
  }, [communityCategory, featureCategory, postType, status, sort, search, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const totalPages = Math.ceil(total / 20);
  const featureMap = Object.fromEntries(FEATURES.map(f => [f.id, f.name]));
  const activeCat = communityCategory ? CATEGORY_MAP[communityCategory] : null;

  // Sidebar component (shared between desktop and mobile)
  const SidebarContent = () => (
    <>
      {/* 8 Community Categories */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Categories</h3>
        <button
          onClick={() => { setCommunityCategory(''); setFeatureCategory(''); setPage(1); setMobileSidebar(false); }}
          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
            !communityCategory ? 'bg-amber-100 text-amber-800 font-bold border-l-[3px] border-amber-500' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Posts
        </button>
        {COMMUNITY_CATEGORIES.map(cat => (
          <button
            key={cat.slug}
            onClick={() => { setCommunityCategory(cat.slug); setFeatureCategory(''); setPage(1); setMobileSidebar(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 flex items-center gap-2 ${
              communityCategory === cat.slug ? 'bg-amber-100 text-amber-800 font-bold border-l-[3px] border-amber-500' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{cat.icon}</span>
            <span className="truncate">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Feature Guides (collapsible) */}
      <div className="border-t-2 border-gray-100 mt-4 pt-4">
        <button
          onClick={() => setShowFeatureGuides(!showFeatureGuides)}
          className="w-full text-left px-2 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-3"
        >
          <span>Feature Guides</span>
          <span className="text-gray-300">{showFeatureGuides ? '\u25b2' : '\u25bc'}</span>
        </button>
        {showFeatureGuides && (
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {CATEGORIES.filter(c => c.key !== 'All').map(cat => (
              <button
                key={cat.key}
                onClick={() => { setFeatureCategory(cat.key); setCommunityCategory(''); setPage(1); setMobileSidebar(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                  featureCategory === cat.key ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span>{CATEGORY_ICONS[cat.key as FeatureCategory] || ''}</span>
                <span className="truncate">{cat.label}</span>
                <span className="text-gray-300 ml-auto">{cat.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="max-w-[1340px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Community</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            {activeCat ? `${activeCat.icon} ${activeCat.label} — ${activeCat.description}` : 'Share feedback, report bugs, ask questions about POTAL features.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebar(!mobileSidebar)}
            className="md:hidden px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            Categories
          </button>
          {session && (
            <Link
              href={`/community/new${communityCategory ? `?category=${communityCategory}` : ''}`}
              className="bg-amber-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors flex-shrink-0 shadow-sm"
            >
              New Post
            </Link>
          )}
        </div>
      </div>

      {/* Mobile sidebar dropdown */}
      {mobileSidebar && (
        <div className="md:hidden bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
          <SidebarContent />
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-60 flex-shrink-0">
          <div className="sticky top-20 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Filters row */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3 shadow-sm">
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
            />
            <select
              value={postType}
              onChange={(e) => { setPostType(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            >
              <option value="">All Types</option>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as 'latest' | 'popular'); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* Posts or Feature Guides */}
          {featureCategory ? (
            /* Show features from the selected category */
            (() => {
              const filtered = FEATURES.filter(f => f.category === featureCategory);
              return filtered.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <p className="text-gray-400 text-lg">No features in this category</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-700">
                      {CATEGORY_ICONS[featureCategory as FeatureCategory]} {CATEGORIES.find(c => c.key === featureCategory)?.label} — {filtered.length} features
                    </h2>
                    <button onClick={() => setFeatureCategory('')} className="text-xs text-gray-400 hover:text-gray-600">Clear filter</button>
                  </div>
                  {filtered.map((feature, idx) => (
                    <Link
                      key={feature.id}
                      href={`/features/${feature.slug}`}
                      className="group block"
                    >
                      <div className={`flex gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                        <div className="flex items-center justify-center min-w-[48px] text-2xl">
                          {CATEGORY_ICONS[feature.category] || '📄'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              feature.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {feature.status === 'active' ? 'Active' : 'Coming Soon'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{feature.id}</span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-amber-700 transition-colors line-clamp-1">{feature.name}</h3>
                          <p className="text-xs text-gray-400 line-clamp-1">{feature.description}</p>
                        </div>
                        <div className="flex items-center text-gray-300 flex-shrink-0 self-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()
          ) : loading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
              <p className="text-gray-400 text-lg mb-3">No posts yet</p>
              {session ? (
                <Link href="/community/new" className="text-amber-600 font-bold hover:underline">Be the first to post</Link>
              ) : (
                <Link href="/auth/signup" className="text-amber-600 font-bold hover:underline">Sign up to post</Link>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {posts.map((post, idx) => {
                const typeConfig = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.question;
                const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.open;
                const featureName = post.feature_slug ? (featureMap[post.feature_slug] || post.feature_slug) : null;
                const postCat = post.community_category ? CATEGORY_MAP[post.community_category] : null;

                return (
                  <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="group block"
                  >
                    <div className={`flex gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                      {/* Left: Votes */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[48px] pt-1">
                        <span className="text-lg font-bold text-gray-700">{post.upvote_count}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">votes</span>
                      </div>

                      {/* Center: Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {postCat && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                              {postCat.icon} {postCat.label}
                            </span>
                          )}
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: typeConfig.color }}>
                            {typeConfig.label}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: statusConfig.color, background: statusConfig.bg, border: `1px solid ${statusConfig.color}30` }}>
                            {statusConfig.label}
                          </span>
                          {featureName && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{featureName}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base mb-1.5 group-hover:text-amber-700 transition-colors line-clamp-1">{post.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
                            {(post.author_email || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-500">{post.author_email?.split('@')[0] || 'Anonymous'}</span>
                          <span>·</span>
                          <span>{timeAgo(post.created_at)}</span>
                        </div>
                      </div>

                      {/* Right: Comments */}
                      <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0 self-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-500">{post.comment_count}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50">Previous</button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50">Next</button>
            </div>
          )}

          {/* Not logged in */}
          {!session && (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl text-center border border-gray-100">
              <p className="text-gray-600 text-sm mb-3">Sign in to post, comment, and vote.</p>
              <Link href="/auth/signup" className="bg-amber-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm inline-block hover:bg-amber-600 transition-colors shadow-sm">Sign Up Free</Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
