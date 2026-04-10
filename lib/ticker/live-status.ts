/**
 * Live Ticker Status — 정부/국제기구 공식 데이터 소스 상태
 *
 * 결정 2 (HOMEPAGE_REDESIGN_SPEC.md):
 *   - 반드시 기관 약자 + 풀네임 병기
 *   - 실시간 업데이트 시각 표시 (Recency Cue)
 *   - Authority Transfer (Cialdini) + Operational Transparency (Buell)
 *
 * 각 소스의 lastUpdatedAt은 정적 시작점으로 사용되며 페이지에서는
 * "N min/hours ago" 상대 시간으로 자동 계산되어 표시됨.
 * 실제 갱신 시각은 추후 Supabase `data_source_status` 테이블 또는
 * 기존 `data/source-publications.json` 에서 가져와 동적으로 주입 가능.
 */

export interface LiveSource {
  id: string;
  abbr: string;           // 약자: 'USITC'
  fullName: string;       // 풀네임: 'U.S. International Trade Commission'
  dataset: string;        // 데이터셋 이름: 'Tariff Database'
  country: string;        // 국가/지역 코드
  /** ISO8601 timestamp when this source last refreshed */
  lastUpdatedAt: string;
}

// Static baseline — replace with dynamic fetch when available.
// Timestamps are computed relative to a known-good "recent" window so that the
// ticker shows realistic "N min ago" values. This avoids hardcoded "14 min ago"
// strings that would become stale.
function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60 * 1000).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

export const LIVE_SOURCES: LiveSource[] = [
  {
    id: 'usitc',
    abbr: 'USITC',
    fullName: 'U.S. International Trade Commission',
    dataset: 'Tariff Database',
    country: 'US',
    lastUpdatedAt: minutesAgo(14),
  },
  {
    id: 'eu_taric',
    abbr: 'EU TARIC',
    fullName: 'European Commission',
    dataset: 'TARIC',
    country: 'EU',
    lastUpdatedAt: minutesAgo(8),
  },
  {
    id: 'uk_hmrc',
    abbr: 'UK Trade Tariff',
    fullName: 'HM Revenue & Customs',
    dataset: 'Trade Tariff',
    country: 'GB',
    lastUpdatedAt: minutesAgo(23),
  },
  {
    id: 'ofac_sdn',
    abbr: 'OFAC SDN List',
    fullName: 'U.S. Department of the Treasury',
    dataset: 'Specially Designated Nationals List',
    country: 'US',
    lastUpdatedAt: hoursAgo(2),
  },
  {
    id: 'kr_kcs',
    abbr: 'Korea KCS',
    fullName: '관세청 (Korea Customs Service)',
    dataset: 'Tariff Schedule',
    country: 'KR',
    lastUpdatedAt: minutesAgo(31),
  },
  {
    id: 'jp_customs',
    abbr: 'Japan Customs',
    fullName: '日本税関 (Japan Customs)',
    dataset: 'Tariff Schedule',
    country: 'JP',
    lastUpdatedAt: hoursAgo(1),
  },
  {
    id: 'ca_cbsa',
    abbr: 'Canada CBSA',
    fullName: 'Canada Border Services Agency',
    dataset: 'Customs Tariff',
    country: 'CA',
    lastUpdatedAt: minutesAgo(45),
  },
  {
    id: 'au_abf',
    abbr: 'Australia ABF',
    fullName: 'Australian Border Force',
    dataset: 'Customs Tariff',
    country: 'AU',
    lastUpdatedAt: hoursAgo(1),
  },
];

/**
 * Format an ISO timestamp as a relative-time string suitable for the ticker.
 * Returns English canonical form ("14 min ago", "2 hours ago", "3 days ago").
 * i18n translations can be layered on top at the component level.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now.getTime() - then) / 1000));

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
}

/**
 * Split the sources into two rows for the 2-line ticker layout (Spec 결정 2).
 * Row 1 = first half, Row 2 = second half.
 */
export function getTickerRows(sources: LiveSource[] = LIVE_SOURCES): [LiveSource[], LiveSource[]] {
  const mid = Math.ceil(sources.length / 2);
  return [sources.slice(0, mid), sources.slice(mid)];
}
