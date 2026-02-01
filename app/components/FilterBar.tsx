"use client";

type FilterBarProps = {
  mobileTab: "all" | "domestic" | "global";
  onTabChange: (tab: "all" | "domestic" | "global") => void;
  onFilterClick: () => void;
};

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

export function FilterBar({ mobileTab, onTabChange, onFilterClick }: FilterBarProps) {
  return (
    <div className="sticky top-[52px] z-40 w-full bg-white border-b border-slate-200 px-4 py-1.5 flex items-center gap-2 min-w-0">
      <button
        type="button"
        onClick={onFilterClick}
        className="shrink-0 inline-flex items-center gap-2 h-9 pl-3 pr-4 rounded-full border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors"
        aria-label="Filter"
      >
        <FilterIcon className="w-4 h-4 text-slate-600" />
        <span>Filter</span>
      </button>
      <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden scrollbar-hide">
        <div className="flex gap-2 whitespace-nowrap py-1">
          <button
            type="button"
            onClick={() => onTabChange("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${mobileTab === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onTabChange("domestic")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${mobileTab === "domestic" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            🇺🇸 Domestic
          </button>
          <button
            type="button"
            onClick={() => onTabChange("global")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${mobileTab === "global" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            🌏 Global
          </button>
        </div>
      </div>
    </div>
  );
}
