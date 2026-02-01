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

/** 대명사/상품명 → 브랜드 추론 (Product Name → Brand) */
const PRODUCT_TO_BRAND: Array<{ pattern: RegExp; brand: string }> = [
  { pattern: /airpods?|air\s*pods?|apple\s*watch|ipad|iphone|macbook|imac|homepod/i, brand: "Apple" },
  { pattern: /galaxy|samsung\s*phone|samsung\s*tab|buds|galaxy\s*watch/i, brand: "Samsung" },
  { pattern: /playstation|ps5|ps4|ps\s*5|ps\s*4|dualsense|sony\s*headphones|wh-1000|wf-1000/i, brand: "Sony" },
  { pattern: /xbox|surface|windows\s*phone/i, brand: "Microsoft" },
  { pattern: /kindle|fire\s*tv|echo|alexa/i, brand: "Amazon" },
  { pattern: /pixel|nest|google\s*home/i, brand: "Google" },
  { pattern: /nintendo|switch|ds|3ds|gameboy/i, brand: "Nintendo" },
  { pattern: /bose|quietcomfort|soundsport/i, brand: "Bose" },
  { pattern: /jbl|flip|charge|clip/i, brand: "JBL" },
  { pattern: /razer|deathadder|blackwidow|kraken/i, brand: "Razer" },
  { pattern: /logitech|g\s*pro|mx\s*master/i, brand: "Logitech" },
  { pattern: /lego|legos/i, brand: "LEGO" },
  { pattern: /dyson|v\d+|airwrap/i, brand: "Dyson" },
  { pattern: /ninja|nutribullet|blend/i, brand: "Ninja" },
  { pattern: /instant\s*pot|instantpot/i, brand: "Instant Pot" },
  { pattern: /fitbit|sense|versa|charge/i, brand: "Fitbit" },
  { pattern: /garmin|fenix|forerunner|vivoactive/i, brand: "Garmin" },
  { pattern: /anker|eufy|nebula|soundcore/i, brand: "Anker" },
];

function inferBrandsFromQuery(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const brands: string[] = [];
  for (const { pattern, brand } of PRODUCT_TO_BRAND) {
    if (pattern.test(q) && !brands.includes(brand)) brands.push(brand);
  }
  return brands;
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
 * - 검색어 의도에 따라 Fashion/Electronics/Beauty/Home/Default 중 하나로 분류
 * - 해당 카테고리의 그룹별 필터 옵션 반환 (프론트에서 그룹별 섹션 렌더링)
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

    // 브랜드 추론: 상품명만으로 Brands 필터에 브랜드 자동 추가 (AirPods → Apple, Galaxy → Samsung 등)
    const inferredBrands = inferBrandsFromQuery(query);
    if (inferredBrands.length > 0) {
      filters["Brands"] = [...(filters["Brands"] ?? []), ...inferredBrands].filter(
        (v, i, a) => a.indexOf(v) === i
      );
    }

    return NextResponse.json({ filters });
  } catch (err) {
    console.error("[generate-filters]", err);
    const fallback = FILTER_BY_INTENT.Default;
    return NextResponse.json({ filters: fallback });
  }
}
