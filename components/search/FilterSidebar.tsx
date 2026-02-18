"use client";

import React, { useState } from 'react';
import { Icons } from '../icons';
import { MEMBERSHIP_REGISTRY } from '@/app/lib/membership/MembershipConfig';

// Data Lists — API 연결된 사이트를 상단에 배치
const US_MAJOR_RETAILERS = ["Amazon", "Walmart", "Best Buy", "eBay", "Target", "Costco", "Home Depot", "Lowe's", "Macy's", "Apple", "Nike", "Kohl's", "Sephora", "Chewy", "Kroger", "Wayfair"];
const GLOBAL_RETAILERS = ["AliExpress", "Temu", "Shein", "iHerb", "DHgate", "YesStyle", "Farfetch", "ASOS", "Uniqlo", "Etsy", "MyTheresa", "Olive Young", "Mercari"];
const ALL_RETAILERS_FLAT = [...US_MAJOR_RETAILERS, ...GLOBAL_RETAILERS];

/** MembershipConfig에서 retailer별 프로그램을 빠르게 조회하기 위한 맵 */
const MEMBERSHIP_MAP = new Map(
  MEMBERSHIP_REGISTRY.map(rm => [rm.retailer, rm.programs])
);

/** 가격 범위 인사이트 */
export interface PriceInsight {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
}

/** 구매 결정 축 (AI Smart Filter v3.0) */
export interface FilterAxis {
  name: string;
  values: string[];
}

/** AI 제안 데이터 */
export interface AiSuggestions {
  Brands?: string[];
  /** v3.0: 계층형 축 기반 필터 */
  Axes?: FilterAxis[];
  /** @deprecated v2.0 하위호환 — Axes 사용 권장 */
  Gender?: string[];
  Specs?: string[];
  'Series/Model'?: string[];
  Keywords?: string[];
  priceInsight?: PriceInsight;
}

interface FilterSidebarProps {
  priceMax: number;
  setPriceMax: (v: number) => void;
  selectedRetailers: Set<string>;
  setSelectedRetailers: React.Dispatch<React.SetStateAction<Set<string>>>;
  market: string;
  setMarket: (m: string) => void;
  /** 활성화된 멤버십 (예: { "prime": true, "choice": true }) */
  memberships?: Record<string, boolean>;
  setMemberships?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function FilterSidebar({
  priceMax, setPriceMax,
  selectedRetailers, setSelectedRetailers,
  market, setMarket,
  memberships = {},
  setMemberships,
}: FilterSidebarProps) {
  const [openMarket, setOpenMarket] = useState(true);
  const [openRetailers, setOpenRetailers] = useState(true);
  const [openDelivery, setOpenDelivery] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);
  const [deliveryDays, setDeliveryDays] = useState(30);

  const toggleRetailer = (retailer: string) => { setSelectedRetailers(prev => { const next = new Set(prev); if (next.has(retailer)) next.delete(retailer); else next.add(retailer); return next; }); };
  const selectAllRetailers = () => setSelectedRetailers(new Set(ALL_RETAILERS_FLAT));
  const clearAllRetailers = () => setSelectedRetailers(new Set());

  const toggleMembership = (programId: string) => {
    if (!setMemberships) return;
    setMemberships(prev => ({ ...prev, [programId]: !prev[programId] }));
  };

  const getSliderStyle = (value: number, max: number) => {
    const percent = (value / max) * 100;
    return { background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)` };
  };

  return (
    <aside className="w-[280px] shrink-0 hidden lg:block">
      <div className="mb-6 h-[40px] flex items-center"><div className="w-full h-full bg-[#02122c] rounded-md flex items-center px-4 shadow-sm"><span className="text-[15px] font-extrabold text-white tracking-widest uppercase">FILTERS</span></div></div>
      <div className="space-y-6">

        {/* Market Scope */}
        <div className="pb-6 border-b border-slate-300">
           <button onClick={() => setOpenMarket(!openMarket)} className="w-full flex items-center justify-between mb-3"><h3 className="text-[15px] font-extrabold uppercase text-[#02122c] tracking-wide">MARKET SCOPE</h3><Icons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openMarket ? "rotate-180" : ""}`} /></button>
           {openMarket && (
             <div className="flex flex-col gap-2">
               {[{ val: "all", label: "All Markets" }, { val: "domestic", label: "Domestic" }, { val: "global", label: "Global" }].map((opt) => (
                 <label key={opt.val} className="flex items-center gap-3 cursor-pointer group">
                   <div className="relative flex items-center justify-center w-5 h-5"><input type="radio" name="market_filter" checked={market === opt.val} onChange={() => setMarket(opt.val)} className="peer appearance-none w-5 h-5 border-2 border-slate-400 rounded-full bg-transparent checked:bg-[#F59E0B] checked:border-[#F59E0B] transition-all" /><div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 pointer-events-none" /></div><span className="text-[14px] font-bold text-slate-700 group-hover:text-[#02122c]">{opt.label}</span>
                 </label>
               ))}
             </div>
           )}
        </div>

        {/* Retailers + Membership */}
        <div className="pb-6 border-b border-slate-300">
           <button onClick={() => setOpenRetailers(!openRetailers)} className="w-full flex items-center justify-between mb-3"><h3 className="text-[15px] font-extrabold uppercase text-[#02122c] tracking-wide">RETAILERS</h3><Icons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openRetailers ? "rotate-180" : ""}`} /></button>
           {openRetailers && (
             <div className="space-y-4">
                <div className="flex justify-end gap-3 text-[12px] font-extrabold">
                   <button onClick={selectAllRetailers} className="text-[#02122c] hover:text-[#F59E0B] hover:underline">Select All</button>
                   <span className="text-slate-300">|</span>
                   <button onClick={clearAllRetailers} className="text-slate-500 hover:text-[#F59E0B] hover:underline">Clear</button>
                </div>
                <div>
                    <p className="text-[13px] font-bold text-slate-500 uppercase mb-2 tracking-wider">Domestic</p>
                    <div className="flex flex-col gap-1">
                      {US_MAJOR_RETAILERS.map(r => (
                        <RetailerRow
                          key={r}
                          retailer={r}
                          checked={selectedRetailers.has(r)}
                          onToggle={() => toggleRetailer(r)}
                          programs={MEMBERSHIP_MAP.get(r)}
                          memberships={memberships}
                          onToggleMembership={toggleMembership}
                        />
                      ))}
                    </div>
                </div>
                <div>
                    <p className="text-[13px] font-bold text-slate-500 uppercase mb-2 tracking-wider">Global</p>
                    <div className="flex flex-col gap-1">
                      {GLOBAL_RETAILERS.map(r => (
                        <RetailerRow
                          key={r}
                          retailer={r}
                          checked={selectedRetailers.has(r)}
                          onToggle={() => toggleRetailer(r)}
                          programs={MEMBERSHIP_MAP.get(r)}
                          memberships={memberships}
                          onToggleMembership={toggleMembership}
                        />
                      ))}
                    </div>
                </div>
             </div>
           )}
        </div>

        {/* Price Range */}
        <div className="pb-6 border-b border-slate-300">
           <button onClick={() => setOpenPrice(!openPrice)} className="w-full flex items-center justify-between mb-3"><h3 className="text-[15px] font-extrabold uppercase text-[#02122c] tracking-wide">PRICE RANGE</h3><Icons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openPrice ? "rotate-180" : ""}`} /></button>
           {openPrice && (
             <div className="px-1">
                <input type="range" min="0" max="2000" step="50" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={getSliderStyle(priceMax, 2000)} />
                <div className="flex justify-between text-[14px] text-slate-700 font-bold mt-2"><span>$0</span><span>${priceMax}{priceMax === 2000 ? '+' : ''}</span></div>
             </div>
           )}
        </div>

        {/* Arrival */}
        <div className="pb-6">
           <button onClick={() => setOpenDelivery(!openDelivery)} className="w-full flex items-center justify-between mb-3"><h3 className="text-[15px] font-extrabold uppercase text-[#02122c] tracking-wide">ARRIVAL DATE</h3><Icons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openDelivery ? "rotate-180" : ""}`} /></button>
           {openDelivery && (
             <div className="px-1">
                <input type="range" min="1" max="30" step="1" value={deliveryDays} onChange={(e) => setDeliveryDays(Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={getSliderStyle(deliveryDays, 30)} />
                <div className="flex justify-between text-[14px] text-slate-700 font-bold mt-2"><span>Today</span><span>{deliveryDays} Days{deliveryDays === 30 ? '+' : ''}</span></div>
             </div>
           )}
        </div>
      </div>
    </aside>
  );
}

/** 리테일러 한 줄: 체크박스 + 이름 (왼쪽) │ 멤버십 토글 (오른쪽 정렬) */
function RetailerRow({
  retailer, checked, onToggle, programs, memberships, onToggleMembership,
}: {
  retailer: string;
  checked: boolean;
  onToggle: () => void;
  programs?: { id: string; label: string; badge: string; badgeColor: string; badgeBg: string }[];
  memberships: Record<string, boolean>;
  onToggleMembership: (id: string) => void;
}) {
  return (
    <div className="flex items-center group hover:bg-slate-50 p-1 rounded-md transition-colors">
      {/* 리테일러 체크박스 — 왼쪽 */}
      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
        <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
          <input type="checkbox" checked={checked} onChange={onToggle} className="peer appearance-none w-4 h-4 border-2 border-slate-400 rounded-[3px] bg-transparent checked:bg-[#F59E0B] checked:border-[#F59E0B] transition-all" />
          <Icons.Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
        </div>
        <span className="text-[13px] font-bold text-slate-700 group-hover:text-[#02122c] truncate">{retailer}</span>
      </label>

      {/* 멤버십 토글 버튼 — 오른쪽 정렬, retailerConfig 뱃지 스타일 일치 */}
      {programs && programs.map(prog => {
        const isActive = memberships[prog.id];
        return (
          <button
            key={prog.id}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleMembership(prog.id); }}
            title={`Toggle ${prog.label} membership`}
            className={`ml-auto shrink-0 text-[10px] font-bold px-2 py-[3px] rounded-full border transition-all cursor-pointer ${
              isActive
                ? `${prog.badgeBg} ${prog.badgeColor} border-transparent shadow-sm`
                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600'
            }`}
          >
            {prog.badge}
          </button>
        );
      })}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
   return (
      <label className="flex items-center gap-3 cursor-pointer group hover:bg-slate-100 p-1 rounded-md transition-colors">
         <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
            <input type="checkbox" checked={checked} onChange={onChange} className="peer appearance-none w-4 h-4 border-2 border-slate-400 rounded-[3px] bg-transparent checked:bg-[#F59E0B] checked:border-[#F59E0B] transition-all" />
            <Icons.Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
         </div>
         <span className="text-[14px] font-bold text-slate-700 group-hover:text-[#02122c] truncate">{label}</span>
      </label>
   )
}
