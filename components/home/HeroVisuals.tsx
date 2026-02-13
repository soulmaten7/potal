import React from 'react';
import { Icons } from '../icons'; // 아이콘 가져오기

export function HeroVisuals() {
  return (
    <>
      {/* 슬로건: 왼쪽 정렬, 볼드체, 기능 중심 메시지 */}
      <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-white text-left tracking-tight leading-tight">
        Domestic Speed. Global Prices. <br className="md:hidden" /> One Search.
      </h1>

      {/* Feature Cards (3단 특징 카드) */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-white relative z-20">
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Globe className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">Domestic vs Global</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            Compare Product Price, Shipping Cost, and Delivery Time all at once.
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Coins className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">Total Landed Cost</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            See the full breakdown of Product + Shipping + Tax for total transparency.
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm flex flex-col">
          <Icons.Robot className="w-6 h-6 text-white" />
          <h3 className="text-lg font-bold text-white mt-4 mb-2">POTAL Agent</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            POTAL filters out fakes, accessories, and irrelevant listings to keep results clean.
          </p>
        </div>
      </div>
    </>
  );
}