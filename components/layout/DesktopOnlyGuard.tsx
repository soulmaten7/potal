'use client';

/**
 * DesktopOnlyGuard — CW23 홈페이지 리디자인 Sprint 1
 *
 * 결정 8 (HOMEPAGE_REDESIGN_SPEC.md): 데스크톱 전용, 모바일 미지원
 *   - >= 768px: 데스크톱 레이아웃 렌더
 *   - <  768px: /mobile-notice 로 리다이렉트
 *
 * 태블릿(768~1199px)은 데스크톱으로 취급. iPad + 키보드, Surface Pro는 데스크톱.
 * 반응형 시도하지 말 것 — Spec의 명시적 지침.
 *
 * CW23-S1 SSR fix:
 *   초기 구현은 `!ready` 상태에서 `null`을 반환했고, SSR 결과 홈페이지
 *   HTML 바디가 비어 있어 "프로덕션에 Sprint 1 콘텐츠가 없음" 현상이 발생했다.
 *   이제 서버 렌더는 항상 children을 반환하고, 클라이언트 마운트 시점에
 *   viewport를 검사해 모바일이면 router.replace로 리다이렉트한다.
 *   브라우저 플래시 몇 프레임은 허용 범위로 판단 (모바일 사용자 수=0 가정).
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const DESKTOP_BREAKPOINT = 768;

export function DesktopOnlyGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip the guard itself when already on the mobile notice page
    if (pathname === '/mobile-notice') return;
    if (typeof window === 'undefined') return;

    if (window.innerWidth < DESKTOP_BREAKPOINT) {
      // Preserve the attempted URL so the notice page can offer "email me this link"
      const currentPath =
        window.location.pathname + window.location.search + window.location.hash;
      const encoded = encodeURIComponent(currentPath);
      router.replace(`/mobile-notice?from=${encoded}`);
    }
  }, [router, pathname]);

  // SSR-safe: 서버와 데스크톱 클라이언트 모두 children을 그대로 렌더한다.
  // 모바일 사용자는 위 useEffect에서 즉시 리다이렉트된다.
  return <>{children}</>;
}

export default DesktopOnlyGuard;
