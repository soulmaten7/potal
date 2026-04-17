# POTAL Data Master List
## 생성일: 2026-04-17
## 총 데이터 소스: 약 170개 (Supabase 107 + Static Files 41 + Hardcoded Constants 15 + External APIs 14)

---

### Category 1: Supabase Tables (107개)

**총 107개 테이블 / RPC 함수 3개**
- SELECT 전용 (읽기만): 58개
- INSERT/UPDATE/UPSERT/DELETE 포함 (쓰기): 49개

#### 1-A. 핵심 데이터 테이블 (Scheduled Task 갱신 대상)

| # | 테이블명 | 용도 | 사용 파일 수 | 읽기/쓰기 | 갱신 방법 | 갱신 주기 |
|---|---------|------|------------|----------|---------|---------|
| 1 | macmap_ntlc_rates | MFN 관세율 (MacMap) | 7 | READ | potal-annual-data-refresh | 연간 |
| 2 | macmap_agr_rates | FTA 협정 관세율 (MacMap) | 다수 | READ | potal-annual-data-refresh | 연간 |
| 3 | macmap_min_rates | 최저 적용 관세율 (MacMap) | 다수 | READ | potal-annual-data-refresh | 연간 |
| 4 | gov_tariff_schedules | 7개국 정부 관세 스케줄 | 9 | READ | potal-annual-data-refresh | 연간 |
| 5 | vat_gst_rates | 241개국 VAT/GST 세율 | 6 | READ | potal-semiannual-hardcoded-check | 반기 |
| 6 | de_minimis_thresholds | 241개국 면세 한도 | 9 | READ | potal-semiannual-hardcoded-check | 반기 |
| 7 | country_profiles | 국가별 프로필 | 2 | READ | potal-annual-data-refresh | 연간 |
| 8 | fta_agreements | FTA 협정 목록 (65개) | 다수 | READ | potal-quarterly-fta-check | 분기 |
| 9 | fta_members | FTA 회원국 (559개) | 다수 | READ | potal-quarterly-fta-check | 분기 |
| 10 | fta_product_rules | FTA 원산지 규정 (2,209개) | 다수 | READ | potal-quarterly-fta-check | 분기 |
| 11 | fta_rates_live | FTA 실시간 세율 | 다수 | READ/WRITE | potal-quarterly-fta-check | 분기 (현재 0 rows) |
| 12 | duty_rates_live | 실시간 관세율 캐시 | 다수 | READ/WRITE | tariff-api-client 자동 | 실시간 (현재 0 rows) |
| 13 | trade_remedies | 반덤핑/상계관세 (590개) | 다수 | READ | potal-semiannual-hardcoded-check | 반기 |
| 14 | restricted_items | 수입제한 품목 (161개) | 다수 | READ | potal-semiannual-hardcoded-check | 반기 |
| 15 | sanctioned_entities | 제재 대상 엔티티 | 다수 | READ | potal-semiannual-hardcoded-check | 반기 |
| 16 | export_control_chart | 수출통제 차트 | 다수 | READ | 미연결 — 추가 필요 |
| 17 | eccn_entries | ECCN 분류 항목 | 다수 | READ | 미연결 — 추가 필요 |
| 18 | us_sales_tax_rates | 미국 주별 세일즈택스 | 다수 | READ | potal-semiannual-hardcoded-check | 반기 |
| 19 | eu_reduced_vat | EU 품목별 감면 VAT (46개) | 다수 | READ | potal-semiannual-hardcoded-check | 반기 |
| 20 | customs_rulings | 관세 판례 (645K) | 다수 | READ | potal-annual-data-refresh | 연간 |
| 21 | hs_codes | HS 코드 마스터 | 다수 | READ | potal-annual-data-refresh | 연간 |

#### 1-B. HS 분류 엔진 테이블

| # | 테이블명 | 용도 | 읽기/쓰기 | 갱신 방법 |
|---|---------|------|----------|---------|
| 22 | codified_rules | Section/Chapter Note 규칙 (592개) | READ | 수동 시드 (WCO 업데이트 시) |
| 23 | hs_heading_descriptions | HS Heading 설명 (1,233개) | READ | 수동 시드 (WCO 업데이트 시) |
| 24 | hs_subheading_descriptions | HS Subheading 설명 (5,621개) | READ | 수동 시드 (WCO 업데이트 시) |
| 25 | conflict_patterns | CBP/EBTI 충돌 패턴 (~1,563개) | READ | 수동 시드 |
| 26 | classification_vectors | 벡터 임베딩 (pgvector) | READ | 수동 시드 |
| 27 | country_codified_rules | 국가별 분류 규칙 (7개국) | READ | 수동 시드 |
| 28 | gri_classification_cache | GRI 분류 결과 캐시 | READ/WRITE | 앱 자동 생성 |
| 29 | hs_classification_audit | 분류 감사 로그 | WRITE | 앱 자동 생성 |
| 30 | classification_feedback | 분류 피드백 (ML 학습) | READ/WRITE | 사용자 생성 |
| 31 | hs_price_break_rules | 가격대별 분류 규칙 | READ | 수동 시드 |

#### 1-C. 사용자/비즈니스 테이블

| # | 테이블명 | 용도 | 읽기/쓰기 | 갱신 방법 |
|---|---------|------|----------|---------|
| 32 | sellers | 판매자/계정 관리 | 19 파일, READ/WRITE | 사용자 생성 — 갱신 불필요 |
| 33 | profiles | 사용자 프로필 | READ/WRITE | 사용자 생성 |
| 34 | api_keys | API 키 관리 | 7 파일, READ/WRITE | 사용자 생성 |
| 35 | partner_accounts | 파트너 계정 | READ/WRITE | 사용자 생성 |
| 36 | shopify_stores | Shopify 스토어 연결 | READ/WRITE | 사용자 생성 (OAuth) |
| 37 | bigcommerce_stores | BigCommerce 스토어 연결 | READ/WRITE | 사용자 생성 (OAuth) |
| 38 | seller_nexus_tracking | US Nexus 추적 | READ/WRITE | 앱 자동 생성 |

#### 1-D. 운영/로그 테이블

| # | 테이블명 | 용도 | 사용 파일 수 | 갱신 방법 |
|---|---------|------|------------|---------|
| 39 | health_check_logs | 시스템 헬스체크 | 37 | 앱 자동 생성 — 갱신 불필요 |
| 40 | usage_logs | API 사용량 추적 | 13 | 앱 자동 생성 |
| 41 | api_audit_log | API 감사 로그 | 다수 | 앱 자동 생성 |
| 42 | email_sent_logs | 이메일 발송 로그 | 다수 | 앱 자동 생성 |
| 43 | batch_jobs | 배치 작업 | READ/WRITE | 앱 자동 생성 |
| 44 | report_schedules | 리포트 스케줄 | READ/WRITE | 사용자 생성 |
| 45 | webhook_events | 웹훅 이벤트 | WRITE | 앱 자동 생성 |
| 46 | cron_execution_logs | Cron 실행 로그 | WRITE | 앱 자동 생성 |

#### 1-E. 나머지 테이블 (47~107)
> 위 46개 외 나머지 61개 테이블은 대부분: 캐시 테이블, 임시 저장, 기능별 보조 테이블, 설정 테이블. 
> 갱신 방법: 앱 자동 생성 또는 사용자 생성 — 별도 스케줄 갱신 불필요.

#### 1-F. Supabase RPC 함수 (3개)

| # | 함수명 | 용도 | 호출 파일 |
|---|--------|------|----------|
| 1 | search_firm_trgm | 무역구제 기업 검색 (trigram) | trade-remedy-lookup.ts |
| 2 | match_hs_vectors | HS 벡터 유사도 검색 | vector-search.ts |
| 3 | match_regulation_vectors | 규제 RAG 벡터 검색 | regulation-rag/index.ts |

---

### Category 2: Static Data Files (41개)

#### 2-A. JSON 파일 (직접 import)

| # | 파일 경로 | 용도 | import하는 코드 | 갱신 방법 |
|---|---------|------|---------------|---------|
| 1 | data/us-nexus-thresholds.json | US 주별 Nexus 기준 | us-nexus-threshold-check, check-nexus.ts | 수동 — 법률 변경 시 |
| 2 | config/jp_classification_rules.json | 일본 HS 분류 규칙 | jp-rules-loader.ts | 수동 — WCO 업데이트 시 |
| 3 | config/chapter_decision_trees.json | WCO 챕터별 의사결정 트리 | chapter-tree-evaluator.ts | 수동 — WCO 업데이트 시 |
| 4 | app/lib/data/chapter-notes.json | HS Chapter Notes | explainability.ts | 수동 — WCO 업데이트 시 |
| 5 | app/lib/data/shipping-rates.json | 표준 배송 요금 | calculate/route.ts | 수동 — 요금 변경 시 |
| 6 | lib/scenarios/shipments.json | 워크플로우 예시 데이터 | workflow-examples.ts | 갱신 불필요 (예시) |
| 7 | data/source-publications.json | 규제 출판물 추적 | publication-updater.ts | 수동 |
| 8 | data/ticker-fallback.json | 티커 폴백 데이터 | 티커 컴포넌트 | 수동 |
| 9 | data/wdc_category_hs_map.json | WDC 카테고리→HS 매핑 | 데이터 파이프라인 | 수동 |
| 10 | data/wdc_category_summary.json | WDC 카테고리 요약 | 데이터 파이프라인 | 수동 |

#### 2-B. GRI 분류 엔진 데이터 파일 (TypeScript)

| # | 파일 경로 | 용도 | 항목 수 | 갱신 방법 |
|---|---------|------|--------|---------|
| 11 | gri-classifier/data/heading-descriptions.ts | HS Heading 설명 | 1,233 | 수동 — WCO 업데이트 시 (DB와 동기화) |
| 12 | gri-classifier/data/subheading-descriptions.ts | HS Subheading 설명 | 5,621 | 수동 — WCO 업데이트 시 (DB와 동기화) |
| 13 | gri-classifier/data/chapter-notes.ts | Chapter Notes | 96 | 수동 — WCO 업데이트 시 |
| 14 | gri-classifier/data/codified-rules.ts | 코드화된 규칙 | 592 | 수동 — WCO 업데이트 시 (DB와 동기화) |
| 15 | gri-classifier/data/conflict-patterns.ts | CBP/EBTI 충돌 패턴 | ~1,563 | 수동 — 판례 추가 시 |
| 16 | gri-classifier/data/gri-rules.ts | GRI 1-6 규칙 텍스트 | 6 | 갱신 불필요 (WCO 고정) |
| 17 | gri-classifier/data/codified-headings.ts | Heading 조건 | 다수 | 수동 — WCO 업데이트 시 |
| 18 | gri-classifier/data/codified-subheadings.ts | Subheading 조건 | 다수 | 수동 — WCO 업데이트 시 |
| 19 | gri-classifier/data/section-notes.ts | Section Notes | 54 | 수동 — WCO 업데이트 시 |
| 20 | gri-classifier/data/chapter-descriptions.ts | Chapter 설명 | 208 | 수동 — WCO 업데이트 시 |
| 21 | gri-classifier/data/heading-method-tags.ts | 분류 방법 태그 | 소수 | 수동 |
| 22 | gri-classifier/data/extended-heading-keywords.json | 확장 키워드 | 다수 | 수동 |
| 23 | gri-classifier/data/9field_reference.json | 9필드 시스템 참조 | 1 | 갱신 불필요 (내부 사양) |
| 24 | gri-classifier/data/field-guide.ts | 9필드 입력 가이드 | 1 | 갱신 불필요 (내부 사양) |

#### 2-C. 국가별 분류 규칙 (JSON, 프로덕션은 Supabase)

| # | 파일 경로 | 용도 | 갱신 방법 |
|---|---------|------|---------|
| 25 | country-agents/data/us_codified.json | US 분류 규칙 | DB 동기화 |
| 26 | country-agents/data/eu_codified.json | EU 분류 규칙 | DB 동기화 |
| 27 | country-agents/data/gb_codified.json | UK 분류 규칙 | DB 동기화 |
| 28 | country-agents/data/kr_codified.json | KR 분류 규칙 | DB 동기화 |
| 29 | country-agents/data/jp_codified.json | JP 분류 규칙 | DB 동기화 |
| 30 | country-agents/data/ca_codified.json | CA 분류 규칙 | DB 동기화 |
| 31 | country-agents/data/au_codified.json | AU 분류 규칙 | DB 동기화 |

#### 2-D. 설정/UI 데이터

| # | 파일 경로 | 용도 | 갱신 방법 |
|---|---------|------|---------|
| 32 | app/features/features-data.ts | 140개 기능 목록 | 수동 — 기능 추가 시 |
| 33 | app/features/features-guides.ts | 기능별 가이드 | 수동 — 기능 추가 시 |
| 34 | lib/features/feature-catalog.ts | 기능 카탈로그 UI | 수동 |
| 35 | app/lib/data/brand-origins.ts | 130+ 브랜드 원산지 | 수동 — 브랜드 추가 시 |
| 36 | app/lib/config/retailerShippingOptions.ts | 리테일러 배송 옵션 | 수동 — 리테일러 추가 시 |
| 37 | lib/playground/dropdown-options.ts | 240개국 드롭다운 | 수동 — 국가 추가 시 |

#### 2-E. 국가 표준 설정 (YAML)

| # | 파일 경로 | 용도 | 갱신 방법 |
|---|---------|------|---------|
| 38 | config/country_standards/US.yaml | US 관세/분류 표준 | 수동 |
| 39 | config/country_standards/CN.yaml | CN 표준 | 수동 |
| 40 | config/country_standards/GB.yaml | UK 표준 | 수동 |
| 41 | config/country_standards/JP.yaml, KR.yaml, DE.yaml | JP/KR/DE 표준 | 수동 |

---

### Category 3: Hardcoded Constants (15개 주요 상수)

| # | 파일:위치 | 변수명 | 항목 수 | 용도 | DB 중복 여부 | 갱신 방법 |
|---|---------|--------|--------|------|------------|---------|
| 1 | cost-engine/country-data.ts | COUNTRY_DATA | 220+국가 (1,608줄) | VAT/관세/면세 한도 | **중복** — vat_gst_rates, de_minimis_thresholds, countries | potal-semiannual-hardcoded-check |
| 2 | cost-engine/hs-code/fta.ts | FTA_AGREEMENTS | 55+ FTA (700줄) | FTA 협정/멤버/세율 | **중복** — fta_agreements, fta_members | potal-quarterly-fta-check |
| 3 | cost-engine/hs-code/fta.ts | FTA_ROO_DEFAULTS | 5 FTA | 원산지 규정 기본값 | **중복** — fta_product_rules | potal-quarterly-fta-check |
| 4 | cost-engine/hs-code/duty-rates.ts | CHAPTER_DUTY_RATES | 40챕터×29국 (1,141줄) | 챕터별 MFN 관세율 | **중복** — macmap_ntlc_rates | potal-annual-data-refresh |
| 5 | cost-engine/eu-vat-rates.ts | EU_REDUCED_VAT | 26 EU국 | EU 품목별 감면 VAT | **중복** — eu_reduced_vat | potal-semiannual-hardcoded-check |
| 6 | cost-engine/section301-lookup.ts | SECTION_301_LISTS + 232 | 4 리스트 + 2 세트 | US 추가관세 (301/232) | **중복** — trade_remedies | potal-semiannual-hardcoded-check |
| 7 | cost-engine/CostEngine.ts | STATE_TAX_RATES 등 | 50주+10주+27주 | US/CA/BR 지역 세율 | **중복** — us_sales_tax_rates, vat_gst_rates | potal-semiannual-hardcoded-check |
| 8 | customs/de-minimis-tracker.ts | DE_MINIMIS_THRESHOLDS | 11국 | 면세 한도 + 제한 | **중복** — de_minimis_thresholds | potal-semiannual-hardcoded-check |
| 9 | tax/us-sales-tax.ts | NO_SALES_TAX_STATES 등 | 50주 | US 세일즈택스 구조 | **중복** — us_sales_tax_rates | potal-semiannual-hardcoded-check |
| 10 | compliance/export-controls.ts | HS_TO_ECCN_MAP 등 | 11챕터+6국+9국 | 수출통제 매핑 | **중복** — export_control_chart, eccn_entries | 미연결 — 추가 필요 |
| 11 | compliance/product-restrictions.ts | PROHIBITED/CITES/DUAL_USE | 23챕터 | 수입제한 품목 | **중복** — restricted_items | potal-semiannual-hardcoded-check |
| 12 | gri-classifier/data/codified-rules.ts | CODIFIED_RULES | 592규칙 (4,867줄) | HS 분류 규칙 | **중복** — codified_rules | 수동 시드 (DB↔코드 동기화) |
| 13 | gri-classifier/data/heading-descriptions.ts | HEADING_DESCRIPTIONS | 1,233 | HS Heading 설명 | **중복** — hs_heading_descriptions | 수동 시드 |
| 14 | gri-classifier/data/subheading-descriptions.ts | 서브헤딩 설명 | 5,621 | HS Subheading 설명 | **중복** — hs_subheading_descriptions | 수동 시드 |
| 15 | gri-classifier/data/conflict-patterns.ts | 충돌 패턴 | ~1,563 | CBP/EBTI 패턴 | **중복** — conflict_patterns | 수동 시드 |

**핵심 발견: 15개 하드코딩 상수 중 15개 전부가 Supabase와 중복**
→ 코드와 DB가 불일치할 위험이 있음. Scheduled Task에서 DB 갱신 시 코드 하드코딩도 함께 확인해야 함.

---

### Category 4: External API Calls (14개)

| # | 서비스 | URL | 호출 파일 | 데이터 종류 | Fallback | 갱신 주기 |
|---|--------|-----|---------|-----------|---------|---------|
| 1 | Anthropic Claude | api.anthropic.com | claude-classifier.ts | HS 분류 (AI) | OpenAI fallback | 실시간 |
| 2 | OpenAI GPT-4o-mini | api.openai.com | llm-call.ts, engine.ts, QueryAgent.ts | HS 분류/분석 | null return | 실시간 |
| 3 | Resend Email | api.resend.com | email/send.ts | 트랜잭션 이메일 | 없음 | 실시간 |
| 4 | Telegram Bot | api.telegram.org | telegram.ts, escalation.ts | 운영 알림 | silent failure | 실시간 |
| 5 | ExchangeRate-API | open.er-api.com | exchange-rate-service.ts | 환율 | Fawaz API → 하드코딩 | 15분 캐시 |
| 6 | Fawaz Currency API | cdn.jsdelivr.net | exchange-rate-service.ts | 환율 (백업) | 하드코딩 60+ 통화 | 15분 캐시 |
| 7 | WTO Tariff API | api.wto.org | tariff-api-client.ts | MFN 관세율 | circuit breaker | 선택적 |
| 8 | Dutify API | api.dutify.com | tariff-api-client.ts | 프리미엄 관세 | circuit breaker | 선택적 |
| 9 | USITC/UK/EU/CA/AU/JP/KR/IN/TR/ASEAN | 각국 정부 API | tariff-api-client.ts | 관세 스케줄 (10개국) | circuit breaker + 하드코딩 | duty_rates_live 캐시 |
| 10 | Shopify OAuth + Admin | myshopify.com | shopify-auth.ts | 스토어 연동 | 없음 | 사용자 트리거 |
| 11 | BigCommerce API | api.bigcommerce.com | api-connector.ts | 스토어 연동 | 없음 | 사용자 트리거 |
| 12 | POTAL Internal API | potal.app/api/v1/classify | api-connector.ts (BC) | HS 분류 | 없음 | 실시간 |
| 13 | Paddle Billing | api.paddle.com | billing/paddle.ts | 결제 (현재 비활성) | sandbox 모드 | 비활성 |
| 14 | Vector Embedding | Supabase pgvector | vector-search.ts | 벡터 유사도 검색 | null return | 실시간 |

---

### 갱신 구조 매핑 요약

| 갱신 방법 | 데이터 소스 수 | 상태 |
|----------|-------------|------|
| **Scheduled Task 연결됨** | ~35개 | potal-annual, quarterly, semiannual 3개 태스크 |
| **앱 자동 생성 (갱신 불필요)** | ~55개 | 로그, 캐시, 사용자 데이터 |
| **수동 시드 (WCO 업데이트 시)** | ~20개 | HS 분류 엔진 데이터 — 5년 주기 |
| **사용자 생성 (갱신 불필요)** | ~10개 | 계정, API 키, 스토어 연결 |
| **실시간 API (갱신 불필요)** | ~14개 | AI, 이메일, 환율, 관세 API |
| **미연결 (수동/미연결)** | **2개** | export_control_chart, eccn_entries |

### 미연결 항목 (반드시 해결 필요)

| # | 데이터 소스 | 현재 상태 | 해결 방안 |
|---|-----------|---------|---------|
| 1 | export_control_chart (DB) + export-controls.ts (하드코딩) | Scheduled Task 없음 | potal-semiannual-hardcoded-check에 추가 |
| 2 | eccn_entries (DB) | Scheduled Task 없음 | potal-semiannual-hardcoded-check에 추가 |

### 비어있는 테이블 (데이터 유입 필요)

| # | 테이블명 | 현재 상태 | 원인 | 해결 방안 |
|---|---------|---------|------|---------|
| 1 | duty_rates_live | 0 rows | 정부 API 호출 결과 캐시 — 아직 실사용 발생 안 함 | API 호출 시 자동 채워짐 — 정상 |
| 2 | fta_rates_live | 0 rows | FTA 세율 실시간 조회 결과 — 아직 조회 안 됨 | API 호출 시 자동 채워짐 — 정상 |

### DB↔코드 하드코딩 동기화 위험

15개 하드코딩 상수가 전부 Supabase 테이블과 중복됨. 현재 구조:
- **코드가 우선** — CostEngine, duty-rates, fta.ts 등은 하드코딩 값을 직접 사용
- **DB는 보조** — 일부 엔진만 DB 조회 후 하드코딩 fallback
- **위험**: DB를 갱신해도 코드 하드코딩이 안 바뀌면 실제 서비스에 반영 안 됨

→ potal-semiannual-hardcoded-check에서 DB 값과 코드 하드코딩 값의 불일치를 감지하도록 설정됨.

---

*이 문서는 코드베이스 전수 스캔 결과입니다. grep `.from()`, `import`, `const`, `fetch` 패턴 기반.*
*최종 목표: 수동/미연결 0개 달성 → export_control_chart, eccn_entries 2개만 연결하면 완료.*
