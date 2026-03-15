# S+ Grade Upgrade Command — Core 16 + Trade 21 = 37 Features
# 실행 방법: 이 파일 전체를 Claude Code에 복사-붙여넣기
# 예상 시간: ~15분 (빌드 포함)
# 결과: 37개 기능 전부 S+ 수준으로 업그레이드 + 자동 테스트 + 검증 리포트

---

## 지시사항

아래 37개 기능을 **순서대로** 전부 구현해. 각 기능마다:
1. 코드 구현 (새 파일 or 기존 파일 수정)
2. edge case 처리
3. 테스트 케이스 작성 (app/lib/tests/ 또는 __tests__/)
4. 마지막에 npm run build 확인

**절대 규칙:**
- console.log 금지
- 추정값 금지 — 실제 DB 데이터 기반
- 한 번에 하나의 파일씩 — 멀티태스킹 금지
- 모든 엔드포인트는 /api/v1/ 아래에
- TypeScript strict mode
- 에러 핸들링 모든 곳에 try-catch
- Zod validation 모든 입력에

---

## PHASE 1: CORE 16개 기능 S+ 업그레이드

### F001: HS Code Classification → S+
**현재**: 4-stage pipeline (DB→Vector→Keyword→LLM). 8,389 mappings.
**S+로 만들기 위해 구현할 것:**

1. `app/lib/classification/feedback-loop.ts` 생성:
```
- classification_feedback 테이블 사용 (없으면 마이그레이션 생성: supabase/migrations/037_classification_feedback.sql)
- 스키마: id, original_query, predicted_hs6, corrected_hs6, corrected_by (user_id), confidence_score, feedback_type ('correct'|'incorrect'|'ambiguous'), created_at
- submitFeedback(query, predictedHs6, correctedHs6, userId): Promise<void>
- getFeedbackStats(): Promise<{total, correct_rate, top_corrections}>
- applyFeedbackToCache(): 피드백 기반으로 product_hs_mappings 자동 업데이트
```

2. `app/lib/classification/explainability.ts` 생성:
```
- classifyWithExplanation(productName, options): Promise<ClassificationResult & {explanation}>
- explanation 객체: {stage_matched: 'cache'|'vector'|'keyword'|'llm', match_score: number, reasoning: string, alternative_codes: [{hs6, score, reason}], confidence_breakdown: {cache_confidence, vector_similarity, keyword_match_count}}
- 기존 ai-classifier의 각 stage에서 매칭 이유를 수집하여 반환
```

3. `app/lib/classification/multi-language.ts` 생성:
```
- normalizeProductName(name: string, sourceLang?: string): Promise<string>
- 입력 언어 auto-detect (간단한 character range check: CJK, Cyrillic, Arabic, Latin)
- 비영어 입력 → 영어로 정규화 후 분류 파이프라인 투입
- 지원 언어: 한국어, 일본어, 중국어, 독일어, 프랑스어, 스페인어, 포르투갈어, 아랍어, 러시아어
- 정규화 결과 캐싱 (같은 입력 반복 시 재번역 없음)
```

4. `app/api/v1/classify/explain/route.ts` 생성:
```
POST /api/v1/classify/explain
Body: {product_name, origin_country?, destination_country?, price?, language?}
Response: {hs6, hs10?, confidence, explanation: {stage, reasoning, alternatives[], confidence_breakdown}}
```

5. `app/api/v1/classify/feedback/route.ts` 생성:
```
POST /api/v1/classify/feedback — 피드백 제출
GET /api/v1/classify/feedback/stats — 통계 조회
```

### F002: Landed Cost Calculation → S+
**현재**: GlobalCostEngine. 240 countries. 117,600 precomputed.
**구현:**

1. `app/lib/cost-engine/breakdown.ts` 생성:
```
- getDetailedBreakdown(params): Promise<CostBreakdown>
- CostBreakdown: {
    product_value, shipping_cost, insurance_cost,
    duty: {rate, amount, type: 'MFN'|'FTA'|'MIN'|'AGR', fta_name?},
    vat: {rate, amount, base_for_vat},
    special_taxes: [{name, rate, amount}],
    customs_fees: [{name, amount}],
    total_landed_cost,
    margin_analysis?: {selling_price, gross_margin, net_margin_after_duties},
    metadata: {data_freshness: Date, rates_valid_until?: Date, sources: string[]}
  }
```

2. `app/api/v1/calculate/breakdown/route.ts` 생성:
```
POST — itemized cost breakdown
Body: {product_name, hs_code?, origin, destination, value, currency?, shipping?, insurance?, selling_price?}
Response: 위의 CostBreakdown 전체
```

3. `app/api/v1/calculate/compare/route.ts` 생성:
```
POST — multi-route 비교 (최대 5개 route)
Body: {product_name, hs_code?, value, routes: [{origin, destination, shipping?}]}
Response: {routes: [CostBreakdown], cheapest_route_index, savings_vs_most_expensive}
```

4. `app/api/v1/calculate/whatif/route.ts` 생성:
```
POST — what-if 시뮬레이터
Body: {base_params, scenarios: [{change_field, change_value}]}
Response: {base: CostBreakdown, scenarios: [{change, result: CostBreakdown, diff}]}
```

### F003: FTA Detection → S+
**현재**: 63 FTAs. 1,319 trade agreements.
**구현:**

1. `app/lib/trade/roo-engine.ts` 생성:
```
- RoO (Rules of Origin) 엔진
- Origin criteria types: WO (Wholly Obtained), PE (Purely Ephemeral), RVC (Regional Value Content), CTH (Change in Tariff Heading), CC (Change in Chapter), CTSH (Change in Tariff Subheading)
- evaluateRoO(params: {hs6, origin, destination, fta_id, product_value?, local_content_value?}): Promise<RoOResult>
- RoOResult: {eligible: boolean, criteria_met: string[], criteria_failed: string[], rvc_percentage?: number, required_rvc?: number, savings_if_eligible: number}
```

2. `app/api/v1/fta/eligibility/route.ts` 생성:
```
POST — FTA 자격 확인
Body: {hs_code, origin, destination, product_value?, local_content_percentage?}
Response: {eligible_ftas: [{fta_name, fta_id, preferential_rate, mfn_rate, savings, roo_criteria, eligible: boolean}], best_fta: {name, savings}}
```

3. `app/api/v1/fta/compare/route.ts` 생성:
```
POST — FTA 비교
Body: {hs_code, origin, destination}
Response: {mfn_rate, ftas: [{name, rate, savings, roo_requirements}], recommendation}
```

### F004: Currency Conversion → S+
**현재**: Real-time rates. 240 currencies.
**구현:**

1. `app/api/v1/exchange-rates/history/route.ts` 생성:
```
GET ?from=USD&to=EUR&days=90
Response: {from, to, rates: [{date, rate, change_pct}], stats: {min, max, avg, volatility}}
```

2. `app/api/v1/exchange-rates/lock/route.ts` 생성:
```
POST — rate lock (24/48/72h)
Body: {from, to, duration_hours: 24|48|72}
Response: {lock_id, rate, locked_until, from, to}
GET ?lock_id=xxx — lock 상태 확인
```

3. `app/lib/currency/volatility.ts` 생성:
```
- calculateVolatility(from, to, days): Promise<{volatility_score: 'low'|'medium'|'high', daily_change_avg, max_swing}>
- 환율 변동성 지표
```

### F005: De Minimis Threshold → S+
**현재**: 240 countries in DB.
**구현:**

1. `app/api/v1/de-minimis/check/route.ts` 생성:
```
POST — de minimis 확인
Body: {destination, value, currency?}
Response: {threshold: {amount, currency}, is_below_threshold: boolean, duty_free: boolean, vat_applies: boolean, notes: string}
```

2. `app/api/v1/de-minimis/optimize/route.ts` 생성:
```
POST — 최적화 제안
Body: {destination, items: [{value, weight}]}
Response: {total_value, threshold, can_split: boolean, split_suggestion?: {packages: [{items, value, below_threshold}]}, disclaimer: "Legal advisory: consult customs broker for split shipment compliance"}
```

### F006: Confidence Score → S+
**현재**: Basic confidence.
**구현:**

1. `app/lib/classification/confidence-calibration.ts` 생성:
```
- calibrateConfidence(rawScore, stage, hsChapter): number — Platt scaling
- getConfidenceBreakdown(classificationResult): {overall: number, components: {hs6_match: number, hs10_selection: number, data_freshness: number, historical_accuracy: number}}
- getConfidenceThresholds(): {auto_approve: 0.95, review_recommended: 0.80, manual_required: 0.60}
- routeByConfidence(score): 'auto'|'review'|'manual'
```

2. `app/api/v1/classify/confidence/route.ts` 생성:
```
GET ?hs_code=6109.10&product_name=cotton+tshirt
Response: {confidence: 0.97, breakdown: {...}, routing: 'auto', recommendation: string}
```

### F007: Multi-country Support → S+
**현재**: 240 countries.
**구현:**

1. `app/api/v1/countries/details/route.ts` 생성:
```
GET ?code=US — 국가 상세 정보
Response: {
  country: {code, name, region},
  import_requirements: {documents_required: string[], restrictions: string[], special_programs: string[]},
  data_coverage: {mfn_rates: boolean, min_rates: boolean, agr_rates: boolean, gov_schedule: boolean, last_updated: Date},
  risk_indicators: {customs_efficiency_rank: number, avg_clearance_days: number},
  trade_agreements: [{name, partner_countries}]
}
```

2. `app/api/v1/countries/compare/route.ts` 생성:
```
POST — 국가 비교
Body: {countries: ["US","DE","JP"], hs_code?}
Response: {comparison: [{country, vat_rate, de_minimis, avg_duty, clearance_time, special_taxes, fta_count}]}
```

### F008: Audit Trail → S+
**현재**: classification_audit table.
**구현:**

1. `supabase/migrations/037_audit_trail.sql` (번호 중복 없게 다음 번호 사용):
```sql
CREATE TABLE IF NOT EXISTS api_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL,
  user_id uuid,
  api_key_id text,
  endpoint text NOT NULL,
  method text NOT NULL,
  request_body jsonb,
  response_status int,
  response_time_ms int,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  prev_hash text -- 이전 레코드 해시 (tamper-proof chain)
);
CREATE INDEX idx_audit_log_user ON api_audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_endpoint ON api_audit_log(endpoint, created_at DESC);
```

2. `app/lib/audit/audit-logger.ts` 생성:
```
- logApiCall(params: {requestId, userId?, endpoint, method, body?, status, responseTimeMs, ip?, userAgent?}): Promise<void>
- searchAuditLog(filters: {userId?, endpoint?, dateFrom?, dateTo?, status?}, pagination): Promise<{logs, total, page}>
- exportAuditLog(filters, format: 'csv'|'json'): Promise<Buffer>
- getAuditStats(userId?): Promise<{total_calls, avg_response_ms, error_rate, top_endpoints}>
```

3. `app/api/v1/audit/search/route.ts` 생성:
```
GET ?user_id=xxx&endpoint=/classify&from=2026-01-01&to=2026-03-15&page=1&limit=50
```

4. `app/api/v1/audit/export/route.ts` 생성:
```
GET ?format=csv&from=2026-01-01 — 감사 로그 내보내기
```

### F009: Batch Processing → S+
**현재**: Basic batch with plan limits.
**구현:**

1. `app/lib/batch/async-batch.ts` 생성:
```
- createBatch(items, userId, webhookUrl?): Promise<{batchId, status: 'queued', itemCount}>
- processBatch(batchId): 비동기 처리, 아이템별 성공/실패 개별 추적
- getBatchStatus(batchId): Promise<{status: 'queued'|'processing'|'completed'|'partial_failure', progress: {total, completed, failed}, eta_seconds?, results_url?}>
- getBatchResults(batchId): Promise<{items: [{index, status, result?, error?}]}>
- 실패한 아이템은 건너뛰고 나머지 계속 처리 (partial failure)
- 완료 시 webhook POST (webhookUrl이 있으면)
```

2. `app/api/v1/batch/route.ts` 수정:
```
POST — batch 생성 (async)
Body: {items: [{product_name, origin, destination, value}], webhook_url?}
Response: {batch_id, status: 'queued', item_count, estimated_seconds}
```

3. `app/api/v1/batch/[batchId]/route.ts` 생성:
```
GET — batch 상태 확인
Response: {batch_id, status, progress: {total, completed, failed, percent}, results?: [...]}
```

### F010: Duty Rate Lookup → S+
**현재**: MFN/MIN/AGR 3-table parallel. 234M+ records.
**구현:**

1. `app/api/v1/duty-rates/schedule/route.ts` 생성:
```
GET ?hs_code=6109.10&country=US
Response: {hs_code, country, rates: [{type: 'MFN'|'FTA'|'AD'|'CVD'|'SG', rate, rate_type: 'ad_valorem'|'specific'|'compound', conditions?, effective_date, source}], effective_rate: number}
```

2. `app/api/v1/duty-rates/compare-origins/route.ts` 생성:
```
POST — 원산지별 세율 비교
Body: {hs_code, destination, origins: ["CN","VN","IN","BD"]}
Response: {destination, hs_code, origins: [{country, mfn_rate, best_fta_rate, ad_cvd?, total_effective_rate}], cheapest_origin}
```

3. `app/api/v1/duty-rates/history/route.ts` 생성:
```
GET ?hs_code=6109.10&country=US&months=12
Response: {hs_code, country, history: [{date, rate, change_reason?}]}
```

### F011: Insurance Calculation → S+
**현재**: Basic percentage.
**구현:**

1. `app/lib/cost-engine/insurance-calculator.ts` 생성:
```
- ProductCategory: 'electronics'|'textiles'|'hazmat'|'fragile'|'general'|'luxury'|'food'
- calculateInsurance(params: {value, category, origin, destination, shipping_mode}): {rate: number, amount: number, tier: string, mandatory: boolean, notes: string}
- 카테고리별 요율: electronics 1.5%, textiles 0.8%, hazmat 3%, fragile 2%, general 1%, luxury 2.5%, food 1.2%
- 고위험 경로 할증: +0.5% (분쟁지역, 해적위험 해역)
- 필수 보험 국가 플래그
```

### F012: HS Code Validation → S+
**현재**: Basic validation.
**구현:**

1. `app/lib/classification/hs-validator.ts` 생성:
```
- validateHsCode(code, country?): Promise<ValidationResult>
- ValidationResult: {valid: boolean, format_valid: boolean, exists_in_nomenclature: boolean, country_specific: boolean, deprecated: boolean, successor_code?: string, suggestions?: [{code, description, similarity}], valid_at_levels: {hs2: boolean, hs4: boolean, hs6: boolean, hs8?: boolean, hs10?: boolean}}
- 크로스-국가 검증: 같은 HS6이 국가별로 유효한지 확인
- Deprecated code 감지: HS 2017→2022 변환 매핑
- 제안: 유효하지 않으면 가장 가까운 유효 코드 3개 제안
```

2. `app/api/v1/validate/hs-code/route.ts` 생성:
```
POST — 단일 검증
Body: {hs_code, country?}
POST /bulk — 배치 검증
Body: {codes: [{hs_code, country?}]}
```

### F013: 10-Digit HS Expansion → S+
**현재**: 7-country pipeline. 89,842 gov rows.
**구현:**

1. `app/lib/classification/hs10-auto-selector.ts` 강화:
```
- selectHs10(params: {hs6, productName, price?, country}): Promise<Hs10Result>
- Hs10Result: {hs10, confidence, selection_method: 'exact_match'|'price_rule'|'keyword'|'ai', alternatives: [{hs10, score, reason}], explanation: string}
- 가중 점수 시스템: product name match (0.4) + price rule (0.3) + keyword (0.2) + frequency (0.1)
- 가격 분기: 모든 'valued over/under' 조건 자동 적용
```

2. `scripts/extract_all_price_breaks.py` 생성:
```
- gov_tariff_schedules에서 모든 가격 조건 텍스트 파싱
- 패턴: "valued over $X", "valued not over $X", "valued over $X but not over $Y", "containing X% or more"
- 결과를 hs_price_break_rules 테이블에 INSERT
- 현재 18개 → 목표 200+개
```

### F014: Shipping Cost Estimation → S+
**현재**: Basic weight-based.
**구현:**

1. `app/lib/shipping/shipping-calculator.ts` 생성:
```
- calculateDimWeight(length, width, height, unit: 'cm'|'in'): number
- estimateShipping(params: {origin, destination, weight, dimensions?, mode: 'express'|'standard'|'economy'}): Promise<ShippingEstimate>
- ShippingEstimate: {estimates: [{tier: 'express'|'standard'|'economy', cost_min, cost_max, transit_days_min, transit_days_max, carrier_type}], dim_weight?, actual_weight, billed_weight, surcharges: [{name, amount}]}
- 지역별 기본 요율 테이블 내장 (정확한 carrier rate 아닌 시장 평균 범위)
```

2. `app/api/v1/shipping/estimate/route.ts` 생성:
```
POST
Body: {origin, destination, weight_kg, length_cm?, width_cm?, height_cm?, mode?}
Response: ShippingEstimate
```

### F015: Price Break Rules → S+
**현재**: 18 rules only.
**구현:**

1. `app/lib/classification/price-break-engine.ts` 강화:
```
- evaluatePriceBreaks(hs10, price, country): Promise<PriceBreakResult>
- PriceBreakResult: {original_hs10, adjusted_hs10?, price_condition_met: string, duty_rate_before, duty_rate_after, price_threshold, impact: {duty_diff_pct, duty_diff_amount_per_unit}}
- 복합 조건: "valued over $X but not over $Y" 처리
- 퍼센트 기반: "containing X% or more of Y" 처리
```

2. `app/api/v1/price-breaks/check/route.ts` 생성:
```
POST
Body: {hs_code, price, country, quantity?}
Response: PriceBreakResult
```

3. `app/api/v1/price-breaks/optimize/route.ts` 생성:
```
POST — 가격 최적화 제안
Body: {hs_code, price, country}
Response: {current_rate, price_points: [{price_threshold, rate_if_below, rate_if_above, savings_per_unit}], optimization_note, disclaimer: "This is informational only. Consult customs advisor."}
```

### F016: Restricted Items Detection → S+
**현재**: sanctions only (75K+ records).
**구현:**

1. `app/lib/compliance/product-restrictions.ts` 생성:
```
- RestrictionLevel: 'prohibited'|'restricted'|'controlled'|'monitored'|'none'
- checkProductRestrictions(params: {hs_code, destination, origin?, description?}): Promise<RestrictionResult>
- RestrictionResult: {level: RestrictionLevel, restrictions: [{regulation, reason, requirement: string, authority}], dual_use: boolean, sanctions_hit: boolean, export_license_required: boolean, import_permit_required: boolean}
- 듀얼유즈 감지: Wassenaar Arrangement 카테고리 매핑 (HS→ECCN 기본 매핑)
- 국가별 금지품목 기본 DB (무기, 마약, 멸종위기종 CITES, 식품/의약품)
```

2. `app/api/v1/compliance/check/route.ts` 생성:
```
POST — 종합 컴플라이언스 체크
Body: {hs_code, product_name, origin, destination, end_user?, end_use?}
Response: {cleared: boolean, restriction_level, details: RestrictionResult, sanctions_check: {cleared, matches?}, recommendation}
```

---

## PHASE 2: TRADE 21개 기능 S+ 업그레이드

### F017: Trade Remedy Detection → S+
**현재**: 119K+ records. Detection works.
**구현:**

1. `app/lib/trade/remedy-calculator.ts` 생성:
```
- calculateRemedyDuty(params: {hs_code, origin, destination, value}): Promise<RemedyResult>
- RemedyResult: {ad_duties: [{case_id, rate, amount, effective_date, sunset_date, manufacturer_specific: boolean}], cvd_duties: [{case_id, rate, amount, subsidy_program}], safeguard: {applicable: boolean, rate?, quota_status?}, total_additional_duty, combined_effective_rate}
- 일몰재심 추적: sunset_date가 6개월 이내면 flag
```

2. `app/api/v1/trade-remedies/calculate/route.ts` 생성:
```
POST
Body: {hs_code, origin, destination, value, manufacturer?}
Response: RemedyResult + {alerts: [{type: 'sunset_review'|'new_petition', message, date}]}
```

### F018: Anti-Dumping Duties → S+
**구현:**

1. `app/api/v1/trade-remedies/ad/route.ts` 생성:
```
GET ?hs_code=xxx&origin=CN&destination=US
Response: {cases: [{case_id, title, rate_range: {min, max}, all_others_rate, manufacturers: [{name, rate}], effective_date, review_date, status}]}
```

### F019: Countervailing Duties → S+
**구현:**

1. `app/api/v1/trade-remedies/cvd/route.ts` 생성:
```
GET ?hs_code=xxx&origin=CN&destination=US
Response: {cases: [{case_id, title, subsidy_programs: [{name, rate}], combined_rate, effective_date}]}
```

### F020: Safeguard Measures → S+
**구현:**

1. `app/api/v1/trade-remedies/safeguard/route.ts` 생성:
```
GET ?hs_code=xxx&destination=US
Response: {measures: [{type: 'global'|'bilateral', rate, quota?: {limit, filled_pct}, exemptions: [{country, reason}], duration, phase_out_schedule: [{year, rate}]}]}
```

### F021: Sanctions Screening → S+
**현재**: 75K+ records.
**구현:**

1. `app/lib/compliance/fuzzy-screening.ts` 생성:
```
- fuzzyMatch(query, threshold: 0.85): Promise<ScreeningResult[]>
- 알고리즘: Levenshtein distance + Soundex phonetic + token-based matching
- ScreeningResult: {entity_name, match_score, match_type: 'exact'|'fuzzy'|'phonetic', list_source: 'OFAC_SDN'|'EU'|'UK'|'UN', entity_type, aliases, addresses, risk_score}
- batch screening: screenBatch(entities: string[]): Promise<ScreeningResult[][]>
```

2. `app/api/v1/sanctions/screen/route.ts` 수정/강화:
```
POST — 단일 스크리닝
Body: {name, type?: 'individual'|'entity', country?, additional_info?}
Response: {cleared: boolean, matches: ScreeningResult[], risk_score: 'low'|'medium'|'high'|'critical', screening_id, timestamp}

POST /batch — 배치 스크리닝
Body: {entities: [{name, type?, country?}]}
Response: {results: [{entity, cleared, matches}], summary: {total, cleared, flagged}}
```

### F022: Export Controls → S+
**구현:**

1. `app/lib/compliance/export-controls.ts` 생성:
```
- classifyECCN(params: {hs_code, product_name, technical_specs?}): Promise<ECCNResult>
- ECCNResult: {eccn: string, ear99: boolean, category: string, license_required: boolean, license_exceptions: string[], controlled_destinations: string[], reason_for_control: string[]}
- checkLicenseRequirement(eccn, destination, end_use?): Promise<{required: boolean, exception_available: boolean, exception_type?}>
- EAR 카테고리 0-9 기본 매핑
- Commerce Country Chart 매핑 (국가별 제재/통제 수준)
```

2. `app/api/v1/export-controls/classify/route.ts` 생성:
```
POST
Body: {hs_code, product_name, destination, end_use?, end_user?, technical_params?}
Response: ECCNResult + {license_determination: {required, exception?, commerce_country_chart_check}}
```

### F023: Rules of Origin → S+
**(F003에서 roo-engine.ts 이미 생성 — API 추가)**

1. `app/api/v1/roo/evaluate/route.ts` 생성:
```
POST
Body: {hs_code, origin, destination, fta_id?, product_value?, regional_value?, materials: [{hs_code, origin, value}]?}
Response: {eligible: boolean, method_used: 'RVC'|'CTH'|'CC'|'WO'|'PE', details: {rvc_result?: {percentage, threshold, met}, tariff_shift_result?: {input_hs_codes, output_hs_code, shift_type, met}}, qualifying_ftas: [{name, criteria, eligible}]}
```

### F024: Customs Valuation → S+
**구현:**

1. `app/lib/trade/customs-valuation.ts` 생성:
```
- WTO 6단계 관세 평가 방법:
  1. Transaction value (기본)
  2. Identical goods
  3. Similar goods
  4. Deductive method
  5. Computed method
  6. Fallback method
- calculateCustomsValue(params: {transaction_value, freight, insurance, incoterm, assists_value?, royalties?, related_party: boolean, buying_commissions?}): Promise<ValuationResult>
- ValuationResult: {customs_value, method_used: 1|2|3|4|5|6, breakdown: {fob, freight, insurance, assists, royalties, adjustments}, related_party_flag, first_sale_applicable: boolean}
```

2. `app/api/v1/valuation/calculate/route.ts` 생성:
```
POST
Body: {transaction_value, incoterm, origin, destination, freight?, insurance?, assists?, royalties?, related_party?}
Response: ValuationResult
```

### F025: Trade Agreement Database → S+
**구현:**

1. `app/api/v1/fta/database/route.ts` 생성:
```
GET — 전체 FTA 목록
GET ?origin=US&destination=KR — 특정 경로 FTA
GET ?fta_id=xxx — FTA 상세 (참여국, 발효일, 관세 감축 일정)
Response: {ftas: [{id, name, member_countries, effective_date, hs_coverage, tariff_schedule?: [{year, reduction_pct}]}]}
```

### F026: Incoterms Support → S+
**구현:**

1. `app/lib/trade/incoterms.ts` 생성:
```
- Incoterm: 'EXW'|'FCA'|'CPT'|'CIP'|'DAP'|'DPU'|'DDP'|'FAS'|'FOB'|'CFR'|'CIF'
- getCostAllocation(incoterm): {seller_pays: string[], buyer_pays: string[], risk_transfer_point: string}
- recommendIncoterm(params: {experience_level, transport_mode, product_type}): {recommended: Incoterm, reason: string, alternatives: [{term, pros, cons}]}
- compareIncoterms(params: {value, shipping, insurance, duties, terms: Incoterm[]}): [{term, seller_cost, buyer_cost, risk_for_buyer}]
- validateIncoterm(term, transport_mode): {valid: boolean, issue?: string} — e.g., FOB only for sea/inland waterway
```

2. `app/api/v1/incoterms/recommend/route.ts` 생성:
```
POST
Body: {transport_mode, experience_level: 'beginner'|'intermediate'|'expert', product_type}
Response: {recommended, alternatives, cost_comparison}
```

### F027: Customs Documentation → S+
**현재**: pdf-generator.ts with 5 doc types.
**구현:**

1. `app/lib/cost-engine/documents/doc-auto-populate.ts` 생성:
```
- autoPopulateFromCalculation(calculationResult, documentType): Promise<DocumentData>
- 계산 결과에서 자동으로 문서 필드 채우기 (product, hs code, value, origin, destination, duties 등)
- 국가별 템플릿 분기: US (CBP 7501), EU (SAD), UK (C88), KR (수입신고서)
```

2. `app/api/v1/documents/bundle/route.ts` 생성:
```
POST — 선적에 필요한 모든 서류 한번에 생성
Body: {calculation_id or calculation_params, documents?: ['commercial_invoice','packing_list','coo','customs_declaration']}
Response: PDF bundle (합쳐진 PDF)
```

### F028: Duty Drawback → S+
**구현:**

1. `app/lib/trade/duty-drawback.ts` 생성:
```
- DrawbackType: 'manufacturing'|'substitution'|'rejected_merchandise'
- calculateDrawback(params: {original_import: {hs_code, value, duty_paid, date}, export: {value, date}, drawback_type}): Promise<DrawbackResult>
- DrawbackResult: {eligible: boolean, refund_amount, refund_rate: 99|100, time_limit_remaining_days, required_documents: string[], filing_deadline}
```

2. `app/api/v1/drawback/calculate/route.ts` 생성

### F029: Temporary Import/Export → S+
**구현:**

1. `app/lib/trade/temporary-import.ts` 생성:
```
- getTemporaryAdmissionRules(country): Promise<TempAdmissionRules>
- TempAdmissionRules: {max_duration_months, bond_required: boolean, bond_rate_pct, eligible_purposes: string[], ata_carnet_accepted: boolean, re_export_requirements: string[]}
- calculateBond(value, country): {bond_amount, refundable: boolean}
```

2. `app/api/v1/temporary-import/rules/route.ts` 생성

### F030: Preferential Origin → S+
**구현:**

1. `app/api/v1/origin/self-certify/route.ts` 생성:
```
POST — 원산지 자가 인증서 데이터 생성
Body: {product, hs_code, origin, destination, fta_id, manufacturer, exporter}
Response: {declaration_text, fta_reference, validity_period, required_records, certification_type: 'self'|'approved_exporter'|'authority'}
```

### F031: Special Economic Zones → S+
**구현:**

1. `app/lib/trade/sez-database.ts` 생성:
```
- 주요 SEZ/FTZ 데이터: US FTZs, EU Free Zones, China SEZs, UAE Free Zones, Singapore FTZ 등
- getSEZBenefits(zone_id): {benefits: string[], eligible_activities: string[], tax_incentives: string[]}
- compareSEZ(zones: string[]): [{zone, duty_savings, tax_savings, requirements}]
```

2. `app/api/v1/sez/search/route.ts` 생성

### F032: Import Licensing → S+
**구현:**

1. `app/lib/trade/import-licensing.ts` 생성:
```
- checkLicenseRequirement(hs_code, destination): Promise<LicenseResult>
- LicenseResult: {required: boolean, license_type: 'automatic'|'non-automatic'|'quota', authority: string, processing_time_days: number, documents_needed: string[], fee?: number}
```

2. `app/api/v1/licensing/check/route.ts` 생성

### F033: IOSS Support → S+
**현재**: Basic IOSS endpoint.
**구현:**

1. `app/lib/tax/ioss-engine.ts` 강화:
```
- calculateIOSS(params: {value, destination_eu_country}): {ioss_applicable: boolean, vat_rate, vat_amount, threshold: 150, simplified_declaration: boolean}
- compareIOSSvsNonIOSS(params): {with_ioss: {buyer_pays}, without_ioss: {buyer_pays, import_vat, handling_fee}, savings_for_buyer}
- getRegistrationGuidance(seller_country): {steps: string[], intermediary_required: boolean, estimated_cost, processing_time}
```

2. `app/api/v1/ioss/compare/route.ts` 생성

### F034: DDP/DDU Calculator → S+
**구현:**

1. `app/api/v1/calculate/ddp-vs-ddu/route.ts` 생성:
```
POST
Body: {product_name, hs_code?, origin, destination, value, shipping}
Response: {
  ddp: {total_buyer_pays, breakdown: CostBreakdown, seller_responsibilities: string[]},
  ddu: {total_buyer_pays, breakdown: CostBreakdown, buyer_responsibilities: string[]},
  dap: {total_buyer_pays, breakdown: CostBreakdown},
  recommendation: {term, reason},
  comparison: {buyer_savings_ddp_vs_ddu, risk_summary}
}
```

### F035: Origin Prediction → S+
**구현:**

1. `app/lib/trade/origin-predictor.ts` 생성:
```
- predictOrigin(productName, brand?, category?): Promise<OriginPrediction>
- OriginPrediction: {predicted_origins: [{country, probability, basis: 'brand'|'category'|'trade_pattern'|'keyword'}], confidence, needs_verification: boolean}
- 주요 브랜드→원산지 매핑 (Samsung→KR, Apple→CN/IN/VN, Toyota→JP, etc.)
- 카테고리→주요 생산국 매핑 (textiles→BD/VN/CN, electronics→CN/TW/KR)
```

2. `app/api/v1/origin/predict/route.ts` 생성

### F036: Cross-Border Returns → S+
**구현:**

1. `app/lib/trade/returns-calculator.ts` 생성:
```
- calculateReturnCost(params: {original_import: {country, value, duty_paid}, return_destination}): Promise<ReturnCost>
- ReturnCost: {shipping_cost_estimate, duty_recovery: {eligible, amount, process}, total_return_cost, country_rules: {return_window_days, documentation_required: string[]}, net_loss}
```

2. `app/api/v1/returns/calculate/route.ts` 생성

### F037: Customs Broker Integration → S+
**구현:**

1. `app/lib/trade/broker-data-export.ts` 생성:
```
- exportForBroker(calculationResult, format: 'abi'|'json'|'csv'|'xml'): Promise<Buffer>
- ABI format: US Customs Automated Broker Interface 형식
- generatePreFilingPackage(params): Promise<{documents: Buffer[], data_summary: object, filing_checklist: string[]}>
```

2. `app/api/v1/broker/export/route.ts` 생성

---

## PHASE 3: 통합 테스트 & 검증

### 자동 테스트 파일 생성

`app/lib/tests/s-grade-verification.test.ts` 생성:

37개 기능 각각에 대해 최소 3개 테스트 케이스:
1. 정상 케이스 (happy path)
2. 엣지 케이스 (빈 입력, 잘못된 코드, 존재하지 않는 국가)
3. 실제 데이터 검증 (알려진 정답과 비교)

**핵심 검증 케이스 (실제 데이터 기반):**

```
// F001: Cotton t-shirt → HS 6109.10 (정답 확인)
// F001: "Samsung Galaxy S25" → HS 8517.13 (스마트폰)
// F001: "Nike Air Max running shoes" → HS 6404.11 (운동화)
// F002: $100 cotton tshirt CN→US = duty ~16.5% + no VAT (de minimis $800)
// F002: $100 cotton tshirt CN→DE = duty ~12% + VAT 19%
// F003: KR→US under KORUS FTA: textile duty reduction 확인
// F005: US de minimis $800, EU €150, UK £135, AU AUD1000, CA CAD20
// F010: HS 6109.10 CN→US MFN rate 확인 (실제 USITC와 대조)
// F017: 중국산 철강 US AD duty 존재 확인
// F021: "Bank of Iran" sanctions hit 확인
// F038: DE VAT 19%, UK VAT 20%, JP CT 10%, AU GST 10%
```

### 빌드 확인

마지막에 반드시:
```bash
npm run build
```
빌드 실패 시 즉시 수정.

### 검증 리포트

모든 작업 완료 후 `S_GRADE_VERIFICATION_REPORT.md` 파일 생성:
```
# S+ Grade Verification Report
- 날짜
- 37개 기능별: 구현 상태 (✅/❌), 테스트 결과, 새 파일 목록, 수정 파일 목록
- 빌드 결과
- 총 새 파일 수, 총 코드 라인 수
```

---

## 요약

| Phase | 기능 수 | 주요 내용 |
|-------|--------|----------|
| Phase 1 | Core 16 | 분류 피드백, 비용 분해, FTA/RoO, 감사, 배치, 보안 |
| Phase 2 | Trade 21 | 무역구제 계산, 제재 fuzzy, 수출통제, 관세평가, 임시수입 |
| Phase 3 | 검증 | 111+ 테스트 케이스, 실데이터 대조, 빌드 확인, 리포트 |

**예상 새 파일**: ~45개 (라이브러리 + API 엔드포인트 + 테스트 + 마이그레이션)
**절대 규칙**: npm run build 통과 필수. 실패 시 즉시 수정.
