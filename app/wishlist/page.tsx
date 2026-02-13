"use client";

import React from 'react';
import Link from 'next/link';
// [경로] 에러가 나지 않는 기본 아이콘만 가져옵니다.
import { Icons } from '@/components/icons'; 
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';

// [해결] Trash 아이콘이 없어서 에러가 났으므로, 여기서 직접 만듭니다.
function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

export default function WishlistPage() {
  const { wishlist, clearWishlist } = useWishlist();

  return (
    <main className="min-h-screen bg-[#f8fbff] pb-20">
      <div className="max-w-[1440px] mx-auto px-6 pt-8">
        
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[#02122c]">Saved Items</h1>
            <span className="bg-slate-200 text-slate-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
              {wishlist.length}
            </span>
          </div>

          {/* [Clear All] 버튼: 이제 TrashIcon이 있어서 에러가 안 납니다. */}
          {wishlist.length > 0 && (
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to delete all saved items?')) {
                  clearWishlist();
                }
              }}
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-bold text-sm px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* 컨텐츠 영역 */}
        {wishlist.length === 0 ? (
          // 빈 상태 (Empty State)
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              {/* 하트 아이콘은 기존 Icons에 있으므로 그대로 사용 */}
              <Icons.Heart className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-[#02122c] mb-2">Your wishlist is empty</h2>
            <p className="text-slate-500 mb-8 max-w-md">
              Items you save while searching will appear here.
            </p>
            <Link 
              href="/" 
              className="px-8 py-3 bg-[#02122c] hover:bg-[#F59E0B] text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
            >
              Start Searching
            </Link>
          </div>
        ) : (
          // 리스트 영역: 기존 검색 결과와 동일한 2열 그리드 유지
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlist.map((product, index) => (
              <ProductCard 
                // [방어 코드] id가 없으면 index를 써서 에러 방지
                key={product.id || index} 
                product={product} 
                // 타입이 없으면 국내 상품으로 가정
                type={product.type || "domestic"} 
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}