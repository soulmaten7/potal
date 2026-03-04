"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from './context/SupabaseProvider';
import { useUserPreferences } from './hooks/useUserPreferences';
import { useProductSearch, inferCategoriesFromQuery } from './hooks/useProductSearch';
import type { Product } from './types/product';
import { ProductCard, ProductCardSkeleton, EmptySearchState } from '@/components/search/ProductCard';
import { interleaveDomesticInternational } from './lib/product-utils';

import { HeroVisuals } from '../components/home/HeroVisuals';
// 기존 디자인 위젯 유지
import { SearchWidget } from '../components/home/SearchWidget';
// [NEW] 리팩토링된 스틱키 헤더
import { StickyHeader } from '../components/search/StickyHeader'; 

import { SkeletonCard } from '../components/ui/SkeletonCard';
import { Icons, SearchIcon, ChevronDownIcon, GlobeIcon, FlagIcon, PlaneIcon, ClockIcon } from '../components/icons';

import { 
  CATEGORY_TREE,
  type MainCategory
} from './data';

export type { Product } from './types/product';

// --- CONSTANTS ---
const STORAGE_KEY_USER_RECENTS = 'potal_user_recents';
const STORAGE_KEY_GUEST_RECENTS = 'potal_guest_recents';
const STORAGE_KEY_USER_ZIPS = 'potal_user_zips';
const STORAGE_KEY_GUEST_ZIPS = 'potal_guest_zips';
const STORAGE_KEY_GUEST_EXPIRY = 'potal_guest_expiry';
const MAX_HERO_RECENTS = 5;

function HomeContent() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addCategory } = useUserPreferences();
  const search = useProductSearch();
  
  const {
    query, setQuery, domestic, international, loading, searched, searchError,
    visibleCount, setVisibleCount, loadingMore, isHomeMode, setIsHomeMode, isFallbackMode,
    homeSearchKeyword, recentSearches, showRecentDropdown, setShowRecentDropdown,
    aiFilterOptions, selectedAiFilters, setSelectedAiFilters, aiFiltersLoading,
    sortBy, setSortBy, priceRange, setPriceRange, hasMorePages,
    executeSearch, loadMoreResults, zipcode, setZipcode, market, setMarket,
    tabSummary,
  } = search;

  const handleProductClick = useCallback(
    (product: Product & { keywords?: string[] }) => {
      const keywords = product.keywords && product.keywords.length > 0
        ? product.keywords
        : inferCategoriesFromQuery(product.name);
      keywords.forEach((c) => addCategory(c));
    },
    [addCategory],
  );

  // --- STATE ---
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedSpeeds, setSelectedSpeeds] = useState<string[]>([]);
  const [mainCategory, setMainCategory] = useState<MainCategory>(null);
  const [subCategory, setSubCategory] = useState<string | null>(null);

  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  // 스플래시: 창을 완전히 닫고 다시 열었을 때만 표시 (sessionStorage 기반)
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('potal_splash_shown');
  });
  const [splashOpacity, setSplashOpacity] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [tempPriceRange, setTempPriceRange] = useState(1000);
  const [tempSelectedSites, setTempSelectedSites] = useState<string[]>([]);
  const [tempSelectedSpeeds, setTempSelectedSpeeds] = useState<string[]>([]);
  const [mobileTab, setMobileTab] = useState<'all' | 'domestic' | 'global'>('all');
  const [showTopBtn, setShowTopBtn] = useState(false);
  /** Best/Cheapest/Fastest 정렬 탭 */
  const [activeTab, setActiveTab] = useState<'best' | 'cheapest' | 'fastest'>('best');
  const [showBestTooltip, setShowBestTooltip] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAboutSheet, setShowAboutSheet] = useState(false);
  // showHowItWorksSheet removed — 4-Step guide now on homepage directly

  const [recentZips, setRecentZips] = useState<string[]>([]);
  const [heroRecents, setHeroRecents] = useState<string[]>([]);
  
  const isLoggedIn = !!session;
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recentDropdownRef = useRef<HTMLDivElement>(null);
  
  // Market Dropdown은 이제 홈 위젯에서만 쓰임 (여기선 제거해도 되지만 에러 방지용으로 둠)
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);

  // --- SPLASH SCREEN (sessionStorage 기반, 첫 방문 시만) ---
  useEffect(() => {
    if (!showSplash) return;
    // fade-in
    const fadeInTimer = setTimeout(() => setSplashOpacity(1), 50);
    // fade-out 시작 (1.5초 후)
    const fadeOutTimer = setTimeout(() => setSplashOpacity(0), 1500);
    // 완전 제거 (2초 후)
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('potal_splash_shown', '1');
    }, 2000);
    return () => { clearTimeout(fadeInTimer); clearTimeout(fadeOutTimer); clearTimeout(removeTimer); };
  }, [showSplash]);

  // --- EFFECTS ---
  useEffect(() => {
    setTempPriceRange(priceRange);
    setTempSelectedSites(selectedSites);
    setTempSelectedSpeeds(selectedSpeeds);
  }, [priceRange, selectedSites, selectedSpeeds]);

  useEffect(() => {
    setVisibleCount(16);
  }, [selectedAiFilters, priceRange, selectedSites, selectedSpeeds, setVisibleCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        recentDropdownRef.current &&
        !recentDropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowRecentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowRecentDropdown]);

  useEffect(() => {
      const handleScroll = () => { setShowTopBtn(window.scrollY > 400); };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // --- DATA MANAGEMENT ---
  const checkGuestExpiry = () => {
    if (typeof window === 'undefined') return false;
    const expiry = localStorage.getItem(STORAGE_KEY_GUEST_EXPIRY);
    if (expiry && Date.now() > parseInt(expiry)) {
      localStorage.removeItem(STORAGE_KEY_GUEST_RECENTS);
      localStorage.removeItem(STORAGE_KEY_GUEST_ZIPS);
      localStorage.removeItem(STORAGE_KEY_GUEST_EXPIRY);
      return true;
    }
    return false;
  };

  const updateGuestExpiry = () => {
    if (typeof window === 'undefined') return;
    const oneDay = 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY_GUEST_EXPIRY, (Date.now() + oneDay).toString());
  };

  const loadUserData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    if (!isLoggedIn && checkGuestExpiry()) {
        setHeroRecents([]);
        setRecentZips([]);
        setZipcode('');
        return;
    }

    const recentKey = isLoggedIn ? STORAGE_KEY_USER_RECENTS : STORAGE_KEY_GUEST_RECENTS;
    const zipKey = isLoggedIn ? STORAGE_KEY_USER_ZIPS : STORAGE_KEY_GUEST_ZIPS;
    
    try {
      const rawRecents = localStorage.getItem(recentKey);
      setHeroRecents(rawRecents ? JSON.parse(rawRecents) : []);
      const rawZips = localStorage.getItem(zipKey);
      setRecentZips(rawZips ? JSON.parse(rawZips) : []);
    } catch {
      setHeroRecents([]);
      setRecentZips([]);
    }

    if (isLoggedIn) {
      const primaryZip = localStorage.getItem('potal_zipcode');
      if (primaryZip) {
        setZipcode(primaryZip);
      }
    } else {
      setZipcode('');
    }

  }, [isLoggedIn, setZipcode]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const saveHeroRecent = useCallback((q: string) => {
    if (typeof window === 'undefined' || !q.trim()) return;
    const key = isLoggedIn ? STORAGE_KEY_USER_RECENTS : STORAGE_KEY_GUEST_RECENTS;
    try {
      const raw = localStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = [q.trim(), ...arr.filter((x) => x !== q.trim())].slice(0, MAX_HERO_RECENTS);
      localStorage.setItem(key, JSON.stringify(next));
      setHeroRecents(next);
      if (!isLoggedIn) updateGuestExpiry();
    } catch { }
  }, [isLoggedIn]);

  const saveRecentZip = useCallback((zip: string) => {
      if (typeof window === 'undefined' || !zip.trim()) return;
      const key = isLoggedIn ? STORAGE_KEY_USER_ZIPS : STORAGE_KEY_GUEST_ZIPS;
      try {
          const raw = localStorage.getItem(key);
          const arr: string[] = raw ? JSON.parse(raw) : [];
          const next = [zip.trim(), ...arr.filter(z => z !== zip.trim())].slice(0, 3);
          localStorage.setItem(key, JSON.stringify(next));
          setRecentZips(next);
          if (!isLoggedIn) updateGuestExpiry();
      } catch {}
  }, [isLoggedIn]);

  const removeHeroRecent = useCallback((term: string) => {
    if (typeof window === 'undefined') return;
    const key = isLoggedIn ? STORAGE_KEY_USER_RECENTS : STORAGE_KEY_GUEST_RECENTS;
    try {
      const raw = localStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = arr.filter((x) => x !== term);
      localStorage.setItem(key, JSON.stringify(next));
      setHeroRecents(next);
    } catch { }
  }, [isLoggedIn]);

  const removeRecentZip = useCallback((zip: string) => {
      if (typeof window === 'undefined') return;
      const key = isLoggedIn ? STORAGE_KEY_USER_ZIPS : STORAGE_KEY_GUEST_ZIPS;
      try {
          const raw = localStorage.getItem(key);
          const arr: string[] = raw ? JSON.parse(raw) : [];
          const next = arr.filter(z => z !== zip);
          localStorage.setItem(key, JSON.stringify(next));
          setRecentZips(next);
      } catch {}
  }, [isLoggedIn]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setMobileTab('all');
    await executeSearch(trimmed, mainCategory, subCategory);
  };

  const handleScanMarkets = async (image?: File | null) => {
    const trimmed = query.trim();
    let finalQuery = trimmed;

    // 이미지가 있으면 Vision API로 상품명 추출 후 쿼리에 추가
    if (image) {
      try {
        const formData = new FormData();
        formData.append('image', image);
        if (trimmed) formData.append('userText', trimmed);  // 사용자 텍스트 컨텍스트 전달
        const res = await fetch('/api/search/analyze', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.keywords) {
            finalQuery = trimmed ? `${trimmed} ${data.keywords}` : data.keywords;
            setQuery(finalQuery);
          }
        }
      } catch (err) {
        console.error('[HomeImage] Vision API failed:', err);
        // 이미지 분석 실패해도 텍스트 검색으로 진행
      }
    }

    if (finalQuery) saveHeroRecent(finalQuery);
    saveRecentZip(zipcode.trim());
    const params = new URLSearchParams();
    params.set('q', finalQuery);
    params.set('zipcode', zipcode.trim());
    params.set('market', market);
    router.push(`/search?${params.toString()}`);
  };

  // ... (나머지 헬퍼 함수 생략 - 기존 유지)
  const parsePrice = (price: string | number | undefined): number | null => {
    if (typeof price === 'number') return price;
    if (!price) return null;
    const numeric = parseFloat(String(price).replace(/[^0-9.]/g, ''));
    return Number.isNaN(numeric) ? null : numeric;
  };

  const classifySpeed = (deliveryDays?: string | null): string | null => {
    if (!deliveryDays) return null;
    const text = deliveryDays.toLowerCase();
    const match = text.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      const avg = (min + max) / 2;
      if (avg <= 3) return 'Express (1-3 days)';
      if (avg <= 7) return 'Standard (3-7 days)';
      return 'Economy (7+ days)';
    }
    if (text.includes('1-3')) return 'Express (1-3 days)';
    if (text.includes('3-7')) return 'Standard (3-7 days)';
    if (text.includes('7')) return 'Economy (7+ days)';
    return null;
  };

  /** 배송일 문자열을 숫자로 파싱 (정렬용) */
  const parseDeliveryDays = (deliveryDays?: string | null): number => {
    if (!deliveryDays) return 999;
    const text = deliveryDays.toLowerCase();
    const rangeMatch = text.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (rangeMatch) return (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
    const singleMatch = text.match(/(\d+)/);
    if (singleMatch) return parseInt(singleMatch[1]);
    if (text.includes('next day') || text.includes('overnight')) return 1;
    if (text.includes('same day')) return 0;
    return 999;
  };

  const getAiFilterLabels = (): string[] => {
    const labels: string[] = [];
    for (const [groupName, values] of Object.entries(aiFilterOptions)) {
      if (!Array.isArray(values)) continue; // priceInsight 등 비배열 스킵
      for (const label of values) {
        const id = `ai-${groupName}-${String(label).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        if (selectedAiFilters.has(id)) labels.push(label);
      }
    }
    return labels;
  };

  const applyFilters = (products: Product[]): Product[] =>
    products.filter((p) => {
      const numericPrice = parsePrice(p.price);
      if (priceRange < 1000 && numericPrice !== null && numericPrice > priceRange) return false;
      if (selectedSites.length > 0 && !selectedSites.includes(p.site)) return false;
      if (selectedSpeeds.length > 0) {
        const speedLabel = classifySpeed(p.deliveryDays);
        if (!speedLabel || !selectedSpeeds.includes(speedLabel)) return false;
      }
      const aiLabels = getAiFilterLabels();
      if (aiLabels.length > 0) {
        const searchText = [p.name, p.site, p.shipping, p.deliveryDays, (p as { category?: string }).category, (p as { brand?: string }).brand]
          .filter(Boolean).map((s) => String(s).toLowerCase()).join(' ');
        const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!aiLabels.every((label) => {
          const regex = new RegExp('\\b' + escapeRegex(label) + '\\b', 'i');
          return regex.test(searchText);
        })) return false;
      }
      return true;
    });

  const handleShowMore = async () => {
    if (loadingMore) return;
    const hasMoreInMemory = visibleCount < sortedDomestic.length || visibleCount < sortedInternational.length;
    if (hasMoreInMemory) { setVisibleCount((prev) => prev + 16); return; }
    await loadMoreResults();
  };

  const filteredDomestic = applyFilters(domestic);
  const filteredInternational = applyFilters(international);

  const sortProducts = (products: Product[]): Product[] => {
    const arr = [...products];

    if (activeTab === 'best') {
      // ScoringEngine의 bestScore 사용 (높을수록 좋음) → 내림차순
      arr.sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0));
    } else if (activeTab === 'cheapest') {
      // ScoringEngine의 parsedPrice 사용, 없으면 문자열 파싱 fallback
      arr.sort((a, b) => {
        const pa = a.parsedPrice ?? parsePrice(a.price) ?? Number.POSITIVE_INFINITY;
        const pb = b.parsedPrice ?? parsePrice(b.price) ?? Number.POSITIVE_INFINITY;
        return pa - pb;
      });
    } else if (activeTab === 'fastest') {
      // ScoringEngine의 parsedDeliveryDays 사용, 없으면 문자열 파싱 fallback
      arr.sort((a, b) => {
        const da = a.parsedDeliveryDays ?? parseDeliveryDays(a.deliveryDays);
        const db = b.parsedDeliveryDays ?? parseDeliveryDays(b.deliveryDays);
        return da - db;
      });
    }

    return arr;
  };

  const sortedDomestic = Array.isArray(filteredDomestic) ? sortProducts(filteredDomestic) : [];
  const sortedInternational = Array.isArray(filteredInternational) ? sortProducts(filteredInternational) : [];
  const displayedDomestic = sortedDomestic.slice(0, visibleCount);
  const displayedInternational = sortedInternational.slice(0, visibleCount);

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setTimeout(() => setToastMessage(''), 350);
    }, 2000);
  };

  return (
    <div className="w-full flex flex-col font-sans min-h-full">
      
      {/* Intro Splash — Amazon 스타일: 첫 방문 시만 POTAL 로고 표시 */}
      {showSplash && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white md:hidden"
          style={{ opacity: splashOpacity, transition: 'opacity 0.45s ease-in-out' }}
          aria-hidden="true"
        >
          <img src="/potal-logo.svg" alt="POTAL" style={{ width: '160px', height: 'auto' }} />
        </div>
      )}

      {/* Main Content */}
      <div className="w-full flex-1">
        {!searched ? (
          /* --- HOME MODE --- */
          <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
            <section className="pt-4 pb-6 sm:py-12">
              <div className="max-w-[1440px] mx-auto px-3 sm:px-6">
                {/* 모바일: 검색 폼 먼저 → 슬로건 아래 / 데스크톱: 슬로건 먼저 → 검색 폼 아래 */}

                {/* 데스크톱: 기존 순서 유지 (슬로건 + Feature Cards → SearchWidget) */}
                <div className="hidden md:block">
                  <HeroVisuals />
                  <div className="mt-8">
                    <SearchWidget
                      query={query} setQuery={setQuery} zipcode={zipcode} setZipcode={setZipcode}
                      market={market} setMarket={setMarket} loading={loading}
                      recentZips={recentZips} heroRecents={heroRecents}
                      onRemoveRecentZip={removeRecentZip} onRemoveHeroRecent={removeHeroRecent}
                      onSearch={handleScanMarkets}
                    />
                  </div>
                </div>

                {/* 모바일: 스카이스캐너 스타일 */}
                <div className="md:hidden">
                  <HeroVisuals />
                  <SearchWidget
                    query={query} setQuery={setQuery} zipcode={zipcode} setZipcode={setZipcode}
                    market={market} setMarket={setMarket} loading={loading}
                    recentZips={recentZips} heroRecents={heroRecents}
                    onRemoveRecentZip={removeRecentZip} onRemoveHeroRecent={removeHeroRecent}
                    onSearch={handleScanMarkets}
                  />
                </div>
              </div>
            </section>
            
            {/* ─── 모바일: 4-Step 검색 가이드 ─── */}
            <section className="md:hidden px-4 pt-6 pb-6" style={{ backgroundColor: '#ffffff' }}>
              <h2 className="text-[14px] font-extrabold text-[#02122c] uppercase tracking-widest mb-4 text-center">How to Use POTAL</h2>
              <div className="flex flex-col gap-3">
                {[
                  { step: '1', title: 'Add ZIP Code', desc: 'Enter your ZIP code to calculate exact shipping, tax, and import duties. See the true Total Cost — no hidden fees.' },
                  { step: '2', title: 'Search by Product Name', desc: 'Type "PlayStation 5", "LEGO Star Wars" or any product. POTAL compares Amazon, Walmart, eBay, Target, AliExpress and more.' },
                  { step: '3', title: 'Ask AI a Question', desc: 'Try "best headphones under $100" or "gift for 5 year old boy." AI finds the best matching products for you.' },
                  { step: '4', title: 'Search by Photo', desc: 'Snap or upload a photo, then add a question or description. AI analyzes both image and text to find the best match.' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
                      <span className="text-[13px] font-extrabold text-white">{item.step}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-extrabold text-[#000000] leading-snug">{item.title}</p>
                      <p className="text-[13px] text-slate-600 mt-1 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── 데스크톱: Why POTAL 가치 제안 + FAQ ─── */}
            <section className="hidden md:block bg-white text-slate-700 py-16 pb-24">
                <div className="max-w-[1440px] mx-auto px-3 sm:px-6">
                    <h2 className="text-3xl font-extrabold text-[#02122c] mb-2">Why POTAL?</h2>
                    <p className="text-slate-500 mb-10 text-[15px] max-w-xl">The only shopping comparison that shows the true final price — across domestic and global retailers.</p>
                    <div className="grid grid-cols-3 gap-6 mb-14">
                      {[
                        { icon: '💰', title: 'True Total Cost', desc: 'Product price + shipping + sales tax + import duties — all calculated automatically based on your ZIP code. No hidden fees, no surprises at checkout.' },
                        { icon: '🔄', title: 'Real-Time Membership Pricing', desc: 'Toggle Amazon Prime, Walmart+, AliExpress Choice, Target Circle 360, and more. See member vs non-member pricing instantly.' },
                        { icon: '🛍️', title: 'Buy Direct — No Middleman', desc: 'POTAL is a search engine, not a store. Click any deal and go straight to the retailer. You pay the same price as shopping directly.' },
                      ].map((item, idx) => (
                        <div key={idx} className="relative bg-[#f8f9fc] border border-slate-200 rounded-2xl p-7 hover:shadow-lg hover:border-[#F59E0B]/40 transition-all duration-300 group">
                          <span className="text-[48px] leading-none mb-4 block group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                          <h3 className="text-lg font-extrabold text-[#02122c] mb-2">{item.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="max-w-[1440px] mx-auto">
                      <h3 className="text-xl font-extrabold text-[#02122c] mb-5 text-center">Frequently Asked Questions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            q: 'Is POTAL free to use?',
                            a: 'Yes, completely free. POTAL earns a small commission from retailers when you make a purchase — you never pay extra.',
                          },
                          {
                            q: 'Do I buy products from POTAL?',
                            a: "No. POTAL is a search engine, not a store. When you click 'View Deal', you go directly to the retailer's website (Amazon, Walmart, etc.) to complete your purchase.",
                          },
                          {
                            q: 'What is Total Landed Cost?',
                            a: 'It\'s the true final price you pay: product price + shipping + estimated sales tax (domestic) or import duties (global). No hidden surprises.',
                          },
                          {
                            q: 'How do membership toggles work?',
                            a: 'POTAL supports Amazon Prime, Walmart+, AliExpress Choice, Target Circle 360, and Best Buy Plus. Toggles are ON by default to reflect member benefits. Toggle OFF any membership you don\'t have to see non-member pricing.',
                          },
                          {
                            q: 'How is shipping cost calculated?',
                            a: 'Shipping varies by retailer and membership. Amazon Prime and Walmart+ members get free shipping, while non-members pay ~$5.99 for orders under $35. Global retailers like AliExpress Choice offer free or low-cost shipping. POTAL factors these automatically.',
                          },
                          {
                            q: 'What about sales tax and import duties?',
                            a: 'For US domestic purchases, sales tax is estimated by state (e.g., ~8.75% in CA, 0% in OR). For global purchases, items from China carry ~20% duty (de minimis eliminated Aug 2025), while Korea, Japan, EU, and UK remain duty-free under $800. POTAL estimates all of this automatically.',
                          },
                        ].map((item, idx) => (
                          <details key={idx} className="group border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none bg-white group-open:bg-slate-50 transition-colors">
                              <span className="text-[15px] font-bold text-[#02122c]">{item.q}</span>
                              <Icons.ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4" />
                            </summary>
                            <div className="px-5 pb-4 pt-1 text-sm text-slate-600 leading-relaxed bg-white">{item.a}</div>
                          </details>
                        ))}
                      </div>
                    </div>
                </div>
            </section>

            {/* ─── 모바일: FAQ ─── */}
            <section className="md:hidden py-6 pb-24" style={{ backgroundColor: '#ffffff' }}>
              <div className="px-3">
                <h3 className="text-[15px] font-bold text-slate-500 mb-3 uppercase tracking-widest text-center">FAQ</h3>
                {[
                  { q: 'Is POTAL free to use?', a: 'Yes, completely free. We earn a small commission from retailers — you never pay extra.' },
                  { q: 'Do I buy products from POTAL?', a: "No. POTAL is a search engine. You buy directly from the retailer's website." },
                  { q: 'What is Total Landed Cost?', a: 'The true final price: product + shipping + tax/duties. No hidden surprises.' },
                  { q: 'How do membership toggles work?', a: 'Amazon Prime, Walmart+, AliExpress Choice and more. Toggles are ON by default. Turn OFF any you don\'t have to see non-member pricing.' },
                  { q: 'What about tax and import duties?', a: 'US sales tax is estimated by state. Global imports from China carry ~20% duty. Korea, Japan, EU, UK are duty-free under $800. POTAL calculates all of this.' },
                ].map((item, idx) => (
                  <details key={idx} className="group mb-2 bg-slate-100 backdrop-blur-sm rounded-xl overflow-hidden transition-colors border border-slate-200">
                    <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none group-open:bg-slate-200 transition-colors">
                      <span className="text-[13px] font-bold text-[#02122c]">{item.q}</span>
                      <Icons.ChevronDown className="w-3.5 h-3.5 text-[#F59E0B] group-open:rotate-180 transition-transform duration-200 shrink-0 ml-3" />
                    </summary>
                    <div className="px-4 pb-3 pt-1 text-sm text-slate-600 leading-relaxed">{item.a}</div>
                  </details>
                ))}
              </div>
            </section>

            {/* ─── 모바일: About 바텀시트 (간소화) ─── */}
            {showAboutSheet && (
              <div className="fixed inset-0 z-[9999] md:hidden">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAboutSheet(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
                  <div className="sticky top-0 bg-white z-10 px-5 pt-4 pb-2 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#02122c]">About POTAL</h2>
                    <button onClick={() => setShowAboutSheet(false)} className="p-1"><Icons.X className="w-5 h-5 text-slate-500" /></button>
                  </div>
                  <div className="px-5 py-5 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      POTAL is an AI-powered shopping comparison engine. Search across Amazon, Walmart, eBay, Target, AliExpress and more — domestic and global retailers in one search. We show the true Total Cost including shipping, tax, and import duties so you can find the real best deal.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      POTAL is free to use. We earn a small commission from retailers when you make a purchase — you never pay extra. When you tap a deal, you go directly to the retailer&apos;s website to buy.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* --- SEARCH RESULTS VIEW --- */
          <div className="bg-slate-50 min-h-screen">
            {/* [NEW] Sticky Header Area: 기존의 복잡한 div 구조를 단순화하고 StickyHeader가 알아서 1440px을 맞추도록 함 */}
            <StickyHeader 
                query={query}
                setQuery={setQuery}
                zipcode={zipcode}
                setZipcode={setZipcode}
                recentZips={recentZips}
                onRemoveRecentZip={removeRecentZip}
                heroRecents={heroRecents}
                onRemoveHeroRecent={removeHeroRecent}
                onSearch={handleSearch}
                loading={loading}
            />

            <div className="bg-white md:rounded-2xl md:shadow-sm md:border border-gray-200 px-0 sm:px-6 py-0 md:py-6 sm:py-8 overflow-visible max-w-[1440px] mx-auto my-8 mt-0 border-t-0 rounded-t-none">
                {/* ── Best / Cheapest / Fastest Sort Tabs ── */}
                <div className="px-4 sm:px-0 pt-4 pb-2">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-slate-600">
                      <strong className="text-[#02122c]">{sortedDomestic.length + sortedInternational.length}</strong> results sorted by <strong className="text-[#02122c]">{activeTab === 'best' ? 'Best' : activeTab === 'cheapest' ? 'Cheapest' : 'Fastest'}</strong>
                    </span>
                    {/* 모바일 필터 버튼 */}
                    <button
                      onClick={() => setShowMobileFilters(true)}
                      className="lg:hidden ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#02122c] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Icons.Filter className="w-3.5 h-3.5" />
                      Filters
                      {(selectedSites.length > 0 || selectedSpeeds.length > 0 || priceRange < 1000) && (
                        <span className="w-4 h-4 rounded-full bg-[#F59E0B] text-white text-[10px] font-bold flex items-center justify-center">
                          {selectedSites.length + selectedSpeeds.length + (priceRange < 1000 ? 1 : 0)}
                        </span>
                      )}
                    </button>
                    {/* "What is Best?" tooltip */}
                    <div className="relative">
                      <button onClick={() => setShowBestTooltip(!showBestTooltip)} className="focus:outline-none">
                        <Icons.Info className="w-4 h-4 text-[#F59E0B] cursor-pointer hover:text-amber-600 transition-colors" />
                      </button>
                      {showBestTooltip && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 bg-white shadow-2xl p-5 rounded-xl text-xs text-slate-600 border border-slate-200 z-50">
                          <div className="flex justify-between items-start mb-3">
                            <strong className="text-[#02122c] text-sm">What is &quot;Best&quot;?</strong>
                            <button onClick={() => setShowBestTooltip(false)}>
                              <Icons.X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="leading-relaxed mb-2">Best Score is a weighted analysis of multiple factors:</p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between"><span className="font-bold text-[#02122c]">Total Landed Cost</span><span className="text-slate-400">35%</span></div>
                            <div className="flex justify-between"><span className="font-bold text-[#02122c]">Delivery Speed</span><span className="text-slate-400">25%</span></div>
                            <div className="flex justify-between"><span className="font-bold text-[#02122c]">Seller Trust</span><span className="text-slate-400">20%</span></div>
                            <div className="flex justify-between"><span className="font-bold text-[#02122c]">Match Accuracy</span><span className="text-slate-400">15%</span></div>
                            <div className="flex justify-between"><span className="font-bold text-[#02122c]">Return Policy</span><span className="text-slate-400">5%</span></div>
                          </div>
                          <p className="leading-relaxed mt-2 text-slate-400">Higher score = better overall value.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sort Tab Bar */}
                  <div className="bg-white rounded-lg border border-slate-200 flex shadow-sm h-[56px] overflow-hidden">
                    {([
                      { id: 'best' as const, label: 'Best', val: tabSummary?.best ? `${tabSummary.best.price} · ${tabSummary.best.days}` : '—' },
                      { id: 'cheapest' as const, label: 'Cheapest', val: tabSummary?.cheapest ? `${tabSummary.cheapest.price} · ${tabSummary.cheapest.days}` : '—' },
                      { id: 'fastest' as const, label: 'Fastest', val: tabSummary?.fastest ? `${tabSummary.fastest.price} · ${tabSummary.fastest.days}` : '—' },
                    ]).map((tab, idx) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-4 flex flex-col justify-center border-r border-slate-100 last:border-r-0 hover:bg-slate-50 transition-colors relative ${
                          activeTab === tab.id ? 'bg-[#f8fbff]' : ''
                        } ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === 2 ? 'rounded-r-lg' : ''}`}
                      >
                        {activeTab === tab.id && <div className="absolute top-0 left-0 w-full h-[3px] bg-[#02122c]" />}
                        <span className={`text-[13px] font-extrabold mb-0.5 ${activeTab === tab.id ? 'text-[#02122c]' : 'text-slate-500'}`}>{tab.label}</span>
                        <span className={`text-[12px] font-bold ${activeTab === tab.id ? 'text-[#02122c]' : 'text-slate-400'}`}>{tab.val}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mega Menu Button Area (Hidden on mobile usually, keeping logic) */}
                <div className="hidden md:block mb-4">
                     {/* ... (Mega Menu Logic - 기존 유지하되 위치가 StickyHeader 밑으로 옴) ... */}
                </div>

                <div className={searched ? (isHomeMode ? 'relative z-[1000] overflow-visible' : 'relative z-[1000] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-4 lg:items-start overflow-visible') : ''}>
                    {/* Sidebar & Results Grid (기존 로직 유지) */}
                    {searched && !isHomeMode && (
                        <div className="hidden lg:block w-64 flex-shrink-0 overflow-visible min-w-0 relative z-[1000]">
                            <aside className="w-64 flex-shrink-0 overflow-visible">
                                <div className="sticky top-24 space-y-3 text-sm overflow-visible">
                                    {/* ── Price Filter ── */}
                                    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-4">
                                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Max Price</h3>
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="range"
                                          min={10}
                                          max={1000}
                                          step={10}
                                          value={tempPriceRange}
                                          onChange={(e) => setTempPriceRange(Number(e.target.value))}
                                          className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#02122c]"
                                        />
                                        <span className="text-sm font-bold text-[#02122c] min-w-[60px] text-right">
                                          {tempPriceRange >= 1000 ? 'Any' : `$${tempPriceRange}`}
                                        </span>
                                      </div>
                                    </div>

                                    {/* ── Platform Filter ── */}
                                    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-4">
                                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Platform</h3>
                                      <div className="space-y-2">
                                        {['Amazon', 'AliExpress', 'Temu', 'Shein'].map((site) => {
                                          const isSelected = tempSelectedSites.includes(site);
                                          return (
                                            <label key={site} className="flex items-center gap-2 cursor-pointer group">
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                  setTempSelectedSites((prev) =>
                                                    isSelected ? prev.filter((s) => s !== site) : [...prev, site]
                                                  );
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-[#02122c] focus:ring-[#02122c] accent-[#02122c]"
                                              />
                                              <span className="text-sm text-slate-700 group-hover:text-[#02122c] font-medium">{site}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* ── Delivery Speed Filter ── */}
                                    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-4">
                                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Delivery Speed</h3>
                                      <div className="space-y-2">
                                        {['Express (1-3 days)', 'Standard (3-7 days)', 'Economy (7+ days)'].map((speed) => {
                                          const isSelected = tempSelectedSpeeds.includes(speed);
                                          return (
                                            <label key={speed} className="flex items-center gap-2 cursor-pointer group">
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                  setTempSelectedSpeeds((prev) =>
                                                    isSelected ? prev.filter((s) => s !== speed) : [...prev, speed]
                                                  );
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-[#02122c] focus:ring-[#02122c] accent-[#02122c]"
                                              />
                                              <span className="text-sm text-slate-700 group-hover:text-[#02122c] font-medium">{speed}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* ── Apply / Reset ── */}
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => { setPriceRange(tempPriceRange); setSelectedSites(tempSelectedSites); setSelectedSpeeds(tempSelectedSpeeds); }}
                                        className="flex-1 rounded-lg bg-[#02122c] text-white text-xs font-bold py-2.5 hover:bg-[#F59E0B] transition-colors"
                                      >
                                        Apply Filters
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTempPriceRange(1000);
                                          setTempSelectedSites([]);
                                          setTempSelectedSpeeds([]);
                                          setPriceRange(1000);
                                          setSelectedSites([]);
                                          setSelectedSpeeds([]);
                                        }}
                                        className="rounded-lg border border-slate-300 text-slate-600 text-xs font-bold px-3 py-2.5 hover:bg-slate-100 transition-colors"
                                      >
                                        Reset
                                      </button>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}
                    
                    <div className="min-w-0 overflow-visible">
                        {/* Loading Skeleton */}
                        {loading && searched && (
                          <div className="relative z-0 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-4">
                            <section className="flex flex-col min-w-0 w-full">
                              <div className="w-full border-b border-slate-200 bg-white flex-shrink-0 box-border sticky top-20 z-[40]">
                                <div className="flex items-center gap-2 w-full px-4 pt-3 pb-1 min-w-0 box-border"><span className="text-xl flex-shrink-0">🇺🇸</span><h2 className="text-lg font-bold text-slate-800">Domestic (Fast)</h2></div>
                              </div>
                              <div className="px-4 py-3 w-full min-w-0 box-border">
                                <div className="grid grid-cols-1 gap-3 w-full">
                                  {[1, 2, 3].map(i => <div key={i} className="min-w-0 w-full"><ProductCardSkeleton /></div>)}
                                </div>
                              </div>
                            </section>
                            <section className="flex flex-col min-w-0 w-full">
                              <div className="w-full border-b border-slate-200 bg-white flex-shrink-0 box-border sticky top-20 z-[40]">
                                <div className="flex items-center gap-2 w-full px-4 pt-3 pb-1 min-w-0 box-border"><span className="text-xl flex-shrink-0">🌏</span><h2 className="text-lg font-bold text-slate-800">Global (Cheap)</h2></div>
                              </div>
                              <div className="px-4 py-3 w-full min-w-0 box-border">
                                <div className="grid grid-cols-1 gap-3 w-full">
                                  {[1, 2, 3].map(i => <div key={i} className="min-w-0 w-full"><ProductCardSkeleton /></div>)}
                                </div>
                              </div>
                            </section>
                          </div>
                        )}
                        {/* Results Grid Display */}
                        {searched && !loading && (
                            <>
                                {/* 서버 에러 배너 */}
                                {searchError && (
                                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50/90 px-4 py-4 flex items-start gap-3">
                                    <span className="shrink-0 text-2xl" aria-hidden>⚠️</span>
                                    <div>
                                      <p className="font-semibold text-red-800">{searchError}</p>
                                      <button
                                        onClick={() => executeSearch(query, null, null)}
                                        className="mt-2 text-sm font-bold text-red-700 underline hover:text-red-900"
                                      >
                                        Retry Search
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {isFallbackMode && (
                                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                                    <span className="shrink-0 text-2xl" aria-hidden>💡</span>
                                    <div><p className="font-semibold text-slate-800">No results found for &quot;{query}&quot;.</p></div>
                                  </div>
                                )}
                                {/* 결과가 0개일 때 EmptyState */}
                                {!isFallbackMode && sortedDomestic.length === 0 && sortedInternational.length === 0 && (
                                  <EmptySearchState query={query} onRetry={() => { search.setQuery(''); router.push('/'); }} />
                                )}
                                <div className="relative z-0 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-4">
                                    <section className="flex flex-col min-w-0 w-full">
                                        <div className="w-full border-b border-slate-200 bg-white flex-shrink-0 box-border sticky top-20 z-[40]">
                                            <div className="flex items-center gap-2 w-full px-4 pt-3 pb-1 min-w-0 box-border"><span className="text-xl flex-shrink-0">🇺🇸</span><h2 className="text-lg font-bold text-slate-800">Domestic (Fast)</h2></div>
                                        </div>
                                        <div className="px-4 py-3 w-full min-w-0 box-border">
                                            <div className="grid grid-cols-1 gap-3 w-full">
                                                {displayedDomestic.map((item, index) => (
                                                    <div key={`${item.id}-${index}`} className="min-w-0 w-full">
                                                        <ProductCard product={item} type="domestic" onWishlistChange={(added) => showToastMessage(added ? "Saved" : "Removed")} onProductClick={handleProductClick} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                    <section className="flex flex-col min-w-0 w-full">
                                        <div className="w-full border-b border-slate-200 bg-white flex-shrink-0 box-border sticky top-20 z-[40]">
                                            <div className="flex items-center gap-2 w-full px-4 pt-3 pb-1 min-w-0 box-border"><span className="text-xl flex-shrink-0">🌏</span><h2 className="text-lg font-bold text-slate-800">Global (Cheap)</h2></div>
                                        </div>
                                        <div className="px-4 py-3 w-full min-w-0 box-border">
                                            <div className="grid grid-cols-1 gap-3 w-full">
                                                {displayedInternational.map((item, index) => (
                                                    <div key={`${item.id}-${index}`} className="min-w-0 w-full">
                                                        <ProductCard product={item} type="international" onWishlistChange={(added) => showToastMessage(added ? "Saved" : "Removed")} onProductClick={handleProductClick} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
      
      {/* ── Mobile Filter Bottom Sheet ── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[75vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white z-10 px-5 pt-4 pb-2 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#02122c]">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-1">
                <Icons.X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-5">
              {/* Price */}
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Max Price</h3>
                <div className="flex items-center gap-3">
                  <input type="range" min={10} max={1000} step={10} value={tempPriceRange}
                    onChange={(e) => setTempPriceRange(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#02122c]"
                  />
                  <span className="text-sm font-bold text-[#02122c] min-w-[60px] text-right">
                    {tempPriceRange >= 1000 ? 'Any' : `$${tempPriceRange}`}
                  </span>
                </div>
              </div>
              {/* Platform */}
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Platform</h3>
                <div className="flex flex-wrap gap-2">
                  {['Amazon', 'AliExpress', 'Temu', 'Shein'].map((site) => {
                    const sel = tempSelectedSites.includes(site);
                    return (
                      <button key={site} onClick={() => setTempSelectedSites(prev => sel ? prev.filter(s => s !== site) : [...prev, site])}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${sel ? 'bg-[#02122c] text-white border-[#02122c]' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}
                      >
                        {site}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Speed */}
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Delivery Speed</h3>
                <div className="flex flex-wrap gap-2">
                  {['Express (1-3 days)', 'Standard (3-7 days)', 'Economy (7+ days)'].map((speed) => {
                    const sel = tempSelectedSpeeds.includes(speed);
                    return (
                      <button key={speed} onClick={() => setTempSelectedSpeeds(prev => sel ? prev.filter(s => s !== speed) : [...prev, speed])}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${sel ? 'bg-[#02122c] text-white border-[#02122c]' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}
                      >
                        {speed}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Bottom actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex gap-3">
              <button onClick={() => {
                setTempPriceRange(1000); setTempSelectedSites([]); setTempSelectedSpeeds([]);
                setPriceRange(1000); setSelectedSites([]); setSelectedSpeeds([]);
                setShowMobileFilters(false);
              }} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors">
                Reset
              </button>
              <button onClick={() => {
                setPriceRange(tempPriceRange); setSelectedSites(tempSelectedSites); setSelectedSpeeds(tempSelectedSpeeds);
                setShowMobileFilters(false);
              }} className="flex-1 py-3 rounded-xl bg-[#02122c] text-white text-sm font-bold hover:bg-[#F59E0B] transition-colors">
                Apply ({tempSelectedSites.length + tempSelectedSpeeds.length + (tempPriceRange < 1000 ? 1 : 0)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button 
        onClick={scrollToTop} 
        className={`fixed bottom-8 right-8 w-12 h-12 bg-[#02122c] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#F59E0B] transition-all duration-300 z-[999] ${showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <Icons.ArrowUp className="w-6 h-6" />
      </button>

      {/* Global Styles */}
      <style jsx global>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #02122c; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); margin-top: -6px; }
        input[type=range]::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div>Loading...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}