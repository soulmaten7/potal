'use client';

/**
 * FeatureCheckbox — CW25 Sprint 3
 *
 * 결정 5+11 (HOMEPAGE_REDESIGN_SPEC.md):
 *   - 기능명 + 체크박스
 *   - ℹ️ 호버 시 설명 툴팁
 *   - API 있으면 slug pill 표시
 */

import { useState, useRef } from 'react';
import type { CatalogEntry } from '@/lib/features/feature-catalog';

export interface FeatureCheckboxProps {
  feature: CatalogEntry;
  checked: boolean;
  onChange: (slug: string, checked: boolean) => void;
}

export default function FeatureCheckbox({ feature, checked, onChange }: FeatureCheckboxProps) {
  const [showTip, setShowTip] = useState(false);
  const tipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    tipTimeout.current = setTimeout(() => setShowTip(true), 350);
  };

  const handleMouseLeave = () => {
    if (tipTimeout.current) clearTimeout(tipTimeout.current);
    setShowTip(false);
  };

  return (
    <label
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        checked
          ? 'bg-amber-50 border border-amber-300'
          : 'bg-white border border-slate-200 hover:border-slate-300'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(feature.slug, e.target.checked)}
        className="accent-[#F59E0B] w-4 h-4 flex-none"
      />
      <span className="flex-1 min-w-0">
        <span className="text-[13px] font-semibold text-[#02122c] leading-tight">
          {feature.name}
        </span>
        {feature.hasApi && (
          <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 align-middle">
            API
          </span>
        )}
      </span>
      <span
        className="relative flex-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-help"
          aria-label={`Info: ${feature.name}`}
        >
          i
        </span>
        {showTip && (
          <span
            role="tooltip"
            className="absolute z-50 right-0 top-full mt-1 w-56 px-3 py-2 rounded-lg bg-slate-900 text-white text-[11px] leading-relaxed shadow-lg pointer-events-none"
          >
            {feature.description}
            {feature.apiEndpoint && (
              <span className="block mt-1 font-mono text-[10px] text-amber-300">
                {feature.apiEndpoint}
              </span>
            )}
          </span>
        )}
      </span>
    </label>
  );
}
