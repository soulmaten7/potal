'use client';

/**
 * MySavedCombos — CW26 Sprint 4
 *
 * CUSTOM 빌더 하단: "내 조합" 리스트 + 추천 템플릿.
 * 비로그인 → 안내 1줄. 로그인+0개 → 추천 카드. 로그인+1+ → 리스트.
 * 데이터: /api/combos GET. SWR/react-query 도입 금지 — useState+fetch.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/app/context/SupabaseProvider';
import ComboListItem, { type ComboListItemData } from './ComboListItem';
import RecommendedTemplates from './RecommendedTemplates';

type SortOption = 'recent' | 'popular' | 'name' | 'favorite';

interface MySavedCombosProps {
  onLoadCombo: (features: string[]) => void;
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-[#02122c] text-white rounded-lg px-4 py-2 text-[13px] font-semibold shadow-lg">
      {message}
    </div>
  );
}

export default function MySavedCombos({ onLoadCombo }: MySavedCombosProps) {
  const { session } = useSupabase();
  const [combos, setCombos] = useState<ComboListItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortOption>('recent');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState('');

  const isLoggedIn = !!session?.access_token;

  const fetchCombos = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (search) params.set('q', search);
      const res = await fetch(`/api/combos?${params}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCombos(json.data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [isLoggedIn, session, sort, search]);

  useEffect(() => { fetchCombos(); }, [fetchCombos]);

  const handleToggleFavorite = async (id: string, current: boolean) => {
    if (!session?.access_token) return;
    setCombos(prev => prev.map(c => c.id === id ? { ...c, is_favorite: !current } : c));
    await fetch('/api/combos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, is_favorite: !current }),
    });
  };

  const handleShare = async (id: string) => {
    if (!session?.access_token) return;
    const res = await fetch(`/api/combos/${id}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (json.success && json.data?.share_url) {
      try { await navigator.clipboard.writeText(json.data.share_url); } catch { /* */ }
      setToast('Share link copied!');
      fetchCombos();
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!session?.access_token) return;
    await fetch(`/api/combos/${id}/duplicate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setToast('Combo duplicated');
    fetchCombos();
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    await fetch('/api/combos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id }),
    });
    setCombos(prev => prev.filter(c => c.id !== id));
    setToast('Combo deleted');
  };

  const handleRename = async (id: string, newName: string) => {
    if (!session?.access_token) return;
    await fetch('/api/combos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, name: newName }),
    });
    setCombos(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="mt-12">
        <RecommendedTemplates mode="empty" onLoad={onLoadCombo} />
        <div className="mt-4 text-center text-[12px] text-slate-400">
          Log in to save and manage your feature combos.
        </div>
      </div>
    );
  }

  // Logged in — empty state
  if (!loading && combos.length === 0) {
    return (
      <div className="mt-12">
        <RecommendedTemplates mode="empty" onLoad={onLoadCombo} />
        {toast && <Toast message={toast} onDone={() => setToast('')} />}
      </div>
    );
  }

  // Logged in — active state
  const displayed = showAll ? combos : combos.slice(0, 5);
  const remaining = combos.length - 5;

  return (
    <div className="mt-12">
      <RecommendedTemplates mode="active" onLoad={onLoadCombo} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[16px]" aria-hidden="true">📚</span>
          <h3 className="text-[15px] font-extrabold text-[#02122c]">My Saved Combinations</h3>
          <span className="text-[11px] text-slate-400 font-semibold">{combos.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search combos..."
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-[#F59E0B]"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none"
        >
          <option value="recent">Recent</option>
          <option value="popular">Most used</option>
          <option value="name">A-Z</option>
          <option value="favorite">Favorites</option>
        </select>
      </div>

      {loading ? (
        <div className="py-8 text-center text-[13px] text-slate-400">Loading...</div>
      ) : (
        <div>
          {displayed.map(c => (
            <ComboListItem
              key={c.id}
              combo={c}
              onLoad={onLoadCombo}
              onToggleFavorite={handleToggleFavorite}
              onShare={handleShare}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
          {!showAll && remaining > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full py-3 text-center text-[12px] font-bold text-slate-500 hover:text-[#02122c] transition-colors"
            >
              + Show {remaining} more
            </button>
          )}
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}
