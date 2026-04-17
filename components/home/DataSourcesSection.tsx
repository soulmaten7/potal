'use client';

/**
 * DataSourcesSection — 홈페이지 하단 Data Sources 섹션.
 *
 * CW38 Ticker Redesign:
 *   - 이전 marquee 티커의 "커버리지 증명" 역할을 확장.
 *   - 6개 카테고리 카드 (Tariff / Tax / Sanctions / Trade Remedies / FTA / Rulings).
 *   - 각 카드: 레이블, headline(볼륨/커버리지), 설명, 대표 publisher 3~4개, 마지막 업데이트.
 *   - 카드 클릭 → /data-sources (이미 존재하는 상세 페이지).
 *
 * 디자인 원칙:
 *   - 스크롤되지 않는 정적 grid → 사용자가 "내 도메인 여기 있나?" 3초 판단 가능.
 *   - Stripe/Plaid 커버리지 페이지 패턴.
 *   - 데스크톱 전용 (CLAUDE.md Rule 14) — md:grid-cols-3 까지만.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CATEGORY_GROUPS,
  ACCENT_CLASSES,
  latestUpdateForGroup,
  formatRelative,
  sourcesInGroup,
  type FreshnessSource,
} from '@/lib/home/category-stats';

export default function DataSourcesSection() {
  const [freshness, setFreshness] = useState<FreshnessSource[] | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000);

    async function fetchFreshness() {
      try {
        const res = await fetch('/api/v1/data-freshness');
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.sources)) {
          setFreshness(json.sources as FreshnessSource[]);
        }
      } catch {
        /* noop */
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
    <section
      aria-label="Data sources coverage"
      className="py-14 px-4 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/60"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-slate-500 tracking-widest uppercase mb-2">
            Data Sources
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-[#02122c] mb-2">
            Authoritative data, updated continuously
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
            POTAL aggregates {sumSources()} authoritative sources across 6 domains —
            directly from national customs, WCO, WTO, and trade enforcement authorities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_GROUPS.map(group => {
            const latest = latestUpdateForGroup(group, freshness);
            const isLive = !!latest;
            const sourcesCount = sourcesInGroup(group).length;
            const accent = ACCENT_CLASSES[group.accent];
            return (
              <Link
                key={group.key}
                href="/data-sources"
                className={`group flex flex-col p-5 rounded-xl border ${accent.border} bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        aria-hidden="true"
                        className={`inline-block w-2 h-2 rounded-full ${isLive ? accent.dot : 'bg-slate-300'}`}
                      />
                      <h3 className={`text-base font-bold ${accent.text}`}>{group.label}</h3>
                    </div>
                    <p className="text-sm text-slate-500">{group.headline}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {sourcesCount} {sourcesCount === 1 ? 'source' : 'sources'}
                  </span>
                </div>

                <p className="text-[13px] text-slate-600 leading-relaxed mb-4 flex-1">
                  {group.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {group.keyPublishers.slice(0, 3).map(pub => (
                      <span
                        key={pub}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${accent.bgSoft} ${accent.text}`}
                      >
                        {pub}
                      </span>
                    ))}
                    {group.keyPublishers.length > 3 && (
                      <span className="text-[10px] text-slate-400 py-0.5">
                        +{group.keyPublishers.length - 3}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {freshness === null
                      ? 'Loading…'
                      : `Updated ${formatRelative(latest, now)}`}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/data-sources"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            View all data sources &amp; freshness &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

/** 6개 그룹 안에 포함된 master-data-registry 소스 수 합계 (중복 없음 가정) */
function sumSources(): number {
  return CATEGORY_GROUPS.reduce((sum, g) => sum + sourcesInGroup(g).length, 0);
}
