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
    'new', 'brand', 'the', 'with', 'for', 'set', 'pack', 'pcs', 'toy', 'item',
    'search', 'generic', 'general', 'music', 'audio', 'wireless', 'n/a', 'na',
    'and', 'or', 'of', 'in', 'to', 'from', 'by', 'on', 'at', 'a', 'an',
  ].map((s) => s.toLowerCase())
);

const BRAND_BLACKLIST = new Set(
  ['Search', 'Generic', 'Brand', 'N/A', 'General', 'Music', 'Audio', 'Wireless'].map((s) => s.toLowerCase())
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
function extractTopKeywords(products: ProductLike[], topN: number): string[] {
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
    if (!key || BRAND_BLACKLIST.has(key.toLowerCase())) continue;

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
export function extractFilterOptionsFromProducts(products: ProductLike[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};

  const brands = extractBrandsFromProducts(products);
  if (brands.length > 0) out['Brands'] = brands;

  const topKeywords = extractTopKeywords(products, 15);
  const specs: string[] = [];
  const seriesModel: string[] = [];
  const keywords: string[] = [];

  for (const kw of topKeywords) {
    const group = classifyKeyword(kw);
    if (group === 'Specs') specs.push(kw);
    else if (group === 'Series/Model') seriesModel.push(kw);
    else keywords.push(kw);
  }

  if (specs.length > 0) out['Specs'] = specs;
  if (seriesModel.length > 0) out['Series/Model'] = seriesModel;
  if (keywords.length > 0) out['Keywords'] = keywords;

  return out;
}
