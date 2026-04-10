'use client';

/**
 * RecommendedTemplates — CW26 Sprint 4
 *
 * POTAL 큐레이션 템플릿 5개.
 * Empty state: 카드 형태로 크게 표시.
 * Active state: 1줄 가로 스크롤 pill.
 */

interface Template {
  name: string;
  description: string;
  features: string[];
}

const TEMPLATES: Template[] = [
  {
    name: 'Etsy Seller Starter',
    description: 'HS classification + landed cost + restriction check',
    features: ['hs-code-classification', 'total-landed-cost', 'restricted-items'],
  },
  {
    name: 'EU Export Kit',
    description: 'FTA lookup + landed cost + commercial invoice',
    features: ['fta-detection', 'total-landed-cost', 'customs-documentation'],
  },
  {
    name: 'US B2B Import',
    description: 'HS + denied party screening + landed cost + US nexus',
    features: ['hs-code-classification', 'denied-party-screening', 'total-landed-cost', 'us-sales-tax-nexus-tracking'],
  },
  {
    name: 'Dangerous Goods Export',
    description: 'HS + restriction + ECCN + export declaration',
    features: ['hs-code-classification', 'restricted-items', 'eccn-classification', 'customs-documentation'],
  },
  {
    name: 'Quick Country Compare',
    description: 'Compare landed costs across multiple destinations',
    features: ['total-landed-cost', 'multi-country-support', 'fta-detection'],
  },
];

interface RecommendedTemplatesProps {
  mode: 'empty' | 'active';
  onLoad: (features: string[]) => void;
}

export default function RecommendedTemplates({ mode, onLoad }: RecommendedTemplatesProps) {
  if (mode === 'empty') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[18px]" aria-hidden="true">💡</span>
          <h3 className="text-[16px] font-extrabold text-[#02122c]">Recommended templates</h3>
        </div>
        <p className="text-[12px] text-slate-500 mb-4">
          Pick a template to pre-fill the CUSTOM builder, then tweak it to your needs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map(t => (
            <button
              key={t.name}
              type="button"
              onClick={() => onLoad(t.features)}
              className="text-left rounded-xl border-2 border-dashed border-slate-300 p-5 hover:border-[#F59E0B] hover:bg-amber-50/30 transition-colors"
            >
              <div className="text-[14px] font-bold text-[#02122c] mb-1">{t.name}</div>
              <div className="text-[12px] text-slate-500 leading-relaxed">{t.description}</div>
              <div className="text-[11px] text-slate-400 mt-2">{t.features.length} features</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Active state — horizontal pill scroll
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[13px]" aria-hidden="true">💡</span>
        <span className="text-[12px] font-bold text-slate-500">Templates:</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TEMPLATES.map(t => (
          <button
            key={t.name}
            type="button"
            onClick={() => onLoad(t.features)}
            className="flex-none px-3 py-1.5 rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600 hover:bg-amber-100 hover:text-[#02122c] transition-colors whitespace-nowrap"
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
