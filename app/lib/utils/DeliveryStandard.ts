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
      label: "📦 10+ Days",
      cost: "Varies",
      tooltip: "Typically 15–45 days. Check seller.",
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

  // 9. Site fallback (표준 라벨 + colorClass)
  if (site === "amazon") {
    return {
      originalMark: "",
      label: "Standard Shipping",
      cost: "Check Site",
      tooltip: "Delivery time & cost depend on your location.",
      brandId: "amazon",
      colorClass: "font-medium text-slate-600",
    };
  }
  if (site === "walmart") {
    return { originalMark: "", label: "Standard", cost: "Varies", tooltip: "3–5 business days typical.", brandId: "walmart", colorClass: "font-medium text-slate-600" };
  }
  if (site === "target") {
    return { originalMark: "", label: "Standard", cost: "Varies", tooltip: "Standard delivery by location.", brandId: "target", colorClass: "font-medium text-slate-600" };
  }
  if (site === "best buy" || site === "bestbuy") {
    return { originalMark: "", label: "Shipping", cost: "Varies", tooltip: "Delivery or pickup options.", brandId: "bestbuy", colorClass: "font-medium text-slate-600" };
  }
  if (site === "ebay") {
    return { originalMark: "", label: "Standard", cost: "Varies", tooltip: "Seller-dependent shipping.", brandId: "ebay", colorClass: "font-medium text-slate-600" };
  }
  if (site === "iherb") {
    return { originalMark: "", label: "Standard", cost: "Varies", tooltip: "International shipping options.", brandId: "iherb", colorClass: "font-medium text-slate-600" };
  }

  // 10. Specific Date (공통)
  const dateStr = extractDate(deliveryDays) || extractDate(raw.delivery ?? "");
  if (dateStr) {
    return {
      originalMark: "",
      label: `📅 Arrives ${dateStr}`,
      cost: "Check Site",
      tooltip: "Estimated delivery date provided by the seller.",
      brandId: "default",
      colorClass: "font-medium text-slate-600",
    };
  }

  // 11. No Info
  return {
    originalMark: "",
    label: "Standard Shipping",
    cost: "Check Site",
    tooltip: "Delivery time & cost depend on your location.",
    brandId: "default",
    colorClass: "font-medium text-slate-600",
  };
}
