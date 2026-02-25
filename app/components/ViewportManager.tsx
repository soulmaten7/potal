'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ViewportManagerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sw = window.screen.width;
    const sh = window.screen.height;
    const minDim = Math.min(sw, sh);
    const isTouch = 'ontouchstart' in window;
    const isTablet = isTouch && minDim >= 768 && minDim <= 1366;

    if (!isTablet) return;

    // 기존 viewport meta 태그 전부 삭제
    document.querySelectorAll('meta[name="viewport"]').forEach(el => el.remove());

    // 새 viewport meta 태그 생성
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=1440';
    document.head.appendChild(meta);
  }, [pathname, searchParams]);

  return null;
}

/**
 * 태블릿(768~1366px 터치 기기)에서 viewport를 1440px로 강제 설정
 * 매 페이지 이동 + 검색 파라미터 변경마다 재적용
 */
export function ViewportManager() {
  return (
    <Suspense fallback={null}>
      <ViewportManagerInner />
    </Suspense>
  );
}
