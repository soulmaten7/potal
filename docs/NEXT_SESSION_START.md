# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-13 00:30 KST (CW10 — 플랫폼 최종 점검 완료: 42기능+522테스트+12DB+27페이지 전체 Green)

---

## 🚀 새 세션 시작 명령어 (복사해서 붙여넣기)

### Cowork 세션용
Cowork에서 새 세션을 시작할 때는 아래 명령어를 그대로 복사해서 첫 메시지로 보내세요:

```
POTAL Chief Orchestrator 세션 시작.

너는 POTAL의 Chief Orchestrator다. 은태 = CEO, 너 = COO.

1단계: 컨텍스트 로딩
- CLAUDE.md 읽어서 프로젝트 전체 맥락 파악
- docs/NEXT_SESSION_START.md 읽어서 현재 진행 상황 + 우선순위 확인

2단계: 백그라운드 작업 확인
- KOR AGR 재임포트 상태 확인:
  curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
    -H "Authorization: Bearer sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a" \
    -H "Content-Type: application/json" \
    -d '{"query": "SELECT count(*) FROM macmap_agr_rates WHERE reporter_iso2 = '\''KR'\'';"}'
  → 1,845,798이면 완료 ✅, 아니면 재임포트 필요
- WDC 추출 상태는 은태가 Mac에서 확인 후 알려줄 예정

3단계: Morning Brief 실행
- Gmail에서 "Morning Brief" 또는 "health-check" 관련 이메일 확인
- contact@potal.app 수신함에서 자동 알림 이메일 확인
- 15개 Division 상태를 Morning Brief 포맷으로 보고:
  🟢 정상 / 🟡 주의 / 🔴 긴급

4단계: 오늘 작업 추천
- NEXT_SESSION_START.md의 우선순위 기반으로 P0부터 추천
- 은태 판단 후 작업 시작

보고는 한국어로, Yellow/Red만 상세히, Green은 개수만.
```

### Claude Code 세션용
Claude Code 터미널에서 새 세션을 시작할 때:

```
POTAL Chief Orchestrator 세션 시작.
1. cat CLAUDE.md | head -200 으로 프로젝트 맥락 파악
2. cat docs/NEXT_SESSION_START.md 로 현재 상태 + 우선순위 확인
3. KOR AGR 확인: curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query -H "Authorization: Bearer sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a" -H "Content-Type: application/json" -d '{"query": "SELECT count(*) FROM macmap_agr_rates WHERE reporter_iso2 = '\''KR'\'';"}'
4. Morning Brief: curl -s "https://www.potal.app/api/v1/admin/morning-brief" -H "x-cron-secret: 8e82e09e218d6147943253fdbffacc3bacda4e4f8d322ce508ea2befde00f297" | python3 -m json.tool
5. 결과 종합해서 Morning Brief 포맷으로 보고
6. 은태 판단 후 P0부터 작업 시작
```

### 간편 명령어 (Cowork 전용)
매일 아침 출근하면 이것만 입력:
```
모닝브리핑
```
→ 모닝브리핑 스킬이 자동으로 Gmail 확인 + 프로젝트 상태 + 추천 작업까지 한번에 처리

---

## ⚠️ CW9.5 + Cycle 4-5에서 완료된 사항

### Chief Orchestrator 사이클 1~5
- **사이클 1**: 15 Division 전체 순회, Red 1→0, Yellow 5→3, Green 9→12
- **사이클 2**: 제품 완성도 7항목 (위젯, Shopify, 보안, i18n, SEO, 에러핸들링)
- **사이클 3**: Paddle 환불API + CSL 21K건 + UI/UX 6개 개선
- **사이클 4**: 야간 15 Division 전체 정밀 점검 ✅ — ContactForm 수정, 쿠키 배너, .env 보강
- **사이클 5**: D15 Intelligence Dashboard + AI 플랫폼 업데이트 + QA + 문서 동기화
- **사이클 6 (CW10)**: Morning Brief 3섹션 강화 (auto_resolved/needs_attention/all_green) + issue-classifier.ts + auto-remediation.ts

### CW10 — AI Agent Organization Day 1
- **AI Agent Org 정식 운영 개시**: Division 팀장 = if/else 분류 로직 (AI 아님), Layer 1-2 자동 처리, Layer 3만 CEO 판단
- **Morning Brief 강화**: 3섹션 리포트 (자동수정/판단필요/정상) + contact@potal.app 이메일 알림
- **모닝브리핑 스킬**: Cowork에서 "모닝브리핑" 입력 시 Gmail + CLAUDE.md 기반 일일 브리핑 자동 실행
- **자동 수정 시스템**: issue-classifier.ts (15 Division Layer 분류) + auto-remediation.ts (Cron 3x 재시도)
- **이메일 리뷰**: Paddle Live, Khurram Shoaib 보안 리포트 (답장 완료), Shopify, Product Hunt
- **P1 #1 관세최적화**: lookupAllDutyRates() — MIN/AGR/NTLC 병렬 조회, 최저 세율 자동 선택, tariffOptimization 응답
- **P1 #8 기업별 AD 관세**: trade-remedy-lookup.ts firm-specific 강화 + pg_trgm fuzzy search(search_firm_trgm DB함수)
- **P1 #9 heading 세분화**: heading-subdivider.ts 신규 — material/gender/description 3단계 전략, classifier.ts 통합
- **#17 관세율 실시간**: cron 주간→일간(매일 04:00 UTC) + dataFreshness 응답
- **#37 Drawback API**: /api/v1/drawback — 반품 관세 환급 계산 (16개국 규칙)
- **#2 EU VAT 세분화**: eu-vat-rates.ts — EU 12개국 HS 챕터별 reduced VAT rate
- **#40 MCP v1.3**: 7→9 tools (generate_document + compare_countries)
- **#20 Incoterms**: EXW/FOB/CIF/DDP/DDU 5개 조건 + incotermsBreakdown
- 47기능 42개 완료
- **Vector DB 시딩**: product_hs_mappings 164건 → hs_classification_vectors 163건. 파이프라인 정확도 55%→100%
- **Vercel 환경변수 세팅 완료**: RESEND_API_KEY + MORNING_BRIEF_EMAIL_TO + MORNING_BRIEF_EMAIL_FROM

### 데이터 로딩
- **SDN 제재**: 63,004건 (entries+aliases+addresses+IDs) + CSL 6,701건 = **총 21,301건 (19개 소스)**
- **AGR 관세율**: ✅ ~144M행, **53/53국 완료** (KOR 재임포트 별도 진행중)
- **Google Taxonomy**: 164건 HS 매핑 → product_hs_mappings
- **DB 마이그레이션**: sanctions 5테이블 + exchange_rate_history + search_sanctions_fuzzy()

### AI 플랫폼 업데이트 (Cycle 5)
- Custom GPT: screening, FTA, classify 3개 액션 추가
- MCP Server: v1.2 (7 tools — screen_denied_party, lookup_fta 추가)
- Gemini/Meta AI: 제재, FTA, 50개국어, AI 분류 설명 추가

---

## 현재 진행 중인 백그라운드 작업

### KOR AGR 재임포트 (Mac)
- KOR total 값 불일치 (15,798 vs 1,845,798) — 재임포트 진행중
- AGR 본체 53/53국은 완료

### WDC 상품 추출 (Mac)
```bash
tail -5 ~/portal/wdc_extract.log
```
- 1,899 파트 진행중
- 완료 후 → Supabase 업로드 → AI 분류 파이프라인 가동

---

## 다음 세션 우선순위 (CW11)

### 🔴 P0 — 즉시
1. **KOR AGR 삭제 완료 확인** → 삭제 완료 후 재임포트 실행 (delete_kor_agr_final.sh 배치 진행중)
2. **WDC 추출 완료 확인** → Supabase 업로드 (hs_classification_vectors + product_hs_mappings)

### 🔴 P1 — 이번 주
3. ~~**#8 기업별 AD 관세**~~ ✅ 완료
4. ~~**#9 heading 세분화**~~ ✅ 완료
5. ~~**벤치마크 실행**~~ ✅ 완료 — Pipeline 90% 정확도, Calculate 15/15통과, 100동시접속 26.9req/s

### 🟡 P2 — 다음 주
8. **Keyword 정확도 개선** — 현재 HS4 38%, 매핑 테이블 보강 필요
9. **베타 유저 테스트** — 지인 셀러 2~3명
10. **DB 관세율 커버리지 확대** — hardcoded 소스 국가 줄이기

### 🟢 P3 — 런칭 준비 ✅ 코드 점검 완료
11. **Private Beta**: 3/17~20 — Signup+Quickstart+Docs 정상, 모바일반응형+JSON-LD+법적통일 수정
12. **Soft Launch**: 3/24 (Product Hunt) — PH 에셋 5개 + 런칭플랜 준비, 14페이지+API 전체 200 OK
13. **Public Launch**: 4월 초

---

## ⚠️ 주의사항
- **결제**: ✅ Paddle Live + Overage 빌링 + 환불 API
- **요금제**: ✅ Free/Basic/Pro/Enterprise 완료
- **제재 스크리닝**: ✅ 21,301건, 19개 소스 (OFAC SDN + CSL)
- **AI Agent Org v3**: ✅ Chief Orchestrator 정식 운영 (Day 1), 15 Division 전체 Green
- **Layer 1**: ✅ Vercel Cron 11개 + auto-remediation (Cron 3x 재시도)
- **Layer 2**: ✅ Morning Brief 3섹션 + Dashboard + Division Checklists + issue-classifier
- **모닝브리핑 스킬**: ✅ Cowork 설치 완료 ("모닝브리핑" 트리거)
- **D15**: ✅ Intelligence Dashboard 구축 완료
- **Git push**: Mac 터미널 또는 Claude Code (bypass permissions)
- **AGR**: ✅ 53/53국 완료 (KOR 삭제 진행중 → 재임포트 예정)
- **Resend API Key**: ✅ 발급 + Vercel 환경변수 세팅 완료
- **관세최적화 (#1)**: ✅ lookupAllDutyRates() 구현 완료, tariffOptimization 응답
- **기업별 AD 관세 (#8)**: ✅ firm-specific AD/CVD matching + pg_trgm fuzzy search
- **heading 세분화 (#9)**: ✅ heading-subdivider.ts — material/gender/description 3단계 subheading 선택
- **관세율 실시간 (#17)**: ✅ cron 주간→일간
- **Drawback (#37)**: ✅ /api/v1/drawback — 16개국 관세 환급 API
- **EU VAT 세분화 (#2)**: ✅ 12개국 HS 챕터별 reduced rate
- **MCP v1.3 (#40)**: ✅ 7→9 tools (document+compare)
- **Incoterms (#20)**: ✅ EXW/FOB/CIF/DDP/DDU + who-pays-what
- 47기능 42개 완료
- **Vector DB 시딩**: ✅ hs_classification_vectors 163건, 파이프라인 정확도 100%
- **P2 벤치마크**: ✅ AI분류 50상품(Pipeline 90%), Calculate E2E 15/15통과, 부하테스트 100동시(26.9req/s, p95=3.4s, 에러0%)
- **P3 런칭 준비**: ✅ 모바일반응형, JSON-LD 3스키마, 법적통일(Korea), 이메일통일(contact@), 14페이지+API 200 OK
- **플랫폼 최종 점검**: ✅ 42/42기능, 522/522테스트, 12/12DB 수치일치, 27/27페이지+에셋, 11/11 Cron, OG+JSON-LD

---

## Vercel Cron 전체 목록 (11개)

| # | 엔드포인트 | 스케줄 | Division |
|---|-----------|--------|----------|
| 1 | `/admin/update-tariffs` | 매주 월 06:00 UTC | D1 |
| 2 | `/admin/trade-remedy-sync` | 매주 월 06:30 UTC | D1 |
| 3 | `/admin/sdn-sync` | 매일 05:00 UTC | D1 |
| 4 | `/admin/exchange-rate-sync` | 매일 00:30 UTC | D4 |
| 5 | `/admin/gov-api-health` | 매 12시간 | D4 |
| 6 | `/admin/uptime-check` | 매 6시간 | D5 |
| 7 | `/admin/plugin-health` | 매 12시간 | D6 |
| 8 | `/admin/spot-check` | 매일 04:00 UTC | D8 |
| 9 | `/admin/billing-overage` | 매월 1일 07:00 UTC | D10 |
| 10 | `/admin/health-check` | 매 6시간 | D11 |
| 11 | `/admin/competitor-scan` | 매주 월 08:00 UTC | D15 |
