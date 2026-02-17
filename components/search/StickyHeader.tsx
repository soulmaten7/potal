"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // [ADD] 직접 이동을 위해 추가
import { Icons, MapPinIcon, ClockIcon } from '../icons';

interface StickyHeaderProps {
  query: string;
  setQuery: (q: string) => void;
  zipcode: string;
  setZipcode: (z: string) => void;
  recentZips: string[];
  heroRecents: string[];
  onRemoveRecentZip: (zip: string) => void;
  onRemoveHeroRecent: (term: string) => void;
  onSearch: (e: React.FormEvent) => void;
  loading?: boolean;
}

export function StickyHeader({ 
  query, setQuery, zipcode, setZipcode,
  recentZips, heroRecents, onRemoveRecentZip, onRemoveHeroRecent, 
  onSearch, loading 
}: StickyHeaderProps) {
  
  const router = useRouter(); // [ADD] 라우터 사용
  const [showZipDropdown, setShowZipDropdown] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  
  // [ADD] 내부 로딩 상태 (이미지 분석 중일 때 사용)
  const [analyzing, setAnalyzing] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const zipRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !showPhotoMenu;
    setShowPhotoMenu(nextState);
    if (nextState) { setSearchFocused(false); setShowZipDropdown(false); }
  };

  const handleSearchInputFocus = () => {
    setSearchFocused(true); setShowPhotoMenu(false); setShowZipDropdown(false);
  };

  const handleZipInputFocus = () => {
    setShowZipDropdown(true); setSearchFocused(false); setShowPhotoMenu(false);
  };

  // [CORE Logic] 검색 버튼 클릭 시 실행되는 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPhotoMenu(false); 
    setSearchFocused(false); 
    setShowZipDropdown(false);

    // 1. 이미지가 없으면 -> 기존 방식대로 즉시 검색
    if (!selectedImage) {
      onSearch(e);
      return;
    }

    // 2. 이미지가 있으면 -> Vision API 호출 후 검색
    try {
      setAnalyzing(true); // 로딩 시작

      const formData = new FormData();
      formData.append('image', selectedImage);

      // Vision API 호출
      const res = await fetch('/api/search/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Analysis failed');
      
      const data = await res.json();
      const detectedKeywords = data.keywords || "";

      // 3. 사용자가 입력한 텍스트 + AI가 분석한 키워드 합치기
      const combinedQuery = `${query} ${detectedKeywords}`.trim();

      // UI에 검색어 업데이트
      setQuery(combinedQuery);

      // 4. [중요] 최신 검색어로 강제 이동 (부모 state 업데이트 기다리지 않음)
      const params = new URLSearchParams();
      if(combinedQuery) params.set("q", combinedQuery);
      if(zipcode) params.set("zip", zipcode);
      params.set("market", "all"); // 기본값

      // 히스토리 저장 로직은 page.tsx가 처리하거나, 여기서 직접 저장 가능
      // (여기서는 이동만 시키고 page.tsx가 쿼리를 받아 처리하게 함)
      router.push(`/search?${params.toString()}`);
      
      // 이미지 초기화 (선택 사항)
      // setSelectedImage(null);
      // setImagePreview(null);

    } catch (error) {
      console.error("Vision Search Error:", error);
      alert("Failed to analyze image. Searching with text only.");
      onSearch(e); // 실패 시 텍스트로만 검색
    } finally {
      setAnalyzing(false); // 로딩 끝
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
      setShowPhotoMenu(false); setSearchFocused(false); searchInputRef.current?.focus();
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation(); setSelectedImage(null); setImagePreview(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchFocused(false);
      if (zipRef.current && !zipRef.current.contains(target)) setShowZipDropdown(false);
      if (photoMenuRef.current && !photoMenuRef.current.contains(target)) setShowPhotoMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 전체 로딩 상태 (부모 로딩 OR 내부 분석 중)
  const isBusy = loading || analyzing;

  return (
    <header className="bg-[#02122c] sticky top-0 z-[2000] border-b border-white/10 shadow-md">
      <div className="max-w-[1440px] mx-auto px-6 h-[90px] flex items-center">
        
        <form onSubmit={handleSubmit} className="w-full flex gap-2 relative items-center">
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />

          {/* 1. Zipcode Box */}
          <div 
            ref={zipRef} 
            className="flex-none w-[280px] bg-white rounded-lg shadow-xl h-[60px] flex flex-col justify-center px-4 relative cursor-text"
            onClick={() => { const input = zipRef.current?.querySelector('input'); input?.focus(); }}
          >
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Deliver to</label>
            <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input 
                    type="text" 
                    inputMode="numeric" 
                    maxLength={5} 
                    value={zipcode} 
                    onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))} 
                    onFocus={handleZipInputFocus}
                    onClick={handleZipInputFocus}
                    placeholder="Zip" 
                    className="w-full text-[16px] font-bold text-slate-900 outline-none border-0 focus:ring-0 bg-transparent placeholder:text-gray-300 p-0" 
                />
            </div>
            
            {showZipDropdown && recentZips.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-2xl border border-slate-100 z-[3000] overflow-hidden animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Recent</div>
                    <ul>
                        {recentZips.map(zip => (
                            <li key={zip} className="flex items-center hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setZipcode(zip); setShowZipDropdown(false); }} className="flex-1 text-left px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                    <MapPinIcon className="w-4 h-4 text-slate-400" /> <span className="text-sm">{zip}</span>
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveRecentZip(zip); }} className="px-3 py-3 text-slate-400 hover:text-red-500"><Icons.X className="w-4 h-4" /></button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>

          {/* 2. Search Section */}
          <div className="flex-1 flex gap-2 relative">
            
            <div 
                ref={searchRef}
                className="flex-1 bg-white rounded-lg shadow-xl h-[60px] flex flex-col justify-center px-4 relative z-[2500] cursor-text"
                onClick={() => searchInputRef.current?.focus()}
            >
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Search products</label>
                <div className="relative flex items-center">
                    
                    {/* [UX] 미리보기 썸네일: 입력창 맨 앞, 텍스트 크기와 비슷하게 (w-8) */}
                    {imagePreview && (
                    <div className="relative flex-shrink-0 mr-2 group">
                        <img src={imagePreview} alt="preview" className="w-8 h-8 rounded-md object-cover border border-slate-200" />
                        <button type="button" onClick={clearImage} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icons.X className="w-2 h-2" />
                        </button>
                    </div>
                    )}

                    <input
                        ref={searchInputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleSearchInputFocus}
                        onClick={handleSearchInputFocus}
                        placeholder={imagePreview ? "Describe this photo..." : "e.g. Lego Star Wars"}
                        className="w-full text-[16px] font-bold text-slate-900 outline-none border-0 focus:ring-0 bg-transparent placeholder:text-gray-300 p-0 pr-16"
                    />

                    {/* X 버튼 — 검색어가 있을 때만 표시, 카메라 아이콘 왼쪽 */}
                    {query.trim() && (
                      <button
                        type="button"
                        onClick={() => { setQuery(''); searchInputRef.current?.focus(); }}
                        className="absolute right-9 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <Icons.X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      </button>
                    )}

                    <div className="absolute right-0 top-1/2 -translate-y-1/2" ref={photoMenuRef}>
                    <button 
                        type="button" 
                        onClick={handlePhotoBtnClick}
                        className="p-1.5 hover:bg-slate-100 rounded-full transition-colors group"
                    >
                        <Icons.Camera className={`w-6 h-6 ${showPhotoMenu || imagePreview ? 'text-[#F59E0B]' : 'text-slate-400'} group-hover:text-[#F59E0B] transition-colors`} />
                    </button>

                    {showPhotoMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 z-[3000] overflow-hidden animate-fadeIn">
                        <button type="button" onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors border-b border-slate-100">
                            <Icons.Camera className="w-4 h-4 text-[#F59E0B]" /> Take Photo
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors">
                            <Icons.Box className="w-4 h-4 text-[#F59E0B]" /> Upload Photo
                        </button>
                        </div>
                    )}
                    </div>
                </div>

                {searchFocused && !query.trim() && !imagePreview && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-xl shadow-2xl border border-slate-100 z-[2900] overflow-hidden animate-fadeIn">
                        <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Searches</div>
                        <ul className="py-1">
                        {heroRecents.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-slate-500">No recent searches.</li>
                        ) : (
                            heroRecents.map((term) => (
                            <li key={term} className="flex items-center group hover:bg-slate-50 cursor-pointer">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setQuery(term); setSearchFocused(false); searchInputRef.current?.focus(); }} className="flex-1 flex items-center gap-3 px-4 py-3 text-left text-slate-900 min-w-0">
                                <ClockIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="font-medium text-sm truncate">{term}</span>
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveHeroRecent(term); }} className="p-2 mr-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors shrink-0"><Icons.X className="w-3 h-3" /></button>
                            </li>
                            ))
                        )}
                        </ul>
                    </div>
                )}
            </div>

            <button 
                type="submit" 
                disabled={isBusy} 
                className="bg-[#F59E0B] rounded-lg shadow-lg flex items-center justify-center text-2xl font-extrabold text-white drop-shadow-md h-[60px] px-8 hover:bg-amber-600 active:scale-95 cursor-pointer transition-all shrink-0"
            >
                {/* [UX] 버튼 텍스트가 상태에 따라 바뀜 */}
                {analyzing ? 'Analyzing...' : loading ? '...' : 'Search'}
            </button>
          </div>

        </form>
      </div>
    </header>
  );
}