'use client';

import { useEffect } from 'react';

/**
 * 태블릿(768~1366px 터치 기기)에서 viewport를 1440px로 강제 설정
 * Next.js가 페이지 이동 시 <head>를 동적으로 변경해도
 * MutationObserver로 감지해서 viewport를 계속 유지
 */
export function ViewportManager() {
  useEffect(() => {
    const sw = window.screen.width;
    const sh = window.screen.height;
    const minDim = Math.min(sw, sh);
    const isTouch = 'ontouchstart' in window;
    const isTablet = isTouch && minDim >= 768 && minDim <= 1366;

    if (!isTablet) return;

    const TABLET_VIEWPORT = 'width=1440';

    const setTabletViewport = () => {
      let vp = document.querySelector('meta[name="viewport"]');
      if (!vp) {
        vp = document.createElement('meta');
        vp.setAttribute('name', 'viewport');
        document.head.appendChild(vp);
      }
      if (vp.getAttribute('content') !== TABLET_VIEWPORT) {
        vp.setAttribute('content', TABLET_VIEWPORT);
      }
    };

    // 즉시 적용
    setTabletViewport();

    // Next.js가 <head>를 변경할 때마다 다시 적용
    const observer = new MutationObserver(() => {
      setTabletViewport();
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['content'],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
