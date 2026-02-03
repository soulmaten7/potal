"use client";

type FilterBarProps = {
  mobileTab: "all" | "domestic" | "global";
  onTabChange: (tab: "all" | "domestic" | "global") => void;
  onFilterClick: () => void;
  onShippingGuideClick?: () => void;
};

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

export function FilterBar({ mobileTab, onTabChange, onFilterClick, onShippingGuideClick }: FilterBarProps) {
  return (
    <div className="w-full bg-white border-b border-slate-100 px-4 pt-0 pb-2 flex flex-col gap-2 min-w-0">
      {/* Row 1: Tabs */}
      <div className="flex items-center justify-center gap-0 min-w-0">
        <button
          type="button"
          onClick={() => onTabChange("all")}
          className={`flex-1 min-w-0 py-1.5 text-[13px] font-medium transition-colors border-b-2 ${
            mobileTab === "all"
              ? "border-indigo-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => onTabChange("domestic")}
          className={`flex-1 min-w-0 py-1.5 text-[13px] font-medium transition-colors border-b-2 ${
            mobileTab === "domestic"
              ? "border-indigo-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          🇺🇸 Domestic
        </button>
        <button
          type="button"
          onClick={() => onTabChange("global")}
          className={`flex-1 min-w-0 py-1.5 text-[13px] font-medium transition-colors border-b-2 ${
            mobileTab === "global"
              ? "border-indigo-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          🌏 Global
        </button>
      </div>
      {/* Row 2: Filter (left) + Shipping Guide (right) — 브랜드 컬러 포인트 */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <button
          type="button"
          onClick={onFilterClick}
          className="inline-flex items-center gap-1.5 text-xs border border-indigo-100 rounded-lg px-2.5 py-1 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          aria-label="Filter"
        >
          <FilterIcon className="w-4 h-4 text-indigo-500" />
          <span>Filter</span>
        </button>
        {onShippingGuideClick != null && (
          <button
            type="button"
            onClick={onShippingGuideClick}
            className="inline-flex items-center gap-1.5 text-xs border border-indigo-100 rounded-lg px-2.5 py-1 bg-indigo-50/60 text-slate-700 shadow-sm hover:bg-indigo-50 transition-colors"
            aria-label="Shipping Guide"
          >
            <span aria-hidden>📦</span>
            <span>Shipping Guide</span>
          </button>
        )}
      </div>
    </div>
  );
}
