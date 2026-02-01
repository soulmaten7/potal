"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Product } from "../types/product";
import { useWishlist } from "../context/WishlistContext";
import { normalizeDeliveryInfo } from "../lib/utils/DeliveryStandard";
import { DeliveryBadge } from "./DeliveryBadge";

const POTAL_PLACEHOLDER = "https://placehold.co/400x400/6366f1/white?text=POTAL";

function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

type ProductCardProps = {
  product: Product;
  type: "domestic" | "international";
  /** 홈 고밀도 그리드용: 이미지 h-48 */
  compact?: boolean;
  /** 모바일 네이티브 앱 스타일: 작은 폰트, 2열 그리드용 */
  dense?: boolean;
  /** 찜 추가/제거 시 토스트용 콜백 (added: true = 저장, false = 제거) */
  onWishlistChange?: (added: boolean) => void;
  /** 상품 클릭(딜 보기) 시 관심 카테고리 반영용 */
  onProductClick?: (product: Product) => void;
};

export function ProductCard({ product, type, compact, dense, onWishlistChange, onProductClick }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [redirectingSite, setRedirectingSite] = useState<string | null>(null);
  /** 이미지 로드 실패(404 등) 시 플레이스홀더로 교체 */
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
  }, [product.id, product.image]);
  const isDomestic = type === "domestic";
  const hasVariants = product.variants && product.variants.length > 0;
  const isChinaLikeInternational =
    !isDomestic && ["Temu", "AliExpress", "Coupang"].includes(product.site);

  const inWishlist = isInWishlist(product.id);

  const handleViewDeal = (e: React.MouseEvent) => {
    e.preventDefault();
    onProductClick?.(product);
    const url = product.link || "#";
    if (!url || url === "#") return;
    setRedirectingSite(product.site);
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      setRedirectingSite(null);
    }, 900);
  };

  const ctaLabel = isDomestic
    ? "🇺🇸 View Deal"
    : isChinaLikeInternational
      ? "🇨🇳 View Deal"
      : "🌏 View Deal";

  const handleWishlistToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      onWishlistChange?.(false);
    } else {
      addToWishlist(product);
      onWishlistChange?.(true);
    }
  };

  const priceStr =
    typeof product.price === "string" && product.price.startsWith("$")
      ? product.price
      : `$${product.price}`;

  const imageHeightClass = dense ? "h-36" : compact ? "h-48" : "h-52";

  // 리다이렉팅 오버레이: Portal로 body에 렌더링해 전체 화면 덮음 (카드 overflow/transform 영향 없음)
  const redirectOverlay =
    redirectingSite &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-4 min-w-[200px]">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-800">Connecting to {redirectingSite}...</p>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <div className="group relative h-full flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        {/* Image area - vertical card: image on top, 고정 높이 */}
        <div className={`relative w-full flex-shrink-0 ${imageHeightClass} bg-slate-50`}>
          <img
            src={imageError ? POTAL_PLACEHOLDER : (product.image || POTAL_PLACEHOLDER)}
            alt={product.name || "Product"}
            className="w-full h-full object-contain p-2"
            onError={() => setImageError(true)}
          />
          {/* Wishlist - top right, 터치 영역 44px 이상 */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            className="absolute right-2 top-2 z-10 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/90 min-w-[44px] min-h-[44px] p-2.5 shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
            aria-label={inWishlist ? "Remove from saved" : "Save item"}
          >
            <BookmarkIcon
              className={
                inWishlist
                  ? "w-4 h-4 text-indigo-600 fill-indigo-600"
                  : "w-4 h-4 text-slate-400"
              }
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Content - below image, flex-1 + min-h-0으로 그리드 높이 채움 */}
        <div className={`flex flex-col flex-1 min-h-0 min-w-0 ${dense ? "p-2" : "p-3"}`}>
          {/* 제목: 2줄 자르기 고정, 레이아웃 밀림 방지 */}
          <div className="flex items-start justify-between gap-1 mb-0.5 flex-shrink-0 min-w-0 overflow-hidden">
            <h3 className={`font-semibold text-slate-800 flex-1 min-w-0 overflow-hidden line-clamp-2 leading-snug ${dense ? "text-xs min-h-[2.25rem]" : "text-sm min-h-[3rem]"}`}>
              {product.name}
            </h3>
            {hasVariants && !dense && (
              <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium whitespace-nowrap">
                More prices
              </span>
            )}
          </div>

          {/* Store & delivery - 표준화 배지 + 툴팁 */}
          <div className={`flex items-center gap-1 mb-1 flex-wrap flex-shrink-0 ${dense ? "text-[10px]" : ""}`}>
            <span
              className={`px-1.5 py-0.5 rounded font-medium ${
                isDomestic
                  ? "bg-blue-100 text-blue-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {product.site}
            </span>
            <DeliveryBadge
              info={normalizeDeliveryInfo({
                deliveryDays: product.deliveryDays,
                site: product.site,
                delivery: (product as { delivery?: string }).delivery,
                is_prime: (product as { is_prime?: boolean }).is_prime,
              })}
              compact={dense}
            />
            {product.trustScore !== undefined && (
              <span className="text-slate-500">⭐ {product.trustScore}</span>
            )}
          </div>

          {/* 가격·배송·CTA: mt-auto로 카드 바닥에 고정 */}
          <div className="mt-auto flex-shrink-0">
            <p className={dense ? "text-base font-bold text-indigo-600" : "text-xl font-bold text-indigo-600"}>{priceStr}</p>
            {(() => {
              const deliveryInfo = normalizeDeliveryInfo({
                deliveryDays: product.deliveryDays,
                site: product.site,
                delivery: (product as { delivery?: string }).delivery,
                is_prime: (product as { is_prime?: boolean }).is_prime,
              });
              if (deliveryInfo.cost === "Free") return null;
              return (
                <p className={dense ? "text-[10px] text-slate-500 mt-0.5 mb-1.5" : "text-xs text-slate-500 mt-0.5 mb-3"}>
                  {(product as { shippingCost?: string }).shippingCost ?? "+ Shipping"}
                </p>
              );
            })()}
            <button
              type="button"
              onClick={handleViewDeal}
              className={`block w-full text-center rounded-lg font-bold text-white transition-colors min-h-[44px] flex items-center justify-center touch-manipulation ${
                dense ? "px-3 py-2.5 text-[10px]" : "px-4 py-3 rounded-lg text-xs"
              } ${isDomestic ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800" : "bg-orange-500 hover:bg-orange-600 active:bg-orange-700"}`}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
      {redirectOverlay}
    </>
  );
}
