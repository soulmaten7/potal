"use client";

type ShippingGuideModalProps = {
  open: boolean;
  onClose: () => void;
};

/** 글로벌 8대 쇼핑몰 배송/비용 정책 — 서비스 중 vs 준비 중 명시 */
const GLOBAL_SHIPPING_TABLE: Array<{ platform: string; type: string; delivery: string; cost: string; note: string; status: "Live" | "Coming soon" }> = [
  { platform: "Amazon", type: "Prime", delivery: "Usually 2 days", cost: "Free (with Prime)", note: "US domestic", status: "Live" },
  { platform: "Amazon", type: "Standard", delivery: "5–8 business days", cost: "Varies by item", note: "", status: "Live" },
  { platform: "AliExpress", type: "Choice", delivery: "5–7 days (selected)", cost: "Free or low", note: "⚡ 5-7 Days", status: "Coming soon" },
  { platform: "AliExpress", type: "Standard", delivery: "10+ days", cost: "Varies by seller", note: "📦 10+ Days", status: "Coming soon" },
  { platform: "Temu", type: "Standard", delivery: "7–15 days", cost: "Often free over threshold", note: "📦 Standard", status: "Coming soon" },
  { platform: "Walmart", type: "W+ / 2-Day", delivery: "2 business days", cost: "Free over $35", note: "W+", status: "Coming soon" },
  { platform: "Walmart", type: "Standard", delivery: "3–5 business days", cost: "Varies", note: "", status: "Coming soon" },
  { platform: "eBay", type: "Fast / Expedited", delivery: "1–3 business days", cost: "Seller-dependent", note: "🏅 Expedited", status: "Coming soon" },
  { platform: "eBay", type: "Standard", delivery: "3–10 business days", cost: "Varies by seller", note: "", status: "Coming soon" },
  { platform: "Best Buy", type: "Store Pickup", delivery: "Same day / next day", cost: "Free", note: "🏪 Store Pickup", status: "Coming soon" },
  { platform: "Best Buy", type: "Standard", delivery: "2–5 business days", cost: "Free over $35", note: "", status: "Coming soon" },
  { platform: "Target", type: "RedCard 2-Day", delivery: "2 business days", cost: "Free", note: "RedCard", status: "Coming soon" },
  { platform: "Target", type: "Standard", delivery: "3–5 business days", cost: "Free over $35", note: "", status: "Coming soon" },
  { platform: "iHerb", type: "Global Air", delivery: "3–5 days", cost: "Free over threshold", note: "✈️ 3-5 Days", status: "Coming soon" },
  { platform: "iHerb", type: "Standard", delivery: "7–14 days", cost: "Varies by region", note: "", status: "Coming soon" },
];

export function ShippingGuideModal({ open, onClose }: ShippingGuideModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="shipping-guide-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
          <h2 id="shipping-guide-title" className="text-lg font-bold text-slate-800">
            📦 Global Shipping Table
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="text-sm text-slate-600 mb-3">
            POTAL standardizes delivery for 8 major global marketplaces. <strong>Live</strong> = currently serving; <strong>Coming soon</strong> = badge &amp; table ready, API integration in progress.
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-800 border-b border-slate-200">Platform</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-800 border-b border-slate-200">Type</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-800 border-b border-slate-200">Delivery</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-800 border-b border-slate-200">Cost</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-800 border-b border-slate-200">Note</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-800 border-b border-slate-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {GLOBAL_SHIPPING_TABLE.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{row.platform}</td>
                    <td className="px-3 py-2 text-slate-700">{row.type}</td>
                    <td className="px-3 py-2 text-slate-600">{row.delivery}</td>
                    <td className="px-3 py-2 text-slate-600">{row.cost}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{row.note}</td>
                    <td className="px-3 py-2">
                      <span className={row.status === "Live" ? "text-emerald-600 font-semibold" : "text-amber-600 font-medium"}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Amazon, AliExpress, Temu, Walmart, eBay, Best Buy, Target, iHerb — product cards show standardized badges (Prime : 🚀 2-Day, Choice : ⚡ 5-7 Days, etc.) with brand colors.
          </p>
        </div>
      </div>
    </div>
  );
}
