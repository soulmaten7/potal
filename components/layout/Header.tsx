"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'ko', label: '한국어', flag: '🇰🇷', short: 'KO' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', short: 'JA', soon: true },
  { code: 'zh', label: '中文', flag: '🇨🇳', short: 'ZH', soon: true },
  { code: 'es', label: 'Español', flag: '🇪🇸', short: 'ES', soon: true },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', short: 'DE', soon: true },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [language, setLanguage] = useState('en');
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('potal_language');
    if (savedLang) setLanguage(savedLang);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    localStorage.setItem('potal_language', code);
    setShowLangDropdown(false);
    // In future: trigger i18n context change
  };

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const resetToHome = () => {
    router.push('/');
  };

  // Check if current path is active
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <header className="bg-white text-[#02122c] w-full border-b border-slate-200 relative z-[5000] hidden md:block">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-[64px] sm:h-[80px] flex items-center justify-between shrink-0">

        {/* Logo */}
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

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-6 text-[#02122c]">
          <Link
            href="/developers"
            className={`text-sm font-bold cursor-pointer transition-colors ${isActive('/developers') ? 'text-[#F59E0B]' : 'hover:text-[#F59E0B]'}`}
          >
            DEVELOPERS
          </Link>
          <Link
            href="/pricing"
            className={`text-sm font-bold cursor-pointer transition-colors ${isActive('/pricing') ? 'text-[#F59E0B]' : 'hover:text-[#F59E0B]'}`}
          >
            PRICING
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-bold cursor-pointer transition-colors ${isActive('/dashboard') ? 'text-[#F59E0B]' : 'hover:text-[#F59E0B]'}`}
          >
            DASHBOARD
          </Link>
          <Link
            href="/help"
            className={`text-sm font-bold cursor-pointer transition-colors ${isActive('/help') ? 'text-[#F59E0B]' : 'hover:text-[#F59E0B]'}`}
          >
            HELP
          </Link>

          {/* Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-2 hover:text-[#F59E0B] focus:outline-none cursor-pointer"
            >
              <Icons.Globe className="w-5 h-5" />
              <span className="text-sm font-bold hidden sm:inline">
                {currentLang.flag} {currentLang.short}
              </span>
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 z-[100]">
                <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Language
                </div>
                {LANGUAGES.map((lang) => (
                  lang.soon ? (
                    <div
                      key={lang.code}
                      className="w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between text-slate-300 cursor-not-allowed"
                    >
                      <span>{lang.flag} {lang.label}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Soon</span>
                    </div>
                  ) : (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${language === lang.code ? 'text-[#02122c] bg-slate-50' : 'text-slate-500'}`}
                    >
                      <span>{lang.flag} {lang.label}</span>
                      {language === lang.code && <Icons.Check className="w-4 h-4 text-[#02122c]" />}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
