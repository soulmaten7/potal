# POTAL S-Grade — 전체 Sprint 명령어 모음
# 블록 1개 끝나면 바로 다음 블록 복사-붙여넣기
# Claude Code Max 기준 블록당 10-20분

---
---

# ████ SPRINT 1: CORE + TRADE (P0) ████

---

## S1-블록1: Dashboard + RBAC ✅ (이미 실행중)

---

## S1-블록2: TLC 15항목 + 관세유형 + Incoterms

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F004 Total Landed Cost S+】
1. app/lib/engines/CostEngine.ts (또는 GlobalCostEngine.ts) 확장:
   - API 응답의 cost breakdown을 15개 항목으로 분해:
     product_price, import_duty, anti_dumping_duty, countervailing_duty,
     safeguard_duty, vat_gst, customs_processing_fee, merchandise_processing_fee,
     harbor_maintenance_fee, insurance_estimate, freight_estimate,
     broker_fee_estimate, documentation_fee, currency_conversion_cost, total_landed_cost
   - 각 항목에 calculation_basis 문자열 추가: "MFN 5% on $100.00 = $5.00"
   - insurance_estimate: product_price × 0.01 (1% 기본, 국가별 조정 가능)
   - broker_fee_estimate: 국가별 평균 (US $200, EU €150, UK £120, 기타 $100)
   - 없는 항목은 0으로 표시하되 필드는 항상 포함

2. Incoterms 비교:
   - 응답에 incoterms_comparison 객체 추가:
     DDP: { total, breakdown: "seller pays all" }
     DAP: { total, breakdown: "buyer pays duty+tax", buyer_owes: X }
     EXW: { total, breakdown: "buyer pays all logistics", buyer_owes: Y }
   - 기존 calculate 엔드포인트에 통합

3. Multi-origin 비교 API:
   - POST /api/v1/calculate/compare-origins
   - body: { product_name, hs_code, product_value, origins: ["CN","VN","BD","IN","TR"], destination: "US", weight_kg(optional) }
   - 응답: origins 배열, 각각 TLC + 적용 FTA + 절감액, cheapest_origin 표시
   - 내부: 각 origin에 대해 기존 calculate 로직 호출 → 결과 비교

【F002 관세유형 확장】
1. 관세 계산 로직에 duty_type 분기 추가:
   - ad_valorem: product_value × rate% (현재 로직)
   - specific: weight_kg × rate_per_kg (신규)
   - compound: (product_value × ad_valorem_rate%) + (weight_kg × specific_rate) (신규)
   - mixed: MAX(ad_valorem_result, specific_result) (신규)
   - API 요청에 weight_kg 필드 추가 (optional, specific/compound 계산 시 필요)

2. Rate Optimization 필드:
   - API 응답에 rate_optimization 객체:
     available_rates: [{ type:"MFN", rate:12 }, { type:"FTA_CPTPP", rate:0, condition:"PSR CTH" }, ...]
     optimal: { type, rate, reason }
     savings_vs_mfn: { per_unit, annual_estimate(if volume provided) }
```

---

## S1-블록3: HS 분류 Explainability + 이미지

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F001 HS Classification — Explainability】
1. ai-classifier 응답에 reasoning_chain 배열 추가:
   - 분류 과정 각 단계를 기록:
     [{ step:"lookup", detail:"DB match: 'cotton t-shirt' → HS 6109.10", confidence:1.0 },
      { step:"keyword", detail:"Keywords matched: cotton, t-shirt, knitted", confidence:0.95 },
      { step:"chapter_note", detail:"Chapter 61 Note 2(a): knitted garments", confidence:0.98 }]
   - DB 매치(tier1)일 때도 reasoning 포함
   - LLM 폴백(tier3)일 때 LLM의 reasoning도 포함

2. ruling_reference 필드 추가 (nullable):
   - 현재는 CBP CROSS DB가 Supabase에 없으므로 null 반환
   - 스키마만 준비: { ruling_id, ruling_date, summary, source }
   - 향후 규정 DB 로딩 시 자동 교차검증 활성화

3. chapter_notes JSON 파일 생성:
   - app/lib/data/chapter-notes.json
   - 주요 20개 Chapter의 핵심 Note만 포함 (소비재 중심):
     Ch.61(편물의류), Ch.62(직물의류), Ch.64(신발), Ch.42(가죽제품),
     Ch.85(전기기기), Ch.84(기계), Ch.71(귀금속), Ch.39(플라스틱),
     Ch.73(철강제품), Ch.94(가구), Ch.95(완구), Ch.96(잡품),
     Ch.33(화장품), Ch.34(비누), Ch.48(종이), Ch.69(세라믹),
     Ch.70(유리), Ch.87(자동차), Ch.90(광학기기), Ch.44(목재)
   - 분류 결과에 해당 chapter note 자동 첨부

【F006 다차원 신뢰도】
1. confidence를 객체로 확장:
   - overall: 가중평균
   - semantic_match: 상품명↔HS설명 유사도 (0-1)
   - keyword_overlap: 핵심키워드 일치율 (0-1)
   - category_certainty: 카테고리 확정도 (tier1=1.0, tier2=0.85, tier3=variable)
   - price_consistency: 가격 분기 해당 여부 (price_break_rules 참조, 해당없으면 1.0)
2. 저신뢰도 플래그:
   - overall < 0.85 → review_recommended: true
   - overall < 0.70 → review_required: true

【F010 Image Classification (B→S+)】
1. POST /api/v1/classify/image 엔드포인트 신규:
   - multipart/form-data로 이미지 수신
   - Anthropic Claude API (claude-sonnet-4-5-20250514) Vision 사용
   - 프롬프트: "Analyze this product image. Extract: product_type, material, color, size_category, intended_use, brand_if_visible. Return JSON."
   - 추출 결과 → 기존 text classifier에 전달 → HS 코드 결정
   - 응답: { hs_code, confidence, image_analysis: {...}, reasoning_chain }

2. product_url 기반 분류:
   - POST /api/v1/classify 에 product_url 필드 추가 (optional)
   - URL 입력 시 → fetch → og:image 메타태그 추출 → 이미지 분류 자동 실행
   - + 페이지 title/description도 text 분류에 활용

ANTHROPIC_API_KEY는 .env.local에서 가져와서 사용. 없으면 process.env.ANTHROPIC_API_KEY.
```

---

## S1-블록4: FTA + 제재 + 수출통제

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F017 FTA 비교 API】
1. POST /api/v1/fta/compare 엔드포인트:
   - body: { hs_code, origin, destination, product_value }
   - 로직: macmap_trade_agreements에서 origin-destination 쌍의 모든 FTA 조회
   - 각 FTA별: 적용 세율, 절감액(vs MFN), PSR 요약(있으면)
   - 응답: { fta_options: [{name, rate, savings, psr_summary}], optimal_fta, total_savings }

2. FTA 활용률 필드:
   - 기존 calculate 응답에 fta_utilization 추가:
     { fta_available: true, fta_applied: "CPTPP", savings: 45.00, alternative_ftas: [...] }

【F018 PSR 테이블 + RVC 계산기】
1. Supabase에 product_specific_rules 테이블 생성 (Management API SQL):
   CREATE TABLE IF NOT EXISTS product_specific_rules (
     id serial PRIMARY KEY,
     fta_code text NOT NULL,
     hs6_code text NOT NULL,
     rule_type text NOT NULL,
     rule_text text,
     threshold_pct numeric,
     notes text,
     created_at timestamptz DEFAULT now()
   );
   CREATE INDEX idx_psr_fta_hs ON product_specific_rules(fta_code, hs6_code);

2. 주요 5개 FTA × 상위 20개 HS6 = 100건 PSR 시딩:
   - USMCA, CPTPP, EU-UK_TCA, RCEP, KORUS
   - 소비재 중심 HS: 6109(T-shirt), 6110(스웨터), 6403(신발), 8471(컴퓨터), 8517(스마트폰), 9503(완구) 등
   - rule_type: CTC(CC/CTH/CTSH), RVC, SP(specific process)
   - AI로 주요 PSR 생성 (정확한 규칙 기반)

3. POST /api/v1/roo/check:
   - body: { hs_code, fta_code, origin }
   - product_specific_rules 조회 → 해당 PSR 반환
   - 응답: { fta, rule_type, rule_text, threshold, certification_type }

4. POST /api/v1/roo/rvc-calc:
   - body: { product_value, originating_value, non_originating_value, method }
   - 계산: build-up = originating/product × 100, build-down = (product-non_orig)/product × 100
   - 응답: { rvc_percentage, method, threshold, meets_requirement }

【F023 제재 스크리닝 확장】
1. scripts/import_global_sanctions.py 작성:
   - EU CFSP: https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content → XML 파싱
   - UK OFSI: https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv → CSV 파싱
   - UN SC: https://scsanctions.un.org/resources/xml/en/consolidated.xml → XML 파싱
   - 각각 sanctions_entries에 INSERT (list_source 구분)
   - 중복 방지: ON CONFLICT DO NOTHING 또는 entity_name+list_source unique

2. Fuzzy matching 개선:
   - /api/v1/screen 엔드포인트에 similarity threshold 파라미터 추가 (기본 0.85)
   - Supabase pg_trgm 사용: WHERE similarity(entity_name, $1) > $threshold
   - pg_trgm 확장이 없으면 LIKE '%name%' 폴백

3. screening_logs 테이블:
   CREATE TABLE IF NOT EXISTS screening_logs (
     id serial PRIMARY KEY,
     query_name text, query_country text,
     matched_count int, top_match_score numeric,
     decision text, user_id uuid, seller_id uuid,
     created_at timestamptz DEFAULT now()
   );
   - 모든 스크리닝 결과 자동 로깅

【F025 수출통제 (B→S+)】
1. export_control_chart 테이블:
   CREATE TABLE IF NOT EXISTS export_control_chart (
     id serial PRIMARY KEY,
     eccn_group text, country_code text,
     reason_for_control text, license_required boolean,
     license_exceptions text[],
     notes text
   );

2. POST /api/v1/export-control/check:
   - body: { product_description, destination_country, eccn(optional) }
   - eccn 없으면 → AI로 ECCN 추천 (Groq LLM): "이 상품은 EAR99 또는 ECCN 3A001?"
   - eccn + country → export_control_chart 조회 → license 필요 여부
   - 응답: { eccn, ear99, license_required, available_exceptions, recommendation }

3. BIS Commerce Country Chart 시딩:
   - 주요 30개국 × 8개 control reason (AT, CB, CC, CW, EI, MT, NS, SS) = 240건
   - 핵심국: CN, RU, IR, KP, SY, CU (포괄 제재) + 주요 교역국 24개
```

---

## S1-블록5: Origin + VAT + Email

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F016 Origin Detection S+】
1. POST /api/v1/origin/determine 엔드포인트:
   - body: { raw_material_hs, finished_product_hs, manufacturing_country, fta_code(optional) }
   - 로직:
     a) HS heading 비교: raw 4자리 vs finished 4자리 → CTH 충족?
     b) HS chapter 비교: raw 2자리 vs finished 2자리 → CC 충족?
     c) fta_code 있으면 product_specific_rules 조회 → 해당 PSR 충족?
   - 응답: {
       origin_country, rule_met: "CTH",
       explanation: "원재료 5205(면사)→완제품 6109(T-shirt): Heading 변경 52→61 = CTH 충족",
       preferential_eligible: true
     }

2. 기존 classify 응답에 origin 관련 필드 강화:
   - detected_origin: 상품명/브랜드에서 추정한 원산지 (기존)
   - origin_type: "non_preferential" | "preferential"
   - origin_note: "Made in Vietnam detected from product description"

【F003 VAT 품목별 경감세율】
1. vat_product_rates 테이블 생성:
   CREATE TABLE IF NOT EXISTS vat_product_rates (
     id serial PRIMARY KEY,
     country_code text NOT NULL,
     hs_chapter text NOT NULL,
     product_category text,
     rate_type text NOT NULL DEFAULT 'standard',
     rate numeric NOT NULL,
     description text,
     UNIQUE(country_code, hs_chapter, rate_type)
   );

2. 주요 20개국 × 10개 카테고리 = 200건 시딩:
   (GB, DE, FR, IT, ES, NL, SE, PL, AT, IE, AU, CA, JP, KR, IN, BR, MX, TH, SG, AE)
   × (food, medicine, children_clothing, books, energy, medical_devices, education, electronics, luxury, digital)
   - food(01-24): GB 0%, DE 7%, FR 5.5%, AU 0%, JP 8%
   - medicine(30): 대부분 0% or 경감
   - children_clothing(61-62): GB 0%, IE 0%, 대부분 standard
   - books(49): GB 0%, DE 7%, FR 5.5%
   - 등등 (AI가 정확한 값으로 시딩)

3. GlobalCostEngine.ts 수정:
   - hs_code 앞 2자리(chapter) 추출
   - vat_product_rates 조회: country_code + hs_chapter
   - 매칭되면 해당 rate 사용, 없으면 기존 standard rate 사용
   - 응답에 vat_rate_type: "reduced" | "zero" | "exempt" | "standard" 포함

4. B2B reverse charge:
   - API 요청에 buyer_vat_number(optional) 추가
   - buyer_vat_number 있으면 → vat_amount = 0, reverse_charge: true
   - 응답에 표시: "B2B transaction: reverse charge applies. Buyer self-assesses VAT."

【F086 Email Notifications S】
1. 이메일 템플릿 6종 (app/lib/email/ 폴더):
   - welcome.tsx: React Email 컴포넌트 (POTAL 로고 + 시작 가이드 링크)
   - usage-alert-80.tsx: "사용량 80% 도달" 경고
   - usage-alert-100.tsx: "한도 도달" + 업그레이드 CTA
   - rate-change.tsx: "관련 세율 변경" 알림
   - weekly-summary.tsx: 주간 API 사용 요약 (요청수, 상위국가, 에러수)
   - security-alert.tsx: "새 IP에서 API 키 사용" 알림

2. Resend API로 발송 (기존 Resend 설정 활용):
   - app/lib/email/send.ts: sendEmail(type, to, data) 유틸리티
   - 템플릿 선택 → Resend API 호출 → 발송

3. plan-checker.ts에 usage alert 트리거 추가:
   - 사용량 80% 도달 시 → sendEmail('usage-alert-80', seller.email, { usage, limit })
   - 100% 도달 시 → sendEmail('usage-alert-100', ...)
   - 중복 방지: email_sent_logs 테이블 또는 Redis 캐시

4. notification_preferences 테이블:
   CREATE TABLE IF NOT EXISTS notification_preferences (
     id serial PRIMARY KEY,
     user_id uuid NOT NULL,
     notification_type text NOT NULL,
     email_enabled boolean DEFAULT true,
     in_app_enabled boolean DEFAULT true,
     UNIQUE(user_id, notification_type)
   );
   - 기본값: 모든 알림 활성화
   - /dashboard/settings 페이지에 토글 UI 추가
```

---
---

# ████ SPRINT 2: TRADE 확장 + PLATFORM (P1) ████

---

## S2-블록1: 신뢰도 + 환율 + HS검증 + 가격분기 + de minimis

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F011 Currency S+】
1. Rate Lock 기능:
   - calculate API 응답에 exchange_rate_locked_until 필드 추가
   - rate_lock_minutes 파라미터 (기본 0, 설정 시 해당 시간 동안 환율 고정)
   - locked_rates 테이블 또는 캐시: rate_pair, rate, locked_at, expires_at
   - 같은 session/quote_id로 재요청 시 locked rate 사용

2. Historical Rate API:
   - GET /api/v1/exchange-rate/historical?from=USD&to=EUR&date=2025-01-15
   - exchange_rate_history 테이블에서 조회 (없으면 현재 rate 반환)

【F012 HS Validation S+】
1. /api/v1/validate 확장:
   - 기존: 구조 검증 (2/4/6/8/10 자리)
   - 추가: HS 2022 유효 코드 체크 (hs_codes 테이블 또는 product_hs_mappings 참조)
   - 추가: 만료 코드 감지 → "이 코드는 HS 2017입니다. HS 2022 후속 코드: XXXX"
   - 추가: 국가별 유효성 (gov_tariff_schedules에 해당 코드 존재 여부)
   - 응답: { valid, hs_version, is_current, successor_code, country_validity: { US: true, EU: true } }

【F015 Price Break Rules S+】
1. gov_tariff_schedules 89,842행에서 가격 분기 규칙 자동 추출:
   - scripts/extract_price_breaks.py 작성
   - 정규식: "valued? (over|under|not over|exceeding|not exceeding) \$?[\d,.]+"
   - 추출 → hs_price_break_rules 테이블에 INSERT (기존 18건에 추가)
   - 예상: 200-500건 추가

2. 가격 분기 알림:
   - calculate 응답에 price_break_warning 필드:
   - "주의: 단가 $4.99→$5.01 시 관세율 5%→15% 변경 (분기점: $5.00)"
   - 분기점과의 거리가 10% 이내면 경고

【F013 De Minimis S+】
1. de_minimis_exceptions 테이블:
   - country_code, excluded_categories (tobacco, alcohol, perfume 등)
   - Section 321 변경 반영: US에서 CN/RU 발 de minimis $0
   - shipment_type(personal/commercial) 필드를 API에 추가

2. 누적 추적:
   - 동일 origin→destination 경로의 월간 누적 가치 표시
   - "이번 달 CN→US 누적 $650 (de minimis $0 — 중국발 면세 없음)"

【F007 Multi-country S+】
1. 국가 프로필 데이터:
   - /api/v1/countries/[code] 엔드포인트:
   - 응답: { country, vat_rate, de_minimis, customs_fees, active_ftas, regulatory_notes, data_freshness }
   - data_freshness: last_updated + freshness_badge (🟢<30일, 🟡30-90일, 🔴>90일)

2. country_regulatory_notes 테이블:
   - 주요 30개국 규제 메모 시딩 (US Section 301, UK Brexit, EU ICS2 등)
   - calculate 응답에 regulatory_warnings 배열 포함
```

---

## S2-블록2: AD/CVD + 엠바고 + Type86 + 선적전검증

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F020-F021 AD/CVD S+】
1. calculate 응답의 trade_remedies 필드 강화:
   - anti_dumping: { applies: true, order_number: "A-570-XXX", rate: 25.76, type: "company-specific", sunset_review: "2027-03" }
   - countervailing: { applies: true, order_number: "C-570-XXX", rate: 15.00 }
   - combined_rate: 40.76
   - 기존 trade_remedy_cases/duties/products 테이블에서 HS코드+원산지 매칭

2. Scope description 필드:
   - trade_remedy_cases에 scope_description이 있으면 → API 응답에 포함
   - "이 AD order의 scope: carbon steel butt-weld pipe fittings from China"

【F030 Trade Embargo S+ (B→S+)】
1. embargo_programs 테이블:
   CREATE TABLE IF NOT EXISTS embargo_programs (
     id serial PRIMARY KEY,
     country_code text NOT NULL,
     program_type text NOT NULL,
     program_name text,
     sectors text[],
     exceptions text[],
     effective_date date,
     description text
   );

2. 엠바고 데이터 시딩:
   - Comprehensive: CU, IR, KP, SY, 크리미아 → program_type='comprehensive'
   - Sectoral: RU(tech,energy,finance), CN(semiconductors), VE(gold,oil) → program_type='sectoral'
   - 20건 정도

3. /api/v1/screen 에 embargo 체크 통합:
   - destination이 embargo 대상이면 → embargo_warning 반환
   - "⚠️ Iran: Comprehensive embargo. OFAC license required for all transactions."
   - sectoral: "Russia: Sectoral sanctions on technology sector. Check if product falls under restricted sectors."

【F034 Type 86 S+ (B→S+)】
1. Section 321 변경 반영:
   - de_minimis_thresholds에서 US 데이터 업데이트:
   - CN, RU, BY, HK(from CN): de_minimis = $0 (2026-02-28~)
   - 기타: $800 유지
   - 이미 de minimis 로직에 반영되어야 함

2. POST /api/v1/type86/prepare:
   - body: { shipper, consignee, hs_code, value, origin, description, tracking_number }
   - 응답: ACE filing 데이터 JSON (broker에게 전달 가능한 형식)
   - 일일 aggregation 체크: "오늘 이 경로 누적 $X"
   - Section 321 불가 시: "중국발 → Type 86 불가. 정식 통관 필요."

【F040 Pre-shipment Verification S+ (B→S+)】
1. POST /api/v1/verify/pre-shipment:
   - body: { hs_code, origin, destination, value, documents_provided: [...] }
   - 10-point 자동 체크리스트 실행:
     ✅/❌ HS Code valid
     ✅/❌ Duties calculated
     ✅/❌ Sanctions screened
     ✅/❌ Restricted items checked
     ✅/❌ Export controls checked
     ✅/❌ De minimis checked
     ✅/❌ Required documents provided
     ✅/❌ Origin documentation
     ✅/❌ Value declaration reasonable
     ✅/❌ No trade embargo
   - risk_score: 0-100 (각 항목 가중치)
   - 응답: { checklist: [...], risk_score, risk_level: "LOW"|"MEDIUM"|"HIGH", missing_documents: [...] }
```

---

## S2-블록3: SDK + 위젯 + Batch + Reports + Checkout

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F050-F052 SDK 강화】
1. Python SDK (app/lib/sdk/python/ 또는 별도 폴더):
   - potal_sdk/__init__.py, client.py, models.py, exceptions.py
   - PotalClient(api_key) → .calculate(), .classify(), .screen(), .validate()
   - async 지원: AsyncPotalClient
   - retry logic: 429/5xx 시 exponential backoff
   - setup.py + README 준비 (pip install은 나중에)

2. JS SDK 강화 (기존 있으면 확장):
   - TypeScript types 완성
   - Auto-pagination for batch results
   - retry logic

3. API 문서의 Code Snippets:
   - developers/page.tsx에 언어별 탭 (JavaScript, Python, cURL)
   - 각 엔드포인트마다 복사 가능한 코드 스니펫

【F071 White-label Widget S】
1. Widget Theme System:
   - potal-widget.js 또는 위젯 설정에 theme 옵션 추가:
     { primaryColor, secondaryColor, fontFamily, borderRadius, logoUrl, hidebranding(Pro+) }
   - CSS variables로 구현: --potal-primary, --potal-font 등

2. Widget Builder 페이지:
   - /dashboard/widget-builder: 실시간 미리보기
   - 컬러 피커, 폰트 선택, 로고 업로드
   - "코드 복사" 버튼 → <script> 태그 생성

【F078 Batch Import/Export S】
1. Export 확장:
   - /api/v1/export 에 format 파라미터: csv, json, xlsx
   - xlsx: openpyxl 또는 SheetJS로 생성
   - 헤더 + 데이터 + 날짜 필터

2. Import 에러 핸들링:
   - CSV 업로드 시 행별 validation
   - 성공 건 즉시 처리 + 실패 건 별도 배열
   - failed_rows: [{ row: 5, error: "Invalid HS code format" }]
   - 템플릿 다운로드: /api/v1/import/template

【F079-F080 Reports S】
1. 5가지 기본 리포트 템플릿:
   - monthly_usage: 월간 API 사용량 + 추이
   - duty_summary: 국가별 관세 요약
   - top_products: 상위 분류 상품
   - fta_savings: FTA 활용 절감액
   - compliance_status: 스크리닝/플래그 현황

2. /api/v1/reports/generate:
   - body: { report_type, date_range, filters }
   - JSON 응답 (차트 데이터 포함)

3. 스케줄 리포트:
   - /dashboard/settings/reports에서 자동 발송 설정
   - weekly/monthly → Resend API로 이메일 발송

【F073 Checkout Integration S】
1. potal-widget.js 확장:
   - Potal.checkout({ items, destination }) → 실시간 관세 표시
   - 장바구니 금액 변경 시 자동 재계산 (debounce 300ms)
   - 응답: 각 아이템별 duty + tax + total

【F058 VAT Registration Check S】
1. POST /api/v1/vat/validate:
   - body: { vat_number, country_code }
   - EU: VIES SOAP API (ec.europa.eu) 호출
   - UK: HMRC API 호출
   - 응답: { valid, country, company_name, address }
   - 24시간 캐싱: vat_validation_cache 테이블

【F086 이미 S1-블록5에서 구현됨 → 스킵】
```

---
---

# ████ SPRINT 3: COMPLIANCE 완성 + CONTENT (P2) ████

---

## S3-블록1: Compliance 서류 + ICS2 + IOSS + 위험물

```
아래 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F031 Customs Documentation S+】
1. POST /api/v1/customs-docs/generate:
   - body: { doc_type, shipment_data }
   - doc_type: "commercial_invoice", "packing_list", "certificate_of_origin", "customs_declaration"
   - 응답: JSON 데이터 + PDF 생성 가능 여부
   - 서류 간 일관성 체크: invoice.quantity == packing_list.quantity

2. 국가별 필수 서류 매트릭스:
   - required_documents 테이블: origin, destination, doc_types[], conditions
   - /api/v1/customs-docs/requirements?origin=CN&destination=US
   - 응답: { required: ["commercial_invoice", "packing_list", "coo"], optional: ["eur1"] }

【F032 ICS2 S+】
1. ICS2 Release 3 데이터 필드:
   - API에 ics2_data 객체 추가 (EU 목적지일 때):
   - { hs6_code, trader_info, routing, transport_mode, pre_loading_consignment }
   - 모든 운송수단 커버 (air/sea/road/rail)

【F033 IOSS S+】
1. /api/v1/ioss/check 확장:
   - €150 이하: IOSS 적용 가능 → ioss_eligible: true
   - €150 초과: "IOSS 불가, 일반 통관 필요" → alternative_schemes 안내
   - 회원국별 VAT율 적용 (vat_gst_rates에서)
   - UK VRN: £135 threshold 별도 체크

【F027 Dangerous Goods S+】
1. dangerous_goods 테이블:
   - un_number, proper_shipping_name, class, division, packing_group, hs_codes[]
   - 주요 100개 UN number 시딩 (일반 소비재 관련)

2. calculate 응답에 dangerous_goods 필드:
   - HS코드로 dangerous_goods 매칭
   - { is_dangerous: true, un_number: "1203", class: 3, shipping_name: "Gasoline", restrictions: {...} }

【F014 Restricted Items S+】
1. restricted_items 테이블 확장:
   - origin_country, destination_country 복합키 추가
   - restriction_type: "banned", "license_required", "quota", "seasonal"
   - 주요 100건 시딩: 무기, 마약, 위조품, 멸종위기종, 문화재 등

【F022 Safeguard S+】
1. calculate 응답에 safeguard 상세 추가:
   - { applies, measure_name, rate, effective_until, fta_exempt }
   - fta_exempt: FTA 파트너국 면제 여부

【F028 Country Prohibitions S+】
1. restrictions API 확장:
   - import_prohibited + export_prohibited 구분
   - license_available: 조건부 허용 시 라이선스 안내

【F029 Dual-use S+】
1. 기존 restrictions에 dual_use 카테고리 추가
   - EU Regulation 2021/821 Annex I 주요 항목
   - Wassenaar 주요 항목
```

---

## S3-블록2: Shipping + PDF + SEO + AI Chatbot

```
아래 기능을 A+~S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F060 Shipping Rate A+】
1. 배송비 추정 로직 (carrier API 없이):
   - shipping_rate_estimates 테이블 또는 JSON:
     { route_type: "CN_US", weight_brackets: [{max_kg:0.5, air:15, sea:8}, {max_kg:2, air:25, sea:12}, ...] }
   - 주요 20개 경로 × 5개 무게구간 = 100건
   - calculate 응답에 shipping_estimate 필드 추가
   - "참고용 추정치입니다" 면책 표시

2. DDP Quote (F064):
   - TLC + shipping_estimate = DDP total
   - Incoterms DDP 선택 시 자동 포함

【F065 Dimensional Weight】
1. dim_weight = L × W × H / 5000 (cm/kg 기준)
   - API에 dimensions: { length, width, height, unit } 추가
   - billable_weight = MAX(actual_weight, dim_weight)

【F110 PDF Reports A+】
1. @react-pdf/renderer 또는 Puppeteer로 PDF 생성:
   - POST /api/v1/reports/pdf
   - body: { report_type, data, branding(optional) }
   - Landed Cost Invoice PDF: 15항목 분해 표
   - 고객 로고 삽입 가능 (base64 이미지)

【F111 Compliance Certificates A+】
1. Certificate of Origin PDF 자동 생성:
   - /api/v1/customs-docs/generate?type=coo&format=pdf
   - 템플릿: 일반 CoO, EUR.1, Form A
   - 거래 데이터 자동 채움

【F106-F107 Blog + SEO A+】
1. Programmatic SEO 페이지:
   - app/tariff/[country]/[hs-code]/page.tsx 동적 페이지
   - DB 기반 자동 생성: "US Import Duty for Cotton T-Shirts (HS 6109.10)"
   - generateStaticParams로 상위 1,000개 조합 pre-render
   - Schema.org FAQ structured data
   - 메타 태그: title, description, og:image 자동 생성

2. /blog 페이지:
   - MDX 기반 (contentlayer 또는 next-mdx-remote)
   - 초기 5개 포스트: "What is Landed Cost", "HS Code Guide", "FTA Savings", "De Minimis Explained", "POTAL API Quick Start"

【F087 In-app Notifications A+】
1. Notification Center:
   - 대시보드 헤더에 벨 아이콘
   - notifications 테이블: id, user_id, type, title, message, read, created_at
   - 드롭다운: 최근 10개 알림 + "전체 보기" 링크
   - 읽음/안읽음 토글

【F115 Data Retention S】
1. data_retention_policies 테이블:
   - plan_id, retention_days (Free:30, Basic:90, Pro:365, Enterprise:unlimited)
2. Vercel Cron: data-retention-cleanup (매일 03:30 UTC)
   - api_usage_logs에서 retention 초과 건 삭제
   - 삭제 전 알림: "30일 후 데이터 삭제 예정"

【F143 AI Chatbot S】
1. Crisp webhook → Claude API 연동:
   - 고객 질문 수신 → POTAL 데이터 기반 응답 생성
   - system prompt: "You are POTAL's trade compliance assistant. Answer questions about tariffs, HS codes, customs regulations for 240 countries."
   - 데이터 참조: vat_gst_rates, de_minimis, customs_fees 등
   - 모르는 건 "자세한 내용은 potal.app에서 확인하세요" + 해당 페이지 링크

【F053 Tax Exemption S】
【F054 Sub-national Tax S+】
【F055 DST S】
【F127 Knowledge Base S】
위 4개는 이미 기본 구현이 있으므로 데이터 확장 중심:
- Tax exemption: 인증서 업로드 UI + 거래 시 자동 적용
- Sub-national: Canada PST(4주), India State GST(28주) 추가 시딩
- DST: 40개국 세율 시딩
- KB: FAQ 13→50개 확장 (AI 생성)
```

---
---

# ████ SPRINT 4: BUSINESS SCALE (P3) ████

---

## S4-블록1: 플러그인 + 마켓플레이스 + ERP + 나머지

```
아래 기능을 A+급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수.

【F047-F048 BigCommerce + Magento A+】
1. plugins/bigcommerce/ 확장:
   - Stencil theme snippet: 상품 페이지에 관세 표시
   - Webhook: orders/created → POTAL calculate 호출
   - README.md: 설치 가이드

2. plugins/magento/ 확장:
   - Observer: sales_order_place_before → POTAL calculate
   - Block: 상품 페이지 관세 표시
   - README.md: 설치 가이드

【F082-F083 Marketplace + ERP A+】
1. marketplace_connections 활용:
   - /dashboard/integrations 페이지: 연동 가능 플랫폼 목록 (Shopify ✅, WooCommerce ✅, eBay 준비중, Etsy 준비중)
   - OAuth flow 준비: eBay/Etsy API credential 입력 → 토큰 저장

2. erp_connections 활용:
   - QuickBooks Online: OAuth 2.0 flow + Invoice 자동 생성 (관세 항목 포함)
   - Xero: OAuth 2.0 flow + Bill 생성

【F084 Accounting A+】
- F082-F083에 통합. 관세 비용 자동 분개 로직.

【F056 US State Sales Tax A+】
1. us_sales_tax_rates 테이블:
   - state, county, city, combined_rate, effective_date
   - 50주 기본 세율 시딩 (city/county는 상위 100개 도시만)
   - economic_nexus_thresholds: state, revenue_threshold, transaction_threshold

【F059 E-Invoice A+】
1. 기본 UBL 2.1 XML 생성기:
   - /api/v1/invoice/generate?format=ubl
   - Peppol BIS 3.0 호환 최소 필드셋

【F061-F070 Shipping A】
1. EasyPost API 연동 (또는 배송비 견적 API):
   - 있으면 연동, 없으면 정적 추정치 테이블 유지
   - 핵심: POTAL은 관세 데이터 공급자. 물류는 최소한.

【F035 Multi-language S】
- RTL 레이아웃 검증 (Arabic, Hebrew)
- 주요 5개 언어 번역 품질 검수

【F132-F133 Partner Portal A+】
1. /partners 페이지: 파트너 신청 폼
2. /dashboard/partners: 내 추천 현황

【나머지 Post-customer 기능들은 스킵 — 고객 확보 후 진행】
```

---
---

# 실행 요약

| Sprint | 블록 | 소요시간(Max) | 누적 |
|--------|------|-------------|------|
| S1 | 블록1 Dashboard+RBAC | ~15분 | 15분 |
| S1 | 블록2 TLC+관세 | ~15분 | 30분 |
| S1 | 블록3 HS분류+이미지 | ~15분 | 45분 |
| S1 | 블록4 FTA+제재+수출통제 | ~20분 | 65분 |
| S1 | 블록5 Origin+VAT+Email | ~15분 | 80분 |
| S2 | 블록1 환율+검증+demin | ~15분 | 95분 |
| S2 | 블록2 AD+엠바고+Type86 | ~15분 | 110분 |
| S2 | 블록3 SDK+위젯+Report | ~20분 | 130분 |
| S3 | 블록1 서류+ICS2+위험물 | ~15분 | 145분 |
| S3 | 블록2 Shipping+PDF+SEO+AI | ~20분 | 165분 |
| S4 | 블록1 플러그인+ERP+나머지 | ~20분 | 185분 |
| **합계** | **11블록** | **~3시간** | |

블록 끝날때마다 npm run build 확인 → 다음 블록 → 전부 끝나면 git push.
