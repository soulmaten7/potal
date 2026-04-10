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
  // 1행 6열 레이아웃. 한 버튼의 가로폭이 1440px/6 - gap 을 고려해
  // 아이콘 + 짧은 제목 + 한 줄 서브타이틀만 콤팩트하게 보여준다.
  const base =
    'group relative flex flex-col items-center justify-center w-full min-h-[110px] px-3 py-4 rounded-xl border-2 text-center transition-all duration-150 cursor-pointer';
  const stateClass = selected
    ? 'bg-[#02122c] border-[#02122c] text-white shadow-lg'
    : 'bg-white border-slate-200 text-[#02122c] hover:border-[#F59E0B] hover:shadow-md';

  return (
    <button
      type="button"
      onClick={() => onSelect(scenario.id)}
      aria-pressed={selected}
      className={`${base} ${stateClass}`}
    >
      <span className="text-[26px] leading-none mb-2" aria-hidden="true">
        {scenario.icon}
      </span>
      <div className="text-[13px] font-bold leading-tight">
        {c(scenario.titleKey)}
      </div>
      <div
        className={`text-[11px] mt-1 font-normal leading-snug ${
          selected ? 'text-slate-300' : 'text-slate-500'
        }`}
      >
        {c(scenario.subtitleKey)}
      </div>
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

  const [selected, setSelected] = useState<ScenarioId | null>(urlType);

  // Sync internal state if URL query changes (e.g. back button)
  useEffect(() => {
    if (urlType !== selected) {
      setSelected(urlType);
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
      className="w-full max-w-[1440px] mx-auto px-8 py-12"
    >
      <h1 className="text-center text-[32px] md:text-[40px] font-extrabold text-[#02122c] mb-10 leading-tight">
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

      {/* Sprint 1 placeholder: scenario detail panel will be built in Sprint 2.
          Show the scenario's guiding question so the panel does not feel empty
          even without the interactive demo. */}
      {selected && (
        <div
          aria-live="polite"
          className="mt-10 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center"
        >
          <div className="text-[14px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
            Selected scenario
          </div>
          <div className="text-[24px] font-bold text-[#02122c]">
            {c(SCENARIOS.find(s => s.id === selected)?.titleKey || '')}
          </div>
          <div className="text-[16px] italic text-slate-600 mt-3">
            &ldquo;{c(SCENARIOS.find(s => s.id === selected)?.questionKey || '')}&rdquo;
          </div>
          <div className="text-[12px] text-slate-400 mt-6">
            Interactive demo + workflow code will appear here (Sprint 2 · CW24).
          </div>
        </div>
      )}
    </section>
  );
}

export default ScenarioSelector;
