'use client';

/**
 * CustomBuilder — CW25 Sprint 3
 *
 * 결정 5+6+11 (HOMEPAGE_REDESIGN_SPEC.md 284~333):
 *   - 왼쪽 50%: 140개 기능 체크박스 (카테고리 그룹 + 검색 + ℹ️ 툴팁)
 *   - 오른쪽 50%: LiveCodeAssembler (실시간 코드 조립)
 *   - [이 조합 저장하기] 버튼 (Sprint 4에서 Supabase 연동, 현재는 placeholder)
 *
 * ⚠️ 이 컴포넌트는 CUSTOM 시나리오 전용.
 *    5개 시나리오 페이지(seller/d2c/importer/exporter/forwarder)에 적용 금지.
 */

import { useState, useMemo, useCallback } from 'react';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { getCategoryGroups, FEATURE_COUNT, type CatalogEntry } from '@/lib/features/feature-catalog';
import FeatureCheckbox from './FeatureCheckbox';
import LiveCodeAssembler from './LiveCodeAssembler';
import MySavedCombos from './MySavedCombos';
import SaveComboModal from './SaveComboModal';

export default function CustomBuilder() {
  const { session } = useSupabase();
  const groups = useMemo(() => getCategoryGroups(), []);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveToast, setSaveToast] = useState('');
  const [comboRefreshKey, setComboRefreshKey] = useState(0);

  const handleToggle = useCallback((slug: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }, []);

  const searchLower = search.toLowerCase().trim();

  const selectedFeatures: CatalogEntry[] = useMemo(() => {
    const all: CatalogEntry[] = [];
    for (const g of groups) {
      for (const f of g.features) {
        if (selected.has(f.slug)) all.push(f);
      }
    }
    return all;
  }, [selected, groups]);

  return (
    <section
      aria-label="CUSTOM builder — assemble your workflow"
      className="w-full max-w-[1440px] mx-auto px-8 pt-4 pb-16"
    >
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[28px]" aria-hidden="true">⚙️</span>
        <div>
          <h2 className="text-[20px] font-extrabold text-[#02122c] leading-tight">
            CUSTOM — Build your own workflow
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Pick any combination of POTAL&apos;s {FEATURE_COUNT} features. The code
            on the right updates instantly.
          </p>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: feature checkboxes */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col max-h-[80vh]">
          {/* Search + counter */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search features..."
                aria-label="Search features"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
              />
              <span className="flex-none text-[12px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                {selected.size} selected
              </span>
            </div>
          </div>

          {/* Category groups */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
            {groups.map(group => {
              const visibleFeatures = searchLower
                ? group.features.filter(
                    f =>
                      f.name.toLowerCase().includes(searchLower) ||
                      f.description.toLowerCase().includes(searchLower) ||
                      f.slug.includes(searchLower)
                  )
                : group.features;

              if (visibleFeatures.length === 0) return null;

              return (
                <div key={group.category}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                      {group.label}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {visibleFeatures.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {visibleFeatures.map(f => (
                      <FeatureCheckbox
                        key={f.slug}
                        feature={f}
                        checked={selected.has(f.slug)}
                        onChange={handleToggle}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: live code assembler */}
        <div className="lg:sticky lg:top-8">
          <LiveCodeAssembler selectedFeatures={selectedFeatures} />
        </div>
      </div>

      {/* Save combo button */}
      <div className="mt-8 text-center">
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => {
            if (!session?.access_token) {
              setSaveToast('Log in to save your combo');
              setTimeout(() => setSaveToast(''), 3000);
              return;
            }
            setShowSaveModal(true);
          }}
          className={`px-8 py-3 rounded-xl text-[14px] font-bold transition-colors ${
            selected.size === 0
              ? 'border-2 border-dashed border-slate-300 text-slate-400 cursor-not-allowed'
              : 'bg-[#02122c] text-white hover:bg-[#0a1e3d]'
          }`}
        >
          Save this combo
        </button>
      </div>

      {/* Saved combos list */}
      <MySavedCombos
        key={comboRefreshKey}
        onLoadCombo={(features) => setSelected(new Set(features))}
      />

      {/* Save modal */}
      <SaveComboModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        featureCount={selected.size}
        onSave={async (name, description) => {
          const res = await fetch('/api/combos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session!.access_token}`,
            },
            body: JSON.stringify({
              name,
              description: description || undefined,
              selected_features: Array.from(selected),
            }),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message || 'Save failed');
          setShowSaveModal(false);
          setComboRefreshKey(k => k + 1);
          setSaveToast('Combo saved!');
          setTimeout(() => setSaveToast(''), 3000);
        }}
      />

      {/* Toast */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-[#02122c] text-white rounded-lg px-4 py-2 text-[13px] font-semibold shadow-lg">
          {saveToast}
        </div>
      )}
    </section>
  );
}
