"use client";

import React from 'react';
import { Icons } from '@/components/icons';

// [DATA]
const PARTNERS_DOMESTIC = [
  { name: "Amazon" }, { name: "Walmart" }, { name: "Target" }, { name: "Best Buy" }, { name: "Costco" },
  { name: "eBay" }, { name: "Home Depot" }, { name: "Lowe's" }, { name: "Macy's" }, { name: "Apple" },
  { name: "Nike" }, { name: "Kohl's" }, { name: "Sephora" }, { name: "Chewy" }, { name: "Kroger" },
  { name: "Wayfair" },
];

const PARTNERS_GLOBAL = [
  { name: "AliExpress" }, { name: "Temu" }, { name: "iHerb" }, { name: "Shein" }, { name: "DHgate" },
  { name: "YesStyle" }, { name: "Farfetch" }, { name: "ASOS" }, { name: "Uniqlo" }, { name: "Etsy" },
  { name: "MyTheresa" }, { name: "Olive Young" }, { name: "Mercari" },
];

// [COMPONENT] Flex-based Box (20% Width Forced)
function PartnerBox({ name }: { name: string }) {
  return (
    // w-[20%] -> 부모 너비의 정확히 1/5을 차지.
    // flex-shrink-0 -> 절대 찌그러지지 않음.
    // p-2 -> 간격 확보 (Gap 대신 Padding 사용)
    <div className="w-[20%] flex-shrink-0 p-2">
      <div className="flex items-center justify-center h-16 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-[#F59E0B] hover:shadow-md transition-all duration-200 cursor-default group w-full">
        <span className="text-sm font-bold text-[#02122c] group-hover:text-[#F59E0B] transition-colors truncate px-2">
          {name}
        </span>
      </div>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-20">
      
      {/* 1. Hero Section */}
      <section className="bg-[#02122c] text-white py-20 border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Partners & Affiliate Disclosure
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Direct integration ensures accurate pricing and fast shipping data.
          </p>
        </div>
      </section>

      {/* 2. Main Content Section */}
      <section className="max-w-[1440px] mx-auto px-6 py-16">
        
        {/* [LAYOUT FIX - FLEX WRAP] 
            Grid 대신 Flex를 사용하여 5열을 수학적으로 강제합니다.
            - min-w-[1000px]: 전체 트랙의 최소 너비 확보
            - flex flex-wrap: 줄바꿈 허용 (5개 채우면 다음 줄로)
            - items-start: 정렬
        */}
        <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
          <div className="min-w-[1000px]">
            
            {/* 1. Domestic List */}
            <div className="flex flex-wrap -mx-2">
              {PARTNERS_DOMESTIC.map((partner) => (
                <PartnerBox key={partner.name} name={partner.name} />
              ))}
            </div>

            {/* [SPACER] 투명 공백 (64px) */}
            <div className="h-16 w-full"></div>

            {/* 2. Global List */}
            <div className="flex flex-wrap -mx-2">
              {PARTNERS_GLOBAL.map((partner) => (
                <PartnerBox key={partner.name} name={partner.name} />
              ))}
            </div>

          </div>
        </div>
        
        {/* 3. Retailer CTA Box */}
        {/* max-w-3xl로 너비 제한 -> 무식하게 늘어나는 현상 방지 */}
        <div className="mt-24 bg-[#02122c] rounded-2xl shadow-xl overflow-hidden text-center py-16 px-8 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Are you a retailer?
            </h2>
            <p className="text-slate-300 mb-8 text-lg max-w-xl mx-auto leading-relaxed">
              Join our network to reach millions of global shoppers.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="/help?topic=sell" 
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#02122c] font-bold rounded-xl hover:bg-[#F59E0B] transition-colors shadow-md text-base"
              >
                Become a Partner <Icons.ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="/about" 
                className="inline-flex items-center gap-2 px-8 py-3 bg-transparent text-white border border-white/30 font-bold rounded-xl hover:bg-white/10 transition-colors text-base"
              >
                Learn More
              </a>
            </div>
        </div>

        {/* Affiliate Disclosure Text */}
        <div className="mt-12 text-center text-xs text-slate-400 max-w-3xl mx-auto leading-relaxed">
          * POTAL may earn an affiliate commission from qualifying purchases made through links on this page. 
          This does not affect our ranking algorithm or the price you pay.
        </div>

      </section>
    </div>
  );
}