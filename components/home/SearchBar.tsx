"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [zipcode, setZipcode] = useState('');

  // 1. 컴포넌트가 뜨자마자 저장된 Zipcode 확인
  useEffect(() => {
    const savedZip = localStorage.getItem('potal_zipcode');
    if (savedZip) {
      setZipcode(savedZip);
    }
  }, []);

  // 2. 검색 실행 시 Zipcode 함께 전송
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // URL 쿼리 파라미터 생성
    const searchParams = new URLSearchParams();
    searchParams.set('q', query);
    
    // Zipcode가 있으면 같이 붙여서 보냄
    if (zipcode) {
      searchParams.set('zipcode', zipcode);
    }

    // 이동! (예: /search?q=iphone&zipcode=10001)
    router.push(`/search?${searchParams.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto group" role="search" aria-label="Product search">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Icons.Search className="w-6 h-6 text-slate-400 group-focus-within:text-[#02122c] transition-colors" aria-hidden="true" />
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search products across all retailers"
        placeholder={zipcode ? `Searching delivery to ${zipcode}...` : "Search across Amazon, Walmart, eBay, AliExpress..."}
        className="w-full h-14 pl-14 pr-32 bg-white border-2 border-slate-200 rounded-full text-lg shadow-lg focus:outline-none focus:border-[#02122c] focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-400 text-slate-900 font-medium"
      />

      <div className="absolute inset-y-1 right-1.5 flex items-center gap-2">
         {/* Zipcode 뱃지 (있을 때만 표시) */}
         {zipcode && (
           <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200">
             <Icons.MapPin className="w-3 h-3" />
             {zipcode}
           </div>
         )}
         
         <button
           type="submit"
           aria-label="Search products"
           className="h-11 px-6 bg-[#02122c] hover:bg-[#F59E0B] text-white font-bold rounded-full transition-colors flex items-center justify-center"
         >
           Search
         </button>
      </div>
    </form>
  );
}