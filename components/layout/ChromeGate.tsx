'use client';

/**
 * ChromeGate — CW23-S1 Sprint 1 fix
 *
 * 홈페이지(/)에서 기존 전역 <Header />는 HeaderMinimal과 중복되므로 숨기고,
 * <Footer />는 유지, <MobileBottomNav />는 홈이 데스크톱 전용이므로 숨긴다.
 *
 * 비홈 경로에서는 Header / Footer / MobileBottomNav 모두 기존대로 렌더.
 */

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

const HIDE_HEADER_ON = new Set<string>(['/', '/mobile-notice']);
const HIDE_FOOTER_ON = new Set<string>(['/mobile-notice']);
const HIDE_MOBILE_NAV_ON = new Set<string>(['/', '/mobile-notice']);

export function ChromeHeader() {
  const pathname = usePathname() ?? '';
  if (HIDE_HEADER_ON.has(pathname)) return null;
  return <Header />;
}

export function ChromeFooter() {
  const pathname = usePathname() ?? '';
  if (HIDE_FOOTER_ON.has(pathname)) return null;
  return <Footer />;
}

export function ChromeMobileNav() {
  const pathname = usePathname() ?? '';
  if (HIDE_MOBILE_NAV_ON.has(pathname)) return null;
  return <MobileBottomNav />;
}
