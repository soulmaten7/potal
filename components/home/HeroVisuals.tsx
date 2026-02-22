import React from 'react';
import { Icons } from '../icons';

export function HeroVisuals() {
  return (
    <>
      {/* 모바일: 메인 슬로건 */}
      <div className="md:hidden text-center py-6">
        <h1 className="text-[22px] font-extrabold text-white leading-tight tracking-tight">
          Compare Every Store on Earth.
        </h1>
        <p className="text-[15px] font-bold mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Domestic vs Global — <span className="text-[#F59E0B]">One Search.</span>
        </p>
      </div>

      {/* 데스크톱: 메인 슬로건 */}
      <div className="hidden md:block mb-8">
        <h1 className="text-5xl font-extrabold text-white text-left tracking-tight leading-tight">
          Compare Every Store on Earth.
        </h1>
        <p className="text-xl font-bold mt-3 text-slate-400">
          Domestic vs Global — <span className="text-[#F59E0B]">One Search.</span>
        </p>
      </div>

      {/* Feature Cards — 데스크톱 4개 */}
      <div className="hidden md:grid md:grid-cols-4 gap-5 text-white relative z-20 mt-8">
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Globe className="w-6 h-6 text-[#F59E0B]" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">Every Store. One Search.</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            Amazon, Walmart, eBay, Target, AliExpress and more — compare domestic and global retailers side by side.
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Sparkles className="w-6 h-6 text-[#F59E0B]" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">Just Ask</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            Search with questions like &quot;What&apos;s a good gift for mom?&quot; — POTAL understands natural language, not just keywords.
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Camera className="w-6 h-6 text-[#F59E0B]" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">Photo Search</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            Snap a photo. Add details if you want. POTAL AI analyzes it and searches every retailer for you.
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Coins className="w-6 h-6 text-[#F59E0B]" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">True Final Price</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            Product + Shipping + Tax + Import Duties = Total Landed Cost. No hidden fees — the real price you pay.
          </p>
        </div>
      </div>
    </>
  );
}
