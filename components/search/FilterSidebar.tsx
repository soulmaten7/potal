"use client";

import React, { useState } from 'react';
import { Icons } from '../icons';

// Data Lists (Moved from page.tsx)
const US_MAJOR_RETAILERS = ["Amazon", "Walmart", "Target", "Best Buy", "Costco", "eBay", "Home Depot", "Lowe's", "Macy's", "Apple", "Nike", "Kohl's", "Sephora", "Chewy", "Kroger", "Wayfair"];
const GLOBAL_RETAILERS = ["AliExpress", "Temu", "iHerb", "Shein", "DHgate", "YesStyle", "Farfetch", "ASOS", "Uniqlo", "Etsy", "MyTheresa", "Olive Young", "Mercari"];
const ALL_RETAILERS_FLAT = [...US_MAJOR_RETAILERS, ...GLOBAL_RETAILERS];

interface FilterSidebarProps {
  priceMax: number;
  setPriceMax: (v: number) => void;
  selectedRetailers: Set<string>;
  setSelectedRetailers: React.Dispatch<React.SetStateAction<Set<string>>>;
  market: string;
  setMarket: (m: string) => void;
}

export function FilterSidebar({ priceMax, setPriceMax, selectedRetailers, setSelectedRetailers, market, setMarket }: FilterSidebarProps) {
  const [openMarket, setOpenMarket] = useState(true);
  const [openRetailers, setOpenRetailers] = useState(true);
  const [openDelivery, setOpenDelivery] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);
  const [deliveryDays, setDeliveryDays] = useState(30);

  const toggleRetailer = (retailer: string) => { setSelectedRetailers(prev => { const next = new Set(prev); if (next.has(retailer)) next.delete(retailer); else next.add(retailer); return next; }); };
  const selectAllRetailers = () => setSelectedRetailers(new Set(ALL_RETAILERS_FLAT));
  const clearAllRetailers = () => setSelectedRetailers(new Set());

  const getSliderStyle = (value: number, max: number) => {
    const percent = (value / max) * 100;
    return { background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)` };
  };

  return (
    <aside className="w-[280px] shrink-0">
      <div className="mb-6 h-[40px] flex items-center"><div className="w-full h-full bg-[#02122c] rounded-md flex items-center px-4 shadow-sm"><span className="text-[15px] font-extrabold text-white tracking-widest uppercase">FILTERS</span></div></div>
      <div className="space-y-6">
        {/* AI Smart Suggestion */}
        <div className="pb-6 border-b border-slate-300">
           <div className="flex items-center gap-2 mb-3"><Icons.Sparkles className="w-4 h-4 text-[#F59E0B]" /><h3 className="text-[15px] font-extrabold uppercase text-[#02122c] tracking-wide">AI Smart Suggestion</h3></div>
           <div className="p-4 bg-white/50 border border-slate-200 rounded-lg text-center"><span className="text-[13px] text-slate-400">AI analysis loading...</span></div>
        </div>
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
        {/* Retailers */}
        <div className="pb-6 border-b border-slate-300">
           <button onClick={() => setOpenRetailers(!openRetailers)} className="w-full flex items-center justify-between mb-3"><h3 className="text-[15px] font-extrabold uppercase text-[#02122c] tracking-wide">RETAILERS</h3><Icons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openRetailers ? "rotate-180" : ""}`} /></button>
           {openRetailers && (
             <div className="space-y-4">
                <div className="flex gap-3 text-[12px] font-extrabold">
                   <button onClick={selectAllRetailers} className="text-[#02122c] hover:text-[#F59E0B] hover:underline">Select All</button>
                   <span className="text-slate-300">|</span>
                   <button onClick={clearAllRetailers} className="text-slate-500 hover:text-[#F59E0B] hover:underline">Clear</button>
                </div>
                <div>
                    <p className="text-[13px] font-bold text-slate-500 uppercase mb-2 tracking-wider">US Major</p>
                    <div className="flex flex-col gap-2">{US_MAJOR_RETAILERS.map(r => <FilterCheckbox key={r} label={r} checked={selectedRetailers.has(r)} onChange={() => toggleRetailer(r)} />)}</div>
                </div>
                <div>
                    <p className="text-[13px] font-bold text-slate-500 uppercase mb-2 tracking-wider">Global</p>
                    <div className="flex flex-col gap-2">{GLOBAL_RETAILERS.map(r => <FilterCheckbox key={r} label={r} checked={selectedRetailers.has(r)} onChange={() => toggleRetailer(r)} />)}</div>
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

function FilterCheckbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
   return (
      <label className="flex items-center gap-3 cursor-pointer group hover:bg-slate-100 p-1 rounded-md transition-colors">
         <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
            <input type="checkbox" checked={checked} onChange={onChange} className="peer appearance-none w-4 h-4 border-2 border-slate-400 rounded-[3px] bg-transparent checked:bg-[#F59E0B] checked:border-[#F59E0B] transition-all" />
            <Icons.Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
         </div>
         <span className="text-[14px] font-bold text-slate-700 group-hover:text-[#02122c] truncate">{label}</span>
      </label>
   )
}