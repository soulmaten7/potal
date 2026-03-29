'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { FEATURES, CATEGORIES, type FeatureCategory, CATEGORY_ICONS } from '@/app/features/features-data';
import { USER_CATEGORIES } from '../community-categories';

const POST_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: '\ud83d\udc1b', desc: 'Something is broken or not working as expected' },
  { value: 'question', label: 'Question', icon: '\u2753', desc: 'Ask about a feature, API, or setup' },
  { value: 'suggestion', label: 'Suggestion', icon: '\ud83d\udca1', desc: 'Propose a new feature or improvement' },
] as const;

export default function NewPostPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">Loading...</div>}>
      <NewPostForm />
    </Suspense>
  );
}

function NewPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSupabase();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communityCategory, setCommunityCategory] = useState(searchParams.get('category') || 'general');
  const [postType, setPostType] = useState(searchParams.get('type') || '');
  const [featureSlug, setFeatureSlug] = useState(searchParams.get('feature') || '');
  const [featureCategory, setFeatureCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-set category when feature is selected
  useEffect(() => {
    if (featureSlug) {
      const feature = FEATURES.find(f => f.id === featureSlug);
      if (feature) setFeatureCategory(feature.category);
    }
  }, [featureSlug]);

  // Redirect to login if not authenticated
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to post</h1>
        <p className="text-gray-500 mb-6">You need to be signed in to create a community post.</p>
        <Link href="/auth/signup" className="bg-[#F59E0B] text-[#02122c] px-6 py-3 rounded-lg font-bold">
          Sign Up Free
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim() || title.trim().length < 3) { setError('Title must be at least 3 characters.'); return; }
    if (!content.trim() || content.trim().length < 20) { setError('Content must be at least 20 characters.'); return; }
    if (!postType) { setError('Please select a post type.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          post_type: postType,
          community_category: communityCategory,
          feature_slug: featureSlug || null,
          feature_category: featureCategory || null,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to create post.');
        setLoading(false);
        return;
      }

      router.push(`/community/${json.data.post.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/community" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        &larr; Back to Community
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Community Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
          <select
            value={communityCategory}
            onChange={(e) => setCommunityCategory(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-xl text-sm bg-white focus:outline-none focus:border-[#F59E0B]"
          >
            {USER_CATEGORIES.map(cat => (
              <option key={cat.slug} value={cat.slug}>{cat.icon} {cat.label}</option>
            ))}
          </select>
        </div>

        {/* Post Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Type *</label>
          <div className="grid grid-cols-3 gap-3">
            {POST_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setPostType(t.value)}
                className={`p-4 border-2 rounded-xl text-center transition-all ${
                  postType === t.value ? 'border-[#F59E0B] bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{t.icon}</div>
                <div className="text-sm font-semibold text-gray-800">{t.label}</div>
                <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your post"
            maxLength={200}
            className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-[#F59E0B]"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">{title.length}/200</div>
        </div>

        {/* Feature Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Related Feature (optional)</label>
          <select
            value={featureSlug}
            onChange={(e) => setFeatureSlug(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-xl text-sm bg-white focus:outline-none focus:border-[#F59E0B]"
          >
            <option value="">None / General</option>
            {CATEGORIES.filter(c => c.key !== 'All').map(cat => (
              <optgroup key={cat.key} label={`${CATEGORY_ICONS[cat.key as FeatureCategory] || ''} ${cat.label}`}>
                {FEATURES.filter(f => f.category === cat.key).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={postType === 'bug'
              ? 'What happened? What did you expect? Steps to reproduce?'
              : postType === 'suggestion'
                ? 'Describe your idea. Why would it be useful?'
                : 'What would you like to know?'
            }
            rows={8}
            className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-[#F59E0B] resize-y"
          />
          <div className="text-xs text-gray-400 mt-1">{content.length < 20 ? `${20 - content.length} more characters needed` : 'Ready'}</div>
        </div>

        {/* Attachments placeholder */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments (optional)</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
            Image upload coming soon. For now, paste screenshot URLs in the content.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#F59E0B] text-[#02122c] px-8 py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Submit Post'}
          </button>
          <Link
            href="/community"
            className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
