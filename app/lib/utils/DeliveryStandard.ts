/**
 * 배송 정보 표준화 엔진 — 글로벌 8대 쇼핑몰
 * site / delivery 텍스트를 분석해 POTAL 표준 포맷으로 변환
 */

export interface RawDeliveryInput {
  deliveryDays?: string;
  is_prime?: boolean;
  site?: string;
  shipping?: string;
  delivery?: string;
  price?: string;
  /** 멤버십 보정이 적용된 경우 멤버십 ID */
  appliedMembership?: string | null;
  /** 멤버십 보정 여부 */
  membershipAdjusted?: boolean;
}

/** 가격 문자열 → 숫자 */
function parsePriceNum(priceStr?: string): number | null {
  if (!priceStr) return null;
  const n = parseFloat(String(priceStr).replace(/[^0-9.]/g, ''));
  return Number.isNaN(n) ? null : n;
}

export interface StandardDeliveryInfo {
  /** 브랜드/유형 마크 (Prime, Choice, W+ 등) */
  originalMark: string;
  label: string;
  cost: string;
  tooltip: string;
  /** 배지 스타일용 */
  brandId: "amazon" | "aliexpress" | "temu" | "walmart" | "ebay" | "bestbuy" | "target" | "iherb" | "default";
  /** 브랜드 컬러 적용용 Tailwind 클래스 (예: font-bold text-[#146eb4]) */
  colorClass: string;
}

const SITE = (raw: RawDeliveryInput) => (raw.site ?? "").toLowerCase().trim();
const TEXT = (raw: RawDeliveryInput) =>
  `${raw.deliveryDays ?? ""} ${raw.delivery ?? ""} ${raw.shipping ?? ""}`.toLowerCase();

/** 날짜 패턴 → 표시용 문자열 */
function extractDate(text: string | undefined): string | null {
  if (!text || typeof text !== "string") return null;
  const t = text.trim();
  const arrives = t.match(/\bArrives\s+([^.]+?)(?:\s*[.–]|$)/i);
  if (arrives) return arrives[1].trim();
  const monthDay = t.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (monthDay) return `${monthDay[1]} ${monthDay[2]}`.trim();
  const slash = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?\b/);
  if (slash) return `${slash[1]}/${slash[2]}`;
  return null;
}

/**
 * 원본 배송 데이터를 POTAL 표준 포맷으로 변환 (8대 쇼핑몰 규칙)
 */
export function normalizeDeliveryInfo(raw: RawDeliveryInput): StandardDeliveryInfo {
  const site = SITE(raw);
  const text = TEXT(raw);
  const deliveryDays = raw.deliveryDays ?? raw.delivery ?? "";

  // ══ 멤버십 보정 우선 처리: appliedMembership이 있으면 멤버십 기반 표시 ══
  if (raw.membershipAdjusted && raw.appliedMembership) {
    const days = deliveryDays || "2-5 Days";
    const membership = raw.appliedMembership;

    const MEMBERSHIP_DELIVERY: Record<string, StandardDeliveryInfo> = {
      prime: {
        originalMark: "Prime",
        label: `🚀 ${days}`,
        cost: "Free",
        tooltip: "Amazon Prime member benefit. Free fast shipping.",
        brandId: "amazon",
        colorClass: "font-bold text-[#146eb4]",
      },
      wplus: {
        originalMark: "W+",
        label: `🚀 ${days}`,
        cost: "Free",
        tooltip: "Walmart+ member benefit. Free fast shipping.",
        brandId: "walmart",
        colorClass: "font-bold text-[#0071ce]",
      },
      choice: {
        originalMark: "Choice",
        label: `⚡ ${days}`,
        cost: "Free",
        tooltip: "AliExpress Choice member. Faster delivery with free shipping.",
        brandId: "aliexpress",
        colorClass: "font-bold text-orange-600",
      },
      mybby: {
        originalMark: "Plus",
        label: `📦 ${days}`,
        cost: "Free",
        tooltip: "Best Buy Plus member. Free shipping on all orders.",
        brandId: "bestbuy",
        colorClass: "font-bold text-[#003b64]",
      },
      sheclub: {
        originalMark: "S-Club",
        label: `📦 ${days}`,
        cost: "Free",
        tooltip: "Shein S-Club member. Free shipping + member discount.",
        brandId: "default",
        colorClass: "font-bold text-[#222]",
      },
      costco: {
        originalMark: "Member",
        label: `📦 ${days}`,
        cost: "Included",
        tooltip: "Costco member. Member-only pricing.",
        brandId: "default",
        colorClass: "font-bold text-[#e31837]",
      },
      circle360: {
        originalMark: "Circle",
        label: `🚀 ${days}`,
        cost: "Free",
        tooltip: "Target Circle 360 member. Free same-day or 2-day shipping.",
        brandId: "target",
        colorClass: "font-bold text-[#CC0000]",
      },
    };

    if (MEMBERSHIP_DELIVERY[membership]) {
      return MEMBERSHIP_DELIVERY[membership];
    }
  }

  // 1. Amazon — Prime → Blue / 🚀 2-Day
  if (site === "amazon" && (raw.is_prime === true || /prime|2-?day|free\s*delivery\s*\(us\)/i.test(text))) {
    return {
      originalMark: "Prime",
      label: "🚀 2-Day",
      cost: "Free",
      tooltip: "Verified by Amazon Prime. Usually arrives in 2 days within US.",
      brandId: "amazon",
      colorClass: "font-bold text-[#146eb4]",
    };
  }

  // 2. Walmart — W+ → Light Blue / 🚀 2-Day
  if (site === "walmart" && /w\+|walmart\+|2-?day|two\s*day/i.test(text)) {
    return {
      originalMark: "W+",
      label: "🚀 2-Day",
      cost: "Free over $35",
      tooltip: "Walmart+ or 2-Day eligible. Free shipping over $35.",
      brandId: "walmart",
      colorClass: "font-bold text-[#0071ce]",
    };
  }

  // 3. Target — RedCard → Red / 🚀 2-Day
  if (site === "target" && /redcard|red\s*card|2-?day|free\s*ship/i.test(text)) {
    return {
      originalMark: "RedCard",
      label: "🚀 2-Day",
      cost: "Free",
      tooltip: "Target RedCard or eligible 2-day shipping.",
      brandId: "target",
      colorClass: "font-bold text-[#CC0000]",
    };
  }

  // 4. Best Buy — Pickup → Yellow / 🏪 Store Pickup
  if (site === "best buy" || site === "bestbuy") {
    if (/pickup|store\s*pickup|curbside/i.test(text)) {
      return {
        originalMark: "Best Buy",
        label: "🏪 Store Pickup",
        cost: "Free",
        tooltip: "Free store or curbside pickup.",
        brandId: "bestbuy",
        colorClass: "font-bold text-[#FFF200] bg-[#003b64] px-1 rounded",
      };
    }
  }

  // 5. AliExpress — Choice → Orange / ⚡ 5-7 Days (Standard → 📦 10+ Days)
  if (site === "aliexpress" || site === "ali express") {
    if (/choice|5-7|5\s*-\s*7/i.test(text)) {
      return {
        originalMark: "Choice",
        label: "⚡ 5-7 Days",
        cost: "Free or low",
        tooltip: "AliExpress Choice. Faster delivery for selected items.",
        brandId: "aliexpress",
        colorClass: "font-bold text-orange-600",
      };
    }
    return {
      originalMark: "",
      label: "📦 10-15 Days",
      cost: "Free Shipping",
      tooltip: "Most AliExpress items ship free. Standard delivery 10-15 business days.",
      brandId: "aliexpress",
      colorClass: "font-medium text-orange-600",
    };
  }

  // 6. Temu — Free → Theme Orange / 📦 Standard
  if (site === "temu") {
    if (/free|standard/i.test(text) || !text.trim()) {
      return {
        originalMark: "",
        label: "📦 Standard",
        cost: "Often free",
        tooltip: "Temu standard shipping. Often free over threshold.",
        brandId: "temu",
        colorClass: "font-medium text-orange-600",
      };
    }
  }

  // 7. eBay — Fast → Red / 🏅 Expedited
  if (site === "ebay" && /top\s*rated|expedited|fast|fast\s*n\s*free/i.test(text)) {
    return {
      originalMark: "Fast",
      label: "🏅 Expedited",
      cost: "Varies",
      tooltip: "eBay Fast 'N Free or expedited. Seller-dependent.",
      brandId: "ebay",
      colorClass: "font-bold text-[#e53238]",
    };
  }

  // 8. iHerb — Global → Green / ✈️ 3-5 Days
  if (site === "iherb" && /global|global\s*air|air|3-5|3\s*-\s*5/i.test(text)) {
    return {
      originalMark: "iHerb",
      label: "✈️ 3-5 Days",
      cost: "Free over threshold",
      tooltip: "iHerb Global Air. Fast international delivery.",
      brandId: "iherb",
      colorClass: "font-bold text-[#458500]",
    };
  }

  // 9. Site fallback — 추정 배송비 표시 (비교 쇼핑 사이트에 적합)
  if (site === "amazon") {
    // Amazon: $25+ 무료배송 일반적, 그 외 $5.99 추정
    const price = parsePriceNum(raw.price);
    const estCost = price && price >= 25 ? "Free" : "Est. $5.99";
    return {
      originalMark: "",
      label: "📦 3-5 Days",
      cost: estCost,
      tooltip: price && price >= 25
        ? "Most Amazon orders over $25 ship free. 3-5 business days."
        : "Estimated standard shipping. Free on orders $25+.",
      brandId: "amazon",
      colorClass: "font-medium text-slate-600",
    };
  }
  if (site === "walmart") {
    // Walmart: $35+ 무료배송, 그 외 $5.99 추정
    const price = parsePriceNum(raw.price);
    const estCost = price && price >= 35 ? "Free" : "Est. $5.99";
    return { originalMark: "", label: "📦 3-5 Days", cost: estCost, tooltip: price && price >= 35 ? "Free shipping on orders $35+." : "Estimated shipping. Free on orders $35+.", brandId: "walmart", colorClass: "font-medium text-slate-600" };
  }
  if (site === "target") {
    // Target: $35+ 무료배송
    const price = parsePriceNum(raw.price);
    const estCost = price && price >= 35 ? "Free" : "Est. $5.99";
    return { originalMark: "", label: "📦 3-5 Days", cost: estCost, tooltip: price && price >= 35 ? "Free shipping on orders $35+." : "Estimated shipping. Free on orders $35+.", brandId: "target", colorClass: "font-medium text-slate-600" };
  }
  if (site === "best buy" || site === "bestbuy") {
    // Best Buy: $35+ 무료배송
    const price = parsePriceNum(raw.price);
    const estCost = price && price >= 35 ? "Free" : "Est. $5.99";
    return { originalMark: "", label: "📦 3-7 Days", cost: estCost, tooltip: price && price >= 35 ? "Free shipping on orders $35+." : "Estimated shipping. Free on orders $35+.", brandId: "bestbuy", colorClass: "font-medium text-slate-600" };
  }
  if (site === "ebay") {
    return { originalMark: "", label: "📦 5-10 Days", cost: "Seller Dependent", tooltip: "Shipping cost and time depend on the seller.", brandId: "ebay", colorClass: "font-medium text-slate-600" };
  }
  if (site === "iherb") {
    return { originalMark: "", label: "✈️ 5-10 Days", cost: "Free over $25", tooltip: "iHerb: Free international shipping on orders over $25.", brandId: "iherb", colorClass: "font-medium text-slate-600" };
  }

  // 10. Specific Date (공통)
  const dateStr = extractDate(deliveryDays) || extractDate(raw.delivery ?? "");
  if (dateStr) {
    return {
      originalMark: "",
      label: `📅 Arrives ${dateStr}`,
      cost: "Included",
      tooltip: "Estimated delivery date provided by the seller.",
      brandId: "default",
      colorClass: "font-medium text-slate-600",
    };
  }

  // 11. No Info — 추정값 표시
  return {
    originalMark: "",
    label: "📦 Standard",
    cost: "Est. $5.99",
    tooltip: "Estimated standard shipping cost. Actual cost may vary.",
    brandId: "default",
    colorClass: "font-medium text-slate-600",
  };
}
