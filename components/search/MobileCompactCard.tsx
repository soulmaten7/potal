"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icons, InfoIcon } from '../icons';
import { useWishlist } from '@/app/context/WishlistContext';
import { getRetailerConfig, matchShippingProgram } from '@/app/lib/retailerConfig';
import type { Product } from './ResultsGrid';

/** ═══ 모바일 컴팩트 세로형 카드 (간소화 + 아코디언) ═══ */
const MOBILE_PLATFORM_COLORS: Record<string, string> = {
  amazon: '#FF9900', walmart: '#0071ce', target: '#CC0000',
  'best buy': '#003b64', bestbuy: '#003b64', ebay: '#e53238',
  aliexpress: '#FF4747', temu: '#FB7701', shein: '#888', iherb: '#458500',
};

/** Tailwind → hex 색상 변환 맵 (뱃지용) */
const TW_COLOR_MAP: Record<string, string> = {
  'text-white': '#ffffff', 'text-[#0071ce]': '#0071ce', 'text-[#003b64]': '#003b64',
  'bg-[#00A8E1]': '#00A8E1', 'bg-[#FF9900]': '#FF9900', 'bg-[#0071ce]/10': 'rgba(0,113,206,0.1)',
  'bg-[#FFF200]/30': 'rgba(255,242,0,0.3)', 'bg-[#CC0000]': '#CC0000', 'bg-[#e53238]': '#e53238',
  'bg-[#FF4747]': '#FF4747',
};

function twToHex(tw: string, fallback: string): string {
  if (TW_COLOR_MAP[tw]) return TW_COLOR_MAP[tw];
  const m = tw.match(/#[0-9A-Fa-f]{3,8}/);
  return m ? m[0] : fallback;
}

export function MobileCompactCard({ product, type }: { product: Product; type: 'domestic' | 'global' }) {
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [expanded, setExpanded] = useState(false);
  const isSaved = isInWishlist(String(product.id));
  const displayTitle = product.title || 'Untitled';
  const displayImage = product.thumb || '';
  const displaySeller = product.seller || product.site || 'Unknown';
  const displayPrice = typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : String(product.price);
  const priceNum = parseFloat(String(displayPrice).replace(/[^0-9.-]/g, ''));
  const platformColor = MOBILE_PLATFORM_COLORS[displaySeller.toLowerCase().trim()] || '#888';

  const isGlobal = type === 'global';
  const shippingPrice = product.shippingPrice;
  const shippingLabel = shippingPrice === 0 || shippingPrice == null ? 'Free Shipping' : `+$${shippingPrice.toFixed(2)}`;
  const hasTotal = product.totalPrice != null && product.totalPrice > 0 && product.totalPrice !== priceNum;
  const finalTotal = hasTotal ? `$${product.totalPrice!.toFixed(2)}` : displayPrice;
  const taxAmount = hasTotal ? (product.totalPrice! - priceNum - (shippingPrice || 0)) : 0;
  const hasFreeShipping = shippingPrice === 0 || shippingPrice == null;

  // ── 멤버십 뱃지 결정 ──
  const mBadge = product.membershipBadge;
  const retailerConf = getRetailerConfig(displaySeller);
  const shippingProg = retailerConf ? matchShippingProgram(retailerConf, {
    is_prime: product.is_prime,
    badges: product.badges,
    deliveryDays: product.arrives,
    shipping: product.shipping,
  }) : null;

  let badgeLabel: string | null = null;
  let badgeBg = '#333';
  let badgeColor = '#fff';

  if (mBadge) {
    badgeLabel = mBadge.label;
    badgeBg = twToHex(mBadge.badgeBg, platformColor);
    badgeColor = twToHex(mBadge.badgeColor, '#fff');
  } else if (shippingProg) {
    badgeLabel = shippingProg.badge;
    badgeBg = twToHex(shippingProg.badgeBg, '#333');
    badgeColor = twToHex(shippingProg.badgeColor, '#fff');
  } else if (product.is_prime) {
    badgeLabel = 'Prime';
    badgeBg = '#232F3E';
    badgeColor = '#00A8E1';
  } else if (product.appliedMembership) {
    const label = product.appliedMembership.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    badgeLabel = label;
    badgeBg = platformColor;
    badgeColor = '#fff';
  }

  const handleViewDeal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = product.link || '#';
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = product.link || window.location.href;
    if (navigator.share) {
      navigator.share({ title: displayTitle, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {}).catch(() => {});
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wishProduct = {
      id: String(product.id),
      title: product.title,
      name: product.title,
      price: displayPrice,
      image: product.thumb,
      thumb: product.thumb,
      seller: product.seller,
      site: product.seller,
      rating: product.rating,
      reviewCount: product.reviewCount,
      link: product.link,
      totalPrice: product.totalPrice,
      shippingPrice: product.shippingPrice,
      is_prime: product.is_prime,
      badges: product.badges,
      arrives: product.arrives,
      shipping: product.shipping,
      appliedMembership: product.appliedMembership,
      membershipBadge: product.membershipBadge,
      type: product.type,
    };
    if (isSaved) removeFromWishlist(String(product.id));
    else addToWishlist(wishProduct);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div
      onClick={handleCardClick}
      className="rounded-lg overflow-hidden cursor-pointer transition-all active:scale-[0.98] flex flex-col"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
    >
      {/* 상단: 셀러뱃지 ←→ 별점 */}
      <div className="flex items-center justify-between px-1.5 pt-1.5 pb-0.5 flex-shrink-0">
        <div className="px-1.5 py-[2px] rounded text-[9px] font-extrabold uppercase" style={{ backgroundColor: platformColor, color: '#fff' }}>
          {displaySeller.length > 8 ? displaySeller.slice(0, 8) : displaySeller}
        </div>
        <div className="flex items-center gap-0.5">
          {(product as any).sellerFeedbackPercent ? (
            <>
              <span className="text-[9px] font-bold" style={{ color: '#10B981' }}>{(product as any).sellerFeedbackPercent}%</span>
              <span className="text-[8px]" style={{ color: '#94a3b8' }}>pos.</span>
            </>
          ) : (
            <>
              <span className="text-[10px]" style={{ color: '#F59E0B' }}>★</span>
              <span className="text-[10px] font-bold" style={{ color: '#475569' }}>{product.rating || 0}</span>
              {product.reviewCount > 0 && (
                <span className="text-[9px]" style={{ color: '#94a3b8' }}>({product.reviewCount > 999 ? `${(product.reviewCount / 1000).toFixed(1)}K` : product.reviewCount})</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* 이미지 */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          backgroundColor: '#f8fafc',
          flexShrink: 0,
          flexGrow: 0,
          flexBasis: 'auto',
          height: 0,
          paddingBottom: '125%',
        }}
      >
        {/* 공유 + 하트 */}
        <div className="absolute top-1.5 right-1 z-10 flex items-center" style={{ gap: '2px' }}>
          <button onClick={handleShare} className="transition-transform active:scale-90" style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
            <Icons.Share className="w-4 h-4 text-white" />
          </button>
          <button onClick={handleToggleSave} className="transition-transform active:scale-90" style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
            {isSaved
              ? <Icons.HeartFilled className="w-4 h-4 text-red-500" />
              : <Icons.Heart className="w-4 h-4 text-white" />
            }
          </button>
        </div>
        {displayImage && (
          <img
            src={displayImage}
            alt={displayTitle}
            loading="lazy"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '6px',
            }}
          />
        )}
      </div>

      {/* ── 제목 + 구분선 + (아코디언 상세) + Total Cost + (View Deal) ── */}
      <div className="px-2 py-2 flex flex-col gap-1">
        <p className="text-[12px] font-medium leading-snug line-clamp-3" style={{ color: '#000000', minHeight: '4.2em' }}>
          {displayTitle}
        </p>

        {/* 구분선 */}
        <div className="w-full h-px" style={{ backgroundColor: '#e2e8f0' }} />

        {/* 아코디언 상세 (펼쳤을 때 Total Cost 위에 나타남) */}
        {expanded && (
          <div className="flex flex-col gap-[3px]">
            {/* 멤버십 뱃지 + 배송일 */}
            <div className="flex items-center gap-0.5 mt-0.5" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
              {badgeLabel && (
                <span className="text-[9px] font-extrabold px-1.5 py-[1px] rounded shrink-0" style={{ backgroundColor: badgeBg, color: badgeColor }}>
                  {badgeLabel}
                </span>
              )}
              <span className="text-[9px] shrink-0">🚀</span>
              <span className="text-[10px] font-bold shrink-0" style={{ color: isGlobal ? '#FB7701' : '#10B981' }}>
                {product.arrives || (isGlobal ? '7-15 Days' : '1-2 Days')}
              </span>
            </div>

            {/* Product price */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: '#64748b' }}>Product</span>
              <span className="text-[11px] font-bold" style={{ color: '#000000' }}>{displayPrice}</span>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: '#64748b' }}>Shipping</span>
              <span className="text-[11px] font-bold" style={{ color: hasFreeShipping ? '#10B981' : '#000000' }}>
                {hasFreeShipping ? 'Free' : shippingLabel}
              </span>
            </div>

            {/* Tax/Duty */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: '#64748b' }}>
                {isGlobal ? 'Duty+MPF' : 'Est. Tax'}
              </span>
              <span className="text-[11px] font-bold" style={{ color: isGlobal ? '#EF4444' : '#000000' }}>
                {isGlobal
                  ? `+$${(taxAmount > 0.5 ? taxAmount : (priceNum * 0.20) + 5.50).toFixed(2)}`
                  : `+$${(taxAmount > 0.5 ? taxAmount : priceNum * 0.07).toFixed(2)}`
                }
              </span>
            </div>

            {/* 구분선 (상세 ↔ Total) */}
            <div className="w-full my-0.5" style={{ borderTop: '1px dashed #e2e8f0' }} />
          </div>
        )}

        {/* Total Cost — 항상 표시, 펼치면 상세 아래로 밀려남 */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold" style={{ color: '#10B981' }}>Total Cost</span>
          <span className="text-[16px] font-extrabold leading-none text-[#000000]">{finalTotal}</span>
        </div>

        {/* View Deal 버튼 (펼쳤을 때만) */}
        {expanded && (
          <button
            onClick={handleViewDeal}
            className="w-full mt-1 py-2.5 rounded-lg text-[13px] font-extrabold transition-colors"
            style={{ backgroundColor: '#02122c', color: '#ffffff' }}
          >
            View Deal →
          </button>
        )}
      </div>

    </div>
  );
}
