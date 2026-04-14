# CW34-S4 Runtime Integration Report
**작성일**: 2026-04-14 KST
**상태**: ✅ 완료

## 요약

customs_rulings 645,591 rows → 엔진 런타임 연결 완료.
- `app/lib/rulings/lookup.ts` — ruling 조회 + scoring
- `app/lib/rulings/conditional-evaluator.ts` — conditional DSL 평가
- `GlobalCostEngine.calculateWithProfileAsync()` — ruling lookup 삽입
- `/api/v1/restrictions/route.ts` — ruling HAZMAT notes 보강
- verify-cw34-s4.mjs **22/22 green**

## Decision Tree (Rule 13)

```
1. customs_rulings conditional hit → ruling_conditional rate (CEO Decision 2)
2. Precomputed cache → precomputed rate
3. MacMap 4-stage → agr/min/ntlc/mfn rate
4. Government API → live_db/external rate
5. duty_rates DB → db rate
6. Profile avg → hardcoded (fallback)
```

Ruling lookup는 classification precedent. 일반 duty rate는 기존 파이프라인 유지.
Only conditional_rules outcomes (1건/645K)만 duty rate override 가능.

## 성능

| 지표 | 값 | 목표 |
|------|-----|------|
| Ruling lookup p50 | 49.4ms | <200ms ✅ |
| Ruling lookup p95 | 206.3ms | <500ms ✅ |

## Verification (22/22)

| # | Test | Result |
|---|------|--------|
| 1 | HS 610910 lookup | ✅ |
| 2 | HS 850760 Li-ion | ✅ |
| 3 | HS 420221 leather | ✅ |
| 4 | Jurisdiction filter EU/US | ✅ |
| 5 | Material filter cotton | ✅ |
| 6 | Revoked excluded | ✅ |
| 7 | Count rulings | ✅ |
| 8 | Conditional match | ✅ |
| 9 | Conditional else | ✅ |
| 10 | Missing context | ✅ |
| 11-12 | Performance | ✅ |

## 생성/수정 파일

| 파일 | 변경 |
|------|------|
| `app/lib/rulings/lookup.ts` | 신규 |
| `app/lib/rulings/conditional-evaluator.ts` | 신규 |
| `app/lib/cost-engine/GlobalCostEngine.ts` | GlobalCostInput 10-field 추가 + ruling lookup 삽입 + output rulingMatch 필드 |
| `app/api/v1/restrictions/route.ts` | ruling HAZMAT notes 보강 |
| `scripts/verify-cw34-s4.mjs` | 신규 |

## API 응답 새 필드

```json
{
  "rulingMatch": {
    "rulingId": "GB114641205",
    "source": "eu_ebti",
    "confidenceScore": 0.59,
    "matchScore": 85.9,
    "conditionalApplied": null
  },
  "dutyRateSource": "precomputed_mfn"
}
```

`rulingMatch`는 분류 참고 정보. `dutyRateSource`가 `ruling_conditional`이 아닌 한 duty rate에 영향 없음.
