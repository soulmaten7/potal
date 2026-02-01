import { NextRequest, NextResponse } from "next/server";

/** 검색어 의도: Fashion / Electronics / Beauty / Home / Default */
type QueryIntent = "Fashion" | "Electronics" | "Beauty" | "Home" | "Default";

/** 카테고리별 인텔리전스: 검색어를 분석해 대분류 의도 파악 */
function classifyQueryIntent(query: string): QueryIntent {
  const q = query.toLowerCase().trim();
  if (!q) return "Default";

  // Fashion: 의류, 신발, 스니커즈, 후디, 재킷, 패션 등
  const fashionTerms = [
    "nike", "adidas", "shoes", "sneakers", "hoodie", "hoody", "jacket", "jackets",
    "dress", "shirt", "tshirt", "t-shirt", "pants", "jeans", "shorts", "sweater",
    "boots", "sandals", "heels", "clothing", "apparel", "fashion", "wear",
    "running shoes", "basketball", "athletic", "outfit", "coat", "blazer",
    "leggings", "joggers", "windbreaker", "vest", "cap", "hat",
  ];
  if (fashionTerms.some((t) => q.includes(t))) return "Fashion";

  // Electronics: 전자제품, 폰, 노트북, 태블릿 등
  const electronicsTerms = [
    "iphone", "samsung", "galaxy", "laptop", "macbook", "ipad", "tablet",
    "phone", "smartphone", "headphones", "earbuds", "airpods", "watch",
    "monitor", "keyboard", "mouse", "camera", "gaming", "pc", "computer",
    "tv", "television", "speaker", "charger", "cable", "adapter",
    "pro", "max", "air", "ultra", "gb", "ram", "ssd", "storage",
  ];
  if (electronicsTerms.some((t) => q.includes(t))) return "Electronics";

  // Beauty/Health: 화장품, 비타민, 크림, 스킨케어 등
  const beautyTerms = [
    "vitamin", "cream", "serum", "moisturizer", "skincare", "beauty",
    "lipstick", "foundation", "makeup", "cosmetic", "gummy", "pill",
    "anti-aging", "hydration", "sunscreen", "lotion", "oil", "mask",
    "supplement", "collagen", "biotin", "retinol", "niacinamide",
  ];
  if (beautyTerms.some((t) => q.includes(t))) return "Beauty";

  // Home: 리빙, 가구, 주방, 침구 등
  const homeTerms = [
    "furniture", "sofa", "bed", "mattress", "chair", "table", "desk",
    "kitchen", "home", "living", "decor", "lamp", "rug", "curtain",
    "pillow", "blanket", "storage", "organizer", "vacuum", "blender",
  ];
  if (homeTerms.some((t) => q.includes(t))) return "Home";

  return "Default";
}

/** 카테고리별 필터 그룹 정의 (그룹명 -> 옵션 배열) */
const FILTER_BY_INTENT: Record<QueryIntent, Record<string, string[]>> = {
  Fashion: {
    "Target Audience": ["Men", "Women", "Unisex", "Kids", "Toddler"],
    "Product Type": ["Shoes", "Tops", "Bottoms", "Outerwear", "Accessories"],
    "Activity/Style": ["Running", "Casual", "Basketball", "Training", "Lifestyle"],
  },
  Electronics: {
    Specs: ["256GB", "512GB", "1TB", "16GB RAM", "32GB RAM"],
    Condition: ["New", "Refurbished", "Open Box"],
    "Model/Series": ["Pro", "Max", "Air", "Ultra"],
  },
  Beauty: {
    Form: ["Pill", "Gummy", "Cream", "Serum", "Powder"],
    Concern: ["Anti-aging", "Hydration", "Energy", "Immune Support"],
  },
  Home: {
    Room: ["Living Room", "Bedroom", "Kitchen", "Office", "Outdoor"],
    Style: ["Modern", "Minimal", "Traditional", "Industrial", "Scandinavian"],
    "Product Type": ["Furniture", "Lighting", "Storage", "Decor", "Textiles"],
  },
  Default: {
    Features: ["Best Seller", "Top Rated", "Deal", "New Arrival", "Trending"],
    "Top Brands": ["Premium", "Budget", "Eco-friendly", "Premium Pick", "Value"],
    Condition: ["New", "Refurbished", "Open Box", "Like New", "Used"],
  },
};

/**
 * POST /api/generate-filters
 * Body: { query: string }
 * Response: { filters: { "Group Name": ["Option1", "Option2", ...], ... } }
 *
 * 참고: 필터 값은 프론트에서 extractFromProducts(현재 로드된 상품)로 Real Data Only 생성.
 * 이 API는 의도별 그룹 구조 폴백용. DB 저장 없음.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json(
        { error: "Missing or invalid query" },
        { status: 400 }
      );
    }

    const intent = classifyQueryIntent(query);
    const filters = { ...FILTER_BY_INTENT[intent] };
    // Brands는 API 추론 없음. 프론트에서 extractBrandsFromProducts(현재 로드된 상품)로 동적 생성.

    return NextResponse.json({ filters });
  } catch (err) {
    console.error("[generate-filters]", err);
    const fallback = FILTER_BY_INTENT.Default;
    return NextResponse.json({ filters: fallback });
  }
}
