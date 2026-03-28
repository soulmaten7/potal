# D9~D15 Division 현황 분석 (v5 vs CW18 Current)

**작성일**: 2026-03-25 20:15 KST
**분석 범위**: D9(고객획득) ~ D15(인텔리전스)
**비교 기준**: v5(~14-16주 전) vs 현재 CW18 구현 상태

---

## 📊 분석 요약

CW18 현재 상태에서 v5(14-16주 전) 대비 **큰 변화**가 발생했습니다:

1. **3개 新 엑셀** 도입 (D9/D12/D15 트래킹)
2. **3개 新 소셜채널** (LinkedIn/Reddit/Instagram 자동화)
3. **enterprise-proposal 스킬** 신규 (D9 자동 제안 발송)
4. **Gmail/Chrome MCP** 통합 (Cowork에서 사용 가능)
5. **Morning Brief API + Cowork 스킬** 정식 운영

이에 따라 **멤버 역할 조정 필요**합니다.

---

## D9: Customer Acquisition & Success

### v5 팀 구성 (3명)
- **CS Lead (Sonnet)** — FAQ 관리, Crisp 운영, A/B/C 타겟
- **Content Writer (Sonnet)** — FAQ 작성, 도움말, Rich Snippets
- **Support Agent (Sonnet)** — Crisp 응답, 이슈 분류, 50개국어
- **Escalation**: CEO (이탈률 급증)

### 현재 구현 현황 (CW18)

**✅ Layer 1 자동화 완료**
- FAQ 13개 항목 ✅
- Google Rich Snippets ✅
- Crisp 채팅 위젯 ✅
- Enterprise Sales 자동화 (폼→API→DB→Resend→Telegram) ✅
- enterprise-lead-match Cron 매30분 ✅

**✅ 새로운 기능/도구 (CW18 신규)**
- `POTAL_D9_Customer_Acquisition.xlsx` (5시트)
  - 콜드이메일 시트 (회사/담당자/이메일/상태/발송일/응답일)
  - Enterprise Leads 시트 (자동 폼 수집)
  - Product Hunt 시트 (PH 활동 추적)
  - SMB 100 타겟 시트 (100개사 리스트)
  - D9 Dashboard (메트릭)
- enterprise-proposal 스킬 (Cowork에서 사용)
- 자동 리드 생성 → DB→Resend이메일→Telegram알림

### 주요 문제점
1. **콜드이메일 자동화 부재** — enterprise-proposal 스킬로만 존재, 자동 발송/추적 Cron 없음
2. **Enterprise Leads 폼** — 만들어졌지만 자동 엑셀 기록 로직이 명확하지 않음
3. **SMB 100 타겟 리스트** — 누가 계속 업데이트? (Cowork인지 Claude Code D9인지)

### 권장 조정사항

**멤버 구성 변경: 3명 → 4명**
1. **CS Lead (Sonnet)** — 변화 없음
   - FAQ/Crisp 운영, A/B/C 타겟 전략
2. **Enterprise Lead Generator (Sonnet)** ← **신규 추가**
   - Enterprise Leads 엑셀 관리
   - enterprise-proposal 스킬 운영
   - 콜드이메일 캠페인 자동화 구축 (Cron화)
   - enterprise-lead-match Cron 모니터링
   - 응답률 추적 및 리포트
3. **Content Writer (Sonnet)** — 변화 없음
4. **Support Agent (Sonnet)** — 변화 없음

**Escalation 규칙**
- 이탈률 급증 → Opus Chief (기존대로)
- 콜드이메일 응답률 <5% → Opus Chief (전략 재검토 필요)

---

## D10: Revenue & Billing

### v5 팀 구성 (3명)
- **Billing Lead (Sonnet)** — Paddle 구독, Overage, MRR/ARR/Churn
- **Billing Developer (Sonnet)** — Paddle webhook, overage 계산
- **Revenue Analyst (Sonnet)** — 매출 대시보드, 코호트, Revenue Share
- **Escalation**: Opus (결제 실패, Paddle 장애)

### 현재 구현 현황 (CW18)

**✅ Layer 1 자동화 완료**
- Paddle 6 Price 구독 관리 ✅
- Overage 빌링 자동화 ✅
- plan-checker 유지보수 ✅
- Paddle Webhook 처리 ✅
- overage-billing Cron (매월 1일) ✅

**✅ 새로운 도구**
- `POTAL_D10_Revenue_Billing.xlsx` (신규, CW18)
- Division Log 시트 (엑셀 트래킹)

### 주요 문제점
1. **POTAL_D10_Revenue_Billing.xlsx** 구조/내용 미확인 (파일 접근 제한?)
2. **MRR/ARR/Churn 자동 계산** — 대시보드 구현 현황 불명확
3. **Revenue Share 로직** — v5에 언급되지만 현재 구현 상태 불명

### 권장 조정사항

**멤버 구성 유지: 3명 (변화 없음)**
- 다만 엑셀 자동 기록 규칙 명확화 필요

**추가 요구사항**
1. POTAL_D10_Revenue_Billing.xlsx 정확한 구조 문서화
2. MRR/ARR/Churn 대시보드 자동 계산 로직 확인
3. Revenue Share 정책 확정 (currently unclear)
4. Paddle API → 엑셀 자동 동기화 스크립트

---

## D11: Infrastructure & Security

### v5 팀 구성 (3명)
- **Infra Lead (Sonnet)** — Vercel, Supabase, Cron 모니터링
- **DevOps Engineer (Sonnet)** — CI/CD, Vercel 설정, DB 마이그레이션
- **Security Analyst (Sonnet)** — RLS, 취약점, 인증, API key 보안
- **Escalation**: Opus (보안 취약점, DB 다운)

### 현재 구현 현황 (CW18)

**✅ Layer 1 자동화 완료**
- Vercel CI/CD ✅
- health-check 매6시간 ✅ (DB/API/Auth/데이터 모니터링)
- Cron 24개 운영 중 ✅
- RLS 정책 검증 ✅

**✅ 새로운 도구/기능 (CW10 이후)**
- Division Status Dashboard (`/admin/division-status`) ✅
- health_check_logs 테이블 ✅
- auto-remediation.ts (Layer 1 Cron 3회 재시도+로깅) ✅
- issue-classifier.ts (15 Division 자동 분류) ✅

### 현재 상태
- **매우 안정적** — 매 6시간 health check 통과
- **자동화도 높음** — 대부분 Cron으로 자동 처리
- **모니터링** — Morning Brief에서 Yellow/Red만 보고

### 권장 조정사항

**멤버 구성 유지: 3명 (변화 없음)**

**선택 사항: Monitoring Specialist (Sonnet) 추가**
- health_check_logs 분석 + 리포트 자동화
- auto-remediation 결과 상세 로깅
- Morning Brief "Yellow/Red" 자동 추출
- 추천: **당분간 보류 (현 팀장이 커버 가능)**

---

## D12: Marketing & Partnerships

### v5 팀 구성 (3명)
- **Marketing Lead (Sonnet)** — Make.com, SEO/Content, Product Hunt, 파트너
- **Content Creator (Sonnet)** — 블로그/소셜, SEO, 이메일
- **Partnership Manager (Sonnet)** — 물류사 리서치, A그룹 타겟, Revenue Share
- **Escalation**: CEO (대규모 파트너십)

### 현재 구현 현황 (CW18 10차 기준)

**✅ Layer 1 자동화 완료**
- Make.com Welcome Email + LinkedIn 시나리오 ✅
- competitor-scan Cron 매주 월 08:00 ✅

**✅ 새로운 기능 (2026-03-25 CW18 10차 신규)**
- `POTAL_D12_Marketing_Partnerships.xlsx` (7시트)
  - LinkedIn 시트 (첫 포스트 1개 완료)
  - Reddit 시트 (r/ecommerce 댓글 6개)
  - Instagram 시트 (@potal_official 비즈니스 프로필)
  - SEO Blog 시트 (B2B 리라이트 6포스트)
  - 채널 TODO 시트 (작업 추적)
  - 파트너십 시트
  - D12 Dashboard
- LinkedIn/Reddit/Instagram 채널 자동화 시작
- SEO Blog B2B 전환 (3개 기존 + 3개 신규 = 6포스트)
- sitemap +5 URLs 추가

### 주요 문제점
1. **소셜 자동화** — 현재 대부분 수동 (LinkedIn/Reddit 매번 손으로 작성)
2. **Make.com 시나리오** — "Welcome Email + LinkedIn 공유" 설정되어 있지만 실제 동작 검증 필요
3. **파트너십 1400+** — 엑셀에 자동 기록되는지 불명확
4. **콘텐츠 일정** — 어디서 관리? (아마도 Cowork 또는 엑셀)

### 권장 조정사항

**멤버 구성 변경: 3명 → 4명**
1. **Marketing Lead (Sonnet)** — 변화 없음
   - Make.com, Product Hunt, 전략 감독
2. **SEO & Blog Manager (Sonnet)** ← 기존 Content Creator 재명명
   - SEO 블로그 관리 (현재 6포스트, 지속적 확장)
   - sitemap/JSON-LD 유지보수
3. **Social Media Manager (Sonnet)** ← **신규 추가**
   - LinkedIn 주간 1-2개 포스트 작성/발행
   - Reddit r/ecommerce 댓글 유지 (관세/배송 주제)
   - Instagram @potal_official 일일 활동 (스토리/피드)
   - 소셜 채널 성장률 추적
4. **Partnership Manager (Sonnet)** — 변화 없음
   - 물류사/마켓플레이스 파트너십
   - Revenue Share 계약

**모델 제안**
- Social Media Manager → **Haiku 검토도 가능** (이유: 소셜 포스트는 반복적, Sonnet 오버스펙)
- 다만 D12 팀장이 Sonnet이므로 일관성 유지 → **Sonnet 권장**

**Escalation 규칙**
- 대규모 파트너 (DHL/Walmart 등) → Opus Chief

---

## D13: Legal & Compliance

### v5 팀 구성 (2 + Opus)
- **Legal Lead (Sonnet)** — ToS/Privacy, 법률 리뷰, GDPR/CCPA
- **Legal Analyst (Opus)** — 법률 문서, Enterprise 계약, 라이선스
- **Compliance Monitor (Sonnet)** — GDPR 체크, Shopify 규정, e-Invoice
- **Escalation**: Opus (법률 분쟁, 계약)

### 현재 구현 현황 (CW18)

**✅ Layer 1 자동화**
- Google Calendar 법률 리뷰 3개 반복일정 ✅

**❓ Enterprise 계약 자동화**
- v5에 언급되지만 현재 상태 불명

### 현재 상태
- **안정적** — Google Calendar 규칙이 명확함
- **다만 E-Invoice** (EU/Latam) 같은 신규 규정 대응 속도 불명

### 권장 조정사항

**멤버 구성 유지: 2 + Opus (변화 없음)**
- Legal Lead는 팀장 역할만, 실제 고난도 작업은 Legal Analyst(Opus)

**추가 요청**
1. E-Invoice 규정 (EU/Latam) 대응 로드맵 작성
2. Enterprise SLA 템플릿 자동화
3. GDPR/CCPA 연간 체크리스트 자동화

---

## D14: Finance & Strategy

### v5 팀 구성 (3명)
- **Finance Lead (Sonnet)** — 월간 비용, 예산, 투자자, 보조금
- **Financial Analyst (Sonnet)** — 비용/매출 리포트, ROI, KPI
- **Strategy Advisor (Sonnet)** — 보조금/투자, 시장 규모, 수익 모델
- **Escalation**: Opus (전략 재무, 비용 급증)

### 현재 구현 현황 (CW18)

**✅ 자동화 완료**
- `POTAL_D14_Finance_Tracker.xlsx` (3시트)
  - Monthly Costs 시트 (Vercel $20/Supabase $25)
  - Revenue 시트
  - Division Log 시트 (엑셀 트래킹)
- Vercel Cron 비용 추적 ✅
- Supabase 비용 추적 ✅

### 주요 문제점
1. **비용 자동 수집** — Vercel/Supabase API → 엑셀 자동 동기화 현황 불명확
2. **MRR/ARR 계산** — 자동화인지 수동인지 불명
3. **예산 vs 실제** — 자동 비교 로직 있는지 불명

### 권장 조정사항

**멤버 구성 유지: 3명 (변화 없음)**

**추가 요구사항 (우선순위 1)**
1. **Vercel API Billing** 자동 수집 스크립트 작성
2. **Supabase Billing** 자동 수집 스크립트 작성
3. **POTAL_D14_Finance_Tracker.xlsx** 자동 업데이트 (매월 1일 Cron)
4. **Monthly Costs + Revenue** 계산 로직 명확화
5. **예산 vs 실제** 편차 분석 자동화

---

## D15: Intelligence & Market

### v5 팀 구성 (3명)
- **Intelligence Lead (Sonnet)** — 경쟁사 스캔, 147기능 비교, 무역법 변경
- **Competitive Analyst (Sonnet)** — 가격/기능 추적, 시장 점유율
- **Market Researcher (Sonnet)** — 무역법/관세 정책 변경, 신규 기회
- **Escalation**: Opus (경쟁 대응, 무역법)

### 현재 구현 현황 (CW18)

**✅ Layer 1 자동화 완료**
- competitor-scan Cron 매주 월 08:00 ✅ (10개 경쟁사 사이트 모니터링)
- Intelligence Dashboard `/admin/intelligence` ✅

**✅ 새로운 기능 (CW18 신규)**
- `POTAL_D15_Intelligence_Market.xlsx` (5시트)
  - 경쟁사변동이력 (10개 경쟁사 변동 추적)
  - 경쟁사별현황
  - 시장동향
  - Cron스캔결과 (매주 월 업데이트)
  - D15 Dashboard

### 주요 문제점
1. **경쟁사 변동 감지** — Cron이 실행되지만 엑셀에 자동 기록인지 수동인지 불명
2. **무역법 변경 모니터링** — 현재는 D4에서만 관리, D15와 협업 규칙 불명
3. **147기능 비교 매트릭스** — 언제 업데이트? (분기? 월?)

### 권장 조정사항

**멤버 구성 유지: 3명 (변화 없음)**
- 다만 Market Researcher 역할명 명확화

**추가 자동화 (우선순위 2)**
1. competitor-scan Cron 결과 → POTAL_D15_Intelligence_Market.xlsx 자동 기록
2. 무역법 변경 피드 (D4와 통합) → D15도 모니터링
3. 147기능 커버리지 자동 계산 (현재 142/147 = 96.6%)

**Escalation 규칙**
- 경쟁사 신기능 출시 (기능 커버리지 하락 위험) → Opus Chief
- 주요 무역법 변경 (비즈니스 영향) → Opus Chief + D1 FTA Analyst 합동

---

## 📋 전체 멤버 조정 요약

| Division | v5 | 현재 | 추천 변경 | 모델 조정 | 우선순위 |
|----------|----|----|--------|---------|---------|
| **D9** | 3명 | 3명 | **+1 (Enterprise Lead Generator)** | Sonnet | P1 |
| **D10** | 3명 | 3명 | 유지 (엑셀 자동화 명확화) | 변경없음 | P2 |
| **D11** | 3명 | 3명 | 선택: +1 (Monitoring) | Sonnet옵션 | P3 |
| **D12** | 3명 | 3명 | **+1 (Social Media Manager)** | Sonnet | P1 |
| **D13** | 2+Opus | 2+Opus | 유지 | 변경없음 | P2 |
| **D14** | 3명 | 3명 | 유지 (비용자동화) | 변경없음 | P1 |
| **D15** | 3명 | 3명 | 유지 (엑셀자동기록) | 변경없음 | P2 |

### 신규 멤버 추가 (총 2-3명)
1. **D9 Enterprise Lead Generator (Sonnet)** — 콜드이메일 자동화
2. **D12 Social Media Manager (Sonnet)** — 소셜 채널 자동화
3. **D11 Monitoring Specialist (Sonnet)** ← 선택 (현재는 보류)

### Opus 사용 현황 (변경 없음)
- **상시 4곳**: Chief Orchestrator + D1 FTA/RoO + D3 ML Architect + D13 Legal Analyst
- **에스컬레이션 6곳**: D1 제재 + D4 규정 + D8 정확도 + D11 보안 + D14 전략 + D15 경쟁

---

## ⚠️ 개선 필요 항목 (우선순위)

### 우선순위 1 (Critical — 즉시 필요)
1. **D9 콜드이메일 자동화** — enterprise-proposal 스킬 → 자동 발송 Cron화 + 응답 추적
2. **D12 소셜 자동화** — LinkedIn/Reddit 자동 작성 및 발행 (Make.com 또는 별도 Cron)
3. **D14 비용 자동 수집** — Vercel/Supabase API → 엑셀 자동 동기화 (매월 1일)

### 우선순위 2 (High — 다음 주)
1. **D10 MRR/ARR/Churn 대시보드** — 자동 계산 로직 구현
2. **D15 경쟁사 변동 감지** → 엑셀 자동 기록
3. **D13 E-Invoice 규정 대응** — 로드맵 작성

### 우선순위 3 (Medium — 이번 달)
1. **D11 Monitoring Specialist 신규 멤버** (선택, 현재 보류)
2. **Division 메트릭 자동 집계** (Morning Brief 강화)
3. **D15 무역법 변경 모니터링** (D4와 통합)

---

## 🧠 최종 권장사항

### 1. 즉시 추가할 멤버 (2명)
- **D9: Enterprise Lead Generator (Sonnet)**
  - 역할: 콜드이메일 자동화, Enterprise Leads 엑셀 관리, 응답률 추적
- **D12: Social Media Manager (Sonnet)**
  - 역할: LinkedIn/Reddit/Instagram 일일 운영, 소셜 자동화 강화

### 2. 자동화 구현 로드맵
1. **Week 1**: D9 콜드이메일 Cron + D12 소셜 포스트 자동 스케줄
2. **Week 2**: D14 비용 자동 수집 (Vercel API)
3. **Week 3**: D10 MRR/ARR/Churn 대시보드 + D15 엑셀 자동 기록
4. **Week 4**: D13 E-Invoice 규정 정리

### 3. 모델 최적화
- **신규 멤버**: 모두 **Sonnet** 권장 (초기 자동화는 Sonnet, Opus는 판단용)
- **D11 Monitoring Specialist** (선택): **Haiku 검토도 가능** (Log 분석)
- **나머지**: **변경 없음**

### 4. Opus 에스컬레이션 패턴 강화
- D9: 콜드이메일 응답률 <5% → Chief
- D12: 대규모 파트너 전략 → Chief
- D14: 비용 급증 (월 +50% 이상) → Chief
- D15: 경쟁사 기능 넘어감 (142/147 → 143+) → Chief

---

## 참고: 새로운 도구/기능 목록

| 도구 | 도입시점 | 담당 Division | 상태 |
|------|--------|-------------|------|
| POTAL_D9_Customer_Acquisition.xlsx | CW18 | D9 | ✅ |
| POTAL_D10_Revenue_Billing.xlsx | CW18 | D10 | ✅ |
| POTAL_D12_Marketing_Partnerships.xlsx | CW18 10차 | D12 | ✅ |
| POTAL_D14_Finance_Tracker.xlsx | CW18 | D14 | ✅ |
| POTAL_D15_Intelligence_Market.xlsx | CW18 | D15 | ✅ |
| enterprise-proposal 스킬 | CW18 | D9 | ✅ (Cowork) |
| Division Status Dashboard | CW10 | D11 | ✅ |
| Morning Brief API | CW10 | Chief | ✅ |
| Gmail MCP | CW18 | Cowork | ✅ |
| Chrome MCP | CW18 | Cowork | ✅ |
| auto-remediation.ts | CW10 | D11 | ✅ |
| issue-classifier.ts | CW10 | D11 | ✅ |

---

## 파일 위치
- **분석 문서**: `/sessions/peaceful-dreamy-gauss/mnt/portal/docs/D9-D15_Division_Analysis_v5_vs_CW18.md`
- **Agent Roles 정의**: `/sessions/peaceful-dreamy-gauss/mnt/portal/app/lib/monitoring/agent-roles.ts`
- **D9 엑셀**: `/sessions/peaceful-dreamy-gauss/mnt/portal/POTAL_D9_Customer_Acquisition.xlsx`
- **D12 엑셀**: `/sessions/peaceful-dreamy-gauss/mnt/portal/POTAL_D12_Marketing_Partnerships.xlsx`
- **D15 엑셀**: `/sessions/peaceful-dreamy-gauss/mnt/portal/POTAL_D15_Intelligence_Market.xlsx`
