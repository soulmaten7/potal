# DIVISION_STATUS.md — POTAL AI Agent Organization v6 상세
# 마지막 업데이트: 2026-03-29 22:00 KST (CW22 — D5 가입 플로우 수정, D9 OAuth 프로필 수집, D12 FreeBanner 제거)
# 이 파일은 참조용. Division 상세 필요 시 읽는 파일.

## 16개 Division (책임 영역) — v6.1 기준 59 Agents
| # | Division | 담당 범위 | 인원(v6) | 핵심 파일 |
|---|----------|----------|---------|----------|
| D1 | Tariff & Compliance Engine | MFN/MIN/AGR 관세율, 63 FTA, RoO, 무역구제 119K건, 제재 스크리닝, 수출통제(ECCN/EAR) | **5** (+2) | lookup_duty_rate_v2(), tariff-api/ |
| D2 | Tax Engine | VAT/GST 240개국, de minimis, IOSS, DST, 12개국 특수세금, processing fee | 3 | GlobalCostEngine.ts, CostEngine.ts |
| D3 | HS Classification & Data Intelligence | v3 GRI Pipeline 21/21 Section 100%, codified-rules 595, 캐시 플라이휠, 이미지 분류 | **5** (+2) | gri-classifier/ |
| D4 | Data Pipeline & Regulations | 7개국 정부 API, MacMap/WITS 임포트, WDC 추출, 환율, 240개국 DB, 규정 수집/RAG | **5** (+2) | exchange-rate/, scripts/ |
| D5 | Product & Web | potal.app 전체: 랜딩, 가격표, 대시보드, Features 페이지, 로그인/가입, i18n 51개국어 UI, CWV | 3 | app/, components/ |
| D6 | Platform & Integrations | Shopify TEA, WooCommerce, BigCommerce, Magento, JS 위젯, DDP Quote | 3 | extensions/, plugins/ |
| D7 | API & AI Platform | ~155개 엔드포인트, OpenAPI, SDK 3종, rate limiting, MCP v1.4.0 9-field, AI 플랫폼(GPT/MCP/Gem) | **5** (+2) | tariff-api/, mcp-server/ |
| D8 | QA & Verification | 142기능 코드 감사(140 Active), API 응답 검증, 회귀 테스트 22/22, Spot Check, 심층 검증 84/84 | 3 | __tests__/ |
| D9 | Customer Acquisition & Success | 고객 지원, 온보딩, FAQ, 지식베이스, A/B/C그룹 타겟 전략, Enterprise Sales 자동화 | **4** (+1) | |
| D10 | Revenue & Billing | Paddle 6 Price, 구독 관리, overage 빌링, MRR/ARR/Churn | 3 | paddle.ts, plan-checker.ts |
| D11 | Infrastructure & Security | Vercel 배포, Supabase PostgreSQL, RLS, 모니터링, 보안, Auth | 3 | middleware.ts, supabase/ |
| D12 | Marketing & Partnerships | Content/SEO, 소셜 미디어, 이메일 캠페인, 파트너십(1400+), Product Hunt | **4** (+1) | marketing/ |
| D13 | Legal & Compliance | ToS, Privacy Policy, GDPR/CCPA, Enterprise 계약, 오픈소스 라이선스 | 3 | legal/ |
| D14 | Finance & Strategy | 비용 추적(Vercel $20/Supabase $25), 예산, 세무, 투자자 관계 | 3 | analysis/ |
| D15 | Intelligence & Market | 경쟁사 10사 모니터링, 무역법 변경, 시장 분석, 142기능 비교(140 Active), Features 페이지 경쟁사 비교표 | 3 | Competitor_Feature_Matrix.xlsx |
| D16 | Secretary (비서실) | Gmail 수신함 체크, POTAL 앱 채팅 문의(Crisp) 체크, 인바운드 분류/보고, 은태님 직접 보고 라인 | **2** (신설) | secretary/SKILL.md, Scheduled Task |

## 3 Layer 실행 모델
| Layer | 이름 | 실행 | 비용 |
|-------|------|------|------|
| Layer 1 | Automation | Vercel Cron, Paddle Webhook, Make.com, 앱 내장 로직 | 토큰 $0 |
| Layer 2 | Monitor | Morning Brief API + Division Checklists + Status Dashboard | 최소 토큰 |
| Layer 3 | Active | 15개 Division Agent Team 역할 카드 (agent-roles.ts) | 작업 시만 |

## Opus 사용 맵
- **상시 3곳**: Chief Orchestrator · D1 FTA/RoO 법률 해석 · D13 법률 문서
- **에스컬레이션 6곳**: D1 제재 · D4 규정 법률 · D8 정확도 · D11 보안 · D14 전략 · D15 경쟁
- 나머지 전부 Sonnet (Opus 3 + Sonnet 54)

## Escalation Flow
Layer 1 자동실행 → Layer 2 팀장 체크 → Layer 3 Agent Teams → Chief → 은태님
- 95% 자동 처리 / 4% Sonnet→Opus 에스컬레이션 / 1% 즉시 알림

## D16 Secretary (비서실) 상세
```
역할: 모든 인바운드 커뮤니케이션의 관문 — 감지 + 분류 + 보고만
보고 라인: 은태님에게 직접 (Chief와 별개)
실행 여부: ❌ 절대 혼자 판단/실행하지 않음

[자동 모드 — Scheduled Task, 매시간]
  Gmail 미읽은 메일 체크 → 분류 (긴급/중요/참고/스킵)
  Crisp 채팅 문의 체크 → 고객명 + 문의 요약
  새 건 있으면 → 텔레그램으로 은태님 보고
  새 건 없으면 → 보고 안 함 (불필요한 알림 방지)

[수동 모드 — 은태님 명령]
  "메일 확인해" → 전체 스캔 + 분류 보고
  "미응답 메일 골라줘" → 미답장 필터링
  "이 메일 답장 초안" → 초안 작성 (은태님 확인 후에만 발송)
  "지난 일주일 메일" → 기간별 검색

[흐름]
  D16 Secretary → 은태님 보고 (텔레그램)
       ↓
  은태님 판단
       ↓
  필요 시 → Chief에게 명령 → Division 실행
  불필요 시 → "확인" 끝
```

## 일일 운영 사이클
| Phase | 시점 | 내용 | 실행 주체 |
|-------|------|------|----------|
| Phase 0 | 새벽 (자동) | Layer 1: 환율, 관세 업데이트, webhook, health check | Vercel Cron |
| Phase 1 | 아침 5분 | Morning Brief — Yellow/Red만 보고 | Chief → 은태님 |
| Phase 2 | 오전 | Agent Teams 세션 A — Division 선택 후 실행 | 은태님 지시 → Chief |
| Phase 3 | 오후 | 로테이션 or 심화 | 은태님 판단 |
| Phase 4 | 마감 10분 | git push, session-context 업데이트 | 은태님 + Chief |

## 주간/월간
- **매주 월**: D4 관세율(Cron) · D14 KPI · D15 경쟁사 · D9 고객 · D13 규정
- **매월 1일**: D10 Overage 정산 · D14 로드맵 · D8 정확도 · D11 비용 · Chief 평가

## Division 세팅 현황 (Layer 1 자동화)
| Division | 상태 | 비고 |
|----------|------|------|
| D1 | ✅ | Vercel Cron 관세 동기화 + trade-remedy-sync 매주 월 06:30 |
| D2 | ✅ | 앱 내장 로직 (GlobalCostEngine) |
| D3 | ✅ | 앱 내장 로직 (ai-classifier) |
| D4 | ✅ | 환율 Cron + gov-api-health 매12시간 |
| D5 | ✅ | Vercel 자동 배포 + uptime-check 매6시간 |
| D6 | ✅ | Shopify Webhook + plugin-health 매12시간 |
| D7 | ✅ | plan-checker, rate-limiter 앱 내장 |
| D8 | ✅ | CI 테스트 + spot-check 매일 04:00 |
| D9 | ✅ | FAQ + Rich Snippets + Crisp + Enterprise Sales + lead-match Cron 매30분 + 글로벌 콜드이메일 ~400기업 캠페인 진행중 |
| D10 | ✅ | Paddle Webhook + Overage Cron + plan-checker |
| D11 | ✅ | Vercel CI/CD + health-check 매6시간 |
| D12 | ✅ | Make.com Welcome Email + LinkedIn 소셜공유 |
| D13 | ✅ | Google Calendar 법률 리뷰 3개 반복일정 |
| D14 | ✅ | POTAL_D14_Finance_Tracker.xlsx (3시트) |
| D15 | ✅ | competitor-scan 매주 월 08:00 + Intelligence Dashboard |
| D16 | ✅ | Cowork Scheduled Task 매시간 Gmail+Crisp 체크 → 텔레그램 보고 |

## Layer 2 Monitor
- **Morning Brief API**: `/api/v1/admin/morning-brief`
- **Division Checklists**: `app/lib/monitoring/division-checklists.ts`
- **Division Status Dashboard**: `/admin/division-status`

## Layer 3 Active
- **Agent Roles**: `app/lib/monitoring/agent-roles.ts`
- Division별: 팀장(Sonnet) + 멤버(2~3명) + 에스컬레이션 조건
- 전체: 16 팀장 + 43 멤버 = **59 Agents**

## 확장 패턴
Division 신설 → Sonnet 팀장 → Layer 1 (자동화) → Layer 2 (체크) → Layer 3 (역할 카드)

## 참조 문서
- 조직도: `POTAL_AI_Agent_Org_v6.html`
- 변경 로그: `POTAL_AI_Agent_Org_Log.xlsx`
- 엑셀 마스터: `POTAL_Excel_Master_Registry.xlsx`
