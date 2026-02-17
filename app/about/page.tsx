"use client";

import React from 'react';
import { Icons } from '@/components/icons';

// [DATA] Tech Metrics
const STATS = [
  { value: "7", label: "Retail Partners", description: "Amazon, Walmart, eBay, BestBuy, Target, AliExpress, Temu" },
  { value: "0.5s", label: "Query Latency", description: "Average search response time" },
  { value: "100%", label: "Data Neutrality", description: "Unbiased algorithm ranking" },
  { value: "24/7", label: "Price Monitoring", description: "Automated deal detection" },
];

// [DATA] Core Values
const VALUES = [
  {
    title: "Algorithmic Transparency",
    description: "We don't hide shipping costs or taxes. Our engine calculates the 'True Landed Cost' instantly, so you never click on fake deals.",
    icon: "🔍"
  },
  {
    title: "Data Sovereignty",
    description: "Commerce data shouldn't be fragmented. We aggregate Amazon, Walmart, eBay, BestBuy, Target, AliExpress, and Temu into a single, unified search layer.",
    icon: "🌐"
  },
  {
    title: "Speed is a Feature",
    description: "Time is money. We removed the clutter—no banners, no popups, no ads. Just the raw data you need to make a decision in seconds.",
    icon: "⚡"
  }
];

export default function AboutPage() {
  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-20">
      
      {/* 1. Hero Section */}
      <section className="bg-[#02122c] text-white pt-32 pb-24 relative overflow-hidden border-b border-white/10">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#F59E0B]/10 to-transparent pointer-events-none"></div>
        
        <div className="max-w-[1440px] mx-auto px-6 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 border border-[#F59E0B] rounded-full bg-[#F59E0B]/10">
            <span className="text-[#F59E0B] text-sm font-bold tracking-widest uppercase">Our Mission</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
            Search Less, <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Buy Better.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            POTAL is not a store. It is a <strong className="text-white font-semibold">decision engine</strong>. 
            <br className="hidden md:block" />
            We de-fragment the global marketplace to give you the objective truth about price and delivery.
          </p>
        </div>
      </section>

      {/* 2. Metrics Section (1층) */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center group cursor-default">
                <div className="text-4xl md:text-5xl font-black text-[#02122c] mb-2 group-hover:text-[#F59E0B] transition-colors duration-300">
                  {stat.value}
                </div>
                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-slate-400">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Manifesto Section (2층) */}
      <section className="max-w-[1440px] mx-auto px-6 py-40">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          
          {/* Left: Sticky Title */}
          <div className="md:w-1/3 md:sticky md:top-32">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#02122c] mb-6">
              Why we built this.
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-8">
              The internet promised open commerce, but today it's walled gardens. 
              Amazon hides Walmart, AliExpress hides shipping times. 
              <br /><br />
              <span className="font-bold text-[#02122c]">We built the bridge.</span>
            </p>
            <a href="/" className="inline-flex items-center gap-2 text-[#F59E0B] font-bold hover:gap-3 transition-all">
              Start Searching <Icons.ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Right: Values Grid */}
          <div className="md:w-2/3 grid gap-8">
            {VALUES.map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-[#02122c] mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA Section (3층) */}
      {/* [수정] border-t 삭제. 이제 선 없이 배경색 차이로만 구분됩니다. */}
      <section className="bg-[#f1f5f9] py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#02122c] mb-6">
            Built for efficiency, not for ads.
          </h2>
          <p className="text-slate-600 mb-12 text-lg md:text-xl leading-relaxed">
            We are indexing the world's products in real-time. Join our network.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/help?topic=sell" className="px-8 py-4 bg-[#02122c] text-white font-bold rounded-xl hover:bg-[#F59E0B] hover:text-[#02122c] transition-colors shadow-lg">
              Partner with POTAL
            </a>
            <a href="/contact" className="px-8 py-4 bg-white text-[#02122c] border border-slate-200 font-bold rounded-xl hover:border-[#02122c] transition-colors">
              Contact Engineering
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}