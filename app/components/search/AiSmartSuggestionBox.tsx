"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '@/components/icons';
import type { AiSuggestions, FilterAxis } from '@/components/search/FilterSidebar';

interface AiSmartSuggestionBoxProps {
  loading: boolean;
  /** 질문형 쿼리 여부 */
  isQuestionQuery?: boolean;
  /** QueryAgent가 반환한 추천 상품 카테고리 키워드 */
  suggestedProducts?: string[];
  /** 일반 검색 시 AI 제안 */
  aiSuggestions?: AiSuggestions | null;
  /** 현재 검색어 */
  query: string;
  /** 질문형: 카테고리 칩 클릭 → 해당 키워드로 새 검색 */
  onCategoryClick: (keyword: string) => void;
  /** 일반형: Apply 시 체크된 키워드로 기존 결과 클라이언트 필터링 */
  onApplyFilters: (keywords: string[]) => void;
  /** Clear 시 필터 해제 */
  onClearFilters: () => void;
  /** 현재 활성화된 AI 필터 (부모에서 관리) */
  activeFilters?: Set<string>;
}

export function AiSmartSuggestionBox({
  loading,
  isQuestionQuery,
  suggestedProducts,
  aiSuggestions,
  query,
  onCategoryClick,
  onApplyFilters,
  onClearFilters,
  activeFilters,
}: AiSmartSuggestionBoxProps) {
  const [isOpen, setIsOpen] = useState(true);
  // 실제 필터링에 사용될 세부값 체크 (예: "2-Person", "Waterproof")
  const [checkedValues, setCheckedValues] = useState<Set<string>>(new Set());
  // Related 축 펼침 상태 (예: "Person", "Type" — 체크하면 세부값 표시)
  const [expandedAxes, setExpandedAxes] = useState<Set<string>>(new Set());

  // 새 검색 결과가 오면 모든 상태 초기화
  useEffect(() => {
    setCheckedValues(new Set());
    setExpandedAxes(new Set());
  }, [aiSuggestions, isQuestionQuery]);

  // 부모의 activeFilters가 비워지면 내부 체크도 동기화
  useEffect(() => {
    if (activeFilters && activeFilters.size === 0) {
      setCheckedValues(new Set());
    }
  }, [activeFilters]);

  // ━━━ Related 축 토글 (펼치기/접기 — Apply 불필요, 즉시 반응) ━━━
  const toggleAxis = useCallback((axisName: string) => {
    setExpandedAxes(prev => {
      const next = new Set(prev);
      if (next.has(axisName)) next.delete(axisName); else next.add(axisName);
      return next;
    });
  }, []);

  // ━━━ 세부값 체크 토글 (실제 필터링 대상) ━━━
  const toggleValue = useCallback((value: string) => {
    setCheckedValues(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }, []);

  // ━━━ 브랜드 체크 토글 ━━━
  const toggleBrand = useCallback((brand: string) => {
    setCheckedValues(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand); else next.add(brand);
      return next;
    });
  }, []);

  const handleApply = () => {
    if (checkedValues.size === 0) return;
    onApplyFilters(Array.from(checkedValues));
  };

  const handleClear = () => {
    setCheckedValues(new Set());
    setExpandedAxes(new Set());
    onClearFilters();
  };

  // ━━━ State 1: 질문형 쿼리 — 카테고리 선택 ━━━
  if (isQuestionQuery && suggestedProducts && suggestedProducts.length > 0) {
    return (
      <div>
        <div className="mb-4 h-[40px] flex items-center">
          <div className="w-full h-full bg-[#02122c] rounded-md flex items-center justify-between px-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Icons.Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-[15px] font-extrabold text-white tracking-widest uppercase">AI Smart Suggestion</span>
            </div>
            <button onClick={() => setIsOpen(!isOpen)}>
              <Icons.ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div>
            <p className="text-[13px] font-bold text-slate-500 uppercase mb-3 tracking-wider">Select a category</p>
            <div className="flex flex-wrap gap-2">
              {suggestedProducts.map((product) => (
                <button
                  key={product}
                  onClick={() => onCategoryClick(product)}
                  className="group flex items-center gap-2 px-4 py-2 text-[14px] font-bold rounded-md border border-slate-200 bg-white text-[#02122c] hover:border-[#F59E0B] hover:bg-[#F59E0B]/5 transition-all active:scale-[0.98]"
                >
                  <span className="capitalize">{product}</span>
                  <Icons.ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#F59E0B] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ━━━ 로딩 스켈레톤 (전체 페이지 로딩) ━━━
  if (loading) {
    return (
      <div>
        <div className="mb-4 h-[40px] flex items-center">
          <div className="w-full h-full bg-[#02122c]/80 rounded-md flex items-center px-4 shadow-sm animate-pulse">
            <div className="h-4 bg-white/20 rounded w-48" />
          </div>
        </div>
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-slate-200 rounded w-16" />
              <div className="h-5 bg-slate-200 rounded w-full" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ━━━ AI 결과 대기 중 (상품은 로드됨, AI suggestion만 로딩) ━━━
  if (!loading && !isQuestionQuery && aiSuggestions === null) {
    return (
      <div>
        <div className="h-[40px] flex items-center">
          <div className="w-full h-full bg-[#02122c] rounded-md flex items-center justify-between px-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Icons.Sparkles className="w-4 h-4 text-[#F59E0B] animate-pulse" />
              <span className="text-[15px] font-extrabold text-white tracking-widest uppercase">AI Smart Suggestion</span>
            </div>
            <span className="text-[12px] text-white/50">Analyzing...</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="animate-pulse flex items-center gap-4 flex-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-6 bg-slate-200 rounded w-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ━━━ State 2: 일반 검색 — 계층형 필터 (Brands + Related Axes) ━━━
  const brands = aiSuggestions?.Brands ?? [];
  const axes: FilterAxis[] = aiSuggestions?.Axes ?? [];
  // 하위호환: axes가 없으면 Keywords를 단일 축으로 변환
  const effectiveAxes: FilterAxis[] = axes.length > 0
    ? axes
    : (aiSuggestions?.Keywords?.length ?? 0) > 0
      ? [{ name: 'Related', values: aiSuggestions!.Keywords! }]
      : [];

  const hasAnySuggestions = brands.length > 0 || effectiveAxes.length > 0;
  if (!hasAnySuggestions) return null;

  return (
    <div>
      {/* ━━━ 헤더 바 ━━━ */}
      <div className="h-[40px] flex items-center">
        <div className="w-full h-full bg-[#02122c] rounded-md flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Icons.Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[15px] font-extrabold text-white tracking-widest uppercase">AI Smart Suggestion</span>
          </div>
          <div className="flex items-center gap-3">
            {checkedValues.size > 0 && (
              <span className="text-[12px] font-bold text-[#F59E0B]">{checkedValues.size} selected</span>
            )}
            <button onClick={() => setIsOpen(!isOpen)}>
              <Icons.ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-2 mt-3">
          {/* ━━━ Row 1: Top Brands ━━━ */}
          {brands.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider shrink-0 w-[100px]">Top Brands</span>
              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap flex-1">
                {brands.slice(0, 8).map(brand => (
                  <SuggestionCheckbox
                    key={brand}
                    label={brand}
                    checked={checkedValues.has(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                ))}
              </div>
              {/* Apply + Clear — 브랜드 행 오른쪽 끝 */}
              {checkedValues.size > 0 && (
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleClear}
                    className="text-[14px] font-bold text-slate-400 hover:text-[#02122c] hover:underline transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-3 py-1 bg-[#F59E0B] text-white font-bold text-[14px] rounded hover:bg-[#D97706] transition-all active:scale-[0.98]"
                  >
                    Apply ({checkedValues.size})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ━━━ Row 2: Related — 축 이름들 (클릭으로 펼침, Apply 불필요) ━━━ */}
          {effectiveAxes.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider shrink-0 w-[100px]">Related</span>
              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap flex-1">
                {effectiveAxes.map(axis => (
                  <AxisToggle
                    key={axis.name}
                    label={axis.name}
                    expanded={expandedAxes.has(axis.name)}
                    valueCount={axis.values.length}
                    onToggle={() => toggleAxis(axis.name)}
                  />
                ))}
              </div>
              {/* Apply + Clear — brands가 없을 때 이 행에 표시 */}
              {brands.length === 0 && checkedValues.size > 0 && (
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleClear}
                    className="text-[14px] font-bold text-slate-400 hover:text-[#02122c] hover:underline transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-3 py-1 bg-[#F59E0B] text-white font-bold text-[14px] rounded hover:bg-[#D97706] transition-all active:scale-[0.98]"
                  >
                    Apply ({checkedValues.size})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ━━━ Row 3+: 펼쳐진 축의 세부값 체크박스 ━━━ */}
          {effectiveAxes
            .filter(axis => expandedAxes.has(axis.name))
            .map(axis => (
              <div key={`values-${axis.name}`} className="flex items-center gap-3 ml-[100px] pl-3 border-l-2 border-[#F59E0B]/30">
                <span className="text-[12px] font-bold text-[#F59E0B]/70 uppercase tracking-wider shrink-0 w-[70px]">{axis.name}</span>
                <div className="flex items-center gap-x-4 gap-y-1 flex-wrap flex-1">
                  {axis.values.map(value => (
                    <SuggestionCheckbox
                      key={value}
                      label={value}
                      checked={checkedValues.has(value)}
                      onChange={() => toggleValue(value)}
                    />
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

/** 축 토글 버튼 — 체크박스가 아닌 expand/collapse 토글 */
function AxisToggle({ label, expanded, valueCount, onToggle }: {
  label: string;
  expanded: boolean;
  valueCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[14px] font-bold transition-all
        ${expanded
          ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-[#02122c]'
          : 'bg-white border-slate-200 text-slate-600 hover:border-[#F59E0B]/50 hover:bg-[#F59E0B]/5'
        }`}
    >
      <span>{label}</span>
      <span className={`text-[11px] font-normal ${expanded ? 'text-[#F59E0B]' : 'text-slate-400'}`}>
        {valueCount}
      </span>
      <Icons.ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180 text-[#F59E0B]' : 'text-slate-400'}`} />
    </button>
  );
}

/** 체크박스 — 브랜드 및 세부값에 사용 */
function SuggestionCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group hover:bg-slate-100 px-1.5 py-0.5 rounded transition-colors">
      <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer appearance-none w-4 h-4 border-2 border-slate-400 rounded-[3px] bg-transparent checked:bg-[#F59E0B] checked:border-[#F59E0B] transition-all" />
        <Icons.Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
      </div>
      <span className="text-[14px] font-bold text-slate-700 group-hover:text-[#02122c] whitespace-nowrap">{label}</span>
    </label>
  );
}
