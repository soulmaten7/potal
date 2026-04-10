'use client';

/**
 * ScenarioPanel — CW24 Sprint 2
 *
 * 결정 4 (HOMEPAGE_REDESIGN_SPEC.md 224~280):
 *   - 좌우 2분할: NonDevPanel (50%) + DevPanel (50%)
 *   - 5개 일반 시나리오 (seller/d2c/importer/exporter/forwarder): 2분할 렌더
 *   - custom 시나리오: CustomBuilder 렌더 (Sprint 3 CW25)
 *
 * 선택된 시나리오가 바뀌면 자식 컴포넌트가 각자 상태를 리셋한다 (key 전달).
 */

import { getScenarioById } from '@/lib/scenarios/scenario-config';
import NonDevPanel from './NonDevPanel';
import DevPanel from './DevPanel';
import CustomBuilder from '@/components/custom/CustomBuilder';

export interface ScenarioPanelProps {
  scenarioId: string;
}

// CustomPlaceholder removed — Sprint 3 (CW25) implemented the real CustomBuilder.

function TitleBar({ scenarioId }: { scenarioId: string }) {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return null;
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-[28px]" aria-hidden="true">{scenario.icon}</span>
      <div>
        <div className="text-[20px] font-extrabold text-[#02122c] leading-tight">
          POTAL for {scenario.titleKey.split('.').slice(-2, -1)[0]
            ? scenario.titleKey.replace('home.scenario.', '').replace('.title', '')
            : scenarioId}
        </div>
        <div className="text-[12px] text-slate-500 mt-0.5">
          Try the demo on the left — grab the code on the right.
        </div>
      </div>
    </div>
  );
}

export default function ScenarioPanel({ scenarioId }: ScenarioPanelProps) {
  const scenario = getScenarioById(scenarioId);

  return (
    <section
      aria-live="polite"
      aria-label="Scenario detail panel"
      className="w-full max-w-[1440px] mx-auto px-8 pt-6 pb-16"
    >
      <TitleBar scenarioId={scenarioId} />

      {scenario?.isCustom ? (
        <CustomBuilder />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="lg:sticky lg:top-6">
            <NonDevPanel key={`nd-${scenarioId}`} scenarioId={scenarioId} />
          </div>
          <DevPanel key={`dv-${scenarioId}`} scenarioId={scenarioId} />
        </div>
      )}
    </section>
  );
}
