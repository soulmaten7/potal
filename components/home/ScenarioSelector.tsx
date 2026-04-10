'use client';

/**
 * ScenarioSelector — CW23 홈페이지 리디자인 Sprint 1
 *
 * 결정 3 (HOMEPAGE_REDESIGN_SPEC.md) + CW23-S1b 사용자 피드백:
 *   - 상단 질문: "당신의 수출입 방식은?"
 *   - 6개 버튼 — ≥1024px 에서는 1행 6열, <1024px 에서는 2행 3열
 *   - 버튼 디자인: 컴팩트(아이콘 + 타이틀 + 서브타이틀), min-h 110px
 *   - 버튼 클릭 시 페이지 이동 없이 URL query param 업데이트 (?type=seller)
 *   - 시나리오 상세 영역은 Sprint 2에서 구현 (여기서는 선택 상태 + 가이드 질문만 표시)
 *
 * 선택된 상태는 URL `?type=` 쿼리 파라미터로 유지 → 북마크/공유 가능.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ScenarioPanel from './ScenarioPanel';
import {
  SCENARIOS,
  SCENARIO_FALLBACK_COPY,
  SCENARIO_TOP_QUESTION_KEY,
  type ScenarioConfig,
  type ScenarioId,
} from '@/lib/scenarios/scenario-config';

// Use fallback copy directly — these keys are added to i18n translations
// incrementally; for Sprint 1 we render English fallbacks so the page is
// functional without waiting on translations.
function c(key: string): string {
  return SCENARIO_FALLBACK_COPY[key] || key;
}

interface ScenarioButtonProps {
  scenario: ScenarioConfig;
  selected: boolean;
  onSelect: (id: ScenarioId) => void;
}

function ScenarioButton({ scenario, selected, onSelect }: ScenarioButtonProps) {
  // CW30-HF2: 가로 1줄 배치, 서브타이틀 제거 (패널 헤더로 이전).
  // min-h 110px → 52px 로 대폭 축소 → hero 압축과 합쳐 Calculate 버튼을 fold 위로 끌어올림.
  const base =
    'group relative flex flex-row items-center justify-center gap-2 w-full min-h-[52px] px-3 py-2 rounded-lg border-2 text-center transition-all duration-150 cursor-pointer';
  const stateClass = selected
    ? 'bg-[#02122c] border-[#02122c] text-white shadow-md'
    : 'bg-white border-slate-200 text-[#02122c] hover:border-[#F59E0B] hover:shadow-sm';

  return (
    <button
      type="button"
      onClick={() => onSelect(scenario.id)}
      aria-pressed={selected}
      aria-label={`${c(scenario.titleKey)} — ${c(scenario.subtitleKey)}`}
      className={`${base} ${stateClass}`}
    >
      <span className="text-[20px] leading-none flex-none" aria-hidden="true">
        {scenario.icon}
      </span>
      <span className="text-[13px] font-bold leading-tight whitespace-nowrap">
        {c(scenario.titleKey)}
      </span>
    </button>
  );
}

export function ScenarioSelector({
  onSelect,
}: {
  onSelect?: (id: ScenarioId) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlType = searchParams.get('type') as ScenarioId | null;

  // Default to 'seller' when no ?type= query param — CW30 hotfix 1.
  // Rationale: first-time visitors should see a completed scenario panel
  // immediately (POTAL for seller) so they grasp the interaction model
  // before clicking other persona boxes.
  const [selected, setSelected] = useState<ScenarioId | null>(
    urlType ?? 'seller'
  );

  // Sync internal state if URL query changes (e.g. back button, home link click).
  // When URL has no ?type= param (fresh / or home link), fall back to 'seller'
  // so the user always sees a completed scenario panel. — CW30 hotfix 1
  useEffect(() => {
    const next = urlType ?? 'seller';
    if (next !== selected) {
      setSelected(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlType]);

  const handleSelect = useCallback(
    (id: ScenarioId) => {
      setSelected(id);
      // Update URL without full navigation
      const params = new URLSearchParams(searchParams.toString());
      params.set('type', id);
      router.replace(`/?${params.toString()}`, { scroll: false });
      onSelect?.(id);
    },
    [router, searchParams, onSelect]
  );

  return (
    <section
      aria-label="Choose your scenario"
      className="w-full max-w-[1440px] mx-auto px-8 pt-6 pb-4"
    >
      <h1 className="text-center text-[22px] md:text-[26px] font-extrabold text-[#02122c] mb-5 leading-tight">
        {c(SCENARIO_TOP_QUESTION_KEY)}
      </h1>

      {/* 6 scenarios in one row. On narrower viewports (< 1024px) fall back to
          3 columns × 2 rows so buttons remain legible, but ≥1024px we use 6
          columns per the user's explicit request. */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {SCENARIOS.map(scenario => (
          <ScenarioButton
            key={scenario.id}
            scenario={scenario}
            selected={selected === scenario.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Sprint 2 (CW24): 좌우 2분할 시나리오 상세 패널.
          custom 은 ScenarioPanel 내부에서 placeholder 로 처리. */}
      {selected && (
        <div className="mt-10 -mx-8">
          <ScenarioPanel scenarioId={selected} />
        </div>
      )}
    </section>
  );
}

export default ScenarioSelector;
