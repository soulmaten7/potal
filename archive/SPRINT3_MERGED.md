아래 Sprint 3 전체 기능을 구현해. 에러 나면 자체 해결하고 계속 진행. npm run build 통과 필수. 한 번에 하나의 파일씩 수정하고, 중간에 막히면 스킵하고 다음으로 넘어갔다가 마지막에 다시 시도해.

# ═══════════════════════════════════════
# SPRINT 3: COMPLIANCE 완성 + CONTENT (P2)
# ═══════════════════════════════════════

## 파트 A: Compliance 서류 + 위험물 + ICS2 + IOSS + 제한품목

【F031 Customs Documentation S+】
1. POST /api/v1/customs-docs/generate 엔드포인트:
   - body: { doc_type, shipment: { shipper, consignee, items: [{hs_code, description, value, quantity, weight, origin}], destination, incoterms } }
   - doc_type 옵션: "commercial_invoice", "packing_list", "certificate_of_origin", "customs_declaration"
   - 각 서류 JSON 생성 (PDF는 F110에서 처리)
   - commercial_invoice: invoice_number(자동생성), date, parties, items, totals, incoterms, payment_terms
   - packing_list: items, gross_weight, net_weight, dimensions, package_count
   - certificate_of_origin: exporter, producer, items, origin_criteria, declaration
   - 서류 간 cross-validation: "invoice 수량 vs packing list 수량 불일치" 경고

2. GET /api/v1/customs-docs/requirements?origin=CN&destination=US:
   - required_documents 테이블 또는 하드코딩된 매트릭스
   - 주요 30개 경로 (CN/VN/BD/IN/DE/IT/JP/KR/TW/TH → US/EU/UK/CA/AU)
   - 응답: { required: ["commercial_invoice", "packing_list"], conditional: [{doc: "coo", condition: "FTA 사용 시"}], optional: ["insurance_certificate"] }

【F027 Dangerous Goods S+】
1. dangerous_goods 테이블:
   CREATE TABLE IF NOT EXISTS dangerous_goods (
     id serial PRIMARY KEY,
     un_number text NOT NULL,
     proper_shipping_name text,
     class text NOT NULL,
     division text,
     packing_group text,
     hs_codes text[],
     air_allowed boolean DEFAULT true,
     sea_allowed boolean DEFAULT true,
     special_provisions text
   );
2. 주요 50개 UN number 시딩 (일반 소비재 관련):
   - UN1266(Perfumery products, Class 3), UN2037(Gas cartridges, Class 2.2)
   - UN3481(Li-ion batteries in equipment, Class 9), UN3091(Li metal batteries, Class 9)
   - UN1950(Aerosols, Class 2.1), UN1263(Paint, Class 3)
   - UN3175(Solids containing flammable liquid, Class 4.1)
   - 등등 소비재/전자제품 관련 50건
3. calculate 응답에 dangerous_goods 필드:
   - HS코드의 앞 4자리로 dangerous_goods.hs_codes 매칭
   - 매칭 시: { is_dangerous: true, un_number, class, proper_shipping_name, air_restriction, sea_restriction }
   - 미매칭: { is_dangerous: false }

【F032 ICS2 S+】
1. EU 목적지일 때 calculate 응답에 ics2_data 객체 자동 추가:
   - { required: true, hs6_code, item_description_min_chars: 300, trader_id_required: true, release: "3", transport_modes: ["air","sea","road","rail"] }
   - "ICS2 Release 3: HS 6자리 필수, 상품 설명 최소 300자 권장"

【F033 IOSS S+】
1. /api/v1/ioss/check 확장:
   - EU 목적지 + value <= €150: { ioss_eligible: true, ioss_vat_rate: (목적지 회원국 VAT율), total_with_ioss }
   - EU 목적지 + value > €150: { ioss_eligible: false, reason: "Value exceeds €150", alternative: "Standard import VAT at customs" }
   - UK 목적지 + value <= £135: { vrn_applicable: true, uk_vat_rate: 20, note: "Seller collects VAT at point of sale" }
   - calculate 응답에 자동 포함 (EU/UK 목적지일 때)

【F014 Restricted Items S+】
1. restricted_items 테이블 확장 (없으면 생성):
   CREATE TABLE IF NOT EXISTS restricted_items (
     id serial PRIMARY KEY,
     hs_code_pattern text NOT NULL,
     origin_country text,
     destination_country text,
     restriction_type text NOT NULL,
     description text,
     license_info text,
     source text
   );
2. 주요 80건 시딩:
   - 무기/탄약 (93류): 대부분 국가 banned
   - 마약 전구체 (29류 일부): license_required
   - 위조품: 모든 국가 banned
   - 멸종위기종 (CITES): license_required
   - 문화재: 원산국에서 export_banned
   - 전자담배/담배 (24류): 국가별 다름
   - 식품/농산물: 검역 required (US, AU, NZ, JP 엄격)
   - hs_code_pattern: "93%" (93류 전체), "2939%" (특정 소분류) 등 LIKE 패턴
3. calculate 응답에 restrictions 필드:
   - HS코드 + origin + destination으로 restricted_items 조회
   - 매칭 시: { restricted: true, type, description, license_info }

【F022 Safeguard S+】
1. calculate 응답의 safeguard 필드 강화:
   - safeguard_exemptions 15,935건에서 HS코드 + origin 매칭
   - { applies: true/false, measure_name, additional_rate, effective_until, fta_exempt: boolean, exemption_reason }

【F028 Country-specific Prohibitions S+】
1. restrictions API에 방향 구분 추가:
   - import_restrictions: 목적지 기준 수입 금지/제한
   - export_restrictions: 원산지 기준 수출 금지/제한
   - 응답에 direction: "import"|"export"|"both" 필드

【F029 Dual-use Goods S+】
1. restricted_items에 dual_use 카테고리 추가:
   - restriction_type='dual_use'로 20건 시딩
   - 주요: 고성능 컴퓨터(8471), 암호화 장비(8543), 원심분리기(8421), 공작기계(8457-8462)
   - destination이 WMD 우려국(IR, KP, SY)이면 자동 플래그

---

## 파트 B: Shipping + PDF + SEO + AI Chatbot + 알림 + 데이터

【F060 Shipping Rate Estimate A+】
1. shipping_rate_estimates JSON 파일 (app/lib/data/shipping-rates.json):
   - 주요 20개 경로 × 5개 무게구간:
     CN→US, CN→EU, CN→UK, VN→US, VN→EU, IN→US, IN→EU, BD→US, BD→EU,
     DE→US, IT→US, JP→US, KR→US, TW→US, TH→US, TR→EU, MX→US, BR→US, AU→US, CA→US
   - 각 경로: { route, weight_brackets: [{max_kg:0.5, air_usd:15, sea_usd:5}, {max_kg:2, air_usd:25, sea_usd:10}, {max_kg:5, air_usd:45, sea_usd:18}, {max_kg:10, air_usd:80, sea_usd:30}, {max_kg:30, air_usd:200, sea_usd:60}] }
2. calculate 응답에 shipping_estimate 필드:
   - weight_kg 입력 시 → 해당 경로+무게 구간 매칭 → air/sea 견적
   - { air_estimate: 25.00, sea_estimate: 10.00, currency: "USD", note: "Estimate only. Contact carrier for exact rates." }

3. DDP Quote (F064):
   - Incoterms DDP 선택 시 → TLC + shipping_estimate = dpp_total
   - { ddp_total: 145.50, breakdown: { product: 100, duty: 12, tax: 8.50, shipping: 25 } }

4. Dimensional Weight (F065):
   - API에 dimensions: { length_cm, width_cm, height_cm } 추가 (optional)
   - dim_weight = L × W × H / 5000
   - billable_weight = MAX(actual_weight, dim_weight)
   - 응답에 billable_weight 포함

【F110 PDF Reports A+】
1. PDF 생성 라이브러리 설치: npm install @react-pdf/renderer 또는 puppeteer (더 쉬운 쪽)
   - puppeteer 권장: HTML → PDF 변환이 가장 유연
   - 또는 jspdf + jspdf-autotable (경량)
2. POST /api/v1/reports/pdf 엔드포인트:
   - body: { report_type: "landed_cost_invoice"|"compliance_report"|"classification_audit", data, branding: { logo_url, company_name } }
   - Landed Cost Invoice PDF:
     Header: POTAL 로고 (또는 고객 로고) + Invoice #
     Body: 15항목 비용 분해 테이블
     Footer: 면책 조항 + "Generated by POTAL"
   - 응답: PDF buffer (base64) 또는 다운로드 URL

【F111 Compliance Certificates A+】
1. /api/v1/customs-docs/generate?doc_type=certificate_of_origin&format=pdf
   - F031에서 생성한 CoO JSON → PDF 변환
   - 템플릿: 일반 CoO 양식

【F106-F107 Programmatic SEO A+】
1. app/tariff/[country]/[hs]/page.tsx 동적 페이지:
   - generateMetadata: title="[Country] Import Duty for [Product] (HS [code]) | POTAL"
   - 페이지 내용: HS코드 설명, MFN 세율, VAT율, de minimis, FTA 목록, 주의사항
   - DB에서 실시간 조회: countries + vat_gst_rates + de_minimis + macmap_ntlc_rates
   - generateStaticParams: 상위 100개 조합만 pre-render (나머지는 ISR)

2. Schema.org structured data:
   - FAQPage schema: "What is the import duty for [product] in [country]?"
   - Product schema: HS code, duty rate

3. /blog 기본 구조:
   - app/blog/page.tsx: 블로그 목록 (하드코딩 5개)
   - app/blog/[slug]/page.tsx: MDX 또는 하드코딩 콘텐츠
   - 5개 포스트: "what-is-landed-cost", "hs-code-guide", "fta-savings-guide", "de-minimis-explained", "potal-api-quickstart"
   - 각 포스트: 500-800 단어, SEO 최적화 메타태그

【F087 In-app Notifications A+】
1. notifications 테이블:
   CREATE TABLE IF NOT EXISTS notifications (
     id serial PRIMARY KEY,
     user_id uuid NOT NULL,
     type text NOT NULL,
     title text NOT NULL,
     message text,
     read boolean DEFAULT false,
     link text,
     created_at timestamptz DEFAULT now()
   );
2. 대시보드 헤더에 NotificationBell 컴포넌트:
   - 벨 아이콘 + 읽지 않은 개수 badge
   - 클릭 → 드롭다운: 최근 10개 알림
   - 각 알림: 제목, 메시지 미리보기, 시간, 읽음/안읽음
   - "모두 읽음" 버튼
   - Supabase REST API로 CRUD

【F115 Data Retention S】
1. data_retention_policies 로직:
   - plan-checker.ts에 retention_days 추가: Free:30, Basic:90, Pro:365, Enterprise:unlimited
   - Vercel Cron 신규 또는 기존 cron에 추가: 매일 03:30 UTC
   - api_usage_logs에서 created_at < NOW() - retention_days 인 rows 삭제
   - 삭제 전 export 기회 제공 (UI에서 "데이터 만료 예정" 알림)

【F143 AI Chatbot S】
1. Crisp webhook → AI 응답:
   - /api/v1/support/chat 엔드포인트 (Crisp webhook target)
   - 고객 질문 수신 → system prompt + POTAL 데이터 참조 → 응답 생성
   - system prompt: "You are POTAL's trade compliance AI assistant. You help with tariff calculations, HS code classification, customs regulations for 240 countries. Base your answers on POTAL's database. If unsure, direct to potal.app or suggest contacting support."
   - 간단한 질문 (VAT율, de minimis 등): DB 조회 → 즉답
   - 복잡한 질문: "이 질문은 전문 상담이 필요합니다. support@potal.app으로 문의해주세요."
   - Groq LLM 사용 (비용 최소화)

【F053 Tax Exemption Certificates S】
1. /dashboard/tax-exemptions 페이지:
   - 인증서 목록 (tax_exemption_certificates 테이블)
   - 업로드 버튼: 파일 업로드 + 유형 선택 (resale, diplomatic, nonprofit) + 만료일
   - 만료 30일 전 알림 (notifications에 자동 추가)
   - 거래 시 유효 인증서 자동 적용: calculate에서 buyer_id → 유효 인증서 체크 → 세금 면제

【F054 Sub-national Tax S+】
1. sub_national_taxes 테이블 확장 (있으면 데이터 추가):
   - Canada: BC PST 7%, SK PST 6%, MB PST 7%, QC QST 9.975% → 4건
   - India: 각 주 State GST (SGST) 대표 세율 → 10건 (주요 주만)
   - Brazil: ICMS 주별 → 5건 (SP 18%, RJ 20%, MG 18%, RS 18%, PR 19.5%)
   - US: 상위 10개 주 combined rate → 10건

【F055 DST S】
1. digital_services_tax 테이블 확장:
   - 40개국 DST 세율 시딩: UK 2%, FR 3%, IT 3%, ES 3%, AT 5%, IN 2%, TR 7.5%, KE 1.5%, NG 6%, ID 10% (PPN on digital), MY 8% (SST) 등

【F127 Knowledge Base S】
1. FAQ 확장: 13 → 50개:
   - 기존 13개 유지
   - 37개 추가 (AI 생성): HS코드 관련 10개, FTA 관련 5개, VAT 관련 5개, API 사용법 5개, 가격/플랜 5개, 트러블슈팅 7개
   - /support 또는 /faq 페이지에 카테고리별 표시
   - 검색 기능: 입력 → 제목/내용 필터링

npm run build 통과 확인. 에러 있으면 수정 후 다시 빌드.
