"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_RECENT = "potal_recent_search_terms";
const STORAGE_INTERESTS = "potal_interested_categories";
const MAX_RECENT = 30;
const MAX_INTEREST_ENTRIES = 100;

/** 검색어 → 관심 카테고리 추론 (가중치 부여용) */
function inferCategoriesFromQuery(query: string): string[] {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  const out: string[] = [];
  const terms: { keys: string[]; category: string }[] = [
    { keys: ["audio", "headphone", "earbud", "sony", "bose", "airpod", "speaker"], category: "Audio" },
    { keys: ["lego", "toy", "game", "razor", "crest"], category: "Toys" },
    { keys: ["ipad", "laptop", "macbook", "phone", "samsung", "galaxy", "electronics"], category: "Electronics" },
    { keys: ["camping", "tent", "sleeping", "outdoor", "naturehike", "coleman"], category: "Outdoor" },
    { keys: ["gaming", "keyboard", "mouse", "monitor", "gpu", "rtx", "deathadder", "keychron"], category: "Gaming" },
    { keys: ["fashion", "nike", "adidas", "shoes", "dress", "jacket", "hoodie"], category: "Fashion" },
    { keys: ["home", "kitchen", "lamp", "desk", "wayfair"], category: "Home" },
    { keys: ["beauty", "skin", "cosmetic"], category: "Beauty" },
  ];
  for (const { keys, category } of terms) {
    if (keys.some((k) => q.includes(k))) out.push(category);
  }
  if (out.length === 0) out.push("General");
  return out;
}

export interface UserPreferenceContextValue {
  recentSearchTerms: string[];
  interestedCategories: Record<string, number>;
  addRecentSearch: (term: string) => void;
  addInterestFromQuery: (query: string) => void;
  addInterestFromProduct: (product: { keywords?: string[]; name?: string }) => void;
}

const UserPreferenceContext = createContext<UserPreferenceContextValue | undefined>(undefined);

export function UserPreferenceProvider({ children }: { children: ReactNode }) {
  const [recentSearchTerms, setRecentSearchTerms] = useState<string[]>([]);
  const [interestedCategories, setInterestedCategories] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(STORAGE_RECENT);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentSearchTerms(parsed.slice(0, MAX_RECENT));
      }
      const rawCat = window.localStorage.getItem(STORAGE_INTERESTS);
      if (rawCat) {
        const parsed = JSON.parse(rawCat);
        if (parsed && typeof parsed === "object") setInterestedCategories(parsed);
      }
    } catch (e) {
      console.error("UserPreference: load failed", e);
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_RECENT, JSON.stringify(recentSearchTerms));
      }
    } catch (e) {
      console.error("UserPreference: save recent failed", e);
    }
  }, [recentSearchTerms]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const entries = Object.entries(interestedCategories);
        const trimmed = entries.slice(0, MAX_INTEREST_ENTRIES);
        window.localStorage.setItem(STORAGE_INTERESTS, JSON.stringify(Object.fromEntries(trimmed)));
      }
    } catch (e) {
      console.error("UserPreference: save interests failed", e);
    }
  }, [interestedCategories]);

  const addRecentSearch = useCallback((term: string) => {
    const t = (term || "").trim();
    if (!t) return;
    setRecentSearchTerms((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, MAX_RECENT);
      return next;
    });
  }, []);

  const addInterestFromQuery = useCallback((query: string) => {
    const categories = inferCategoriesFromQuery(query);
    if (categories.length === 0) return;
    setInterestedCategories((prev) => {
      const next = { ...prev };
      for (const cat of categories) {
        next[cat] = (next[cat] ?? 0) + 1;
      }
      return next;
    });
  }, []);

  const addInterestFromProduct = useCallback((product: { keywords?: string[]; name?: string }) => {
    const keywords = product.keywords ?? [];
    const name = (product.name || "").trim();
    const toAdd = [...keywords];
    if (toAdd.length === 0 && name) {
      const inferred = inferCategoriesFromQuery(name);
      toAdd.push(...inferred);
    }
    if (toAdd.length === 0) return;
    setInterestedCategories((prev) => {
      const next = { ...prev };
      for (const k of toAdd) {
        const key = (k || "").trim();
        if (key) next[key] = (next[key] ?? 0) + 2;
      }
      return next;
    });
  }, []);

  const value: UserPreferenceContextValue = {
    recentSearchTerms,
    interestedCategories,
    addRecentSearch,
    addInterestFromQuery,
    addInterestFromProduct,
  };

  return (
    <UserPreferenceContext.Provider value={value}>
      {children}
    </UserPreferenceContext.Provider>
  );
}

export function useUserPreference(): UserPreferenceContextValue {
  const ctx = useContext(UserPreferenceContext);
  if (!ctx) {
    throw new Error("useUserPreference must be used within UserPreferenceProvider");
  }
  return ctx;
}
