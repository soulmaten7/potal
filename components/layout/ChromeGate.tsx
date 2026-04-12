'use client';

/**
 * ChromeGate — CW34 Playground redesign
 *
 * CW23-S1 originally hid the Header on `/` because HomeMinimal had its own.
 * CW34 unified the Header globally (simplified nav: Help + lang + auth only),
 * so now the Header renders on ALL pages including `/` and `/playground/*`.
 *
 * Footer + MobileBottomNav still hidden on `/mobile-notice` and playground.
 */

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

// CW34: Header is shown everywhere (including `/` and `/playground/*`)
const HIDE_HEADER_ON = new Set<string>(['/mobile-notice']);
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
