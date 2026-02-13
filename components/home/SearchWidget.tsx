"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Icons, MapPinIcon, ClockIcon } from '../icons';

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
  onSearch: () => void;
}

export function SearchWidget({
  query, setQuery, zipcode, setZipcode, loading,
  recentZips, heroRecents, onRemoveRecentZip, onRemoveHeroRecent, onSearch
}: SearchWidgetProps) {
  
  const [showZipDropdown, setShowZipDropdown] = useState(false);
  const [heroSearchFocused, setHeroSearchFocused] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [shakeZip, setShakeZip] = useState(false);
  const [shakeQuery, setShakeQuery] = useState(false);

  const zipRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !showPhotoMenu;
    setShowPhotoMenu(nextState);
    if (nextState) {
      setHeroSearchFocused(false);
    }
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
      onSearch(); 
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowPhotoMenu(false);
      setHeroSearchFocused(false);
      searchInputRef.current?.focus();
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    setImagePreview(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (zipRef.current && !zipRef.current.contains(target)) setShowZipDropdown(false);
      if (searchRef.current && !searchRef.current.contains(target)) setHeroSearchFocused(false);
      if (photoMenuRef.current && !photoMenuRef.current.contains(target)) setShowPhotoMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />

      <div className="flex flex-col md:flex-row gap-2 relative z-50">
        
        {/* Box 1: Deliver to (Zipcode) - [UX Update] Size increased to match Search Page */}
        <div 
          ref={zipRef} 
          className={`flex-1 md:w-[280px] flex-none bg-white rounded-lg shadow-xl h-[68px] flex flex-col justify-center px-4 relative transition-[box-shadow,border-color] ${shakeZip ? 'animate-shake border-2 border-red-500' : 'border-2 border-transparent'}`}
        >
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Deliver to</label>
          <div className="mt-1 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
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

        {/* Box 2: Search Input */}
        <div 
          ref={searchRef}
          className={`flex-[3] bg-white rounded-lg shadow-xl min-h-[68px] flex flex-col justify-center px-4 relative transition-[box-shadow,border-color] ${shakeQuery ? 'animate-shake border-2 border-red-500' : 'border-2 border-transparent'} z-30`}
        >
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Search products</label>
          <div className="relative flex items-center">
            
            {imagePreview && (
              <div className="relative flex-shrink-0 mr-2 mt-1 group">
                <img src={imagePreview} alt="preview" className="w-10 h-10 rounded-md object-cover border border-slate-200" />
                <button onClick={clearImage} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icons.X className="w-3 h-3" />
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
              placeholder={imagePreview ? "Describe this photo..." : "e.g. Lego Star Wars, Sony Headphones"} 
              className="mt-1 text-[16px] font-bold text-slate-900 w-full pr-12 outline-none border-0 focus:ring-0 bg-transparent placeholder:text-gray-300" 
            />
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2" ref={photoMenuRef}>
              <button 
                type="button" 
                onClick={handlePhotoBtnClick}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
              >
                <Icons.Camera className={`w-6 h-6 ${showPhotoMenu || imagePreview ? 'text-[#F59E0B]' : 'text-slate-400'} group-hover:text-[#F59E0B] transition-colors`} />
              </button>

              {showPhotoMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 z-[60] overflow-hidden animate-fadeIn">
                  <button 
                    type="button" 
                    onClick={() => cameraInputRef.current?.click()} 
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <Icons.Camera className="w-4 h-4 text-[#F59E0B]" /> Take Photo
                  </button>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Icons.Box className="w-4 h-4 text-[#F59E0B]" /> Upload Photo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Searches */}
          {heroSearchFocused && !query.trim() && !imagePreview && (
            <div className="absolute left-0 right-0 top-full w-full bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden mt-2 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Searches</div>
              <ul className="py-1">
                {heroRecents.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-slate-500">No recent searches.</li>
                ) : (
                  heroRecents.map((term) => (
                    <li key={term} className="flex items-center group">
                      <button type="button" onClick={() => { setQuery(term); setHeroSearchFocused(false); searchInputRef.current?.focus(); }} className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer text-left text-slate-900 min-w-0">
                        <ClockIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate">{term}</span>
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveHeroRecent(term); }} className="p-2 mr-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"><Icons.X className="w-4 h-4" /></button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading} className="bg-[#F59E0B] rounded-lg shadow-lg flex items-center justify-center text-2xl font-extrabold text-white drop-shadow-md h-[60px] md:h-[68px] px-10 w-full md:w-auto hover:bg-amber-600 active:scale-95 cursor-pointer transition-all">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}