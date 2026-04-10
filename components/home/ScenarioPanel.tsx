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

import { useState } from 'react';
import { getScenarioById, SCENARIO_FALLBACK_COPY } from '@/lib/scenarios/scenario-config';
import { SCENARIO_DEFAULTS } from '@/lib/scenarios/workflow-examples';
import NonDevPanel from './NonDevPanel';
import DevPanel from './DevPanel';
import CustomBuilder from '@/components/custom/CustomBuilder';

/**
 * CW32: Seed the lifted inputs state with each scenario's default values
 * so the Calculate button is active the moment a user lands on the page.
 * Users can still edit any field; their edits are preserved per scenarioId.
 */
function makeInitialInputs(): Record<string, Record<string, string | number | string[]>> {
  const out: Record<string, Record<string, string | number | string[]>> = {};
  for (const [id, d] of Object.entries(SCENARIO_DEFAULTS)) {
    const entry: Record<string, string | number | string[]> = {
      product: d.product,
      from: d.from,
      value: typeof d.value === 'number' ? d.value : Number(d.value) || 0,
    };
    if (id === 'forwarder' && d.destinations) {
      entry.destinations = [...d.destinations];
    } else {
      entry.to = d.to;
    }
    if (d.quantity !== undefined) entry.quantity = d.quantity;
    // importer scenario needs a container default — pick a common one
    if (id === 'importer') entry.container = '40ft';
    out[id] = entry;
  }
  return out;
}

export interface ScenarioPanelProps {
  scenarioId: string;
}

// CustomPlaceholder removed — Sprint 3 (CW25) implemented the real CustomBuilder.

// CW30-HF2: 시나리오 박스의 서브타이틀을 이쪽 헤더로 이전.
// 포맷: `🛒 POTAL for seller — Etsy, Shopify, eBay`
function TitleBar({ scenarioId }: { scenarioId: string }) {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return null;

  // Fallback copy lookup — scenario-config.ts 에서 정의한 subtitle 문구 재사용.
  const subtitle = SCENARIO_FALLBACK_COPY[scenario.subtitleKey] || '';

  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[30px] leading-none flex-none" aria-hidden="true">
        {scenario.icon}
      </span>
      <h2 className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[22px] md:text-[26px] font-extrabold text-[#02122c] leading-tight">
          POTAL for {scenarioId}
        </span>
        {subtitle && (
          <span className="text-[13px] md:text-[15px] font-normal text-slate-500 leading-tight">
            — {subtitle}
          </span>
        )}
      </h2>
    </div>
  );
}

export default function ScenarioPanel({ scenarioId }: ScenarioPanelProps) {
  const scenario = getScenarioById(scenarioId);

  // CW31 "Honest Reset": lift inputs up so DevPanel code snippets reflect
  // whatever the user typed in NonDevPanel. Keyed by scenarioId so switching
  // scenarios resets the shared state.
  // CW31-HF1: values can be string | number | string[] (multiselect).
  // CW32: seed with SCENARIO_DEFAULTS so first-time visitors see an active
  // Calculate button and can run the demo without typing anything.
  const [inputsByScenario, setInputsByScenario] = useState<
    Record<string, Record<string, string | number | string[]>>
  >(() => makeInitialInputs());
  const currentInputs = inputsByScenario[scenarioId] || {};
  const setCurrentInputs = (next: Record<string, string | number | string[]>) => {
    setInputsByScenario(prev => ({ ...prev, [scenarioId]: next }));
  };

  return (
    <section
      aria-live="polite"
      aria-label="Scenario detail panel"
      className="w-full max-w-[1440px] mx-auto px-8 pt-4 pb-16"
    >
      <TitleBar scenarioId={scenarioId} />

      {scenario?.isCustom ? (
        <CustomBuilder />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="lg:sticky lg:top-6">
            <NonDevPanel
              key={`nd-${scenarioId}`}
              scenarioId={scenarioId}
              inputs={currentInputs}
              onInputsChange={setCurrentInputs}
            />
          </div>
          <DevPanel
            key={`dv-${scenarioId}`}
            scenarioId={scenarioId}
            inputs={currentInputs}
          />
        </div>
      )}
    </section>
  );
}
