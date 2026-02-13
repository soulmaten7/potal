"use client";

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StickyHeader } from '../../components/search/StickyHeader';
import { FilterSidebar } from '../../components/search/FilterSidebar';
import { ResultsGrid, type Product } from '../../components/search/ResultsGrid';
import { Icons } from '../../components/icons';

// 1. 사장님이 주신 리스트 합체 (필터용)
const DOMESTIC_LIST = ["Amazon", "Walmart", "Target", "Best Buy", "Costco", "eBay", "Home Depot", "Lowe's", "Macy's", "Apple", "Nike", "Kohl's", "Sephora", "Chewy", "Kroger", "Wayfair"];
const GLOBAL_LIST = ["AliExpress", "Temu", "iHerb", "Shein", "DHgate", "YesStyle", "Farfetch", "ASOS", "Uniqlo", "Etsy", "MyTheresa", "Olive Young", "Mercari"];
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
  const [showTopBtn, setShowTopBtn] = useState(false);

  const [priceMax, setPriceMax] = useState(2000);
  const [selectedRetailers, setSelectedRetailers] = useState<Set<string>>(new Set(ALL_RETAILERS_FLAT));

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
    const fetchProducts = async () => {
      setIsLoading(true);
      const q = searchParams.get("q") ?? "lego"; 
      const z = searchParams.get("zip") ?? ""; 
      const m = searchParams.get("market") ?? "all";

      setQuery(q); setZip(z); setMarket(m);
      setMarketLabel(m === "domestic" ? "Domestic" : m === "global" ? "Global" : "All Markets");

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&market=${m}`);
        const data = await res.json();

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
              rating: item.rating || 4.5,
              reviewCount: item.reviewCount || 100,
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
            };
          });
          setProducts(mappedProducts);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const matchesPrice = p.price <= priceMax;
        const matchesRetailer = selectedRetailers.size === 0 || selectedRetailers.has(p.seller);
        return matchesPrice && matchesRetailer;
    });
  }, [query, priceMax, selectedRetailers, products]);

  const sortedProducts = useMemo(() => {
    const prods = [...filteredProducts];
    if (sortBy === "cheapest") return prods.sort((a, b) => a.price - b.price);
    if (sortBy === "fastest") return prods.sort((a, b) => a.shippingDays - b.shippingDays);
    return prods.sort((a, b) => b.rating - a.rating || a.price - b.price);
  }, [filteredProducts, sortBy]);

  const domesticProducts = sortedProducts.filter(p => p.type === "domestic");
  const globalProducts = sortedProducts.filter(p => p.type === "global");
  const totalResults = sortedProducts.length;

  return (
    <div className="min-h-screen bg-[#f1f2f8] font-sans text-[#02122c] flex flex-col relative" onClick={closeAllDropdowns}>
      <style jsx global>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #02122c; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); margin-top: -6px; }
        input[type=range]::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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

      <main className="max-w-[1440px] mx-auto px-6 py-8 flex gap-8 flex-1 w-full">
        <FilterSidebar 
            priceMax={priceMax} setPriceMax={setPriceMax}
            selectedRetailers={selectedRetailers} setSelectedRetailers={setSelectedRetailers}
            market={market} setMarket={setMarket}
        />

        <ResultsGrid
            loading={isLoading} query={query} sortBy={sortBy} setSortBy={setSortBy}
            market={market} domesticProducts={domesticProducts} globalProducts={globalProducts}
            totalResults={totalResults} visibleCount={visibleCount} setVisibleCount={setVisibleCount}
            isSortOpen={isSortOpen} setIsSortOpen={setIsSortOpen}
            isTooltipOpen={isTooltipOpen} setIsTooltipOpen={setIsTooltipOpen}
            isDomesticTaxOpen={isDomesticTaxOpen} setIsDomesticTaxOpen={setIsDomesticTaxOpen}
            isGlobalInfoOpen={isGlobalInfoOpen} setIsGlobalInfoOpen={setIsGlobalInfoOpen}
            activeTooltipId={activeTooltipId} setActiveTooltipId={setActiveTooltipId}
            closeAllDropdowns={closeAllDropdowns}
            tabSummary={tabSummary}
        />
      </main>

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