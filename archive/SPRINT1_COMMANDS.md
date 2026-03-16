# POTAL S-Grade Sprint 1 — Claude Code 실행 명령어
# 총 5개 블록, 순서대로 하나씩 실행

---

## 블록 1/5: Dashboard S+ (F041 + F081 + F089 + F090)
> API 사용량 시각화 대시보드 + RBAC + 팀 관리
> 예상: 3-4시간

```
아래 4개 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F041 Dashboard S+】
1. app/dashboard/DashboardContent.tsx에 Recharts 기반 API Analytics 섹션 추가:
   - 실시간 요청 수 Line Chart (1시간/24시간/7일/30일 토글)
   - 엔드포인트별 요청 분포 Pie Chart (top 5 + others)
   - 응답 시간 분포 Bar Chart
   - 에러율 추이 Line Chart
   - 데이터 소스: api_usage_logs 테이블 (Supabase REST API로 조회)
   - 날짜 범위 선택기 (DatePicker)
   - "이번 달 예상 사용량: X/10,000건 (Y%)" 진행률 바
   - "현재 추세면 Z일에 한도 도달" 예측 텍스트

2. 새 API 엔드포인트 생성:
   - /api/v1/admin/analytics — api_usage_logs 집계 데이터 반환
   - 쿼리: 기간별 그룹핑, 엔드포인트별 카운트, 평균 응답시간, 에러율
   - seller_id 기반 필터링 (본인 데이터만)

【F081 Data Visualization — F041에 통합】

【F089 RBAC S급】
1. DB 테이블 생성 (Supabase Management API로 SQL 실행):
   - user_roles: id, user_id, seller_id, role(admin/manager/analyst/viewer), created_at
   - role_permissions: id, role, resource, action(create/read/update/delete), allowed
2. 기본 4개 역할 seed:
   - admin: 모든 권한
   - manager: billing+team+api (삭제 제외)
   - analyst: read+API 사용 (설정 변경 불가)
   - viewer: read-only (API 키 숨김)
3. middleware.ts에 역할 체크 추가:
   - /api/v1/admin/* → admin만
   - /api/v1/billing/* → admin, manager
   - /api/v1/* → admin, manager, analyst
   - 대시보드 UI: 역할에 따라 메뉴 항목 표시/숨김

【F090 Team Management — F089에 통합】
1. /dashboard/team 페이지:
   - 팀원 목록 (이름, 이메일, 역할, 마지막 활동)
   - 초대 버튼 → 이메일 입력 + 역할 선택 → Resend API로 초대 메일 발송
   - 역할 변경 드롭다운
   - 멤버 제거 버튼 (admin만)

패키지 필요 시: npm install recharts date-fns 등 자유롭게 설치.
모든 컴포넌트는 'use client' 지시어 사용.
```

---

## 블록 2/5: TLC Engine S+ (F004 + F002 확장)
> Total Landed Cost 15항목 분해 + 관세 유형 확장 + Incoterms 비교
> 예상: 4-5시간

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F004 Total Landed Cost S+】
1. app/lib/engines/CostEngine.ts 확장:
   - API 응답에 15개 비용 항목 분해:
     ① product_price ② import_duty ③ anti_dumping_duty ④ countervailing_duty
     ⑤ safeguard_duty ⑥ vat_gst ⑦ customs_processing_fee ⑧ merchandise_processing_fee
     ⑨ harbor_maintenance_fee ⑩ insurance_estimate ⑪ freight_estimate
     ⑫ broker_fee_estimate ⑬ documentation_fee ⑭ currency_conversion_cost ⑮ total_landed_cost
   - 각 항목에 calculation_basis 필드 추가 (계산 근거: "MFN 5% on $100 = $5")
   - insurance_estimate: CIF 기준 상품가격 × 0.5-1.5% (국가별 상이)
   - broker_fee_estimate: 국가별 평균 브로커 수수료 (US: $150-250, EU: €100-200)
   - currency_conversion_cost: interbank rate 기준 0% markup 표시

2. Incoterms 3-way 비교:
   - 새 필드: incoterms_comparison: { DDP: {...}, DAP: {...}, EXW: {...} }
   - DDP: seller가 모든 비용 (product + duty + tax + shipping + insurance)
   - DAP: seller가 shipping까지, buyer가 duty + tax
   - EXW: buyer가 모든 물류 비용
   - 각각의 total과 "누가 뭘 부담하는지" 명시

3. What-if 시나리오 API:
   - POST /api/v1/calculate/scenarios
   - body: { product, origins: ["CN", "VN", "BD"], destination: "US" }
   - 응답: 각 원산지별 TLC 비교 + 최저 비용 원산지 추천 + 절감액
   - FTA 자동 반영: "VN→US: CPTPP 0% vs CN→US: MFN 12%"

【F002 Duty Rate Calculation 확장】
1. duty_type 처리 확장:
   - app/lib/engines/의 관세 계산 로직에서:
   - specific duty 지원: "€2.50/kg" → weight 필드 필수화
   - compound duty: "5% + €1.20/kg" → ad_valorem + specific 합산
   - mixed duty: "10% OR €3/kg whichever higher" → 양쪽 계산 후 max 선택
   - API 요청에 weight_kg, quantity 필드 추가 (optional)

2. Rate Optimization 응답 필드:
   - available_rates: 모든 적용 가능 세율 나열 (MFN, FTA별, GSP, suspension 등)
   - optimal_rate: 최저 세율 + 사유
   - annual_savings_estimate: MFN 대비 절감액 (annual_volume 입력 시)
```

---

## 블록 3/5: HS Classification S+ (F001 + F006 + F010)
> 분류 엔진 독보적 수준 + 다차원 신뢰도 + 이미지 분류
> 예상: 4-5시간

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F001 HS Classification S+ — Explainability Engine】
1. 분류 응답에 reasoning_chain 필드 추가:
   - app/lib/ai-classifier/ 수정
   - reasoning_chain: [
       { step: "category_match", detail: "Product 'cotton t-shirt' → Category: Apparel/Tops", confidence: 0.99 },
       { step: "material_detection", detail: "Material: cotton (Chapter 52/61)", confidence: 0.95 },
       { step: "hs_heading", detail: "Knitted T-shirt → Heading 6109 (T-shirts, knitted)", confidence: 0.97 },
       { step: "hs_subheading", detail: "Of cotton → 6109.10", confidence: 0.98 },
       { step: "ruling_reference", detail: "Consistent with CBP Ruling HQ H302845", confidence: 0.99 }
     ]

2. BTI/Ruling 교차검증:
   - CBP CROSS Rulings 220,114건이 외장하드에 있음 (/Volumes/soulmaten/POTAL/regulations/)
   - 현재는 DB에 없으니, 분류 결과에 "BTI 교차검증은 향후 규정 DB 로딩 후 활성화" 플래그
   - ruling_reference 필드를 API 응답 스키마에 추가 (nullable)

3. WCO Chapter Notes 참조:
   - HS 2022 Chapter Notes를 JSON으로 정리 (주요 20개 Chapter만 우선)
   - 분류 시 관련 Note 자동 인용: "Note 2(a) to Chapter 61: applies to knitted or crocheted garments"
   - chapter_notes 테이블 또는 JSON 파일로 저장

【F006 Classification Confidence S+ — 다차원 신뢰도】
1. 단일 confidence → 6차원으로 확장:
   - overall_confidence: 가중 평균
   - semantic_match: 상품명과 HS 설명 코사인 유사도
   - keyword_overlap: 핵심 키워드 일치 비율
   - category_certainty: 카테고리 매핑 확실성
   - price_consistency: 가격대 적합성 (price_break_rules 기반)
   - historical_accuracy: 동일 패턴 과거 정확도 (api_usage_logs에서 추출)

2. 저신뢰도 자동 플래그:
   - confidence < 0.85 → response에 review_recommended: true
   - confidence < 0.70 → review_required: true
   - Enterprise 알림 연동 (이메일)

【F010 Image Classification S+ (B→S+)】
1. Vision API 연동:
   - /api/v1/classify/image 엔드포인트 신규 생성
   - 이미지 업로드 (multipart/form-data) → Claude Vision API (claude-sonnet-4-5-20250514)로 분석
   - 추출 정보: product_type, material, color, size_category, intended_use
   - 비용: ~$0.003/이미지

2. Image + Text 복합 분류:
   - text_confidence + image_confidence → combined_confidence
   - 불일치 감지: text="cotton shirt" but image analysis="synthetic" → mismatch_flag: true

3. URL 이미지 추출:
   - product_url 입력 → og:image 메타태그에서 이미지 URL 추출
   - 자동으로 이미지 분류 실행

필요 패키지: npm install 해서 처리. Anthropic API key는 .env.local의 ANTHROPIC_API_KEY 사용.
```

---

## 블록 4/5: Trade Compliance S+ (F017-F019 + F023 + F025)
> FTA PSR 엔진 + 제재 스크리닝 글로벌 확장 + 수출통제
> 예상: 5-6시간

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F017 FTA Detection S+ — 상품별 적격성】
1. FTA 비교 API:
   - POST /api/v1/fta/compare
   - body: { hs_code, origin, destination, product_value }
   - 응답: 적용 가능한 모든 FTA 나열 + 각각의 세율 + PSR 요약 + 절감액
   - "USMCA: 0% (PSR: CTH 충족 필요) vs CPTPP: 2.5% (PSR: RVC 40%)"

2. FTA 활용률 분석:
   - api_usage_logs에서 FTA 사용/미사용 분석
   - 대시보드에 "FTA 활용 가능했지만 미활용 건수: N건, 절감 가능액: $X" 표시
   - fta_utilization 응답 필드 추가

【F018 Rules of Origin S+ — PSR 엔진】
1. product_specific_rules 테이블 생성 (SQL):
   - id, fta_code, hs6_code, rule_type (CTC/RVC/SP/combination), rule_text, threshold_pct, notes
2. 주요 5개 FTA PSR 시딩:
   - USMCA: 주요 50개 HS chapter PSR
   - CPTPP: 주요 50개 HS chapter PSR
   - EU-UK TCA: 주요 30개 HS chapter PSR
   - RCEP: 주요 30개 HS chapter PSR
   - KORUS: 주요 30개 HS chapter PSR
   - (정확한 규칙은 각 FTA 원문 Annex에서, AI가 주요 소비재 중심으로 추출)
3. RVC Calculator API:
   - POST /api/v1/roo/rvc-calc
   - body: { product_value, originating_materials_value, non_originating_value, method: "build-up"|"build-down"|"net-cost" }
   - 응답: rvc_percentage, threshold, meets_requirement (boolean), fta_name

【F019 Preferential Rates S+ — 전체 세율 비교 테이블】
1. API 응답 rate_comparison 필드:
   - 모든 적용 가능 세율 나열:
     { rate_type: "MFN", rate: 12, source: "WTO" }
     { rate_type: "FTA_CPTPP", rate: 0, source: "CPTPP", psr_required: "CTH" }
     { rate_type: "GSP", rate: 8, source: "US GSP" }
     { rate_type: "DUTY_SUSPENSION", rate: 0, source: "EU Council Reg", valid_until: "2026-12-31" }
   - optimal_rate: 최저 세율 자동 선택
   - savings_vs_mfn: MFN 대비 절감액

【F023 Sanctions Screening S+ — 글로벌 확장】
1. 기존 OFAC SDN 21,301건에 추가:
   - EU CFSP 리스트: ec.europa.eu에서 XML 다운로드 → sanctions_entries에 INSERT (list_source='EU_CFSP')
   - UK OFSI 리스트: gov.uk에서 CSV/XML 다운로드 → INSERT (list_source='UK_OFSI')
   - UN SC 리스트: un.org에서 XML 다운로드 → INSERT (list_source='UN_SC')
   - 다운로드+파싱+임포트 스크립트 작성 (scripts/import_global_sanctions.py)
   - 중복 제거: entity_name + list_source 기준

2. Fuzzy Matching 개선:
   - 현재 exact match만이면 → Jaro-Winkler similarity 추가
   - pg_trgm 확장 사용 (Supabase에 이미 있을 수 있음)
   - similarity threshold 0.85 기본, Enterprise에서 조정 가능

3. Screening Audit Trail:
   - screening_logs 테이블: id, query, matched_entities[], match_score, decision, timestamp, user_id
   - 모든 스크리닝 결과 기록 → 규제 감사 대응

【F025 Export Controls S+ (B→S+)】
1. Commerce Country Chart DB:
   - export_control_chart 테이블: eccn_group, country_code, reason_for_control, license_required(boolean), license_exception
   - BIS Commerce Country Chart 데이터 시딩 (240개국 × 8 control reasons)
2. ECCN 추천 API:
   - POST /api/v1/export-control/classify
   - body: { product_description, technical_specs (optional) }
   - AI 기반 ECCN 추천 + EAR99 여부 판별
   - 응답: eccn, description, license_required, license_exceptions[], reason
3. License Determination:
   - POST /api/v1/export-control/license-check
   - body: { eccn, destination_country, end_user (optional) }
   - Country Chart 조회 → 라이선스 필요 여부 + 가능한 exception 목록
```

---

## 블록 5/5: Origin + VAT + Email (F016 + F003 + F086)
> 원산지 판정 강화 + VAT 품목별 세율 + 이메일 알림 체계
> 예상: 3-4시간

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F016 Origin Detection S+ — 실질적 변형 판단】
1. origin_rules 테이블 생성:
   - id, fta_code, hs6_code, transformation_type (CC/CTH/CTSH), description
2. Substantial Transformation 판단 API:
   - POST /api/v1/origin/determine
   - body: { raw_material_hs: "5205.11", finished_product_hs: "6109.10", manufacturing_country: "VN", fta: "CPTPP" }
   - 응답: { origin_country: "VN", rule_met: "CTH", explanation: "원재료 5205(면사)→완제품 6109(T-shirt): Heading 변경(52→61) = CTH 충족", preferential_eligible: true }

3. Non-preferential vs Preferential 구분:
   - API 응답에 두 가지 원산지 표시:
     non_preferential_origin: "VN" (MFN 적용 기준)
     preferential_origin: "VN" (FTA 적용 기준, PSR 충족 시)
   - 둘이 다를 수 있음 (예: 단순 가공은 non-preferential만 충족)

【F003 VAT/GST S+ — 품목별 경감세율】
1. vat_product_rates 테이블 생성:
   - id, country_code, hs_chapter (2자리), product_category, rate_type (standard/reduced/zero/exempt), rate, description
2. 주요 20개국 × 10개 카테고리 시딩 (200건):
   - 식품(Chapter 01-24): EU 0-9%, UK 0%, AU 0%
   - 의약품(Chapter 30): EU 대부분 0%, UK 0%
   - 아동복(Chapter 61-62): UK 0%, IE 0%, 대부분 EU standard
   - 서적(Chapter 49): EU 0-6%, UK 0%
   - 에너지(Chapter 27): 국가별 경감세율
   - 의료기기(Chapter 90): 대부분 경감
   - 교육자료: 일부 국가 면세
   - 전자기기(Chapter 84-85): 대부분 standard
   - 사치품: 일부 국가 할증
   - 디지털 상품: OECD 가이드라인 기반
3. GlobalCostEngine.ts에서 HS chapter 기반 자동 세율 조회:
   - 기본: standard rate (현재 로직)
   - hs_chapter 입력 시 → vat_product_rates 조회 → 해당 경감/영세/면세율 적용

4. B2B Reverse Charge:
   - API 요청에 buyer_vat_number 필드 추가 (optional)
   - buyer_vat_number 있으면 → B2B 거래 → import_vat = 0 (reverse charge)
   - 응답에 reverse_charge: true, buyer_self_assessment_required: true 표시

【F086 Email Notifications S+】
1. 이메일 템플릿 6종 (Resend API + React Email):
   - welcome: 가입 환영 + 시작 가이드
   - usage_alert_80: "사용량 80% 도달" 경고
   - usage_alert_100: "한도 도달" + 업그레이드 CTA
   - rate_change: "귀하 관련 세율 변경" 알림
   - weekly_summary: 주간 API 사용 요약
   - security_alert: 새 기기/IP 로그인 알림

2. 알림 설정 페이지:
   - /dashboard/settings/notifications
   - 각 알림 유형별 on/off 토글
   - notification_preferences 테이블: user_id, notification_type, enabled, channel(email/in-app)

3. Usage alert 자동 발송:
   - plan-checker.ts에서 사용량 체크 시 80%/100% 감지 → Resend API 자동 발송
   - 중복 발송 방지: 같은 billing period 내 1회만
```

---

## 실행 순서

1. **블록 1** (Dashboard + RBAC) → 가장 먼저. 고객이 바로 보는 UI.
2. **블록 2** (TLC + 관세) → 핵심 엔진 강화. POTAL의 본질.
3. **블록 3** (HS 분류) → 분류 품질 독보적으로.
4. **블록 4** (Trade Compliance) → 컴플라이언스 완전체.
5. **블록 5** (Origin + VAT + Email) → 마무리.

각 블록 완료 후 `npm run build` 통과 확인하고, 다음 블록 진행.
전체 완료 후 `git add -A && git commit -m "Sprint 1: Core+Trade S-Grade upgrade"` → Mac에서 push.
