"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Icons, MapPinIcon, ClockIcon } from '../icons';
import { lookupZip, validateZip } from '@/app/lib/utils/zipCodeDatabase';
import { useVoiceSearch } from '@/app/hooks/useVoiceSearch';

interface SearchWidgetProps {
  query: string;
  setQuery: (q: string) => void;
  zipcode: string;
  setZipcode: (z: string) => void;
  market: 'all' | 'domestic' | 'global';
  setMarket: (m: 'all' | 'domestic' | 'global') => void;
  loading: boolean;
  recentZips: string[];
  heroRecents: string[];
  onRemoveRecentZip: (zip: string) => void;
  onRemoveHeroRecent: (term: string) => void;
  onSearch: (image?: File | null) => void;
}

export function SearchWidget({
  query, setQuery, zipcode, setZipcode, market, setMarket, loading,
  recentZips, heroRecents, onRemoveRecentZip, onRemoveHeroRecent, onSearch
}: SearchWidgetProps) {

  const [showZipDropdown, setShowZipDropdown] = useState(false);
  const [heroSearchFocused, setHeroSearchFocused] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  // 🎤 음성 검색
  const handleVoiceResult = useCallback((transcript: string) => {
    setQuery(transcript);
  }, [setQuery]);

  const { isSupported: voiceSupported, isListening, toggleListening } = useVoiceSearch({
    lang: 'en-US',
    onResult: handleVoiceResult,
  });

  // ZIP 코드 실시간 검증 — City, State 표시
  const zipInfo = useMemo(() => {
    if (zipcode.length !== 5) return null;
    return lookupZip(zipcode);
  }, [zipcode]);
  const isZipInvalid = zipcode.length === 5 && !zipInfo;

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [shakeZip, setShakeZip] = useState(false);
  const [shakeQuery, setShakeQuery] = useState(false);

  // 모바일/데스크톱 각각 별도 ref
  const mZipRef = useRef<HTMLDivElement>(null);
  const mSearchRef = useRef<HTMLDivElement>(null);
  const mRecentSearchRef = useRef<HTMLDivElement>(null);
  const mPhotoMenuRef = useRef<HTMLDivElement>(null);
  const mSearchInputRef = useRef<HTMLInputElement>(null);

  const dZipRef = useRef<HTMLDivElement>(null);
  const dSearchRef = useRef<HTMLDivElement>(null);
  const dPhotoMenuRef = useRef<HTMLDivElement>(null);
  const dSearchInputRef = useRef<HTMLInputElement>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);   // capture="environment" → 카메라 직접 실행
  const galleryInputRef = useRef<HTMLInputElement>(null);  // capture 없음 → 사진 보관함만

  // 카메라 또는 사진보관함 선택 메뉴 토글
  const handlePhotoBtnClick = () => {
    setShowPhotoMenu((prev) => !prev);
    setHeroSearchFocused(false);
  };

  const handleSearchInputFocus = () => {
    setHeroSearchFocused(true);
    setShowPhotoMenu(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    const hasZip = zipcode.trim().length > 0;
    const hasImage = !!selectedImage;

    let isValid = true;
    if (!trimmed && !hasImage) {
      setShakeQuery(true);
      setTimeout(() => setShakeQuery(false), 500);
      isValid = false;
    }
    if (!hasZip) {
      setShakeZip(true);
      setTimeout(() => setShakeZip(false), 500);
      isValid = false;
    }
    if (isValid) {
      setShowZipDropdown(false);
      setHeroSearchFocused(false);
      setShowPhotoMenu(false);
      onSearch(selectedImage);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setShowPhotoMenu(false);
      setHeroSearchFocused(false);
      // 모바일 또는 데스크톱 input에 포커스
      mSearchInputRef.current?.focus();
      dSearchInputRef.current?.focus();
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    setImagePreview(null);
  };

  const clearQuery = () => {
    setQuery('');
    setSelectedImage(null);
    setImagePreview(null);
    mSearchInputRef.current?.focus();
    dSearchInputRef.current?.focus();
  };

  const selectRecentSearch = (term: string) => {
    setQuery(term);
    setHeroSearchFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 모바일 refs
      if (mZipRef.current && !mZipRef.current.contains(target) &&
          dZipRef.current && !dZipRef.current.contains(target)) setShowZipDropdown(false);
      if (mSearchRef.current && !mSearchRef.current.contains(target) &&
          dSearchRef.current && !dSearchRef.current.contains(target) &&
          (!mRecentSearchRef.current || !mRecentSearchRef.current.contains(target))) setHeroSearchFocused(false);
      if (mPhotoMenuRef.current && !mPhotoMenuRef.current.contains(target) &&
          dPhotoMenuRef.current && !dPhotoMenuRef.current.contains(target)) setShowPhotoMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const marketTabs = [
    { id: 'all' as const, label: 'All', icon: '🔍' },
    { id: 'domestic' as const, label: 'Domestic', icon: '🇺🇸' },
    { id: 'global' as const, label: 'Global', icon: '🌏' },
  ];

  // 📷 / 🖼️ 선택 메뉴 렌더링 (ref 없음 — 부모 wrapper가 ref를 소유)
  const renderPhotoMenu = (isMobile: boolean) =>
    showPhotoMenu ? (
      <div
        className={`absolute ${isMobile ? 'right-0 top-full mt-1' : 'right-0 top-full mt-2'} bg-white rounded-xl shadow-2xl border border-slate-100 z-[60] overflow-hidden animate-fadeIn min-w-[180px]`}
      >
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); cameraInputRef.current?.click(); setShowPhotoMenu(false); }}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 text-left text-sm font-semibold text-slate-800 transition-colors"
        >
          <span className="text-lg">📷</span> Take Photo
        </button>
        <div className="border-t border-slate-100" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); galleryInputRef.current?.click(); setShowPhotoMenu(false); }}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 text-left text-sm font-semibold text-slate-800 transition-colors"
        >
          <span className="text-lg">🖼️</span> Photo Library
        </button>
      </div>
    ) : null;

  // Recent searches dropdown (shared)
  const renderRecentSearches = (isMobile: boolean) => (
    heroSearchFocused && !query.trim() && !imagePreview ? (
      <div className={`absolute left-0 right-0 top-full w-full bg-white ${isMobile ? 'rounded-b-2xl' : 'rounded-xl mt-2'} shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fadeIn`}>
        <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Searches</div>
        <ul className="py-1">
          {heroRecents.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-400">No recent searches.</li>
          ) : (
            heroRecents.map((term) => (
              <li key={term} className="flex items-center group">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); selectRecentSearch(term); }} className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer text-left text-slate-900 min-w-0">
                  <ClockIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-medium truncate text-sm">{term}</span>
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveHeroRecent(term); }} className="p-2 mr-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                  <Icons.X className="w-4 h-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    ) : null
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* 카메라 전용 input — capture="environment"로 OS가 카메라만 실행 */}
      <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
      {/* 사진 보관함 전용 input — capture 없이 갤러리만 열림 */}
      <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* ═══════════════════════════════════════════════════ */}
      {/* ─── MOBILE: 스카이스캐너 스타일 컴팩트 폼 ─── */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* 검색 폼 — 화이트 배경, 라운드 카드 */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-visible relative z-50">
          {/* Market Tabs — 폼 상단에 통합 */}
          <div className="flex bg-slate-100 rounded-t-2xl p-1">
            {marketTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMarket(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  market === tab.id
                    ? 'bg-white text-[#02122c] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          {/* Field 1: Deliver to */}
          <div
            ref={mZipRef}
            className={`relative border-b border-slate-200 px-3 py-2.5 transition-colors ${shakeZip ? 'animate-shake bg-red-50' : ''}`}
          >
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                onFocus={() => { setShowZipDropdown(true); setHeroSearchFocused(false); setShowPhotoMenu(false); }}
                placeholder="ZIP code"
                className="flex-1 min-w-0 text-[15px] font-bold text-[#02122c] outline-none border-0 focus:ring-0 bg-transparent placeholder:text-slate-300"
              />
              {zipInfo ? (
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest whitespace-nowrap">{zipInfo.city}, {zipInfo.stateCode}</span>
              ) : isZipInvalid ? (
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Invalid ZIP</span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deliver to</span>
              )}
            </div>
            {showZipDropdown && recentZips.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white rounded-b-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent</div>
                <ul>
                  {recentZips.map(zip => (
                    <li key={zip} className="flex items-center hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                      <button type="button" onClick={() => { setZipcode(zip); setShowZipDropdown(false); }} className="flex-1 text-left px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-slate-400" /> {zip}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveRecentZip(zip); }} className="px-4 py-3 text-slate-400 hover:text-red-500"><Icons.X className="w-4 h-4" /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Field 2: Search — Amazon 스타일 [🔍][input][❌][📷] */}
          <div ref={mSearchRef} className={`relative px-3 py-2 transition-colors ${shakeQuery ? 'animate-shake bg-red-50' : ''}`}>
            {/* 이미지 프리뷰 (선택된 이미지가 있을 때) */}
            {imagePreview && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="relative flex-shrink-0">
                  <img src={imagePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                  <button onClick={clearImage} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm">
                    <Icons.X className="w-2.5 h-2.5" />
                  </button>
                </div>
                <span className="text-[12px] font-bold text-slate-400">Add details or search directly</span>
              </div>
            )}
            <div className="relative flex items-center gap-2">
              {/* 🔍 돋보기 (왼쪽, 진한색) — 탭하면 검색 실행 */}
              <button type="submit" disabled={loading} className="flex-shrink-0 p-0.5">
                {loading ? (
                  <svg className="animate-spin w-5 h-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <Icons.Search className="w-5 h-5" style={{ color: '#02122c' }} />
                )}
              </button>

              {/* Input */}
              <input
                ref={mSearchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleSearchInputFocus}
                onClick={handleSearchInputFocus}
                placeholder={imagePreview ? "Describe this photo..." : "POTAL Search"}
                className="flex-1 min-w-0 text-[15px] font-bold text-[#02122c] outline-none border-0 focus:ring-0 bg-transparent placeholder:text-slate-400"
              />

              {/* ❌ Clear (텍스트/이미지 있을 때만) */}
              {(query.trim() || imagePreview) && (
                <button type="button" onClick={clearQuery} className="p-1 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0">
                  <Icons.X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}

              {/* 🎤 마이크 (음성 검색) — Web Speech API 미지원 시 숨김 */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-0.5 flex-shrink-0 rounded-full transition-colors ${isListening ? 'bg-red-100' : ''}`}
                  aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                >
                  <Icons.Microphone
                    className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`}
                    style={{ color: isListening ? '#ef4444' : '#02122c' }}
                  />
                </button>
              )}

              {/* 📷 카메라 (오른쪽, 진한색) — 메뉴 토글 */}
              <div className="relative flex-shrink-0" ref={mPhotoMenuRef}>
                <button type="button" onClick={handlePhotoBtnClick} className="p-0.5">
                  <Icons.Camera className="w-5 h-5" style={{ color: imagePreview ? '#F59E0B' : '#02122c' }} />
                </button>
                {renderPhotoMenu(true)}
              </div>
            </div>
          </div>
          {/* Recent Searches — 카드 안, mSearchRef 밖에 flow 배치 (클릭+폭 모두 해결) */}
          {heroSearchFocused && !query.trim() && !imagePreview && (
            <div ref={mRecentSearchRef} className="border-t border-slate-100 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Searches</div>
              <ul className="py-1">
                {heroRecents.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-slate-400">No recent searches.</li>
                ) : (
                  heroRecents.map((term) => (
                    <li key={term} className="flex items-center group">
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); selectRecentSearch(term); }} className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer text-left text-slate-900 min-w-0">
                        <ClockIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate text-sm">{term}</span>
                      </button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveHeroRecent(term); }} className="p-2 mr-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                        <Icons.X className="w-4 h-4" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ─── DESKTOP: 기존 가로 배치 (아이콘 배치만 변경) ─── */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-row gap-2 relative z-50">

        {/* Box 1: Deliver to */}
        <div
          ref={dZipRef}
          className={`w-[280px] flex-none bg-white rounded-lg shadow-xl h-[68px] flex flex-col justify-center px-4 relative transition-[box-shadow,border-color] ${shakeZip ? 'animate-shake border-2 border-red-500' : 'border-2 border-transparent'}`}
        >
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: zipInfo ? '#059669' : isZipInvalid ? '#ef4444' : '#6b7280' }}>
            {zipInfo ? `${zipInfo.city}, ${zipInfo.stateCode}` : isZipInvalid ? 'Invalid ZIP code' : 'Deliver to'}
          </label>
          <div className="mt-1 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 flex-shrink-0" style={{ color: zipInfo ? '#059669' : '#94a3b8' }} />
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onFocus={() => { setShowZipDropdown(true); setHeroSearchFocused(false); setShowPhotoMenu(false); }}
              placeholder="Zipcode"
              className="flex-1 min-w-0 text-[16px] font-bold text-slate-900 outline-none border-0 focus:ring-0 bg-transparent placeholder:text-gray-300"
            />
          </div>
          {showZipDropdown && recentZips.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Zipcodes</div>
              <ul>
                {recentZips.map(zip => (
                  <li key={zip} className="flex items-center hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                    <button type="button" onClick={() => { setZipcode(zip); setShowZipDropdown(false); }} className="flex-1 text-left px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-slate-400" /> {zip}
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveRecentZip(zip); }} className="px-4 py-3 text-slate-400 hover:text-red-500"><Icons.X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Box 2: Search Input — [📷][input][❌] */}
        <div
          ref={dSearchRef}
          className={`flex-[3] bg-white rounded-lg shadow-xl min-h-[68px] flex flex-col justify-center px-4 relative transition-[box-shadow,border-color] ${shakeQuery ? 'animate-shake border-2 border-red-500' : 'border-2 border-transparent'} z-30`}
        >
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Search products</label>
          <div className="relative flex items-center gap-2 mt-1">
            {/* 🔍 돋보기 (왼쪽) */}
            <Icons.Search className="w-5 h-5 text-slate-400 flex-shrink-0" />

            {/* 이미지 프리뷰 */}
            {imagePreview && (
              <div className="relative flex-shrink-0 group">
                <img src={imagePreview} alt="preview" className="w-10 h-10 rounded-md object-cover border border-slate-200" />
                <button onClick={clearImage} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icons.X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Input */}
            <input
              ref={dSearchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleSearchInputFocus}
              onClick={handleSearchInputFocus}
              placeholder={imagePreview ? "Describe this photo..." : "e.g. Lego Star Wars, Sony Headphones"}
              className="flex-1 min-w-0 text-[16px] font-bold text-slate-900 outline-none border-0 focus:ring-0 bg-transparent placeholder:text-gray-300"
            />

            {/* ❌ Clear (텍스트 있을 때만) */}
            {(query.trim() || imagePreview) && (
              <button type="button" onClick={clearQuery} className="p-1 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0">
                <Icons.X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}

            {/* 🎤 마이크 (음성 검색) — Web Speech API 미지원 시 숨김 */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1 rounded-full transition-colors flex-shrink-0 ${isListening ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-slate-100'}`}
                aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
              >
                <Icons.Microphone
                  className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`}
                  style={{ color: isListening ? '#ef4444' : '#64748b' }}
                />
              </button>
            )}

            {/* 📷 카메라 (오른쪽) — 메뉴 토글 */}
            <div className="relative flex-shrink-0" ref={dPhotoMenuRef}>
              <button type="button" onClick={handlePhotoBtnClick} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <Icons.Camera className="w-5 h-5" style={{ color: imagePreview ? '#F59E0B' : '#64748b' }} />
              </button>
              {renderPhotoMenu(false)}
            </div>
          </div>

          {/* Recent Searches */}
          {renderRecentSearches(false)}
        </div>

        {/* Search Button (데스크톱만) */}
        <button type="submit" disabled={loading} className="bg-[#F59E0B] rounded-lg shadow-lg flex items-center justify-center text-2xl font-extrabold text-white drop-shadow-md h-[68px] px-10 w-auto hover:bg-amber-600 active:scale-95 cursor-pointer transition-all">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}
