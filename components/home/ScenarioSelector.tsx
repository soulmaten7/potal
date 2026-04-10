'use client';

/**
 * ScenarioSelector — CW23 홈페이지 리디자인 Sprint 1
 *
 * 결정 3 (HOMEPAGE_REDESIGN_SPEC.md):
 *   - 상단 질문: "당신의 수출입 방식은?"
 *   - 6개 버튼 (3x2 그리드)
 *   - 버튼 클릭 시 페이지 이동 없이 URL query param 업데이트 (?type=seller)
 *   - 시나리오 상세 영역은 Sprint 2에서 구현 (여기서는 선택 상태만 관리)
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
  const base =
    'group relative flex flex-col items-start justify-between w-full min-h-[140px] px-6 py-5 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer';
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
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[28px] leading-none" aria-hidden="true">
          {scenario.icon}
        </span>
        <div>
          <div className="text-[17px] font-bold leading-tight">
            {c(scenario.titleKey)}
          </div>
          <div
            className={`text-[12px] mt-0.5 font-normal ${
              selected ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {c(scenario.subtitleKey)}
          </div>
        </div>
      </div>
      <div
        className={`text-[13px] italic font-medium ${
          selected ? 'text-amber-300' : 'text-slate-600 group-hover:text-[#02122c]'
        }`}
      >
        &ldquo;{c(scenario.questionKey)}&rdquo;
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
      className="w-full max-w-[1100px] mx-auto px-6 py-12"
    >
      <h1 className="text-center text-[32px] md:text-[40px] font-extrabold text-[#02122c] mb-10 leading-tight">
        {c(SCENARIO_TOP_QUESTION_KEY)}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCENARIOS.map(scenario => (
          <ScenarioButton
            key={scenario.id}
            scenario={scenario}
            selected={selected === scenario.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Sprint 1 placeholder: scenario detail panel will be built in Sprint 2 */}
      {selected && (
        <div
          aria-live="polite"
          className="mt-10 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center"
        >
          <div className="text-[14px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
            Selected scenario
          </div>
          <div className="text-[22px] font-bold text-[#02122c]">
            {c(SCENARIOS.find(s => s.id === selected)?.titleKey || '')}
          </div>
          <div className="text-[13px] text-slate-500 mt-3">
            Interactive demo + workflow code will appear here (Sprint 2 · CW24).
          </div>
        </div>
      )}
    </section>
  );
}

export default ScenarioSelector;
