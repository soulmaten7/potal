"use client";

import React from 'react';
import { Icons, StarIcon, InfoIcon, ChevronDownIcon } from '../icons';
import { ProductCard as RealProductCard, ProductCardSkeleton } from '@/app/components/ProductCard';

export interface Product {
  id: string | number;
  title: string;
  seller: string;
  rating: number;
  reviewCount: number;
  badges: string[];
  price: number;
  arrives: string;
  shippingDays: number;
  shipping: string;
  shippingContext: string;
  thumb: string;
  type: "domestic" | "global";
  keywords: string[];
  link?: string;
  totalPrice?: number;
  shippingPrice?: number;
  is_prime?: boolean;
  trustScore?: number;
  bestScore?: number;
  parsedPrice?: number;
  parsedDeliveryDays?: number;
  fraudFlags?: string[];
  isSearchCard?: boolean;
  searchCardTagline?: string;
  site?: string;
  membershipAdjusted?: boolean;
  appliedMembership?: string | null;
  membershipBadge?: { label: string; badgeColor: string; badgeBg: string } | null;
}

/** Tab summary from ScoringEngine */
interface TabSummaryData {
  best: { price: string; days: string } | null;
  cheapest: { price: string; days: string } | null;
  fastest: { price: string; days: string } | null;
}

interface ResultsGridProps {
  loading: boolean;
  query: string;
  sortBy: "best" | "cheapest" | "fastest";
  setSortBy: (val: "best" | "cheapest" | "fastest") => void;
  secondarySort?: "best" | "cheapest" | "fastest";
  setSecondarySort?: (val: "best" | "cheapest" | "fastest") => void;
  market: string;
  domesticProducts: Product[];
  globalProducts: Product[];
  totalResults: number;
  visibleCount: number;
  setVisibleCount: (n: number) => void;
  isSortOpen: boolean; setIsSortOpen: (v: boolean) => void;
  isTooltipOpen: boolean; setIsTooltipOpen: (v: boolean) => void;
  isDomesticTaxOpen: boolean; setIsDomesticTaxOpen: (v: boolean) => void;
  isGlobalInfoOpen: boolean; setIsGlobalInfoOpen: (v: boolean) => void;
  activeTooltipId: string | null; setActiveTooltipId: (v: string | null) => void;
  closeAllDropdowns: () => void;
  tabSummary?: TabSummaryData;
  searchError?: boolean;
  onRetry?: () => void;
}

export function ResultsGrid({
  loading, query, sortBy, setSortBy, secondarySort, setSecondarySort, market,
  domesticProducts, globalProducts, totalResults,
  visibleCount, setVisibleCount,
  isSortOpen, setIsSortOpen,
  isTooltipOpen, setIsTooltipOpen,
  isDomesticTaxOpen, setIsDomesticTaxOpen,
  isGlobalInfoOpen, setIsGlobalInfoOpen,
  activeTooltipId, setActiveTooltipId,
  closeAllDropdowns, tabSummary, searchError, onRetry
}: ResultsGridProps) {

  // [Logic] 툴팁 토글 (하나 열면 다른 하나 닫기)
  const toggleDomesticTax = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDomesticTaxOpen) {
        setIsDomesticTaxOpen(false);
    } else {
        setIsDomesticTaxOpen(true);
        setIsGlobalInfoOpen(false); // 반대쪽 닫기
    }
  };

  const toggleGlobalTax = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGlobalInfoOpen) {
        setIsGlobalInfoOpen(false);
    } else {
        setIsGlobalInfoOpen(true);
        setIsDomesticTaxOpen(false); // 반대쪽 닫기
    }
  };
  
  /** ResultsGrid Product → 실제 ProductCard props 변환 */
  const renderProductCard = (product: Product) => {
    const cardProduct = {
      id: String(product.id),
      title: product.title,
      name: product.title,
      price: typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : String(product.price),
      image: product.thumb,
      thumb: product.thumb,
      seller: product.seller,
      site: product.seller,
      rating: product.rating,
      reviewCount: product.reviewCount,
      badges: product.badges,
      is_prime: product.is_prime,
      shipping: product.shipping,
      deliveryDays: product.arrives,
      link: product.link,
      trustScore: product.trustScore,
      bestScore: product.bestScore,
      parsedPrice: product.parsedPrice,
      parsedDeliveryDays: product.parsedDeliveryDays,
      fraudFlags: product.fraudFlags,
      totalPrice: product.totalPrice,
      shippingPrice: product.shippingPrice,
      isSearchCard: product.isSearchCard,
      searchCardTagline: product.searchCardTagline,
      membershipAdjusted: product.membershipAdjusted,
      appliedMembership: product.appliedMembership,
    };
    return (
      <RealProductCard
        key={String(product.id)}
        product={cardProduct}
        type={product.type === 'domestic' ? 'domestic' : 'global'}
      />
    );
  };

  const showDomestic = market === "all" || market === "domestic";
  const showGlobal = market === "all" || market === "global";

  // Error state: API failure
  if (!loading && searchError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Search temporarily unavailable</h3>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          We couldn&apos;t reach our product providers right now. This is usually temporary — please try again.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-6 py-2.5 bg-[#02122c] text-white text-sm font-bold rounded-xl hover:bg-[#0a192f] transition-colors shadow-sm"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // ── Loading State: 검색 중 안내 화면 ──
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 gap-5">
        {/* 애니메이션 스피너 */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#F59E0B] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl">🔍</span>
          </div>
        </div>

        {/* 안내 텍스트 */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-extrabold text-slate-800">Searching across 7 retailers...</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Comparing prices from Amazon, Walmart, eBay, Target, BestBuy, AliExpress, and Temu. This usually takes 10-15 seconds.
          </p>
        </div>

        {/* 프로그레스 바 (시각적 피드백) */}
        <div className="w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#F59E0B] rounded-full animate-loading-bar" />
        </div>

        {/* 스켈레톤 카드 미리보기 */}
        <div className="w-full max-w-2xl mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
          {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6">

      {/* (1) 상단 텍스트 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 relative">
            <span className="text-[13px] sm:text-[15px] font-bold text-slate-700">
                <span className="text-slate-900 font-extrabold">{totalResults}</span> results sorted by <span className="text-[#F59E0B] capitalize">{sortBy}</span>
            </span>
            {sortBy === 'best' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveTooltipId(activeTooltipId === 'best-info' ? null : 'best-info'); }}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-slate-300 hover:border-[#F59E0B] hover:bg-amber-50 transition-colors"
                  aria-label="Best scoring criteria info"
                >
                  <span className="text-[11px] font-bold text-slate-400">?</span>
                </button>
                {activeTooltipId === 'best-info' && (
                  <div className="absolute top-8 left-0 z-50 w-[calc(100vw-2rem)] sm:w-[340px] bg-white border border-slate-200 rounded-xl shadow-xl p-4 sm:p-5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-extrabold text-[#02122c]">How POTAL Ranks &quot;Best&quot;</h4>
                      <button onClick={() => setActiveTooltipId(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                      POTAL&apos;s AI calculates a composite Best Score for every product using 5 weighted factors:
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: 'Total Price', pct: 35, color: 'bg-emerald-500', desc: 'Product + shipping + tax/duty (landed cost)' },
                        { label: 'Delivery Speed', pct: 25, color: 'bg-blue-500', desc: 'Faster arrival = higher score' },
                        { label: 'Seller Trust', pct: 20, color: 'bg-purple-500', desc: 'Platform reputation, ratings, reviews' },
                        { label: 'Match Accuracy', pct: 15, color: 'bg-amber-500', desc: 'How closely the product matches your search' },
                        { label: 'Return Policy', pct: 5, color: 'bg-slate-400', desc: 'Ease and reliability of returns' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-slate-700">{item.label}</span>
                            <span className="text-xs font-extrabold text-slate-900">{item.pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Membership benefits (Prime, W+, etc.) are factored in — toggling memberships on/off recalculates scores in real time. Products flagged for fraud risk receive score penalties.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
        </div>
      </div>

      {/* (2) 요약 카드 & Sort By - 통합 Grid (모바일 2x2, 데스크톱 4칸) */}
      <div className="grid grid-cols-3 gap-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-x divide-slate-100" role="tablist" aria-label="Sort results">

         <button role="tab" aria-selected={sortBy === 'best'} aria-label="Sort by best overall" onClick={() => setSortBy("best")} className={`p-2 sm:p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors ${sortBy === 'best' ? 'bg-slate-50 border-b-2 border-[#02122c]' : ''}`}>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Best</span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-900">{tabSummary?.best ? `${tabSummary.best.price} · ${tabSummary.best.days}` : '—'}</span>
         </button>

         <button role="tab" aria-selected={sortBy === 'cheapest'} aria-label="Sort by cheapest price" onClick={() => setSortBy("cheapest")} className={`p-2 sm:p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors ${sortBy === 'cheapest' ? 'bg-slate-50 border-b-2 border-[#02122c]' : ''}`}>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Cheapest</span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-900">{tabSummary?.cheapest ? `${tabSummary.cheapest.price} · ${tabSummary.cheapest.days}` : '—'}</span>
         </button>

         <button role="tab" aria-selected={sortBy === 'fastest'} aria-label="Sort by fastest delivery" onClick={() => setSortBy("fastest")} className={`p-2 sm:p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors ${sortBy === 'fastest' ? 'bg-slate-50 border-b-2 border-[#02122c]' : ''}`}>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Fastest</span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-900">{tabSummary?.fastest ? `${tabSummary.fastest.price} · ${tabSummary.fastest.days}` : '—'}</span>
         </button>
         
      </div>

      {/* (2.5) Secondary Sort — Fastest/Cheapest 탭일 때만 표시 */}
      {(sortBy === 'fastest' || sortBy === 'cheapest') && setSecondarySort && (
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Then by</span>
          <div className="flex gap-1.5">
            {(sortBy === 'fastest'
              ? [
                  { key: 'best' as const, label: 'Best' },
                  { key: 'cheapest' as const, label: 'Cheapest' },
                ]
              : [
                  { key: 'best' as const, label: 'Best' },
                  { key: 'fastest' as const, label: 'Fastest' },
                ]
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSecondarySort(opt.key)}
                className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-all ${
                  secondarySort === opt.key
                    ? 'bg-[#02122c] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-[#F59E0B] hover:text-[#02122c]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* (3) 메인 상품 리스트 — 모바일: 1열 세로, 데스크톱: 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {showDomestic && (
            <div className={`flex flex-col gap-4 ${!showGlobal ? 'col-span-2' : ''}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🇺🇸</span>
                        <h2 className="text-lg font-extrabold text-slate-900">Domestic</h2>
                    </div>
                    {/* [FIX] Tooltip Toggle 적용 */}
                    <div className="relative z-10">
                        <button onClick={toggleDomesticTax} className="flex items-center gap-1 text-[11px] font-bold text-[#F59E0B] hover:underline">
                            <InfoIcon className="w-3 h-3" /> Sales Tax Info
                        </button>
                        {isDomesticTaxOpen && (
                            <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[340px] bg-white rounded-xl shadow-2xl border border-slate-100 p-4 sm:p-5 z-50 animate-fadeIn text-left max-h-[75vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-slate-900 text-sm">🇺🇸 US Sales Tax — How It Works</h4><button onClick={() => setIsDomesticTaxOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>

                                <p className="text-[11px] leading-relaxed text-slate-600 mb-3">POTAL estimates sales tax using your <strong>ZIP code</strong> and each state&apos;s combined tax rate (state + local average). The actual amount is finalized at checkout by the retailer.</p>

                                {/* 세금 산정 방식 */}
                                <div className="mb-3">
                                  <p className="text-[11px] font-bold text-slate-900 mb-1.5">📐 How Tax Is Calculated</p>
                                  <div className="bg-slate-50 rounded-lg p-2.5 text-[10px] space-y-1 leading-relaxed">
                                    <p><strong>Tax = Product Price × State+Local Rate</strong></p>
                                    <p className="text-slate-500">Shipping is generally NOT taxed in most states, but some states (TX, VA, etc.) do tax shipping charges.</p>
                                  </div>
                                </div>

                                {/* 주별 세율 */}
                                <div className="mb-3">
                                  <p className="text-[11px] font-bold text-slate-900 mb-1.5">🗺️ Tax Rates by State (Combined Avg.)</p>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                                    <div className="flex justify-between"><span>California</span><span className="font-bold">8.75%</span></div>
                                    <div className="flex justify-between"><span>New York</span><span className="font-bold">8.00%</span></div>
                                    <div className="flex justify-between"><span>Texas</span><span className="font-bold">8.25%</span></div>
                                    <div className="flex justify-between"><span>Florida</span><span className="font-bold">7.00%</span></div>
                                    <div className="flex justify-between"><span>Washington</span><span className="font-bold">8.92%</span></div>
                                    <div className="flex justify-between"><span>Illinois</span><span className="font-bold">8.82%</span></div>
                                    <div className="flex justify-between"><span>Pennsylvania</span><span className="font-bold">6.34%</span></div>
                                    <div className="flex justify-between"><span>Tennessee</span><span className="font-bold">9.55%</span></div>
                                  </div>
                                  <div className="mt-1.5 bg-emerald-50 border border-emerald-100 rounded p-1.5 text-[10px]">
                                    <span className="font-bold text-emerald-700">No Sales Tax:</span> <span className="text-emerald-600">Oregon, Montana, New Hampshire, Delaware, Alaska</span>
                                  </div>
                                </div>

                                {/* 리테일러별 */}
                                <div className="mb-3">
                                  <p className="text-[11px] font-bold text-slate-900 mb-1.5">🏪 Retailer-Specific Notes</p>
                                  <div className="space-y-1.5 text-[10px] leading-relaxed">
                                    <div className="flex gap-2"><span className="font-bold text-[#FF9900] shrink-0">Amazon</span><span className="text-slate-500">Collects tax in all 50 states. Third-party sellers may vary. Tax shown at checkout.</span></div>
                                    <div className="flex gap-2"><span className="font-bold text-[#0071ce] shrink-0">Walmart</span><span className="text-slate-500">Collects tax in all states. Online and in-store rates match. Marketplace sellers included.</span></div>
                                    <div className="flex gap-2"><span className="font-bold text-[#003b64] shrink-0">Best Buy</span><span className="text-slate-500">Collects tax in all states. Same rate for ship-to-home and store pickup.</span></div>
                                    <div className="flex gap-2"><span className="font-bold text-[#CC0000] shrink-0">Target</span><span className="text-slate-500">Collects tax in all states. Circle membership is not a tax exemption.</span></div>
                                    <div className="flex gap-2"><span className="font-bold text-[#e53238] shrink-0">eBay</span><span className="text-slate-500">Marketplace facilitator — eBay collects and remits tax on behalf of sellers.</span></div>
                                  </div>
                                </div>

                                {/* 예시 */}
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 mb-2">
                                  <p className="text-[11px] font-bold text-blue-700 mb-1">💡 Example: $100 product in California</p>
                                  <div className="space-y-0.5 text-[10px]">
                                    <div className="flex justify-between"><span className="text-slate-500">Product Price</span><span>$100.00</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className="text-emerald-600">Free (Prime)</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">CA Sales Tax (8.75%)</span><span className="text-slate-700">+$8.75</span></div>
                                    <div className="flex justify-between border-t border-blue-200 pt-0.5 mt-0.5"><span className="font-bold">You Pay</span><span className="font-bold text-slate-900">$108.75</span></div>
                                  </div>
                                </div>

                                <p className="text-[9px] text-slate-400 leading-relaxed">POTAL&apos;s tax estimate uses average combined state+local rates. Your exact tax may differ slightly based on municipality, product category (food, clothing exemptions vary), and retailer-specific calculation.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${!showGlobal ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'flex flex-col gap-4'}`}>
                    {loading ? (
                        <>{[1,2,3].map(i => <ProductCardSkeleton key={i} />)}</>
                    ) : domesticProducts.length > 0 ? (
                        domesticProducts.slice(0, visibleCount).map((p) => renderProductCard(p))
                    ) : (
                         <div className="text-center py-10 text-slate-400 text-sm">No domestic results.</div>
                    )}
                </div>
            </div>
        )}

        {showGlobal && (
            <div className={`flex flex-col gap-4 ${!showDomestic ? 'col-span-2' : ''}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🌍</span>
                        <h2 className="text-lg font-extrabold text-slate-900">Global</h2>
                    </div>
                    {/* [FIX] Tooltip Toggle 적용 */}
                    <div className="relative z-10">
                        <button onClick={toggleGlobalTax} className="flex items-center gap-1 text-[11px] font-bold text-[#F59E0B] hover:underline">
                            <InfoIcon className="w-3 h-3" /> Import Tax Info
                        </button>
                        {isGlobalInfoOpen && (
                            <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[380px] bg-white rounded-xl shadow-2xl border border-slate-100 p-4 sm:p-5 z-50 animate-fadeIn text-left max-h-[80vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-slate-900 text-sm">🌏 Global Import Tax — Full Breakdown</h4><button onClick={() => setIsGlobalInfoOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>

                                <p className="text-[11px] leading-relaxed text-slate-600 mb-3">POTAL calculates <strong>Total Landed Cost</strong> — the actual price including product + shipping + import duties + processing fees. This is what you really pay when buying from overseas.</p>

                                {/* ── 사이트별 배송 정책 ── */}
                                <div className="mb-4">
                                  <p className="text-[12px] font-extrabold text-slate-900 mb-2 pb-1 border-b border-slate-200">📦 Shipping by Retailer</p>

                                  <div className="mb-2.5">
                                    <div className="flex items-center gap-1.5 mb-1"><span className="text-[11px] font-bold text-[#FF4747]">AliExpress</span><span className="text-[9px] bg-[#FF4747] text-white px-1.5 py-[1px] rounded-full font-bold">Choice</span></div>
                                    <div className="text-[10px] leading-relaxed text-slate-500 pl-2 border-l-2 border-[#FF4747]/30">
                                      <p><strong>Origin:</strong> China (mainland), shipped via AliExpress Standard / Cainiao</p>
                                      <p><strong>Choice items:</strong> Free shipping, 7-15 day delivery, free returns 90 days</p>
                                      <p><strong>Non-Choice:</strong> Shipping $1-5, delivery 15-45 days, returns at buyer cost</p>
                                      <p><strong>Express:</strong> $5-15 extra, 5-10 day delivery (DHL/FedEx)</p>
                                    </div>
                                  </div>

                                  <div className="mb-2.5">
                                    <div className="flex items-center gap-1.5 mb-1"><span className="text-[11px] font-bold text-black">Shein</span><span className="text-[9px] bg-black text-white px-1.5 py-[1px] rounded-full font-bold">S-Club</span></div>
                                    <div className="text-[10px] leading-relaxed text-slate-500 pl-2 border-l-2 border-black/20">
                                      <p><strong>Origin:</strong> China, shipped via SHEIN logistics</p>
                                      <p><strong>Standard:</strong> Free on $29+, delivery 7-11 business days</p>
                                      <p><strong>Express:</strong> $12.90, delivery 3-7 business days</p>
                                      <p><strong>S-Club:</strong> Free shipping coupons monthly, no minimum</p>
                                      <p><strong>Returns:</strong> First return free within 35 days</p>
                                    </div>
                                  </div>

                                  <div className="mb-2.5">
                                    <div className="flex items-center gap-1.5 mb-1"><span className="text-[11px] font-bold text-[#FB7701]">Temu</span></div>
                                    <div className="text-[10px] leading-relaxed text-slate-500 pl-2 border-l-2 border-[#FB7701]/30">
                                      <p><strong>Origin:</strong> China, shipped via Temu logistics / J&T Express</p>
                                      <p><strong>Standard:</strong> Free shipping, delivery 7-15 business days</p>
                                      <p><strong>Express:</strong> $7.99, delivery 4-8 business days</p>
                                      <p><strong>Returns:</strong> Free returns within 90 days</p>
                                    </div>
                                  </div>

                                  <div className="mb-1">
                                    <div className="flex items-center gap-1.5 mb-1"><span className="text-[11px] font-bold text-slate-600">Other Global</span><span className="text-[9px] text-slate-400">(DHgate, YesStyle, etc.)</span></div>
                                    <div className="text-[10px] leading-relaxed text-slate-500 pl-2 border-l-2 border-slate-200">
                                      <p><strong>Origin:</strong> Varies (China, Korea, Japan, EU)</p>
                                      <p><strong>Shipping:</strong> $0-15, variable by seller and weight</p>
                                      <p><strong>Delivery:</strong> 10-30+ business days</p>
                                    </div>
                                  </div>
                                </div>

                                {/* ── 수입 관세 — 국가별 ── */}
                                <div className="mb-4">
                                  <p className="text-[12px] font-extrabold text-slate-900 mb-2 pb-1 border-b border-slate-200">🏛️ US Import Duty — By Origin Country</p>

                                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-2.5">
                                    <p className="text-[11px] font-bold text-red-700 mb-1.5">🇨🇳 From China (AliExpress, Shein, Temu, DHgate)</p>
                                    <p className="text-[10px] text-red-600 leading-relaxed mb-2">Since <strong>Aug 2, 2025</strong>, the US <strong>eliminated the $800 de minimis exemption</strong> for Chinese goods. Every package from China now has import duties.</p>
                                    <div className="space-y-1 text-[10px]">
                                      <div className="flex justify-between"><span className="text-slate-600">Reciprocal Tariff</span><span className="font-bold text-red-600">10%</span></div>
                                      <div className="flex justify-between"><span className="text-slate-600">Fentanyl-related Tariff (IEEPA)</span><span className="font-bold text-red-600">10%</span></div>
                                      <div className="flex justify-between"><span className="text-slate-600">Section 301 (select categories)</span><span className="font-bold text-red-600">0-25%</span></div>
                                      <div className="flex justify-between border-t border-red-200 pt-1 mt-1"><span className="font-bold text-slate-700">General merchandise</span><span className="font-bold text-red-700">~20%</span></div>
                                      <div className="flex justify-between"><span className="font-bold text-slate-700">Electronics/footwear/textiles</span><span className="font-bold text-red-700">up to 37%</span></div>
                                    </div>
                                    <p className="text-[9px] text-red-400 mt-1.5">POTAL uses 20% default for general consumer goods.</p>
                                  </div>

                                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-2.5">
                                    <p className="text-[11px] font-bold text-blue-700 mb-1.5">🇰🇷🇯🇵 From South Korea &amp; Japan (YesStyle, Olive Young, Uniqlo)</p>
                                    <p className="text-[10px] text-blue-600 leading-relaxed mb-2">The <strong>$800 de minimis exemption still applies</strong>. Orders under $800 enter duty-free.</p>
                                    <div className="space-y-1 text-[10px]">
                                      <div className="flex justify-between"><span className="text-slate-600">Under $800</span><span className="font-bold text-emerald-600">Duty Free</span></div>
                                      <div className="flex justify-between"><span className="text-slate-600">Over $800 — MFN Avg.</span><span className="font-bold text-blue-600">~3-5%</span></div>
                                      <div className="flex justify-between"><span className="text-slate-600">Apparel/Textiles (over $800)</span><span className="font-bold text-blue-600">~12-15%</span></div>
                                    </div>
                                    <p className="text-[9px] text-blue-400 mt-1.5">KORUS FTA (Korea) and MFN rates (Japan) result in lower duties than China.</p>
                                  </div>

                                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-2.5">
                                    <p className="text-[11px] font-bold text-purple-700 mb-1.5">🇪🇺🇬🇧 From EU &amp; UK (ASOS, Farfetch, MyTheresa)</p>
                                    <p className="text-[10px] text-purple-600 leading-relaxed mb-2">The <strong>$800 de minimis exemption still applies</strong>. Most personal purchases enter duty-free.</p>
                                    <div className="space-y-1 text-[10px]">
                                      <div className="flex justify-between"><span className="text-slate-600">Under $800</span><span className="font-bold text-emerald-600">Duty Free</span></div>
                                      <div className="flex justify-between"><span className="text-slate-600">Over $800 — MFN Avg.</span><span className="font-bold text-purple-600">~3-6%</span></div>
                                      <div className="flex justify-between"><span className="text-slate-600">Luxury goods (over $800)</span><span className="font-bold text-purple-600">~5-10%</span></div>
                                    </div>
                                  </div>
                                </div>

                                {/* ── MPF ── */}
                                <div className="mb-4">
                                  <p className="text-[12px] font-extrabold text-slate-900 mb-2 pb-1 border-b border-slate-200">📋 Merchandise Processing Fee (MPF)</p>
                                  <div className="text-[10px] leading-relaxed text-slate-500 space-y-1">
                                    <p>US Customs (CBP) charges a processing fee on all imports:</p>
                                    <div className="bg-slate-50 rounded-lg p-2 space-y-0.5">
                                      <div className="flex justify-between"><span>Informal Entry (under $2,500)</span><span className="font-bold">$2.69 – $12.09</span></div>
                                      <div className="flex justify-between"><span>Formal Entry ($2,500+)</span><span className="font-bold">0.3464% (min $31.67)</span></div>
                                    </div>
                                    <p className="text-slate-400">Most personal purchases = informal entry. POTAL estimates <strong>~$5.50</strong>.</p>
                                    <p className="text-slate-400"><strong>Note:</strong> AliExpress/Shein/Temu may pre-pay MPF in their logistics fee.</p>
                                  </div>
                                </div>

                                {/* ── 실제 예시 ── */}
                                <div className="mb-3">
                                  <p className="text-[12px] font-extrabold text-slate-900 mb-2 pb-1 border-b border-slate-200">💰 Real Cost Examples</p>

                                  <div className="bg-red-50/50 border border-red-100 rounded-lg p-2.5 mb-2">
                                    <p className="text-[10px] font-bold text-red-700 mb-1">$50 headphones from AliExpress (China)</p>
                                    <div className="space-y-0.5 text-[10px]">
                                      <div className="flex justify-between"><span className="text-slate-500">Product</span><span>$50.00</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Shipping (Choice)</span><span className="text-emerald-600">Free</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Import Duty (20%)</span><span className="text-red-500">+$10.00</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">MPF</span><span className="text-red-500">+$5.50</span></div>
                                      <div className="flex justify-between border-t border-red-200 pt-0.5 mt-0.5"><span className="font-bold">Total Landed Cost</span><span className="font-bold text-slate-900">$65.50</span></div>
                                    </div>
                                  </div>

                                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 mb-2">
                                    <p className="text-[10px] font-bold text-blue-700 mb-1">$30 skincare from Olive Young (Korea)</p>
                                    <div className="space-y-0.5 text-[10px]">
                                      <div className="flex justify-between"><span className="text-slate-500">Product</span><span>$30.00</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>+$5.00</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Import Duty</span><span className="text-emerald-600">$0 (under $800)</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">MPF</span><span className="text-emerald-600">$0</span></div>
                                      <div className="flex justify-between border-t border-blue-200 pt-0.5 mt-0.5"><span className="font-bold">Total Landed Cost</span><span className="font-bold text-slate-900">$35.00</span></div>
                                    </div>
                                  </div>

                                  <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-2.5">
                                    <p className="text-[10px] font-bold text-purple-700 mb-1">$200 jacket from ASOS (UK)</p>
                                    <div className="space-y-0.5 text-[10px]">
                                      <div className="flex justify-between"><span className="text-slate-500">Product</span><span>$200.00</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>+$10.00</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Import Duty</span><span className="text-emerald-600">$0 (under $800)</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">MPF</span><span className="text-emerald-600">$0</span></div>
                                      <div className="flex justify-between border-t border-purple-200 pt-0.5 mt-0.5"><span className="font-bold">Total Landed Cost</span><span className="font-bold text-slate-900">$210.00</span></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 mb-2">
                                  <p className="text-[10px] font-bold text-amber-700 mb-0.5">⚠️ Important</p>
                                  <p className="text-[9px] text-amber-600 leading-relaxed">Domestic retailers (Amazon, Walmart, Best Buy, Target) ship from US warehouses — <strong>NOT</strong> subject to import duties or MPF. Only sales tax applies.</p>
                                </div>

                                <p className="text-[9px] text-slate-400 leading-relaxed">Based on US CBP tariff schedule (updated Aug 2025). Rates subject to change. For exact HS code classification: <strong>hts.usitc.gov</strong></p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${!showDomestic ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'flex flex-col gap-4'}`}>
                     {loading ? (
                        <>{[1,2,3].map(i => <ProductCardSkeleton key={i} />)}</>
                    ) : globalProducts.length > 0 ? (
                        globalProducts.slice(0, visibleCount).map((p) => renderProductCard(p))
                    ) : (
                         <div className="text-center py-10 text-slate-400 text-sm">No global results.</div>
                    )}
                </div>
            </div>
        )}
      </div>
      
      {totalResults > visibleCount && (
          <button onClick={() => setVisibleCount(visibleCount + 10)} className="w-full py-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
              Show More Results
          </button>
      )}

    </div>
  );
}