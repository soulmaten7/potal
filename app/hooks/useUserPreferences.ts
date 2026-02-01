"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_RECENT = "potal_recent_search_terms";
const STORAGE_CATEGORIES = "potal_interested_categories";
const MAX_RECENT = 30;
const MAX_CATEGORIES = 100;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_RECENT);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function loadInterestedCategories(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_CATEGORIES);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<string, number>;
    return {};
  } catch {
    return {};
  }
}

export interface UseUserPreferencesReturn {
  /** 최근 검색어 목록 (최신 순) */
  recentSearches: string[];
  /** 관심 카테고리 → 조회/선택 횟수 */
  interestedCategories: Record<string, number>;
  /** 검색어 추가 (검색 시 호출) */
  addSearchTerm: (term: string) => void;
  /** 관심 카테고리 추가 (상품/카테고리 클릭 시 호출) */
  addCategory: (category: string) => void;
}

/**
 * 사용자 선호도 훅: 최근 검색어·관심 카테고리를 로컬 스토리지에 저장/불러오기.
 * 홈 화면·검색 로직에서 공통으로 사용.
 */
export function useUserPreferences(): UseUserPreferencesReturn {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [interestedCategories, setInterestedCategories] = useState<Record<string, number>>({});

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
    setInterestedCategories(loadInterestedCategories());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_RECENT, JSON.stringify(recentSearches));
    } catch (e) {
      console.error("useUserPreferences: save recentSearches failed", e);
    }
  }, [recentSearches]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const entries = Object.entries(interestedCategories);
      const trimmed = entries.slice(0, MAX_CATEGORIES);
      window.localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(Object.fromEntries(trimmed)));
    } catch (e) {
      console.error("useUserPreferences: save interestedCategories failed", e);
    }
  }, [interestedCategories]);

  const addSearchTerm = useCallback((term: string) => {
    const t = (term || "").trim();
    if (!t) return;
    setRecentSearches((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, MAX_RECENT);
      return next;
    });
  }, []);

  const addCategory = useCallback((category: string) => {
    const c = (category || "").trim();
    if (!c) return;
    setInterestedCategories((prev) => {
      const next = { ...prev };
      next[c] = (next[c] ?? 0) + 1;
      return next;
    });
  }, []);

  return {
    recentSearches,
    interestedCategories,
    addSearchTerm,
    addCategory,
  };
}
