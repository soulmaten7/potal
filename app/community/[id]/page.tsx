'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { FEATURES, CATEGORIES, type FeatureCategory, CATEGORY_ICONS } from '@/app/features/features-data';
import { COMMUNITY_CATEGORIES, CATEGORY_MAP } from '../community-categories';

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
  updated_at?: string;
  user_id: string;
  author_email?: string;
}

interface Comment {
  id: string;
  content: string;
  is_official: boolean;
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

function displayName(email: string): string {
  if (!email) return 'Anonymous';
  return email.split('@')[0];
}

function Avatar({ email, className = 'w-8 h-8' }: { email: string; className?: string }) {
  const initial = email ? email[0].toUpperCase() : '?';
  const colors = ['bg-amber-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-rose-400'];
  const color = colors[email ? email.charCodeAt(0) % colors.length : 0];
  return (
    <div className={`${className} rounded-full ${color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
      {initial}
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { session } = useSupabase();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [showFeatureGuides, setShowFeatureGuides] = useState(false);

  // Post edit state
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [savingPost, setSavingPost] = useState(false);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/community/posts/${postId}`);
      const json = await res.json();
      if (json.success) {
        setPost(json.data.post);
        setComments(json.data.comments || []);
        setUpvoteCount(json.data.post.upvote_count);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  async function handleUpvote() {
    if (!session) return;
    try {
      const res = await fetch(`/api/v1/community/posts/${postId}/upvote`, {
        method: 'POST', credentials: 'include',
      });
      const json = await res.json();
      if (json.success) { setUpvoted(json.data.upvoted); setUpvoteCount(json.data.upvote_count); }
    } catch { /* silent */ }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || commentText.trim().length < 2) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        const newComment: Comment = {
          ...json.data.comment,
          author_email: session?.user?.email || '',
        };
        setComments(prev => [...prev, newComment]);
        setCommentText('');
      }
    } catch { /* silent */ }
    setSubmitting(false);
  }

  async function handleSavePost() {
    if (!post) return;
    setSavingPost(true);
    try {
      const res = await fetch(`/api/v1/community/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: editTitle, content: editContent, status: editStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setPost({ ...post, ...json.data.post });
        setEditingPost(false);
      }
    } catch { /* silent */ }
    setSavingPost(false);
  }

  async function handleSaveComment(commentId: string) {
    if (!editCommentText.trim() || editCommentText.trim().length < 2) return;
    setSavingComment(true);
    try {
      const res = await fetch(`/api/v1/community/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: editCommentText.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentText.trim() } : c));
        setEditingCommentId(null);
      }
    } catch { /* silent */ }
    setSavingComment(false);
  }

  async function handleDeletePost() {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/v1/community/posts/${postId}`, {
        method: 'DELETE', credentials: 'include',
      });
      const json = await res.json();
      if (json.success) router.push('/community');
    } catch { /* silent */ }
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">Loading...</div>;
  if (!post) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
      <Link href="/community" className="text-[#F59E0B] font-bold hover:underline">← Back to Community</Link>
    </div>
  );

  const typeConfig = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.question;
  const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.open;
  const featureName = post.feature_slug ? (FEATURES.find(f => f.id === post.feature_slug)?.name || post.feature_slug) : null;
  const postCat = post.community_category ? CATEGORY_MAP[post.community_category] : null;
  const isPostOwner = session?.user?.id === post.user_id;

  const SidebarContent = () => (
    <>
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Categories</h3>
        <Link
          href="/community"
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 block text-gray-600 hover:bg-gray-50"
        >
          ← All Posts
        </Link>
        {COMMUNITY_CATEGORIES.map(cat => (
          <Link
            key={cat.slug}
            href={`/community?category=${cat.slug}`}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 flex items-center gap-2 ${
              post.community_category === cat.slug ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{cat.icon}</span>
            <span className="truncate">{cat.label}</span>
          </Link>
        ))}
      </div>
      <div className="border-t pt-4">
        <button
          onClick={() => setShowFeatureGuides(!showFeatureGuides)}
          className="w-full text-left px-2 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
        >
          <span>Feature Guides</span>
          <span className="text-gray-300">{showFeatureGuides ? '▲' : '▼'}</span>
        </button>
        {showFeatureGuides && (
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {CATEGORIES.filter((c: { key: string }) => c.key !== 'All').map((cat: { key: string; label: string; count: number }) => (
              <Link
                key={cat.key}
                href={`/community?feature_category=${cat.key}`}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                  post.feature_category === cat.key ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span>{CATEGORY_ICONS[cat.key as FeatureCategory] || ''}</span>
                <span className="truncate">{cat.label}</span>
                <span className="text-gray-300 ml-auto">{cat.count}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-20">
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/community" className="hover:text-gray-600">Community</Link>
            <span>/</span>
            {postCat && (
              <>
                <Link href={`/community?category=${post.community_category}`} className="hover:text-gray-600">{postCat.label}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-600 truncate max-w-[200px]">{post.title}</span>
          </div>

          {/* Post Card */}
          <div className="bg-white border rounded-xl mb-4 overflow-hidden">
            {/* Post Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar email={post.author_email || ''} className="w-9 h-9" />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{displayName(post.author_email || '')}</div>
                    <div className="text-xs text-gray-400">
                      {timeAgo(post.created_at)}
                      {post.updated_at && post.updated_at !== post.created_at ? ' · edited' : ''}
                    </div>
                  </div>
                </div>
                {isPostOwner && !editingPost && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingPost(true); setEditTitle(post.title); setEditContent(post.content); setEditStatus(post.status); }}
                      className="text-xs px-3 py-1.5 border rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {postCat && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">{postCat.icon} {postCat.label}</span>
                )}
                <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ color: typeConfig.color, background: typeConfig.bg }}>
                  {typeConfig.label}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ color: statusConfig.color, background: statusConfig.bg }}>
                  {statusConfig.label}
                </span>
                {featureName && <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-600">{featureName}</span>}
              </div>

              {/* Title + Content (edit mode or view mode) */}
              {editingPost ? (
                <div className="space-y-3">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-semibold focus:outline-none focus:border-[#F59E0B]"
                    placeholder="Title"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#F59E0B] resize-y"
                    placeholder="Content"
                  />
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePost}
                      disabled={savingPost || editTitle.trim().length < 3 || editContent.trim().length < 20}
                      className="bg-[#F59E0B] text-[#02122c] px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 disabled:opacity-50"
                    >
                      {savingPost ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditingPost(false)}
                      className="px-4 py-2 border rounded-lg text-sm text-gray-500 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-gray-900 mb-4">{post.title}</h1>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</div>
                </>
              )}
            </div>

            {/* Post Footer */}
            <div className="px-6 py-3 border-t bg-gray-50 flex items-center gap-4">
              <button
                onClick={handleUpvote}
                disabled={!session}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                  upvoted ? 'border-[#F59E0B] bg-amber-50 text-[#d97706]' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                } ${!session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>{upvoted ? '▲' : '△'}</span>
                <span>{upvoteCount} votes</span>
              </button>
              <span className="text-sm text-gray-400">💬 {comments.length} {comments.length === 1 ? 'reply' : 'replies'}</span>
              {!session && (
                <Link href="/auth/signup" className="ml-auto text-xs text-[#F59E0B] font-bold hover:underline">
                  Sign up to vote &amp; comment →
                </Link>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              {comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}
            </h2>

            {comments.length === 0 ? (
              <div className="bg-white border rounded-xl p-8 text-center">
                <p className="text-gray-400 text-sm">No replies yet. Be the first to respond.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => {
                  const isCommentOwner = session?.user?.id === comment.user_id;
                  const isEditing = editingCommentId === comment.id;

                  return (
                    <div
                      key={comment.id}
                      className={`border rounded-xl p-4 ${comment.is_official ? 'border-green-200 bg-green-50' : 'bg-white'}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar email={comment.author_email || ''} className="w-7 h-7" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800">{displayName(comment.author_email || '')}</span>
                              {comment.is_official && (
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">Official</span>
                              )}
                              <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
                            </div>
                            {isCommentOwner && !isEditing && (
                              <button
                                onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); }}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-2 mt-2">
                              <textarea
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#F59E0B] resize-y"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveComment(comment.id)}
                                  disabled={savingComment || editCommentText.trim().length < 2}
                                  className="bg-[#F59E0B] text-[#02122c] px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-amber-400 disabled:opacity-50"
                                >
                                  {savingComment ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-3 py-1.5 border rounded-lg text-xs text-gray-500 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{comment.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comment Form */}
          {session ? (
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar email={session.user.email || ''} className="w-7 h-7" />
                <span className="text-sm font-semibold text-gray-700">{displayName(session.user.email || '')}</span>
              </div>
              <form onSubmit={handleComment}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#F59E0B] resize-y mb-3"
                />
                <button
                  type="submit"
                  disabled={submitting || commentText.trim().length < 2}
                  className="bg-[#F59E0B] text-[#02122c] px-5 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
              </form>
            </div>
          ) : (
            <div className="border rounded-xl p-5 bg-gray-50 text-center">
              <p className="text-gray-500 text-sm mb-3">Join the conversation</p>
              <Link href="/auth/signup" className="bg-[#F59E0B] text-[#02122c] px-5 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 inline-block">
                Sign Up Free
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
