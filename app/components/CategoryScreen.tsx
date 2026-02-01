"use client";

import { useState, useEffect } from "react";

type CategoryItem = {
  id: string;
  label: string;
  icon: string;
  subCategories: { label: string; details: string[] }[];
};

type CategoryScreenProps = {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  /** mainId, subLabel, (optional) detailItem. 검색 시 detailItem이 있으면 그걸 쿼리로 사용 */
  onSelectCategory: (mainId: string, subLabel: string, detailItem?: string) => void;
};

function getDetailInitial(detailName: string): string {
  const trimmed = detailName.trim();
  if (!trimmed) return "?";
  const first = trimmed[0];
  return /[a-zA-Z0-9]/.test(first) ? first.toUpperCase() : trimmed.slice(0, 1);
}

export function CategoryScreen({
  isOpen,
  onClose,
  categories,
  onSelectCategory,
}: CategoryScreenProps) {
  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && categories.length > 0 && selectedMainId === null) {
      setSelectedMainId(categories[0].id);
    }
    if (!isOpen) {
      setSelectedMainId(null);
    }
  }, [isOpen, categories.length, selectedMainId]);

  const selectedMain = categories.find((c) => c.id === selectedMainId) ?? categories[0] ?? null;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-white md:hidden"
      aria-modal="true"
      role="dialog"
      aria-label="Categories"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0 bg-white">
        <h1 className="text-lg font-semibold text-slate-800">Categories</h1>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* 왼쪽: 메인 카테고리 (클릭 시 오른쪽만 변경) */}
        <aside className="w-[90px] shrink-0 bg-slate-100 overflow-y-auto border-r border-slate-200">
          <ul className="py-1">
            {categories.map((cat) => {
              const isSelected = selectedMainId === cat.id;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedMainId(cat.id)}
                    className={`w-full text-left py-3 px-2 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                      isSelected
                        ? "bg-white text-purple-600 border-l-4 border-l-purple-600 font-semibold"
                        : "text-slate-600 hover:bg-slate-200/50"
                    }`}
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {cat.icon}
                    </span>
                    <span className="text-[10px] sm:text-xs leading-tight text-center line-clamp-2">
                      {cat.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* 오른쪽: 섹션 리스트 (Sub 소제목 + Detail 그리드) */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-white">
          {selectedMain && (
            <>
              <h2 className="font-bold text-lg p-4 pb-2 text-slate-800 border-b border-slate-100">
                {selectedMain.label}
              </h2>
              <div className="px-4 pb-6">
                {selectedMain.subCategories.map((sub) => (
                  <section key={sub.label} className="mt-6 first:mt-3">
                    <h3 className="font-bold text-sm text-slate-800 mb-2">
                      {sub.label}
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {(sub.details ?? []).map((detail) => (
                        <button
                          key={detail}
                          type="button"
                          onClick={() => {
                            onSelectCategory(selectedMain.id, sub.label, detail);
                          }}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-purple-50 active:bg-purple-100 transition-colors border border-transparent hover:border-purple-200"
                        >
                          <span
                            className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-semibold shrink-0"
                            aria-hidden
                          >
                            {getDetailInitial(detail)}
                          </span>
                          <span className="text-[10px] text-slate-700 text-center leading-tight line-clamp-2 min-h-[2rem]">
                            {detail}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
