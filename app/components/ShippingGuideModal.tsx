"use client";

type ShippingGuideModalProps = {
  open: boolean;
  onClose: () => void;
};

type ShippingMethod = {
  name: string;
  time: string;
  cost: string;
  note?: string;
  status?: "Live" | "Coming soon";
};

/** Source of Truth: 글로벌 쇼핑몰 배송/비용 정책. 테이블·카드 뷰 모두 이 데이터로 렌더링 */
const SHIPPING_GUIDE_DATA: Array<{ site: string; methods: ShippingMethod[] }> = [
  {
    site: "Amazon",
    methods: [
      { name: "Prime", time: "Usually 2 days", cost: "Free (with Prime)", note: "US domestic", status: "Live" },
      { name: "Standard", time: "5–8 business days", cost: "Varies by item", status: "Live" },
    ],
  },
  {
    site: "AliExpress",
    methods: [
      { name: "Choice", time: "5–7 days (selected)", cost: "Free or low", note: "⚡ 5-7 Days", status: "Coming soon" },
      { name: "Standard", time: "10+ days", cost: "Varies by seller", note: "📦 10+ Days", status: "Coming soon" },
    ],
  },
  {
    site: "Temu",
    methods: [
      { name: "Standard", time: "7–15 days", cost: "Often free over threshold", note: "📦 Standard", status: "Coming soon" },
    ],
  },
  {
    site: "Walmart",
    methods: [
      { name: "W+ / 2-Day", time: "2 business days", cost: "Free over $35", note: "W+", status: "Coming soon" },
      { name: "Standard", time: "3–5 business days", cost: "Varies", status: "Coming soon" },
    ],
  },
  {
    site: "eBay",
    methods: [
      { name: "Fast / Expedited", time: "1–3 business days", cost: "Seller-dependent", note: "🏅 Expedited", status: "Coming soon" },
      { name: "Standard", time: "3–10 business days", cost: "Varies by seller", status: "Coming soon" },
    ],
  },
  {
    site: "Best Buy",
    methods: [
      { name: "Store Pickup", time: "Same day / next day", cost: "Free", note: "🏪 Store Pickup", status: "Coming soon" },
      { name: "Standard", time: "2–5 business days", cost: "Free over $35", status: "Coming soon" },
    ],
  },
  {
    site: "Target",
    methods: [
      { name: "RedCard 2-Day", time: "2 business days", cost: "Free", note: "RedCard", status: "Coming soon" },
      { name: "Standard", time: "3–5 business days", cost: "Free over $35", status: "Coming soon" },
    ],
  },
  {
    site: "iHerb",
    methods: [
      { name: "Global Air", time: "3–5 days", cost: "Free over threshold", note: "✈️ 3-5 Days", status: "Coming soon" },
      { name: "Standard", time: "7–14 days", cost: "Varies by region", status: "Coming soon" },
    ],
  },
];

export function ShippingGuideModal({ open, onClose }: ShippingGuideModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-0 md:p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="shipping-guide-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white w-full h-full md:max-w-2xl md:max-h-[90vh] md:rounded-2xl md:h-auto shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
          <h2 id="shipping-guide-title" className="text-base md:text-lg font-bold text-slate-800">
            📦 Global Shipping Table
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-3 -m-3 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors touch-manipulation"
            aria-label="Close"
          >
            <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-auto px-4 py-3 min-h-0">
          {/* 모바일 전용: 플랫폼별 카드 리스트 (SHIPPING_GUIDE_DATA 기반) */}
          <div className="block md:hidden space-y-6 pb-4">
            {SHIPPING_GUIDE_DATA.map(({ site, methods }) => (
              <section key={site} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <h3 className="text-base font-bold text-slate-800 px-4 py-3 border-b border-slate-100">
                  {site}
                </h3>
                <div className="divide-y divide-slate-100">
                  {methods.map((method, i) => (
                    <div key={`${site}-${i}`} className="px-4 py-3">
                      <p className="text-sm font-semibold text-indigo-700">{method.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {method.time} • {method.cost}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* PC 전용: 가로 스크롤 테이블 (SHIPPING_GUIDE_DATA 기반) */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 -mx-1 px-1">
            <table className="w-full text-sm border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-3 font-semibold text-slate-800 border-b border-slate-200 text-sm">Platform</th>
                  <th className="text-left p-3 font-semibold text-slate-800 border-b border-slate-200 text-sm">Type</th>
                  <th className="text-left p-3 font-semibold text-slate-800 border-b border-slate-200 text-sm">Delivery</th>
                  <th className="text-left p-3 font-semibold text-slate-800 border-b border-slate-200 text-sm">Cost</th>
                  <th className="text-left p-3 font-semibold text-slate-800 border-b border-slate-200 text-sm">Note</th>
                </tr>
              </thead>
              <tbody>
                {SHIPPING_GUIDE_DATA.flatMap(({ site, methods }) =>
                  methods.map((method, i) => (
                    <tr key={`${site}-${i}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap text-sm">{site}</td>
                      <td className="p-3 text-slate-700 text-sm">{method.name}</td>
                      <td className="p-3 text-slate-600 text-sm">{method.time}</td>
                      <td className="p-3 text-slate-600 text-sm">{method.cost}</td>
                      <td className="p-3 text-slate-500 text-sm">{method.note ?? ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Amazon, AliExpress, Temu, Walmart, eBay, Best Buy, Target, iHerb — product cards show standardized badges (Prime : 🚀 2-Day, Choice : ⚡ 5-7 Days, etc.) with brand colors.
          </p>
        </div>
      </div>
    </div>
  );
}
