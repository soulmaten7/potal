'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { FEATURES } from '@/app/features/features-data';

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

interface Comment {
  id: string;
  content: string;
  is_official: boolean;
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

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const { session } = useSupabase();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);

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
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setUpvoted(json.data.upvoted);
        setUpvoteCount(json.data.upvote_count);
      }
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
        setComments([...comments, json.data.comment]);
        setCommentText('');
      }
    } catch { /* silent */ }
    setSubmitting(false);
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">Loading...</div>;
  if (!post) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
      <Link href="/community" className="text-[#F59E0B] font-bold hover:underline">Back to Community</Link>
    </div>
  );

  const typeConfig = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.question;
  const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.open;
  const featureName = post.feature_slug ? (FEATURES.find(f => f.id === post.feature_slug)?.name || post.feature_slug) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/community" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        &larr; Back to Community
      </Link>

      {/* Post */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ color: typeConfig.color, background: typeConfig.bg }}>
            {typeConfig.label}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ color: statusConfig.color, background: statusConfig.bg }}>
            {statusConfig.label}
          </span>
          {featureName && (
            <span className="text-xs px-2.5 py-1 rounded bg-gray-100 text-gray-600">{featureName}</span>
          )}
          {post.feature_category && (
            <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-600">{post.feature_category}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h1>
        <p className="text-xs text-gray-400 mb-6">{timeAgo(post.created_at)}</p>

        {/* Content */}
        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-6">
          {post.content}
        </div>

        {/* Upvote button */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <button
            onClick={handleUpvote}
            disabled={!session}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
              upvoted ? 'border-[#F59E0B] bg-amber-50 text-[#d97706]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            } ${!session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span>{upvoted ? '\u25b2' : '\u25b3'}</span>
            <span>{upvoteCount}</span>
          </button>
          <span className="text-sm text-gray-400">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-bold text-gray-900">Comments</h2>

        {comments.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">No comments yet. Be the first to reply.</p>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              className={`border rounded-xl p-4 ${comment.is_official ? 'border-green-200 bg-green-50' : 'bg-white'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {comment.is_official && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">Official</span>
                )}
                <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Comment form */}
      {session ? (
        <form onSubmit={handleComment} className="border rounded-xl p-4 bg-white">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#F59E0B] resize-y mb-3"
          />
          <button
            type="submit"
            disabled={submitting || commentText.trim().length < 2}
            className="bg-[#F59E0B] text-[#02122c] px-5 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="border rounded-xl p-4 bg-gray-50 text-center">
          <p className="text-gray-500 text-sm mb-2">Sign in to comment.</p>
          <Link href="/auth/signup" className="text-[#F59E0B] font-bold text-sm hover:underline">Sign Up Free</Link>
        </div>
      )}
    </div>
  );
}
