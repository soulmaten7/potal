/**
 * Partner slot configuration — CW28 Sprint 6 (Phase 1: UI reservation only)
 *
 * 스펙 결정 12 (HOMEPAGE_REDESIGN_SPEC.md 580~647):
 *   Phase 1: 슬롯 UI만 예약, 실제 광고주 연동 X
 *   Phase 2 (트래픽 10k+ 이후): 배송사 영업 시작, 월정액 슬롯 임대
 *
 * 원칙:
 *   1. 배송사 바로가기 링크만 (견적/가격/비교 X)
 *   2. "Sponsored" 표기 필수
 *   3. 월정액 슬롯 임대 (클릭 당 과금 X)
 *   4. 배송/물류 회사 한정
 *   5. 계산 결과 하단의 자연스러운 연장 (배너/팝업 X)
 *
 * Phase 2 activation: populate PARTNER_SLOTS via Supabase `partner_slots`
 * table (see spec 637~651) and flip isActive=true on contracted slots.
 */

export type PartnerCategory = 'shipping' | 'logistics';

export interface PartnerSlot {
  id: string;
  name: string;
  emoji: string; // Phase 1: emoji only. Phase 2: logo URL field added alongside.
  category: PartnerCategory;
  clickUrl: string; // Phase 1: "#". Phase 2: real partner URL
  isActive: boolean; // Phase 1: false for all. Phase 2: flipped after contract
  displayOrder: number;
  // Phase 2 fields (reserved, not used in Phase 1):
  // contractStart?: string;
  // contractEnd?: string;
  // monthlyFee?: number;
}

/**
 * Phase 1 placeholder — 4 empty slots.
 * Phase 2 will populate this with real partners via Supabase partner_slots table.
 */
export const PARTNER_SLOTS: PartnerSlot[] = [
  {
    id: 'slot-1',
    name: 'Partner slot available',
    emoji: '🚚',
    category: 'shipping',
    clickUrl: '#',
    isActive: false,
    displayOrder: 1,
  },
  {
    id: 'slot-2',
    name: 'Partner slot available',
    emoji: '📦',
    category: 'shipping',
    clickUrl: '#',
    isActive: false,
    displayOrder: 2,
  },
  {
    id: 'slot-3',
    name: 'Partner slot available',
    emoji: '🚛',
    category: 'logistics',
    clickUrl: '#',
    isActive: false,
    displayOrder: 3,
  },
  {
    id: 'slot-4',
    name: 'Partner slot available',
    emoji: '🏢',
    category: 'logistics',
    clickUrl: '#',
    isActive: false,
    displayOrder: 4,
  },
];

export const PARTNER_SLOT_HEADING = 'Ship this with';
export const PARTNER_SLOT_SPONSORED_LABEL = 'Sponsored';
export const PARTNER_SLOT_PLACEHOLDER_CTA = 'Partner slot available';
