'use client';

/**
 * DevPanel — CW24 Sprint 2 (right 50%)
 *
 * 결정 4 (HOMEPAGE_REDESIGN_SPEC.md 258~263):
 *   - 시나리오별 조합된 워크플로우 전체 코드 예제
 *   - 언어 탭: cURL / Python / Node / Go
 *   - [📋 Copy] + [API 문서 전체 보기 →] 링크
 *   - syntax highlighter 라이브러리 금지 — 수동 경색 tone
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LANGUAGE_TABS,
  getWorkflowExample,
  renderWorkflowCode,
  type Language,
  type WorkflowExample,
} from '@/lib/scenarios/workflow-examples';
import { useFeatureGate } from '@/lib/auth/feature-gate';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';

export interface DevPanelProps {
  scenarioId: string;
  /** CW31: lifted from ScenarioPanel so code snippets reflect live inputs. */
  inputs?: Record<string, string | number>;
}

export default function DevPanel({ scenarioId, inputs = {} }: DevPanelProps) {
  const [lang, setLang] = useState<Language>('curl');
  const [copied, setCopied] = useState(false);
  const { requireLogin, loginRequired, closeLoginRequired, featureLabel } = useFeatureGate();

  const example: WorkflowExample | null = getWorkflowExample(scenarioId);
  const renderedCode = example ? renderWorkflowCode(scenarioId, lang, inputs) : '';

  useEffect(() => {
    setCopied(false);
  }, [lang, scenarioId]);

  if (!example) {
    return (
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-8 flex flex-col items-center justify-center text-center text-slate-400">
        <div className="text-[32px] mb-3" aria-hidden="true">💻</div>
        <div className="text-[14px] font-bold text-slate-500">No code example</div>
        <div className="text-[12px] mt-2">Select a scenario to see the workflow code.</div>
      </div>
    );
  }

  const handleCopy = async () => {
    if (!requireLogin('code copy')) return;
    try {
      await navigator.clipboard.writeText(renderedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[18px]" aria-hidden="true">💻</span>
          <h3 className="text-[16px] font-extrabold text-[#02122c]">
            Developer workflow
          </h3>
        </div>
        <p className="text-[12px] text-slate-500 leading-relaxed">
          {example.description}
        </p>

        {/* Steps pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {example.apiChain.map((endpoint, i) => (
            <span
              key={endpoint}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono text-slate-600"
            >
              {i > 0 && <span className="text-slate-400 mr-0.5">→</span>}
              {endpoint}
            </span>
          ))}
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex gap-1 px-6 pt-3 bg-slate-50 border-b border-slate-200">
        {LANGUAGE_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setLang(t.id)}
            aria-selected={lang === t.id}
            role="tab"
            className={`px-3 py-2 text-[12px] font-bold rounded-t-lg transition-colors ${
              lang === t.id
                ? 'bg-[#0a1628] text-white'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="flex-1 bg-[#0a1628] overflow-y-auto relative max-h-[500px]">
        <pre className="text-slate-100 p-6 text-[12px] leading-relaxed font-mono whitespace-pre">
          {renderedCode}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
        <Link
          href={example.docsUrl}
          className="text-[12px] font-bold text-[#02122c] hover:text-[#F59E0B] transition-colors no-underline"
        >
          Full API docs →
        </Link>
        <button
          type="button"
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-colors ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-[#02122c] text-white hover:bg-[#0a1e3d]'
          }`}
        >
          {copied ? '✓ Copied!' : '📋 Copy code'}
        </button>
      </div>

      <LoginRequiredModal
        open={loginRequired}
        onClose={closeLoginRequired}
        featureLabel={featureLabel}
      />
    </div>
  );
}
