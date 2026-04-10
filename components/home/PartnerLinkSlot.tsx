'use client';

/**
 * PartnerLinkSlot — CW28 Sprint 6 (Phase 1: UI reservation only)
 *
 * 스펙 결정 12 (HOMEPAGE_REDESIGN_SPEC.md 580~647):
 *   계산 결과 하단에 배송사 "바로가기 링크" 슬롯을 예약.
 *
 * Phase 1: UI reservation only. Phase 2 (traffic 10k+): activate via partner-config.ts
 *   - Phase 1: 4개 슬롯 전부 isActive=false → "Partner slot available" placeholder
 *   - Phase 2: partner-config.ts 에 실제 배송사 데이터 주입 + isActive=true
 *
 * 원칙 (하지 말 것):
 *   - 견적 비교, 가격 표시 X — POTAL은 계산만
 *   - 배너/사이드바/팝업 X — 결과 하단의 자연스러운 연장만
 *   - 클릭 카운터/추적 픽셀 X — 월정액 슬롯 임대 구조
 *   - 실제 브랜드 이미지 X — 이모지만 사용
 */

import {
  PARTNER_SLOTS,
  PARTNER_SLOT_HEADING,
  PARTNER_SLOT_SPONSORED_LABEL,
  type PartnerSlot,
} from '@/lib/partners/partner-config';

function SlotRow({ slot }: { slot: PartnerSlot }) {
  if (slot.isActive) {
    // Phase 2 rendering — real partner link
    return (
      <a
        href={slot.clickUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        aria-label={`${slot.name} — sponsored partner`}
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 transition-colors"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="text-[20px] flex-none" aria-hidden="true">{slot.emoji}</span>
          <span className="text-[13px] font-bold text-[#02122c] truncate">{slot.name}</span>
        </span>
        <span className="flex-none text-[12px] font-semibold text-[#02122c]">
          Open →
        </span>
      </a>
    );
  }

  // Phase 1 rendering — placeholder (disabled, non-interactive)
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 cursor-not-allowed pointer-events-none select-none"
      aria-hidden="true"
      tabIndex={-1}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="text-[18px] flex-none opacity-60" aria-hidden="true">{slot.emoji}</span>
        <span className="text-[12px] font-semibold text-slate-400 truncate">
          {slot.name}
        </span>
      </span>
      <span className="flex-none text-[13px] text-slate-300">—</span>
    </div>
  );
}

export default function PartnerLinkSlot() {
  return (
    <aside
      role="complementary"
      aria-label="Partner shipping options (sponsored)"
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-extrabold text-[#02122c] leading-none">
          {PARTNER_SLOT_HEADING}
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
          {PARTNER_SLOT_SPONSORED_LABEL}
        </span>
      </div>

      <div className="space-y-2">
        {PARTNER_SLOTS.slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(slot => (
            <SlotRow key={slot.id} slot={slot} />
          ))}
      </div>

      <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">
        POTAL provides neutral landed-cost calculations. Shipping partners link out to their own sites.
      </p>
    </aside>
  );
}
