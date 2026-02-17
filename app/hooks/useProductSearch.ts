"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useSupabase } from '../context/SupabaseProvider';
import { useUserPreferences } from './useUserPreferences';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../types/product';
import { extractFilterOptionsFromProducts, type FilterOptions } from '../lib/filter-utils';

/** 홈 초기 진입 시 1회 자동 검색 키워드 */
export const HOME_INIT_SEARCH_KEYWORD = 'Trending Tech';

/** 검색어 → 관심 카테고리 추론 (addCategory용). 훅/페이지 공용 */
export function inferCategoriesFromQuery(query: string): string[] {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const out: string[] = [];
  const terms: { keys: string[]; category: string }[] = [
    { keys: ['audio', 'headphone', 'earbud', 'sony', 'bose', 'airpod', 'speaker'], category: 'Audio' },
    { keys: ['lego', 'toy', 'game', 'razor', 'crest'], category: 'Toys' },
    { keys: ['ipad', 'laptop', 'macbook', 'phone', 'samsung', 'galaxy', 'electronics'], category: 'Electronics' },
    { keys: ['camping', 'tent', 'sleeping', 'outdoor', 'naturehike', 'coleman'], category: 'Outdoor' },
    { keys: ['gaming', 'keyboard', 'mouse', 'monitor', 'gpu', 'rtx', 'deathadder', 'keychron'], category: 'Gaming' },
    { keys: ['fashion', 'nike', 'adidas', 'shoes', 'dress', 'jacket', 'hoodie'], category: 'Fashion' },
    { keys: ['home', 'kitchen', 'lamp', 'desk', 'wayfair'], category: 'Home' },
    { keys: ['beauty', 'skin', 'cosmetic'], category: 'Beauty' },
  ];
  for (const { keys, category } of terms) {
    if (keys.some((k) => q.includes(k))) out.push(category);
  }
  if (out.length === 0) out.push('General');
  return out;
}

/** Tab summary from ScoringEngine */
interface TabSummaryData {
  best: { price: string; days: string } | null;
  cheapest: { price: string; days: string } | null;
  fastest: { price: string; days: string } | null;
}

interface SearchResponse {
  results: Product[];
  total: number;
  metadata?: {
    domesticCount: number;
    internationalCount: number;
    tabSummary?: TabSummaryData;
    fraudStats?: {
      removed: number;
      flagged: number;
      removeReasons: Record<string, number>;
    };
  };
  personalization?: { greeting?: string; message?: string } | null;
  /** 서버 에러 메시지 (timeout 등) */
  error?: string;
  errorType?: 'timeout' | 'unknown';
}

const STORAGE_KEY = 'potal_search_state';
const SESSION_SCROLL_KEY = 'potal_session_scroll_y';
const MAX_FREE_SEARCHES = 5;
const FREE_SEARCH_KEY = 'potal_free_search_count';
const LAST_SEARCH_DATE_KEY = 'potal_free_search_date';
const RECENT_SEARCHES_KEY_USER = 'potal_recent_searches_user';
const RECENT_SEARCHES_KEY_GUEST = 'potal_recent_searches_guest';

function getRecentSearchesKey(hasSession: boolean): string {
  return hasSession ? RECENT_SEARCHES_KEY_USER : RECENT_SEARCHES_KEY_GUEST;
}

const GUEST_FALLBACK_KEYWORDS = ['Trending Tech', 'Global Best'] as const;

export type MainCategory = string | null;

export function useProductSearch() {
  const { supabase, session } = useSupabase();
  const { addSearchTerm, addCategory } = useUserPreferences();
  const { clearWishlist } = useWishlist();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isMountedRef = useRef(true);

  const [query, setQuery] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [market, setMarket] = useState<'all' | 'domestic' | 'global'>('all');
  const [domestic, setDomestic] = useState<Product[]>([]);
  const [international, setInternational] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [hasMorePages, setHasMorePages] = useState(true);
  const [metadata, setMetadata] = useState<{ domesticCount: number; internationalCount: number } | null>(null);
  const [tabSummary, setTabSummary] = useState<TabSummaryData | null>(null);
  const [personalization, setPersonalization] = useState<{ greeting?: string; message?: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(16);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isHomeMode, setIsHomeMode] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [homeSearchKeyword, setHomeSearchKeyword] = useState<string>('');
  const [homeProfile, setHomeProfile] = useState<{ nickname?: string; interest_keywords?: string[] } | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [recentSearchesEnabled, setRecentSearchesEnabled] = useState(true);
  const [aiFilterOptions, setAiFilterOptions] = useState<FilterOptions>({});
  const [selectedAiFilters, setSelectedAiFilters] = useState<Set<string>>(new Set());
  const [aiFiltersLoading, setAiFiltersLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'delivery'>('relevance');
  const [priceRange, setPriceRange] = useState(1000);

  const prevAuthIdRef = useRef<string | null | undefined>(undefined);
  const prevQRef = useRef<string | null>(null);
  /** URL q와 동기화된 마지막 값. 타이핑 중에는 URL→query 덮어쓰기 방지 */
  const lastSyncedParamRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const saveToRecentSearches = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;
      const key = getRecentSearchesKey(!!session);
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== searchQuery.toLowerCase());
        const updated = [searchQuery, ...filtered].slice(0, 10);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(updated));
        }
        return updated;
      });
    },
    [session],
  );

  const getFallbackKeyword = useCallback((): string => {
    if (session && homeProfile?.interest_keywords?.length) {
      const kw = homeProfile.interest_keywords;
      return kw[Math.floor(Math.random() * kw.length)];
    }
    if (session) return 'Best Sellers';
    return GUEST_FALLBACK_KEYWORDS[Math.floor(Math.random() * GUEST_FALLBACK_KEYWORDS.length)];
  }, [session, homeProfile?.interest_keywords]);

  const getInitQuery = useCallback((): string => {
    const kw = homeProfile?.interest_keywords;
    if (session && kw?.length) return kw[Math.floor(Math.random() * kw.length)];
    return HOME_INIT_SEARCH_KEYWORD;
  }, [session, homeProfile?.interest_keywords]);

  const executeSearch = useCallback(
    async (
      searchQuery: string,
      _mainCat: MainCategory | null,
      _subCat: string | null,
      overrideQuery?: string,
    ) => {
      const effectiveQuery =
        overrideQuery != null && overrideQuery !== '' ? overrideQuery : searchQuery.trim();
      if (!effectiveQuery) return;

      const isSilent = overrideQuery != null && overrideQuery !== '';
      if (!session && searchCount >= MAX_FREE_SEARCHES) {
        setShowLimitModal(true);
        return;
      }

      setDomestic([]);
      setInternational([]);
      setLoading(true);
      setSearchError(null);
      if (!isSilent) {
        setSearched(true);
        setIsHomeMode(false);
      }
      setIsFallbackMode(false);

      if (!isSilent) {
        saveToRecentSearches(effectiveQuery);
        addSearchTerm(effectiveQuery);
        inferCategoriesFromQuery(effectiveQuery).forEach((c) => addCategory(c));
      }
      setShowRecentDropdown(false);

      setVisibleCount(20);
      setSearchPage(1);
      setLastSearchQuery(effectiveQuery);
      setHasMorePages(true);

      const params = new URLSearchParams({
          q: effectiveQuery,
          page: '1',
        });
        if (zipcode.trim()) params.set('zipcode', zipcode.trim());
        if (market !== 'all') params.set('market', market);
        try {
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!isMountedRef.current || (typeof window !== 'undefined' && pathname !== '/')) {
          return;
        }
        const data: SearchResponse = await res.json();

        // 서버 에러 감지 (timeout 등)
        if (data.error) {
          setSearchError(data.error);
          console.warn(`⚠️ [Search] Server error: ${data.errorType} — ${data.error}`);
        }

        const rawResults = data.results || [];
        const allResults = rawResults.filter(
          (p: { is_sponsored?: boolean; is_ad?: boolean }) => !p.is_sponsored && !p.is_ad,
        );

        const domesticResults = allResults.filter((p: Product) => {
          if (p.category) return p.category === 'domestic';
          return (p.shipping || '').toLowerCase() === 'domestic';
        });
        const internationalResults = allResults.filter((p: Product) => {
          if (p.category) return p.category === 'international';
          return (p.shipping || '').toLowerCase() === 'international';
        });

        if (!isMountedRef.current || (typeof window !== 'undefined' && pathname !== '/')) return;

        setDomestic(domesticResults);
        setInternational(internationalResults);
        setVisibleCount(16);
        setMetadata(data.metadata || null);
        setTabSummary(data.metadata?.tabSummary || null);
        setPersonalization(data.personalization ?? null);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }

        setAiFiltersLoading(true);
        const allProducts = [...domesticResults, ...internationalResults];
        setAiFilterOptions(extractFilterOptionsFromProducts(allProducts));
        setSelectedAiFilters(new Set());
        setAiFiltersLoading(false);

        if (!isSilent && typeof window !== 'undefined') {
          router.replace(`/?q=${encodeURIComponent(effectiveQuery)}`, { scroll: false });
        }

        if (domesticResults.length === 0 && internationalResults.length === 0) {
          setIsFallbackMode(true);
          setLoading(true);
          const fallbackKeyword = getFallbackKeyword();
          try {
            const fallbackParams = new URLSearchParams({ q: fallbackKeyword, page: '1' });
            if (zipcode.trim()) fallbackParams.set('zipcode', zipcode.trim());
            if (market !== 'all') fallbackParams.set('market', market);
            const resF = await fetch(`/api/search?${fallbackParams.toString()}`);
            const dataF: SearchResponse = await resF.json();
            const rawF = (dataF.results || []).filter(
              (p: { is_sponsored?: boolean; is_ad?: boolean }) => !p.is_sponsored && !p.is_ad,
            );
            const domF = rawF.filter((p: Product) => {
              if (p.category) return p.category === 'domestic';
              return (p.shipping || '').toLowerCase() === 'domestic';
            });
            const intlF = rawF.filter((p: Product) => {
              if (p.category) return p.category === 'international';
              return (p.shipping || '').toLowerCase() === 'international';
            });
            if (isMountedRef.current && (typeof window === 'undefined' || pathname === '/')) {
              setDomestic(domF);
              setInternational(intlF);
              setMetadata(dataF.metadata || null);
              setTabSummary(dataF.metadata?.tabSummary || null);
              setPersonalization(dataF.personalization ?? null);
              setAiFilterOptions(extractFilterOptionsFromProducts([...domF, ...intlF]));
              setSelectedAiFilters(new Set());
              setVisibleCount(16);
            }
          } catch (e) {
            console.error('Fallback search failed', e);
          } finally {
            if (isMountedRef.current) setLoading(false);
          }
          return;
        }
      } catch (err) {
        console.error('Search failed', err);
        if (isMountedRef.current) {
          setDomestic([]);
          setInternational([]);
          setMetadata(null);
          setPersonalization(null);
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
        if (!session && isMountedRef.current) {
          try {
            const next = searchCount + 1;
            setSearchCount(next);
            if (typeof window !== 'undefined') {
              const today = new Date().toISOString().slice(0, 10);
              window.localStorage.setItem(FREE_SEARCH_KEY, String(next));
              window.localStorage.setItem(LAST_SEARCH_DATE_KEY, today);
            }
          } catch (e) {
            console.error('Failed to persist free search counter', e);
          }
        }
      }
    },
    [
      session,
      searchCount,
      addSearchTerm,
      addCategory,
      getFallbackKeyword,
      saveToRecentSearches,
      router,
      pathname,
      zipcode,
      market,
    ],
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(getRecentSearchesKey(!!session));
    }
  }, [session]);

  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== term);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getRecentSearchesKey(!!session), JSON.stringify(updated));
      }
      return updated;
    });
  }, [session]);

  const turnOffRecentSearches = useCallback(() => {
    setRecentSearchesEnabled(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('potal_recent_searches_enabled', JSON.stringify(false));
    }
  }, []);

  const turnOnRecentSearches = useCallback(() => {
    setRecentSearchesEnabled(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('potal_recent_searches_enabled', JSON.stringify(true));
    }
  }, []);

  const loadMoreResults = useCallback(async () => {
    if (loadingMore || !lastSearchQuery.trim()) return;
    setLoadingMore(true);
    try {
      const nextPage = searchPage + 1;
      const loadParams = new URLSearchParams({
        q: lastSearchQuery.trim(),
        page: String(nextPage),
      });
      if (zipcode.trim()) loadParams.set('zipcode', zipcode.trim());
      if (market !== 'all') loadParams.set('market', market);
      const res = await fetch(`/api/search?${loadParams.toString()}`);
      const data: SearchResponse = await res.json();
      const rawResults = data.results || [];
      const allResults = rawResults.filter(
        (p: Product) => !p.is_sponsored && !p.is_ad,
      );
      const newDomestic = allResults.filter((p: Product) => {
        if (p.category) return p.category === 'domestic';
        return (p.shipping || '').toLowerCase() === 'domestic';
      });
      const newInternational = allResults.filter((p: Product) => {
        if (p.category) return p.category === 'international';
        return (p.shipping || '').toLowerCase() === 'international';
      });
      setDomestic((prev) => [...prev, ...newDomestic]);
      setInternational((prev) => [...prev, ...newInternational]);
      setSearchPage(nextPage);
      if (newDomestic.length === 0 && newInternational.length === 0) setHasMorePages(false);
      setVisibleCount((prev) => prev + 16);
    } catch (err) {
      console.error('Load more failed', err);
      setHasMorePages(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, lastSearchQuery, searchPage, zipcode, market]);

  // URL 기반 모드 동기화. 타이핑 중에는 URL→query 덮어쓰지 않음 (Input Lock 방지).
  // URL의 q가 바뀐 경우에만(초기 로드·폼 제출·외부 네비) setQuery + 검색 실행.
  useEffect(() => {
    const paramQuery = searchParams.get('q');
    const isEmpty = paramQuery == null || String(paramQuery).trim() === '';
    if (isEmpty) {
      lastSyncedParamRef.current = null;
      const hasCachedResults = domestic.length > 0 || international.length > 0;
      const isExplicitHome = prevQRef.current != null && prevQRef.current !== '';
      const userIsTyping = query.trim() !== '';
      if (userIsTyping && !isExplicitHome) {
        prevQRef.current = paramQuery ?? '';
        return;
      }
      if (hasCachedResults && isExplicitHome) {
        setQuery(lastSearchQuery);
        setIsHomeMode(false);
        prevQRef.current = paramQuery ?? '';
        return;
      }
      if (!userIsTyping) setQuery('');
      setIsHomeMode(true);
      prevQRef.current = paramQuery ?? '';
      return;
    }
    const trimmed = String(paramQuery).trim();
    if (trimmed === lastSyncedParamRef.current) {
      return;
    }
    lastSyncedParamRef.current = trimmed;
    setQuery(trimmed);
    setIsHomeMode(false);
    prevQRef.current = paramQuery;
    executeSearch(trimmed, null, null);
  }, [searchParams, domestic.length, international.length, lastSearchQuery, executeSearch, getInitQuery]);

  // Fetch profile for home personalization
  useEffect(() => {
    if (!session?.user?.id || !supabase) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname, interest_keywords')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!error && data) {
          const interestKeywords = Array.isArray(data.interest_keywords)
            ? (data.interest_keywords as string[])
            : [];
          setHomeProfile({
            nickname: data.nickname ?? undefined,
            interest_keywords: interestKeywords.length ? interestKeywords : undefined,
          });
        } else {
          setHomeProfile(null);
        }
      } catch {
        setHomeProfile(null);
      }
    })();
  }, [session?.user?.id, supabase]);

  // 로그아웃 시 개인 데이터 즉시·완전 소거 (조건 없이 확실히 실행)
  useEffect(() => {
    if (session != null) return;
    clearWishlist();
    setHomeProfile(null);
    setDomestic([]);
    setInternational([]);
  }, [session, clearWishlist]);

  // 로그인/로그아웃 시 상태 초기화 + 모바일/PC 동기화: recentSearches 즉시 해당 사용자(또는 게스트) 저장소로 교체
  // Guard: Saved 등에서 Back 시 URL에 q가 있으면 초기화하지 않음 (검색 결과 유지)
  useEffect(() => {
    const currentAuthId = session?.user?.id ?? null;
    if (prevAuthIdRef.current !== currentAuthId) {
      const isAuthChange = prevAuthIdRef.current !== undefined;
      prevAuthIdRef.current = currentAuthId;
      if (isAuthChange) {
        const paramQ = searchParams.get('q');
        if (paramQ != null && String(paramQ).trim() !== '') {
          return;
        }
        setDomestic([]);
        setInternational([]);
        setMetadata(null);
        setPersonalization(null);
        setAiFilterOptions({});
        setSelectedAiFilters(new Set());
        setVisibleCount(16);
        setSearchPage(1);
        setHasMorePages(true);
        setHomeProfile(null);
        setHomeSearchKeyword(HOME_INIT_SEARCH_KEYWORD);
        setQuery('');
        setIsHomeMode(true);
        clearWishlist();
        if (typeof window !== 'undefined') {
          const key = getRecentSearchesKey(!!session);
          const stored = window.localStorage.getItem(key);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setRecentSearches(Array.isArray(parsed) ? parsed : []);
            } catch {
              setRecentSearches([]);
            }
          } else {
            setRecentSearches([]);
          }
        }
      }
    }
  }, [session?.user?.id, session, clearWishlist, searchParams]);

  // POTAL 2.0: 홈 초기 진입 시 추천 검색 비활성화(Zero Noise). q 없으면 Hero만 노출.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = searchParams.get('q');
    if (q != null && String(q).trim() !== '') return;

    setQuery('');
    setSearched(false);
    setLoading(false);
    // Init search 비활성화: 사용자가 "Scan Markets" 전까지 상품 리스트 노출 안 함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, homeProfile, searchParams]);

  // Session persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!searched) return;
    try {
      const payload = JSON.stringify({
        query,
        domestic,
        international,
        searched,
        metadata,
        personalization,
        sortBy,
        priceRange,
      });
      window.sessionStorage.setItem(STORAGE_KEY, payload);
    } catch (e) {
      console.error('Failed to persist session search state:', e);
    }
  }, [query, domestic, international, searched, metadata, personalization, sortBy, priceRange]);

  // Scroll position persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      try {
        window.sessionStorage.setItem(SESSION_SCROLL_KEY, String(window.scrollY));
      } catch {
        // ignore
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Recent searches load by auth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = getRecentSearchesKey(!!session);
    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRecentSearches([]);
      }
    } else {
      setRecentSearches([]);
    }
  }, [session]);

  // Daily free search counter init
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const storedDate = window.localStorage.getItem(LAST_SEARCH_DATE_KEY);
      const storedCount = window.localStorage.getItem(FREE_SEARCH_KEY);
      if (storedDate === today && storedCount !== null) {
        const parsed = Number(storedCount);
        setSearchCount(Number.isNaN(parsed) ? 0 : parsed);
      } else {
        window.localStorage.setItem(LAST_SEARCH_DATE_KEY, today);
        window.localStorage.setItem(FREE_SEARCH_KEY, '0');
        setSearchCount(0);
      }
    } catch {
      // ignore
    }
  }, []);

  // Load recent searches enabled from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const enabled = window.localStorage.getItem('potal_recent_searches_enabled');
    if (enabled !== null) {
      try {
        setRecentSearchesEnabled(JSON.parse(enabled));
      } catch {
        // ignore
      }
    }
  }, []);

  return {
    query,
    setQuery,
    domestic,
    international,
    loading,
    searched,
    searchError,
    metadata,
    tabSummary,
    personalization,
    visibleCount,
    setVisibleCount,
    loadingMore,
    isHomeMode,
    setIsHomeMode,
    isFallbackMode,
    homeSearchKeyword,
    homeProfile,
    searchCount,
    showLimitModal,
    setShowLimitModal,
    recentSearches,
    setRecentSearches,
    showRecentDropdown,
    setShowRecentDropdown,
    recentSearchesEnabled,
    setRecentSearchesEnabled,
    aiFilterOptions,
    selectedAiFilters,
    setSelectedAiFilters,
    aiFiltersLoading,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    hasMorePages,
    lastSearchQuery,
    executeSearch,
    loadMoreResults,
    zipcode,
    setZipcode,
    market,
    setMarket,
    getInitQuery,
    getFallbackKeyword,
    saveToRecentSearches,
    clearRecentSearches,
    removeRecentSearch,
    turnOffRecentSearches,
    turnOnRecentSearches,
  };
}
