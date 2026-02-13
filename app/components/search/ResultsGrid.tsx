"use client";

import React from 'react';
// [수정 1] 아이콘 경로: 최상위 components 폴더를 찾도록 '@/' 사용 (가장 확실함)
import { Icons } from '@/components/icons'; 
// [수정 2] 스켈레톤 경로: 역시 최상위 폴더 기준 '@/' 사용
import { SkeletonCard } from '@/components/ui/SkeletonCard';
// [유지] ProductCard는 바로 위 폴더(app/components)에 있으므로 '../'가 맞음
import { ProductCard } from '../ProductCard'; 
// [유지] 타입과 컨텍스트 경로 (app/types, app/context)
import type { Product as CardProduct } from '../../types/product';
import { useWishlist } from '../../context/WishlistContext';

export interface IncomingProduct { 
  id: string; 
  title: string; 
  seller: string; 
  rating: number; 
  reviewCount: number; 
  badges: string[]; 
  price: number; 
  arrives: string; 
  shippingDays: number; 
  shipping: string; 
  shippingContext?: string; 
  thumb: string; 
  type: "domestic" | "global"; 
  keywords: string[]; 
  link?: string;
  totalPrice?: number;
  shippingPrice?: number;
  delivery?: string;
  is_prime?: boolean;
  trustScore?: number;
  variants?: any[];
}

/** Tab summary from ScoringEngine — dynamic values for Best/Cheapest/Fastest tabs */
interface TabSummaryData {
  best: { price: string; days: string } | null;
  cheapest: { price: string; days: string } | null;
  fastest: { price: string; days: string } | null;
}

interface ResultsGridProps {
  loading: boolean;
  query: string;
  sortBy: string;
  setSortBy: (s: any) => void;
  market: string;
  domesticProducts: IncomingProduct[];
  globalProducts: IncomingProduct[];
  totalResults: number;
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  isSortOpen: boolean; setIsSortOpen: (b: boolean) => void;
  isTooltipOpen: boolean; setIsTooltipOpen: (b: boolean) => void;
  isDomesticTaxOpen: boolean; setIsDomesticTaxOpen: (b: boolean) => void;
  isGlobalInfoOpen: boolean; setIsGlobalInfoOpen: (b: boolean) => void;
  activeTooltipId: string | null; setActiveTooltipId: (id: string | null) => void;
  closeAllDropdowns: () => void;
  /** Dynamic tab summary values from ScoringEngine */
  tabSummary?: TabSummaryData;
}

export function ResultsGrid({
  loading, query, sortBy, setSortBy, market, domesticProducts, globalProducts, totalResults, visibleCount, setVisibleCount,
  isSortOpen, setIsSortOpen, isTooltipOpen, setIsTooltipOpen, isDomesticTaxOpen, setIsDomesticTaxOpen, isGlobalInfoOpen, setIsGlobalInfoOpen, activeTooltipId, setActiveTooltipId, closeAllDropdowns,
  tabSummary
}: ResultsGridProps) {
  
  const showDomestic = market === "all" || market === "domestic";
  const showGlobal = market === "all" || market === "global";
  const gridLayoutClass = market === "all" ? "grid grid-cols-2 gap-6" : "w-full";
  const listLayoutClass = market === "all" ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4";

  // 데이터 매핑 함수 (옛날 데이터 -> 최신 카드 포맷)
  const mapToCardProduct = (p: IncomingProduct) => {
    return {
      id: p.id,
      name: p.title,
      site: p.seller,
      image: p.thumb,
      price: String(p.price),
      rating: p.rating,
      reviewCount: p.reviewCount,
      badges: p.badges,
      is_prime: p.is_prime || p.badges?.includes("Prime"),
      shipping: p.shipping,
      shippingContext: p.shippingContext,
      arrives: p.arrives,
      deliveryDays: String(p.shippingDays),
      link: p.link || "#",
      type: p.type,
      trustScore: p.trustScore,
      variants: p.variants
    };
  };

  return (
    <section className="flex-1 min-w-0 flex flex-col">
        {/* Sort Header */}
        <div className="flex items-center justify-between mb-6 h-[40px]">
            <div className="flex items-center gap-2">
                <span className="text-[14px] text-slate-600"><strong className="text-[#02122c]">{totalResults}</strong> results sorted by <strong>{sortBy === "best" ? "Best" : sortBy === "cheapest" ? "Cheapest" : "Fastest"}</strong></span>
                <div className="relative group">
                    <button onClick={(e) => {e.stopPropagation(); closeAllDropdowns(); setIsTooltipOpen(!isTooltipOpen)}} className="focus:outline-none">
                        <Icons.Info className="w-4 h-4 text-[#F59E0B] cursor-pointer hover:text-amber-600 transition-colors" />
                    </button>
                    {isTooltipOpen && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 bg-white shadow-2xl p-5 rounded-xl text-xs text-slate-600 border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-start mb-3"><strong className="text-[#02122c] text-sm">What is "Best"?</strong><button onClick={() => setIsTooltipOpen(false)}><Icons.X className="w-4 h-4" /></button></div>
                            <p className="leading-relaxed mb-2">Best Score is a weighted analysis of multiple factors:</p>
                            <div className="space-y-1.5">
                              <div className="flex justify-between"><span className="font-bold text-[#02122c]">Total Landed Cost</span><span className="text-slate-400">35%</span></div>
                              <div className="flex justify-between"><span className="font-bold text-[#02122c]">Delivery Speed</span><span className="text-slate-400">25%</span></div>
                              <div className="flex justify-between"><span className="font-bold text-[#02122c]">Seller Trust</span><span className="text-slate-400">20%</span></div>
                              <div className="flex justify-between"><span className="font-bold text-[#02122c]">Match Accuracy</span><span className="text-slate-400">15%</span></div>
                              <div className="flex justify-between"><span className="font-bold text-[#02122c]">Return Policy</span><span className="text-slate-400">5%</span></div>
                            </div>
                            <p className="leading-relaxed mt-2 text-slate-400">Higher score = better overall value.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Sort Tabs — dynamic values from ScoringEngine */}
        <div className="bg-white rounded-lg border border-[#e0e3eb] flex mb-6 shadow-sm h-[64px] shrink-0 relative z-40">
            {[
              { id: "best", label: "Best", val: tabSummary?.best ? `${tabSummary.best.price} · ${tabSummary.best.days}` : "—" },
              { id: "cheapest", label: "Cheapest", val: tabSummary?.cheapest ? `${tabSummary.cheapest.price} · ${tabSummary.cheapest.days}` : "—" },
              { id: "fastest", label: "Fastest", val: tabSummary?.fastest ? `${tabSummary.fastest.price} · ${tabSummary.fastest.days}` : "—" },
            ].map((tab, idx) => (
                <button key={tab.id} onClick={() => setSortBy(tab.id as any)} className={`flex-1 px-5 flex flex-col justify-center border-r border-slate-100 hover:bg-slate-50 transition-colors relative ${sortBy === tab.id ? "bg-[#f8fbff]" : ""} ${idx === 0 ? "rounded-l-lg" : ""}`}>
                {sortBy === tab.id && <div className="absolute top-0 left-0 w-full h-[3px] bg-[#02122c]" />}
                <span className={`text-[14px] font-extrabold mb-0.5 ${sortBy === tab.id ? "text-[#02122c]" : "text-slate-500"}`}>{tab.label}</span>
                <span className={`text-[13px] font-bold ${sortBy === tab.id ? "text-[#02122c]" : "text-slate-700"}`}>{tab.val}</span>
                </button>
            ))}
            <div className="w-[200px] relative border-l border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors rounded-r-lg z-10">
                <button onClick={(e) => {e.stopPropagation(); closeAllDropdowns(); setIsSortOpen(!isSortOpen)}} className="w-full h-full flex items-center justify-center gap-2 text-[14px] font-extrabold text-[#02122c] rounded-r-lg">Sort by <Icons.ChevronDown className="w-4 h-4 text-slate-500" /></button>
                {isSortOpen && (
                <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-b-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="p-2">
                        <button onClick={() => { setSortBy("best"); setIsSortOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 font-bold rounded-md">Best</button>
                        <button onClick={() => { setSortBy("cheapest"); setIsSortOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 font-bold rounded-md">Cheapest first</button>
                        <button onClick={() => { setSortBy("fastest"); setIsSortOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 font-bold rounded-md">Fastest first</button>
                    </div>
                </div>
                )}
            </div>
        </div>

        {/* Grid Area */}
        <div className={`${gridLayoutClass} mb-4 shrink-0 relative z-30`}>
            {showDomestic && (
                <div className={market === "domestic" ? "w-full" : ""}>
                    <div className="flex items-center justify-between pb-3 border-b-[3px] border-[#02122c]">
                        <div className="flex items-center gap-2">
                            <span className="text-[24px]">🇺🇸</span>
                            <h2 className="text-[20px] font-extrabold text-[#02122c]">Domestic <span className="text-[#02122c] font-normal text-sm ml-1">(Fastest)</span></h2>
                        </div>
                        <div className="relative">
                            <button onClick={(e) => {e.stopPropagation(); closeAllDropdowns(); setIsDomesticTaxOpen(!isDomesticTaxOpen)}} className="flex items-center gap-1 focus:outline-none group">
                                <Icons.Info className="w-4 h-4 text-[#F59E0B] group-hover:text-amber-600 transition-colors" />
                                <span className="text-[12px] font-bold text-[#F59E0B] group-hover:text-amber-600 transition-colors">Sales Tax Info</span>
                            </button>
                            {isDomesticTaxOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white shadow-2xl p-4 rounded-lg text-xs text-slate-600 border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-center mb-2"><strong className="text-[#02122c]">US Sales Tax</strong><button onClick={() => setIsDomesticTaxOpen(false)}><Icons.X className="w-3 h-3" /></button></div>
                                    <p>Sales tax is calculated at checkout based on your exact shipping address and state regulations.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showGlobal && (
                <div className={market === "global" ? "w-full" : ""}>
                    <div className="flex items-center justify-between pb-3 border-b-[3px] border-[#02122c]">
                        <div className="flex items-center gap-2"><span className="text-[24px]">🌏</span><h2 className="text-[20px] font-extrabold text-[#02122c]">Global <span className="text-[#02122c] font-normal text-sm ml-1">(Lowest Price)</span></h2></div>
                        <div className="relative">
                            <button onClick={(e) => {e.stopPropagation(); closeAllDropdowns(); setIsGlobalInfoOpen(!isGlobalInfoOpen)}} className="flex items-center gap-1 focus:outline-none group"><Icons.Help className="w-4 h-4 text-[#F59E0B] group-hover:text-amber-600 transition-colors" /><span className="text-[12px] font-bold text-[#F59E0B] group-hover:text-amber-600 transition-colors">Import Tax Info</span></button>
                            {isGlobalInfoOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white shadow-2xl p-4 rounded-lg text-xs text-slate-600 border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-2"><strong className="text-[#02122c]">US Import Tax (Section 321)</strong><button onClick={() => setIsGlobalInfoOpen(false)}><Icons.X className="w-3 h-3" /></button></div>
                                <p>Items under <strong>$800</strong> are duty-free entering the US. Items above $800 may be subject to duties/taxes.</p>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="flex-1 flex flex-col relative z-0">
            {totalResults === 0 ? (
            <div className="w-full py-20 text-center text-slate-500 bg-white rounded-lg border border-[#e0e3eb]">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-[#02122c]">No products found for "{query}"</h3>
                <p className="text-sm">Try adjusting your filters or search terms.</p>
            </div>
            ) : (
            <div className={gridLayoutClass}>
                {loading ? (
                    <>
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </>
                ) : (
                    <>
                        {showDomestic && (
                            <div className={listLayoutClass}>
                            {domesticProducts.slice(0, visibleCount).map(p => (
                                <ProductCard 
                                    key={p.id} 
                                    product={mapToCardProduct(p)} 
                                    type="domestic"
                                />
                            ))}
                            </div>
                        )}
                        {showGlobal && (
                            <div className={listLayoutClass}>
                            {globalProducts.slice(0, visibleCount).map(p => (
                                <ProductCard 
                                    key={p.id} 
                                    product={mapToCardProduct(p)} 
                                    type="international"
                                />
                            ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            )}
            
            {!loading && totalResults > visibleCount * 2 && (
            <div className="flex justify-center pb-8 mt-4">
                <button onClick={() => setVisibleCount(prev => prev + 20)} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-[#02122c] font-extrabold text-[16px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">Show more results <Icons.ChevronDown className="w-5 h-5" /></button>
            </div>
            )}
        </div>
    </section>
  );
}