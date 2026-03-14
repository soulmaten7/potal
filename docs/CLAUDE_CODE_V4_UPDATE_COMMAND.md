# Claude Code v4 업데이트 명령어
> 2026-03-14 04:30 KST — Cowork에서 생성

## 명령어 1: agent-roles.ts v4 업데이트 (Claude Code 터미널 1에 복붙)

```
CLAUDE.md 읽고 app/lib/monitoring/agent-roles.ts 파일을 v4에 맞게 업데이트해줘.

변경 사항:
1. Division 이름 변경:
   - D1: 'Tariff & Trade Rules' → 'Tariff & Compliance Engine'
   - D3: 'HS Classification' → 'HS Classification & Data Intelligence'
   - D4: 'Data Pipeline' → 'Data Pipeline & Regulations'
   - D5: Product & Web — leader responsibilities: '30개국어' → '50개국어'
   - D6: 'Platform & Plugins' → 'Platform & Integrations'
   - D7: 'API & Developer' → 'API & AI Platform'
   - D7: leader responsibilities: '7개 API 엔드포인트' → '10+ API 엔드포인트', SDK '(JS/Python/Ruby)' → '(JS/Python/cURL)'
   - D8: 'QA & Accuracy' → 'QA & Verification'
   - D8: leader responsibilities: '448건 테스트 스위트' → '142기능 테스트 커버리지', '심층 검증 체계 운영' 추가
   - D9: 'Customer Success' → 'Customer Acquisition & Success'
   - D9: leader responsibilities에 'A/B/C그룹 타겟 고객 전략' 추가, members에 '50개국어 다국어 CS', '전담 CSM(Enterprise)' 추가
   - D12: 'Marketing & Growth' → 'Marketing & Partnerships'
   - D12: members에 '파트너 에코시스템(1400+)' 추가, 'Growth Hacker' → 'Partnership Manager'
   - D14: 'Finance' → 'Finance & Strategy'
   - D15: 'Intelligence' → 'Intelligence & Market'
   - D15: leader responsibilities: '47기능 비교 매트릭스' → '147기능 비교 매트릭스'
   - D15: projectExamples: '47기능 Phase 1 (크리티컬 갭 6개) 구현' → '147기능 커버리지 유지 (현재 142/147 = 96.6%)'

2. D1 members 업데이트:
   - Rate Validator responsibilities에 'ICS2/Type86 통관 검증', '수출통제(EAR/ITAR) 검증' 추가
   - Trade Remedy Researcher responsibilities에 'ECCN/Schedule B 분류' 추가

3. D3 members 업데이트:
   - 'Data Labeler' → 'Data Pipeline Engineer'
   - responsibilities: 'WDC 상품명→HS 매핑 대량 처리', '카테고리 추출/정제', '가격 분기 규칙 적용' 으로 변경

4. D4 members 업데이트:
   - 'Import Engineer' → 'Regulations Collector'
   - responsibilities에 '240개국 관세법/세법/무역규정 스크래핑', 'RAG 벡터 DB 인덱싱' 추가

5. D5: i18n Specialist responsibilities '30개국어' → '50개국어'

6. D6 members:
   - 'Widget Engineer' → 'Integration Engineer'
   - responsibilities에 '마켓플레이스 연동(marketplace_connections)', 'ERP 연동(QuickBooks/Xero, erp_connections)' 추가

7. D7 members:
   - 'SDK Developer' → 'AI Platform Engineer'
   - responsibilities에 'MCP 서버 7개 도구', 'Gemini Gem 연동', 'AI 상담 봇' 추가
   - API Developer responsibilities에 '/export, /classify/audit, /classify/batch, /validate, /ioss, /verify' 추가

8. D4에 에스컬레이션 조건 추가: { condition: '규정 문서 법률 해석 필요', action: 'Opus + D13 Legal 합동', targetModel: 'opus' }

9. OPUS_ESCALATION_DIVISIONS에 'D4' 추가: ['D1', 'D4', 'D8', 'D11', 'D14', 'D15']

빌드 확인 후 완료 보고. 5개 문서 업데이트는 하지 마.
```

## 명령어 2: division-checklists.ts v4 업데이트 (Claude Code 터미널 1에 복붙)

```
app/lib/monitoring/division-checklists.ts 파일을 v4에 맞게 업데이트해줘.

변경 사항:
1. Division 이름 변경 (agent-roles.ts와 동일):
   - D1: 'Tariff & Trade Rules' → 'Tariff & Compliance Engine'
   - D3: 'HS Classification' → 'HS Classification & Data Intelligence'
   - D4: 'Data Pipeline' → 'Data Pipeline & Regulations'
   - D6: 'Platform & Plugins' → 'Platform & Integrations'
   - D7: 'API & Developer' → 'API & AI Platform'
   - D8: 'QA & Accuracy' → 'QA & Verification'
   - D9: 'Customer Success' → 'Customer Acquisition & Success'
   - D12: 'Marketing & Growth' → 'Marketing & Partnerships'
   - D14: 'Finance' → 'Finance & Strategy'
   - D15: 'Intelligence' → 'Intelligence & Market'

2. D3에 체크 추가:
   { id: 'd3-wdc-mapping', label: 'WDC 상품명 매핑 파이프라인 정상', source: 'health_check_logs' }
   { id: 'd3-vector-count', label: 'hs_classification_vectors 1,023건+', source: 'health_check_logs' }

3. D4에 체크 추가:
   { id: 'd4-regulation-collection', label: '240개국 규정 수집 진행', source: 'manual' }

4. D7에 체크 추가:
   { id: 'd7-mcp-server', label: 'MCP 서버 7개 도구 정상', source: 'app_builtin' }

5. D9에 체크 추가:
   { id: 'd9-customer-count', label: '고객 가입/사용량 추적', source: 'health_check_logs' }

빌드 확인 후 완료 보고.
```

## 명령어 3: issue-classifier.ts v4 업데이트 (Claude Code 터미널 1에 복붙)

```
app/lib/monitoring/issue-classifier.ts 파일을 v4에 맞게 업데이트해줘.

변경 사항:
1. D3에 규칙 추가:
   { pattern: /WDC|mapping|매핑|vector/i, layer: 2, recommendation: 'Check WDC mapping pipeline and vector count', autoRemediable: false }

2. D4에 규칙 추가:
   { pattern: /regulation|규정.*수집|RAG/i, layer: 2, recommendation: 'Check regulation collection progress', autoRemediable: false }

3. D9에 규칙 추가:
   { pattern: /customer.*count|가입|churn|이탈/i, layer: 2, recommendation: 'Review customer metrics', autoRemediable: false }
   { pattern: /enterprise|영업|partnership/i, layer: 3, recommendation: 'Enterprise customer or partnership deal — CEO decision required', autoRemediable: false }

4. D7에 규칙 추가:
   { pattern: /MCP|mcp.*server/i, layer: 2, recommendation: 'Check MCP server health', autoRemediable: false }

빌드 확인 후 완료 보고.
```

## 명령어 4: 24/7 자동 모니터링 루프 구현 (Claude Code 터미널 1에 복붙)

```
CLAUDE.md 읽고 24/7 자동 모니터링 시스템을 구현해줘.

=== 1단계: division-monitor API 엔드포인트 생성 ===
파일: app/api/v1/admin/division-monitor/route.ts

기능:
- CRON_SECRET 인증 (기존 패턴 따라)
- division-checklists.ts에서 15개 Division 체크 실행
- issue-classifier.ts로 Yellow/Red 이슈 분류
- auto-remediation.ts로 Layer 1/2 자동 수정 시도
- Layer 3 이슈 → Make.com Webhook 호출 (MAKE_WEBHOOK_URL 환경변수)
- 결과 health_check_logs에 저장 (source: 'division-monitor')
- 응답: { total_divisions: 15, green: N, yellow: N, red: N, auto_resolved: [...], needs_attention: [...] }

=== 2단계: Telegram 알림 함수 ===
파일: app/lib/monitoring/telegram-alert.ts

기능:
- TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 환경변수 사용
- sendTelegramAlert(message: string) 함수
- Layer 3 이슈 발생 시 호출
- 메시지 형식:
  🔴 POTAL 긴급 알림
  Division: D[N] [이름]
  이슈: [체크 항목]
  상태: [Red/Yellow]
  권장: [recommendation]
  시각: [KST 시간]

=== 3단계: Vercel Cron 설정 ===
vercel.json의 crons 배열에 추가:
{ "path": "/api/v1/admin/division-monitor", "schedule": "*/30 * * * *" }

=== 4단계: Make.com Webhook 연동 (선택) ===
division-monitor에서 Layer 3 이슈 시:
1. 먼저 telegram-alert.ts로 직접 Telegram 전송 시도
2. 실패 시 Make.com Webhook URL로 POST (폴백)
3. 둘 다 실패 시 contact@potal.app 이메일 (Resend API, 기존 morning-brief-email.ts 패턴)

=== 환경변수 (Vercel에 추가 필요) ===
- TELEGRAM_BOT_TOKEN: (추후 설정)
- TELEGRAM_CHAT_ID: (추후 설정)
- MAKE_WEBHOOK_URL: (추후 설정)

npm run build 확인 후 git push 해줘. Telegram/Make.com 환경변수는 아직 없어도 빌드는 통과하게 코드 작성해 (값 없으면 skip하고 이메일만 발송).
완료 후 5개 문서 업데이트.
```

---

## 실행 순서
1. 명령어 1 → 2 → 3 순서대로 (각각 빌드 확인)
2. 또는 명령어 1+2+3을 하나로 합쳐서 한번에 진행 가능
3. 명령어 4는 별도로 (24/7 모니터링 핵심 구현)
4. 모든 완료 후 5개 문서 업데이트는 마지막에 한 번만

## 합본 명령어 (1+2+3 한번에 — 권장)

```
CLAUDE.md 읽고 AI Agent Organization v4 코드 업데이트를 진행해줘. 3개 파일을 순서대로 수정해.

### 파일 1: app/lib/monitoring/agent-roles.ts
v4 Division 이름 변경:
- D1 'Tariff & Trade Rules' → 'Tariff & Compliance Engine'
- D3 'HS Classification' → 'HS Classification & Data Intelligence'
- D4 'Data Pipeline' → 'Data Pipeline & Regulations'
- D5 leader: '30개국어' → '50개국어', i18n Specialist도 '50개국어'
- D6 'Platform & Plugins' → 'Platform & Integrations', Widget Engineer → Integration Engineer, 마켓플레이스/ERP 연동 추가
- D7 'API & Developer' → 'API & AI Platform', SDK Developer → AI Platform Engineer, MCP/Gemini/AI상담 추가, API엔드포인트 10+개, SDK (JS/Python/cURL)
- D8 'QA & Accuracy' → 'QA & Verification', '448건 테스트' → '142기능 테스트', 심층 검증 추가
- D9 'Customer Success' → 'Customer Acquisition & Success', A/B/C그룹 타겟, 50개국어 CS, 전담 CSM
- D12 'Marketing & Growth' → 'Marketing & Partnerships', Growth Hacker → Partnership Manager, 파트너 에코시스템 1400+
- D14 'Finance' → 'Finance & Strategy'
- D15 'Intelligence' → 'Intelligence & Market', '47기능' → '147기능', projectExamples 142/147 커버리지
- D1: Rate Validator에 ICS2/Type86/수출통제 추가, Trade Remedy에 ECCN 추가
- D3: Data Labeler → Data Pipeline Engineer, WDC 대량처리/카테고리/가격분기
- D4: Import Engineer → Regulations Collector, 240개국 규정/RAG 추가, 에스컬레이션에 규정 해석 추가
- OPUS_ESCALATION_DIVISIONS에 'D4' 추가

### 파일 2: app/lib/monitoring/division-checklists.ts
- 같은 Division 이름 변경 적용
- D3: d3-wdc-mapping (WDC 매핑 파이프라인), d3-vector-count (벡터 1023건+) 추가
- D4: d4-regulation-collection (240개국 규정 수집, manual) 추가
- D7: d7-mcp-server (MCP 서버 7개 도구, app_builtin) 추가
- D9: d9-customer-count (고객 추적, health_check_logs) 추가

### 파일 3: app/lib/monitoring/issue-classifier.ts
- D3: WDC/mapping/vector 패턴 Layer 2 추가
- D4: regulation/규정수집/RAG 패턴 Layer 2 추가
- D7: MCP/mcp server 패턴 Layer 2 추가
- D9: customer count/가입/이탈 Layer 2 추가, enterprise/영업/partnership Layer 3 추가

3개 파일 수정 후 npm run build 확인. 빌드 통과하면 완료 보고.
```
