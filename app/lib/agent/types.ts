/**
 * POTAL Agent Orchestration — Core Types
 *
 * 에이전트 오케스트레이션의 핵심 타입 정의.
 *
 * 구조:
 *   Coordinator (지휘자)
 *     ├── AI Agents (LLM 호출, 판단이 필요한 작업)
 *     │   ├── QueryAgent       — 검색어 분석, 플랫폼별 검색어 생성
 *     │   ├── AnalysisAgent    — 상품 관련성 판단, 사기 의심 분석
 *     │   └── ExplanationAgent — 결과 설명 생성 (향후)
 *     │
 *     └── Tools (코드 실행, 결정적, 빠르고 무료)
 *         ├── FraudFilter      — 규칙 기반 사기 필터링
 *         ├── CostEngine       — Total Landed Cost 계산
 *         ├── ScoringEngine    — Best/Fastest/Cheapest 점수
 *         └── ProviderAPIs     — Amazon, Walmart 등 API 호출
 *
 * 왜 이 구분이 중요한가:
 *   - AI Agent: 호출당 비용 발생 ($0.001~0.01), 1~3초 지연, 하지만 "판단" 가능
 *   - Tool: 비용 $0, 10ms 이내, 하지만 정해진 로직만 실행
 *   - Coordinator가 상황에 따라 어떤 Agent/Tool을 호출할지 결정
 */

// ─── Agent Message Types ────────────────────────────

/** 에이전트 간 통신 메시지 */
export interface AgentMessage {
  role: 'coordinator' | 'agent' | 'tool' | 'user';
  content: string;
  /** 구조화된 데이터 (JSON) */
  data?: Record<string, unknown>;
  /** 메시지 발신자 */
  from: string;
  /** 메시지 수신자 */
  to: string;
  /** 타임스탬프 */
  timestamp: number;
}

// ─── Tool Definition ────────────────────────────────

/** Coordinator가 사용할 수 있는 도구 정의 */
export interface ToolDefinition {
  name: string;
  description: string;
  /** 도구 유형: deterministic(코드) vs ai(LLM 호출) */
  type: 'deterministic' | 'ai';
  /** 입력 파라미터 스키마 */
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
  /** 도구 실행 함수 */
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  /** 실행 시간 (ms) */
  duration?: number;
  /** AI 도구인 경우 토큰 사용량 */
  tokensUsed?: number;
}

// ─── Agent Definition ───────────────────────────────

/** AI 에이전트 정의 */
export interface AgentDefinition {
  name: string;
  description: string;
  /** 시스템 프롬프트 */
  systemPrompt: string;
  /** 이 에이전트가 사용할 수 있는 도구들 */
  tools: string[];
  /** 사용할 LLM 모델 */
  model: 'gpt-4o-mini' | 'gpt-4o' | 'claude-haiku' | 'claude-sonnet';
  /** 최대 토큰 */
  maxTokens: number;
  /** 타임아웃 (ms) */
  timeout: number;
}

// ─── Coordinator Types ──────────────────────────────

/** 검색 요청 컨텍스트 */
export interface SearchContext {
  /** 원본 사용자 쿼리 */
  originalQuery: string;
  /** 사용자 위치 (zipcode) */
  zipcode?: string;
  /** 마켓 필터 */
  market: 'all' | 'domestic' | 'global';
  /** 페이지 */
  page: number;
  /** 사용자 선호도 (price↔speed 슬라이더) */
  priceSpeedBalance?: number;
  /** 이전 검색 결과 (재검색/정제 시) */
  previousResults?: unknown[];
  /** 세션 히스토리 */
  sessionHistory?: AgentMessage[];
}

/** Coordinator의 판단 결과 */
export interface CoordinatorDecision {
  /** 다음에 실행할 단계 */
  nextStep: 'analyze_query' | 'search_providers' | 'filter_results' | 'score_results' | 'refine_search' | 'return_results';
  /** 실행할 도구/에이전트 */
  target: string;
  /** 파라미터 */
  params: Record<string, unknown>;
  /** 판단 이유 (디버깅용) */
  reasoning: string;
}

/** 파이프라인 실행 결과 (각 단계별 추적) */
export interface PipelineStep {
  step: string;
  agent: string;
  type: 'ai' | 'deterministic';
  input: unknown;
  output: unknown;
  duration: number;
  tokensUsed?: number;
  timestamp: number;
}

export interface PipelineResult {
  success: boolean;
  steps: PipelineStep[];
  totalDuration: number;
  totalTokensUsed: number;
  /** AI 비용 추정 ($) */
  estimatedCost: number;
}

// ─── Query Analysis (QueryAgent output) ─────────────

/** QueryAgent가 분석한 검색어 정보 */
export interface QueryAnalysis {
  /** 원본 쿼리 */
  original: string;
  /** 카테고리 추론 */
  category: string;
  /** 플랫폼별 최적화된 검색어 */
  platformQueries: {
    amazon: string;
    walmart?: string;
    ebay?: string;
    aliexpress?: string;
    temu?: string;
  };
  /** 가격 의도 감지 */
  priceIntent?: {
    min?: number;
    max?: number;
    currency: string;
  };
  /** 핵심 속성 (사이즈, 색상, 스펙 등) */
  attributes: Record<string, string>;
  /** 검색 전략 제안 */
  strategy: 'broad' | 'specific' | 'brand' | 'comparison';
  /** 신뢰도 (0-1) */
  confidence: number;
}

// ─── Product Analysis (AnalysisAgent output) ────────

/** AnalysisAgent의 상품 분석 결과 */
export interface ProductAnalysis {
  productId: string;
  /** 검색어와의 관련성 (0-100) */
  relevanceScore: number;
  /** 관련성 판단 이유 */
  relevanceReason: string;
  /** 사기 의심 수준 */
  fraudSuspicion: 'none' | 'low' | 'medium' | 'high';
  /** 사기 의심 이유 */
  fraudReasons?: string[];
  /** 동일 상품 그룹 ID (크로스 플랫폼 매칭) */
  sameProductGroupId?: string;
}
