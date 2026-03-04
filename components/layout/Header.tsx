"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { useI18n } from '@/app/i18n';
import type { LanguageCode } from '@/app/i18n/translations';

const LANGUAGES: { code: string; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ko', label: '한국어', short: 'KO' },
  { code: 'ja', label: '日本語', short: 'JA' },
  { code: 'zh', label: '中文', short: 'ZH' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { supabase, session } = useSupabase();
  const { t, language, setLanguage } = useI18n();

  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    setLanguage(code as LanguageCode);
    setShowLangDropdown(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    router.push('/');
  };

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const userEmail = session?.user?.email;

  // Hide main header on dashboard (dashboard has its own header)
  if (pathname?.startsWith('/dashboard')) return null;

  return (
    <header className="bg-white text-[#02122c] w-full border-b border-slate-200 relative z-[5000] hidden md:block">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-[64px] sm:h-[80px] flex items-center justify-between shrink-0">

        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="hover:opacity-90 focus:outline-none cursor-pointer flex items-center"
        >
          <span className="text-[22px] sm:text-[28px] font-extrabold tracking-tight">
            <span className="text-[#02122c]">P</span>
            <span className="text-[#F59E0B]">O</span>
            <span className="text-[#02122c]">TAL</span>
          </span>
        </button>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-6 text-[#02122c]">
          <Link
            href="/developers"
            className={`text-sm font-bold cursor-pointer transition-colors uppercase ${isActive('/developers') ? 'text-[#F59E0B]' : 'hover:text-[#F59E0B]'}`}
          >
            {t('nav.developers')}
          </Link>
          <Link
            href="/pricing"
            className={`text-sm font-bold cursor-pointer transition-colors uppercase ${isActive('/pricing') ? 'text-[#F59E0B]' : 'hover:text-[#F59E0B]'}`}
          >
            {t('nav.pricing')}
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-bold cursor-pointer transition-colors uppercase ${isActive('/dashboard') ? 'text-[#F59E0B]' : 'hover:text-[#F59E0B]'}`}
          >
            {t('nav.dashboard')}
          </Link>
          <Link
            href="/help"
            className={`text-sm font-bold cursor-pointer transition-colors uppercase ${isActive('/help') ? 'text-[#F59E0B]' : 'hover:text-[#F59E0B]'}`}
          >
            {t('nav.help')}
          </Link>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200" />

          {/* Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1.5 hover:text-[#F59E0B] focus:outline-none cursor-pointer"
            >
              <Icons.Globe className="w-4 h-4" />
              <span className="text-sm font-bold">
                {currentLang.short}
              </span>
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 top-full mt-3 w-44 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden py-1 z-[100]">
                <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('nav.language')}
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${language === lang.code ? 'text-[#02122c] bg-slate-50' : 'text-slate-500'}`}
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && <Icons.Check className="w-4 h-4 text-[#02122c]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth Buttons */}
          {session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-[#02122c] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#0a2540] transition-colors cursor-pointer"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: '#F59E0B', color: '#02122c' }}
                >
                  {userEmail?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden lg:inline max-w-[120px] truncate">
                  {userEmail?.split('@')[0] || 'Account'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-3 w-52 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden py-1 z-[100]">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-400">{userEmail}</div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="block w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-bold text-[#02122c] hover:text-[#F59E0B] transition-colors cursor-pointer"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[#F59E0B] text-[#02122c] px-5 py-2 rounded-full text-sm font-bold hover:bg-[#e8930a] transition-colors cursor-pointer"
              >
                {t('nav.signUp')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
