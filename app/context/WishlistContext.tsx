"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { trackWishlistAdd, trackWishlistRemove } from '../utils/analytics';

// 유연한 데이터 처리를 위해 any 허용 (타입이 섞여있어서 발생한 문제 방지)
type WishlistItem = any;

interface WishlistContextValue {
  wishlist: WishlistItem[];
  count: number;
  addToWishlist: (product: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);
const STORAGE_KEY = "potal_wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  // [핵심 수정] 데이터 로드 완료 여부 확인 (초기화 전 덮어쓰기 방지)
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. 초기 로드 (새로고침 시 데이터 복구)
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load wishlist", e);
    } finally {
      // [핵심] 로드가 끝났음을 표시
      setIsInitialized(true);
    }
  }, []);

  // 2. 저장 (데이터 변경 시 자동 저장)
  useEffect(() => {
    // [핵심] 초기 로드가 안 끝났으면 저장하지 않음 (빈 배열로 덮어쓰는 버그 해결)
    if (!isInitialized) return;

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
      }
    } catch (e) {
      console.error("Failed to save wishlist", e);
    }
  }, [wishlist, isInitialized]);

  // 3. 기능 구현
  const addToWishlist = useCallback((product: WishlistItem) => {
    setWishlist((prev) => {
      // 중복 방지
      if (prev.some((p) => p.id === product.id)) return prev;
      trackWishlistAdd({
        productName: product.title || product.name || '',
        price: parseFloat(String(product.price || '0').replace(/[^0-9.]/g, '')) || 0,
        vendor: product.seller || product.site || 'unknown',
      });
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const item = prev.find((p) => p.id === productId);
      if (item) {
        trackWishlistRemove({
          productName: item.title || item.name || '',
          vendor: item.seller || item.site || 'unknown',
        });
      }
      return prev.filter((p) => p.id !== productId);
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    // 즉시 스토리지도 비움
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.some((p) => p.id === productId),
    [wishlist]
  );

  return (
    <WishlistContext.Provider
      value={{ wishlist, count: wishlist.length, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}