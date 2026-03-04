import React from 'react';
import { Icons } from '../icons';

export function HeroVisuals() {
  return (
    <>
      {/* 모바일: 메인 슬로건 */}
      <div className="md:hidden text-center py-6">
        <h1 className="text-[22px] font-extrabold text-[#02122c] leading-tight tracking-tight">
          Compare Every Store on Earth.
        </h1>
        <p className="text-[15px] font-bold mt-1.5" style={{ color: '#64748b' }}>
          Domestic vs Global — <span className="text-[#F59E0B]">One Search.</span>
        </p>
      </div>

      {/* 데스크톱: 메인 슬로건 */}
      <div className="hidden md:block mb-8">
        <h1 className="text-5xl font-extrabold text-[#02122c] text-left tracking-tight leading-tight">
          Compare Every Store on Earth.
        </h1>
        <p className="text-xl font-bold mt-3 text-slate-400">
          Domestic vs Global — <span className="text-[#F59E0B]">One Search.</span>
        </p>
      </div>

      {/* 데스크톱: 4-Step 검색 가이드 */}
      <div className="hidden md:grid md:grid-cols-4 gap-5 relative z-20 mt-8">
        {[
          { step: '1', title: 'Add ZIP Code', desc: 'Enter your ZIP code to calculate exact shipping, tax, and import duties. See the true Total Cost with no hidden fees.' },
          { step: '2', title: 'Search by Product Name', desc: 'Type "PlayStation 5", "LEGO Star Wars", or any product name. POTAL compares prices across Amazon, Walmart, eBay, Target, AliExpress and more.' },
          { step: '3', title: 'Ask AI a Question', desc: 'Try "best headphones under $100" or "gift for 5 year old boy." POTAL AI understands natural language and finds the best matching products.' },
          { step: '4', title: 'Search by Photo', desc: 'Snap or upload a photo, then add a question or description to help AI understand exactly what you want. POTAL AI analyzes both the image and your text to find the best matching products.' },
        ].map((item) => (
          <div key={item.step} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-3.5 min-h-[160px]">
            <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
              <span className="text-sm font-extrabold text-white">{item.step}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-[#02122c] mb-1.5">{item.title}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

    </>
  );
}
