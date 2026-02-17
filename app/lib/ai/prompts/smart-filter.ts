/**
 * ══════════════════════════════════════════════════════════════
 * 🔍 SMART FILTER v3.0 — 계층형 AI 스마트 필터
 * ══════════════════════════════════════════════════════════════
 *
 * 검색 결과 상품 title을 분석하여 **축(Axis) 기반**으로
 * 그룹화된 필터 키워드를 생성. POTAL의 핵심 차별화 기능.
 *
 * v3.0 변경: flat keywords[] → grouped axes[]
 * - Related에 축 이름(Person, Type, Features)을 표시
 * - 축 클릭 시 세부값(1-Person, 2-Person...)이 펼쳐짐
 * - Progressive Disclosure 패턴 → UI 깔끔 + 정보 풍부
 *
 * 핵심 원칙:
 * - 값(values)은 반드시 상품 title에 실제로 존재해야 함
 *   (클라이언트 사이드 필터링이 작동하려면!)
 * - 축 이름(name)은 값들이 공유하는 대표 단어 사용
 *   ("Capacity" X → "Person" O, "Cup" O)
 * - 카테고리를 먼저 인식 → 카테고리별 구매 결정 축 추출
 *
 * ✅ 수정 가이드:
 * - 필터 품질이 낮을 때 → SYSTEM_PROMPT 수정
 * - 특정 카테고리 대응 추가 → FEW_SHOT_EXAMPLES에 추가
 * - 축 개수 조정 → SYSTEM_PROMPT의 숫자 수정
 * - 다른 파일 건드릴 필요 없음
 *
 * 비용: ~400 input tokens + ~120 output tokens ≈ $0.00013/call
 * ══════════════════════════════════════════════════════════════
 */

import { executePrompt } from '../engine';
import type {
  PromptModuleConfig,
  PromptResult,
  FewShotExample,
  SmartFilterInput,
  SmartFilterOutput,
  FilterAxis,
} from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CONFIG: PromptModuleConfig = {
  id: 'smart-filter',
  version: '3.0.0',
  description: '계층형 축(Axis) 기반 AI 스마트 필터 생성',
  model: 'gpt-4o-mini',
  temperature: 0.2,
  maxTokens: 500,
  timeoutMs: 5000,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT — 이것만 수정하면 필터 품질이 변함
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SYSTEM_PROMPT = `You are a **senior shopping expert** at POTAL. Your job is to look at search results and think: "If I were a buyer comparing these products, what are the key dimensions I'd filter by?"

You think DEEPLY about each product category — not just scanning titles for keywords, but understanding what a real buyer needs to decide.

## YOUR TASK
Given a search query and product titles, produce:
1. Top BRANDS (3-8)
2. FILTER AXES (3-5 groups) — each with a name and values

## STEP 1: UNDERSTAND THE CATEGORY
What product category is this? What do buyers ALWAYS compare when shopping for this category?

Think like a shopping expert:
- Tents → buyers ALWAYS compare: how many people, tent type, which season, key features
- Earbuds → buyers ALWAYS compare: wearing style, noise cancelling, wireless tech, durability
- Coffee makers → buyers ALWAYS compare: serving size, brewing method, features

## STEP 2: BUILD AXES — THINK LIKE AN EXPERT, NOT A SCANNER
For each buying dimension you identified, scan ALL titles to find how products express that dimension.

⚠️ CRITICAL: Don't just look for exact keywords. Think about ALL THE WAYS a dimension can be expressed:
- Season for tents: "3-Season", "4-Season" but ALSO "Winter", "All Weather", "Cold Weather", "Summer"
- Noise for earbuds: "Noise Cancelling", "ANC" but ALSO "Active Noise", "Passive Isolation"
- Size for TVs: "55 inch", "55\"", "55-Inch" — pick the form that appears most

If a dimension is INTRINSIC to the category (e.g., Season for tents, Noise for earbuds), it MUST appear as an axis even if only 2 titles mention it. Buyers NEED this filter.

**Axis naming rules:**
- Use the SHARED WORD from values when possible: "Person" (not "Capacity"), "Cup" (not "Serving Size"), "Season" (not "Weather Rating")
- If values don't share a word, use a short label: "Type", "Style", "Features"

Reference frameworks:
- **Tents** → Person, Type, Season, Features
- **Earbuds** → Style, Noise, Tech, Features
- **Shoes** → Purpose, Fit, Features
- **Keyboards** → Size, Switch, Connect, Features
- **TVs** → Size, Resolution, Panel, Features
- **Laptops** → Size, Purpose, Spec, Features
- **Clothing** → Fit, Material, Season
- **Phones** → Storage, Features, Condition
- **Unknown categories**: Think — what 3-4 dimensions would a buyer compare? Then find values.

## STEP 3: COMPLETENESS CHECK
For each axis, ensure you captured ALL variants present in ANY title.
- If you found "2-Person" and "4-Person", go back and check: does "1-Person" or "3-Person" or "6-Person" appear in ANY title? Include ALL that exist.
- Values MUST appear in (or closely match) at least 1 product title — these are used for client-side text filtering.

## BRAND RULES
- Extract from the BEGINNING of product titles (first word or first two words)
- A brand is a COMPANY NAME, not a product feature. "Open Ear" is NOT a brand. "Wireless" is NOT a brand.
- EXACT spelling as in titles (for client-side text matching)
- Order by frequency: most-mentioned brand first
- DO NOT include retailer names (Amazon, Walmart, eBay, Target)

## AXIS VALUE RULES
1. Values MUST appear in at least 1 product title — used for client-side text filtering
2. DO NOT include search query words as values
3. DO NOT include brand names as values
4. Keep values 1-3 words max, Title Case
5. Order values logically: numerical order for sizes, importance for features
6. Aim for 3-5 axes, each with 2-8 values

## OUTPUT (JSON only, no explanation)
{
  "detectedCategory": "tents",
  "brands": ["Coleman", "KAZOO", "Naturehike"],
  "axes": [
    { "name": "Person", "values": ["1-Person", "2-Person", "4-Person", "6-Person", "10-Person"] },
    { "name": "Type", "values": ["Dome", "Cabin", "Pop Up", "Backpacking"] },
    { "name": "Season", "values": ["3-Season", "4-Season", "Winter", "All Weather"] },
    { "name": "Features", "values": ["Waterproof", "Instant", "Lightweight", "UV Protection"] }
  ]
}`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FEW-SHOT EXAMPLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    user: `Search query: "camping tent"

Product titles:
1. Coleman Sundome 4-Person Camping Tent - Waterproof Dark Room
2. KAZOO Outdoor Camping Tent 2-Person Lightweight Waterproof
3. Clostnature 1-Person Backpacking Tent - Ultralight
4. CORE 6 Person Instant Cabin Tent with Screen Room
5. Ozark Trail 10-Person 3-Room Instant Cabin Tent
6. Naturehike 2 Person Ultralight Tent Dome Tent Waterproof
7. Pop Up Beach Tent Sun Shelter Portable UV Protection
8. Coleman Skydome 4-Person Camping Tent with LED Lighting`,
    assistant: JSON.stringify({
      detectedCategory: 'tents',
      brands: ['Coleman', 'KAZOO', 'Clostnature', 'CORE', 'Ozark Trail', 'Naturehike'],
      axes: [
        { name: 'Person', values: ['1-Person', '2-Person', '4-Person', '6-Person', '10-Person'] },
        { name: 'Type', values: ['Dome', 'Cabin', 'Pop Up', 'Backpacking'] },
        { name: 'Features', values: ['Waterproof', 'Instant', 'Lightweight', 'UV Protection'] },
      ],
    }),
  },
  {
    user: `Search query: "wireless earbuds"

Product titles:
1. Apple AirPods Pro 2nd Gen with Active Noise Cancellation
2. Samsung Galaxy Buds2 Pro Wireless Earbuds Noise Cancelling
3. Sony WF-1000XM5 True Wireless Noise Cancelling In-Ear
4. JBL Tune 230NC Wireless Noise Cancelling Earbuds
5. Tozo T6 True Wireless Earbuds Bluetooth 5.3 IPX8 Waterproof
6. Beats Fit Pro Wireless Noise Cancelling Earbuds
7. Anker Soundcore Liberty 4 NC True Wireless Earbuds
8. Bose QuietComfort Ultra Wireless Noise Cancelling`,
    assistant: JSON.stringify({
      detectedCategory: 'earbuds',
      brands: ['Apple', 'Samsung', 'Sony', 'JBL', 'Tozo', 'Beats', 'Anker', 'Bose'],
      axes: [
        { name: 'Style', values: ['In-Ear', 'Over-Ear'] },
        { name: 'Noise', values: ['Noise Cancelling', 'ANC'] },
        { name: 'Tech', values: ['True Wireless', 'Bluetooth 5.3'] },
        { name: 'Features', values: ['Waterproof', 'With Mic'] },
      ],
    }),
  },
  {
    user: `Search query: "gaming keyboard"

Product titles:
1. Corsair K70 RGB PRO Mechanical Gaming Keyboard Cherry MX Red
2. Razer BlackWidow V4 Mechanical Gaming Keyboard Green Switches
3. Logitech G Pro X TKL Wireless Gaming Keyboard
4. SteelSeries Apex Pro TKL Wireless Mechanical Keyboard
5. HyperX Alloy Origins 60 Percent Mechanical Gaming Keyboard
6. Royal Kludge RK61 60% Wireless Mechanical Keyboard Hot-Swap
7. Keychron K2 75% Wireless Mechanical Keyboard Hot-Swap
8. Corsair K65 PLUS Wireless 75% RGB Mechanical Gaming Keyboard`,
    assistant: JSON.stringify({
      detectedCategory: 'keyboards',
      brands: ['Corsair', 'Razer', 'Logitech', 'SteelSeries', 'HyperX', 'Royal Kludge', 'Keychron'],
      axes: [
        { name: 'Size', values: ['TKL', '75%', '60%'] },
        { name: 'Switch', values: ['Mechanical', 'Cherry MX'] },
        { name: 'Connect', values: ['Wireless', 'Wired'] },
        { name: 'Features', values: ['RGB', 'Hot-Swap'] },
      ],
    }),
  },
  // ⚠️ 프레임워크 미등재 카테고리 — AI가 자체 축을 도출하는 패턴
  {
    user: `Search query: "coffee maker"

Product titles:
1. Keurig K-Supreme Single Serve K-Cup Pod Coffee Maker
2. Cuisinart 14-Cup Programmable Drip Coffee Maker Stainless Steel
3. Ninja DualBrew 12-Cup Coffee Maker Single-Serve K-Cup Compatible
4. Mr. Coffee 12-Cup Programmable Coffee Maker with Strong Brew
5. Nespresso Vertuo Next Espresso Coffee Maker with Milk Frother
6. Hamilton Beach FlexBrew 2-Way Coffee Maker Single Serve or 12-Cup
7. BUNN Speed Brew 10-Cup Home Coffee Maker
8. Breville Barista Express Espresso Machine Stainless Steel`,
    assistant: JSON.stringify({
      detectedCategory: 'coffee makers',
      brands: ['Keurig', 'Cuisinart', 'Ninja', 'Mr. Coffee', 'Nespresso', 'Hamilton Beach', 'BUNN', 'Breville'],
      axes: [
        { name: 'Cup', values: ['Single Serve', '10-Cup', '12-Cup', '14-Cup'] },
        { name: 'Brew', values: ['Drip', 'Espresso', 'K-Cup', 'Programmable'] },
        { name: 'Features', values: ['Stainless Steel', 'Milk Frother'] },
      ],
    }),
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILD USER MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildUserMessage(input: SmartFilterInput): string {
  // 토큰 절약: 최대 25개 title, 각 80자 제한 (domestic+global 균형 포함)
  const trimmedTitles = input.titles
    .slice(0, 25)
    .map((t, i) => `${i + 1}. ${t.slice(0, 80)}`);

  return `Search query: "${input.query}"\n\nProduct titles:\n${trimmedTitles.join('\n')}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PARSE OUTPUT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function parseOutput(raw: string): SmartFilterOutput {
  const parsed = JSON.parse(raw);

  const brands = Array.isArray(parsed.brands)
    ? parsed.brands
        .filter((b: unknown) => typeof b === 'string' && b.trim().length > 0)
        .slice(0, 8)
    : [];

  // axes 파싱 — v3.0 핵심
  const axes: FilterAxis[] = Array.isArray(parsed.axes)
    ? parsed.axes
        .filter((a: any) => typeof a?.name === 'string' && Array.isArray(a?.values))
        .map((a: any) => ({
          name: a.name.trim(),
          values: a.values
            .filter((v: unknown) => typeof v === 'string' && (v as string).trim().length > 0)
            .slice(0, 10), // 축당 최대 10개 값
        }))
        .filter((a: FilterAxis) => a.values.length > 0)
        .slice(0, 6) // 최대 6개 축
    : [];

  // 하위호환: axes의 모든 값을 flat으로 합쳐 keywords에도 넣음
  const keywords = axes.flatMap(a => a.values);

  return {
    detectedCategory: typeof parsed.detectedCategory === 'string' ? parsed.detectedCategory : 'unknown',
    brands,
    axes,
    keywords,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FALLBACK — AI 실패 시 빈 결과 (빈도 기반 fallback은 호출측에서)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function fallback(): SmartFilterOutput {
  return {
    detectedCategory: 'unknown',
    brands: [],
    axes: [],
    keywords: [],
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXECUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function generateSmartFilters(
  input: SmartFilterInput,
): Promise<PromptResult<SmartFilterOutput>> {
  return executePrompt<SmartFilterOutput>({
    config: CONFIG,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: buildUserMessage(input),
    fewShot: FEW_SHOT_EXAMPLES,
    fallback,
    parseOutput,
  });
}
