# COMMAND: CW37-S2 — Endpoint 정리 + Result 풍부화

**작성일**: 2026-04-14 KST
**작업 라벨**: CW37-S2
**담당 터미널**: 터미널2 또는 터미널1
**예상 소요**: 5~7시간
**선행조건**: CW37-S1 Audit 완료 (`docs/CW37_AUDIT_REPORT.md` 작성됨)

**목적**: 6 Compute endpoint 의 응답에 6개 Lookup 을 흡수. `generate-document` 에 cert-of-origin 통합. Backward compatible 유지.

---

## 작업 범위

### 흡수할 Lookup 6개
| 폐지 대상 | 흡수처 | 어떤 필드로 |
|---------|-------|-----------|
| `duty-rate` | `calculate` | `breakdown.duty.{rate, amount, source}` |
| `exchange-rate` | `calculate` | `breakdown.exchangeRate.{...}` |
| `de-minimis` | `calculate` | `breakdown.deMinimis.{threshold, applied}` |
| `fta-finder` | `apply-fta` | `applicableFTAs[].{agreement, verdict, savings}` (agreement 미지정 시 auto) |
| `restricted-item` | `check-restrictions` | `restricted: bool` 단순 응답 모드 포함 |
| `hs-search` | `classify` | `alternatives[]` 다수 HS 후보 |

### 통합할 endpoint
| 폐지 대상 | 흡수처 | 방법 |
|---------|-------|------|
| `issue-cert-of-origin` | `generate-document` | `documentType: "cert_of_origin"` 파라미터 |

### 폐지할 endpoint (Guides 로 대체)
| 폐지 대상 | 대체 |
|---------|------|
| `export-declaration` | `/guides/customs-filing/{country}/export` 정보 페이지 |
| `customs-entry` | `/guides/customs-filing/{country}/import` 정보 페이지 |

---

## Phase 별 작업

### Phase 1: 계획 수립 (30분)
1. CW37_AUDIT_REPORT.md 기반으로 현재 endpoint 목록 확인
2. 각 endpoint 의 수정 범위 명시
3. backward compatibility 전략:
   - 기존 필드명 유지 (추가는 OK, 변경/삭제 X)
   - 폐지 endpoint 는 deprecated warning + 최소 6개월 유지
   - HTTP header `X-API-Deprecated: true` + `X-API-Replacement: /api/v1/new-endpoint`

### Phase 2: `/api/v1/calculate` 응답 풍부화 (1.5시간)
수정 위치: `app/api/v1/calculate/route.ts` 및 관련 lib
변경 내용:
- 응답에 `breakdown.duty.source` (MFN / FTA_KORUS / Section301 등 enum)
- 응답에 `breakdown.exchangeRate.{USD: 1, local: X, applied: "USD"}`
- 응답에 `breakdown.deMinimis.{threshold, applied, dutyWaived}`
- 응답에 `ftaSavings` (apply-fta 와 같은 로직 사전 계산, optional)

### Phase 3: `/api/v1/apply-fta` fta-finder 흡수 (1시간)
수정 위치: `app/api/v1/roo/evaluate/route.ts` 또는 `/api/v1/apply-fta/route.ts`
변경 내용:
- agreement 미지정 시 **모든 가능 FTA 자동 시도**
- 응답에 `applicableFTAs[]` (각각 verdict + savings + requiredDocs)
- `recommended` 필드로 최적 FTA 추천

### Phase 4: `/api/v1/check-restrictions` 응답 풍부화 (1시간)
수정 위치: `app/api/v1/check-restrictions/route.ts`
변경 내용:
- 응답에 `restricted: bool` (단순 모드 대응)
- 응답에 `restrictionType`, `categories[]`, `permits[]`, `warnings[]`
- 기존 `restrictions[]`, `notes[]` 유지

### Phase 5: `/api/v1/classify` 응답 풍부화 (1시간)
수정 위치: `app/api/v1/classify-product/route.ts` 및 관련 lib
변경 내용:
- 응답에 `alternatives[]` (top-3 alternative HS + confidence + reasoning)
- 기존 `hsCode`, `confidence`, `decisionPath` 유지

### Phase 6: `/api/v1/generate-document` 통합 (1시간)
수정 위치: `app/api/v1/generate-document/route.ts` (기존) 또는 신설
변경 내용:
- `documentType` 파라미터 enum:
  - `commercial_invoice`
  - `packing_list`
  - `bill_of_lading`
  - `cert_of_origin` ← cert-of-origin 흡수
- 각 documentType 별 필수 필드 검증
- 공통 response: `{ documentUrl, documentBase64, format, metadata }`

### Phase 7: 폐지 endpoint soft-deprecation (30분)
대상 endpoint (현재 존재하는 경우에만):
- `/api/v1/duty-rate`
- `/api/v1/exchange-rate`
- `/api/v1/de-minimis`
- `/api/v1/fta-finder`
- `/api/v1/restricted-item`
- `/api/v1/hs-search`
- `/api/v1/issue-cert-of-origin`
- `/api/v1/export-declaration`
- `/api/v1/customs-entry`

처리:
- 응답에 deprecation warning JSON:
  ```json
  {
    "...": "...",
    "_deprecation": {
      "deprecated": true,
      "replacement": "/api/v1/calculate",
      "sunsetDate": "2026-10-31"
    }
  }
  ```
- HTTP header:
  ```
  X-API-Deprecated: true
  X-API-Replacement: /api/v1/calculate
  X-API-Sunset: 2026-10-31
  ```

### Phase 8: 테스트 신설 (1시간)
파일: `scripts/verify-cw37-s2-consolidation.mjs`
테스트 케이스 10:
1. calculate 응답에 duty source + exchange + deMinimis 포함
2. calculate 응답에 ftaSavings 사전 계산
3. apply-fta agreement 미지정 → applicableFTAs[] 다수
4. apply-fta agreement 지정 → 해당 FTA 만
5. check-restrictions 응답에 restricted bool + categories
6. classify 응답에 alternatives top-3
7. generate-document documentType=cert_of_origin
8. generate-document documentType=commercial_invoice
9. 폐지 endpoint (duty-rate) 호출 → deprecation header
10. backward compat: 기존 클라이언트 request body → 정상 작동

### Phase 9: Regression
- verify-cw32 28/28
- verify-cw33 23/23
- verify-cw34-s4 22/22
- verify-cw34-s4-5-fta 22/22
- verify-cw36-cn-warning 9/9
- verify-cw36-jp1 12/12
- verify-cw36-wco1 17/17
- verify-cw36-fta-enrichment (신설된 거)
- verify-cw37-s2-consolidation 10/10
- 빌드 475/475

### Phase 10: Production 검증
3~5 curl 케이스:
- `calculate` cotton t-shirt KR→US → 풍부한 응답 확인
- `apply-fta` HS 6109 KR→US agreement 미지정 → KORUS 자동 추천
- `check-restrictions` HS 8507 CN→DE → HAZMAT 포함
- `generate-document` cert_of_origin → PDF

### Phase 11: Commit
```
feat(cw37-s2): Endpoint consolidation — absorb 6 lookups + document type param

- calculate response: duty source enum + exchange + deMinimis + ftaSavings
- apply-fta: auto-detect mode (agreement 미지정 → applicableFTAs[])
- check-restrictions: simple `restricted` bool + categories + permits
- classify: alternatives[] top-3 candidates
- generate-document: documentType param (cert_of_origin 포함)
- 9 endpoints deprecation warning (X-API-Deprecated header + _deprecation field)
- backward compatible: 기존 필드명 유지
- verify-cw37-s2-consolidation.mjs 10/10 green
```

### Phase 12: 문서 업데이트
- CLAUDE.md 헤더
- docs/CHANGELOG.md
- session-context.md
- docs/NEXT_SESSION_START.md

---

## 원칙

- **Backward compatible 최우선**: 기존 클라이언트 안 깨지게
- **폐지 endpoint 는 soft-deprecation**: 즉시 삭제 X, 최소 6개월 유지
- **deprecation 알림**: 응답 header + body `_deprecation` 양쪽
- **Rule 12 엄수**: 흡수된 Lookup 도 실제 계산/데이터 사용, 하드코딩 금지
- **LLM-friendly 구조**: 새 필드는 self-explanatory name (나중 Phase 6 에서 전체 재정리)

---

## 완료 기준

- [ ] 6 Compute endpoint 응답 풍부화
- [ ] generate-document documentType 통합
- [ ] 9 폐지 endpoint deprecation warning
- [ ] verify-cw37-s2-consolidation 10/10 green
- [ ] Regression 전부 green
- [ ] Production 검증 3~5 케이스 PASS
- [ ] Commit + push
- [ ] 4 문서 동기화

완료 후 CW37-S3 (UI 리뉴얼 RapidAPI 패턴) 시작.
