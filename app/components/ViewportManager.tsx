'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const TABLET_VIEWPORT = 'width=1440';

function isTabletDevice() {
  if (typeof window === 'undefined') return false;
  const minDim = Math.min(window.screen.width, window.screen.height);
  return 'ontouchstart' in window && minDim >= 768 && minDim <= 1366;
}

function ensureTabletViewport() {
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) {
    // 기존 태그 속성만 수정 (DOM 삭제/재생성 안 함)
    if (vp.getAttribute('content') !== TABLET_VIEWPORT) {
      vp.setAttribute('content', TABLET_VIEWPORT);
    }
  }
}

function ViewportManagerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isTabletDevice()) return;

    // requestAnimationFrame으로 다음 프레임에서 실행 (React 렌더 방해 안 함)
    const raf = requestAnimationFrame(() => {
      ensureTabletViewport();
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname, searchParams]);

  return null;
}

export function ViewportManager() {
  return (
    <Suspense fallback={null}>
      <ViewportManagerInner />
    </Suspense>
  );
}
