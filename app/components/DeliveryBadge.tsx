"use client";

import type { StandardDeliveryInfo } from "../lib/utils/DeliveryStandard";

type DeliveryBadgeProps = {
  info: StandardDeliveryInfo;
  compact?: boolean;
};

/** 브랜드 컬러(Color Class) — colorClass 없을 때 fallback */
const BRAND_FALLBACK: Record<StandardDeliveryInfo["brandId"], string> = {
  amazon: "font-bold text-[#146eb4]",
  aliexpress: "font-bold text-orange-600",
  temu: "font-medium text-orange-600",
  walmart: "font-bold text-[#0071ce]",
  ebay: "font-bold text-[#e53238]",
  bestbuy: "font-bold text-[#FFF200] bg-[#003b64] px-1 rounded",
  target: "font-bold text-[#CC0000]",
  iherb: "font-bold text-[#458500]",
  default: "font-medium text-slate-600",
};

/** 배송 정보: {originalMark} : {label} — 브랜드 컬러 적용 (시각적 신뢰) */
export function DeliveryBadge({ info, compact }: DeliveryBadgeProps) {
  const textClass = compact ? "text-[10px]" : "text-xs";
  const markClass = info.colorClass ?? BRAND_FALLBACK[info.brandId] ?? "font-medium text-slate-600";
  return (
    <span className={`inline-flex items-center gap-0.5 min-w-0 overflow-hidden ${compact ? "flex-nowrap truncate" : "flex-wrap"} ${textClass}`}>
      {info.originalMark && (
        <span className={markClass}>{info.originalMark}</span>
      )}
      {info.originalMark && <span className="text-slate-400">:</span>}
      <span className="font-medium text-slate-600">{info.label}</span>
      {info.cost && (
        <span className="text-slate-500 ml-0.5">· {info.cost}</span>
      )}
    </span>
  );
}
