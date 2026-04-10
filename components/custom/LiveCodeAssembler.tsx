'use client';

/**
 * LiveCodeAssembler — CW25 Sprint 3 (right 50% of CUSTOM builder)
 *
 * 결정 5 (HOMEPAGE_REDESIGN_SPEC.md 320~326):
 *   - 왼쪽 체크박스 선택/해제 시 즉시 오른쪽 코드 업데이트
 *   - 언어 탭: cURL / Python / Node / Go
 *   - [복사] 버튼
 *   - Direct Manipulation 효과 — "조립 중" 쾌감
 *
 * Code generation uses simple template concatenation (no AST).
 * When lib/custom/code-templates.ts is available, it reads per-feature
 * templates. Until then, generates inline stub code.
 */

import { useState, useEffect, useMemo } from 'react';
import type { CatalogEntry } from '@/lib/features/feature-catalog';
import { useFeatureGate } from '@/lib/auth/feature-gate';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';

export type Language = 'curl' | 'python' | 'node' | 'go';

const LANGUAGE_TABS: Array<{ id: Language; label: string }> = [
  { id: 'curl', label: 'cURL' },
  { id: 'python', label: 'Python' },
  { id: 'node', label: 'Node.js' },
  { id: 'go', label: 'Go' },
];

export interface LiveCodeAssemblerProps {
  selectedFeatures: CatalogEntry[];
}

function generateCurl(features: CatalogEntry[]): string {
  if (features.length === 0)
    return '# Select features on the left to see code here';

  const lines: string[] = ['#!/bin/bash', '# POTAL API — custom workflow', ''];
  let step = 0;
  for (const f of features) {
    if (!f.apiEndpoint) continue;
    step++;
    lines.push(`# Step ${step}: ${f.name}`);
    lines.push(`curl -s -X POST https://api.potal.app${f.apiEndpoint} \\`);
    lines.push(`  -H "Authorization: Bearer $POTAL_API_KEY" \\`);
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '{"source": "custom_builder"}'`);
    lines.push('');
  }
  if (step === 0)
    return '# Selected features have no API endpoints.\n# They are UI/config features that work automatically.';
  return lines.join('\n');
}

function generatePython(features: CatalogEntry[]): string {
  if (features.length === 0)
    return '# Select features on the left to see code here';

  const lines: string[] = [
    'import os',
    'from potal import Potal',
    '',
    'potal = Potal(api_key=os.environ["POTAL_API_KEY"])',
    '',
  ];
  let step = 0;
  for (const f of features) {
    if (!f.apiEndpoint) continue;
    step++;
    const method = f.slug.replace(/-/g, '_');
    lines.push(`# Step ${step}: ${f.name}`);
    lines.push(`result_${step} = potal.${method}()`);
    lines.push(`print(f"Step ${step} done: {result_${step}}")`);
    lines.push('');
  }
  if (step === 0)
    return '# Selected features have no API endpoints.';
  return lines.join('\n');
}

function generateNode(features: CatalogEntry[]): string {
  if (features.length === 0)
    return '// Select features on the left to see code here';

  const lines: string[] = [
    "import { Potal } from '@potal/sdk';",
    '',
    'const potal = new Potal({ apiKey: process.env.POTAL_API_KEY });',
    '',
  ];
  let step = 0;
  for (const f of features) {
    if (!f.apiEndpoint) continue;
    step++;
    const method = f.slug
      .split('-')
      .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
      .join('');
    lines.push(`// Step ${step}: ${f.name}`);
    lines.push(`const step${step} = await potal.${method}();`);
    lines.push('');
  }
  if (step === 0)
    return '// Selected features have no API endpoints.';
  return lines.join('\n');
}

function generateGo(features: CatalogEntry[]): string {
  if (features.length === 0)
    return '// Select features on the left to see code here';

  const lines: string[] = [
    'package main',
    '',
    'import (',
    '\t"fmt"',
    '\t"os"',
    '\t"github.com/potal/potal-go/potal"',
    ')',
    '',
    'func main() {',
    '\tc := potal.New(os.Getenv("POTAL_API_KEY"))',
    '',
  ];
  let step = 0;
  for (const f of features) {
    if (!f.apiEndpoint) continue;
    step++;
    const method = f.slug
      .split('-')
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join('');
    lines.push(`\t// Step ${step}: ${f.name}`);
    lines.push(`\tr${step}, _ := c.${method}()`);
    lines.push(`\tfmt.Println("Step ${step}:", r${step})`);
    lines.push('');
  }
  lines.push('}');
  if (step === 0)
    return '// Selected features have no API endpoints.';
  return lines.join('\n');
}

const GENERATORS: Record<Language, (fs: CatalogEntry[]) => string> = {
  curl: generateCurl,
  python: generatePython,
  node: generateNode,
  go: generateGo,
};

export default function LiveCodeAssembler({
  selectedFeatures,
}: LiveCodeAssemblerProps) {
  const [lang, setLang] = useState<Language>('node');
  const [copied, setCopied] = useState(false);

  const code = useMemo(
    () => GENERATORS[lang](selectedFeatures),
    [lang, selectedFeatures]
  );

  useEffect(() => {
    setCopied(false);
  }, [lang, selectedFeatures]);

  const apiCount = selectedFeatures.filter(f => f.hasApi).length;
  const { requireLogin, loginRequired, closeLoginRequired, featureLabel } = useFeatureGate();

  const handleCopy = async () => {
    if (!requireLogin('code copy')) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[15px] font-extrabold text-[#02122c]">
            Live code
          </h3>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {apiCount} API {apiCount === 1 ? 'call' : 'calls'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {selectedFeatures.length === 0
            ? 'Check features on the left to start assembling your workflow.'
            : `${selectedFeatures.length} feature${selectedFeatures.length > 1 ? 's' : ''} selected — code updates live.`}
        </p>
      </div>

      {/* Language tabs */}
      <div className="flex gap-1 px-5 pt-2 bg-slate-50 border-b border-slate-200">
        {LANGUAGE_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setLang(t.id)}
            aria-selected={lang === t.id}
            role="tab"
            className={`px-3 py-2 text-[11px] font-bold rounded-t-lg transition-colors ${
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
      <div className="flex-1 bg-[#0a1628] overflow-auto min-h-[320px]">
        <pre className="text-slate-100 p-5 text-[12px] leading-relaxed font-mono whitespace-pre">
          {code}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={handleCopy}
          disabled={selectedFeatures.length === 0}
          className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-colors ${
            copied
              ? 'bg-emerald-500 text-white'
              : selectedFeatures.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
