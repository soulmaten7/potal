'use client';

import { useEffect } from 'react';

const TABLET_VP = 'width=1440';

/**
 * 태블릿에서 viewport=1440 유지
 * - 서버 HTML에 <meta name="viewport"> 포함 (hydration 삭제 방지)
 * - 이 컴포넌트는 hydration 후 즉시 viewport를 1440으로 재설정
 * - MutationObserver로 Next.js가 변경 시 즉시 되돌림
 */
export function ViewportManager() {
  useEffect(() => {
    const minDim = Math.min(window.screen.width, window.screen.height);
    const isTablet = 'ontouchstart' in window && minDim >= 768 && minDim <= 1366;
    if (!isTablet) return;

    // hydration 직후 즉시 적용
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp && vp.getAttribute('content') !== TABLET_VP) {
      vp.setAttribute('content', TABLET_VP);
    }

    // Next.js head 변경 감시
    let skip = false;
    const obs = new MutationObserver(() => {
      if (skip) return;
      const v = document.querySelector('meta[name="viewport"]');
      if (v && v.getAttribute('content') !== TABLET_VP) {
        skip = true;
        v.setAttribute('content', TABLET_VP);
        skip = false;
      }
    });

    obs.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['content'],
    });

    return () => obs.disconnect();
  }, []);

  return null;
}
