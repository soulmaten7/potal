/**
 * AI 인텔리전스 레이어: 검색어 정제 + 가격 의도 감지
 * API 적중률 향상 및 사용자 의도(가격 제한) 반영
 */

/** 불필요한 수식어·필러 (API 호출 시 제거해 핵심 키워드만 전달) */
const NOISE_WORDS = new Set([
  'best', 'cheap', 'cheapest', 'top', 'rated', 'top rated', 'for sale',
  'affordable', 'budget', 'discount', 'discounted', 'on sale', 'deal', 'deals',
  'good', 'great', 'awesome', 'recommended', 'popular', 'trending',
  'buy', 'where to buy', 'near me', 'online', 'free shipping',
  'reviews', 'review', 'compare', 'comparison', 'vs',
].map((w) => w.toLowerCase()));

/** 가격 제한 의도 패턴: (under|below|less than|max|up to) + 숫자 또는 $숫자 */
const PRICE_INTENT_REGEXES: Array<{ pattern: RegExp; extract: (match: RegExpMatchArray) => number | null }> = [
  // "under 50", "under $50", "under 50 dollars"
  { pattern: /\bunder\s+\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?|usd|bucks?)?\b/i, extract: (m) => parseFloat(m[1]) },
  // "below 100", "below $100"
  { pattern: /\bbelow\s+\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?|usd|bucks?)?\b/i, extract: (m) => parseFloat(m[1]) },
  // "less than 50", "less than $50"
  { pattern: /\bless\s+than\s+\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?|usd|bucks?)?\b/i, extract: (m) => parseFloat(m[1]) },
  // "max 100", "maximum 200", "max $50"
  { pattern: /\b(?:max(?:imum)?)\s+\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?|usd|bucks?)?\b/i, extract: (m) => parseFloat(m[1]) },
  // "up to 50", "up to $50"
  { pattern: /\bup\s+to\s+\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?|usd|bucks?)?\b/i, extract: (m) => parseFloat(m[1]) },
  // "$50" or "50$" or "50 dollars" (standalone price = max)
  { pattern: /\$(\d+(?:\.\d+)?)\b/, extract: (m) => parseFloat(m[1]) },
  { pattern: /\b(\d+(?:\.\d+)?)\s*\$/, extract: (m) => parseFloat(m[1]) },
  { pattern: /\b(\d+(?:\.\d+)?)\s*dollars?\b/i, extract: (m) => parseFloat(m[1]) },
];

/** 가격 구간 제거용 패턴 (refineQuery에서 검색어에서 빼기) */
const PRICE_PHRASE_REGEX = /\b(?:under|below|less\s+than|max(?:imum)?|up\s+to)\s+\$?\s*\d+(?:\.\d+)?\s*(?:dollars?|usd|bucks?)?\b|\$\d+(?:\.\d+)?\b|\b\d+(?:\.\d+)?\s*\$|\b\d+(?:\.\d+)?\s*dollars?\b/gi;

/**
 * 검색어에서 불필요한 수식어를 제거하고 핵심 키워드만 반환.
 * API 적중률 향상용.
 */
export function refineQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';

  let q = query.trim();
  // 1) 가격 관련 구간 제거 (under 50, $200 등)
  q = q.replace(PRICE_PHRASE_REGEX, ' ').replace(/\s+/g, ' ').trim();
  // 2) 단어 단위로 필터: 노이즈 단어 제거
  const words = q.split(/\s+/).filter((w) => {
    const lower = w.toLowerCase();
    return lower.length > 0 && !NOISE_WORDS.has(lower);
  });
  // 3) 남은 키워드가 없으면 원본에서 가격만 제거한 걸 반환 (최소 1글자 이상)
  const result = words.join(' ').trim();
  return result.length > 0 ? result : q;
}

export interface PriceIntent {
  /** 사용자가 원하는 최대 가격 (이 금액 이하만 표시) */
  maxPrice: number;
}

/**
 * 검색어에 가격 제한 의도가 있는지 파악하고, 최대 가격(숫자)을 추출.
 * 없으면 null.
 */
export function detectPriceIntent(query: string): PriceIntent | null {
  if (!query || typeof query !== 'string') return null;

  for (const { pattern, extract } of PRICE_INTENT_REGEXES) {
    const match = query.match(pattern);
    if (match) {
      const value = extract(match);
      if (value != null && !Number.isNaN(value) && value > 0) {
        return { maxPrice: value };
      }
    }
  }
  return null;
}

/**
 * 상품 가격 문자열에서 숫자 추출 (비교용).
 */
export function parsePriceToNumber(priceStr: string | undefined): number | null {
  if (priceStr == null || typeof priceStr !== 'string') return null;
  const s = priceStr.replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}
