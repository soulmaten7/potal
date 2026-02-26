"use client";

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icons } from '@/components/icons';

function TaxInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'sales'; // 'sales' | 'import'
  const isImport = type === 'import';

  const handleBack = () => {
    // 브라우저 히스토리 back → 검색 결과 화면으로 복귀
    router.back();
  };

  return (
    <div style={{ backgroundColor: '#02122c' }} className="w-full min-h-screen pb-28">

      {/* ─── Header with Back ─── */}
      <div style={{ padding: '60px 24px 24px' }}>
        <div className="max-w-[1440px] mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 mb-6 group"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Icons.ChevronLeft style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.5)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}
              className="group-hover:text-white transition-colors"
            >
              Back to results
            </span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isImport ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isImport ? (
                <Icons.Globe style={{ width: '22px', height: '22px', color: '#ef4444' }} />
              ) : (
                <Icons.Info style={{ width: '22px', height: '22px', color: '#F59E0B' }} />
              )}
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {isImport ? 'Import Duty & Fees' : 'Sales Tax Info'}
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', maxWidth: '600px', lineHeight: '1.6' }}>
            {isImport
              ? 'Understanding import duties, customs fees, and how they affect your total cost when buying from international retailers.'
              : 'How estimated sales tax works and what affects the final amount you pay at checkout.'}
          </p>
        </div>
      </div>

      {/* ─── Content Cards ─── */}
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {isImport ? (
            <>
              {/* Import Duty 20% */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>DUTY</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Import Duty (20%)</h2>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8' }}>
                  Items shipped from China currently carry approximately <strong style={{ color: '#ef4444' }}>20% import duty</strong>.
                  The de minimis exemption ($800 threshold) for Chinese goods was eliminated in August 2025,
                  meaning all purchases from China-based retailers (<strong style={{ color: 'rgba(255,255,255,0.7)' }}>AliExpress, Temu, Shein</strong>) are now
                  subject to customs duties regardless of value.
                </p>
              </div>

              {/* MPF */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>FEE</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Merchandise Processing Fee (MPF)</h2>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8' }}>
                  A flat <strong style={{ color: '#ef4444' }}>$5.50</strong> fee charged by U.S. Customs and Border Protection
                  on all informal entries (goods valued under $2,500). This fee applies to every international
                  shipment entering the U.S., regardless of the product type or retailer.
                </p>
              </div>

              {/* Duty-Free Countries */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.15)', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>INFO</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Duty-Free Countries</h2>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8' }}>
                  Orders from <strong style={{ color: 'rgba(255,255,255,0.7)' }}>South Korea, Japan, EU countries, and the UK</strong> remain
                  duty-free under the $800 de minimis threshold. Only goods originating from China are currently
                  affected by the duty changes. Items from iHerb (US-based) are also exempt.
                </p>
              </div>

              {/* How POTAL Calculates */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245,158,11,0.15)', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>POTAL</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>How POTAL Calculates</h2>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8', marginBottom: '12px' }}>
                  POTAL automatically calculates the &ldquo;Total Landed Cost&rdquo; for international products:
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', fontFamily: 'monospace' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '2' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>Product Price</span><br/>
                    <span style={{ color: '#ef4444' }}>+ Import Duty (20%)</span><br/>
                    <span style={{ color: '#ef4444' }}>+ MPF ($5.50)</span><br/>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>+ Shipping</span><br/>
                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', margin: '4px 0' }} />
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>= Total Landed Cost</strong>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.15)', padding: '20px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' }}>
                  <strong style={{ color: '#F59E0B' }}>Disclaimer:</strong> These are estimates based on current U.S. trade policies
                  as of 2025. Actual duties may vary based on product category (HS code), applicable trade agreements,
                  and any future policy changes. POTAL updates its calculations as trade policies evolve.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Estimated Sales Tax */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245,158,11,0.15)', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>TAX</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Estimated Sales Tax (~7%)</h2>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8' }}>
                  Sales tax is estimated at approximately <strong style={{ color: '#F59E0B' }}>7%</strong> based on the average U.S. state rate.
                  Actual tax varies significantly by state — for example, California charges ~8.75%,
                  Texas ~8.25%, while <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Oregon, Montana, Delaware, and New Hampshire have 0% sales tax</strong>.
                </p>
              </div>

              {/* How It Works */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#60a5fa', background: 'rgba(96,165,250,0.15)', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>HOW</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>How It Works</h2>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8' }}>
                  When you enter your <strong style={{ color: 'rgba(255,255,255,0.7)' }}>ZIP code</strong> in POTAL settings,
                  we can provide a more accurate tax estimate based on your specific location.
                  Without a ZIP code, POTAL uses the national average of ~7%.
                  The final tax amount is always calculated at checkout by the retailer.
                </p>
              </div>

              {/* Tax-Free Shopping */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.15)', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>TIP</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Tax-Free Shopping</h2>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8' }}>
                  Five states have no sales tax: <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Oregon, Montana, Delaware,
                  New Hampshire, and Alaska</strong>. If you live in one of these states and enter your ZIP code,
                  POTAL will show $0.00 estimated tax on domestic products.
                </p>
              </div>

              {/* How POTAL Calculates */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245,158,11,0.15)', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>POTAL</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>How POTAL Calculates</h2>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8', marginBottom: '12px' }}>
                  POTAL calculates the &ldquo;Total Landed Cost&rdquo; for domestic products:
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', fontFamily: 'monospace' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '2' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>Product Price</span><br/>
                    <span style={{ color: '#F59E0B' }}>+ Est. Sales Tax (~7%)</span><br/>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>+ Shipping</span><br/>
                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', margin: '4px 0' }} />
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>= Total Landed Cost</strong>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.15)', padding: '20px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' }}>
                  <strong style={{ color: '#F59E0B' }}>Disclaimer:</strong> The tax shown is an estimate only.
                  The exact amount will be determined by the retailer at the time of purchase based on your
                  shipping address and the product category. Some product categories (groceries, clothing under certain thresholds)
                  may be tax-exempt in certain states.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaxInfoPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: '#02122c' }} className="min-h-screen flex items-center justify-center"><span style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</span></div>}>
      <TaxInfoContent />
    </Suspense>
  );
}
