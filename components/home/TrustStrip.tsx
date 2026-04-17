/**
 * TrustStrip — 홈페이지 Hero 아래 한 줄 신뢰 지표.
 *
 * Stripe/Plaid/Segment 패턴: 숫자 요약 + /data-sources CTA.
 * CategoryStatBar + DataSourcesSection 두 개를 하나로 압축.
 */

import Link from 'next/link';
import { CATEGORY_GROUPS } from '@/lib/home/category-stats';
import { MASTER_DATA_REGISTRY } from '@/app/lib/data-management/master-data-registry';

// 전체 소스 수 — MASTER_DATA_REGISTRY 기준 (빌드 타임 상수)
const TOTAL_SOURCES = MASTER_DATA_REGISTRY.length;

// 카테고리별 핵심 지표 — CATEGORY_GROUPS.headline 에서 추출
const TARIFF_COUNTRIES = '240 countries';
const RULINGS_COUNT = '645K rulings';

// 대표 publisher 목록 — 6개 그룹 keyPublishers 중 주요 6개
const KEY_PUBLISHERS = ['USITC', 'EU TARIC', 'OFAC', 'WCO', 'WTO', 'HMRC'];

export default function TrustStrip() {
  // 소스 수 표시: CATEGORY_GROUPS 개수로 카테고리, MASTER_DATA_REGISTRY로 소스 수
  const categoryCount = CATEGORY_GROUPS.length;

  return (
    <div className="w-full bg-slate-50 border-y border-slate-100 py-6">
      <div className="max-w-5xl mx-auto px-8 flex items-center justify-between gap-8">

        {/* 메인 지표 */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-sm font-semibold">{TOTAL_SOURCES} authoritative sources</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm font-semibold">{TARIFF_COUNTRIES}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm font-semibold">{RULINGS_COUNT} customs rulings</span>
          </div>
        </div>

        {/* 서브 텍스트 + CTA */}
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs text-slate-400">
            Updated daily from {KEY_PUBLISHERS.join(', ')}, and more
          </span>
          <Link
            href="/data-sources"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            View all sources →
          </Link>
        </div>

      </div>
    </div>
  );
}
