"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWishlist } from "../context/WishlistContext";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../types/product";

const WISHLIST_STORAGE_KEY = "potal_wishlist";

function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function SavedPage() {
  const router = useRouter();
  const { wishlist, clearWishlist } = useWishlist();
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedItems = (wishlist || []) as Product[];

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const handleClearClick = () => {
    if (confirmClear) {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(WISHLIST_STORAGE_KEY, "[]");
      }
      clearWishlist();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmClear(false);
        confirmTimerRef.current = null;
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed 헤더: 강제 최상위, 터치 보장 (오버레이 없음) */}
      <header className="fixed top-0 left-0 right-0 h-16 z-[9999] bg-white border-b border-gray-200 px-4 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="text-indigo-600">Saved Items</span>
          <span className="text-slate-500 font-normal">({savedItems.length})</span>
        </h1>

        <div className="flex items-center gap-3">
          {savedItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearClick}
              className={`text-sm font-medium rounded-full px-3 py-1.5 cursor-pointer active:scale-95 transition-all ${
                confirmClear
                  ? "bg-red-600 text-white border border-transparent shadow-sm hover:bg-red-700"
                  : "border border-slate-300 bg-white text-slate-600 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              }`}
            >
              {confirmClear ? "Confirm Delete?" : "Clear All"}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer active:scale-95"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* 본문: 헤더 높이(h-16)만큼 pt-20 */}
      <main className="pt-20 max-w-7xl mx-auto px-4 py-6">
        {savedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <BookmarkIcon className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No saved items yet</h3>
            <p className="text-slate-500 mt-1 mb-6">Start comparing deals!</p>
            <Link
              href="/"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
            {savedItems.map((item) => (
              <div key={item.id} className="w-full">
                <ProductCard
                  product={item}
                  type={item.shipping === "Domestic" ? "domestic" : "international"}
                  compact
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
