"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import type { AiSuggestions, FilterAxis } from '@/components/search/FilterSidebar';
import { MEMBERSHIP_REGISTRY } from '@/app/lib/membership/MembershipConfig';

// ── 리테일러 상수 (FilterSidebar와 동일) ──
const US_MAJOR_RETAILERS = ["Amazon", "Walmart", "Best Buy", "eBay", "Target", "Costco", "Home Depot", "Lowe's", "Macy's", "Apple", "Nike", "Kohl's", "Sephora", "Chewy", "Kroger", "Wayfair"];
const GLOBAL_RETAILERS = ["AliExpress", "Temu", "Shein", "iHerb", "DHgate", "YesStyle", "Farfetch", "ASOS", "Uniqlo", "Etsy", "MyTheresa", "Olive Young", "Mercari"];
const MEMBERSHIP_MAP = new Map(
  MEMBERSHIP_REGISTRY.map(rm => [rm.retailer, rm.programs])
);

interface AiSmartSuggestionBoxProps {
  loading: boolean;
  isQuestionQuery?: boolean;
  suggestedProducts?: string[];
  aiSuggestions?: AiSuggestions | null;
  query: string;
  onCategoryClick: (keyword: string) => void;
  onApplyFilters: (keywords: string[]) => void;
  onClearFilters: () => void;
  activeFilters?: Set<string>;
  /** ═══ 모바일 Filters 시트용 ═══ */
  priceMax?: number;
  setPriceMax?: (n: number) => void;
  selectedRetailers?: Set<string>;
  setSelectedRetailers?: (fn: (prev: Set<string>) => Set<string>) => void;
  allRetailers?: string[];
  totalResults?: number;
  /** ═══ 멤버십 ═══ */
  memberships?: Record<string, boolean>;
  setMemberships?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  /** ═══ 배송일 필터 ═══ */
  maxDeliveryDays?: number;
  setMaxDeliveryDays?: (n: number) => void;
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
  priceMax = 2000,
  setPriceMax,
  selectedRetailers,
  setSelectedRetailers,
  allRetailers = [],
  totalResults = 0,
  memberships = {},
  setMemberships,
  maxDeliveryDays = 30,
  setMaxDeliveryDays,
}: AiSmartSuggestionBoxProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [mobileAiSheetOpen, setMobileAiSheetOpen] = useState(false);
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);
  const [checkedValues, setCheckedValues] = useState<Set<string>>(new Set());
  const [expandedAxes, setExpandedAxes] = useState<Set<string>>(new Set());
  // Portal 마운트 상태
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setCheckedValues(new Set());
    setExpandedAxes(new Set());
  }, [aiSuggestions, isQuestionQuery]);

  useEffect(() => {
    if (activeFilters && activeFilters.size === 0) {
      setCheckedValues(new Set());
    }
  }, [activeFilters]);

  const toggleAxis = useCallback((axisName: string) => {
    setExpandedAxes(prev => {
      const next = new Set(prev);
      if (next.has(axisName)) next.delete(axisName); else next.add(axisName);
      return next;
    });
  }, []);

  const toggleValue = useCallback((value: string) => {
    setCheckedValues(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }, []);

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

  const toggleRetailer = (retailer: string) => {
    if (!setSelectedRetailers) return;
    setSelectedRetailers((prev: Set<string>) => {
      const n = new Set(prev); if (n.has(retailer)) n.delete(retailer); else n.add(retailer); return n;
    });
  };

  const toggleMembership = (programId: string) => {
    if (!setMemberships) return;
    setMemberships(prev => ({ ...prev, [programId]: !prev[programId] }));
  };

  // 공통 데이터 준비
  const brands = aiSuggestions?.Brands ?? [];
  const axes: FilterAxis[] = aiSuggestions?.Axes ?? [];
  const effectiveAxes: FilterAxis[] = axes.length > 0
    ? axes
    : (aiSuggestions?.Keywords?.length ?? 0) > 0
      ? [{ name: 'Related', values: aiSuggestions!.Keywords! }]
      : [];
  const hasAnySuggestions = brands.length > 0 || effectiveAxes.length > 0;

  // ═══════════════════════════════════════════════════════════════
  // 공통 하단 네비바 (다크테마)
  // ═══════════════════════════════════════════════════════════════
  const renderSheetBottomNav = (onClose: () => void) => (
    <div className="flex items-center justify-around h-14 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#02122c' }}>
      <button onClick={onClose} className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-indigo-400">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
        <span className="text-[10px] font-medium">Search</span>
      </button>
      <button onClick={() => { onClose(); router.push('/saved'); }} className="flex flex-col items-center gap-0.5 py-1.5 px-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
        <span className="text-[10px] font-medium">Wishlist</span>
      </button>
      <button onClick={() => { onClose(); router.push('/settings'); }} className="flex flex-col items-center gap-0.5 py-1.5 px-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        <span className="text-[10px] font-medium">Profile</span>
      </button>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // 다크테마 체크박스 (모바일 시트용)
  // ═══════════════════════════════════════════════════════════════
  const DarkCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <label className="flex items-center gap-2.5 cursor-pointer py-1.5 px-1 rounded transition-colors" style={{ backgroundColor: checked ? 'rgba(245,158,11,0.08)' : 'transparent' }}>
      <div className="relative flex items-center justify-center w-[18px] h-[18px] shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer appearance-none w-[18px] h-[18px] border-2 rounded-[3px] bg-transparent transition-all" style={{ borderColor: checked ? '#F59E0B' : 'rgba(255,255,255,0.3)', backgroundColor: checked ? '#F59E0B' : 'transparent' }} />
        <Icons.Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
      </div>
      <span className="text-[14px] font-bold whitespace-nowrap" style={{ color: checked ? '#F59E0B' : 'rgba(255,255,255,0.8)' }}>{label}</span>
    </label>
  );

  // ═══════════════════════════════════════════════════════════════
  // ═══ 모바일 풀스크린 AI 시트 (PC 레이아웃 매칭 — createPortal)
  // ═══════════════════════════════════════════════════════════════
  const renderMobileAiSheet = () => {
    if (!mobileAiSheetOpen || !mounted) return null;
    return createPortal(
      <div className="md:hidden fixed inset-0 z-[10001]">
        <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: '#02122c' }}>
          {/* Header — ← 뒤로가기 + 중앙 "AI Suggestion" 타이틀 */}
          <div className="relative flex items-center justify-center px-4 py-3.5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <button onClick={() => setMobileAiSheetOpen(false)} className="absolute left-3 p-1">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-1.5">
              <Icons.Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-[15px] font-extrabold text-white">AI Smart Suggestion</span>
            </div>
            {checkedValues.size > 0 && (
              <span className="absolute right-4 text-[12px] font-bold text-[#F59E0B]">{checkedValues.size} selected</span>
            )}
          </div>

          {/* Body — PC버전과 동일한 구조 (다크테마) */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {/* 질문형: 카테고리 선택 */}
            {isQuestionQuery && suggestedProducts && suggestedProducts.length > 0 && (
              <div>
                <p className="text-[13px] font-extrabold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Select a category</p>
                <div className="flex flex-wrap gap-2.5">
                  {suggestedProducts.map(p => (
                    <button key={p} onClick={() => { onCategoryClick(p); setMobileAiSheetOpen(false); }}
                      className="group flex items-center gap-2 px-4 py-2.5 text-[14px] font-bold rounded-lg transition-all"
                      style={{ border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }}>
                      <span className="capitalize">{p}</span>
                      <Icons.ArrowRight className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row 1: Top Brands — 체크박스 리스트 (PC와 동일) */}
            {brands.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Top Brands</p>
                  {checkedValues.size > 0 && (
                    <div className="flex items-center gap-3">
                      <button onClick={handleClear} className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Clear</button>
                      <button onClick={() => { handleApply(); setMobileAiSheetOpen(false); }} className="text-[12px] font-bold text-[#F59E0B]">Apply ({checkedValues.size})</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  {brands.slice(0, 10).map(brand => (
                    <DarkCheckbox key={brand} label={brand} checked={checkedValues.has(brand)} onChange={() => toggleBrand(brand)} />
                  ))}
                </div>
              </div>
            )}

            {/* Row 2: Related Axes — 확장형 토글 (PC와 동일) */}
            {effectiveAxes.length > 0 && (
              <div>
                <p className="text-[13px] font-extrabold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Related Filters</p>
                <div className="space-y-2">
                  {effectiveAxes.map(axis => (
                    <div key={axis.name}>
                      {/* 축 헤더 — 확장/축소 토글 */}
                      <button
                        onClick={() => toggleAxis(axis.name)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all"
                        style={{
                          backgroundColor: expandedAxes.has(axis.name) ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.06)',
                          border: expandedAxes.has(axis.name) ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-white">{axis.name}</span>
                          <span className="text-[11px] font-bold" style={{ color: expandedAxes.has(axis.name) ? '#F59E0B' : 'rgba(255,255,255,0.4)' }}>
                            {axis.values.length}
                          </span>
                        </div>
                        <Icons.ChevronDown className={`w-4 h-4 transition-transform ${expandedAxes.has(axis.name) ? 'rotate-180 text-[#F59E0B]' : ''}`} style={{ color: expandedAxes.has(axis.name) ? '#F59E0B' : 'rgba(255,255,255,0.4)' }} />
                      </button>
                      {/* 펼쳐진 세부값 — 체크박스 */}
                      {expandedAxes.has(axis.name) && (
                        <div className="mt-1 ml-3 pl-3 flex flex-col gap-0.5" style={{ borderLeft: '2px solid rgba(245,158,11,0.3)' }}>
                          {axis.values.map(v => (
                            <DarkCheckbox key={v} label={v} checked={checkedValues.has(v)} onChange={() => toggleValue(v)} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasAnySuggestions && !isQuestionQuery && (
              <p className="text-[13px] text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {aiSuggestions === null ? 'AI is analyzing results...' : 'No suggestions available'}
              </p>
            )}
          </div>

          {/* Bottom — Apply 버튼 + 하단 네비바 */}
          <div className="shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#02122c' }}>
            <div className="px-4 py-3">
              <button
                onClick={() => { if (checkedValues.size > 0) { onApplyFilters(Array.from(checkedValues)); } setMobileAiSheetOpen(false); }}
                className="w-full py-3 rounded-xl text-[14px] font-extrabold transition-all"
                style={{ backgroundColor: '#F59E0B', color: '#02122c' }}
              >
                {checkedValues.size > 0 ? `Apply ${checkedValues.size} Filters · ${totalResults} results` : `Show ${totalResults} results`}
              </button>
              {checkedValues.size > 0 && (
                <button onClick={handleClear} className="w-full mt-2 py-2 text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Clear All
                </button>
              )}
            </div>
            {renderSheetBottomNav(() => setMobileAiSheetOpen(false))}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // ═══ 모바일 풀스크린 Filters 시트 (PC FilterSidebar 매칭 — createPortal)
  // ═══════════════════════════════════════════════════════════════
  const renderMobileFilterSheet = () => {
    if (!mobileFilterSheetOpen || !mounted) return null;
    return createPortal(
      <div className="md:hidden fixed inset-0 z-[10001]">
        <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: '#02122c' }}>
          {/* Header — ← 뒤로가기 + 중앙 "Filters" 타이틀 */}
          <div className="relative flex items-center justify-center px-4 py-3.5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <button onClick={() => setMobileFilterSheetOpen(false)} className="absolute left-3 p-1">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-1.5">
              <Icons.Filter className="w-4 h-4 text-white/70" />
              <span className="text-[15px] font-extrabold text-white">Filters</span>
            </div>
          </div>

          {/* Body — PC FilterSidebar와 동일 구조 (다크테마) */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

            {/* ── PRICE RANGE ── */}
            {setPriceMax && (
              <div className="pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-white mb-3">Price Range</h3>
                <input type="range" min="0" max="2000" step="50" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div className="flex justify-between text-[13px] font-bold mt-2">
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>$0</span>
                  <span className="text-white">${priceMax}{priceMax === 2000 ? '+' : ''}</span>
                </div>
              </div>
            )}

            {/* ── ARRIVAL DATE ── */}
            <div className="pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-white mb-3">Arrival Date</h3>
              <input type="range" min="1" max="30" step="1" value={maxDeliveryDays} onChange={(e) => setMaxDeliveryDays?.(Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div className="flex justify-between text-[13px] font-bold mt-2">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Today</span>
                <span className="text-white">{maxDeliveryDays} Days{maxDeliveryDays === 30 ? '+' : ''}</span>
              </div>
            </div>

            {/* ── RETAILERS (Domestic 그룹) ── */}
            {setSelectedRetailers && (
              <div className="pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-white">Retailers</h3>
                  <div className="flex gap-3 text-[12px] font-extrabold">
                    <button onClick={() => setSelectedRetailers(() => new Set(allRetailers))} className="text-[#F59E0B]">Select All</button>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                    <button onClick={() => setSelectedRetailers(() => new Set())} style={{ color: 'rgba(255,255,255,0.4)' }}>Clear</button>
                  </div>
                </div>

                {/* Domestic */}
                <p className="text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Domestic</p>
                <div className="flex flex-col gap-0.5 mb-4">
                  {US_MAJOR_RETAILERS.map(r => {
                    const programs = MEMBERSHIP_MAP.get(r);
                    return (
                      <div key={r} className="flex items-center py-1 px-1 rounded transition-colors" style={{ backgroundColor: selectedRetailers?.has(r) ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                        <DarkCheckbox label={r} checked={selectedRetailers?.has(r) ?? false} onChange={() => toggleRetailer(r)} />
                        {/* 멤버십 토글 */}
                        {programs && programs.map(prog => {
                          const isActive = memberships[prog.id];
                          return (
                            <button
                              key={prog.id}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMembership(prog.id); }}
                              className="ml-auto shrink-0 text-[10px] font-bold px-2 py-[3px] rounded-full border transition-all"
                              style={{
                                backgroundColor: isActive ? prog.badgeBg : 'transparent',
                                color: isActive ? prog.badgeColor : 'rgba(255,255,255,0.3)',
                                borderColor: isActive ? 'transparent' : 'rgba(255,255,255,0.15)',
                              }}
                            >
                              {prog.badge}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Global */}
                <p className="text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Global</p>
                <div className="flex flex-col gap-0.5">
                  {GLOBAL_RETAILERS.map(r => (
                    <div key={r} className="flex items-center py-1 px-1 rounded transition-colors" style={{ backgroundColor: selectedRetailers?.has(r) ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                      <DarkCheckbox label={r} checked={selectedRetailers?.has(r) ?? false} onChange={() => toggleRetailer(r)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom — Show results + 하단 네비바 */}
          <div className="shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#02122c' }}>
            <div className="px-4 py-3">
              <button onClick={() => setMobileFilterSheetOpen(false)} className="w-full py-3 rounded-xl text-[14px] font-extrabold" style={{ backgroundColor: '#F59E0B', color: '#02122c' }}>
                Show {totalResults} results
              </button>
            </div>
            {renderSheetBottomNav(() => setMobileFilterSheetOpen(false))}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // ═══ 모바일 2분할 버튼 바 (공통)
  // ═══════════════════════════════════════════════════════════════
  const renderMobile2SplitBar = () => (
    <div className="md:hidden">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileAiSheetOpen(true)}
          className="flex items-center gap-1.5 py-1 transition-all"
        >
          <Icons.Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="text-[13px] font-extrabold" style={{ color: 'rgba(255,255,255,0.6)' }}>AI Suggestion</span>
          {checkedValues.size > 0 && (
            <span className="text-[9px] font-bold px-1.5 rounded-full" style={{ backgroundColor: '#F59E0B', color: '#02122c' }}>{checkedValues.size}</span>
          )}
        </button>
        <button
          onClick={() => setMobileFilterSheetOpen(true)}
          className="flex items-center gap-1.5 py-1 transition-all"
        >
          <Icons.Filter className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="text-[13px] font-extrabold" style={{ color: 'rgba(255,255,255,0.6)' }}>Filters</span>
        </button>
      </div>
      {renderMobileAiSheet()}
      {renderMobileFilterSheet()}
    </div>
  );

  // ━━━ State 1: 질문형 쿼리 — 카테고리 선택 ━━━
  if (isQuestionQuery && suggestedProducts && suggestedProducts.length > 0) {
    return (
      <div>
        {renderMobile2SplitBar()}
        <div className="hidden md:block">
          <div className="mb-4 h-[40px] flex items-center">
            <div className="w-full h-full bg-[#02122c] rounded-md flex items-center justify-between px-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Icons.Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-[12px] sm:text-[15px] font-extrabold text-white tracking-widest uppercase">AI Smart Suggestion</span>
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
                  <button key={product} onClick={() => onCategoryClick(product)} className="group flex items-center gap-2 px-4 py-2 text-[14px] font-bold rounded-md border border-slate-200 bg-white text-[#02122c] hover:border-[#F59E0B] hover:bg-[#F59E0B]/5 transition-all active:scale-[0.98]">
                    <span className="capitalize">{product}</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#F59E0B] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ━━━ 로딩 스켈레톤 ━━━
  if (loading) {
    return (
      <div>
        {renderMobile2SplitBar()}
        <div className="hidden md:block">
          <div className="mb-4 h-[40px] flex items-center">
            <div className="w-full h-full bg-[#02122c]/80 rounded-md flex items-center px-4 shadow-sm animate-pulse">
              <div className="h-4 bg-white/20 rounded w-48" />
            </div>
          </div>
          <div className="animate-pulse grid grid-cols-4 gap-x-6 gap-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-16" />
                <div className="h-5 bg-slate-200 rounded w-full" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ━━━ AI 결과 대기 중 ━━━
  if (!loading && !isQuestionQuery && aiSuggestions === null) {
    return (
      <div>
        {renderMobile2SplitBar()}
        <div className="hidden md:block">
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
      </div>
    );
  }

  // ━━━ State 2: 일반 검색 — hasAnySuggestions 체크 ━━━
  if (!hasAnySuggestions) {
    return renderMobile2SplitBar();
  }

  return (
    <div>
      {/* ═══ MOBILE: 2분할 버튼 + 풀스크린 시트 ═══ */}
      {renderMobile2SplitBar()}

      {/* ═══ DESKTOP: 기존 풀 레이아웃 ═══ */}
      <div className="hidden md:block">
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-[12px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider shrink-0 sm:w-[100px]">Top Brands</span>
              <div className="flex items-center gap-x-3 sm:gap-x-4 gap-y-1 flex-wrap flex-1">
                {brands.slice(0, 8).map(brand => (
                  <SuggestionCheckbox
                    key={brand}
                    label={brand}
                    checked={checkedValues.has(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                ))}
              </div>
              {checkedValues.size > 0 && (
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={handleClear} className="text-[14px] font-bold text-slate-400 hover:text-[#02122c] hover:underline transition-colors">Clear</button>
                  <button onClick={handleApply} className="px-3 py-1 bg-[#F59E0B] text-white font-bold text-[14px] rounded hover:bg-[#D97706] transition-all active:scale-[0.98]">Apply ({checkedValues.size})</button>
                </div>
              )}
            </div>
          )}

          {/* ━━━ Row 2: Related ━━━ */}
          {effectiveAxes.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-[12px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider shrink-0 sm:w-[100px]">Related</span>
              <div className="flex items-center gap-x-3 sm:gap-x-4 gap-y-1 flex-wrap flex-1">
                {effectiveAxes.map(axis => (
                  <AxisToggle key={axis.name} label={axis.name} expanded={expandedAxes.has(axis.name)} valueCount={axis.values.length} onToggle={() => toggleAxis(axis.name)} />
                ))}
              </div>
              {brands.length === 0 && checkedValues.size > 0 && (
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={handleClear} className="text-[14px] font-bold text-slate-400 hover:text-[#02122c] hover:underline transition-colors">Clear</button>
                  <button onClick={handleApply} className="px-3 py-1 bg-[#F59E0B] text-white font-bold text-[14px] rounded hover:bg-[#D97706] transition-all active:scale-[0.98]">Apply ({checkedValues.size})</button>
                </div>
              )}
            </div>
          )}

          {/* ━━━ Row 3+: 펼쳐진 축의 세부값 ━━━ */}
          {effectiveAxes
            .filter(axis => expandedAxes.has(axis.name))
            .map(axis => (
              <div key={`values-${axis.name}`} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 ml-0 sm:ml-[100px] pl-3 border-l-2 border-[#F59E0B]/30">
                <span className="text-[11px] sm:text-[12px] font-bold text-[#F59E0B]/70 uppercase tracking-wider shrink-0 sm:w-[70px]">{axis.name}</span>
                <div className="flex items-center gap-x-3 sm:gap-x-4 gap-y-1 flex-wrap flex-1">
                  {axis.values.map(value => (
                    <SuggestionCheckbox key={value} label={value} checked={checkedValues.has(value)} onChange={() => toggleValue(value)} />
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}
      </div>{/* end DESKTOP */}
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

/** 체크박스 — 브랜드 및 세부값에 사용 (PC 데스크톱 라이트 테마) */
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
