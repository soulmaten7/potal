"use client";

import Link from "next/link";
import { useSupabase } from "../context/SupabaseProvider";
import { useWishlist } from "../context/WishlistContext";

export type BottomNavTab = "search" | "saved" | "mypotal";

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UserOutlineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UserSolidIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  );
}

type BottomNavProps = {
  /** 현재 활성 탭 (Search / Saved / Profile). POTAL 2.0: 3-tab only */
  activeTab?: BottomNavTab;
  /** 로그인 상태. 전달 시 부모와 동기화(로그아웃 시 즉시 'Log In' 표시·Saved 뱃지 숨김) */
  session?: { user?: { user_metadata?: { avatar_url?: string } } } | null;
  /** Search 탭 클릭 시: 모바일은 검색 오버레이, PC는 검색창 포커스 (부모에서 처리) */
  onSearchClick?: () => void;
};

const tabClass = (active: boolean) =>
  `flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 transition-colors min-w-[64px] ${active ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-600"}`;

export function BottomNav({ activeTab = "search", session: sessionProp, onSearchClick }: BottomNavProps) {
  const { session: contextSession } = useSupabase();
  const session = sessionProp !== undefined ? sessionProp : contextSession;
  const { wishlist } = useWishlist();

  const avatarUrl = session?.user?.user_metadata?.avatar_url as string | undefined;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden border-t border-slate-200 bg-white safe-area-pb"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-14 px-2">
        <button
          type="button"
          onClick={onSearchClick}
          className={tabClass(activeTab === "search")}
          aria-label="Search"
        >
          <SearchIcon className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium">Search</span>
        </button>
        <Link
          href="/saved"
          className={`${tabClass(activeTab === "saved")} relative`}
        >
          <BookmarkIcon className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium">Wishlist</span>
          {session && wishlist.length > 0 && (
            <span className="absolute top-0 right-1 min-w-[14px] h-[14px] rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
              {wishlist.length > 99 ? "99+" : wishlist.length}
            </span>
          )}
        </Link>
        <Link
          href={session ? "/settings" : "/auth/signin"}
          className={tabClass(activeTab === "mypotal")}
        >
          {session ? (
            avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-5 h-5 shrink-0 rounded-full object-cover" />
            ) : (
              <UserSolidIcon className="w-5 h-5 shrink-0" />
            )
          ) : (
            <UserOutlineIcon className="w-5 h-5 shrink-0" />
          )}
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
