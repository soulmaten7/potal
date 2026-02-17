"use client";

import type { StandardDeliveryInfo } from "../lib/utils/DeliveryStandard";

type DeliveryBadgeProps = {
  info: StandardDeliveryInfo;
  compact?: boolean;
  /** Domestic = 빠른 배송(초록), International = 직구/주의(오렌지) */
  deliveryVariant?: "domestic" | "international";
  /** 셀러 라인에 이미 Prime 등 표시 → 배송 마크 + 이모지 숨김 */
  hideMark?: boolean;
  /** cost 부분 숨김 (breakdown에서 별도 표시할 때) */
  hideCost?: boolean;
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

/** 이모지 패턴 (로켓, 배, 비행기, 박스, 번개 등) */
const EMOJI_RE = /[\u{1F680}\u{1F6A2}\u{2708}\u{FE0F}\u{1F4E6}\u{26A1}\u{FE0F}\u{1F3EA}\u{1F3AF}\u{1F49A}\u{1F33F}]+\s*/gu;

/**
 * 배송 정보 뱃지
 * - 기본: "{originalMark} : {label} · {cost}"
 * - hideMark=true: 이모지 제거 후 label만 간결히 ("Est. 1-2 Days")
 */
export function DeliveryBadge({ info, compact, deliveryVariant, hideMark, hideCost }: DeliveryBadgeProps) {
  const textClass = compact ? "text-[10px]" : "text-xs";
  const markClass = info.colorClass ?? BRAND_FALLBACK[info.brandId] ?? "font-medium text-slate-600";
  const labelClass =
    deliveryVariant === "domestic"
      ? "font-medium text-emerald-700"
      : deliveryVariant === "international"
        ? "font-medium text-amber-700"
        : "font-medium text-slate-600";

  // hideMark일 때: 이모지 제거 + "Est." 접두어 추가
  let displayLabel = info.label;
  if (hideMark) {
    displayLabel = info.label
      .replace(EMOJI_RE, '')
      .replace(/^🚀\s*/, '')
      .replace(/^🚢\s*/, '')
      .replace(/^✈️\s*/, '')
      .replace(/^📦\s*/, '')
      .replace(/^⚡️?\s*/, '')
      .trim();
    // "1-2 Days" → "Est. 1-2 Days"
    if (displayLabel && !displayLabel.startsWith('Est.')) {
      displayLabel = `Est. ${displayLabel}`;
    }
  }

  return (
    <span className={`inline-flex items-center gap-0.5 min-w-0 overflow-hidden ${compact ? "flex-nowrap truncate" : "flex-wrap"} ${textClass}`}>
      {!hideMark && info.originalMark && (
        <span className={markClass}>{info.originalMark}</span>
      )}
      {!hideMark && info.originalMark && <span className="text-slate-400">:</span>}
      <span className={labelClass}>{displayLabel}</span>
      {!hideCost && info.cost && (
        <span className="text-slate-500 ml-0.5">· {info.cost}</span>
      )}
    </span>
  );
}
