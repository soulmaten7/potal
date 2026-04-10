'use client';

/**
 * ComboListItem — CW26 Sprint 4
 *
 * 1줄 리스트 아이템. 스펙 359~368행.
 * ⭐즐겨찾기 / 이름(클릭→로드) / 기능요약 / 상대시간 / 사용횟수 / 액션버튼.
 * 상대시간: 외부 라이브러리 없이 수동 구현.
 */

import { useState } from 'react';

export interface ComboListItemData {
  id: string;
  name: string;
  selected_features: string[];
  is_favorite: boolean;
  use_count: number;
  share_slug: string | null;
  is_public: boolean;
  updated_at: string;
}

interface ComboListItemProps {
  combo: ComboListItemData;
  onLoad: (features: string[]) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onShare: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

function featureSummary(slugs: string[]): string {
  const short = slugs.slice(0, 3).map(s => {
    const parts = s.split('-');
    return parts.length > 2
      ? parts.slice(0, 2).map(p => p[0].toUpperCase() + p.slice(1)).join(' ')
      : parts.map(p => p[0].toUpperCase() + p.slice(1)).join(' ');
  });
  const extra = slugs.length > 3 ? ` +${slugs.length - 3}` : '';
  return short.join(' + ') + extra;
}

export default function ComboListItem({
  combo,
  onLoad,
  onToggleFavorite,
  onShare,
  onDuplicate,
  onDelete,
  onRename,
}: ComboListItemProps) {
  const [showMore, setShowMore] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(combo.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue.trim() !== combo.name) {
      onRename(combo.id, renameValue.trim());
    }
    setRenaming(false);
  };

  return (
    <div className="py-3 border-b border-slate-100 group">
      <div className="flex items-center gap-3">
        {/* Favorite star */}
        <button
          type="button"
          onClick={() => onToggleFavorite(combo.id, combo.is_favorite)}
          aria-label={combo.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`flex-none text-[16px] transition-colors ${
            combo.is_favorite ? 'text-[#F59E0B]' : 'text-slate-300 hover:text-slate-500'
          }`}
        >
          {combo.is_favorite ? '★' : '☆'}
        </button>

        {/* Name + features summary (click to load) */}
        <button
          type="button"
          onClick={() => onLoad(combo.selected_features)}
          className="flex-1 min-w-0 text-left"
        >
          {renaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenaming(false); }}
              onClick={e => e.stopPropagation()}
              className="w-full px-2 py-0.5 rounded border border-[#F59E0B] text-[13px] font-bold text-[#02122c] focus:outline-none"
              autoFocus
            />
          ) : (
            <>
              <div className="text-[13px] font-bold text-[#02122c] truncate hover:text-[#F59E0B] transition-colors">
                {combo.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {featureSummary(combo.selected_features)}
              </div>
            </>
          )}
        </button>

        {/* Meta */}
        <div className="flex-none text-right hidden sm:block">
          <div className="text-[11px] text-slate-400">{relativeTime(combo.updated_at)}</div>
          <div className="text-[11px] text-slate-400">{combo.use_count}x used</div>
        </div>

        {/* Action buttons */}
        <div className="flex-none flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onShare(combo.id)} className="px-2 py-1 rounded text-[11px] font-semibold text-slate-500 hover:text-[#02122c] hover:bg-slate-100" title="Share">
            Share
          </button>
          <button type="button" onClick={() => onDuplicate(combo.id)} className="px-2 py-1 rounded text-[11px] font-semibold text-slate-500 hover:text-[#02122c] hover:bg-slate-100" title="Duplicate">
            Copy
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="px-2 py-1 rounded text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            Del
          </button>
          <div className="relative">
            <button type="button" onClick={() => setShowMore(v => !v)} className="px-1.5 py-1 rounded text-[11px] text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="More">
              ···
            </button>
            {showMore && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-50 text-[12px] overflow-hidden">
                <button type="button" onClick={() => { setRenaming(true); setShowMore(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50">Rename</button>
                <button type="button" onClick={() => {
                  const blob = new Blob([JSON.stringify({ name: combo.name, features: combo.selected_features }, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `${combo.name.replace(/\s+/g, '-').toLowerCase()}.json`; a.click();
                  URL.revokeObjectURL(url);
                  setShowMore(false);
                }} className="w-full text-left px-3 py-2 hover:bg-slate-50">Export JSON</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mt-2 flex items-center gap-3 px-8 py-2 bg-red-50 rounded-lg text-[12px]">
          <span className="text-red-700">Delete &ldquo;{combo.name}&rdquo;?</span>
          <button type="button" onClick={() => { onDelete(combo.id); setConfirmDelete(false); }} className="px-3 py-1 rounded bg-red-600 text-white font-bold text-[11px]">Delete</button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-600 font-bold text-[11px]">Cancel</button>
        </div>
      )}
    </div>
  );
}
