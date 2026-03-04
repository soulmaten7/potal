"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { useWishlist } from '@/app/context/WishlistContext';
import { LoginModal } from '@/components/auth/LoginModal';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isSearchPage = pathname?.startsWith('/search');
  const { wishlist } = useWishlist(); 
  const { supabase, session } = useSupabase(); 
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false); 
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currency, setCurrency] = useState('USD'); 

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('user_currency');
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCurrencyChange = (curr: 'USD' | 'KRW') => {
    setCurrency(curr);
    localStorage.setItem('user_currency', curr);
    setShowCurrencyDropdown(false);
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowUserDropdown(false);
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const resetToHome = () => {
    router.push('/');
  };

  const userInitial = session?.user?.email?.[0]?.toUpperCase() || 'U';
  const userEmail = session?.user?.email || 'user@potal.com';

  return (
    <>
      {/* 모바일 검색 페이지에서는 헤더 숨김 — StickyHeader가 대신 역할 */}
      {/* 모바일: 항상 헤더 숨김 (로고 불필요, 바텀탭이 네비 역할) / 데스크톱: 항상 표시 */}
      <header className="bg-white text-[#02122c] w-full border-b border-slate-200 relative z-[5000] hidden md:block">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-[64px] sm:h-[80px] flex items-center justify-between shrink-0">
          
          {/* 로고: P + 오렌지O + TAL */}
          <button
            onClick={resetToHome}
            className="hover:opacity-90 focus:outline-none cursor-pointer flex items-center"
          >
            <span className="text-[22px] sm:text-[28px] font-extrabold tracking-tight">
              <span className="text-[#02122c]">P</span>
              <span className="text-[#F59E0B]">O</span>
              <span className="text-[#02122c]">TAL</span>
            </span>
          </button>

          {/* 데스크톱: 풀 네비게이션 / 모바일: 로고만 (하단 탭바가 대체) */}
          <div className="hidden md:flex items-center gap-6 text-[#02122c]">
            <Link href="/developers" className="text-sm font-bold hover:text-[#F59E0B] cursor-pointer">DEVELOPERS</Link>
            <Link href="/pricing" className="text-sm font-bold hover:text-[#F59E0B] cursor-pointer">PRICING</Link>
            <Link href="/dashboard" className="text-sm font-bold hover:text-[#F59E0B] cursor-pointer">DASHBOARD</Link>
            <Link href="/help" className="text-sm font-bold hover:text-[#F59E0B] cursor-pointer">HELP</Link>
            
            <div className="relative" ref={currencyDropdownRef}>
              {/* [수정] 지구본 아이콘 버튼에 cursor-pointer 추가 */}
              <button 
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex items-center gap-2 hover:text-[#F59E0B] focus:outline-none cursor-pointer"
              >
                <Icons.Globe className="w-5 h-5" />
                <span className="text-sm font-bold hidden sm:inline">
                  {currency === 'USD' ? 'EN (USD)' : 'KO (KRW)'}
                </span>
              </button>

              {showCurrencyDropdown && (
                <div className="absolute right-0 top-full mt-3 w-40 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 z-[100]">
                  <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                     Select Currency
                   </div>
                  <button 
                    onClick={() => handleCurrencyChange('USD')}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${currency === 'USD' ? 'text-[#02122c] bg-slate-50' : 'text-slate-500'}`}
                  >
                    <span>🇺🇸 EN (USD)</span>
                    {currency === 'USD' && <Icons.Check className="w-4 h-4 text-[#02122c]" />}
                  </button>
                  <div className="w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between text-slate-300 cursor-not-allowed">
                    <span>🇰🇷 KO (KRW)</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Soon</span>
                  </div>
                </div>
              )}
            </div>

            <Link href="/wishlist" className="hover:text-[#F59E0B] relative p-1 group cursor-pointer">
              <Icons.Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center animate-in zoom-in">
                  {wishlist.length > 99 ? "99+" : wishlist.length}
                </span>
              )}
            </Link>

            <div className="relative" ref={userDropdownRef}>
              {session ? (
                // [수정] 로그인 된 프로필 아이콘에 cursor-pointer 추가
                <button 
                  onClick={() => setShowUserDropdown(!showUserDropdown)} 
                  className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-slate-200 hover:ring-offset-2 hover:ring-offset-white transition-all cursor-pointer"
                >
                  {userInitial}
                </button>
              ) : (
                // [수정] 비로그인 사람 아이콘에 cursor-pointer 추가
                <button 
                  onClick={() => setShowLoginModal(true)} 
                  className="hover:text-[#F59E0B] p-1 cursor-pointer"
                >
                  <Icons.User className="w-6 h-6" />
                </button>
              )}

              {showUserDropdown && session && (
                <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 z-[9999]">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-bold text-[#02122c] truncate" title={userEmail}>
                      {userEmail}
                    </p>
                  </div>
                  
                  <Link 
                    href="/account" 
                    onClick={() => setShowUserDropdown(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#02122c] transition-colors cursor-pointer"
                  >
                    My Account
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onSuccess={() => {
           setShowLoginModal(false);
        }} 
      />
    </>
  );
}