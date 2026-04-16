/**
 * Live Ticker Status — 정부/국제기구 공식 데이터 소스 상태
 *
 * CW38-HF20: 가짜 minutesAgo() 하드코딩 제거 → /api/v1/data-freshness 실제 API 연결
 *
 * 결정 2 (HOMEPAGE_REDESIGN_SPEC.md):
 *   - 반드시 기관 약자 + 풀네임 병기
 *   - 실시간 업데이트 시각 표시 (Recency Cue)
 *   - Authority Transfer (Cialdini) + Operational Transparency (Buell)
 */

export interface LiveSource {
  id: string;
  abbr: string;           // 약자: 'USITC'
  fullName: string;       // 풀네임: 'U.S. International Trade Commission'
  dataset: string;        // 데이터셋 이름: 'Tariff Database'
  country: string;        // 국가/지역 코드
  /** ISO8601 timestamp when this source last refreshed (null = unknown) */
  lastUpdatedAt: string | null;
}

/** Metadata for each source — used to enrich API response with fullName/dataset/country */
const SOURCE_META: Record<string, Omit<LiveSource, 'lastUpdatedAt'>> = {
  'USITC':            { id: 'usitc',        abbr: 'USITC',            fullName: 'U.S. International Trade Commission',   dataset: 'Tariff Database',                country: 'US' },
  'EU TARIC':         { id: 'eu_taric',     abbr: 'EU TARIC',         fullName: 'European Commission',                   dataset: 'TARIC',                          country: 'EU' },
  'UK Trade Tariff':  { id: 'uk_hmrc',      abbr: 'UK Trade Tariff',  fullName: 'HM Revenue & Customs',                  dataset: 'Trade Tariff',                   country: 'GB' },
  'Canada CBSA':      { id: 'ca_cbsa',      abbr: 'Canada CBSA',      fullName: 'Canada Border Services Agency',         dataset: 'Customs Tariff',                 country: 'CA' },
  'Australia ABF':    { id: 'au_abf',       abbr: 'Australia ABF',    fullName: 'Australian Border Force',               dataset: 'Customs Tariff',                 country: 'AU' },
  'Korea KCS':        { id: 'kr_kcs',       abbr: 'Korea KCS',        fullName: '관세청 (Korea Customs Service)',          dataset: 'Tariff Schedule',                country: 'KR' },
  'Japan Customs':    { id: 'jp_customs',   abbr: 'Japan Customs',    fullName: '日本税関 (Japan Customs)',                dataset: 'Tariff Schedule',                country: 'JP' },
  'MacMap MFN':       { id: 'macmap',       abbr: 'MacMap MFN',       fullName: 'ITC MacMap',                            dataset: 'MFN Applied Tariffs',            country: 'INTL' },
  'Exchange Rates':   { id: 'exchange',     abbr: 'Exchange Rates',   fullName: 'European Central Bank',                 dataset: 'Daily FX Rates',                 country: 'INTL' },
  'Section 301/232':  { id: 'section301',   abbr: 'Section 301/232',  fullName: 'U.S. Trade Representative',             dataset: 'Additional Tariffs',             country: 'US' },
  'Trade Remedies':   { id: 'trade_remedy', abbr: 'Trade Remedies',   fullName: 'ITA Enforcement & Compliance',          dataset: 'AD/CVD Orders',                  country: 'US' },
  'FTA Agreements':   { id: 'fta',          abbr: 'FTA Agreements',   fullName: 'WTO / Bilateral Agreements',            dataset: 'Free Trade Agreements',           country: 'INTL' },
};

/**
 * Convert API response to LiveSource array.
 * API returns: { sources: [{ name: string, lastUpdated: string|null, source: string }] }
 */
export function apiToLiveSources(
  apiSources: { name: string; lastUpdated: string | null }[],
): LiveSource[] {
  return apiSources
    .map(s => {
      const meta = SOURCE_META[s.name];
      if (!meta) return null;
      return { ...meta, lastUpdatedAt: s.lastUpdated };
    })
    .filter((s): s is LiveSource => s !== null);
}

/**
 * Format an ISO timestamp as a relative-time string suitable for the ticker.
 * Returns English canonical form ("14 min ago", "2 hours ago", "3 days ago").
 */
export function formatRelativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'N/A';
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
export function getTickerRows(sources: LiveSource[]): [LiveSource[], LiveSource[]] {
  const mid = Math.ceil(sources.length / 2);
  return [sources.slice(0, mid), sources.slice(mid)];
}
