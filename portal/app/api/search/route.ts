import { NextResponse } from 'next/server';

interface NormalizedProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  site: string;
  shipping: 'Domestic' | 'International';
  link: string;
  deliveryDays?: string;
  rating?: number;
  reviews?: number;
  trustScore?: number;
  relevance?: number;
}

/**
 * Normalize image URL from various API response formats
 * Checks all possible image fields and ensures valid HTTPS URL
 */
function normalizeImage(item: any): string {
  // Check all possible image fields
  const possibleImageFields = [
    'product_photo',
    'product_image',
    'imageUrl',
    'thumbnailImage',
    'main_image_url',
    'image',
    'thumbnail',
    'productImage',
    'primary_image',
    'galleryURL',
    'product_thumbnail',
    'img',
    'photo',
    'picture',
  ];

  let imageUrl: string | null = null;

  // Try to find image from any of the possible fields
  for (const field of possibleImageFields) {
    if (item[field] && typeof item[field] === 'string' && item[field].trim()) {
      imageUrl = item[field].trim();
      break;
    }
  }

  // If no image found, return placeholder
  if (!imageUrl) {
    return 'https://placehold.co/300x300?text=No+Image';
  }

  // If URL doesn't start with http/https, prepend https://
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    // Handle relative URLs that start with //
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    } else {
      imageUrl = 'https://' + imageUrl;
    }
  }

  // Ensure HTTPS (convert http to https)
  if (imageUrl.startsWith('http://')) {
    imageUrl = imageUrl.replace('http://', 'https://');
  }

  return imageUrl;
}

// --- [AI & Logic: Helper Functions] ---

/**
 * 배송지 분류 로직 (Domestic vs International)
 */
function classifyShipping(site: string, shippingInfo: string): 'Domestic' | 'International' {
  const domesticSites = ['Amazon', 'Walmart', 'Target', 'Best Buy', 'BestBuy', 'eBay'];
  const info = shippingInfo.toLowerCase();
  
  if (domesticSites.includes(site)) return 'Domestic';
  if (info.includes('us') || info.includes('domestic') || info.includes('2-day')) return 'Domestic';
  return 'International';
}

/**
 * 신뢰도 점수 계산 (Trust Score)
 */
function calculateTrustScore(rating: number, reviews: number, site: string): number {
  let baseScore = rating * 20; // 5점 만점을 100점으로 환산
  if (reviews > 1000) baseScore += 10;
  if (reviews > 10000) baseScore += 5;
  if (site === 'Amazon') baseScore += 5; // 사이트 신뢰도 가산점
  if (site === 'Walmart' || site === 'Target' || site === 'Best Buy') baseScore += 3;
  return Math.min(baseScore, 100);
}

/**
 * 상품 매칭 및 그룹화 (AI Entity Resolution - Simplified version)
 *
 * 기준:
 * - id에 `_mock_` 가 포함된 상품은 전부 서로 다른 개별 상품으로 취급 (절대 그룹화 X)
 * - 그 외 상품은 "이름 전체"를 기준으로 80% 이상 유사할 때만 그룹화
 */
function groupProducts(products: NormalizedProduct[]): any[] {
  const groups: any[] = [];

  const normalizeName = (name: string): string =>
    (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 매우 간단한 유사도: 공통 prefix 길이 / 더 긴 쪽 길이
  const nameSimilarity = (a: string, b: string): number => {
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    const minLen = Math.min(a.length, b.length);
    let common = 0;
    for (let i = 0; i < minLen; i++) {
      if (a[i] === b[i]) common++;
      else break;
    }
    return common / maxLen;
  };

  products.forEach((p) => {
    // 1) Mock 데이터는 항상 개별 그룹으로 유지
    if (p.id.includes('_mock_')) {
      groups.push({
        ...p,
        variants: [],
        bestPrice: p.price,
        bestPriceSite: p.site,
      });
      return;
    }

    const normalized = normalizeName(p.name);

    // 2) 기존 그룹 중 이름 유사도가 0.98 이상인 그룹을 찾는다 (거의 동일한 이름만 그룹화)
    let targetGroup: any | null = null;
    for (const g of groups) {
      // mock 그룹은 스킵
      if (g.id && typeof g.id === 'string' && g.id.includes('_mock_')) continue;

      const gNorm = normalizeName(g.name);
      if (nameSimilarity(normalized, gNorm) >= 0.98) {
        targetGroup = g;
        break;
      }
    }

    // 3) 유사한 그룹이 없으면 새 그룹 생성
    if (!targetGroup) {
      groups.push({
        ...p,
        variants: [],
        bestPrice: p.price,
        bestPriceSite: p.site,
      });
      return;
    }

    // 4) 유사 그룹이 있으면 variants 에 추가하고, 최저가 갱신
    targetGroup.variants.push({
      site: p.site,
      price: p.price,
      link: p.link,
      shipping: p.shipping,
      trustScore: p.trustScore,
    });

    const currentPrice = parseFloat(
      targetGroup.bestPrice.replace(/[^0-9.]/g, ''),
    );
    const newPrice = parseFloat(p.price.replace(/[^0-9.]/g, ''));
    if (!isNaN(newPrice) && (isNaN(currentPrice) || newPrice < currentPrice)) {
      targetGroup.bestPrice = p.price;
      targetGroup.bestPriceSite = p.site;
    }
  });

  return groups;
}

/**
 * Normalize price to clean string format (e.g., "$12.99")
 * Removes duplicate currency codes or symbols
 */
function normalizePrice(price: any): string {
  if (typeof price === 'number') {
    return `$${price.toFixed(2)}`;
  }
  
  if (!price) {
    return '$0.00';
  }

  // Convert to string and clean
  let priceStr = String(price).trim();
  
  // Remove all currency symbols and codes except the first $ or number
  // This handles cases like "$12.99 USD", "USD $12.99", "$12.99$", etc.
  priceStr = priceStr.replace(/USD|EUR|GBP|JPY|CNY|KRW|CAD|AUD/gi, '');
  priceStr = priceStr.replace(/\$+/g, '$'); // Remove duplicate $ signs
  priceStr = priceStr.replace(/[^\d.$-]/g, ''); // Keep only digits, dots, $, and minus
  
  // Extract numeric value
  const numericMatch = priceStr.match(/[\d.]+/);
  if (!numericMatch) {
    return '$0.00';
  }
  
  const numericValue = parseFloat(numericMatch[0]);
  if (isNaN(numericValue)) {
    return '$0.00';
  }
  
  // Format as currency string
  return `$${numericValue.toFixed(2)}`;
}

/**
 * Normalize Amazon API response
 */
function normalizeAmazonProduct(item: any, index: number): NormalizedProduct {
  const price = normalizePrice(item.price || item.price_raw || item.current_price);
  let link = item.product_url || item.url || item.link || '#';
  
  // Add Amazon affiliate tag
  if (link !== '#' && process.env.AMAZON_AFFILIATE_TAG) {
    const separator = link.includes('?') ? '&' : '?';
    link = `${link}${separator}tag=${process.env.AMAZON_AFFILIATE_TAG}`;
  }
  
  const rating = parseFloat(item.rating || item.star_rating || item.average_rating || '0') || 0;
  const reviews = parseInt(item.reviews_count || item.number_of_reviews || item.total_reviews || '0', 10) || 0;
  const shippingInfo = item.shipping_info || item.shipping || '';
  const shipping = classifyShipping('Amazon', shippingInfo);
  const trustScore = calculateTrustScore(rating, reviews, 'Amazon');
  
  return {
    id: `amazon_${item.asin || item.product_id || index}`,
    name: item.title || item.product_title || item.name || 'Unknown Product',
    price,
    image: normalizeImage(item),
    site: 'Amazon',
    shipping,
    link,
    deliveryDays: '2-5 Days',
    rating,
    reviews,
    trustScore,
    relevance: 100,
  };
}

/**
 * Normalize Walmart API response
 */
function normalizeWalmartProduct(item: any, index: number): NormalizedProduct {
  const price = normalizePrice(item.price || item.salePrice || item.current_price);
  const rating = parseFloat(item.rating || item.average_rating || item.star_rating || '0') || 0;
  const reviews = parseInt(item.reviews_count || item.number_of_reviews || '0', 10) || 0;
  const shippingInfo = item.shipping_info || item.shipping || '';
  const shipping = classifyShipping('Walmart', shippingInfo);
  const trustScore = calculateTrustScore(rating, reviews, 'Walmart');
  
  return {
    id: `walmart_${item.usItemId || item.product_id || index}`,
    name: item.name || item.product_title || item.title || 'Unknown Product',
    price,
    image: normalizeImage(item),
    site: 'Walmart',
    shipping,
    link: item.link || item.product_url || item.url || '#',
    deliveryDays: '2-3 Days',
    rating,
    reviews,
    trustScore,
    relevance: 100,
  };
}

/**
 * Normalize Best Buy API response
 */
function normalizeBestBuyProduct(item: any, index: number): NormalizedProduct {
  const price = normalizePrice(item.price || item.salePrice || item.currentPrice);
  const rating = parseFloat(item.rating || item.average_rating || item.customerRating || '0') || 0;
  const reviews = parseInt(item.reviews_count || item.numberOfReviews || item.reviews || '0', 10) || 0;
  const shippingInfo = item.shipping_info || item.shipping || '';
  const shipping = classifyShipping('Best Buy', shippingInfo);
  const trustScore = calculateTrustScore(rating, reviews, 'Best Buy');
  
  return {
    id: `bestbuy_${item.sku || item.product_id || index}`,
    name: item.name || item.title || item.product_title || 'Unknown Product',
    price,
    image: normalizeImage(item),
    site: 'Best Buy',
    shipping,
    link: item.url || item.product_url || item.link || '#',
    deliveryDays: '1-2 Days',
    rating,
    reviews,
    trustScore,
    relevance: 100,
  };
}

/**
 * Normalize Target API response
 */
function normalizeTargetProduct(item: any, index: number): NormalizedProduct {
  const price = normalizePrice(item.price || item.current_price || item.salePrice);
  const rating = parseFloat(item.rating || item.average_rating || item.customerRating || '0') || 0;
  const reviews = parseInt(item.reviews_count || item.numberOfReviews || item.reviews || '0', 10) || 0;
  const shippingInfo = item.shipping_info || item.shipping || '';
  const shipping = classifyShipping('Target', shippingInfo);
  const trustScore = calculateTrustScore(rating, reviews, 'Target');
  
  return {
    id: `target_${item.tcin || item.product_id || index}`,
    name: item.title || item.name || item.product_title || 'Unknown Product',
    price,
    image: normalizeImage(item),
    site: 'Target',
    shipping,
    link: item.url || item.product_url || item.link || '#',
    deliveryDays: '2-4 Days',
    rating,
    reviews,
    trustScore,
    relevance: 100,
  };
}

/**
 * Normalize Temu API response
 */
function normalizeTemuProduct(item: any, index: number): NormalizedProduct {
  const price = normalizePrice(item.price || item.price_raw || item.priceValue);
  let link = item.product_url || item.url || item.link || '#';
  
  // Add Temu affiliate code
  if (link !== '#' && process.env.TEMU_AFFILIATE_CODE) {
    const separator = link.includes('?') ? '&' : '?';
    link = `${link}${separator}referral_code=${process.env.TEMU_AFFILIATE_CODE}`;
  }
  
  const rating = parseFloat(item.rating || item.star_rating || item.average_rating || '0') || 0;
  const reviews = parseInt(item.reviews_count || item.number_of_reviews || item.total_reviews || '0', 10) || 0;
  const shippingInfo = item.shipping_info || item.shipping || '';
  const shipping = classifyShipping('Temu', shippingInfo);
  const trustScore = calculateTrustScore(rating, reviews, 'Temu');
  
  return {
    id: `temu_${item.product_id || item.id || index}`,
    name: item.title || item.product_title || item.name || 'Unknown Product',
    price,
    image: normalizeImage(item),
    site: 'Temu',
    shipping,
    link,
    deliveryDays: '10-20 Days',
    rating,
    reviews,
    trustScore,
    relevance: 100,
  };
}

/**
 * Normalize AliExpress API response
 */
function normalizeAliExpressProduct(item: any, index: number): NormalizedProduct {
  const price = normalizePrice(item.price || item.product_price || item.priceValue);
  const rating = parseFloat(item.rating || item.star_rating || item.average_rating || '0') || 0;
  const reviews = parseInt(item.reviews_count || item.number_of_reviews || item.total_reviews || '0', 10) || 0;
  const shippingInfo = item.shipping_info || item.shipping || '';
  const shipping = classifyShipping('AliExpress', shippingInfo);
  const trustScore = calculateTrustScore(rating, reviews, 'AliExpress');
  
  return {
    id: `aliexpress_${item.product_id || item.productId || index}`,
    name: item.product_title || item.title || item.name || 'Unknown Product',
    price,
    image: normalizeImage(item),
    site: 'AliExpress',
    shipping,
    link: item.product_url || item.url || item.link || '#',
    deliveryDays: '15-30 Days',
    rating,
    reviews,
    trustScore,
    relevance: 100,
  };
}

/**
 * Normalize eBay API response (treated as Domestic)
 */
function normalizeEbayProduct(item: any, index: number): NormalizedProduct {
  const price = normalizePrice(item.price || item.currentPrice || item.sellingStatus?.currentPrice?.['@value']);
  const rating = parseFloat(item.seller?.feedbackScore || item.rating || '0') || 0;
  const reviews = parseInt(item.feedbackCount || item.reviews_count || '0', 10) || 0;
  const shippingInfo = item.shipping_info || item.shipping || '';
  const shipping = classifyShipping('eBay', shippingInfo);
  const trustScore = calculateTrustScore(rating, reviews, 'eBay');
  
  return {
    id: `ebay_${item.itemId || item.product_id || index}`,
    name: item.title || item.name || item.product_title || 'Unknown Product',
    price,
    image: normalizeImage(item),
    site: 'eBay',
    shipping,
    link: item.viewItemURL || item.url || item.link || '#',
    deliveryDays: '3-7 Days',
    rating,
    reviews,
    trustScore,
    relevance: 100,
  };
}

/**
 * Fetch products from a RapidAPI endpoint
 */
async function fetchRapidAPI(
  baseUrl: string,
  host: string | undefined,
  query: string,
  normalizeFn: (item: any, index: number) => NormalizedProduct,
  siteName: string,
  mockFilter: (p: any) => boolean,
  page: number = 1
): Promise<NormalizedProduct[]> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey || !host) {
    console.warn(`⚠️ ${siteName} API: Missing credentials, returning empty list`);
    return [];
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.append('query', query);
    url.searchParams.append('page', page.toString());
    if (baseUrl.includes('amazon')) {
      url.searchParams.append('country', 'US');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': host,
      },
    });

    if (!response.ok) {
      throw new Error(`${siteName} API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    const items = data.data?.products || 
                  data.data?.results ||
                  data.products || 
                  data.results || 
                  (Array.isArray(data) ? data : []);

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(`${siteName} API: No products found`);
    }

    // Return all items (no slicing) - we want at least 40+ items per site
    return items.map((item: any, index: number) => 
      normalizeFn(item, index)
    );
  } catch (error) {
    console.error(`❌ ${siteName} API error:`, error);
    // For GET flows, just return empty list; POST will handle emergency mocks separately
    return [];
  }
}

// --- Site-specific fetcher stubs (prepared for real APIs) ---

async function fetchAmazon(query: string): Promise<NormalizedProduct[]> {
  console.warn('ℹ️ fetchAmazon stub called. Configure RAPIDAPI_HOST_AMAZON/RAPIDAPI_KEY to enable.');
  return [];
}

async function fetchWalmart(query: string): Promise<NormalizedProduct[]> {
  console.warn('ℹ️ fetchWalmart stub called. Configure RAPIDAPI_HOST_WALMART/RAPIDAPI_KEY to enable.');
  return [];
}

async function fetchBestBuy(query: string): Promise<NormalizedProduct[]> {
  console.warn('ℹ️ fetchBestBuy stub called. Configure RAPIDAPI_HOST_BESTBUY/RAPIDAPI_KEY to enable.');
  return [];
}

async function fetchTargetStore(query: string): Promise<NormalizedProduct[]> {
  console.warn('ℹ️ fetchTarget stub called. Configure RAPIDAPI_HOST_TARGET/RAPIDAPI_KEY to enable.');
  return [];
}

async function fetchEbayStore(query: string): Promise<NormalizedProduct[]> {
  console.warn('ℹ️ fetchEbay stub called. Configure RAPIDAPI_HOST_EBAY/RAPIDAPI_KEY to enable.');
  return [];
}

async function fetchTemu(query: string): Promise<NormalizedProduct[]> {
  console.warn('ℹ️ fetchTemu stub called. Configure RAPIDAPI_HOST_TEMU/RAPIDAPI_KEY to enable.');
  return [];
}

async function fetchAliExpressStore(query: string): Promise<NormalizedProduct[]> {
  console.warn('ℹ️ fetchAliExpress stub called. Configure RAPIDAPI_HOST_ALIEXPRESS/RAPIDAPI_KEY to enable.');
  return [];
}

// --- High-level search functions ---

async function searchDomestic(query: string): Promise<NormalizedProduct[]> {
  const results = await Promise.allSettled([
    fetchAmazon(query),
    fetchWalmart(query),
    fetchBestBuy(query),
    fetchTargetStore(query),
    fetchEbayStore(query),
  ]);

  const flattened: NormalizedProduct[] = [];
  for (const res of results) {
    if (res.status === 'fulfilled') {
      flattened.push(...res.value);
    } else {
      console.warn('⚠️ Domestic fetcher rejected:', res.reason);
    }
  }
  return flattened;
}

async function searchInternational(query: string): Promise<NormalizedProduct[]> {
  const results = await Promise.allSettled([
    fetchTemu(query),
    fetchAliExpressStore(query),
  ]);

  const flattened: NormalizedProduct[] = [];
  for (const res of results) {
    if (res.status === 'fulfilled') {
      flattened.push(...res.value);
    } else {
      console.warn('⚠️ International fetcher rejected:', res.reason);
    }
  }
  return flattened;
}

/**
 * GET Handler - Query parameter based search with AI grouping
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    console.log('🔍 GET Search requested for:', query);

    // Helper function to fetch multiple pages and combine results (minimum 40 items per site)
    const fetchMultiplePages = async (
      baseUrl: string,
      host: string | undefined,
      query: string,
      normalizeFn: (item: any, index: number) => NormalizedProduct,
      siteName: string,
      mockFilter: (p: any) => boolean
    ): Promise<NormalizedProduct[]> => {
      // Helper function to add delay
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Fetch pages 1, 2, 3 sequentially with 1.5 second delay between requests
      const pages = [1, 2, 3];
      const allItems: NormalizedProduct[] = [];
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        try {
          const result = await fetchRapidAPI(baseUrl, host, query, normalizeFn, siteName, mockFilter, page);
          allItems.push(...result);
        } catch (error) {
          console.warn(`⚠️ ${siteName} page ${page} failed:`, error);
        }
        
        // Add 1.5 second delay before next request (except for the last page)
        if (i < pages.length - 1) {
          await delay(1500);
        }
      }
      
      // Remove duplicates based on id
      const uniqueItems = Array.from(
        new Map(allItems.map(item => [item.id, item])).values()
      );
      
      return uniqueItems;
    };

    // Parallel Fetching: ALL APIs at once using Promise.allSettled
    // Each site fetches multiple pages to get at least 40+ items
    const [
      amazonResult,
      walmartResult,
      bestbuyResult,
      targetResult,
      temuResult,
      aliExpressResult,
      ebayResult,
    ] = await Promise.allSettled([
      fetchMultiplePages(
        'https://real-time-amazon-data.p.rapidapi.com/search',
        process.env.RAPIDAPI_HOST_AMAZON,
        query,
        normalizeAmazonProduct,
        'Amazon',
        (p) => p.site === 'Amazon'
      ),
      fetchMultiplePages(
        'https://axesso-walmart-data-service.p.rapidapi.com/wlm/wlm-search',
        process.env.RAPIDAPI_HOST_WALMART,
        query,
        normalizeWalmartProduct,
        'Walmart',
        (p) => p.site === 'Walmart'
      ),
      fetchMultiplePages(
        'https://bestbuy-usa.p.rapidapi.com/products/search',
        process.env.RAPIDAPI_HOST_BESTBUY,
        query,
        normalizeBestBuyProduct,
        'Best Buy',
        (p) => p.site === 'BestBuy'
      ),
      fetchMultiplePages(
        'https://target-com-shopping-api.p.rapidapi.com/search',
        process.env.RAPIDAPI_HOST_TARGET,
        query,
        normalizeTargetProduct,
        'Target',
        (p) => p.site === 'Target'
      ),
      fetchMultiplePages(
        'https://temuscout-api-temu-data-api.p.rapidapi.com/search',
        process.env.RAPIDAPI_HOST_TEMU,
        query,
        normalizeTemuProduct,
        'Temu',
        (p) => p.site === 'Temu'
      ),
      fetchMultiplePages(
        'https://aliexpress-data.p.rapidapi.com/product/search',
        process.env.RAPIDAPI_HOST_ALIEXPRESS,
        query,
        normalizeAliExpressProduct,
        'AliExpress',
        (p) => p.site === 'AliExpress'
      ),
      fetchMultiplePages(
        'https://ebay-search-api.p.rapidapi.com/search',
        process.env.RAPIDAPI_HOST_EBAY,
        query,
        normalizeEbayProduct,
        'eBay',
        (p) => p.site === 'eBay'
      ),
    ]);

    // Extract results; if promise rejected, just return empty array (no mock fallback)
    const extractResults = (result: PromiseSettledResult<NormalizedProduct[]>, storeName: string) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      console.warn(`⚠️ ${storeName} promise rejected, returning empty results`);
      return [] as NormalizedProduct[];
    };

    const amazonProducts = extractResults(amazonResult, 'Amazon');
    const walmartProducts = extractResults(walmartResult, 'Walmart');
    const bestbuyProducts = extractResults(bestbuyResult, 'Best Buy');
    const targetProducts = extractResults(targetResult, 'Target');
    const temuProducts = extractResults(temuResult, 'Temu');
    const aliExpressProducts = extractResults(aliExpressResult, 'AliExpress');
    const ebayProducts = extractResults(ebayResult, 'eBay');

    // Combine all results
    const allResults = [
      ...amazonProducts,
      ...walmartProducts,
      ...bestbuyProducts,
      ...targetProducts,
      ...temuProducts,
      ...aliExpressProducts,
      ...ebayProducts,
    ];

    // First, sort all individual products by trustScore + relevance (before grouping)
    const sortedIndividualResults = allResults.sort((a: any, b: any) => {
      const scoreA = (a.trustScore || 0) + (a.relevance || 0);
      const scoreB = (b.trustScore || 0) + (b.relevance || 0);
      return scoreB - scoreA;
    });

    // AI 기반 그룹화
    const groupedResults = groupProducts(sortedIndividualResults);
    
    // 최종 랭킹: 그룹화된 결과도 trustScore + relevance 기반으로 정렬
    const sortedResults = groupedResults.sort((a: any, b: any) => {
      const scoreA = (a.trustScore || 0) + (a.relevance || 0);
      const scoreB = (b.trustScore || 0) + (b.relevance || 0);
      return scoreB - scoreA;
    });

    const domesticCount = allResults.filter(r => r.shipping === 'Domestic').length;
    const internationalCount = allResults.filter(r => r.shipping === 'International').length;

    console.log(`✅ GET Search complete: ${domesticCount} Domestic, ${internationalCount} International`);

    return NextResponse.json({ 
      results: sortedResults,
      total: sortedResults.length,
      metadata: {
        domesticCount,
        internationalCount,
      },
    });
  } catch (error) {
    console.error('❌ GET Search API error:', error);
    // Even if GET fails entirely, return an empty but valid structure
    return NextResponse.json({ 
      results: [],
      total: 0,
      metadata: {
        domesticCount: 0,
        internationalCount: 0,
      },
      error: 'Search failed',
    }, { status: 500 });
  }
}

/**
 * Emergency Mock Data Generator for UI testing
 * - Used only when real API results are completely empty
 * - Generates > 30 mixed products across all major sites
 */
function generateEmergencyMockData(query: string): NormalizedProduct[] {
  const baseQuery = (query || '').trim() || 'Sample Product';

  const sites: { site: string; shipping: 'Domestic' | 'International' }[] = [
    // Domestic
    { site: 'Amazon', shipping: 'Domestic' },
    { site: 'Walmart', shipping: 'Domestic' },
    { site: 'Best Buy', shipping: 'Domestic' },
    { site: 'Target', shipping: 'Domestic' },
    { site: 'eBay', shipping: 'Domestic' },
    // Extra US-style sites (mapped to Domestic)
    { site: 'Costco', shipping: 'Domestic' },
    { site: 'Newegg', shipping: 'Domestic' },
    { site: 'Home Depot', shipping: 'Domestic' },
    { site: 'Wayfair', shipping: 'Domestic' },
    { site: 'Macys', shipping: 'Domestic' },
    // International
    { site: 'Temu', shipping: 'International' },
    { site: 'AliExpress', shipping: 'International' },
  ];

  const products: NormalizedProduct[] = [];
  let globalIndex = 0;

  // Generate ~3 products per site → 12 * 3 = 36
  for (const cfg of sites) {
    for (let i = 0; i < 3; i += 1) {
      const priceBase = cfg.shipping === 'Domestic' ? 30 + i * 5 : 10 + i * 3;
      const price = normalizePrice(priceBase);
      const name = `${cfg.site} ${baseQuery} #${i + 1}`;
      const rating = 4 + (i % 2) * 0.3; // 4.0 ~ 4.3
      const reviews = 50 + i * 25;

      products.push({
        id: `mock_${cfg.site.toLowerCase().replace(/\s+/g, '_')}_${globalIndex}`,
        name,
        price,
        image: `https://placehold.co/300x300?text=${encodeURIComponent(cfg.site)}`,
        site: cfg.site,
        shipping: cfg.shipping,
        link: '#',
        deliveryDays:
          cfg.shipping === 'Domestic'
            ? ['1-2 Days', '2-3 Days', '3-5 Days'][i % 3]
            : ['7-14 Days', '10-20 Days', '15-30 Days'][i % 3],
        rating,
        reviews,
        trustScore: calculateTrustScore(rating, reviews, cfg.site),
        relevance: 100 - globalIndex,
      });

      globalIndex += 1;
    }
  }

  return products;
}

export async function POST(request: Request) {
  try {
    const { query, page = 1 } = await request.json();
    
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        {
          results: [],
          total: 0,
          metadata: {
            domesticCount: 0,
            internationalCount: 0,
          },
          error: 'Query is required',
        },
        { status: 400 },
      );
    }

    console.log('🔍 Search requested for:', query);

    // Use new high-level search functions (prepared for real parallel APIs)
    const [domesticResults, internationalResults] = await Promise.all([
      searchDomestic(query),
      searchInternational(query),
    ]);

    // Combine all results
    let allResults: NormalizedProduct[] = [
      ...domesticResults,
      ...internationalResults,
    ];

    // Fallback: if no real API results at all, generate emergency mock data for UI testing
    if (allResults.length === 0) {
      console.warn('⚠️ No real API results, generating emergency mock data for UI testing.');
      allResults = generateEmergencyMockData(query);
    }

    // First, sort all individual products by trustScore + relevance (before grouping)
    const sortedIndividualResults = allResults.sort((a: any, b: any) => {
      const scoreA = (a.trustScore || 0) + (a.relevance || 0);
      const scoreB = (b.trustScore || 0) + (b.relevance || 0);
      return scoreB - scoreA;
    });

    // AI 기반 그룹화
    const groupedResults = groupProducts(sortedIndividualResults);
    
    // 최종 랭킹: 그룹화된 결과도 trustScore + relevance 기반으로 정렬
    const sortedResults = groupedResults.sort((a: any, b: any) => {
      const scoreA = (a.trustScore || 0) + (a.relevance || 0);
      const scoreB = (b.trustScore || 0) + (b.relevance || 0);
      return scoreB - scoreA;
    });

    const domesticCount = allResults.filter(p => p.shipping === 'Domestic').length;
    const internationalCount = allResults.filter(p => p.shipping === 'International').length;

    console.log(`✅ Search complete: ${domesticCount} Domestic, ${internationalCount} International`);

    return NextResponse.json({ 
      results: sortedResults,
      total: sortedResults.length,
      metadata: {
        domesticCount,
        internationalCount,
      },
    });
  } catch (error) {
    console.error('❌ Search API error:', error);
    
    // If POST fails, do not try to generate extra mock data; just return an empty result
    return NextResponse.json({ 
      results: [],
      total: 0,
      metadata: {
        domesticCount: 0,
        internationalCount: 0,
      },
      error: 'Search failed',
    }, { status: 500 });
  }
}
