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

/**
 * 질문형 쿼리 감지 (v3 — 전문가 리뷰 반영)
 *
 * 핵심 원칙: "구체적 상품명이 있으면 검색, 없으면 탐색"
 *
 * 탐색형 (true): "what should I buy for camping?" / "recommend me something for winter"
 * → API에 보내면 쓰레기 결과 → suggestedProducts 칩으로 대응
 *
 * 사실적/상품 포함 (false): "I want airpods" / "Is the iPhone waterproof?" / "I need a macbook"
 * → 구체적 상품명 포함 → 일반 검색으로 처리
 */
export function isQuestionQuery(query: string): boolean {
  const q = query.toLowerCase().trim();

  // ── 0. 너무 짧은 쿼리 → 무조건 검색 ──
  if (q.split(/\s+/).length <= 2) return false;

  // ── 1. 구체적 상품/브랜드명 포함 여부 감지 ──
  // 상품명이나 브랜드가 포함되면 어떤 문장 구조든 일반 검색으로 처리
  const KNOWN_BRANDS = /\b(apple|samsung|sony|bose|nike|adidas|dyson|lg|dell|hp|lenovo|asus|logitech|razer|anker|jbl|canon|nikon|nintendo|playstation|xbox|google|pixel|macbook|iphone|ipad|airpods|galaxy|surface|kindle|lego|gopro|beats|fitbit|garmin|cuisinart|keurig|ninja|instant pot|roomba|cricut)\b/;
  const SPECIFIC_PRODUCT = /\b(airpods|macbook|iphone|ipad|ps5|xbox|switch|roku|alexa|echo|kindle|chromebook|thinkpad|pixel \d|galaxy s\d|galaxy buds|quest \d)\b/;

  if (KNOWN_BRANDS.test(q) || SPECIFIC_PRODUCT.test(q)) return false;

  // ── 2. 사실적 질문 제외 (구매 의도가 명확한 질문) ──
  if (/^(where\s+to\s+buy|how\s+much\s+(is|are|does|for)|where\s+can\s+i\s+(buy|get|find))\b/.test(q)) return false;
  if (/^is\s+\w+\s+(worth|good|better|reliable|durable|waterproof|compatible)\b/.test(q)) return false;
  if (/^(does|do|can|is|are)\b\s+\w+\s+(waterproof|worth|good|compatible|available|work with|support|fit|last)\b/.test(q)) return false;

  // ── 3. 탐색형 패턴 (의문사로 시작하는 열린 질문) ──
  if (/^(what|which)\s+(should|would|could|can|do|are|is\s+(?:the\s+)?best|is a good)\b/.test(q)) return true;
  // "which X is best/good for Y?" — 명사 하나 끼어도 매칭
  if (/^which\s+\w+\s+is\s+(the\s+)?best\b/.test(q)) return true;
  if (/^how\s+(to\s+choose|to\s+pick|do\s+i\s+(choose|pick|select|decide))\b/.test(q)) return true;
  if (/^should\s+i\s+(buy|get)\b/.test(q) && q.split(' ').length <= 6) return true;

  // ── 4. 물음표 + 짧은 쿼리 = 탐색 가능성 ──
  if (q.includes('?') && q.split(' ').length <= 5 && !/\b(buy|price|cost|stock|deliver)\b/.test(q)) return true;

  // ── 5. 자연어 의도 패턴 (명확한 탐색형) ──
  // "recommend me X" / "suggest something" / "gift ideas" / "any ideas"
  if (/\b(recommend|suggest|any ideas|gift ideas|what to get|shopping for)\b/.test(q)) return true;
  // "I need / I want / looking for" → 뒤에 형용사+일반명사 조합이면 탐색 (예: "good laptop")
  // "I want airpods" → false (step 1에서 이미 걸림), "I want a good laptop" → true
  if (/\b(i need|i want|i'm looking|looking for|help me find)\b/.test(q)) {
    // 형용사 패턴: "a good X", "some nice X", "warm X", "affordable X"
    if (/\b(a good|some|nice|warm|cool|affordable|cheap|lightweight|portable|wireless|small|big|large|compact|durable)\b/.test(q)) return true;
    // "I need X for Y" 패턴: "I need something for camping"
    if (/\bfor\s+\w+/.test(q)) return true;
    // 구체적 제품 없이 일반 카테고리만: "I want shoes" → 검색으로 처리
    return false;
  }

  // "best X for Y" 패턴 제거: "best laptop for college"는 구매 의도 (검색으로 처리)
  // 이 패턴은 너무 광범위하여 실제 상품 검색 쿼리를 잘못 분류함

  return false;
}

const SYSTEM_PROMPT = `You are POTAL's Query Analysis Agent. Your job is to analyze a shopping search query and produce structured output for a cross-platform shopping search engine.

POTAL searches across US Domestic sites (Amazon, Walmart, eBay, Target, Best Buy, Costco) and Global sites (AliExpress, Temu, Shein, DHgate, YesStyle).

Your tasks:
1. Identify the product category
2. Generate platform-optimized search terms (different platforms use different naming conventions)
3. Detect price intent (budget, range, max price)
4. Extract key product attributes (brand, color, size, specs)
5. Determine search strategy
6. **CRITICAL**: Detect if the query is a QUESTION (natural language, not a product name).
   - Question examples: "what should I buy for camping?", "I need warm socks for winter", "recommend me a good laptop"
   - If it IS a question, set "isQuestionQuery": true and provide "suggestedProducts": an array of 4-8 specific, searchable product keywords the user likely wants.
   - suggestedProducts must be SHORT, CONCRETE product names that work as search queries (e.g. "camping tent", "sleeping bag", "hiking boots") — NOT generic terms like "camping gear" or "outdoor equipment".
   - If it is NOT a question (e.g. "airpods", "nike shoes"), set "isQuestionQuery": false and "suggestedProducts": [].

Platform-specific naming conventions:
- Amazon: Use standard US product names, include brand if mentioned
- AliExpress: Chinese sellers use different terms. "earbuds" → "TWS bluetooth earphone", "phone case" → "mobile phone cover silicone"
- Temu: Similar to AliExpress but more casual terms
- eBay: Include condition hints if relevant ("new", "sealed")

Respond in valid JSON only. No markdown, no explanation.`;

const OUTPUT_SCHEMA = `{
  "category": "string (Electronics, Fashion, Home, Beauty, Sports, Toys, Food, Auto, General)",
  "isQuestionQuery": "boolean - true if query is a question/natural language, false if product name",
  "suggestedProducts": "string[] - 4-8 specific product keywords if question, empty array otherwise",
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

    // AI 판단 우선: AI가 명시적으로 false를 반환하면 존중
    // 로컬 함수는 AI가 판단하지 못한 경우(null/undefined)만 보조
    const isQuestion = parsed.isQuestionQuery != null
      ? parsed.isQuestionQuery === true
      : isQuestionQuery(query);

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
      isQuestionQuery: isQuestion,
      suggestedProducts: isQuestion ? (parsed.suggestedProducts || []) : [],
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
/** 카테고리별 추천 상품 키워드 (질문형 쿼리의 deterministic fallback용) */
const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  Electronics: ['wireless earbuds', 'laptop stand', 'phone charger', 'bluetooth speaker', 'webcam', 'keyboard'],
  Fashion: ['sneakers', 'hoodie', 'sunglasses', 'crossbody bag', 'watch', 'running shoes'],
  Home: ['desk lamp', 'throw blanket', 'kitchen organizer', 'vacuum cleaner', 'bookshelf', 'candle set'],
  Beauty: ['moisturizer', 'sunscreen SPF 50', 'vitamin C serum', 'lip balm set', 'makeup brush set'],
  Sports: ['camping tent', 'sleeping bag', 'hiking boots', 'yoga mat', 'water bottle', 'camping chair', 'cooler bag', 'headlamp'],
  Toys: ['lego set', 'board game', 'puzzle 1000 piece', 'plush toy', 'action figure', 'card game'],
  Food: ['protein powder', 'vitamin D supplement', 'organic coffee', 'green tea', 'energy bars', 'nut mix'],
  Auto: ['dash cam', 'car phone mount', 'tire pressure gauge', 'LED headlight', 'car vacuum', 'sunshade'],
  General: ['gift set', 'daily essentials', 'travel accessories', 'home office setup', 'fitness starter kit'],
};

export function analyzeQueryDeterministic(query: string): QueryAnalysis {
  const q = query.toLowerCase().trim();
  const questionDetected = isQuestionQuery(query);

  // 카테고리 추론
  const categoryMap: Record<string, string[]> = {
    Electronics: ['laptop', 'phone', 'tablet', 'ipad', 'macbook', 'airpods', 'earbuds', 'buds', 'headphone', 'speaker', 'monitor', 'keyboard', 'mouse', 'camera', 'tv', 'gpu', 'cpu', 'ssd', 'charger', 'cable', 'usb'],
    Fashion: ['shoes', 'sneakers', 'dress', 'jacket', 'hoodie', 'pants', 'jeans', 'shirt', 't-shirt', 'nike', 'adidas', 'bag', 'wallet', 'watch', 'sunglasses', 'sock', 'boot'],
    Home: ['lamp', 'desk', 'chair', 'table', 'sofa', 'bed', 'pillow', 'blanket', 'kitchen', 'blender', 'vacuum', 'organizer', 'shelf'],
    Beauty: ['skincare', 'makeup', 'serum', 'moisturizer', 'sunscreen', 'lipstick', 'foundation', 'shampoo', 'perfume', 'cologne'],
    Sports: ['yoga', 'gym', 'fitness', 'camping', 'tent', 'bike', 'running', 'golf', 'swimming', 'hiking', 'outdoor', 'fishing'],
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

  // 전략 결정 (우선순위: comparison > specific > brand > broad)
  let strategy: QueryAnalysis['strategy'] = 'broad';
  if (detectedBrand) strategy = 'brand';
  if (q.split(' ').length >= 5 || priceIntent) strategy = 'specific';
  // comparison은 최우선 — vs/or/compare가 있으면 무조건 비교
  if (q.includes(' vs ') || q.includes(' or ') || q.includes('compare')) strategy = 'comparison';

  // 플랫폼별 검색어 (deterministic version — 모든 플랫폼 지원)
  const cleanQuery = query.replace(/under\s*\$?\d+/i, '').replace(/over\s*\$?\d+/i, '').trim();
  const baseQuery = cleanQuery && cleanQuery.length > 0 ? cleanQuery : query;

  // AliExpress 최적화: 중국 셀러 용어 변환 테이블
  // 순서 중요: multi-word → single-word (긴 매칭 우선)
  const ALI_TERM_MAP: [RegExp, string][] = [
    [/\bphone case\b/gi, 'mobile phone cover silicone'],
    [/\bpower bank\b/gi, 'portable charger powerbank'],
    [/\bsmart watch\b/gi, 'smartwatch bluetooth'],
    [/\bscreen protector\b/gi, 'tempered glass film'],
    [/\bcamera lens\b/gi, 'camera lens filter'],
    [/\bcar mount\b/gi, 'car phone holder'],
    [/\bearbuds\b/gi, 'TWS bluetooth earphone'],
    [/\bheadphones\b/gi, 'bluetooth headset wireless'],
    [/\bcharger\b/gi, 'fast charger USB'],
    [/\bsneakers\b/gi, 'casual shoes sports'],
    [/\bbackpack\b/gi, 'travel backpack bag'],
    [/\bflashlight\b/gi, 'LED torch light'],
    [/\bwall art\b/gi, 'canvas painting wall decor'],
    [/\bkeyboard\b/gi, 'mechanical keyboard'],
    [/\bmouse\b/gi, 'wireless mouse gaming'],
    [/\bwatch band\b/gi, 'watch strap silicone'],
    [/\btripod\b/gi, 'phone tripod stand'],
    [/\bsunglasses\b/gi, 'polarized sunglasses UV400'],
  ];
  let aliExpressQuery = baseQuery;
  for (const [pattern, replacement] of ALI_TERM_MAP) {
    aliExpressQuery = aliExpressQuery.replace(pattern, replacement);
  }
  const finalAliQuery = aliExpressQuery !== baseQuery ? aliExpressQuery : baseQuery;

  // 질문형 → suggestedProducts 생성 (카테고리 기반)
  const suggestedProducts = questionDetected
    ? (CATEGORY_SUGGESTIONS[category] || CATEGORY_SUGGESTIONS['General'])
    : [];

  return {
    original: query,
    category,
    platformQueries: {
      amazon: baseQuery,
      walmart: baseQuery,
      ebay: baseQuery,
      aliexpress: finalAliQuery,
    },
    priceIntent,
    attributes: {
      ...(detectedBrand ? { brand: detectedBrand } : {}),
    },
    strategy,
    confidence: questionDetected ? 0.4 : 0.6,
    isQuestionQuery: questionDetected,
    suggestedProducts,
  };
}

/**
 * Coordinator가 AI를 호출할지 판단하는 헬퍼
 *
 * 간단한 검색 → deterministic (무료, 빠름)
 * 복잡한 검색 → AI (비용, 정확)
 */
export function shouldUseAIAnalysis(query: string): boolean {
  // 질문형 쿼리 → AI가 suggestedProducts를 생성해야 함
  if (isQuestionQuery(query)) return true;

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
