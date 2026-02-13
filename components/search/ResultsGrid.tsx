"use client";

import React from 'react';
import { Icons, StarIcon, InfoIcon, ChevronDownIcon } from '../icons';

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
}

export function ResultsGrid({
  loading, query, sortBy, setSortBy, market,
  domesticProducts, globalProducts, totalResults,
  visibleCount, setVisibleCount,
  isSortOpen, setIsSortOpen,
  isTooltipOpen, setIsTooltipOpen,
  isDomesticTaxOpen, setIsDomesticTaxOpen,
  isGlobalInfoOpen, setIsGlobalInfoOpen,
  activeTooltipId, setActiveTooltipId,
  closeAllDropdowns, tabSummary
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
  
  // [ProductCard] 개별 상품 카드
  const ProductCard = ({ product }: { product: Product }) => {
    const isDomestic = product.type === "domestic";
    const arrivalText = product.arrives.toLowerCase().includes('arrives') 
      ? product.arrives 
      : `Arrives ${product.arrives}`;

    // [Badge Logic] 판매처별 전용 배지 (Prime, Walmart+ 등)
    const getSellerBadge = (sellerName: string) => {
        const lowerName = sellerName.toLowerCase();
        if (lowerName.includes('amazon')) return <span className="bg-[#00A8E1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded ml-1.5">Prime</span>;
        if (lowerName.includes('walmart')) return <span className="bg-[#0071DC] text-white text-[10px] font-bold px-1.5 py-0.5 rounded ml-1.5">W+</span>;
        if (lowerName.includes('ebay')) return <span className="bg-[#F5F5F5] text-[#E53238] border border-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1.5">Top Rated</span>;
        return null;
    };

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex gap-5 h-[200px]">
        
        {/* 1. 이미지 (140px) */}
        <div className="w-[140px] flex-shrink-0 relative bg-white rounded-lg overflow-hidden flex items-center justify-center">
            <button className="absolute top-0 left-0 text-slate-300 hover:text-red-500 transition-colors z-10">
                <Icons.Heart className="w-5 h-5" />
            </button>
            <img src={product.thumb} alt={product.title} className="max-w-full max-h-full object-contain" />
        </div>

        {/* 2. 정보 (가운데) */}
        <div className="flex-1 flex flex-col min-w-0 py-1">
            {/* Seller Name + Rating + BADGE(Prime 등) */}
            <div className="flex items-center flex-wrap gap-y-1 mb-1">
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900">{product.seller}</span>
                {/* [FIX] 판매처 배지 부활 */}
                {getSellerBadge(product.seller)}
                
                <div className="flex items-center text-[#F59E0B] text-xs font-bold gap-0.5 ml-2 border-l border-slate-200 pl-2 h-3">
                    <StarIcon className="w-3.5 h-3.5 fill-current" />
                    <span>{product.rating}</span>
                    <span className="text-slate-400 font-medium">({product.reviewCount})</span>
                </div>
            </div>
            
            <h3 className="font-medium text-[15px] text-slate-900 leading-snug line-clamp-2 mb-2 h-[42px]">
                {product.title}
            </h3>

            <div className="flex flex-wrap gap-1.5 mt-1">
                {product.badges.map((badge, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded flex items-center gap-1">
                        {badge}
                    </span>
                ))}
            </div>
        </div>

        {/* 3. 가격/배송 (우측 칼각 정렬 - 200px 확보) */}
        {/* [FIX] 너비 200px로 확장하여 정보 구겨짐 방지 */}
        <div className="w-[200px] flex-shrink-0 flex flex-col justify-between items-end border-l border-slate-100 pl-4 py-0.5 text-right">
            <div className="flex flex-col items-end w-full">
                <div className="text-[13px] font-bold text-slate-900 leading-tight mb-0.5">
                    {product.shipping} 
                </div>
                <div className="text-[11px] font-medium text-slate-400 leading-tight">
                    {product.shippingContext}
                </div>
                 <div className="text-[11px] font-medium text-slate-600 leading-tight mt-1">
                    {isDomestic ? "+ Tax" : "No Import Tax"}
                </div>
                <div className="text-[12px] font-bold text-green-600 leading-tight mt-1">
                     {arrivalText}
                </div>
            </div>

            <div className="flex flex-col items-end w-full gap-2 mt-auto">
                <div className="text-2xl font-extrabold text-slate-900 leading-none">
                    ${product.price.toLocaleString()}
                </div>
                {/* [FIX] Select 버튼: 다시 묵직하고 크게 복구 (Dark Navy) */}
                <button className="w-full h-[40px] bg-[#02122c] hover:bg-[#1a2b4a] text-white text-[14px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm">
                    Select <Icons.ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>

      </div>
    );
  };

  const showDomestic = market === "all" || market === "domestic";
  const showGlobal = market === "all" || market === "global";

  return (
    <div className="flex-1 flex flex-col gap-6">
      
      {/* (1) 상단 텍스트 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-slate-700">
                <span className="text-slate-900 font-extrabold">{totalResults}</span> results sorted by <span className="text-[#F59E0B] capitalize">{sortBy}</span>
            </span>
        </div>
      </div>

      {/* (2) 요약 카드 & Sort By - 통합 Grid (4칸) */}
      <div className="grid grid-cols-4 gap-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-x divide-slate-100">
         
         <button onClick={() => setSortBy("best")} className={`p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors ${sortBy === 'best' ? 'bg-slate-50 border-b-2 border-[#02122c]' : ''}`}>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Best</span>
            <span className="text-lg font-extrabold text-slate-900">{tabSummary?.best ? `${tabSummary.best.price} · ${tabSummary.best.days}` : '—'}</span>
         </button>

         <button onClick={() => setSortBy("cheapest")} className={`p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors ${sortBy === 'cheapest' ? 'bg-slate-50 border-b-2 border-[#02122c]' : ''}`}>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cheapest</span>
            <span className="text-lg font-extrabold text-slate-900">{tabSummary?.cheapest ? `${tabSummary.cheapest.price} · ${tabSummary.cheapest.days}` : '—'}</span>
         </button>

         <button onClick={() => setSortBy("fastest")} className={`p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors ${sortBy === 'fastest' ? 'bg-slate-50 border-b-2 border-[#02122c]' : ''}`}>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fastest</span>
            <span className="text-lg font-extrabold text-slate-900">{tabSummary?.fastest ? `${tabSummary.fastest.price} · ${tabSummary.fastest.days}` : '—'}</span>
         </button>
         
         {/* [FIX] Sort By: 텍스트 스타일 복구 및 파노라마(Full Expansion) 드롭다운 */}
         <div className="relative flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsSortOpen(!isSortOpen); }}>
             <div className="flex items-center gap-2">
                {/* 텍스트 크기/색상 다른 버튼들과 통일감 있게 조정 */}
                <span className="text-sm font-bold text-slate-700">Sort by</span>
                <ChevronDownIcon className="w-4 h-4 text-slate-500" />
             </div>
             
             {/* Dropdown Menu */}
             {isSortOpen && (
                <div className="absolute top-full right-0 mt-0 w-full bg-white border-t border-slate-200 shadow-xl z-50 animate-fadeIn">
                    {["best", "cheapest", "fastest"].map((opt) => (
                        <button key={opt} onClick={(e) => { e.stopPropagation(); setSortBy(opt as any); setIsSortOpen(false); }} className="w-full text-center px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 capitalize border-b border-slate-50 last:border-0">
                            {opt}
                        </button>
                    ))}
                </div>
             )}
         </div>
      </div>

      {/* (3) 메인 상품 리스트 */}
      <div className="grid grid-cols-2 gap-8">
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
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 animate-fadeIn text-left">
                                <h4 className="font-bold text-slate-900 mb-2 text-sm">Domestic Sales Tax</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Sales tax is calculated based on the shipping address (State) at checkout. Prices shown do not include tax.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {loading ? (
                        <div className="h-[200px] bg-slate-100 rounded-xl animate-pulse" />
                    ) : domesticProducts.length > 0 ? (
                        domesticProducts.slice(0, visibleCount).map((p) => <ProductCard key={p.id} product={p} />)
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
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 animate-fadeIn text-left">
                                <h4 className="font-bold text-slate-900 mb-2 text-sm">Global Import Tax</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Imports under $200 USD are generally duty-free in South Korea. Amounts exceeding this may incur VAT & Duties.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                     {loading ? (
                        <div className="h-[200px] bg-slate-100 rounded-xl animate-pulse" />
                    ) : globalProducts.length > 0 ? (
                        globalProducts.slice(0, visibleCount).map((p) => <ProductCard key={p.id} product={p} />)
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