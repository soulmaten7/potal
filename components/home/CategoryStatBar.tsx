'use client';

/**
 * CategoryStatBar — 홈페이지 Hero 아래 컴팩트 6-카테고리 stat 바.
 *
 * CW38 Ticker Redesign:
 *   - 이전 marquee 티커(<LiveTicker />) 를 대체하는 정적 "liveness" 디스플레이.
 *   - 각 카테고리의 실제 최신 DB timestamp(/api/v1/data-freshness)를 받아
 *     "Updated 2h ago" 형식으로 표시.
 *   - 스크롤이 아닌 정적 배치 → 사용자가 한눈에 스캔 가능.
 *
 * 디자인 원칙 (권위자 기준):
 *   - Stripe/Plaid 스타일의 status indicator 패턴 (녹색 점 + 타임스탬프)
 *   - 6개 pill 을 한 줄 또는 두 줄 flex-wrap 으로 배치 (데스크톱 전용)
 */

import { useEffect, useState } from 'react';
import {
  CATEGORY_GROUPS,
  ACCENT_CLASSES,
  latestUpdateForGroup,
  formatRelative,
  type FreshnessSource,
} from '@/lib/home/category-stats';

export default function CategoryStatBar() {
  const [freshness, setFreshness] = useState<FreshnessSource[] | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // 상대시간 갱신 (30s)
    const tick = setInterval(() => setNow(new Date()), 30_000);

    // Freshness API 호출 (5min 캐시)
    async function fetchFreshness() {
      try {
        const res = await fetch('/api/v1/data-freshness');
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.sources)) {
          setFreshness(json.sources as FreshnessSource[]);
        }
      } catch {
        /* noop — 이전 상태 유지 */
      }
    }
    fetchFreshness();
    const refetch = setInterval(fetchFreshness, 5 * 60 * 1000);

    return () => {
      clearInterval(tick);
      clearInterval(refetch);
    };
  }, []);

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
      {CATEGORY_GROUPS.map(group => {
        const latest = latestUpdateForGroup(group, freshness);
        const isLive = !!latest;
        const accent = ACCENT_CLASSES[group.accent];
        return (
          <div
            key={group.key}
            className="flex items-center gap-2 text-slate-500"
            title={`${group.label} — ${group.headline}`}
          >
            <span
              aria-hidden="true"
              className={`inline-block w-1.5 h-1.5 rounded-full ${isLive ? accent.dot : 'bg-slate-300'}`}
            />
            <span className="font-semibold text-slate-700">{group.label}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{group.headline}</span>
            {freshness !== null && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400 text-[12px]">
                  Updated {formatRelative(latest, now)}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
