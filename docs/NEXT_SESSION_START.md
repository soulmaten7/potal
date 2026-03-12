# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-12 10:00 KST (Cycle 5 — D15 Dashboard, AI Platform, QA, AGR 완료)

---

## ⚠️ CW9.5 + Cycle 4-5에서 완료된 사항

### Chief Orchestrator 사이클 1~5
- **사이클 1**: 15 Division 전체 순회, Red 1→0, Yellow 5→3, Green 9→12
- **사이클 2**: 제품 완성도 7항목 (위젯, Shopify, 보안, i18n, SEO, 에러핸들링)
- **사이클 3**: Paddle 환불API + CSL 21K건 + UI/UX 6개 개선
- **사이클 4**: 야간 15 Division 전체 정밀 점검 ✅ — ContactForm 수정, 쿠키 배너, .env 보강
- **사이클 5**: D15 Intelligence Dashboard + AI 플랫폼 업데이트 + QA + 문서 동기화

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

## 다음 세션 우선순위 (CW10)

### 🔴 P0 — 즉시
1. **KOR AGR 재임포트 완료 확인**
2. **WDC 추출 완료 확인** → Supabase 업로드 (hs_classification_vectors + product_hs_mappings)

### 🔴 P1 — 이번 주
3. **#1 관세최적화** — 최적 관세율 자동 추천 (MIN/AGR/FTA 비교)
4. **#8 기업별 AD 관세** — 반덤핑 기업별 세율 적용
5. **#9 heading 세분화** — HS 4자리 heading 내 세부 분류 개선
6. **AI 분류 실데이터 테스트** — 벡터 검색 + 키워드 + LLM 파이프라인 검증

### 🟡 P2 — 다음 주
7. **벤치마크 실행** — 분류 정확도 측정
8. **부하 테스트** — 동시 100명 접속
9. **베타 유저 테스트** — 지인 셀러 2~3명
10. **Layer 3 오케스트레이터 런타임** 설계

### 🟢 P3 — 런칭 준비
11. **Private Beta**: 3/17~20
12. **Soft Launch**: 3/24 (Product Hunt)
13. **Public Launch**: 4월 초

---

## ⚠️ 주의사항
- **결제**: ✅ Paddle Live + Overage 빌링 + 환불 API
- **요금제**: ✅ Free/Basic/Pro/Enterprise 완료
- **제재 스크리닝**: ✅ 21,301건, 19개 소스 (OFAC SDN + CSL)
- **AI Agent Org v3**: ✅ Chief Orchestrator 가동중, Phase 1 자동화 완료
- **Layer 1**: ✅ Vercel Cron 11개
- **Layer 2**: ✅ Morning Brief + Dashboard + Division Checklists
- **D15**: ✅ Intelligence Dashboard 구축 완료
- **Git push**: Mac 터미널 또는 Claude Code (bypass permissions)
- **AGR**: ✅ 53/53국 완료 (KOR 재임포트 진행중)

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
