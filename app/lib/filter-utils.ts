/**
 * 빈도수 기반 동적 필터 추출 (Frequency-based Dynamic Extraction)
 * Hardcoded whitelist 제거. 검색 결과 상품 title 분석으로 상위 키워드 추출.
 * PC·모바일 동일 데이터 소스.
 */

export interface ProductLike {
  name?: string | null;
  brand?: string | null;
}

const STOPWORDS = new Set(
  [
    // 관사·전치사·접속사
    'a', 'an', 'the', 'and', 'or', 'of', 'in', 'to', 'from', 'by', 'on', 'at', 'is', 'it', 'as',
    // 일반 상품 라벨
    'new', 'brand', 'set', 'pack', 'pcs', 'toy', 'item', 'search', 'generic', 'general',
    'n/a', 'na', 'lot', 'kit', 'box', 'case', 'unit', 'count', 'pair', 'piece',
    // 일반 서술어·형용사
    'person', 'easy', 'setup', 'type', 'style', 'quality', 'duty', 'design', 'use', 'made',
    'super', 'extra', 'plus', 'upgraded', 'premium', 'portable', 'original', 'official',
    'good', 'great', 'best', 'nice', 'fine', 'perfect', 'ideal', 'amazing',
    // 크기·정도
    'large', 'small', 'big', 'high', 'low', 'fast', 'strong', 'heavy', 'wide', 'long',
    'full', 'deep', 'thin', 'thick', 'slim', 'light', 'soft', 'hard', 'flat', 'round',
    // 수량 단어
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'single', 'double', 'triple', 'multi', 'multiple',
    // 구조·부분
    'door', 'mesh', 'window', 'wall', 'floor', 'layer', 'frame', 'panel', 'top', 'bottom',
    'side', 'front', 'back', 'handle', 'cover', 'strap', 'pocket', 'zipper',
    // 기타 일반
    'color', 'size', 'inch', 'feet', 'proof', 'resistant', 'family', 'room', 'area', 'space',
    'free', 'sale', 'hot', 'mini', 'pro', 'max', 'fit', 'mode', 'version',
    'indoor', 'outdoor', 'electric', 'digital', 'home', 'kitchen', 'office',
  ].map((s) => s.toLowerCase())
);

const BRAND_BLACKLIST = new Set(
  [
    // 일반적인 비-브랜드 단어
    'Search', 'Generic', 'Brand', 'N/A', 'General', 'Music', 'Audio', 'Wireless',
    // 상품명에 자주 나오지만 브랜드가 아닌 단어들
    'New', 'Pack', 'Set', 'Pcs', 'Free', 'Best', 'Hot', 'Sale', 'Top', 'Mini', 'Pro',
    'Night', 'Light', 'Easy', 'Fast', 'Heavy', 'Large', 'Small', 'Big', 'Slim', 'Thin',
    'Welcome', 'Sorry', 'This', 'The', 'For', 'With', 'And', 'From',
    'Upgraded', 'Premium', 'Portable', 'Outdoor', 'Indoor', 'Electric', 'Digital',
    'Camping', 'Hiking', 'Running', 'Travel', 'Sports', 'Home', 'Kitchen', 'Office',
    'Mens', 'Womens', 'Kids', 'Adult', 'Boys', 'Girls', 'Unisex', 'Baby',
    'Black', 'White', 'Blue', 'Red', 'Green', 'Pink', 'Gray', 'Grey', 'Brown', 'Purple',
  ].map((s) => s.toLowerCase())
);

/** 2글자 이하 허용 예외 (5G, 4K, XL 등) */
function isShortAllowed(token: string): boolean {
  const lower = token.toLowerCase();
  if (/^\d+[gk]$/.test(lower)) return true; // 5G, 4K
  if (/^x[lx]?$/.test(lower)) return true;  // XL, XXL
  if (/^\d+$/.test(token)) return false;     // 숫자만 제외
  return false;
}

function toTitleCase(word: string): string {
  if (!word.length) return word;
  const lower = word.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function tokenize(title: string): string[] {
  return title
    .split(/\s+/)
    .flatMap((t) => t.split(/[-/]/))
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((t) => t.length > 0);
}

/**
 * 상품 title에서 빈도수 상위 키워드 추출 (스마트 정제)
 */
function extractTopKeywords(products: ProductLike[], topN: number, queryTokens?: Set<string>): string[] {
  const count = new Map<string, number>();

  for (const p of products) {
    const title = (p.name || '').trim();
    if (!title || title.toLowerCase().startsWith('search')) continue;

    const tokens = tokenize(title);
    const seen = new Set<string>();

    for (const raw of tokens) {
      const lower = raw.toLowerCase();
      if (STOPWORDS.has(lower)) continue;
      if (raw.length <= 2 && !isShortAllowed(raw)) continue;
      // 검색어에 이미 포함된 단어 제외 (핵심: "camping tent" 검색 시 "camping", "tent" 필터링)
      if (queryTokens?.has(lower)) continue;

      const key = lower;
      if (!seen.has(key)) {
        seen.add(key);
        count.set(key, (count.get(key) ?? 0) + 1);
      }
    }
  }

  return Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key]) => toTitleCase(key));
}

/**
 * 키워드를 Specs / Series/Model / Keywords 로 분류 (모호하면 Keywords)
 */
function classifyKeyword(keyword: string): 'Specs' | 'Series/Model' | 'Keywords' {
  const lower = keyword.toLowerCase();
  if (/\d+gb|\d+tb|\d+mb/i.test(lower)) return 'Specs';
  if (/\d+k|\d+g\b/i.test(lower)) return 'Specs';  // 4K, 5G
  if (/^x[lx]?$/i.test(lower)) return 'Specs';
  if (/\d+/.test(lower) && /gb|tb|k|g\b|inch|mm/i.test(lower)) return 'Specs';
  if (['pro', 'max', 'air', 'ultra', 'plus', 'mini'].includes(lower)) return 'Series/Model';
  return 'Keywords';
}

/**
 * Brands: 상품 brand 또는 title 첫 단어, 상위 10개, 블랙리스트 제외
 */
/** 유효한 키워드인지 검증 (Keywords/Related 카테고리 전용) */
function isValidKeyword(kw: string, queryTokens?: Set<string>): boolean {
  const lower = kw.toLowerCase();
  if (/^\d+$/.test(kw)) return false;                // 순수 숫자
  if (kw.length <= 2 && !isShortAllowed(kw)) return false; // 2글자 이하 (5G/4K 제외)
  if (STOPWORDS.has(lower)) return false;             // 스탑워드
  if (BRAND_BLACKLIST.has(lower)) return false;       // 브랜드 블랙리스트 (색상, 활동명 등)
  if (queryTokens?.has(lower)) return false;          // 검색어 토큰
  return true;
}

/** 유효한 브랜드명인지 검증 */
function isValidBrand(brand: string): boolean {
  // 숫자만으로 구성 (예: "4", "100", "2024")
  if (/^\d+$/.test(brand)) return false;
  // 1글자 (예: "I", "A", "S")
  if (brand.length <= 1) return false;
  // 2글자 이하이며 알파벳만 (브랜드명 가능성 낮음, "LG", "HP" 같은 건 별도 처리)
  if (brand.length <= 2 && !/^(lg|hp|jbl|3m|ge)$/i.test(brand)) return false;
  // 숫자+단위 패턴 (예: "4pcs", "100ml", "12v")
  if (/^\d+[a-z]+$/i.test(brand)) return false;
  // 블랙리스트
  if (BRAND_BLACKLIST.has(brand.toLowerCase())) return false;
  return true;
}

export function extractBrandsFromProducts(products: ProductLike[]): string[] {
  const count = new Map<string, number>();

  for (const p of products) {
    const title = (p.name || '').trim();
    if (title.toLowerCase().startsWith('search')) continue;

    let brand: string | undefined = typeof p.brand === 'string' && p.brand.trim() ? p.brand.trim() : undefined;
    if (!brand) {
      const first = title.split(/\s+/)[0];
      if (first) brand = first.replace(/[^a-zA-Z0-9]/g, '');
    }
    if (!brand) continue;

    const key = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    if (!key || !isValidBrand(key)) continue;

    count.set(key, (count.get(key) ?? 0) + 1);
  }

  return Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([b]) => b);
}

/**
 * 검색 결과 상품 기반 동적 필터 옵션 (빈도수 상위 15 + Brands)
 * 반환: { Brands?: string[], Specs?: string[], 'Series/Model'?: string[], Keywords?: string[] }
 */
/** 가격 범위 인사이트 */
export interface PriceInsight {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
}

export interface FilterOptions {
  Brands?: string[];
  Gender?: string[];
  Specs?: string[];
  'Series/Model'?: string[];
  Keywords?: string[];
  priceInsight?: PriceInsight;
}

/** 상품명에서 성별 키워드 감지 */
const GENDER_PATTERNS: { label: string; patterns: RegExp[] }[] = [
  { label: "Men's",   patterns: [/\bmen'?s?\b/i, /\bmale\b/i, /\bfor men\b/i, /\bboys?\b/i, /\bgentlemen\b/i] },
  { label: "Women's", patterns: [/\bwomen'?s?\b/i, /\bfemale\b/i, /\bfor women\b/i, /\bgirls?\b/i, /\bladies\b/i] },
  { label: "Unisex",  patterns: [/\bunisex\b/i, /\badult\b/i] },
  { label: "Kids",    patterns: [/\bkids?\b/i, /\bchildren'?s?\b/i, /\btoddler\b/i, /\bbaby\b/i, /\bjunior\b/i, /\byouth\b/i] },
];

/** 성별 카테고리가 의미있는 상품 카테고리 키워드 */
const GENDER_RELEVANT_KEYWORDS = [
  'sock', 'shoe', 'shirt', 'pants', 'jeans', 'jacket', 'coat', 'dress', 'skirt',
  'underwear', 'boxers', 'briefs', 'bra', 'legging', 'hoodie', 'sweater', 'shorts',
  'clothing', 'apparel', 'wear', 'boot', 'sneaker', 'sandal', 'slipper', 'hat', 'cap',
  'glove', 'scarf', 'belt', 'watch', 'glasses', 'sunglasses', 'perfume', 'cologne',
  'backpack', 'bag', 'wallet', 'ring', 'bracelet', 'necklace', 'earring',
];

function extractGenderOptions(products: ProductLike[]): string[] | undefined {
  // 먼저 성별이 의미있는 상품 카테고리인지 확인
  const allTitles = products.map(p => (p.name || '').toLowerCase()).join(' ');
  const isGenderRelevant = GENDER_RELEVANT_KEYWORDS.some(kw => allTitles.includes(kw));
  if (!isGenderRelevant) return undefined;

  // 각 성별 키워드가 등장하는 상품 수 카운트
  const genderCounts = new Map<string, number>();
  for (const p of products) {
    const title = (p.name || '').toLowerCase();
    if (!title) continue;
    for (const { label, patterns } of GENDER_PATTERNS) {
      if (patterns.some(pat => pat.test(title))) {
        genderCounts.set(label, (genderCounts.get(label) ?? 0) + 1);
      }
    }
  }

  // 최소 2개 이상 매칭된 성별만 표시
  const results = Array.from(genderCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);

  return results.length > 0 ? results : undefined;
}

/** 상품 배열에서 가격 통계 추출 */
function extractPriceInsight(products: ProductLikeWithPrice[]): PriceInsight | undefined {
  const prices = products
    .map(p => {
      if (typeof p.parsedPrice === 'number' && p.parsedPrice > 0) return p.parsedPrice;
      if (typeof p.price === 'string') {
        const n = parseFloat(p.price.replace(/[^0-9.-]/g, ''));
        if (!isNaN(n) && n > 0) return n;
      }
      return null;
    })
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);

  if (prices.length === 0) return undefined;

  const sum = prices.reduce((a, b) => a + b, 0);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0
    ? (prices[mid - 1] + prices[mid]) / 2
    : prices[mid];

  return {
    min: prices[0],
    max: prices[prices.length - 1],
    avg: Math.round((sum / prices.length) * 100) / 100,
    median: Math.round(median * 100) / 100,
    count: prices.length,
  };
}

export interface ProductLikeWithPrice extends ProductLike {
  price?: string | null;
  parsedPrice?: number | null;
}

/**
 * 검색 결과 상품 기반 동적 필터 옵션 (빈도수 상위 15 + Brands + Price Insight)
 * 반환: FilterOptions
 */
export function extractFilterOptionsFromProducts(products: ProductLikeWithPrice[], query?: string): FilterOptions {
  const out: FilterOptions = {};

  // 검색어를 토큰으로 분해하여 중복 제거에 활용
  const queryTokens = query
    ? new Set(tokenize(query).map(t => t.toLowerCase()))
    : undefined;

  const brands = extractBrandsFromProducts(products);
  if (brands.length > 0) out['Brands'] = brands;

  // 성별 필터 추출 (의류, 신발, 액세서리 등)
  const genderOptions = extractGenderOptions(products);
  if (genderOptions) out['Gender'] = genderOptions;

  const topKeywords = extractTopKeywords(products, 15, queryTokens);
  const specs: string[] = [];
  const seriesModel: string[] = [];
  const keywords: string[] = [];

  for (const kw of topKeywords) {
    const group = classifyKeyword(kw);
    if (group === 'Specs') specs.push(kw);
    else if (group === 'Series/Model') seriesModel.push(kw);
    else if (isValidKeyword(kw, queryTokens)) keywords.push(kw);
  }

  if (specs.length > 0) out['Specs'] = specs;
  if (seriesModel.length > 0) out['Series/Model'] = seriesModel;
  if (keywords.length > 0) out['Keywords'] = keywords;

  const priceInsight = extractPriceInsight(products);
  if (priceInsight) out.priceInsight = priceInsight;

  return out;
}
