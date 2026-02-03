"use client";

const POPULAR_SEARCHES = ["Lego", "Camping", "Samsung", "Apple", "Vitamin"] as const;

type EmptyStateProps = {
  query: string;
  onKeywordClick: (keyword: string) => void;
};

function SearchEmptyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-16 h-16 text-slate-300"
      aria-hidden
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function EmptyState({ query, onKeywordClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <SearchEmptyIcon />
      <h2 className="mt-6 text-lg font-semibold text-slate-800">
        No results found for &quot;{query || "your search"}&quot;
      </h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        Try checking your spelling or use different keywords.
      </p>
      <section className="mt-8 w-full max-w-sm" aria-label="Popular searches">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Popular Searches
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR_SEARCHES.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => onKeywordClick(keyword)}
              className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
            >
              {keyword}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
