"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { getRetailerConfig, matchShippingProgram } from '../lib/retailerConfig';

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

/** 리테일러별 브랜드 색상 */
const PLATFORM_COLORS: Record<string, string> = {
  amazon: '#FF9900', walmart: '#0071ce', target: '#CC0000',
  'best buy': '#003b64', bestbuy: '#003b64', ebay: '#e53238',
  aliexpress: '#FF4747', temu: '#FB7701', shein: '#888', iherb: '#458500',
};

/** Tailwind → hex 변환 */
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

/** 모바일 위시리스트 카드 — 검색결과 MobileCompactCard와 동일한 스타일 */
function WishlistMobileCard({ product, onRemove }: { product: any; onRemove: () => void }) {
  const displayTitle = product.title || product.name || 'Untitled';
  const displayImage = product.thumb || product.image || '';
  const displaySeller = product.seller || product.site || 'Unknown';
  const displayPrice = typeof product.price === 'number'
    ? `$${product.price.toFixed(2)}`
    : typeof product.price === 'string'
      ? product.price
      : '—';
  const platformColor = PLATFORM_COLORS[displaySeller.toLowerCase().trim()] || '#888';

  const priceNum = parseFloat(String(displayPrice).replace(/[^0-9.-]/g, ''));
  const hasTotal = product.totalPrice != null && product.totalPrice > 0 && product.totalPrice !== priceNum;
  const finalTotal = hasTotal ? `$${product.totalPrice.toFixed(2)}` : displayPrice;
  const shippingPrice = product.shippingPrice;
  const hasFreeShipping = shippingPrice === 0 || shippingPrice == null;
  const shippingLabel = hasFreeShipping ? 'Free' : `+$${shippingPrice?.toFixed(2)}`;
  const taxAmount = hasTotal ? (product.totalPrice - priceNum - (shippingPrice || 0)) : 0;
  const isGlobal = product.type === 'global';
  const taxLabel = taxAmount > 0.5 ? `Est.${isGlobal ? 'Duty' : 'Tax'} +$${taxAmount.toFixed(2)}` : '';

  // ── 멤버십 뱃지 결정 (4단계 우선순위) ──
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
    badgeLabel = 'Prime'; badgeBg = '#232F3E'; badgeColor = '#00A8E1';
  } else if (product.appliedMembership) {
    const label = product.appliedMembership.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    badgeLabel = label; badgeBg = platformColor; badgeColor = '#fff';
  }

  const handleClick = () => {
    const url = product.link || '#';
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
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

  return (
    <div
      onClick={handleClick}
      className="rounded-lg overflow-hidden cursor-pointer transition-all active:scale-[0.98] flex flex-col"
      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* 상단: 셀러뱃지 ↔ 별점 */}
      <div className="flex items-center justify-between px-1.5 pt-1.5 pb-0.5" style={{ flexShrink: 0 }}>
        <div className="px-1.5 py-[2px] rounded text-[9px] font-extrabold uppercase" style={{ backgroundColor: platformColor, color: '#fff' }}>
          {displaySeller.length > 8 ? displaySeller.slice(0, 8) : displaySeller}
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-[10px]" style={{ color: '#F59E0B' }}>★</span>
          <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{product.rating || 0}</span>
          {product.reviewCount > 0 && (
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              ({product.reviewCount > 999 ? `${(product.reviewCount / 1000).toFixed(1)}K` : product.reviewCount})
            </span>
          )}
        </div>
      </div>

      {/* 이미지 — 고정 비율 + 우측상단 공유/삭제 */}
      <div
        className="relative w-full overflow-hidden"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)', flexShrink: 0, flexGrow: 0, height: 0, paddingBottom: '125%' }}
      >
        {/* 공유 + 삭제(하트 대신) — 배경 없이, 드롭섀도우로 가독성 확보 */}
        <div className="absolute top-1.5 right-1 z-10 flex items-center" style={{ gap: '2px' }}>
          <button onClick={handleShare} className="transition-transform active:scale-90" style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
            <Icons.Share className="w-4 h-4 text-white" />
          </button>
          <button onClick={handleRemove} className="transition-transform active:scale-90" style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
            <Icons.HeartFilled className="w-4 h-4 text-red-400" />
          </button>
        </div>
        {displayImage && (
          <img
            src={displayImage}
            alt={displayTitle}
            loading="lazy"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
          />
        )}
      </div>

      {/* 정보 영역 */}
      <div className="px-2 py-2 flex flex-col gap-1.5">
        {/* 상품명 — 3줄 고정 */}
        <p className="text-[12px] font-medium leading-snug line-clamp-3" style={{ color: 'rgba(255,255,255,0.85)', minHeight: '4.2em' }}>
          {displayTitle}
        </p>

        {/* 구분선 */}
        <div className="w-full h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

        {/* 가격 3줄 구조 */}
        <div className="flex gap-1">
          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
            {/* 1줄: 멤버십 뱃지 + 배송 + 배송일 — nowrap 강제 */}
            <div className="flex items-center gap-0.5" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
              {badgeLabel && (
                <span className="text-[8px] font-extrabold px-1 py-[0.5px] rounded shrink-0" style={{ backgroundColor: badgeBg, color: badgeColor }}>
                  {badgeLabel}
                </span>
              )}
              <span className="text-[8px] font-bold shrink-0" style={{ color: hasFreeShipping ? '#10B981' : 'rgba(255,255,255,0.5)' }}>
                {hasFreeShipping ? 'Free' : shippingLabel}
              </span>
              <span className="text-[9px] shrink-0">🚀</span>
              <span className="text-[8px] font-bold shrink-0" style={{ color: isGlobal ? '#FB7701' : '#10B981' }}>
                {product.arrives || (isGlobal ? '7-15 Days' : '1-2 Days')}
              </span>
            </div>
            {/* 2줄: Est. Tax */}
            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {taxLabel || (isGlobal ? 'Est.Duty —' : 'Est.Tax —')}
            </span>
            {/* 3줄: Product 가격 */}
            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Product {displayPrice}
            </span>
          </div>
          {/* 오른쪽: total */}
          <div className="flex flex-col items-end justify-between shrink-0 py-0.5">
            <span className="text-[9px] font-bold px-1.5 py-[1px] rounded" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>total</span>
            <span className="text-[18px] font-extrabold leading-none text-white">{finalTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <main style={{ backgroundColor: '#02122c' }} className="min-h-screen pb-28">
      {/* ─── Clear 확인 바텀시트 ─── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[10002]" onClick={() => setShowClearConfirm(false)}>
          {/* 배경 오버레이 */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          {/* 바텀시트 */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl px-5 pt-6 pb-8"
            style={{ backgroundColor: '#0a1e3d' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
                <TrashIcon className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-[18px] font-extrabold text-white mb-1.5">Clear all saved items?</h3>
              <p className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
                This will remove all {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} from your saved list. This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-white transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { clearWishlist(); setShowClearConfirm(false); }}
                  className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-white transition-colors"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  Clear All
                </button>
              </div>
            </div>
            {/* 하단 핸들 바 */}
            <div className="w-10 h-1 rounded-full mx-auto mt-5" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-extrabold text-white tracking-tight">Saved Items</h1>
          {wishlist.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 text-white/40 hover:text-red-400 transition-colors text-sm font-bold"
            >
              <TrashIcon className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
        {wishlist.length > 0 && (
          <p className="text-white/40 text-sm mt-1">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
        )}
      </div>

      {/* 컨텐츠 */}
      <div className="px-5 pt-4">
        {wishlist.length === 0 ? (
          /* ─── 빈 상태: 스카이스캐너 스타일 ─── */
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="relative mb-8">
              <div style={{ width: '120px', height: '120px', borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Heart style={{ width: '36px', height: '36px', color: 'rgba(245,158,11,0.6)' }} />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">No saved items yet</h2>
            <p className="text-white/40 text-[14px] leading-relaxed max-w-[260px] mb-8">
              Search for products and tap the heart icon to save deals you love.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 32px', background: '#F59E0B', color: '#ffffff',
                fontWeight: 800, fontSize: '15px', borderRadius: '12px',
                textDecoration: 'none', transition: 'background 0.2s',
              }}
            >
              <Icons.Search style={{ width: '18px', height: '18px' }} />
              Start Searching
            </Link>
          </div>
        ) : (
          <>
            {/* ─── 모바일: 2열 그리드 (검색결과와 동일) ─── */}
            <div className="md:hidden grid grid-cols-2 gap-1.5">
              {wishlist.map((product: any, index: number) => (
                <WishlistMobileCard
                  key={product.id || index}
                  product={product}
                  onRemove={() => removeFromWishlist(String(product.id))}
                />
              ))}
            </div>

            {/* ─── PC: 기존 ProductCard 리스트 ─── */}
            <div className="hidden md:block space-y-3">
              {wishlist.map((product: any, index: number) => (
                <ProductCard
                  key={product.id || index}
                  product={product}
                  type={product.type || "domestic"}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
