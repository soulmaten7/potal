"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { filterSuggestions, MOCK_SUGGESTIONS } from "@/app/lib/suggestions";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  setQuery: (q: string) => void;
  onSearch: (q: string) => void;
  recentSearches: string[];
  onRemoveItem: (term: string) => void;
  onClearAll: () => void;
  /** 2자 이상 입력 시 표시할 연관 검색어 (PC와 동일 Mock 필터 결과). 미전달 시 내부 MOCK_SUGGESTIONS 필터 사용 */
  suggestions?: string[];
  /** 연관 검색어 클릭 시: 검색 실행 후 오버레이 닫기 */
  onSuggestionSelect?: (term: string) => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  query,
  setQuery,
  onSearch,
  recentSearches,
  onRemoveItem,
  onClearAll,
  suggestions: suggestionsFromParent,
  onSuggestionSelect,
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  /** PC와 동일한 Mock 필터: 2자 이상 입력 시 MOCK_SUGGESTIONS에서 includes 필터 */
  const displaySuggestions = useMemo(() => {
    const input = query.trim();
    if (input.length < 2) return [];
    return filterSuggestions(input, MOCK_SUGGESTIONS);
  }, [query]);

  const suggestions = suggestionsFromParent != null && suggestionsFromParent.length > 0 ? suggestionsFromParent : displaySuggestions;
  const showSuggestions = query.trim().length >= 2 && suggestions.length > 0;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed);
      onClose();
    }
  };

  const handleRecentClick = (term: string) => {
    onSearch(term);
    onClose();
  };

  const handleSuggestionClick = (term: string) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(term);
    } else {
      onSearch(term);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10002] flex flex-col bg-white lg:hidden"
      aria-modal="true"
      role="dialog"
      aria-label="Search"
    >
      {/* 헤더: 뒤로가기 + 입력창(내부 X) */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          aria-label="Back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <form onSubmit={handleSubmit} className="flex-1 min-w-0">
          <div className="relative w-full h-11 bg-slate-100 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 focus-within:ring-offset-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="h-full w-full pl-3 pr-10 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none bg-transparent border-0"
              aria-label="Search"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
                aria-label="Clear input"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </header>

      {/* 연관 검색어: 2자 이상 입력 시 입력창 바로 아래 */}
      {showSuggestions && (
        <div className="shrink-0 w-full bg-white border-b border-slate-200 px-3 py-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Suggestions</p>
          <ul className="space-y-0 max-h-48 overflow-y-auto overscroll-contain">
            {suggestions.map((term, idx) => (
              <li key={`${term}-${idx}`}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(term)}
                  className="w-full text-left px-3 py-2.5 text-sm text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 rounded-lg transition-colors"
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 바디: 최근 검색어 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        <h3 className="text-sm font-bold text-slate-800 mb-2">Recent searches</h3>
        {recentSearches.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No recent searches.</p>
        ) : (
          <>
            <ul className="space-y-0">
              {recentSearches.map((term) => (
                <li key={term} className="flex items-center justify-between gap-2 py-2.5 border-b border-slate-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => handleRecentClick(term)}
                    className="flex-1 min-w-0 text-left text-sm text-slate-800 truncate hover:text-indigo-600 active:bg-slate-50 -mx-2 px-2 py-1 rounded"
                  >
                    {term}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(term);
                    }}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    aria-label={`Remove ${term}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onClearAll}
              className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-700 underline"
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}
