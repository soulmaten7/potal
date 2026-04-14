# CW37-S1 Audit Report — 현재 상태 감사
**작성일**: 2026-04-15 KST
**상태**: ✅ 감사 완료, 코드 수정 0

---

## 1. API Key / Rate Limit 시스템

### 현재 상태: ✅ 완비 (운영 가능)

| 항목 | 상태 | 파일 |
|------|------|------|
| Auth middleware | ✅ 10-step pipeline | `app/lib/api-auth/middleware.ts` |
| Key format | ✅ `pk_live_` / `sk_live_` / `pk_test_` / `sk_test_` | middleware L255 |
| Demo bypass | ✅ `X-Demo-Request: true` (10 req/min/IP) | middleware L193 |
| DB table `api_keys` | ✅ migration 003 + 039 + 041 | Supabase |
| Rate limit | ✅ 20 req/sec in-memory sliding window | `api-auth/rate-limiter.ts` |
| Key CRUD API | ✅ create/revoke/rotate/list | `api/v1/sellers/keys/` |
| IP rules | ✅ allow/block per key | `api_key_ip_rules` table |
| Fraud detection | ✅ burst/flood/enumeration | middleware L296 |
| Scope checking | ✅ 18-domain SCOPE_ROUTE_MAP | middleware L267 |

### Gap
- **Dashboard 가짜 데이터**: `app/dashboard/api-keys/page.tsx`가 하드코딩 DEMO_KEYS 사용, 실제 API 미연결
- **Rate limit UI 불일치**: Dashboard "100K/month" 표시 vs 실제 20 req/sec (CW22-S4c에서 월간 쿼터 폐지)
- **CW37 작업**: Dashboard 수정 (실제 API 연동 + rate limit 표시 정정)

---

## 2. 현재 Endpoint 목록

### 총 route.ts 파일: 266개

### CW37 목표 12개 vs 현재 매핑

| # | CW37 Target | 현재 상태 | 현재 경로 |
|---|------------|----------|---------|
| 1 | `classify` | ✅ 존재 | `/api/v1/classify` (text/image/batch/eccn) |
| 2 | `calculate` | ✅ 존재 | `/api/v1/calculate` (single/batch/compare/breakdown/ddp-vs-ddu/whatif) |
| 3 | `apply-fta` | ⚠️ 이름 다름 | `/api/v1/fta` + `/api/v1/fta/eligibility` + `/api/v1/roo/evaluate` |
| 4 | `check-restrictions` | ⚠️ 이름 다름 | `/api/v1/restrictions` |
| 5 | `compare` | ✅ 존재 | `/api/v1/calculate/compare` + `/api/v1/countries/compare` |
| 6 | `generate-document` | ⚠️ 이름 다름 | `/api/v1/customs-docs/generate` + `/api/v1/documents/pdf` |
| 7 | `screen-parties` | ⚠️ 이름 다름 | `/api/v1/screening` |
| 8 | `eccn-lookup` | ⚠️ 이름 다름 | `/api/v1/classify/eccn` |
| 9 | `customs-filing-guide` | ❌ 미존재 | 신규 빌드 필요 |
| 10 | `incoterms-guide` | ⚠️ 데이터 endpoint만 | `/api/v1/incoterms/recommend` (가이드 형식 아님) |
| 11 | `section-301-guide` | ❌ 미존재 | 데이터는 `calculate` 응답에 포함, 가이드 없음 |
| 12 | `anti-dumping-guide` | ❌ 미존재 | `/api/v1/trade-remedies/ad` (데이터만) |

**요약: 8/12 존재 (이름 변경 필요 4개), 4/12 신규 빌드 (Guides)**

### Lookup 6개 흡수 상태

| Lookup | 현재 독립 endpoint | 흡수 대상 Compute API | 상태 |
|--------|------------------|---------------------|------|
| duty-rate | `/api/v1/exchange-rate` (아님, 이건 환율) | `calculate` | ⚠️ 별도 endpoint 없음 (calculate에 내장) |
| exchange-rate | `/api/v1/exchange-rate` | `calculate` | ✅ calculate 응답에 `localCurrency.rate` 포함 |
| de-minimis | `/api/v1/de-minimis/check` | `calculate` | ✅ calculate 응답에 `de_minimis_detail` 포함 |
| fta-finder | `/api/v1/fta` | `apply-fta` | ⚠️ 별도 존재, 흡수 필요 |
| restricted-item | `/api/v1/restrictions` | `check-restrictions` | ✅ 이미 동일 |
| hs-search | `/api/v1/validate/hs-code` | `classify` | ⚠️ 별도 존재, 흡수 필요 |

---

## 3. Response Schema 상태

### CW36 enrichment 필드 반영 현황

| 필드 | `/calculate` | `/classify` | `/restrictions` | `/roo/evaluate` | `/screening` |
|------|-------------|------------|----------------|-----------------|-------------|
| `rulingMatch` | ✅ | ❌ (`ruling_reference`로 별도) | ❌ (`rulingNotes`로 별도) | ✅ (`rulingPrecedents`) | ❌ |
| `dataAvailability` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `classificationGuidance` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `chapterValidation` | ❌ | ❌ | ❌ | ✅ | ❌ |

### Lookup 흡수 필드 현황 (calculate 응답 기준)

| 필드 | 현재 calculate 응답 포함 | 필드명 |
|------|----------------------|--------|
| 관세율 | ✅ | `importDuty` + `breakdown[]` + `tariffOptimization` |
| 환율 | ✅ | `localCurrency.rate` + `exchangeRateTimestamp` |
| De minimis | ✅ | `deMinimisApplied` + `de_minimis_detail` |
| FTA 적용 | ✅ | `ftaApplied` + `tariffOptimization.rateOptions` |
| 제한 품목 | ⚠️ (route layer에서 추가) | `restrictions[]` + `regulatory_warnings[]` |
| HS 검증 | ✅ | `hsClassification` + `hs10Resolution` |

**LLM-friendly 평가: 3/5** — 필드 구조는 풍부하지만 명명 불일치 (camelCase + snake_case 혼용, 중복 필드)

---

## 4. HsCodeCalculator 현재 Embed 상태

### 현재: **1곳만 embed**
- `components/playground/ParamsPanel.tsx` (L7, L349) — 모달 형태

### Props
```typescript
{ onResult: (hsCode: string) => void; onClose: () => void; }
```

### CW37 목표 Gap
- 현재 1곳 → 목표: 모든 Compute/Screening endpoint 화면에 embed
- **Props 확장 필요**: embedded mode (모달 아닌 인라인), 자동 filling 모드
- **6+ 페이지에 추가 embed 작업** 필요

---

## 5. 시나리오 / 페르소나 구조

### 현재: 6개 시나리오
| ID | 이름 | 색상 |
|----|------|------|
| `seller` | Online Seller (Etsy, Shopify, eBay, Amazon) | 노랑 |
| `d2c` | D2C Brand (own store) | 파랑 |
| `importer` | Importer (B2B container loads) | 초록 |
| `exporter` | Exporter (Quotes & contracts) | 보라 |
| `forwarder` | Forwarder / 3PL (small-team logistics) | 빨강 |
| `custom` | CUSTOM (build your own combo) | 회색 |

### 관련 파일
| 파일 | 역할 |
|------|------|
| `components/home/ScenarioSelector.tsx` | 6개 카드 렌더 |
| `components/home/ScenarioPanel.tsx` | 선택된 시나리오 패널 |
| `components/home/NonDevPanel.tsx` | 비개발자 입력 폼 |
| `components/home/DevPanel.tsx` | 개발자 코드 스니펫 |
| `components/custom/CustomBuilder.tsx` | CUSTOM 빌더 |
| `lib/scenarios/scenario-config.ts` | ScenarioId 타입 |
| `lib/scenarios/workflow-examples.ts` | 워크플로우 예시 |
| `lib/scenarios/mock-results.ts` | mock 결과 |

### CW37 목표 Gap
- 현재 6개 → 목표 2개 (수출/수입, 마케팅 진입만)
- **ScenarioSelector 전면 교체** + 관련 컴포넌트 4개 정리
- ScenarioId 타입 변경 영향 범위 넓음

---

## 6. OpenAPI Spec 상태

### 현재: ✅ 존재하지만 수동 관리

| 항목 | 상태 | 파일 |
|------|------|------|
| OpenAPI 3.0.3 spec | ✅ | `app/api/v1/docs/openapi.ts` |
| JSON 서빙 | ✅ | `GET /api/v1/docs` |
| Docs 페이지 | ✅ | `app/developers/openapi/page.tsx` + `app/developers/docs/page.tsx` |
| curl 예시 | ✅ | `app/developers/docs/curl-reference/page.tsx` |
| GPT Actions | ✅ | `ai-agents/custom-gpt/openapi-gpt-actions.json` |

### Gap
- spec이 "155+ endpoints" 기술하지만 실제 266 route.ts — **동기화 필요**
- Docs 페이지 수동 관리 — 자동 생성 또는 Swagger UI 고려
- CW37 12 endpoint 기준으로 spec 재작성 필요

---

## 7. Guides 페이지 상태

### 현재 존재하는 정보 페이지

| 경로 | 내용 | 상태 |
|------|------|------|
| `/guide` | 9-Field Input Guide | ✅ 활성 |
| `/learn` | 교육 페이지 | ✅ 활성 |
| `/faq` | FAQ | ✅ 활성 |
| `/help` | 도움말 | ✅ 활성 |
| `/blog` + `/blog/[slug]` | 블로그 | ✅ 활성 |
| `/certification` | 무역 자격증 | ✅ 활성 |
| `/tariff/[country]/[hs]` | HS별 관세 정보 | ✅ 활성 |
| `/tax-info` | 세금 정보 | ❌ 리다이렉트만 (dead) |
| `/guides/*` | 가이드 디렉토리 | ❌ 미존재 |
| `/info/*` | 정보 디렉토리 | ❌ 미존재 |

### Disclaimer 컴포넌트
- **별도 재사용 컴포넌트 없음**
- `app/terms/page.tsx` L105에 "Accuracy Disclaimer" 인라인 존재
- CW37: `<Disclaimer>` 재사용 컴포넌트 신규 빌드 필요

### CW37 신규 빌드 필요
1. `customs-filing-guide/{KR,US,EU,GB,JP,CN,AU,CA}` — 8개국 통관 가이드
2. `incoterms-guide` — Incoterms 2020 가이드
3. `section-301-guide` — 미국 Section 301 관세 가이드
4. `anti-dumping-guide` — 반덤핑/상계관세 가이드
5. `<Disclaimer>` 재사용 컴포넌트

---

## 8. CW37 작업량 재산정

### 감사 결과 기반 조정

| Phase | 원래 예상 | 재산정 | 이유 |
|-------|---------|--------|------|
| **Phase 1 (Audit)** | 1-2h | **1h** ✅ 완료 | — |
| **Phase 2 (Endpoint 정리)** | 5-7h | **3-4h** | 8/12 이미 존재, rename + Lookup 흡수만 |
| **Phase 3 (UI 리뉴얼)** | 5-7h | **6-8h** | ScenarioSelector 교체 + HsCodeCalculator 6곳 embed + RapidAPI 패턴 |
| **Phase 4 (Screening)** | 2-3h | **1-2h** | screen-parties + eccn 이미 존재, 이름만 정리 |
| **Phase 5 (Guides)** | 3-4h | **4-6h** | 4 guide 페이지 + 8개국 filing guide + Disclaimer 컴포넌트 신규 |
| **Phase 6 (LLM Schema)** | 8-12h | **4-6h** | 응답 구조 이미 풍부, 명명 통일 + enrichment 전파만 |
| **Phase 7 (OpenAPI)** | 5-7h | **3-4h** | spec 이미 존재, 12 endpoint 기준 재작성 |
| **Total** | 29-42h | **22-31h** | ~25% 축소 |

### 우선순위 재조정

| 순위 | Phase | 이유 |
|------|-------|------|
| 1 | **Phase 2** | Endpoint 정리 = 모든 후속 작업의 기반 |
| 2 | **Phase 5** | Guides = 마케팅 콘텐츠, 가장 빠른 사용자 가치 |
| 3 | **Phase 3** | UI 리뉴얼 = 가장 큰 작업이지만 Phase 2 이후 가능 |
| 4 | **Phase 6** | LLM Schema = API 소비자 경험 개선 |
| 5 | **Phase 4** | Screening = 이미 존재, 낮은 우선순위 |
| 6 | **Phase 7** | OpenAPI = Phase 2 완료 후 자동 생성 가능 |

---

## 가장 큰 Gap 3개

1. **Guides 콘텐츠 0개** — customs-filing/incoterms/section-301/anti-dumping 전부 신규. Disclaimer 컴포넌트도 없음.
2. **HsCodeCalculator 1곳만 embed** — CW37 목표: 모든 endpoint 페이지에 embed. 현재 playground ParamsPanel에서만 모달로 사용.
3. **시나리오 6→2 교체** — ScenarioSelector + 관련 컴포넌트 5개 + ScenarioId 타입 + workflow examples + mock results 전면 교체. 영향 범위 가장 큼.
