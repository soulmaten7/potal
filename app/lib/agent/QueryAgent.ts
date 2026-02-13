/**
 * POTAL QueryAgent — AI 기반 검색어 분석 에이전트
 *
 * 사용자의 검색어를 분석하여:
 * 1. 카테고리 추론 (Electronics, Fashion, etc.)
 * 2. 플랫폼별 최적화된 검색어 생성 (Amazon vs AliExpress)
 * 3. 가격/속성 의도 감지 ("under $100", "lightweight")
 * 4. 검색 전략 결정 (broad vs specific vs brand)
 *
 * 비용: GPT-4o-mini ~$0.0003/호출 (약 1,000토큰 기준)
 * 지연: ~500ms
 *
 * Coordinator가 이 Agent를 호출할지 결정:
 *   - 단순 검색 ("airpods") → deterministic 분석으로 충분
 *   - 복잡한 검색 ("travel laptop under 800 with good battery") → AI 필요
 */

import type { QueryAnalysis } from './types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const SYSTEM_PROMPT = `You are POTAL's Query Analysis Agent. Your job is to analyze a shopping search query and produce structured output for a cross-platform shopping search engine.

POTAL searches across US Domestic sites (Amazon, Walmart, eBay, Target, Best Buy, Costco) and Global sites (AliExpress, Temu, Shein, DHgate, YesStyle).

Your tasks:
1. Identify the product category
2. Generate platform-optimized search terms (different platforms use different naming conventions)
3. Detect price intent (budget, range, max price)
4. Extract key product attributes (brand, color, size, specs)
5. Determine search strategy

Platform-specific naming conventions:
- Amazon: Use standard US product names, include brand if mentioned
- AliExpress: Chinese sellers use different terms. "earbuds" → "TWS bluetooth earphone", "phone case" → "mobile phone cover silicone"
- Temu: Similar to AliExpress but more casual terms
- eBay: Include condition hints if relevant ("new", "sealed")

Respond in valid JSON only. No markdown, no explanation.`;

const OUTPUT_SCHEMA = `{
  "category": "string (Electronics, Fashion, Home, Beauty, Sports, Toys, Food, Auto, General)",
  "platformQueries": {
    "amazon": "string - optimized for Amazon US",
    "walmart": "string - optimized for Walmart (optional)",
    "ebay": "string - optimized for eBay (optional)",
    "aliexpress": "string - optimized for AliExpress (optional)",
    "temu": "string - optimized for Temu (optional)"
  },
  "priceIntent": {
    "min": "number or null",
    "max": "number or null",
    "currency": "USD"
  },
  "attributes": {
    "brand": "string or null",
    "color": "string or null",
    "size": "string or null",
    "specs": "object with key specs or null"
  },
  "strategy": "broad | specific | brand | comparison",
  "confidence": "number 0-1"
}`;

/**
 * AI 기반 검색어 분석
 *
 * @param query 사용자 검색어
 * @returns 구조화된 검색어 분석 결과
 */
export async function analyzeQueryWithAI(query: string): Promise<QueryAnalysis> {
  // OpenAI 키가 없으면 fallback
  if (!OPENAI_API_KEY) {
    console.log('⚠️ [QueryAgent] No OpenAI key, using deterministic analysis');
    return analyzeQueryDeterministic(query);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nOutput schema:\n${OUTPUT_SCHEMA}` },
          { role: 'user', content: `Analyze this shopping query: "${query}"` },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(3000), // 3초 타임아웃
    });

    if (!response.ok) {
      console.warn(`⚠️ [QueryAgent] OpenAI API error: ${response.status}`);
      return analyzeQueryDeterministic(query);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return analyzeQueryDeterministic(query);
    }

    const parsed = JSON.parse(content);
    const tokensUsed = data.usage?.total_tokens || 0;

    console.log(`🤖 [QueryAgent] AI analysis complete | ${tokensUsed} tokens | strategy: ${parsed.strategy}`);

    return {
      original: query,
      category: parsed.category || 'General',
      platformQueries: {
        amazon: parsed.platformQueries?.amazon || query,
        walmart: parsed.platformQueries?.walmart,
        ebay: parsed.platformQueries?.ebay,
        aliexpress: parsed.platformQueries?.aliexpress,
        temu: parsed.platformQueries?.temu,
      },
      priceIntent: parsed.priceIntent?.max || parsed.priceIntent?.min
        ? {
            min: parsed.priceIntent.min ?? undefined,
            max: parsed.priceIntent.max ?? undefined,
            currency: 'USD',
          }
        : undefined,
      attributes: parsed.attributes || {},
      strategy: parsed.strategy || 'broad',
      confidence: parsed.confidence || 0.8,
    };
  } catch (err) {
    console.warn('⚠️ [QueryAgent] AI analysis failed, using deterministic:', err);
    return analyzeQueryDeterministic(query);
  }
}

/**
 * Deterministic 검색어 분석 (fallback, 무료)
 * AI가 실패하거나 키가 없을 때 사용.
 */
export function analyzeQueryDeterministic(query: string): QueryAnalysis {
  const q = query.toLowerCase().trim();

  // 카테고리 추론
  const categoryMap: Record<string, string[]> = {
    Electronics: ['laptop', 'phone', 'tablet', 'ipad', 'macbook', 'airpods', 'earbuds', 'headphone', 'speaker', 'monitor', 'keyboard', 'mouse', 'camera', 'tv', 'gpu', 'cpu', 'ssd', 'charger', 'cable', 'usb'],
    Fashion: ['shoes', 'sneakers', 'dress', 'jacket', 'hoodie', 'pants', 'jeans', 'shirt', 't-shirt', 'nike', 'adidas', 'bag', 'wallet', 'watch', 'sunglasses'],
    Home: ['lamp', 'desk', 'chair', 'table', 'sofa', 'bed', 'pillow', 'blanket', 'kitchen', 'blender', 'vacuum', 'organizer', 'shelf'],
    Beauty: ['skincare', 'makeup', 'serum', 'moisturizer', 'sunscreen', 'lipstick', 'foundation', 'shampoo', 'perfume', 'cologne'],
    Sports: ['yoga', 'gym', 'fitness', 'camping', 'tent', 'bike', 'running', 'golf', 'swimming', 'hiking', 'outdoor'],
    Toys: ['lego', 'toy', 'puzzle', 'game', 'board game', 'plush', 'doll', 'action figure', 'nerf'],
    Food: ['protein', 'vitamin', 'supplement', 'snack', 'coffee', 'tea', 'organic'],
    Auto: ['car', 'tire', 'oil', 'dash cam', 'gps', 'led light', 'car mount'],
  };

  let category = 'General';
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => q.includes(kw))) {
      category = cat;
      break;
    }
  }

  // 브랜드 감지
  const knownBrands = ['apple', 'samsung', 'sony', 'bose', 'nike', 'adidas', 'dyson', 'lg', 'dell', 'hp', 'lenovo', 'asus', 'logitech', 'razer', 'anker', 'jbl', 'canon', 'nikon', 'nintendo', 'playstation', 'xbox'];
  const detectedBrand = knownBrands.find(b => q.includes(b));

  // 가격 의도
  let priceIntent: QueryAnalysis['priceIntent'];
  const maxMatch = q.match(/(?:under|below|less than|max|budget|cheap)\s*\$?(\d+)/);
  const minMatch = q.match(/(?:over|above|more than|min|premium)\s*\$?(\d+)/);
  const rangeMatch = q.match(/\$?(\d+)\s*[-–to]+\s*\$?(\d+)/);

  if (rangeMatch) {
    priceIntent = { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]), currency: 'USD' };
  } else if (maxMatch) {
    priceIntent = { max: parseInt(maxMatch[1]), currency: 'USD' };
  } else if (minMatch) {
    priceIntent = { min: parseInt(minMatch[1]), currency: 'USD' };
  }

  // 전략 결정
  let strategy: QueryAnalysis['strategy'] = 'broad';
  if (detectedBrand) strategy = 'brand';
  if (q.includes(' vs ') || q.includes(' or ') || q.includes('compare')) strategy = 'comparison';
  if (q.split(' ').length >= 5 || priceIntent) strategy = 'specific';

  // 플랫폼별 검색어 (deterministic version)
  const cleanQuery = query.replace(/under\s*\$?\d+/i, '').replace(/over\s*\$?\d+/i, '').trim();

  return {
    original: query,
    category,
    platformQueries: {
      amazon: cleanQuery || query,
    },
    priceIntent,
    attributes: {
      ...(detectedBrand ? { brand: detectedBrand } : {}),
    },
    strategy,
    confidence: 0.6, // deterministic은 AI보다 낮은 신뢰도
  };
}

/**
 * Coordinator가 AI를 호출할지 판단하는 헬퍼
 *
 * 간단한 검색 → deterministic (무료, 빠름)
 * 복잡한 검색 → AI (비용, 정확)
 */
export function shouldUseAIAnalysis(query: string): boolean {
  const words = query.trim().split(/\s+/);

  // 1단어 검색 → deterministic으로 충분
  if (words.length <= 2) return false;

  // 가격 조건이 포함 → AI가 더 잘 파싱
  if (/\$\d+|under|budget|cheap|premium|best/i.test(query)) return true;

  // 속성이 복잡 → AI가 더 잘 구분
  if (words.length >= 4) return true;

  // vs/compare → AI가 더 잘 처리
  if (/\bvs\b|\bor\b|compare|alternative/i.test(query)) return true;

  return false;
}
