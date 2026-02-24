"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // [ADD] 직접 이동을 위해 추가
import { Icons, MapPinIcon, ClockIcon } from '../icons';
import { lookupZip } from '@/app/lib/utils/zipCodeDatabase';
import { useVoiceSearch } from '@/app/hooks/useVoiceSearch';

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
  market?: string;
  setMarket?: (val: string) => void;
}

export function StickyHeader({
  query, setQuery, zipcode, setZipcode,
  recentZips, heroRecents, onRemoveRecentZip, onRemoveHeroRecent,
  onSearch, loading, market = 'all', setMarket
}: StickyHeaderProps) {
  
  const router = useRouter(); // [ADD] 라우터 사용
  const [showZipDropdown, setShowZipDropdown] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  // 🎤 음성 검색
  const handleVoiceResult = useCallback((transcript: string) => {
    setQuery(transcript);
  }, [setQuery]);

  const { isSupported: voiceSupported, isListening, toggleListening } = useVoiceSearch({
    lang: 'en-US',
    onResult: handleVoiceResult,
  });

  // ZIP 코드 실시간 검증
  const zipInfo = useMemo(() => {
    if (zipcode.length !== 5) return null;
    return lookupZip(zipcode);
  }, [zipcode]);
  
  // [ADD] 내부 로딩 상태 (이미지 분석 중일 때 사용)
  const [analyzing, setAnalyzing] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const zipRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // handlePhotoBtnClick 제거 — 카메라 아이콘이 OS 기본 picker를 직접 호출

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
      if (query.trim()) formData.append('userText', query.trim());  // 사용자 텍스트 컨텍스트 전달

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
      params.set("market", market); // 현재 선택된 마켓 유지

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
    <header className="sticky top-0 z-[2000] shadow-md" style={{ backgroundColor: '#02122c', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6">

        <form onSubmit={handleSubmit} className="w-full relative">

          {/* 단일 파일 input — OS가 카메라/사진첩 선택지를 자동 표시 */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

          {/* ═══ MOBILE: ← Search 헤더 + 컴팩트 검색바 ═══ */}
          <div className="md:hidden py-1">
            {/* ← Search 네비게이션 바 — 중앙 정렬 */}
            <div className="relative flex items-center justify-center py-1.5">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="absolute left-0 p-0.5"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-[15px] font-extrabold text-white">Search</span>
            </div>
            {/* All / Domestic / Global 텍스트 탭 — 스카이스캐너 스타일 왼쪽 정렬 */}
            {setMarket && (
              <div className="flex items-center gap-4 mt-0.5 mb-0.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'domestic', label: 'Domestic' },
                  { id: 'global', label: 'Global' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setMarket(tab.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="text-[13px] py-0.5 transition-all"
                    style={{
                      color: market === tab.id ? '#ffffff' : 'rgba(255,255,255,0.4)',
                      fontWeight: market === tab.id ? 800 : 500,
                      borderBottom: market === tab.id ? '2px solid #F59E0B' : '2px solid transparent',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {/* 검색 입력바 */}
            <div className="flex items-center gap-1.5 mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '6px 8px' }}>
              {/* ZIP 입력 — 작은 영역 + State 코드 표시 */}
              <div ref={zipRef} className="relative flex items-center gap-1 shrink-0" style={{ borderRight: '1px solid rgba(255,255,255,0.15)', paddingRight: '8px' }}>
                <MapPinIcon className="w-3.5 h-3.5 shrink-0" style={{ color: zipInfo ? '#059669' : '#F59E0B' }} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  onFocus={handleZipInputFocus}
                  onClick={handleZipInputFocus}
                  placeholder="ZIP"
                  className="w-[52px] text-[13px] font-bold text-white outline-none border-0 focus:ring-0 bg-transparent placeholder:text-white/30 p-0"
                />
                {showZipDropdown && recentZips.length > 0 && (
                  <div className="absolute top-[calc(100%+12px)] left-0 w-[200px] bg-white rounded-xl shadow-2xl border border-slate-100 z-[3000] overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">Recent</div>
                    <ul>
                      {recentZips.map(z => (
                        <li key={z} className="flex items-center hover:bg-slate-50">
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setZipcode(z); setShowZipDropdown(false); }} className="flex-1 text-left px-3 py-2 font-bold text-slate-900 flex items-center gap-2 text-sm">
                            <MapPinIcon className="w-3 h-3 text-slate-400" /> {z}
                          </button>
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveRecentZip(z); }} className="px-2 py-2 text-slate-400 hover:text-red-500"><Icons.X className="w-3 h-3" /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {zipInfo && (
                  <span className="text-[9px] font-bold ml-0.5 whitespace-nowrap" style={{ color: '#059669' }}>{zipInfo.stateCode}</span>
                )}
              </div>

              {/* 🔍 돋보기 (왼쪽) — Amazon 스타일 */}
              <Icons.Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} />

              {/* Search 입력 — 메인 영역 */}
              <div ref={searchRef} className="flex-1 flex items-center gap-1.5 min-w-0 relative">
                {imagePreview && (
                  <div className="relative shrink-0">
                    <img src={imagePreview} alt="preview" className="w-6 h-6 rounded object-cover" />
                    <button type="button" onClick={clearImage} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
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
                  placeholder="Search products"
                  className="flex-1 min-w-0 text-[13px] font-bold text-white outline-none border-0 focus:ring-0 bg-transparent placeholder:text-white/30 p-0"
                />
                {query.trim() && (
                  <button type="button" onClick={() => { setQuery(''); searchInputRef.current?.focus(); }} className="p-0.5 shrink-0">
                    <Icons.X className="w-3.5 h-3.5 text-white/40" />
                  </button>
                )}
                {/* Recent Searches dropdown (mobile) */}
                {searchFocused && !query.trim() && !imagePreview && (
                  <div className="absolute left-0 right-0 top-[calc(100%+12px)] bg-white rounded-xl shadow-2xl border border-slate-100 z-[2900] overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">Recent Searches</div>
                    <ul className="py-0.5">
                      {heroRecents.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-slate-500">No recent searches.</li>
                      ) : (
                        heroRecents.map((term) => (
                          <li key={term} className="flex items-center group hover:bg-slate-50">
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setQuery(term); setSearchFocused(false); }} className="flex-1 flex items-center gap-2 px-3 py-2 text-left text-slate-900 min-w-0">
                              <ClockIcon className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-medium text-xs truncate">{term}</span>
                            </button>
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveHeroRecent(term); }} className="p-1.5 mr-1 text-slate-400 hover:text-red-500 shrink-0"><Icons.X className="w-3 h-3" /></button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* 🎤 마이크 (음성 검색) */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`shrink-0 p-0.5 rounded-full transition-colors ${isListening ? 'bg-red-500/20' : ''}`}
                  aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                >
                  <Icons.Microphone
                    className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`}
                    style={{ color: isListening ? '#ef4444' : 'rgba(255,255,255,0.5)' }}
                  />
                </button>
              )}

              {/* 📷 카메라 아이콘 (오른쪽) — OS 기본 picker 호출 */}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 p-0.5">
                <Icons.Camera className="w-4 h-4" style={{ color: imagePreview ? '#F59E0B' : 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
          </div>

          {/* ═══ DESKTOP: 기존 2줄 검색바 ═══ */}
          <div className="hidden md:flex py-0 h-[90px] items-center gap-2">
            {/* 1. Zipcode Box */}
            <div
              ref={zipRef}
              className="flex-none w-[280px] bg-white rounded-lg shadow-xl h-[60px] flex flex-col justify-center px-4 relative cursor-text"
              onClick={() => { const input = zipRef.current?.querySelector('input'); input?.focus(); }}
            >
              <label className="text-[11px] font-bold uppercase tracking-wider leading-none mb-1" style={{ color: zipInfo ? '#059669' : '#6b7280' }}>
                {zipInfo ? `${zipInfo.city}, ${zipInfo.stateCode}` : 'Deliver to'}
              </label>
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 flex-shrink-0" style={{ color: zipInfo ? '#059669' : '#94a3b8' }} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  onFocus={handleZipInputFocus}
                  onClick={handleZipInputFocus}
                  placeholder="Zipcode"
                  className="w-full text-[16px] font-bold text-slate-900 outline-none border-0 focus:ring-0 bg-transparent placeholder:text-gray-300 p-0"
                />
              </div>
              {showZipDropdown && recentZips.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-2xl border border-slate-100 z-[3000] overflow-hidden animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Recent</div>
                  <ul>
                    {recentZips.map(z => (
                      <li key={z} className="flex items-center hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setZipcode(z); setShowZipDropdown(false); }} className="flex-1 text-left px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-slate-400" /> <span className="text-sm">{z}</span>
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveRecentZip(z); }} className="px-3 py-3 text-slate-400 hover:text-red-500"><Icons.X className="w-4 h-4" /></button>
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
                    className="w-full text-[16px] font-bold text-slate-900 outline-none border-0 focus:ring-0 bg-transparent placeholder:text-gray-300 p-0 pr-24"
                  />
                  {query.trim() && (
                    <button type="button" onClick={() => { setQuery(''); searchInputRef.current?.focus(); }} className={`absolute ${voiceSupported ? 'right-[72px]' : 'right-9'} top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors`}>
                      <Icons.X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                  {/* 🎤 + 📷 아이콘 — 오른쪽 배치 */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {/* 🎤 마이크 (음성 검색) */}
                    {voiceSupported && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`flex items-center justify-center rounded-full transition-all hover:scale-105 ${isListening ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-slate-100'}`}
                        style={{ width: '32px', height: '32px' }}
                        aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                      >
                        <Icons.Microphone
                          className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`}
                          style={{ color: isListening ? '#ef4444' : '#94a3b8' }}
                        />
                      </button>
                    )}
                    {/* 📷 카메라 아이콘 — OS 기본 picker 호출 */}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center rounded-full transition-all hover:scale-105 hover:bg-slate-100" style={{ width: '32px', height: '32px' }}>
                      <Icons.Camera className="w-5 h-5" style={{ color: imagePreview ? '#F59E0B' : '#94a3b8' }} />
                    </button>
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
              <button type="submit" disabled={isBusy} className="bg-[#F59E0B] rounded-lg shadow-lg flex items-center justify-center text-2xl font-extrabold text-white drop-shadow-md h-[60px] px-8 hover:bg-amber-600 active:scale-95 cursor-pointer transition-all shrink-0">
                {analyzing ? 'Analyzing...' : loading ? '...' : 'Search'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </header>
  );
}