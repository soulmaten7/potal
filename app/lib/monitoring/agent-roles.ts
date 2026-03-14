/**
 * Layer 3 Active — Agent Team Role Cards
 *
 * 15개 Division 각각의 Agent Team 구성:
 * - 팀장 (Sonnet): Division 운영 책임, Layer 2 체크리스트 실행
 * - 멤버 역할: Layer 3 프로젝트 실행 시 구성
 * - 에스컬레이션 조건: Sonnet → Opus 전환 기준
 *
 * Chief Orchestrator (Opus)가 Division 선택 → 팀장 지시 → 멤버 배분
 */

export type ModelTier = 'opus' | 'sonnet' | 'haiku';

export interface AgentRole {
  role: string;
  model: ModelTier;
  responsibilities: string[];
}

export interface EscalationRule {
  condition: string;
  action: string;
  targetModel: ModelTier;
}

export interface DivisionTeam {
  divisionId: string;
  name: string;
  leader: AgentRole;
  members: AgentRole[];
  escalation: EscalationRule[];
  /** Layer 3 프로젝트 예시 */
  projectExamples: string[];
}

export const DIVISION_TEAMS: DivisionTeam[] = [
  // ── D1: Tariff & Trade Rules ──
  {
    divisionId: 'D1',
    name: 'Tariff & Compliance Engine',
    leader: {
      role: 'Tariff Team Lead',
      model: 'sonnet',
      responsibilities: [
        'MFN/MIN/AGR 관세율 데이터 정합성 관리',
        '63개 FTA 적용 로직 감독',
        '무역구제 119K건 데이터 유지보수',
      ],
    },
    members: [
      { role: 'FTA/RoO Analyst', model: 'opus', responsibilities: ['FTA 원산지 규정 해석', '관세양허 조건 분석', '특혜관세 적용 판단'] },
      { role: 'Trade Remedy Researcher', model: 'sonnet', responsibilities: ['반덤핑/상계관세/세이프가드 데이터 수집', 'TTBD/WTO 소스 동기화', 'ECCN/Schedule B 분류'] },
      { role: 'Rate Validator', model: 'sonnet', responsibilities: ['lookup_duty_rate_v2() 결과 검증', '4단계 폴백(MIN→AGR→NTLC→WITS) 정확도 테스트', 'ICS2/Type86 통관 검증', '수출통제(EAR/ITAR) 검증'] },
    ],
    escalation: [
      { condition: 'FTA/RoO 해석 모호 — 법률 판단 필요', action: 'Opus FTA/RoO Analyst에게 에스컬레이션', targetModel: 'opus' },
      { condition: '제재 스크리닝 판단 필요', action: 'Opus 직접 분석', targetModel: 'opus' },
    ],
    projectExamples: ['신규 FTA 데이터 통합', 'lookup_duty_rate_v2() 검증 자동화', '제재/제한물품 DB 구축'],
  },

  // ── D2: Tax Engine ──
  {
    divisionId: 'D2',
    name: 'Tax Engine',
    leader: {
      role: 'Tax Engine Lead',
      model: 'sonnet',
      responsibilities: [
        'GlobalCostEngine 계산 정확도 관리',
        'VAT/GST 240개국 데이터 유지',
        'de minimis/IOSS/DST 로직 감독',
      ],
    },
    members: [
      { role: 'Tax Rule Developer', model: 'sonnet', responsibilities: ['12개국 특수세금 로직 구현', 'processing fee 계산 로직'] },
      { role: 'Tax Data Curator', model: 'sonnet', responsibilities: ['VAT/GST rate 업데이트', 'de minimis threshold 검증'] },
    ],
    escalation: [
      { condition: '복잡한 세금 계산 오류 — 다국적 교차 적용', action: 'Chief Orchestrator에게 보고', targetModel: 'opus' },
    ],
    projectExamples: ['신규 국가 특수세금 추가', 'IOSS 임계값 업데이트', 'processing fee 체계 개선'],
  },

  // ── D3: HS Classification & Data Intelligence ──
  {
    divisionId: 'D3',
    name: 'HS Classification & Data Intelligence',
    leader: {
      role: 'HS Classification Lead',
      model: 'sonnet',
      responsibilities: [
        'AI 분류기 성능 모니터링',
        'WDC→벡터→LLM 3단계 파이프라인 관리',
        '캐시 플라이휠 최적화',
      ],
    },
    members: [
      { role: 'ML Architect', model: 'opus', responsibilities: ['분류 모델 아키텍처 설계', '벡터 임베딩 최적화', '이미지 분류기 설계'] },
      { role: 'Data Pipeline Engineer', model: 'sonnet', responsibilities: ['WDC 상품명→HS 매핑 대량 처리', '카테고리 추출/정제', '가격 분기 규칙 적용'] },
    ],
    escalation: [
      { condition: '분류 정확도 90% 이하 하락', action: 'Opus ML Architect 투입', targetModel: 'opus' },
      { condition: '모델 아키텍처 변경 필요', action: 'Opus ML Architect 설계', targetModel: 'opus' },
    ],
    projectExamples: ['WDC 5.95억 상품 HS 매핑 파이프라인', '이미지 기반 HS 분류', '캐시 히트율 최적화'],
  },

  // ── D4: Data Pipeline & Regulations ──
  {
    divisionId: 'D4',
    name: 'Data Pipeline & Regulations',
    leader: {
      role: 'Data Pipeline Lead',
      model: 'sonnet',
      responsibilities: [
        '7개국 정부 API 연동 관리',
        'MacMap/WITS 데이터 임포트 감독',
        '환율 자동 업데이트 운영',
      ],
    },
    members: [
      { role: 'API Integrator', model: 'sonnet', responsibilities: ['정부 API 응답 파싱', 'API 변경 사항 대응', '새 데이터 소스 연동'] },
      { role: 'Regulations Collector', model: 'sonnet', responsibilities: ['대량 데이터 임포트 스크립트 작성/유지', '데이터 무결성 검증', '240개국 관세법/세법/무역규정 스크래핑', 'RAG 벡터 DB 인덱싱'] },
    ],
    escalation: [
      { condition: '정부 API 스펙 변경 — 파싱 로직 전면 수정', action: 'Chief에게 보고 후 Agent Team 배치', targetModel: 'opus' },
      { condition: '규정 문서 법률 해석 필요', action: 'Opus + D13 Legal 합동', targetModel: 'opus' },
    ],
    projectExamples: ['AGR 임포트 완료 후 검증', 'WDC 상품명 추출', '신규 정부 API 연동'],
  },

  // ── D5: Product & Web ──
  {
    divisionId: 'D5',
    name: 'Product & Web',
    leader: {
      role: 'Product Lead',
      model: 'sonnet',
      responsibilities: [
        'potal.app UI/UX 품질 관리',
        '50개국어 i18n 번역 관리',
        'Core Web Vitals 모니터링',
      ],
    },
    members: [
      { role: 'Frontend Developer', model: 'sonnet', responsibilities: ['React 컴포넌트 구현', '랜딩/가격표/대시보드 페이지'] },
      { role: 'i18n Specialist', model: 'sonnet', responsibilities: ['50개국어 번역 키 관리', '새 기능 번역 추가'] },
    ],
    escalation: [
      { condition: 'CWV 점수 급락 — 성능 최적화 필요', action: 'Chief에게 보고', targetModel: 'opus' },
    ],
    projectExamples: ['신규 페이지 개발', 'UI 리디자인', '성능 최적화'],
  },

  // ── D6: Platform & Integrations ──
  {
    divisionId: 'D6',
    name: 'Platform & Integrations',
    leader: {
      role: 'Platform Lead',
      model: 'sonnet',
      responsibilities: [
        'Shopify TEA 앱 심사/유지보수',
        'WooCommerce/BigCommerce/Magento 플러그인 관리',
        'JS 위젯 및 DDP Quote 기능 관리',
      ],
    },
    members: [
      { role: 'Plugin Developer', model: 'sonnet', responsibilities: ['이커머스 플러그인 코드 작성', '플랫폼별 API 연동'] },
      { role: 'Integration Engineer', model: 'sonnet', responsibilities: ['potal-widget.js 유지보수', 'DDP Quote 위젯 개선', '마켓플레이스 연동(marketplace_connections)', 'ERP 연동(QuickBooks/Xero, erp_connections)'] },
    ],
    escalation: [
      { condition: 'Shopify 앱 심사 리젝 — 정책 위반 대응', action: 'Chief + D13 Legal 공동 대응', targetModel: 'opus' },
    ],
    projectExamples: ['Shopify 앱 기능 추가', '신규 플랫폼 플러그인 개발', '위젯 v2 리팩토링'],
  },

  // ── D7: API & AI Platform ──
  {
    divisionId: 'D7',
    name: 'API & AI Platform',
    leader: {
      role: 'API Lead',
      model: 'sonnet',
      responsibilities: [
        '10+ API 엔드포인트 안정성 관리',
        'OpenAPI 문서 최신 유지',
        'SDK 3종(JS/Python/cURL) 버전 관리',
      ],
    },
    members: [
      { role: 'API Developer', model: 'sonnet', responsibilities: ['엔드포인트 구현/수정', 'rate limiting 로직', 'API 버전 관리', '/export, /classify/audit, /classify/batch, /validate, /ioss, /verify'] },
      { role: 'AI Platform Engineer', model: 'sonnet', responsibilities: ['SDK 코드 생성/업데이트', 'AI 플랫폼(GPT/MCP/Gem) 연동', 'MCP 서버 7개 도구', 'Gemini Gem 연동', 'AI 상담 봇'] },
    ],
    escalation: [
      { condition: 'API 보안 취약점 발견', action: 'D11 Infrastructure와 합동 대응, Opus 투입', targetModel: 'opus' },
    ],
    projectExamples: ['API v2 설계', 'MCP 서버 기능 확장', 'SDK 신규 언어 추가'],
  },

  // ── D8: QA & Verification ──
  {
    divisionId: 'D8',
    name: 'QA & Verification',
    leader: {
      role: 'QA Lead',
      model: 'sonnet',
      responsibilities: [
        '142기능 테스트 커버리지 관리',
        'Spot Check 8개 케이스 결과 분석',
        '정확도 메트릭 추적',
        '심층 검증 체계 운영',
      ],
    },
    members: [
      { role: 'Test Engineer', model: 'sonnet', responsibilities: ['테스트 케이스 작성/유지', '회귀 테스트 자동화', '엣지 케이스 발굴'] },
      { role: 'Accuracy Analyst', model: 'sonnet', responsibilities: ['계산 결과 교차 검증', '실제 관세 데이터와 비교'] },
    ],
    escalation: [
      { condition: 'Spot Check 실패율 20%+ — 정확도 이상', action: 'Opus Accuracy Analyst 투입, 근본 원인 분석', targetModel: 'opus' },
      { condition: '계산 로직 구조적 결함 의심', action: 'Chief에게 보고 + D2 Tax Engine 합동', targetModel: 'opus' },
    ],
    projectExamples: ['Spot Check 케이스 확장', '월간 정확도 리포트 자동화', 'E2E 테스트 구축'],
  },

  // ── D9: Customer Acquisition & Success ──
  {
    divisionId: 'D9',
    name: 'Customer Acquisition & Success',
    leader: {
      role: 'CS Lead',
      model: 'sonnet',
      responsibilities: [
        'FAQ 콘텐츠 관리 (현재 13항목)',
        'Crisp 채팅 응답 품질 관리',
        '고객 온보딩 프로세스 개선',
        'A/B/C그룹 타겟 고객 전략',
      ],
    },
    members: [
      { role: 'Content Writer', model: 'sonnet', responsibilities: ['FAQ 항목 작성/업데이트', '도움말 문서 작성', 'Rich Snippets 관리'] },
      { role: 'Support Agent', model: 'sonnet', responsibilities: ['Crisp 채팅 응대 규칙 설정', '고객 이슈 분류/에스컬레이션', '50개국어 다국어 CS', '전담 CSM(Enterprise)'] },
    ],
    escalation: [
      { condition: '고객 이탈률 급증 — 긴급 대응', action: 'Chief에게 보고, 원인 분석', targetModel: 'opus' },
    ],
    projectExamples: ['AI 챗봇 구축', '지식베이스 사이트 구축', '온보딩 이메일 시리즈'],
  },

  // ── D10: Revenue & Billing ──
  {
    divisionId: 'D10',
    name: 'Revenue & Billing',
    leader: {
      role: 'Billing Lead',
      model: 'sonnet',
      responsibilities: [
        'Paddle 6 Price 구독 관리',
        'Overage 빌링 정확도 확인',
        'MRR/ARR/Churn 메트릭 추적',
      ],
    },
    members: [
      { role: 'Billing Developer', model: 'sonnet', responsibilities: ['Paddle webhook 처리 로직', 'overage 계산/청구', 'plan-checker 유지보수'] },
      { role: 'Revenue Analyst', model: 'sonnet', responsibilities: ['매출 대시보드 구축', '코호트 분석', '요금제 최적화 제안'] },
    ],
    escalation: [
      { condition: '결제 실패 급증 또는 Paddle 장애', action: 'Chief에게 즉시 보고', targetModel: 'opus' },
    ],
    projectExamples: ['Volume Commit 요금제 구현', '매출 대시보드 구축', '결제 실패 재시도 로직'],
  },

  // ── D11: Infrastructure & Security ──
  {
    divisionId: 'D11',
    name: 'Infrastructure & Security',
    leader: {
      role: 'Infra Lead',
      model: 'sonnet',
      responsibilities: [
        'Vercel 배포 안정성 관리',
        'Supabase DB/Auth 모니터링',
        'health-check 매 6시간 결과 분석',
      ],
    },
    members: [
      { role: 'DevOps Engineer', model: 'sonnet', responsibilities: ['CI/CD 파이프라인 관리', 'Vercel 설정 최적화', 'DB 마이그레이션'] },
      { role: 'Security Analyst', model: 'sonnet', responsibilities: ['RLS 정책 검증', '취약점 스캔', '인증 로직 감사'] },
    ],
    escalation: [
      { condition: '보안 취약점 발견 — 즉시 대응', action: 'Opus Security Analyst 투입 + Chief 보고', targetModel: 'opus' },
      { condition: 'DB 다운 또는 데이터 손실 위험', action: 'Opus 직접 대응', targetModel: 'opus' },
    ],
    projectExamples: ['RLS 정책 전면 감사', 'DB 백업 자동화', '보안 헤더 강화'],
  },

  // ── D12: Marketing & Partnerships ──
  {
    divisionId: 'D12',
    name: 'Marketing & Partnerships',
    leader: {
      role: 'Marketing Lead',
      model: 'sonnet',
      responsibilities: [
        'Make.com 시나리오 운영 (Welcome Email, LinkedIn)',
        'SEO/Content 전략 실행',
        'Product Hunt 런칭 준비',
      ],
    },
    members: [
      { role: 'Content Creator', model: 'sonnet', responsibilities: ['블로그 포스트 작성', '소셜 미디어 콘텐츠', 'SEO 키워드 최적화'] },
      { role: 'Partnership Manager', model: 'sonnet', responsibilities: ['A/B 테스트 설계', '파트너십 리서치', '이메일 캠페인 관리', '파트너 에코시스템(1400+)'] },
    ],
    escalation: [
      { condition: '대규모 마케팅 캠페인 전략 수립', action: 'Chief에게 전략 검토 요청', targetModel: 'opus' },
    ],
    projectExamples: ['Product Hunt 런칭', 'SEO 콘텐츠 시리즈', '파트너사 연동 마케팅'],
  },

  // ── D13: Legal & Compliance ──
  {
    divisionId: 'D13',
    name: 'Legal & Compliance',
    leader: {
      role: 'Legal Lead',
      model: 'sonnet',
      responsibilities: [
        'ToS/Privacy Policy 최신 유지',
        'Google Calendar 법률 리뷰 3개 일정 관리',
        'GDPR/CCPA 준수 모니터링',
      ],
    },
    members: [
      { role: 'Legal Analyst', model: 'opus', responsibilities: ['법률 문서 검토/작성', 'Enterprise 계약 초안', '오픈소스 라이선스 감사'] },
      { role: 'Compliance Monitor', model: 'sonnet', responsibilities: ['GDPR/CCPA 체크리스트 실행', 'Shopify 심사 규정 준수'] },
    ],
    escalation: [
      { condition: '법률 분쟁 또는 규제 변경 대응', action: 'Opus Legal Analyst 직접 작성', targetModel: 'opus' },
      { condition: 'Enterprise 계약 협상', action: 'Opus Legal Analyst + Chief 공동', targetModel: 'opus' },
    ],
    projectExamples: ['DPA(데이터 처리 계약) 템플릿', 'Enterprise SLA 문서', 'GDPR 감사 리포트'],
  },

  // ── D14: Finance & Strategy ──
  {
    divisionId: 'D14',
    name: 'Finance & Strategy',
    leader: {
      role: 'Finance Lead',
      model: 'sonnet',
      responsibilities: [
        '월간 비용 추적 (Vercel $20/Supabase $25)',
        '예산 vs 실제 비교',
        '투자자 관계/보조금 리서치',
      ],
    },
    members: [
      { role: 'Financial Analyst', model: 'sonnet', responsibilities: ['비용 리포트 작성', 'API 비용 분석', 'ROI 계산'] },
      { role: 'Strategy Advisor', model: 'sonnet', responsibilities: ['보조금/투자 기회 리서치', '재무 전략 제안'] },
    ],
    escalation: [
      { condition: '전략적 재무 분석 필요 — 투자/인수 관련', action: 'Opus Strategy Advisor 투입', targetModel: 'opus' },
      { condition: '비용 급증 이상 탐지', action: 'Chief에게 보고', targetModel: 'opus' },
    ],
    projectExamples: ['비용 자동 수집 시스템 구축', '투자자 대시보드', '월간 재무 리포트 자동화'],
  },

  // ── D15: Intelligence & Market ──
  {
    divisionId: 'D15',
    name: 'Intelligence & Market',
    leader: {
      role: 'Intelligence Lead',
      model: 'sonnet',
      responsibilities: [
        '10개 경쟁사 주간 스캔 결과 분석',
        '147기능 비교 매트릭스 업데이트',
        '무역법 변경 모니터링',
      ],
    },
    members: [
      { role: 'Competitive Analyst', model: 'sonnet', responsibilities: ['경쟁사 가격/기능 변경 추적', '시장 점유율 분석'] },
      { role: 'Market Researcher', model: 'sonnet', responsibilities: ['무역법/관세 정책 변경 리서치', '신규 시장 기회 분석'] },
    ],
    escalation: [
      { condition: '경쟁사 신규 기능 출시 — 전략 대응 필요', action: 'Opus 경쟁 대응 전략 수립', targetModel: 'opus' },
      { condition: '주요 무역법 변경 — 비즈니스 영향 분석', action: 'Chief + D1 Tariff 합동 대응', targetModel: 'opus' },
    ],
    projectExamples: ['147기능 커버리지 유지 (현재 142/147 = 96.6%)', '경쟁사 대응 전략 문서', '시장 분석 리포트'],
  },
];

/** Opus 상시 사용 Division 목록 */
export const OPUS_ALWAYS_DIVISIONS = ['D1', 'D3', 'D13'] as const;

/** Opus 에스컬레이션 대상 Division 목록 */
export const OPUS_ESCALATION_DIVISIONS = ['D1', 'D4', 'D8', 'D11', 'D14', 'D15'] as const;

/** Division ID로 팀 정보 조회 */
export function getTeamByDivision(divisionId: string): DivisionTeam | undefined {
  return DIVISION_TEAMS.find(t => t.divisionId === divisionId);
}

/** 전체 에이전트 수 요약 */
export function getAgentSummary() {
  let totalLeaders = 0;
  let totalMembers = 0;
  let opusRoles = 0;
  let sonnetRoles = 0;

  for (const team of DIVISION_TEAMS) {
    totalLeaders++;
    if (team.leader.model === 'opus') opusRoles++;
    else sonnetRoles++;

    for (const member of team.members) {
      totalMembers++;
      if (member.model === 'opus') opusRoles++;
      else sonnetRoles++;
    }
  }

  return {
    divisions: DIVISION_TEAMS.length,
    leaders: totalLeaders,
    members: totalMembers,
    totalAgents: totalLeaders + totalMembers,
    opusRoles,
    sonnetRoles,
  };
}
