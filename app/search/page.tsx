"use client";

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StickyHeader } from '../../components/search/StickyHeader';
import { FilterSidebar, type AiSuggestions } from '../../components/search/FilterSidebar';
import { ResultsGrid, type Product } from '../../components/search/ResultsGrid';
import { AiSmartSuggestionBox } from '@/app/components/search/AiSmartSuggestionBox';
import { Icons } from '../../components/icons';
import { extractFilterOptionsFromProducts } from '@/app/lib/filter-utils';
import { applyMembershipToProducts } from '@/app/lib/membership/applyMembershipAdjustments';
import { getAllProgramIds } from '@/app/lib/membership/MembershipConfig';

// 1. 리테일러 리스트 — API 연결된 사이트를 상단 배치
const DOMESTIC_LIST = ["Amazon", "Walmart", "Best Buy", "eBay", "Target", "Costco", "Home Depot", "Lowe's", "Macy's", "Apple", "Nike", "Kohl's", "Sephora", "Chewy", "Kroger", "Wayfair"];
const GLOBAL_LIST = ["AliExpress", "Temu", "Shein", "iHerb", "DHgate", "YesStyle", "Farfetch", "ASOS", "Uniqlo", "Etsy", "MyTheresa", "Olive Young", "Mercari"];
const ALL_RETAILERS_FLAT = [...DOMESTIC_LIST, ...GLOBAL_LIST];

// [ADD] 히스토리 저장을 위한 키값 정의
const STORAGE_KEY_USER_RECENTS = 'potal_user_recents';
const STORAGE_KEY_USER_ZIPS = 'potal_user_zips';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [query, setQuery] = useState("");
  const [zip, setZip] = useState("");
  const [market, setMarket] = useState("all");
  const [marketLabel, setMarketLabel] = useState("All Markets");
  const [sortBy, setSortBy] = useState<"best" | "cheapest" | "fastest">("best");
  const [secondarySort, setSecondarySort] = useState<"best" | "cheapest" | "fastest">("best");

  const [products, setProducts] = useState<Product[]>([]);
  const [tabSummary, setTabSummary] = useState<{ best: { price: string; days: string } | null; cheapest: { price: string; days: string } | null; fastest: { price: string; days: string } | null } | undefined>(undefined);
  
  // [ADD] StickyHeader에 필요한 히스토리 State 추가
  const [recentZips, setRecentZips] = useState<string[]>([]);
  const [heroRecents, setHeroRecents] = useState<string[]>([]);

  // UI States
  const [isExpanded, setIsExpanded] = useState(false);
  const [headerMarketOpen, setHeaderMarketOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false); 
  const [isGlobalInfoOpen, setIsGlobalInfoOpen] = useState(false); 
  const [isDomesticTaxOpen, setIsDomesticTaxOpen] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Pagination & Loading & Scroll
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const [priceMax, setPriceMax] = useState(2000);
  const [selectedRetailers, setSelectedRetailers] = useState<Set<string>>(new Set(ALL_RETAILERS_FLAT));
  const [memberships, setMemberships] = useState<Record<string, boolean>>(() => {
    // 기본: 모든 멤버십 활성화 (회원 기준 가격이 기본 표시)
    const defaults: Record<string, boolean> = {};
    for (const id of getAllProgramIds()) {
      defaults[id] = true;
    }
    return defaults;
  });
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestions | null>(null);
  const [aiActiveFilters, setAiActiveFilters] = useState<Set<string>>(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // [ADD] 질문형 쿼리 상태 — AI Smart Suggestion Box에서 사용
  const [isQuestionQuery, setIsQuestionQuery] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<string[]>([]);

  const closeAllDropdowns = () => {
    setIsExpanded(false); setHeaderMarketOpen(false); setIsSortOpen(false); setIsTooltipOpen(false);
    setIsGlobalInfoOpen(false); setIsDomesticTaxOpen(false); setActiveTooltipId(null);
  };

  useEffect(() => {
      const handleScroll = () => { setShowTopBtn(window.scrollY > 400); };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // [ADD] 히스토리 로드 (StickyHeader용)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const zips = JSON.parse(localStorage.getItem(STORAGE_KEY_USER_ZIPS) || '[]');
        const queries = JSON.parse(localStorage.getItem(STORAGE_KEY_USER_RECENTS) || '[]');
        setRecentZips(zips);
        setHeroRecents(queries);
      } catch (e) {}
    }
  }, []);

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // API 호출
  useEffect(() => {
    let cancelled = false; // race condition 방지 (검색 중 새 검색 시 이전 AI 결과 무시)

    const fetchProducts = async () => {
      setIsLoading(true);
      setSearchError(false);
      setIsQuestionQuery(false);
      setSuggestedProducts([]);
      setAiActiveFilters(new Set());
      const q = searchParams.get("q") ?? "";
      const z = searchParams.get("zipcode") ?? searchParams.get("zip") ?? (typeof window !== 'undefined' ? localStorage.getItem('potal_zipcode') ?? '' : '');
      const m = searchParams.get("market") ?? "all";

      setQuery(q); setZip(z); setMarket(m);
      setMarketLabel(m === "domestic" ? "Domestic" : m === "global" ? "Global" : "All Markets");

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&market=${m}${z ? `&zipcode=${encodeURIComponent(z)}` : ''}`);
        const data = await res.json();

        if (cancelled) return;

        // [ADD] 질문형 쿼리 처리 — API 호출 없이 suggestedProducts만 반환됨
        if (data.metadata?.isQuestionQuery && data.metadata?.suggestedProducts?.length > 0) {
          setIsQuestionQuery(true);
          setSuggestedProducts(data.metadata.suggestedProducts);
          setProducts([]);
          setAiSuggestions(null);
          setTabSummary(undefined);
          return; // 질문형이면 여기서 끝 (상품 매핑 불필요)
        }

        // tabSummary 추출
        if (data.metadata?.tabSummary) {
          setTabSummary(data.metadata.tabSummary);
        }

        if (data.results) {
          const mappedProducts: Product[] = data.results.map((item: any, index: number) => {
            const isDomestic = item.category === 'domestic' || (item.shipping || '').toLowerCase() === 'domestic';
            return {
              id: item.id || `api_${index}`,
              title: item.name,
              seller: item.site,
              rating: item.rating ?? 0,
              reviewCount: item.reviewCount ?? 0,
              badges: item.is_prime ? ["Prime"] : isDomestic ? ["Fast Ship"] : [],
              price: parseFloat(String(item.price).replace(/[^0-9.-]/g, '')) || 0,
              arrives: item.deliveryDays || item.delivery,
              shippingDays: item.parsedDeliveryDays ?? (isDomestic ? 2 : 14),
              shipping: isDomestic ? "Free Domestic Shipping" : "+$15.00 Global Shipping",
              shippingContext: isDomestic ? "US Warehouse" : "Global Warehouse",
              thumb: item.image,
              type: isDomestic ? "domestic" : "global",
              keywords: [q, "product"],
              link: item.link,
              totalPrice: item.totalPrice,
              shippingPrice: item.shippingPrice,
              is_prime: item.is_prime,
              trustScore: item.trustScore,
              bestScore: item.bestScore,
              parsedPrice: item.parsedPrice,
              parsedDeliveryDays: item.parsedDeliveryDays,
              fraudFlags: item.fraudFlags,
              isSearchCard: item.isSearchCard,
              searchCardTagline: item.searchCardTagline,
              site: item.site,
            };
          });
          setProducts(mappedProducts);

          // ✅ 상품 로딩 완료 → ResultsGrid 즉시 표시 (AI는 별도 로딩)
          setIsLoading(false);

          // ═══ AI Smart Suggestion: 전체 AI 단일 호출 ═══
          // Brands + Keywords 모두 AI가 판단 (빈도 기반 제거)
          const realProducts = data.results.filter((p: any) => !p.isSearchCard);
          // Market Scope에 맞는 상품만 필터링 후 BestScore 순 상위 25개 추출
          // → AI Smart Suggestion 브랜드가 선택된 market과 일치하도록
          const marketFilteredProducts = m === 'domestic'
            ? realProducts.filter((p: any) => p.category === 'domestic' || (p.shipping || '').toLowerCase() === 'domestic')
            : m === 'global'
            ? realProducts.filter((p: any) => p.category !== 'domestic' && (p.shipping || '').toLowerCase() !== 'domestic')
            : realProducts; // "all" → 전체
          const titles = [...marketFilteredProducts]
            .sort((a: any, b: any) => (b.bestScore ?? 0) - (a.bestScore ?? 0))
            .slice(0, 25)
            .map((p: any) => p.name || '')
            .filter(Boolean);

          if (titles.length > 0 && !cancelled) {
            // AI 호출 전: null → AiSmartSuggestionBox가 자체 로딩 표시
            setAiSuggestions(null);

            try {
              const aiRes = await fetch('/api/ai-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, titles }),
              });
              const aiData = await aiRes.json();
              if (!cancelled) {
                const hasAxes = Array.isArray(aiData.axes) && aiData.axes.length > 0;
                const hasBrands = Array.isArray(aiData.brands) && aiData.brands.length > 0;
                if (hasAxes || hasBrands) {
                  // AI 결과: Brands + Axes (계층형) + Keywords (하위호환 flat)
                  setAiSuggestions({
                    Brands: aiData.brands || [],
                    Axes: aiData.axes || [],
                    Keywords: aiData.keywords || [], // 하위호환
                  } as AiSuggestions);
                } else {
                  // AI 반환 없으면 빈도 기반 fallback
                  const fallbackSuggestions = extractFilterOptionsFromProducts(
                    realProducts.map((p: any) => ({ name: p.name || '', brand: p.brand, price: p.price, parsedPrice: p.parsedPrice })),
                    q
                  );
                  setAiSuggestions(fallbackSuggestions as AiSuggestions);
                }
              }
            } catch (err) {
              console.warn('AI Smart Suggestion failed, using frequency-based fallback');
              if (!cancelled) {
                const fallbackSuggestions = extractFilterOptionsFromProducts(
                  realProducts.map((p: any) => ({ name: p.name || '', brand: p.brand, price: p.price, parsedPrice: p.parsedPrice })),
                  q
                );
                setAiSuggestions(fallbackSuggestions as AiSuggestions);
              }
            }
          }
        } else {
          setProducts([]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
        setSearchError(true);
        setIsLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [searchParams]);

  useEffect(() => {
    const handleClick = () => closeAllDropdowns();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // [ADD] 히스토리 삭제 핸들러 (StickyHeader에 전달용)
  const removeHeroRecent = useCallback((term: string) => {
    const next = heroRecents.filter(t => t !== term);
    setHeroRecents(next);
    localStorage.setItem(STORAGE_KEY_USER_RECENTS, JSON.stringify(next));
  }, [heroRecents]);

  const removeRecentZip = useCallback((z: string) => {
    const next = recentZips.filter(t => t !== z);
    setRecentZips(next);
    localStorage.setItem(STORAGE_KEY_USER_ZIPS, JSON.stringify(next));
  }, [recentZips]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); 
    closeAllDropdowns();
    
    // [ADD] 검색 시 히스토리 저장
    if (query.trim()) {
        const nextQ = [query, ...heroRecents.filter(x => x !== query)].slice(0, 5);
        setHeroRecents(nextQ);
        localStorage.setItem(STORAGE_KEY_USER_RECENTS, JSON.stringify(nextQ));
    }
    if (zip.trim()) {
        const nextZ = [zip, ...recentZips.filter(x => x !== zip)].slice(0, 3);
        setRecentZips(nextZ);
        localStorage.setItem(STORAGE_KEY_USER_ZIPS, JSON.stringify(nextZ));
    }

    const params = new URLSearchParams(); 
    if(query) params.set("q", query); 
    if(zip) params.set("zip", zip); 
    params.set("market", market);
    router.push(`/search?${params.toString()}`);
  };

  // ── 멤버십 보정 적용 (memberships 변경 시 재계산) ──
  const membershipAdjustedProducts = useMemo(() => {
    return applyMembershipToProducts(products, memberships);
  }, [products, memberships]);

  const filteredProducts = useMemo(() => {
    return membershipAdjustedProducts.filter(p => {
        // 검색카드(isSearchCard)는 항상 표시
        if (p.isSearchCard) return true;
        const matchesPrice = !isNaN(p.price) && p.price <= priceMax;
        const matchesRetailer = selectedRetailers.size === 0 || selectedRetailers.has(p.seller) || selectedRetailers.has(p.site ?? '');

        // AI Smart Suggestion 클라이언트 사이드 필터링
        let matchesAiFilter = true;
        if (aiActiveFilters.size > 0) {
          const titleLower = (p.title || '').toLowerCase();
          const sellerLower = (p.seller || '').toLowerCase();
          const siteLower = (p.site || '').toLowerCase();
          // OR 로직: 체크된 항목 중 하나라도 매칭되면 표시
          matchesAiFilter = Array.from(aiActiveFilters).some(filter => {
            const filterLower = filter.toLowerCase();
            return titleLower.includes(filterLower) || sellerLower.includes(filterLower) || siteLower.includes(filterLower);
          });
        }

        return matchesPrice && matchesRetailer && matchesAiFilter;
    });
  }, [query, priceMax, selectedRetailers, membershipAdjustedProducts, aiActiveFilters]);

  const sortedProducts = useMemo(() => {
    // 검색카드는 항상 끝에 배치
    const searchCards = filteredProducts.filter(p => p.isSearchCard);
    const realProducts = filteredProducts.filter(p => !p.isSearchCard);

    // 2차 정렬 비교 함수 (같은 1차 값일 때 사용)
    const secondaryCompare = (a: Product, b: Product): number => {
      if (secondarySort === "cheapest") return (a.parsedPrice ?? a.price) - (b.parsedPrice ?? b.price);
      if (secondarySort === "fastest") return (a.parsedDeliveryDays ?? a.shippingDays) - (b.parsedDeliveryDays ?? b.shippingDays);
      return (b.bestScore ?? 0) - (a.bestScore ?? 0); // "best" default
    };

    if (sortBy === "cheapest") {
      realProducts.sort((a, b) => {
        const diff = (a.parsedPrice ?? a.price) - (b.parsedPrice ?? b.price);
        return diff !== 0 ? diff : secondaryCompare(a, b);
      });
    } else if (sortBy === "fastest") {
      realProducts.sort((a, b) => {
        const diff = (a.parsedDeliveryDays ?? a.shippingDays) - (b.parsedDeliveryDays ?? b.shippingDays);
        return diff !== 0 ? diff : secondaryCompare(a, b);
      });
    } else {
      // Best: ScoringEngine의 bestScore 사용 (높을수록 좋음)
      realProducts.sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0));
    }
    return [...realProducts, ...searchCards];
  }, [filteredProducts, sortBy, secondarySort]);

  const domesticProducts = sortedProducts.filter(p => p.type === "domestic");
  const globalProducts = sortedProducts.filter(p => p.type === "global");
  const totalResults = sortedProducts.length;

  // [ADD] 질문형 칩 클릭 → 해당 키워드로 새 검색 실행
  const handleCategoryClick = useCallback((keyword: string) => {
    setQuery(keyword);
    setIsQuestionQuery(false);
    setSuggestedProducts([]);
    const params = new URLSearchParams();
    params.set("q", keyword);
    if (zip) params.set("zip", zip);
    params.set("market", market);
    router.push(`/search?${params.toString()}`);
  }, [zip, market, router]);

  // [ADD] AI Smart Suggestion: 체크된 키워드로 기존 결과 클라이언트 필터링 (API 재호출 없음)
  const handleAiFilterApply = useCallback((keywords: string[]) => {
    setAiActiveFilters(new Set(keywords));
  }, []);

  const handleAiFilterClear = useCallback(() => {
    setAiActiveFilters(new Set());
  }, []);

  return (
    <div className="min-h-screen bg-[#f1f2f8] font-sans text-[#02122c] flex flex-col relative" onClick={closeAllDropdowns}>
      <style jsx global>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #02122c; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); margin-top: -6px; }
        input[type=range]::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>

      <div onClick={(e) => e.stopPropagation()}>
        {/* [FIX] StickyHeader Props 동기화:
            - zip -> zipcode
            - setZip -> setZipcode
            - market, isExpanded 등 삭제 (새 헤더엔 없음)
            - recentZips, heroRecents 등 추가
        */}
        <StickyHeader 
            query={query} 
            setQuery={setQuery} 
            zipcode={zip} 
            setZipcode={setZip} 
            recentZips={recentZips}
            heroRecents={heroRecents}
            onRemoveRecentZip={removeRecentZip}
            onRemoveHeroRecent={removeHeroRecent}
            onSearch={handleSearch} 
            loading={isLoading}
        />
      </div>

      <main className="max-w-[1440px] mx-auto px-3 md:px-6 py-4 md:py-8 flex gap-4 md:gap-8 flex-1 w-full">
        <FilterSidebar
            priceMax={priceMax} setPriceMax={setPriceMax}
            selectedRetailers={selectedRetailers} setSelectedRetailers={setSelectedRetailers}
            market={market} setMarket={setMarket}
            memberships={memberships} setMemberships={setMemberships}
        />

        {/* 오른쪽 메인 영역: AI Suggestion + Results */}
        <div className="flex-1 flex flex-col gap-6">
          {/* AI Smart Suggestion Box — 검색바 아래, 결과 위 */}
          <AiSmartSuggestionBox
            loading={isLoading}
            isQuestionQuery={isQuestionQuery}
            suggestedProducts={suggestedProducts}
            aiSuggestions={aiSuggestions}
            query={query}
            onCategoryClick={handleCategoryClick}
            onApplyFilters={handleAiFilterApply}
            onClearFilters={handleAiFilterClear}
            activeFilters={aiActiveFilters}
          />

          <ResultsGrid
            loading={isLoading} query={query} sortBy={sortBy} setSortBy={(v) => { setSortBy(v); setSecondarySort('best'); }}
            secondarySort={secondarySort} setSecondarySort={setSecondarySort}
            market={market} domesticProducts={domesticProducts} globalProducts={globalProducts}
            totalResults={totalResults} visibleCount={visibleCount} setVisibleCount={setVisibleCount}
            isSortOpen={isSortOpen} setIsSortOpen={setIsSortOpen}
            isTooltipOpen={isTooltipOpen} setIsTooltipOpen={setIsTooltipOpen}
            isDomesticTaxOpen={isDomesticTaxOpen} setIsDomesticTaxOpen={setIsDomesticTaxOpen}
            isGlobalInfoOpen={isGlobalInfoOpen} setIsGlobalInfoOpen={setIsGlobalInfoOpen}
            activeTooltipId={activeTooltipId} setActiveTooltipId={setActiveTooltipId}
            closeAllDropdowns={closeAllDropdowns}
            tabSummary={tabSummary}
            searchError={searchError}
            onRetry={() => window.location.reload()}
          />
        </div>{/* end 오른쪽 메인 영역 */}
      </main>

      {/* ═══ MOBILE FILTER BUTTON (lg 미만에서만 표시) ═══ */}
      <button
        onClick={() => setMobileFilterOpen(true)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[900] flex items-center gap-2 px-5 py-3 bg-[#02122c] text-white rounded-full shadow-2xl hover:bg-[#F59E0B] transition-all active:scale-95"
      >
        <Icons.Filter className="w-4 h-4" />
        <span className="text-sm font-bold">Filters</span>
      </button>

      {/* ═══ MOBILE FILTER BOTTOM SHEET ═══ */}
      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-[1000]" onClick={() => setMobileFilterOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#f1f2f8] rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle + Close */}
            <div className="sticky top-0 bg-[#f1f2f8] pt-3 pb-2 px-4 z-10 border-b border-slate-200">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#02122c]">Filters</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="text-sm font-bold text-[#F59E0B] hover:underline"
                >
                  Done
                </button>
              </div>
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-5">
              {/* Market */}
              <div>
                <p className="text-[13px] font-bold text-slate-500 uppercase mb-2">Market Scope</p>
                <div className="flex gap-2">
                  {[{ val: "all", label: "All" }, { val: "domestic", label: "US" }, { val: "global", label: "Global" }].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setMarket(opt.val)}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${market === opt.val ? 'bg-[#02122c] text-white border-[#02122c]' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-[13px] font-bold text-slate-500 uppercase mb-2">Max Price: ${priceMax}{priceMax === 2000 ? '+' : ''}</p>
                <input type="range" min="0" max="2000" step="50" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" />
              </div>

              {/* Retailers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-bold text-slate-500 uppercase">Retailers</p>
                  <div className="flex gap-2 text-[11px] font-bold">
                    <button onClick={() => setSelectedRetailers(new Set(ALL_RETAILERS_FLAT))} className="text-[#02122c] hover:underline">All</button>
                    <button onClick={() => setSelectedRetailers(new Set())} className="text-slate-400 hover:underline">Clear</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_RETAILERS_FLAT.slice(0, 12).map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRetailers(prev => {
                          const next = new Set(prev);
                          if (next.has(r)) next.delete(r); else next.add(r);
                          return next;
                        });
                      }}
                      className={`px-2.5 py-1.5 text-[12px] font-bold rounded-full border transition-all ${selectedRetailers.has(r) ? 'bg-[#02122c] text-white border-[#02122c]' : 'bg-white text-slate-500 border-slate-200'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 w-12 h-12 bg-[#02122c] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#F59E0B] transition-all duration-300 z-[999] ${showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <Icons.ArrowUp className="w-6 h-6" />
      </button>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div>Loading...</div></div>}>
      <SearchContent />
    </Suspense>
  );
}