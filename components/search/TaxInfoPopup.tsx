"use client";

import React, { forwardRef } from 'react';

interface TaxInfoPopupProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'domestic' | 'global';
}

/**
 * TaxInfoPopup Component
 *
 * A popup that displays detailed tax information for domestic (sales tax)
 * or global (import duty) products. Uses forwardRef for outside-click detection.
 */
export const TaxInfoPopup = forwardRef<HTMLDivElement, TaxInfoPopupProps>(
  ({ isVisible, onClose, type }, ref) => {
    if (!isVisible) return null;

    const isGlobal = type === 'global';

    return (
      <div
        ref={ref}
        className="absolute bottom-full right-0 mb-2 w-[320px] bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 text-left max-h-[60vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-slate-900 text-sm">
            {isGlobal ? '🌏 Import Duty & Fees' : '🇺🇸 Sales Tax Info'}
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isGlobal ? (
          <>
            <p className="text-[11px] leading-relaxed text-slate-600 mb-3">
              POTAL calculates <strong>Total Landed Cost</strong> — product + shipping + import duties + fees.
            </p>

            <div className="mb-3">
              <p className="text-[11px] font-bold text-slate-900 mb-1.5">
                🏛️ Import Duty (20%)
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Items from China carry ~20% import duty. The $800 de minimis exemption for Chinese goods was eliminated in Aug 2025.
              </p>
            </div>

            <div className="mb-3">
              <p className="text-[11px] font-bold text-slate-900 mb-1.5">
                📋 MPF ($5.50)
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Merchandise Processing Fee — flat $5.50 charged by U.S. Customs on all informal entries (under $2,500).
              </p>
            </div>

            <div className="mb-3">
              <p className="text-[11px] font-bold text-slate-900 mb-1.5">
                ✅ Duty-Free Countries
              </p>
              <div className="bg-emerald-50 border border-emerald-100 rounded p-2 text-[10px]">
                <span className="font-bold text-emerald-700">
                  Korea, Japan, EU, UK
                </span>
                <span className="text-emerald-600">
                  {' '}— duty-free under $800 threshold
                </span>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 mb-2">
              <p className="text-[11px] font-bold text-red-700 mb-1">
                💡 Example: $50 from AliExpress
              </p>
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product</span>
                  <span>$50.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duty (20%)</span>
                  <span className="text-red-500">+$10.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MPF</span>
                  <span className="text-red-500">+$5.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between border-t border-red-200 pt-0.5 mt-0.5">
                  <span className="font-bold">Total Landed Cost</span>
                  <span className="font-bold text-slate-900">$65.50</span>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 leading-relaxed">
              Estimates based on 2025 U.S. trade policies. Actual duties may vary by product category and future policy changes.
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] leading-relaxed text-slate-600 mb-3">
              POTAL estimates sales tax using average state+local rates (~7%). Actual tax is finalized at checkout.
            </p>

            <div className="mb-3">
              <p className="text-[11px] font-bold text-slate-900 mb-1.5">
                📐 How Tax Is Calculated
              </p>
              <div className="bg-slate-50 rounded-lg p-2.5 text-[10px] space-y-1 leading-relaxed">
                <p>
                  <strong>Tax = Product Price × State+Local Rate</strong>
                </p>
                <p className="text-slate-500">
                  Shipping is generally NOT taxed in most states.
                </p>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-[11px] font-bold text-slate-900 mb-1.5">
                🗺️ Tax Rates by State
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>California</span>
                  <span className="font-bold">8.75%</span>
                </div>
                <div className="flex justify-between">
                  <span>New York</span>
                  <span className="font-bold">8.00%</span>
                </div>
                <div className="flex justify-between">
                  <span>Texas</span>
                  <span className="font-bold">8.25%</span>
                </div>
                <div className="flex justify-between">
                  <span>Florida</span>
                  <span className="font-bold">7.00%</span>
                </div>
              </div>
              <div className="mt-1.5 bg-emerald-50 border border-emerald-100 rounded p-1.5 text-[10px]">
                <span className="font-bold text-emerald-700">No Tax:</span>
                <span className="text-emerald-600"> OR, MT, NH, DE, AK</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 mb-2">
              <p className="text-[11px] font-bold text-blue-700 mb-1">
                💡 Example: $100 in California
              </p>
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product</span>
                  <span>$100.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping</span>
                  <span className="text-emerald-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CA Tax (8.75%)</span>
                  <span>+$8.75</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-0.5 mt-0.5">
                  <span className="font-bold">Total Landed Cost</span>
                  <span className="font-bold text-slate-900">$108.75</span>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 leading-relaxed">
              Tax estimate uses average combined rates. Exact tax may differ by municipality and product category.
            </p>
          </>
        )}
      </div>
    );
  }
);

TaxInfoPopup.displayName = 'TaxInfoPopup';
