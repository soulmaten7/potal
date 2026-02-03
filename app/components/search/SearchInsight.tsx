"use client";

import type { Product } from "@/app/types/product";

function parsePrice(priceStr: string | undefined): number | null {
  if (priceStr == null || typeof priceStr !== "string") return null;
  const s = priceStr.replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export interface SearchInsightProps {
  /** Domestic (Amazon 등) 상품 목록 */
  domestic: Product[];
  /** Global (Ali/Temu 등) 상품 목록 */
  international: Product[];
  /** 로딩 중이면 브리핑 숨김 */
  loading: boolean;
  /** 박스 우측에 배치할 액션 (예: Shipping Guide 버튼) */
  rightAction?: React.ReactNode;
}

/**
 * 규칙 기반 AI 브리핑: 검색 결과를 한 줄 인사이트로 요약.
 * LLM 없이 최저가·플랫폼 비교·결과 수만 빠르게 표시.
 */
export function SearchInsight({ domestic, international, loading, rightAction }: SearchInsightProps) {
  if (loading) return null;
  const totalCount = domestic.length + international.length;
  if (totalCount === 0) return null;

  const allPrices = [...domestic, ...international]
    .map((p) => parsePrice(p.price))
    .filter((n): n is number => n != null && n > 0);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;

  const domesticPrices = domestic.map((p) => parsePrice(p.price)).filter((n): n is number => n != null && n > 0);
  const internationalPrices = international.map((p) => parsePrice(p.price)).filter((n): n is number => n != null && n > 0);
  const domesticMin = domesticPrices.length > 0 ? Math.min(...domesticPrices) : null;
  const globalMin = internationalPrices.length > 0 ? Math.min(...internationalPrices) : null;
  const hasBoth = domestic.length > 0 && international.length > 0;
  const globalCheaper = hasBoth && globalMin != null && domesticMin != null && globalMin < domesticMin;

  const lines: string[] = [];
  if (minPrice != null) {
    lines.push(`Deals start from $${minPrice.toFixed(2)}.`);
  }
  if (hasBoth && globalMin != null && globalCheaper) {
    lines.push(`Global options are available from $${globalMin.toFixed(2)}, which is usually cheaper.`);
  }
  lines.push(`Found ${totalCount} item${totalCount === 1 ? "" : "s"} matching your search.`);

  return (
    <div className="relative z-0 w-full mb-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 flex justify-between items-center gap-3">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <span className="flex-shrink-0 text-base" aria-hidden>
          🤖
        </span>
        <p className="min-w-0 flex-1 leading-snug">
          {lines.join(" ")}
        </p>
      </div>
      {rightAction != null ? <div className="flex-shrink-0">{rightAction}</div> : null}
    </div>
  );
}
