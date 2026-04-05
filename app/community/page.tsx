'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { FEATURES } from '@/app/features/features-data';
import { COMMUNITY_CATEGORIES, CATEGORY_MAP } from './community-categories';
import { useI18n } from '@/app/i18n';
import type { TranslationKey } from '@/app/i18n/translations/en';

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

interface Post {
  id: string;
  title: string;
  content: string;
  post_type: 'bug' | 'question' | 'suggestion';
  feature_slug: string | null;
  feature_category: string | null;
  community_category: string | null;
  status: 'open' | 'resolved' | 'closed';
  upvote_count: number;
  comment_count: number;
  created_at: string;
  user_id: string;
  author_email?: string;
}

export default function CommunityPage() {
  const { t } = useI18n();
  const { session } = useSupabase();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [communityCategory, setCommunityCategory] = useState('');
  const [postType, setPostType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [search, setSearch] = useState('');
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const TYPE_CONFIG = {
    bug: { label: t('community.type.bug'), color: '#dc2626', bg: '#fef2f2' },
    question: { label: t('community.type.question'), color: '#2563eb', bg: '#eff6ff' },
    suggestion: { label: t('community.type.suggestion'), color: '#7c3aed', bg: '#f5f3ff' },
  } as const;

  const STATUS_CONFIG = {
    open: { label: t('community.status.open'), color: '#16a34a', bg: '#f0fdf4' },
    resolved: { label: t('community.status.resolved'), color: '#6b7280', bg: '#f9fafb' },
    closed: { label: t('community.status.closed'), color: '#9ca3af', bg: '#f9fafb' },
  } as const;

  const fetchPosts = useCallback(async () => {
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
  }, [communityCategory, postType, status, sort, search, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const totalPages = Math.ceil(total / 20);
  const featureMap = Object.fromEntries(FEATURES.map(f => [f.id, f.name]));
  const activeCat = communityCategory ? CATEGORY_MAP[communityCategory] : null;

  const SidebarContent = () => (
    <div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">{t('community.categories')}</h3>
      <button
        onClick={() => { setCommunityCategory(''); setPage(1); setMobileSidebar(false); }}
        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
          !communityCategory ? 'bg-amber-100 text-amber-800 font-bold border-l-[3px] border-amber-500' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {t('community.allPosts')}
      </button>
      {COMMUNITY_CATEGORIES.map(cat => (
        <button
          key={cat.slug}
          onClick={() => { setCommunityCategory(cat.slug); setPage(1); setMobileSidebar(false); }}
          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 flex items-center gap-2 ${
            communityCategory === cat.slug ? 'bg-amber-100 text-amber-800 font-bold border-l-[3px] border-amber-500' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>{cat.icon}</span>
          <span className="truncate">{cat.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1340px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('community.title')}</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            {activeCat ? `${activeCat.icon} ${activeCat.label} — ${activeCat.description}` : t('community.defaultSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileSidebar(!mobileSidebar)}
            className="md:hidden px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            {t('community.categories')}
          </button>
          {session && (
            <Link
              href={`/community/new${communityCategory ? `?category=${communityCategory}` : ''}`}
              className="bg-amber-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors flex-shrink-0 shadow-sm"
            >
              {t('community.newPost')}
            </Link>
          )}
        </div>
      </div>

      {mobileSidebar && (
        <div className="md:hidden bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
          <SidebarContent />
        </div>
      )}

      <div className="flex gap-6">
        <aside className="hidden md:block w-60 flex-shrink-0">
          <div className="sticky top-20 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <SidebarContent />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3 shadow-sm">
            <input
              type="text"
              placeholder={t('community.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
            />
            <select
              value={postType}
              onChange={(e) => { setPostType(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            >
              <option value="">{t('community.allTypes')}</option>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            >
              <option value="">{t('community.allStatus')}</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as 'latest' | 'popular'); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            >
              <option value="latest">{t('community.sortLatest')}</option>
              <option value="popular">{t('community.sortPopular')}</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">{t('common.loading')}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
              <p className="text-gray-400 text-lg mb-3">{t('community.noPosts')}</p>
              {session ? (
                <Link href="/community/new" className="text-amber-600 font-bold hover:underline">{t('community.beFirst')}</Link>
              ) : (
                <Link href="/auth/signup" className="text-amber-600 font-bold hover:underline">{t('community.signUpToPost')}</Link>
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
                  <Link key={post.id} href={`/community/${post.id}`} className="group block">
                    <div className={`flex gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                      <div className="flex flex-col items-center gap-0.5 min-w-[48px] pt-1">
                        <span className="text-lg font-bold text-gray-700">{post.upvote_count}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{t('community.votes')}</span>
                      </div>
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
                          <span className="font-medium text-gray-500">{post.author_email?.split('@')[0] || t('community.anonymous')}</span>
                          <span>·</span>
                          <span>{timeAgo(post.created_at)}</span>
                        </div>
                      </div>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50">{t('community.previous')}</button>
              <span className="text-sm text-gray-500">{t('community.pageOf').replace('{page}', String(page)).replace('{total}', String(totalPages))}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50">{t('community.next')}</button>
            </div>
          )}

          {!session && (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl text-center border border-gray-100">
              <p className="text-gray-600 text-sm mb-3">{t('community.signInPrompt')}</p>
              <Link href="/auth/signup" className="bg-amber-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm inline-block hover:bg-amber-600 transition-colors shadow-sm">{t('community.signUpFree')}</Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
