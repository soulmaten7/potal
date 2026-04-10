'use client';

/**
 * DesktopOnlyGuard — CW23 홈페이지 리디자인 Sprint 1
 *
 * 결정 8 (HOMEPAGE_REDESIGN_SPEC.md): 데스크톱 전용, 모바일 미지원
 *   - >= 768px: 데스크톱 레이아웃 렌더
 *   - < 768px: /mobile-notice 로 리다이렉트
 *
 * 태블릿(768~1199px)은 데스크톱으로 취급. iPad + 키보드, Surface Pro는 데스크톱.
 * 반응형 시도하지 말 것 — Spec의 명시적 지침.
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const DESKTOP_BREAKPOINT = 768;

export function DesktopOnlyGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Skip the guard itself when already on the mobile notice page
    if (pathname === '/mobile-notice') {
      setReady(true);
      return;
    }

    const check = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < DESKTOP_BREAKPOINT) {
        // Preserve the attempted URL so the notice page can offer "email me this link"
        const currentPath =
          window.location.pathname + window.location.search + window.location.hash;
        const encoded = encodeURIComponent(currentPath);
        router.replace(`/mobile-notice?from=${encoded}`);
      } else {
        setReady(true);
      }
    };

    check();
  }, [router, pathname]);

  // Render nothing until we've verified screen width client-side to avoid
  // flashing the desktop UI on mobile. SSR will render `null` first; once the
  // effect runs we either redirect or mark ready.
  if (!ready) {
    return null;
  }

  return <>{children}</>;
}

export default DesktopOnlyGuard;
