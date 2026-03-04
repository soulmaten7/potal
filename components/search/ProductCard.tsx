"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useWishlist } from '@/app/context/WishlistContext';
import { normalizeDeliveryInfo } from '@/app/lib/utils/DeliveryStandard';
import { DeliveryBadge } from '@/components/search/DeliveryBadge';
import { TaxInfoPopup } from '@/components/search/TaxInfoPopup';
import { getRetailerConfig, matchShippingProgram } from '@/app/lib/retailerConfig';
import { trackAffiliateClick, trackShare } from '@/app/utils/analytics';

interface ProductCardProps {
  product: {
    id: string;
    title?: string;
    name?: string;
    price: string | number;
    image?: string;
    thumb?: string;
    seller?: string;
    site?: string;
    rating?: number;
    reviewCount?: number;
    badges?: string[];
    is_prime?: boolean;
    shipping?: string;
    delivery?: string;
    shippingContext?: string;
    arrives?: string;
    deliveryDays?: string;
    link?: string;
    type?: string;
    trustScore?: number;
    [key: string]: any;
  };
  type?: "domestic" | "international" | "global" | string;
  compact?: boolean;
  dense?: boolean;
  onWishlistChange?: (added: boolean) => void;
  onProductClick?: (product: any) => void;
}

/** 플랫폼별 브랜드 컬러 */
const PLATFORM_COLORS: Record<string, { color: string; bg: string }> = {
  amazon:     { color: 'text-[#FF9900]', bg: 'bg-[#FF9900]/10' },
  walmart:    { color: 'text-[#0071ce]', bg: 'bg-[#0071ce]/10' },
  target:     { color: 'text-[#CC0000]', bg: 'bg-[#CC0000]/10' },
  'best buy': { color: 'text-[#003b64]', bg: 'bg-[#003b64]/10' },
  bestbuy:    { color: 'text-[#003b64]', bg: 'bg-[#003b64]/10' },
  ebay:       { color: 'text-[#e53238]', bg: 'bg-[#e53238]/10' },
  aliexpress: { color: 'text-[#FF4747]', bg: 'bg-[#FF4747]/10' },
  temu:       { color: 'text-[#FB7701]', bg: 'bg-[#FB7701]/10' },
  shein:      { color: 'text-[#000]',    bg: 'bg-black/5' },
  iherb:      { color: 'text-[#458500]', bg: 'bg-[#458500]/10' },
  // ── New Serper Google Shopping providers (2026-02-24) ──
  'home depot': { color: 'text-[#F96302]', bg: 'bg-[#F96302]/10' },
  homedepot:   { color: 'text-[#F96302]', bg: 'bg-[#F96302]/10' },
  "lowe's":    { color: 'text-[#004990]', bg: 'bg-[#004990]/10' },
  lowes:       { color: 'text-[#004990]', bg: 'bg-[#004990]/10' },
  nordstrom:   { color: 'text-[#000]',    bg: 'bg-black/5' },
  ikea:        { color: 'text-[#0058A3]', bg: 'bg-[#0058A3]/10' },
  wayfair:     { color: 'text-[#7B0E7B]', bg: 'bg-[#7B0E7B]/10' },
  newegg:      { color: 'text-[#F7A600]', bg: 'bg-[#F7A600]/10' },
  sephora:     { color: 'text-[#000]',    bg: 'bg-black/5' },
  etsy:        { color: 'text-[#F1641E]', bg: 'bg-[#F1641E]/10' },
  mercari:     { color: 'text-[#4DC9F6]', bg: 'bg-[#4DC9F6]/10' },
  asos:        { color: 'text-[#2D2D2D]', bg: 'bg-[#2D2D2D]/10' },
  farfetch:    { color: 'text-[#000]',    bg: 'bg-black/5' },
  yesstyle:    { color: 'text-[#E91E8C]', bg: 'bg-[#E91E8C]/10' },
  'yes style': { color: 'text-[#E91E8C]', bg: 'bg-[#E91E8C]/10' },
  mytheresa:   { color: 'text-[#000]',    bg: 'bg-black/5' },
};

function getPlatformColor(seller: string) {
  const key = seller.toLowerCase().trim();
  return PLATFORM_COLORS[key] || null;
}

/** Skeleton placeholder for loading state */
export function ProductCardSkeleton() {
  return (
    <>
      <div className="hidden md:flex bg-white border border-[#e0e3eb] rounded-lg shadow-sm h-[210px] overflow-hidden animate-pulse">
        <div className="w-[140px] h-full shrink-0 border-r border-slate-100 bg-slate-100" />
        <div className="flex-1 p-4 flex flex-col justify-start border-r border-slate-100 gap-3">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
        </div>
        <div className="w-[170px] flex flex-col bg-slate-50/30 min-w-[170px]">
          <div className="flex-1 p-3 flex flex-col items-end justify-center gap-2">
            <div className="h-6 w-16 bg-slate-200 rounded" />
            <div className="h-[30px] w-full bg-slate-200 rounded" />
          </div>
        </div>
      </div>
      <div className="md:hidden bg-white border border-[#e0e3eb] rounded-xl shadow-sm overflow-hidden animate-pulse">
        <div className="flex p-3 gap-3">
          <div className="w-20 h-20 rounded-lg bg-slate-100 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-slate-100">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-5 w-14 bg-slate-200 rounded" />
          <div className="h-8 w-20 bg-slate-200 rounded" />
        </div>
      </div>
    </>
  );
}

/** Empty state when no results found */
export function EmptySearchState({ query, onRetry }: { query: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-lg font-bold text-[#02122c] mb-2">
        No results for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-md">
        Try different keywords or check the spelling. You can also browse by category below.
      </p>
      {onRetry && (
        <button onClick={onRetry} className="px-6 py-2.5 bg-[#02122c] hover:bg-[#F59E0B] text-white text-sm font-bold rounded-lg transition-colors">
          Clear & Try Again
        </button>
      )}
    </div>
  );
}

export function ProductCard({ product, type = "domestic" }: ProductCardProps) {
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isSaved = isInWishlist(product.id);
  const [redirecting, setRedirecting] = useState(false);
  const [showTaxPopup, setShowTaxPopup] = useState(false);
  const taxPopupRef = useRef<HTMLDivElement>(null);

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    if (!showTaxPopup) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (taxPopupRef.current && !taxPopupRef.current.contains(e.target as Node)) {
        setShowTaxPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTaxPopup]);

  // 데이터 정규화
  const displayTitle = product.title || product.name || "Untitled Product";
  const displayImage = product.thumb || product.image || "";
  const displaySeller = product.seller || product.site || "Unknown Seller";
  const displayPrice = typeof product.price === 'string' ? product.price : `$${product.price}`;
  const priceNum = parseFloat(String(displayPrice).replace(/[^0-9.-]/g, ""));

  // Platform color
  const platformColor = getPlatformColor(displaySeller);
  const deliveryInfo = normalizeDeliveryInfo({
    deliveryDays: product.deliveryDays || product.arrives,
    is_prime: product.is_prime,
    site: product.site || product.seller,
    shipping: product.shipping,
    delivery: product.delivery,
    price: String(product.price ?? ''),
    appliedMembership: product.appliedMembership,
    membershipAdjusted: product.membershipAdjusted,
  });

  const retailerConf = getRetailerConfig(displaySeller);
  const shippingProg = retailerConf ? matchShippingProgram(retailerConf, product) : null;

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) removeFromWishlist(product.id);
    else addToWishlist(product);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = product.link || window.location.href;
    const vendor = product.seller || product.site || 'unknown';
    if (navigator.share) {
      trackShare({ productName: displayTitle, vendor, method: 'native' });
      navigator.share({ title: displayTitle, url }).catch(() => {});
    } else {
      trackShare({ productName: displayTitle, vendor, method: 'clipboard' });
      navigator.clipboard.writeText(url).then(() => {}).catch(() => {});
    }
  };

  const handleViewDeal = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = product.link || "#";
    if (!url || url === "#") return;
    trackAffiliateClick({
      productName: displayTitle,
      price: priceNum,
      vendor: product.seller || product.site || 'unknown',
      url,
    });
    setRedirecting(true);
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      setRedirecting(false);
    }, 800);
  };

  // Total price 계산
  const isGlobal = type === "global" || type === "international" || product.type === "global";
  const hasTotal = product.totalPrice != null && product.totalPrice > 0 && product.totalPrice !== priceNum;
  const totalDisplay = hasTotal ? `$${product.totalPrice.toFixed(2)}` : null;
  const extraFees = hasTotal ? Math.max(0, product.totalPrice - priceNum) : 0;

  // Global은 항상 breakdown 표시
  const showBreakdown = hasTotal || isGlobal;
  const finalTotal = totalDisplay || displayPrice;

  // Shipping cost (데스크톱 + 모바일 공통)
  const shipCostDisplay = deliveryInfo.cost && /free/i.test(deliveryInfo.cost) ? 'Free' : deliveryInfo.cost || 'Free';
  const isShipFree = shipCostDisplay === 'Free';

  // 가격 범위 (AliExpress 옵션별 가격차가 클 때)
  const hasPriceRange = product.priceRangeMin != null && product.priceRangeMin > 0 && product.priceRangeMin < priceNum * 0.5;

  // Fraud warning
  const fraudText = product.fraudFlags && product.fraudFlags.length > 0
    ? (product.fraudFlags.includes('price_too_low') ? '⚠ Unusually low price'
      : product.fraudFlags.includes('low_seller_trust') ? '⚠ Low seller trust'
      : product.fraudFlags.includes('brand_typo_suspected') ? '⚠ Possible knockoff'
      : '⚠ Flagged')
    : null;

  const redirectOverlay = redirecting && typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#02122c] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#02122c]">Connecting to {displaySeller}...</p>
      </div>
    </div>,
    document.body
  );

  // ═══════════════════════════════════════════════════════
  // SEARCH CARD — 사이트 검색 CTA 카드
  // ═══════════════════════════════════════════════════════
  if (product.isSearchCard) {
    const tagline = product.searchCardTagline || '';
    const siteName = displaySeller;
    const siteUrl = product.link || '#';
    const platform = getPlatformColor(displaySeller);
    const bgColor = platform?.bg || 'bg-slate-50';

    return (
      <>
        {/* Desktop Search Card */}
        <div className="hidden md:flex bg-white border border-dashed border-slate-300 rounded-lg shadow-sm h-[190px] overflow-hidden hover:border-[#F59E0B] hover:shadow-md transition-all duration-200 group">
          <div className={`w-[140px] h-full shrink-0 border-r border-slate-100 ${bgColor} flex flex-col items-center justify-center gap-3 p-4`}>
            <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center p-2">
              {displayImage ? (
                <img src={displayImage} alt={`Search on ${siteName}`} loading="lazy" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span className={`text-lg font-extrabold ${platform?.color || 'text-slate-600'}`}>{siteName.slice(0, 3)}</span>
              )}
            </div>
          </div>
          <div className="flex-1 p-5 flex flex-col justify-center border-r border-slate-100 gap-2">
            <span className={`text-[10px] font-bold ${platform?.color || 'text-slate-500'} tracking-wider`}>SEARCH CARD</span>
            <h3 className="text-base font-bold text-[#02122c] leading-snug">Search on {siteName}</h3>
            {tagline && <p className="text-sm text-slate-500 italic">{tagline}</p>}
            <span className="text-xs text-slate-400">Est. {product.deliveryDays || '7-14 Days'} · International Shipping</span>
          </div>
          <div className="w-[170px] min-w-[170px] flex flex-col items-center justify-center gap-3 p-4 bg-slate-50/50">
            <p className="text-xs text-slate-400 text-center">Compare prices directly</p>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-[#02122c] hover:bg-[#F59E0B] text-white text-sm font-bold rounded-lg transition-colors text-center block">
              Search {siteName} →
            </a>
          </div>
        </div>
        {/* Mobile Search Card */}
        <div className="md:hidden bg-white border border-dashed border-slate-300 rounded-xl shadow-sm overflow-hidden active:scale-[0.99] transition-all duration-150">
          <div className="flex items-center p-3 gap-3">
            <div className={`w-12 h-12 shrink-0 rounded-lg ${bgColor} flex items-center justify-center p-1.5`}>
              {displayImage ? (
                <img src={displayImage} alt={`Search on ${siteName}`} loading="lazy" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span className={`text-sm font-extrabold ${platform?.color || 'text-slate-400'}`}>{siteName.slice(0, 3)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-bold ${platform?.color || 'text-slate-500'}`}>SEARCH CARD</span>
              <p className="text-sm font-bold text-[#02122c] truncate">Search on {siteName}</p>
            </div>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 px-3 py-2 bg-[#02122c] hover:bg-[#F59E0B] text-white text-xs font-bold rounded-lg transition-colors">
              Go →
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
       {/* ═══ DESKTOP CARD (md+) ═══ */}
       <div className="hidden md:flex bg-white border border-[#e0e3eb] rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 h-[210px] group relative z-0 overflow-hidden">

          {/* 1. 좌측 이미지 — 우측상단 공유 + 하트 */}
          <div className="w-[140px] h-full shrink-0 border-r border-slate-100 bg-white relative p-3 flex items-center justify-center">
             <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
               <button onClick={handleShare} className="p-1 rounded-full bg-black/10 hover:bg-black/20 transition-all active:scale-90 cursor-pointer">
                 <Icons.Share className="w-3.5 h-3.5 text-slate-500" />
               </button>
               <button onClick={handleToggleSave} className="p-1 rounded-full bg-black/10 hover:bg-black/20 transition-all active:scale-90 cursor-pointer">
                 {isSaved ?
                   <Icons.HeartFilled className="w-3.5 h-3.5 text-red-500" /> :
                   <Icons.Heart className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                 }
               </button>
             </div>
             <img src={displayImage} alt={displayTitle} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />
          </div>

          {/* 2. 중앙 정보 */}
          <div className="flex-1 p-4 flex flex-col justify-between border-r border-slate-100 min-w-0">
             {/* 셀러 + 평점 + 리뷰 + Prime 뱃지 (한 줄) */}
             <div className="flex items-center gap-2 mb-0.5">
                 <span className={`text-[14px] font-extrabold uppercase tracking-wide ${platformColor?.color || 'text-[#02122c]'}`}>
                    {displaySeller}
                 </span>
                 <span className="text-slate-300">/</span>
                 {product.sellerFeedbackPercent ? (
                   /* eBay: 판매자 피드백 표시 */
                   <div className="flex items-center gap-1">
                     <span className="text-[12px] font-bold text-emerald-600">{product.sellerFeedbackPercent}%</span>
                     <span className="text-[11px] text-slate-400">positive</span>
                     {product.sellerFeedbackCount ? (
                       <span className="text-[11px] text-slate-400">({product.sellerFeedbackCount >= 1000 ? `${(product.sellerFeedbackCount / 1000).toFixed(1)}K` : product.sellerFeedbackCount})</span>
                     ) : null}
                   </div>
                 ) : (
                   /* 일반 사이트: 별점 + 리뷰 수 */
                   <div className="flex items-center gap-1">
                     <Icons.Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                     <span className="text-[13px] font-bold text-slate-900">{product.rating || 0}</span>
                     <span className="text-[11px] text-slate-400">({product.reviewCount?.toLocaleString() || 0})</span>
                   </div>
                 )}
             </div>

             {/* 상품명 */}
             <h3 className="text-[14px] font-medium text-[#02122c] leading-snug line-clamp-2 group-hover:text-[#F59E0B] transition-colors flex-1">
                {displayTitle}
             </h3>

             {/* 하단: Fraud 경고 */}
             {fraudText && (
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">{fraudText}</span>
               </div>
             )}
          </div>

          {/* 3. 우측 — 통일된 비용 breakdown (API 실제 데이터만) */}
          <div className="w-[170px] flex flex-col min-w-[170px]">
             {/* 배송 뱃지 (API에서 가져온 실제 정보) */}
             <div className="w-full px-3 pt-2 pb-1 flex flex-col items-end justify-center">
                <DeliveryBadge info={deliveryInfo} compact hideCost deliveryVariant={type === "domestic" ? "domestic" : "international"} />
             </div>

             {/* 비용 breakdown — Shipping → Tax/Duty → Product → Total */}
             <div className="w-full flex-1 px-3 pb-3 flex flex-col items-end justify-center gap-[4px]">
                 {/* Shipping */}
                 <div className="flex items-center gap-1.5">
                   <span className="text-[11px] text-slate-400">Shipping</span>
                   {isShipFree ? (
                     <span className="text-[13px] font-extrabold text-emerald-600">Free</span>
                   ) : (
                     <span className="text-[13px] font-bold text-slate-600">{shipCostDisplay}</span>
                   )}
                 </div>

                 {/* Tax or Duty+MPF — 항상 1줄 (PC: 팝업, 모바일: 페이지 이동) */}
                 <div className="flex items-center gap-1.5 relative">
                   <span className="text-[11px] text-slate-400">{isGlobal ? 'Duty+MPF' : 'Est. Tax'}</span>
                   <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTaxPopup(!showTaxPopup); }} className="p-0 border-0 bg-transparent cursor-pointer">
                     <Icons.Info className="w-2.5 h-2.5 text-slate-300 hover:text-[#F59E0B]" />
                   </button>
                   {isGlobal ? (
                     <span className="text-[13px] font-bold text-red-500">+${(extraFees > 0 ? extraFees : ((priceNum || 0) * 0.20) + 5.50).toFixed(2)}</span>
                   ) : (
                     <span className="text-[13px] font-bold text-slate-600">+${(extraFees > 0 ? extraFees : (priceNum || 0) * 0.07).toFixed(2)}</span>
                   )}

                   {/* PC Tax Info 팝업 — 외부 클릭 시 닫힘 */}
                   <TaxInfoPopup
                     ref={taxPopupRef}
                     isVisible={showTaxPopup}
                     onClose={() => setShowTaxPopup(false)}
                     type={isGlobal ? 'global' : 'domestic'}
                   />
                 </div>

                 {/* Product */}
                 <div className="flex items-center gap-1.5">
                   <span className="text-[11px] text-slate-400">Product</span>
                   <span className="text-[13px] font-bold text-slate-600">{displayPrice}</span>
                 </div>

                 {/* 가격 범위 경고 */}
                 {hasPriceRange && (
                   <span className="text-[10px] text-amber-600 font-medium">⚠ Price varies by option</span>
                 )}

                 {/* Divider + Total — Total Landed Cost 위, 가격 아래 */}
                 <div className="w-full border-t border-dashed border-slate-200 my-0.5" />
                 <span className="text-[10px] font-bold text-emerald-600">Total Landed Cost{hasPriceRange ? ' (est.)' : ''}</span>
                 <div className="text-[24px] font-extrabold text-[#02122c] leading-none">{finalTotal}</div>

                 <button onClick={handleViewDeal} className="w-full h-[32px] mt-1.5 bg-[#02122c] hover:bg-[#F59E0B] text-white text-[13px] font-extrabold rounded-[4px] flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer">
                    Select <Icons.ArrowRight className="w-3 h-3" />
                 </button>
             </div>
          </div>
       </div>

       {/* ═══ MOBILE CARD (<md) ═══ */}
       <div className="md:hidden bg-white border border-[#e0e3eb] rounded-xl shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-150 group relative z-0 overflow-hidden">
          <div className="flex p-3 gap-3">
             {/* 이미지 — 우측상단 공유 + 하트 */}
             <div className="w-20 h-20 shrink-0 bg-white rounded-lg border border-slate-100 relative flex items-center justify-center p-1.5">
                <div className="absolute -top-0.5 -right-0.5 z-10 flex items-center gap-0.5">
                  <button onClick={handleShare} className="p-0.5 rounded-full bg-black/10 transition-transform active:scale-90 cursor-pointer">
                    <Icons.Share className="w-3 h-3 text-slate-500" />
                  </button>
                  <button onClick={handleToggleSave} className="p-0.5 rounded-full bg-black/10 transition-transform active:scale-90 cursor-pointer">
                    {isSaved ?
                      <Icons.HeartFilled className="w-3 h-3 text-red-500" /> :
                      <Icons.Heart className="w-3 h-3 text-slate-400" />
                    }
                  </button>
                </div>
                <img src={displayImage} alt={displayTitle} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />
             </div>

             {/* 정보 */}
             <div className="flex-1 min-w-0 flex flex-col">
                {/* 셀러 + 평점 + 리뷰 + Prime (한 줄) */}
                <div className="flex items-center gap-1 mb-0.5">
                   <span className={`text-[11px] font-extrabold uppercase tracking-wide ${platformColor?.color || 'text-[#02122c]'}`}>{displaySeller}</span>
                   <span className="text-slate-300 text-[10px]">/</span>
                   {product.sellerFeedbackPercent ? (
                     <>
                       <span className="text-[10px] font-bold text-emerald-600">{product.sellerFeedbackPercent}%</span>
                       <span className="text-[9px] text-slate-400">positive</span>
                     </>
                   ) : (
                     <>
                       <Icons.Star className="w-3 h-3 text-[#F59E0B]" />
                       <span className="text-[11px] font-bold text-slate-700">{product.rating || 0}</span>
                       <span className="text-[10px] text-slate-400">({product.reviewCount?.toLocaleString() || 0})</span>
                     </>
                   )}
                </div>
                <h3 className="text-[13px] font-medium text-[#02122c] leading-snug line-clamp-2 group-hover:text-[#F59E0B] transition-colors">
                   {displayTitle}
                </h3>
             </div>
          </div>

          {/* 하단: 배송 + 비용 breakdown (PC와 동일) + 버튼 */}
          <div className="px-3 pb-3 pt-1 border-t border-slate-100">
             {/* 배송 뱃지 */}
             <div className="mb-1.5">
                <DeliveryBadge info={deliveryInfo} compact hideCost deliveryVariant={type === "domestic" ? "domestic" : "international"} />
             </div>

             {/* Fraud 경고 */}
             {fraudText && <span className="text-[9px] font-bold text-amber-600 mb-1 block">{fraudText}</span>}

             {/* 비용 breakdown — PC와 동일 */}
             <div className="flex flex-col gap-[2px] mb-1.5">
                {/* Shipping */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Shipping</span>
                  {isShipFree ? (
                    <span className="text-[11px] font-bold text-emerald-600">Free</span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500">{shipCostDisplay}</span>
                  )}
                </div>

                {/* Tax or Duty+MPF — 항상 1줄 (Domestic/Global 통일) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">{isGlobal ? 'Duty+MPF' : 'Est. Tax'}</span>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(isGlobal ? '/tax-info?type=import' : '/tax-info?type=sales'); }} className="p-0 border-0 bg-transparent cursor-pointer">
                      <Icons.Info className="w-3 h-3 text-slate-300 hover:text-[#F59E0B]" />
                    </button>
                  </div>
                  {isGlobal ? (
                    <span className="text-[11px] font-bold text-red-500">+${(extraFees > 0 ? extraFees : ((priceNum || 0) * 0.20) + 5.50).toFixed(2)}</span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500">+${(extraFees > 0 ? extraFees : (priceNum || 0) * 0.07).toFixed(2)}</span>
                  )}
                </div>

                {/* Product */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Product</span>
                  <span className="text-[11px] font-bold text-slate-500">{displayPrice}</span>
                </div>

                {/* 가격 범위 경고 */}
                {hasPriceRange && (
                  <span className="text-[9px] text-amber-600 font-medium">⚠ Price varies by option</span>
                )}
             </div>

             {/* Total + Select 버튼 */}
             <div className="border-t border-dashed border-slate-200 pt-1.5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-emerald-600">Total Landed Cost{hasPriceRange ? ' (est.)' : ''}</span>
                  <span className="text-[18px] font-extrabold text-[#02122c] leading-none">{finalTotal}</span>
                </div>
                <button onClick={handleViewDeal} className="shrink-0 h-8 px-5 bg-[#02122c] hover:bg-[#F59E0B] text-white text-[12px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer">
                   Select <Icons.ArrowRight className="w-3 h-3" />
                </button>
             </div>
          </div>
       </div>

       {redirectOverlay}
    </>
  );
}
