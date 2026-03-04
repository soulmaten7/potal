"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SearchInfoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-[14px] font-bold" style={{ color: '#02122c' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-[16px] font-extrabold" style={{ color: '#02122c' }}>Search Info</h1>
        <div className="w-16" />
      </div>

      <div className="px-4 py-5 pb-32 space-y-6">

        {/* 1. Domestic vs Global */}
        <section>
          <h2 className="text-[15px] font-extrabold mb-3" style={{ color: '#02122c' }}>
            Domestic vs Global
          </h2>
          <p className="text-[13px] mb-3" style={{ color: '#475569', lineHeight: '1.6' }}>
            POTAL searches both US domestic retailers and global (international) sellers in a single search, so you can compare every option side by side.
          </p>
          <div className="space-y-2">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">🇺🇸</span>
                <span className="text-[13px] font-bold" style={{ color: '#000000' }}>Domestic</span>
              </div>
              <p className="text-[12px]" style={{ color: '#475569', lineHeight: '1.5' }}>
                US-based retailers like Amazon, Walmart, Best Buy, Target, and eBay (US sellers). Products ship from US warehouses. Sales tax applies based on your state. No import duties.
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">🌍</span>
                <span className="text-[13px] font-bold" style={{ color: '#000000' }}>Global</span>
              </div>
              <p className="text-[12px]" style={{ color: '#475569', lineHeight: '1.5' }}>
                International sellers on AliExpress, Temu, Shein, eBay (overseas sellers), and more. Products ship from overseas. Import duties may apply depending on the origin country (e.g., ~20% for China). Delivery typically takes 7-15 days.
              </p>
            </div>
          </div>
        </section>

        <div className="h-px" style={{ backgroundColor: '#e2e8f0' }} />

        {/* 2. How Best Ranking Works */}
        <section>
          <h2 className="text-[15px] font-extrabold mb-3" style={{ color: '#02122c' }}>
            How POTAL Ranks "Best"
          </h2>
          <p className="text-[13px] mb-3" style={{ color: '#475569', lineHeight: '1.6' }}>
            POTAL's AI calculates a composite Best Score for every product using 5 weighted factors:
          </p>
          <div className="space-y-2.5">
            {[
              { label: 'Total Price', pct: 35, color: '#10B981', desc: 'Product + shipping + tax/duty (landed cost)' },
              { label: 'Delivery Speed', pct: 25, color: '#3B82F6', desc: 'Faster arrival = higher score' },
              { label: 'Seller Trust', pct: 20, color: '#8B5CF6', desc: 'Platform reputation, ratings, reviews' },
              { label: 'Match Accuracy', pct: 15, color: '#F59E0B', desc: 'How closely the product matches your search' },
              { label: 'Return Policy', pct: 5, color: '#94A3B8', desc: 'Ease and reliability of returns' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold" style={{ color: '#000000' }}>{item.label}</span>
                  <span className="text-[13px] font-extrabold" style={{ color: '#000000' }}>{item.pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#f1f5f9' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="text-[12px]" style={{ color: '#64748b', lineHeight: '1.6' }}>
              Membership benefits (Prime, W+, etc.) are factored in — toggling memberships on/off recalculates scores in real time. Products flagged for fraud risk receive score penalties.
            </p>
          </div>
        </section>

        <div className="h-px" style={{ backgroundColor: '#e2e8f0' }} />

        {/* 2. Total Landed Cost */}
        <section>
          <h2 className="text-[15px] font-extrabold mb-3" style={{ color: '#02122c' }}>
            What is Total Landed Cost?
          </h2>
          <p className="text-[13px] mb-3" style={{ color: '#475569', lineHeight: '1.6' }}>
            Total Landed Cost is the true final price you pay — with no hidden fees:
          </p>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: '#475569' }}>Product Price</span>
                <span className="text-[13px] font-bold" style={{ color: '#000000' }}>$XX.XX</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: '#475569' }}>+ Shipping</span>
                <span className="text-[13px] font-bold" style={{ color: '#000000' }}>$X.XX</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: '#475569' }}>+ Tax / Duty</span>
                <span className="text-[13px] font-bold" style={{ color: '#000000' }}>$X.XX</span>
              </div>
              <div className="h-px my-1" style={{ borderTop: '1px dashed #e2e8f0' }} />
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-extrabold" style={{ color: '#10B981' }}>= Total Landed Cost</span>
                <span className="text-[14px] font-extrabold" style={{ color: '#000000' }}>$XX.XX</span>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px" style={{ backgroundColor: '#e2e8f0' }} />

        {/* 3. US Sales Tax */}
        <section>
          <h2 className="text-[15px] font-extrabold mb-3" style={{ color: '#02122c' }}>
            🇺🇸 US Sales Tax
          </h2>
          <p className="text-[13px] mb-3" style={{ color: '#475569', lineHeight: '1.6' }}>
            POTAL estimates sales tax using your ZIP code and each state's combined tax rate (state + local average). The actual amount is finalized at checkout by the retailer.
          </p>
          <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="text-[13px] font-bold mb-2" style={{ color: '#000000' }}>How Tax Is Calculated</p>
            <p className="text-[12px]" style={{ color: '#475569', lineHeight: '1.5' }}>
              <strong>Tax = Product Price × State+Local Rate</strong><br />
              Shipping is generally NOT taxed in most states, but some states (TX, VA, etc.) do tax shipping charges.
            </p>
          </div>
          <p className="text-[13px] font-bold mb-2" style={{ color: '#000000' }}>Tax Rates by State (Combined Avg.)</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
            {[
              ['California', '8.75%'], ['New York', '8.00%'],
              ['Texas', '8.25%'], ['Florida', '7.00%'],
              ['Washington', '8.92%'], ['Illinois', '8.82%'],
              ['Pennsylvania', '6.34%'], ['Tennessee', '9.55%'],
            ].map(([state, rate]) => (
              <div key={state} className="flex justify-between">
                <span className="text-[12px]" style={{ color: '#475569' }}>{state}</span>
                <span className="text-[12px] font-bold" style={{ color: '#000000' }}>{rate}</span>
              </div>
            ))}
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <span className="text-[12px] font-bold" style={{ color: '#059669' }}>No Sales Tax: </span>
            <span className="text-[12px]" style={{ color: '#059669' }}>Oregon, Montana, New Hampshire, Delaware, Alaska</span>
          </div>
        </section>

        <div className="h-px" style={{ backgroundColor: '#e2e8f0' }} />

        {/* 4. Import Duty */}
        <section>
          <h2 className="text-[15px] font-extrabold mb-3" style={{ color: '#02122c' }}>
            🌏 Import Tax & Duties
          </h2>
          <p className="text-[13px] mb-3" style={{ color: '#475569', lineHeight: '1.6' }}>
            POTAL calculates Total Landed Cost — product + shipping + import duties + fees.
          </p>
          <div className="space-y-2">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-[13px] font-bold" style={{ color: '#EF4444' }}>🇨🇳 China (Ali/Temu/Shein)</p>
              <p className="text-[12px] mt-1" style={{ color: '#475569' }}>~20% duty — $800 de minimis eliminated Aug 2025</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <p className="text-[13px] font-bold" style={{ color: '#3B82F6' }}>🇰🇷🇯🇵 Korea / Japan</p>
              <p className="text-[12px] mt-1" style={{ color: '#475569' }}>Duty free under $800 threshold</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <p className="text-[13px] font-bold" style={{ color: '#8B5CF6' }}>🇪🇺🇬🇧 EU / UK</p>
              <p className="text-[12px] mt-1" style={{ color: '#475569' }}>Duty free under $800 threshold</p>
            </div>
          </div>
        </section>

        <div className="h-px" style={{ backgroundColor: '#e2e8f0' }} />

        {/* 5. Shipping */}
        <section>
          <h2 className="text-[15px] font-extrabold mb-3" style={{ color: '#02122c' }}>
            📦 Shipping Cost
          </h2>
          <p className="text-[13px] mb-3" style={{ color: '#475569', lineHeight: '1.6' }}>
            Shipping varies by retailer and membership status. POTAL factors these into every comparison automatically.
          </p>
          <div className="space-y-2">
            {[
              { name: 'Amazon Prime', detail: 'Free 1-2 day shipping on all orders', color: '#FF9900' },
              { name: 'Walmart+', detail: 'Free next-day/2-day shipping, no minimum', color: '#0071ce' },
              { name: 'Non-member', detail: 'Usually ~$5.99 for orders under $35', color: '#94a3b8' },
              { name: 'AliExpress Choice', detail: 'Free or low-cost shipping (7-15 days)', color: '#FF4747' },
              { name: 'Temu', detail: 'Free standard shipping (7-15 days)', color: '#FB7701' },
            ].map((item) => (
              <div key={item.name} className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-[12px] font-bold" style={{ color: '#000000' }}>{item.name}</p>
                  <p className="text-[11px]" style={{ color: '#64748b' }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
