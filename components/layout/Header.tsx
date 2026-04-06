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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // Close mobile menu on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll lock when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <>
    <header
      className={`text-[#02122c] w-full border-b relative z-[5000] sticky top-0 transition-all duration-200 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-slate-200/50 shadow-sm'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-[64px] sm:h-[80px] flex items-center justify-between shrink-0">

        {/* Logo */}
        <Link
          href="/"
          className="hover:opacity-90 focus:outline-none cursor-pointer flex items-center"
          aria-label="POTAL home"
        >
          <span className="text-[22px] sm:text-[28px] font-extrabold tracking-tight">
            <span className="text-[#02122c]">P</span>
            <span className="text-[#F59E0B]">O</span>
            <span className="text-[#02122c]">TAL</span>
          </span>
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 cursor-pointer focus:outline-none"
          aria-label="Toggle menu"
          aria-expanded={showMobileMenu}
        >
          <span className={`block w-5 h-0.5 bg-[#02122c] transition-all duration-300 ${showMobileMenu ? 'rotate-45 translate-y-[3px]' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#02122c] mt-1 transition-all duration-300 ${showMobileMenu ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#02122c] mt-1 transition-all duration-300 ${showMobileMenu ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6 text-[#02122c]">
          {[
            { href: '/features', label: t('nav.features') },
            { href: '/tools', label: 'Tools' },
            { href: '/developers', label: t('nav.developers') },
            { href: '/pricing', label: t('nav.pricing') },
            { href: '/dashboard', label: t('nav.dashboard') },
            { href: '/community', label: t('nav.community') },
            { href: '/help', label: t('nav.help') },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`relative text-sm font-bold cursor-pointer transition-colors uppercase pb-1 ${isActive(link.href) ? 'text-indigo-600 font-medium' : 'hover:text-[#F59E0B]'}`}
            >
              {link.label}
              {isActive(link.href) && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 rounded-full" aria-hidden="true" />}
            </Link>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200" />

          {/* Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowLangDropdown(false); }}
              className="flex items-center gap-1.5 hover:text-[#F59E0B] focus:outline-none cursor-pointer"
              aria-label="Select language"
              aria-expanded={showLangDropdown}
              aria-haspopup="listbox"
            >
              <Icons.Globe className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-bold">
                {currentLang.short}
              </span>
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden py-1 z-[6000]">
                <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('nav.language')}
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${language === lang.code ? 'text-[#02122c] bg-slate-50' : 'text-slate-600'}`}
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
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
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
                <div role="menu" className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden py-1 z-[6000]">
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
                  <Link
                    href="/developers/docs"
                    onClick={() => setShowUserMenu(false)}
                    className="block w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Docs
                  </Link>
                  <div className="border-t border-slate-100" />
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
        </nav>
      </div>
    </header>

    {/* Mobile Menu Overlay */}
    {showMobileMenu && (
      <div className="fixed inset-0 z-[4999] md:hidden" onClick={() => setShowMobileMenu(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
    )}

    {/* Mobile Slide-in Menu */}
    <div
      className={`fixed top-[64px] right-0 bottom-0 w-72 bg-white z-[5001] md:hidden transition-transform duration-300 ease-out shadow-2xl ${
        showMobileMenu ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <nav className="flex flex-col py-4">
        {[
          { href: '/features', label: t('nav.features') },
          { href: '/tools', label: 'Tools' },
          { href: '/developers', label: t('nav.developers') },
          { href: '/pricing', label: t('nav.pricing') },
          { href: '/dashboard', label: t('nav.dashboard') },
          { href: '/community', label: t('nav.community') },
          { href: '/help', label: t('nav.help') },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-6 py-3 text-base font-bold transition-colors ${
              isActive(link.href) ? 'text-indigo-600 bg-indigo-50' : 'text-[#02122c] hover:bg-slate-50'
            }`}
          >
            {link.label}
          </Link>
        ))}

        <div className="h-px bg-slate-200 mx-6 my-3" />

        {/* Language */}
        <div className="px-6 py-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('nav.language')}</div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  language === lang.code
                    ? 'bg-[#02122c] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lang.short}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-200 mx-6 my-3" />

        {/* Auth */}
        <div className="px-6 py-2">
          {session ? (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold text-slate-400 truncate">{userEmail}</div>
              <button
                onClick={handleSignOut}
                className="w-full text-left py-2.5 text-sm font-bold text-red-500 cursor-pointer"
              >
                {t('nav.signOut')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/auth/login"
                className="block text-center py-2.5 text-sm font-bold text-[#02122c] border border-slate-200 rounded-xl"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                href="/auth/signup"
                className="block text-center py-2.5 text-sm font-bold bg-[#F59E0B] text-[#02122c] rounded-xl"
              >
                {t('nav.signUp')}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
    </>
  );
}
