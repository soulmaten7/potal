import React from 'react';
import { Icons } from '../icons';

export function HeroVisuals() {
  return (
    <>
      {/* 모바일: PC와 동일한 슬로건 */}
      <div className="md:hidden text-center py-6">
        <h1 className="text-[24px] font-extrabold text-white leading-tight tracking-tight">
          Domestic Speed. Global Prices.<br />
          <span className="text-[#F59E0B]">One Search.</span>
        </h1>
      </div>

      {/* 데스크톱 슬로건 */}
      <h1 className="hidden md:block text-5xl font-extrabold mb-8 text-white text-left tracking-tight leading-tight">
        Domestic Speed. Global Prices. <br /> One Search.
      </h1>

      {/* Feature Cards — 데스크톱만 표시 */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 text-white relative z-20 mt-8">
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Globe className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">Domestic vs Global</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            Compare Price, Shipping, and Delivery Time all at once.
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Coins className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">Total Landed Cost</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            Product + Shipping + Tax for total transparency.
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Robot className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">POTAL Agent</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            Filters out fakes and irrelevant listings automatically.
          </p>
        </div>
      </div>
    </>
  );
}
