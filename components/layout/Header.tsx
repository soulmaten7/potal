"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useSupabase } from '@/app/context/SupabaseProvider'; 
import { useWishlist } from '@/app/context/WishlistContext';
import { LoginModal } from '@/app/components/LoginModal'; 

export function Header() {
  const router = useRouter();
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
      <header className="bg-[#02122c] text-white w-full border-b border-white/5 relative z-[999]">
        <div className="max-w-[1440px] mx-auto px-6 h-[80px] flex items-center justify-between shrink-0">
          
          {/* [수정] 로고에도 cursor-pointer 추가 */}
          <button 
            onClick={resetToHome} 
            className="text-3xl font-extrabold text-white tracking-tight hover:opacity-90 focus:outline-none cursor-pointer"
          >
            POTAL
          </button>

          <div className="flex items-center gap-6 text-white">
            <Link href="/help" className="text-sm font-bold hover:text-slate-200 hidden sm:block cursor-pointer">HELP</Link>
            
            <div className="relative" ref={currencyDropdownRef}>
              {/* [수정] 지구본 아이콘 버튼에 cursor-pointer 추가 */}
              <button 
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex items-center gap-2 hover:text-slate-200 focus:outline-none cursor-pointer"
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
                  <button 
                    onClick={() => handleCurrencyChange('KRW')}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${currency === 'KRW' ? 'text-[#02122c] bg-slate-50' : 'text-slate-500'}`}
                  >
                    <span>🇰🇷 KO (KRW)</span>
                    {currency === 'KRW' && <Icons.Check className="w-4 h-4 text-[#02122c]" />}
                  </button>
                </div>
              )}
            </div>

            <Link href="/wishlist" className="hover:text-slate-200 relative p-1 group cursor-pointer">
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
                  className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-white hover:ring-offset-2 hover:ring-offset-[#02122c] transition-all cursor-pointer"
                >
                  {userInitial}
                </button>
              ) : (
                // [수정] 비로그인 사람 아이콘에 cursor-pointer 추가
                <button 
                  onClick={() => setShowLoginModal(true)} 
                  className="hover:text-slate-200 p-1 cursor-pointer"
                >
                  <Icons.User className="w-6 h-6" />
                </button>
              )}

              {showUserDropdown && session && (
                <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 z-[100]">
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