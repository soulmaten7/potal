'use client';

/**
 * HeaderMinimal — CW23 홈페이지 리디자인 Sprint 1
 *
 * 결정 1 (HOMEPAGE_REDESIGN_SPEC.md): 미니멀 2줄 헤더
 *   - 1줄: POTAL 로고 크게 가운데
 *   - 2줄: 좌측 [Community | Help], 우측 [🌐 EN | Log in]
 *
 * 제거: Features / Developers / Pricing / Dashboard / Sign up
 * Sign up은 Log in 안에 통합 (로그인 화면에 "처음이세요? 계정 만들기" 링크)
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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

export function HeaderMinimal() {
  const router = useRouter();
  const pathname = usePathname();
  const { supabase, session } = useSupabase();
  const { t, language, setLanguage } = useI18n();

  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on route change
  useEffect(() => {
    setShowLangDropdown(false);
    setShowUserMenu(false);
  }, [pathname]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (langDropdownRef.current && !langDropdownRef.current.contains(target)) {
        setShowLangDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowLangDropdown(false);
        setShowUserMenu(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

  return (
    <header
      className="border-b border-slate-200 bg-white"
      aria-label="Main header"
    >
      {/* Row 1 — POTAL logo large, centered (inside 1440px container) */}
      <div className="w-full max-w-[1440px] mx-auto flex justify-center pt-8 pb-4 px-8">
        <Link href="/" aria-label="POTAL home" className="no-underline">
          <span className="text-[44px] font-extrabold tracking-tight leading-none select-none">
            <span className="text-[#02122c]">P</span>
            <span className="text-[#F59E0B]">O</span>
            <span className="text-[#02122c]">TAL</span>
          </span>
        </Link>
      </div>

      {/* Row 2 — left nav (Community/Help) + right (lang + login), constrained to 1440px */}
      <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between px-8 pb-4">
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-6 text-[14px] font-semibold text-slate-700"
        >
          <Link
            href="/community"
            className="hover:text-[#02122c] transition-colors no-underline"
          >
            {t('nav.community')}
          </Link>
          <Link
            href="/help"
            className="hover:text-[#02122c] transition-colors no-underline"
          >
            {t('nav.help')}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {/* Language dropdown */}
          <div ref={langDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setShowLangDropdown(v => !v)}
              aria-expanded={showLangDropdown}
              aria-haspopup="menu"
              aria-label={t('nav.language')}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-[#02122c] transition-colors"
            >
              <span aria-hidden="true">🌐</span>
              <span>{currentLang.short}</span>
              <span aria-hidden="true" className="text-[10px]">▾</span>
            </button>
            {showLangDropdown && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
              >
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    role="menuitem"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-slate-50 transition-colors ${
                      lang.code === language ? 'bg-slate-50 font-bold' : ''
                    }`}
                  >
                    <span className="inline-block w-6 text-slate-400">
                      {lang.code === language ? '✓' : ''}
                    </span>
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Log in / user menu */}
          {session ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(v => !v)}
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 hover:text-[#02122c] transition-colors"
              >
                <span>{session.user?.email?.split('@')[0] || 'Account'}</span>
                <span aria-hidden="true" className="text-[10px]">▾</span>
              </button>
              {showUserMenu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
                >
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    className="block px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors no-underline"
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                  >
                    {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-[13px] font-bold text-[#02122c] hover:text-[#F59E0B] transition-colors no-underline"
            >
              {t('nav.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default HeaderMinimal;
