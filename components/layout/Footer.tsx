"use client";

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#02122c] text-white py-12 mt-auto w-full z-10 relative">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">

        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="text-2xl font-extrabold tracking-tight cursor-pointer inline-block">
              <span className="text-white">P</span>
              <span className="text-[#F59E0B]">O</span>
              <span className="text-white">TAL</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              The infrastructure for global commerce.
              Total landed cost API for 139 countries.
            </p>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Product</h4>
            <Link href="/developers" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Integration Hub
            </Link>
            <Link href="/developers/docs" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              API Documentation
            </Link>
            <Link href="/developers/playground" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Widget Playground
            </Link>
            <Link href="/pricing" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Dashboard
            </Link>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Resources</h4>
            <Link href="/help" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Help Center
            </Link>
            <Link href="/widget/demo" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Widget Demo
            </Link>
            <Link href="/contact" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Contact Us
            </Link>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Legal</h4>
            <Link href="/terms" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            &copy; 2026 POTAL Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-500">
              139 countries &middot; Real-time duty &amp; tax calculations
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
