'use client';

import { useEffect } from 'react';

const TABLET_VIEWPORT = 'width=1440';

function isTabletDevice() {
  if (typeof window === 'undefined') return false;
  const minDim = Math.min(window.screen.width, window.screen.height);
  return 'ontouchstart' in window && minDim >= 768 && minDim <= 1366;
}

function ensureTabletViewport() {
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp && vp.getAttribute('content') !== TABLET_VIEWPORT) {
    vp.setAttribute('content', TABLET_VIEWPORT);
  }
}

/**
 * 태블릿에서 viewport를 1440px로 강제 유지
 * MutationObserver로 Next.js가 viewport를 변경할 때마다 즉시 되돌림
 * DOM 삭제/재생성 없이 setAttribute만 사용 (React 이벤트 안전)
 */
export function ViewportManager() {
  useEffect(() => {
    if (!isTabletDevice()) return;

    // 즉시 적용
    ensureTabletViewport();

    // Next.js가 viewport를 변경할 때마다 즉시 되돌림
    let isFixing = false;
    const observer = new MutationObserver((mutations) => {
      if (isFixing) return; // 자기 자신의 변경은 무시 (무한 루프 방지)

      for (const mutation of mutations) {
        // 기존 viewport의 content 속성이 변경됐을 때
        if (
          mutation.type === 'attributes' &&
          mutation.target instanceof HTMLMetaElement &&
          mutation.target.name === 'viewport' &&
          mutation.target.getAttribute('content') !== TABLET_VIEWPORT
        ) {
          isFixing = true;
          mutation.target.setAttribute('content', TABLET_VIEWPORT);
          isFixing = false;
          return;
        }

        // <head>에 새 요소가 추가됐을 때 (Next.js가 새 viewport meta를 삽입하는 경우)
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          isFixing = true;
          ensureTabletViewport();
          isFixing = false;
        }
      }
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['content'],
    });

    return () => observer.disconnect();
  }, []); // 마운트 시 한 번만 실행, 네비게이션과 무관하게 항상 감시

  return null;
}
