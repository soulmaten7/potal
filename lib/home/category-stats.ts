/**
 * Home Page Category Stats — 6개 데이터 카테고리 그루핑 + Freshness 집계
 *
 * CW38 Ticker Redesign:
 *   - 홈페이지 상단 marquee 티커를 제거하고 정적 카테고리 표시로 전환
 *   - master-data-registry.ts 의 32개 소스를 6개 상위 카테고리로 집계
 *   - /api/v1/data-freshness 응답을 받아 카테고리별 "가장 최신 업데이트" 계산
 *
 * 사용처:
 *   - components/home/CategoryStatBar.tsx (Hero 아래 컴팩트 6-pill 바)
 *   - components/home/DataSourcesSection.tsx (6개 상세 카드 섹션)
 */

import { MASTER_DATA_REGISTRY, type DataCategory } from '@/app/lib/data-management/master-data-registry';

/** /api/v1/data-freshness 응답 중 우리가 사용하는 최소 필드 */
export interface FreshnessSource {
  name: string;
  category: string;
  lastUpdated: string | null;
}

/**
 * 6개 상위 카테고리 — 홈페이지 최상위 데이터 분류.
 * 각 그룹은 master-data-registry 의 category 값 1개 이상을 포함.
 */
export interface CategoryGroup {
  /** 내부 key */
  key: string;
  /** 표시 레이블 */
  label: string;
  /** 한 줄 부제 (커버리지/볼륨) */
  headline: string;
  /** 긴 설명 — 카드용 */
  description: string;
  /** master-data-registry category 값 중 이 그룹에 포함되는 값 */
  includeCategories: DataCategory[];
  /** Tailwind accent color key (단독 색상 단어) — pill / dot / card border 에 사용 */
  accent: 'blue' | 'emerald' | 'red' | 'amber' | 'purple' | 'slate';
  /** 대표 publisher 몇 개 */
  keyPublishers: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: 'tariff',
    label: 'Tariff Schedules',
    headline: '240 countries',
    description: 'Official tariff schedules and duty rates from national customs authorities.',
    includeCategories: ['tariff'],
    accent: 'blue',
    keyPublishers: ['USITC', 'EU TARIC', 'HMRC', 'KCS'],
  },
  {
    key: 'tax',
    label: 'Tax & VAT',
    headline: '241 jurisdictions',
    description: 'VAT, GST, sales tax, and de minimis thresholds across all importing countries.',
    includeCategories: ['tax'],
    accent: 'emerald',
    keyPublishers: ['EC DG TAXUD', 'Tax Foundation', 'OECD'],
  },
  {
    key: 'sanctions',
    label: 'Sanctions',
    headline: '96K entities',
    description: 'Denied party lists, embargo programs, and export control classification.',
    includeCategories: ['sanctions'],
    accent: 'red',
    keyPublishers: ['OFAC', 'BIS', 'EU', 'UN'],
  },
  {
    key: 'trade_remedy',
    label: 'Trade Remedies',
    headline: '590 AD/CVD orders',
    description: 'Anti-dumping, countervailing duties, and safeguard measures in force.',
    includeCategories: ['trade_remedy'],
    accent: 'amber',
    keyPublishers: ['USITC', 'Commerce ITA'],
  },
  {
    key: 'fta',
    label: 'FTA Agreements',
    headline: '1.3K agreements',
    description: 'Free trade agreements, rules of origin, and preferential tariff programs.',
    includeCategories: ['fta'],
    accent: 'purple',
    keyPublishers: ['WTO RTA-IS', 'USTR', 'EU'],
  },
  {
    key: 'rulings',
    label: 'Customs Rulings',
    headline: '645K rulings',
    description: 'HS classification rulings, WCO nomenclature, and chapter notes.',
    includeCategories: ['classification'],
    accent: 'slate',
    keyPublishers: ['CBP', 'WCO', 'Japan Customs'],
  },
];

/** 카테고리 그룹 안에 포함된 master-data-registry 소스들 */
export function sourcesInGroup(group: CategoryGroup) {
  return MASTER_DATA_REGISTRY.filter(s => group.includeCategories.includes(s.category));
}

/**
 * 카테고리 그룹 내에서 가장 최신 timestamp 를 찾음.
 * Freshness API 응답 중 해당 그룹에 속하는 소스들의 lastUpdated 중 max.
 */
export function latestUpdateForGroup(
  group: CategoryGroup,
  freshness: FreshnessSource[] | null,
): string | null {
  if (!freshness) return null;

  // master-data-registry 의 name 과 Freshness API 의 name 이 동일하다고 가정
  const groupSourceNames = sourcesInGroup(group).map(s => s.name);
  const matching = freshness.filter(
    f => groupSourceNames.includes(f.name) && f.lastUpdated,
  );
  if (matching.length === 0) return null;

  // ISO 문자열을 Date 로 변환해서 가장 큰 timestamp 반환
  const latest = matching.reduce<string | null>((acc, f) => {
    if (!f.lastUpdated) return acc;
    if (!acc) return f.lastUpdated;
    return new Date(f.lastUpdated) > new Date(acc) ? f.lastUpdated : acc;
  }, null);

  return latest;
}

/**
 * ISO timestamp → 상대시간 ("2h ago", "3d ago"). timestamp 가 null 이면 'Pending'.
 * LiveTicker 의 formatRelativeTime 과 동일한 규칙 — 중복 유틸이지만 용도 달라 분리.
 */
export function formatRelative(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'Pending';
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now.getTime() - then) / 1000));

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/** accent key → Tailwind 클래스 매핑 (dot 색, 텍스트 색 등) */
export const ACCENT_CLASSES: Record<CategoryGroup['accent'], {
  dot: string;
  text: string;
  border: string;
  bgSoft: string;
}> = {
  blue:    { dot: 'bg-blue-500',    text: 'text-blue-700',    border: 'border-blue-200',    bgSoft: 'bg-blue-50' },
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', bgSoft: 'bg-emerald-50' },
  red:     { dot: 'bg-red-500',     text: 'text-red-700',     border: 'border-red-200',     bgSoft: 'bg-red-50' },
  amber:   { dot: 'bg-amber-500',   text: 'text-amber-700',   border: 'border-amber-200',   bgSoft: 'bg-amber-50' },
  purple:  { dot: 'bg-purple-500',  text: 'text-purple-700',  border: 'border-purple-200',  bgSoft: 'bg-purple-50' },
  slate:   { dot: 'bg-slate-500',   text: 'text-slate-700',   border: 'border-slate-200',   bgSoft: 'bg-slate-50' },
};
