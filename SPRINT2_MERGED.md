아래 Sprint 2 전체 기능을 S급으로 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수. 한 번에 하나의 파일씩 수정하고, 중간에 막히면 스킵하고 다음으로 넘어갔다가 마지막에 다시 시도해.

# ═══════════════════════════════════════
# SPRINT 2: TRADE 확장 + PLATFORM 강화 (P1)
# ═══════════════════════════════════════

## 파트 A: 환율 + HS검증 + 가격분기 + de minimis + 국가프로필

【F011 Currency S+ — Rate Lock】
1. calculate API 응답에 exchange_rate_locked_until 필드 추가
2. rate_lock_minutes 파라미터 (기본 0, 설정 시 해당 시간 동안 환율 고정)
3. locked_rates 테이블 또는 메모리 캐시: rate_pair, rate, locked_at, expires_at
4. 같은 quote_id로 재요청 시 locked rate 사용
5. Historical Rate API: GET /api/v1/exchange-rate/historical?from=USD&to=EUR&date=2025-01-15

【F012 HS Validation S+】
1. /api/v1/validate 확장:
   - HS 2022 유효 코드 체크 (product_hs_mappings 또는 hs_codes 참조)
   - 만료 코드 감지 → "이 코드는 HS 2017입니다. HS 2022 후속 코드: XXXX" (correlation 데이터 없으면 안내 메시지만)
   - 국가별 유효성: gov_tariff_schedules에 해당 코드 존재 여부
   - 응답: { valid, hs_version, is_current, successor_code(nullable), country_validity: { US: true, EU: true } }

【F015 Price Break Rules S+ — 전수 추출】
1. scripts/extract_price_breaks.py 작성:
   - gov_tariff_schedules 89,842행을 Supabase REST API로 페이지네이션 조회
   - 정규식: "valued? ?(over|under|not over|exceeding|not exceeding) ?\$?[\d,.]+"
   - 추출 결과 → hs_price_break_rules 테이블에 UPSERT (기존 18건에 추가)
2. calculate 응답에 price_break_warning 필드:
   - 분기점과의 거리가 10% 이내면: "주의: 단가 $0.50만 변경되면 관세율 변경"

【F013 De Minimis S+】
1. de_minimis_exceptions 테이블 생성 (Supabase Management API SQL):
   CREATE TABLE IF NOT EXISTS de_minimis_exceptions (
     id serial PRIMARY KEY,
     country_code text NOT NULL,
     excluded_categories text[],
     shipment_type text DEFAULT 'all',
     special_rules text,
     effective_date date,
     notes text
   );
2. 주요 20건 시딩: US(CN/RU $0, tobacco/alcohol 제외), EU(€150 IOSS), UK(£135), AU(AUD1000), CA(CAD20), JP(JPY10000) 등
3. calculate API에 shipment_type 파라미터 추가 (personal/commercial)
4. 응답에 de_minimis_detail: { threshold, currency, exempt, exceptions, warning }

【F007 Multi-country S+ — 국가 프로필】
1. GET /api/v1/countries/[code] 엔드포인트:
   - countries + vat_gst_rates + de_minimis_thresholds + customs_fees 조인
   - active_ftas: macmap_trade_agreements에서 해당 국가 FTA 목록
   - data_freshness: last_updated + badge (green/yellow/red)
   - 응답: { country_name, iso_code, vat_rate, de_minimis, customs_fee, ftas: [...], regulatory_notes: [...], data_freshness }
2. country_regulatory_notes 테이블:
   CREATE TABLE IF NOT EXISTS country_regulatory_notes (
     id serial PRIMARY KEY,
     country_code text NOT NULL,
     category text,
     note_text text NOT NULL,
     effective_date date,
     source text
   );
3. 주요 30개국 규제 메모 시딩:
   - US: "Section 301: 중국산 추가관세 25% (List 1-3)", "Section 232: 철강 25%, 알루미늄 10%", "Section 321: CN/RU de minimis $0 (2026.02.28~)"
   - UK: "Brexit: EU FTA 적용 불가, UK-EU TCA 별도", "UK Global Tariff 적용"
   - EU: "ICS2 Release 3 필수 (2024.06~)", "Carbon Border Adjustment Mechanism (CBAM) 2026~"
   - 기타 주요국 각 1-3건씩
4. calculate 응답에 regulatory_warnings 배열 추가 (해당 국가 notes 포함)

---

## 파트 B: AD/CVD 강화 + 엠바고 + Type 86 + 선적전검증

【F020-F021 AD/CVD S+】
1. calculate 응답의 trade_remedies 필드 강화:
   - trade_remedy_cases + trade_remedy_duties + trade_remedy_products 조인
   - anti_dumping: { applies, order_number, rate, rate_type("company-specific"|"all-others"|"country-wide"), description }
   - countervailing: { applies, order_number, rate, description }
   - combined_additional_duty: AD + CVD 합산
   - scope_description: trade_remedy_cases.description (있으면)

【F030 Trade Embargo S+ (B→S+)】
1. embargo_programs 테이블 생성:
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
2. 데이터 시딩 (~25건):
   - Comprehensive: CU('Cuba'), IR('Iran'), KP('North Korea'), SY('Syria') → type='comprehensive', sectors='{all}'
   - Crimea region: UA-43 → type='comprehensive'
   - Sectoral: RU(technology,energy,finance,defense), CN(semiconductors,AI), VE(gold,oil,finance), MM(gems,timber) → type='sectoral'
   - 각각 exceptions 포함: 인도주의 물자, 의약품 등
3. /api/v1/screen 엔드포인트에 embargo 체크 통합:
   - destination_country가 embargo 대상이면 → embargo_warning 반환
   - comprehensive: "⚠️ Comprehensive embargo on [country]. OFAC license required."
   - sectoral: "⚠️ Sectoral sanctions on [country] for [sectors]. Check product category."

【F034 Type 86 S+ (B→S+)】
1. POST /api/v1/type86/prepare 엔드포인트:
   - body: { shipper_name, consignee_name, hs_code, declared_value, origin_country, product_description, tracking_number }
   - 로직:
     a) origin_country가 CN/RU/BY면 → "Section 321 de minimis 불가. 정식 통관 필요." 반환
     b) declared_value <= 800이면 → Type 86 가능, ACE filing JSON 생성
     c) declared_value > 800이면 → "Type 86 불가. 정식 entry 필요."
   - ACE filing JSON: { entry_type:"86", shipper, consignee, hs_code, value, origin, description, filing_date }

【F040 Pre-shipment Verification S+ (B→S+)】
1. POST /api/v1/verify/pre-shipment 엔드포인트:
   - body: { hs_code, origin, destination, declared_value, weight_kg(optional), documents_provided(optional) }
   - 내부적으로 기존 API들을 순차 호출:
     a) /validate → HS코드 유효성
     b) /calculate → 관세/세금 계산
     c) /screen → 제재 스크리닝
     d) restrictions 체크
     e) export_control_chart 체크
     f) de_minimis 체크
     g) embargo 체크
     h) dangerous_goods 체크
     i) 서류 완전성 체크 (documents_provided vs required_documents)
     j) 가격 합리성 (precomputed_landed_costs 기반 평균 대비)
   - 응답: {
       checklist: [{ item: "HS Code Valid", status: "PASS"|"FAIL"|"WARNING", detail: "..." }, ...],
       risk_score: 0-100,
       risk_level: "LOW"|"MEDIUM"|"HIGH",
       missing_documents: [...],
       estimated_clearance_time: "2-3 business days",
       recommendations: [...]
     }

---

## 파트 C: SDK + 위젯 + Batch + Reports + Checkout + VAT검증

【F050-F052 SDK 강화】
1. Python SDK 파일 생성 (sdk/python/ 폴더):
   - potal/__init__.py: version
   - potal/client.py: class PotalClient(api_key, base_url="https://www.potal.app/api/v1")
     - .calculate(product_name, hs_code, origin, destination, value, **kwargs) → dict
     - .classify(product_name, **kwargs) → dict
     - .screen(entity_name, country) → dict
     - .validate(hs_code) → dict
     - .batch_classify(items: list) → dict
   - potal/exceptions.py: PotalError, RateLimitError, AuthenticationError
   - potal/async_client.py: class AsyncPotalClient (aiohttp 기반)
   - setup.py + README.md
   - retry logic: 429 → exponential backoff (1s, 2s, 4s, max 3회)

2. JS SDK (sdk/javascript/ 폴더) — 기존 있으면 확장:
   - TypeScript types 완성: PotalClient, CalculateRequest, CalculateResponse 등
   - retry logic 동일

3. developers/page.tsx에 Code Snippets 탭:
   - JavaScript, Python, cURL 3개 탭
   - 각 엔드포인트(calculate, classify, screen)마다 복사 가능한 코드

【F071 White-label Widget S】
1. potal-widget.js 또는 위젯 config에 theme 옵션:
   - Potal.init({ apiKey, theme: { primaryColor, fontFamily, borderRadius, logoUrl, hideBranding } })
   - CSS variables: --potal-primary, --potal-secondary, --potal-font, --potal-radius
   - hideBranding: true면 "Powered by POTAL" 제거 (Pro+ 플랜 체크)

2. /dashboard/widget-builder 페이지:
   - 실시간 미리보기 (iframe 또는 shadow DOM)
   - 컬러 피커 (primaryColor, secondaryColor)
   - 폰트 선택 드롭다운
   - "코드 복사" 버튼 → <script> 태그 + config 생성

【F078 Batch Import/Export S】
1. Export 확장:
   - GET /api/v1/export?format=csv|json|xlsx&date_from=&date_to=
   - xlsx: SheetJS (xlsx 패키지) 또는 간단한 CSV → xlsx 변환
   - 헤더 포함: date, product_name, hs_code, origin, destination, duty, tax, total

2. Import 에러 핸들링:
   - POST /api/v1/import (multipart CSV 업로드)
   - 행별 validation: HS코드 형식, 국가코드 존재, 필수 필드
   - 응답: { success_count, failed_count, failed_rows: [{ row, error }], processed_results: [...] }
   - GET /api/v1/import/template → 빈 CSV 템플릿 다운로드

【F079-F080 Scheduled + Custom Reports S】
1. 5가지 리포트 API:
   - GET /api/v1/reports/usage?period=monthly → 월간 API 사용량 + 추이 데이터
   - GET /api/v1/reports/duties?period=monthly → 국가별 관세 요약
   - GET /api/v1/reports/products → 상위 분류 상품 top 20
   - GET /api/v1/reports/fta-savings → FTA 활용 절감액
   - GET /api/v1/reports/compliance → 스크리닝/플래그 현황
   - 모두 api_usage_logs 기반 집계

2. 스케줄 설정:
   - /dashboard/settings/reports 페이지: 리포트 종류별 frequency 선택 (off/weekly/monthly)
   - report_schedules 테이블: user_id, report_type, frequency, last_sent
   - Vercel Cron(기존 morning-brief에 추가 or 별도): weekly/monthly 체크 → Resend 발송

【F073 Checkout Integration S】
1. potal-widget.js에 checkout 모드 추가:
   - Potal.checkout({ items: [{name, hs_code, value, origin, quantity}], destination, currency })
   - 각 아이템별 duty + tax 계산 → 합산 표시
   - 장바구니 변경 시 debounce 500ms 재계산
   - 콜백: onCalculated(result), onError(error)

【F058 VAT Registration Check S】
1. POST /api/v1/vat/validate 엔드포인트:
   - body: { vat_number, country_code }
   - EU (country_code가 EU 회원국이면):
     VIES SOAP API 호출: https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl
     또는 REST: https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number
     → { valid, name, address }
     VIES API 실패 시 → 형식 검증만 (국가별 VAT 번호 정규식)
   - UK: HMRC API 또는 형식 검증 (GB + 9자리 또는 12자리)
   - 기타: 형식 검증만
   - vat_validation_cache 테이블: vat_number, country, valid, company_name, checked_at
   - 24시간 캐싱: 같은 번호 재조회 시 캐시 반환

npm run build 통과 확인. 에러 있으면 수정 후 다시 빌드.
