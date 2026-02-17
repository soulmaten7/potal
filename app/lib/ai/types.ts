/**
 * ══════════════════════════════════════════════════════════════
 * POTAL AI Module System — Type Definitions
 * ══════════════════════════════════════════════════════════════
 *
 * 이 파일은 POTAL의 AI 모듈 시스템에서 사용하는 모든 타입을 정의합니다.
 * 모든 프롬프트 모듈과 엔진이 이 타입을 공유합니다.
 *
 * 아키텍처: Prompt Module Pattern
 * - 각 AI 기능은 독립적인 프롬프트 모듈
 * - 모듈 수정이 다른 모듈에 영향을 주지 않음
 * - 프롬프트 = Configuration, 엔진 = Execution (분리)
 * ══════════════════════════════════════════════════════════════
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Prompt Module Config — 각 프롬프트 모듈의 설정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PromptModuleConfig {
  /** 모듈 고유 ID (예: 'intent-router', 'smart-filter') */
  id: string;
  /** 버전 (프롬프트 변경 시 버전 업) */
  version: string;
  /** 모듈 설명 (한국어/영어) */
  description: string;
  /** OpenAI 모델 */
  model: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';
  /** 창의성 레벨 (0 = 결정적, 1 = 자유로움) */
  temperature: number;
  /** 최대 출력 토큰 */
  maxTokens: number;
  /** 타임아웃 (ms) — 초과 시 fallback 실행 */
  timeoutMs: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Prompt Execution Result — AI 실행 결과
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PromptResult<T> {
  /** 성공 여부 */
  ok: boolean;
  /** AI 결과 데이터 (성공 시) */
  data: T;
  /** 실행 메타데이터 */
  meta: {
    /** 사용된 프롬프트 모듈 ID */
    moduleId: string;
    /** 소요 시간 (ms) */
    durationMs: number;
    /** 토큰 사용량 */
    tokensUsed: { input: number; output: number; total: number };
    /** 예상 비용 (USD) */
    estimatedCost: number;
    /** fallback 사용 여부 */
    usedFallback: boolean;
    /** 에러 메시지 (fallback 사용 시) */
    error?: string;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Intent Router — 쿼리 의도 분류
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type QueryIntent =
  | 'PRODUCT_SPECIFIC'    // "iPhone 15 Pro Max 256GB" — 특정 상품
  | 'PRODUCT_CATEGORY'    // "camping tent" — 카테고리 탐색 (가장 일반적)
  | 'COMPARISON'          // "iPhone vs Samsung" — 상품/브랜드 비교
  | 'QUESTION'            // "what tent for camping?" — 질문/탐색
  | 'PRICE_HUNT';         // "cheapest earbuds under $50" — 가격 중심

export interface IntentRouterInput {
  query: string;
}

export interface IntentRouterOutput {
  /** 분류된 의도 */
  intent: QueryIntent;
  /** 분류 확신도 (0~1) */
  confidence: number;
  /** 정제된 검색 쿼리 (의도/수식어 제거) */
  searchQuery: string;
  /** 추출된 속성 (색상, 크기, 소재 등) */
  attributes: string[];
  /** 가격 의도 (있는 경우) */
  priceSignal: {
    type: 'budget' | 'mid' | 'premium' | 'exact';
    maxPrice?: number;
    minPrice?: number;
  } | null;
  /** 질문형: 추천 카테고리 리스트 */
  suggestedCategories: string[] | null;
  /** 비교형: 비교 대상들 */
  comparisonTargets: string[] | null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. Smart Filter — AI 스마트 필터 제안
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SmartFilterInput {
  query: string;
  titles: string[];
}

/** 구매 결정 축 — Related 섹션의 그룹 단위 */
export interface FilterAxis {
  /** 축 이름: 값들이 공유하는 대표 단어 (예: "Person", "Type", "Features") */
  name: string;
  /** 해당 축의 구체적인 값들 (예: ["1-Person", "2-Person", "4-Person"]) */
  values: string[];
}

export interface SmartFilterOutput {
  /** AI가 판단한 상품 카테고리 */
  detectedCategory: string;
  /** AI가 추출한 브랜드 (빈도 기반이 아닌 AI 판단) */
  brands: string[];
  /** 구매 결정 축별로 그룹화된 필터 키워드 */
  axes: FilterAxis[];
  /** @deprecated — 하위호환용. axes 구조 사용 권장 */
  keywords: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. Query Enhancer — 플랫폼별 쿼리 최적화
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type RetailerPlatform =
  | 'amazon' | 'walmart' | 'bestbuy' | 'ebay' | 'target'
  | 'aliexpress' | 'temu' | 'shein';

export interface QueryEnhancerInput {
  query: string;
  intent: QueryIntent;
  attributes: string[];
}

export interface QueryEnhancerOutput {
  /** 플랫폼별 최적화된 검색 쿼리 */
  platformQueries: Record<RetailerPlatform, string>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. Product Judge — 상품 관련성/품질 판단
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ProductJudgeInput {
  query: string;
  products: Array<{
    id: string;
    name: string;
    price: string;
    site: string;
  }>;
}

export interface ProductJudgeOutput {
  /** 관련 상품 ID 목록 (비관련 상품 제거됨) */
  relevantIds: string[];
  /** 제거된 상품과 이유 */
  removedReasons: Array<{ id: string; reason: string }>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. Few-Shot Example — 프롬프트 내 예시
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FewShotExample {
  /** 사용자 입력 */
  user: string;
  /** 기대 출력 (JSON string) */
  assistant: string;
}
