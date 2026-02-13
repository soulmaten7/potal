"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
// [경로] 아이콘 경로가 확실하지 않다면 @/components/icons를 시도합니다.
// 에러나면 '../../../components/icons' 로 바꿔보세요.
import { Icons } from '@/components/icons'; 
import { useWishlist } from '../context/WishlistContext';

// [중요] page.tsx나 ResultsGrid에서 넘겨주는 모든 props를 받아줄 준비를 해야 에러가 안 납니다.
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
    type?: string; // domestic, global 등
    trustScore?: number;
    [key: string]: any; // 유연성을 위해 추가
  };
  // [중요] 부모(page.tsx)에서 type을 내려주므로 받아야 함
  type?: "domestic" | "international" | "global" | string;
  compact?: boolean;
  dense?: boolean;
  onWishlistChange?: (added: boolean) => void;
  onProductClick?: (product: any) => void;
}

/** Best Score → 색상/라벨 */
function getScoreBadge(score?: number): { color: string; bg: string; label: string } | null {
  if (score == null || score <= 0) return null;
  if (score >= 80) return { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Excellent' };
  if (score >= 60) return { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Good' };
  if (score >= 40) return { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Fair' };
  return { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Low' };
}

/** Trust Score → 아이콘/색상 */
function getTrustSignal(score?: number): { icon: string; color: string; label: string } | null {
  if (score == null) return null;
  if (score >= 70) return { icon: '🛡️', color: 'text-emerald-600', label: 'Trusted' };
  if (score >= 40) return { icon: '⚠️', color: 'text-amber-600', label: 'Caution' };
  return { icon: '🚩', color: 'text-red-500', label: 'Risky' };
}

/** Skeleton placeholder for loading state */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-[#e0e3eb] rounded-lg shadow-sm flex h-[220px] overflow-hidden animate-pulse">
      {/* 이미지 영역 */}
      <div className="w-[140px] h-full shrink-0 border-r border-slate-100 bg-slate-100" />
      {/* 중앙 정보 */}
      <div className="flex-1 p-5 flex flex-col justify-start border-r border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="h-4 w-12 bg-slate-200 rounded" />
        </div>
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-3/4 bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded mt-auto" />
      </div>
      {/* 우측 정보 */}
      <div className="w-[170px] flex flex-col bg-slate-50/30 min-w-[170px]">
        <div className="p-3 border-b border-slate-200 h-[55px] flex items-center justify-end">
          <div className="h-3 w-24 bg-slate-200 rounded" />
        </div>
        <div className="px-3 h-[32px] border-b border-slate-200 flex items-center justify-end">
          <div className="h-3 w-16 bg-slate-200 rounded" />
        </div>
        <div className="px-3 h-[32px] border-b border-slate-200 flex items-center justify-end">
          <div className="h-3 w-20 bg-slate-200 rounded" />
        </div>
        <div className="flex-1 p-3 flex flex-col items-end justify-center gap-2">
          <div className="h-6 w-16 bg-slate-200 rounded" />
          <div className="h-[30px] w-full bg-slate-200 rounded" />
        </div>
      </div>
    </div>
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
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-[#02122c] hover:bg-[#F59E0B] text-white text-sm font-bold rounded-lg transition-colors"
        >
          Clear & Try Again
        </button>
      )}
    </div>
  );
}

export function ProductCard({ product, type = "domestic" }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isSaved = isInWishlist(product.id);
  const [redirecting, setRedirecting] = useState(false);

  // 데이터 정규화
  const displayTitle = product.title || product.name || "Untitled Product";
  const displayImage = product.thumb || product.image || "";
  const displaySeller = product.seller || product.site || "Unknown Seller";
  const displayPrice = typeof product.price === 'string' ? product.price : `$${product.price}`;
  const priceNum = parseFloat(String(displayPrice).replace(/[^0-9.-]/g, ""));

  // Score & Trust
  const scoreBadge = getScoreBadge(product.bestScore);
  const trustSignal = getTrustSignal(product.trustScore);

  // 하트 토글
  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) removeFromWishlist(product.id);
    else addToWishlist(product);
  };

  // 딜 클릭
  const handleViewDeal = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = product.link || "#";
    if (!url || url === "#") return;

    setRedirecting(true);
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      setRedirecting(false);
    }, 800);
  };

  // 세금/배송 텍스트 로직
  let taxSection = null;
  // type이 global이거나 international이면 세금 계산 로직 적용
  if (type === "global" || type === "international" || product.type === "global") {
     const isFree = (priceNum || 0) < 800;
     const text = isFree ? "No Import Tax" : "+ Est. Tax";
     taxSection = (
         <div className="flex items-center justify-end"><span className="text-[12px] font-extrabold text-[#02122c]">{text}</span></div>
     );
  } else {
     taxSection = (
         <div className="flex items-center justify-end gap-1"><span className="text-[12px] font-extrabold text-[#02122c]">+ Tax</span></div>
     );
  }

  const redirectOverlay = redirecting && typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#02122c] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#02122c]">Connecting to {displaySeller}...</p>
      </div>
    </div>,
    document.body
  );

  // [디자인 100% 복원] 가로형 레이아웃
  return (
    <>
       <div className="bg-white border border-[#e0e3eb] rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 flex h-[220px] group relative z-0 overflow-hidden">
          
          {/* 1. 좌측 이미지 (w-140px) */}
          <div className="w-[140px] h-full shrink-0 border-r border-slate-100 bg-white relative p-4 flex items-center justify-center">
             <button
                onClick={handleToggleSave}
                className="absolute top-2 left-2 z-10 transition-transform active:scale-90"
             >
                 {isSaved ?
                   <Icons.HeartFilled className="w-5 h-5 text-red-500" /> :
                   <Icons.Heart className="w-5 h-5 text-slate-300 hover:text-red-400" />
                 }
             </button>
             {/* Best Score 배지 */}
             {scoreBadge && (
               <div className={`absolute top-2 right-2 z-10 ${scoreBadge.bg} border rounded-md px-1.5 py-0.5 flex items-center gap-1`}>
                 <span className={`text-[11px] font-extrabold ${scoreBadge.color}`}>{product.bestScore}</span>
               </div>
             )}
             <img
                src={displayImage}
                alt={displayTitle}
                className="w-full h-full object-contain mix-blend-multiply"
             />
          </div>

          {/* 2. 중앙 정보 */}
          <div className="flex-1 p-5 flex flex-col justify-start border-r border-slate-100 min-w-0">
             <div className="flex justify-between items-start mb-2">
                 <div className="flex items-start gap-2 min-w-0">
                     <span className="text-[13px] font-extrabold text-[#02122c] uppercase tracking-wide mt-[2px] truncate">
                        {displaySeller}
                     </span>
                     {/* Trust Signal */}
                     {trustSignal && (
                       <span className={`text-[11px] font-bold ${trustSignal.color} mt-[3px] shrink-0`} title={`Trust: ${product.trustScore}/100`}>
                         {trustSignal.icon}
                       </span>
                     )}
                     <div className="flex flex-col items-start leading-none">
                        <div className="flex items-center gap-1">
                            <Icons.Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span className="text-[13px] font-bold text-slate-900">{product.rating || 0}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 mt-1">({product.reviewCount || 0})</span>
                     </div>
                 </div>
                 {/* 뱃지 복원 */}
                 <div className="flex gap-1 flex-wrap justify-end">
                     {(product.is_prime || product.badges?.includes("Prime")) && <span className="bg-[#00A8E1] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Prime</span>}
                     {product.badges?.includes("Choice") && <span className="bg-[#FF9900] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Choice</span>}
                 </div>
             </div>
             <h3 className="text-[15px] font-medium text-[#02122c] leading-snug line-clamp-3 group-hover:text-[#F59E0B] transition-colors">
                {displayTitle}
             </h3>
             {/* Fraud Warning Banner */}
             {product.fraudFlags && product.fraudFlags.length > 0 && (
               <div className="mt-auto pt-2 flex items-center gap-1.5">
                 <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                   {product.fraudFlags.includes('price_too_low') && '⚠ Unusually low price'}
                   {product.fraudFlags.includes('low_seller_trust') && '⚠ Low seller trust'}
                   {product.fraudFlags.includes('brand_typo_suspected') && '⚠ Possible knockoff'}
                   {product.fraudFlags.includes('aliexpress_material_risk') && '⚠ Material risk'}
                   {!product.fraudFlags.some((f: string) => ['price_too_low', 'low_seller_trust', 'brand_typo_suspected', 'aliexpress_material_risk'].includes(f)) && '⚠ Flagged'}
                 </span>
               </div>
             )}
          </div>

          {/* 3. 우측 정보 (회색 배경) */}
          <div className="w-[170px] flex flex-col bg-slate-50/30 min-w-[170px]">
             {/* 배송비 */}
             <div className="w-full p-3 border-b border-slate-200 flex flex-col items-end justify-center h-[55px]">
                <div className="flex items-center justify-end w-full">
                    <span className="text-[12px] font-extrabold text-[#02122c] truncate">
                        {product.delivery || product.shipping || "Free Shipping"}
                    </span>
                </div>
                {product.shippingContext && (
                    <span className="text-[11px] font-bold text-slate-500 mt-0.5 truncate max-w-full">
                        {product.shippingContext}
                    </span>
                )}
             </div>
             
             {/* 세금 */}
             <div className="w-full px-3 h-[32px] border-b border-slate-200 flex items-center justify-end">
                {taxSection}
             </div>
             
             {/* 도착 예정 */}
             <div className="w-full px-3 h-[32px] border-b border-slate-200 flex items-center justify-end">
                <span className="text-[12px] font-extrabold text-green-700 leading-tight truncate">
                    Arrives {product.arrives || (product.deliveryDays ? `${product.deliveryDays} Days` : "Soon")}
                </span>
             </div>
             
             {/* 가격 & 버튼 */}
             <div className="w-full flex-1 p-3 flex flex-col items-end justify-center gap-1">
                 <div className="text-[22px] font-extrabold text-[#02122c] leading-none">
                    {displayPrice}
                 </div>
                 {/* Total Landed Cost (원가와 다를 때만 표시) */}
                 {product.totalPrice != null && product.totalPrice > 0 && product.totalPrice !== priceNum && (
                   <span className="text-[11px] font-bold text-slate-400">Total: ${product.totalPrice.toFixed(2)}</span>
                 )}
                 <button
                    onClick={handleViewDeal}
                    className="w-full h-[30px] bg-[#02122c] hover:bg-[#F59E0B] text-white text-[13px] font-extrabold rounded-[4px] flex items-center justify-center gap-1 transition-colors shadow-sm"
                 >
                    Select <Icons.ArrowRight className="w-3 h-3" />
                 </button>
             </div>
          </div>
       </div>
       {redirectOverlay}
    </>
  );
}