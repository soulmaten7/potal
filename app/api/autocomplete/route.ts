import { NextRequest, NextResponse } from "next/server";

/**
 * RapidAPI 비용 절약: 이 라우트는 Real-Time Amazon Data API를 호출하지 않습니다.
 * - 타이핑(autocomplete) 시 비용 0원.
 * - 유료 API는 /api/search (엔터 검색)에서만 사용됩니다.
 */

// 정적 더미 데이터만 사용 (외부 API 호출 없음)
const SUGGESTION_POOL = [
  "Gaming Mouse", "Gaming Keyboard", "Gaming Headset", "Sony Headphones", "Wireless Earbuds",
  "LEGO", "LEGO Star Wars", "LEGO Technic", "AirPods", "AirPods Pro", "AirPods Max",
  "Headphones", "Wireless headphones", "Gaming chair", "Office chair", "Camping chair",
  "Running shoes", "Sneakers", "Baby stroller", "Fishing rod", "Yoga mat", "Water bottle",
  "Laptop", "Laptop stand", "Laptop bag", "Monitor", "Keyboard", "Mouse",
  "Pencil", "Pen holder", "iPad Pencil", "Apple Pencil", "iPhone case", "Samsung phone", "iPad",
  "Coffee maker", "Blender", "Toaster", "Desk lamp", "LED strip", "USB cable",
  "Notebook", "Pen set", "Sticky notes", "Backpack", "Wallet", "Watch",
  "Sunglasses", "Umbrella", "Sunscreen", "Vitamin C", "Protein powder", "Green tea",
  "Board game", "Puzzle", "Playing cards", "Camera", "Tripod", "Memory card",
];

const MAX_SUGGESTIONS = 6;

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const recentParam = request.nextUrl.searchParams.get("recent") ?? ""; // 선택: 클라이언트에서 넘긴 최근 검색어
    const query = String(q).trim().toLowerCase();
    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // 최근 검색어 중 쿼리와 맞는 것 우선 (문자열 포함 또는 접두사)
    const recentTerms = recentParam
      ? recentParam.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const recentMatches = recentTerms.filter((t) =>
      t.toLowerCase().includes(query) || query.includes(t.toLowerCase())
    );

    // 정적 풀에서 필터
    const filtered = SUGGESTION_POOL.filter((term) =>
      term.toLowerCase().includes(query)
    );
    const fromPool = [...new Set(filtered)].filter((t) => !recentMatches.includes(t));
    const suggestions = [...new Set([...recentMatches, ...fromPool])].slice(0, MAX_SUGGESTIONS);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[autocomplete]", err);
    return NextResponse.json({ suggestions: [] });
  }
}
