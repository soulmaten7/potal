'use client';

/**
 * ChromeGate — CW23-S1 Sprint 1 fix
 *
 * 홈페이지(/)에서는 기존 전역 <Header /> / <Footer /> / <MobileBottomNav />를
 * 숨기고, 비홈 경로에서만 렌더한다. 홈페이지는 Sprint 1 리디자인 스펙에 따라
 * HeaderMinimal + LiveTicker + ScenarioSelector만 렌더하도록 고정되어 있다.
 *
 * 원인: 기존 app/layout.tsx가 모든 경로에 <Header />를 강제 렌더하고 있었고,
 * app/page.tsx는 HeaderMinimal을 추가로 렌더하여 홈에서 헤더 두 개가
 * 세로로 쌓였다 (406ed90 커밋 당시 놓친 부분).
 *
 * 이 컴포넌트는 client-only이므로 `usePathname()`을 사용해 hydration 시점에
 * 경로를 확인한다. SSR 첫 렌더에서는 null을 반환하지 않고 서버에서 결정된
 * pathname으로 판단하므로 double-render 문제가 발생하지 않는다 (Next.js
 * App Router는 RSC 환경에서 usePathname을 client 컴포넌트에서만 호출하도록
 * 강제하지만, 해당 client 컴포넌트의 초기 SSR도 pathname을 포함하여 실행된다).
 */

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

const HIDDEN_ON_PATHS = new Set<string>([
  '/',
  '/mobile-notice',
]);

function useShouldHide(): boolean {
  const pathname = usePathname();
  return HIDDEN_ON_PATHS.has(pathname ?? '');
}

export function ChromeHeader() {
  if (useShouldHide()) return null;
  return <Header />;
}

export function ChromeFooter() {
  if (useShouldHide()) return null;
  return <Footer />;
}

export function ChromeMobileNav() {
  if (useShouldHide()) return null;
  return <MobileBottomNav />;
}
