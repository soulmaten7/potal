"use client";

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'potal_wishlist';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // 1. 초기 로드 (마운트 된 후에만 실행하여 렌더링 충돌 방지)
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // JSON은 Set을 직접 저장 못하므로 Array로 변환된 걸 다시 Set으로 복구
        setWishlist(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Failed to load wishlist", error);
    }
  }, []);

  // 2. 위시리스트 저장 헬퍼 (상태 업데이트 + 로컬스토리지 동기화)
  const saveWishlist = (newSet: Set<string>) => {
    try {
      setWishlist(newSet);
      // Set을 Array로 변환하여 저장
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
      
      // 다른 탭이나 컴포넌트 간 동기화를 위해 커스텀 이벤트 발송 (선택사항)
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (error) {
      console.error("Failed to save wishlist", error);
    }
  };

  // 3. 상품 추가
  const addToWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.add(productId);
      // 비동기 상태 업데이트 내에서 사이드 이펙트(저장)를 처리하지 않고
      // 별도 useEffect로 처리하거나, 여기서 로컬스토리지에 직접 씀
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  // 4. 상품 삭제
  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  // 5. 토글 (있으면 삭제, 없으면 추가)
  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  // 6. 확인 유틸리티
  const isWishlisted = useCallback((productId: string) => {
    return wishlist.has(productId);
  }, [wishlist]);

  return {
    wishlist,
    count: wishlist.size,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isWishlisted,
    mounted // UI에서 로딩 상태 처리용
  };
}