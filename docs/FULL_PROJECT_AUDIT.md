# POTAL 전체 프로젝트 감사 리포트
> 생성일: 2026-03-15 13:30 KST
> 감사 방법: 모든 파일 직접 읽기 + DB 실제 쿼리 + 빌드 검증

## 1. 코드베이스 통계

- **총 파일 수**: 1,298 (node_modules/.next/.git/build/log/lock 제외)
- **파일 유형별 분포**:
  - TypeScript (.ts): 468
  - Text (.txt): 417 (데이터 파일 포함)
  - React TSX (.tsx): 81
  - JSON: 79
  - Markdown (.md): 63
  - SQL (.sql): 36 (마이그레이션)
  - Excel (.xlsx): 24
  - Python (.py): 22
  - PNG (.png): 17
  - CSV: 14
  - Shell (.sh): 9
- **핵심 파일**: GlobalCostEngine.ts (1,349줄), DashboardContent.tsx, MCP index.ts
- **app/lib/ 전체**: 253 .ts 파일
- **cost-engine/ 전체**: 165 .ts 파일

## 2. API 엔드포인트 현황 (실제 확인)

**총 103개 route.ts** (v1: 101개 + cron: 2개)

### Admin/Cron (20개)
| 경로 | 기능 | 상태 |
|------|------|------|
| `/admin/billing-overage` | 월별 초과 요금 정산 | ✅ |
| `/admin/cache` | 캐시 조회/무효화 | ✅ |
| `/admin/competitor-scan` | 10개 경쟁사 모니터링 | ✅ |
| `/admin/division-monitor` | 15개 Division 24/7 모니터링 | ✅ |
| `/admin/exchange-rate-sync` | 환율 동기화 | ✅ |
| `/admin/gov-api-health` | 7개국 정부 API 헬스체크 | ✅ |
| `/admin/health-check` | 시스템 종합 헬스체크 | ✅ |
| `/admin/intelligence` | 경쟁사 스캔 히스토리 | ✅ |
| `/admin/morning-brief` | 모닝 브리프 + 자동수정 | ✅ |
| `/admin/plugin-health` | 플러그인 헬스체크 | ✅ |
| `/admin/refund` | Paddle 환불 처리 | ✅ |
| `/admin/sdn-sync` | OFAC SDN 동기화 체크 | ✅ |
| `/admin/spot-check` | 정확도 스팟체크 (8 케이스) | ✅ |
| `/admin/tariffs` | 관세율 CRUD | ✅ |
| `/admin/trade-remedy-sync` | 무역구제 테이블 헬스 | ✅ |
| `/admin/update-tariffs` | 관세율 업데이트 트리거 | ✅ |
| `/admin/uptime-check` | 6개 페이지 가용성 체크 | ✅ |
| `/cron/enterprise-lead-match` | 리드 매칭 (매 30분) | ✅ |
| `/cron/subscription-cleanup` | 만료 구독 정리 (매일 03:00) | ✅ |

### Core API (81개+)
| 경로 | 기능 | 상태 |
|------|------|------|
| `/calculate` | TLC 단일 계산 | ✅ |
| `/calculate/batch` | 배치 계산 (최대 500건) | ✅ |
| `/calculate/csv` | CSV 업로드 계산 | ✅ |
| `/classify` | AI HS Code 분류 (텍스트+이미지) | ✅ |
| `/classify/audit` | 분류 감사 추적 | ✅ |
| `/classify/batch` | 배치 분류 (최대 100건) | ✅ |
| `/classify/eccn` | ECCN/Schedule B 분류 | ✅ |
| `/classify/url` | URL 기반 상품 분류 | ✅ |
| `/countries` | 240개국 정보 (공개) | ✅ |
| `/docs` | OpenAPI 문서 | ✅ |
| `/enterprise-inquiry` | Enterprise 문의 폼 | ✅ |
| `/export` | CSV/JSON 내보내기 | ✅ |
| `/fta` | FTA 조회 | ✅ |
| `/health` | 헬스체크 | ✅ |
| `/ioss` | IOSS 계산 | ✅ |
| `/newsletter` | 뉴스레터 구독 | ✅ |
| `/origin` | 원산지 감지 | ✅ |
| `/regulations` | 규정 조회 | ✅ |
| `/restrictions` | 수입 제한 확인 | ✅ |
| `/roo` | Rules of Origin | ✅ |
| `/screening` | 제재/거부자 스크리닝 | ✅ |
| `/validate` | HS Code 검증 | ✅ |
| `/verify` | 사전 수출 검증 | ✅ |
| `/agent` | AI Agent 도구 정의+실행 | ✅ |
| `/alerts` + `/alerts/subscribe` | 관세 변경 알림 | ✅ |
| `/checkout` + fraud/localize/mor | DDP 체크아웃 | ✅ |
| `/compliance/*` (7개) | AEO, 위험물, 수출통제, FTZ, ICS2, Type86, 수출면허 | ✅ |
| `/tax/*` (9개) | US세금, VAT등록, 면세, 신고, 넥서스, 사업자, e-invoice | ✅ |
| `/shipping/*` (5개) | 배송료, 라벨, 추적, 주소검증, 브랜드추적 | ✅ |
| `/sellers/*` (6개) | 등록, 키관리, 사용량, 분석 | ✅ |
| `/integrations/*` (3개) | 회계, ERP, 마켓플레이스 | ✅ |
| `/reports/*` (4개) | 세금보고, 컴플라이언스, 배송분석, 수출 | ✅ |
| 기타 | consult, drawback, graphql, 파트너, whitelabel, widget | ✅ |

### Vercel Cron 설정: **14개** (vercel.json 확인)

## 3. Cost Engine 분석

- **GlobalCostEngine.ts**: 1,349줄, 핵심 함수 `calculateGlobalLandedCostAsync()`
  - Import 체인: CostEngine, macmap-lookup, trade-remedy-lookup, section301, eu-vat, ioss-oss, origin-detection, ai-classifier, hs10-resolver
  - 모든 import 대상 파일 존재 확인 ✅
  - HS10 resolution 통합 완료 (resolveHs10 import + hs10Resolution 응답 필드)
- **CostEngine.ts**: 기본 계산 엔진 (duty + VAT + customs fees)
- **macmap-lookup.ts**: MFN/MIN/AGR 3테이블 병렬 조회, 최저 세율 선택
- **trade-remedy-lookup.ts**: AD/CVD/safeguard 조회
- **section301-lookup.ts**: US Section 301 추가관세
- **eu-vat-rates.ts**: EU 27국 VAT 세율 하드코딩
- **ioss-oss.ts**: EU IOSS/OSS 계산
- **origin-detection.ts**: 제조국 자동 감지

## 4. AI Classifier 파이프라인

3단계 파이프라인 (실제 코드 확인):
1. **product-mappings.ts**: DB 캐시 조회 (product_hs_mappings 8,389건)
2. **vector-search.ts**: pgvector 벡터 검색 (hs_classification_vectors 3,431건)
3. **claude-classifier.ts**: LLM 폴백 (Groq API)
- **confidence-score.ts**: 신뢰도 점수 계산
- **audit-trail.ts**: 분류 감사 기록
- **description-validator.ts**: 상품 설명 품질 검증
- **index.ts**: 통합 export (classifyProductAsync, classifyWithVision 등)

## 5. DB 테이블 현황 (실제 쿼리 결과 vs 문서)

**총 테이블: 59개** (pg_tables 쿼리 결과)

| 테이블 | CLAUDE.md 기록 | 실제 행수 | 차이 |
|--------|---------------|----------|------|
| countries | 240 | **240** | ✅ 일치 |
| vat_gst_rates | 240 | **240** | ✅ 일치 |
| de_minimis_thresholds | 240 | **240** | ✅ 일치 |
| customs_fees | 240 | **240** | ✅ 일치 |
| macmap_trade_agreements | 1,319 | **1,319** | ✅ 일치 |
| macmap_ntlc_rates | 537,894 | **537,894** | ✅ 일치 |
| macmap_min_rates | ~113M | **~105M** (approx) | ⚠️ 문서 113M vs 실제 ~105M |
| macmap_agr_rates | ~144M | **~129M** (approx) | ⚠️ 문서 144M vs 실제 ~129M |
| trade_remedy_cases | 10,999 | **10,999** | ✅ 일치 |
| trade_remedy_products | 55,259 | **55,259** | ✅ 일치 |
| trade_remedy_duties | 37,513 | **37,513** | ✅ 일치 |
| safeguard_exemptions | 15,935 | **15,935** | ✅ 일치 |
| hs_classification_vectors | 1,104 (CLAUDE.md) | **3,431** | ❌ 문서 1,104 vs 실제 3,431 |
| product_hs_mappings | 1,055 (CLAUDE.md) | **8,389** | ❌ 문서 1,055 vs 실제 8,389 |
| gov_tariff_schedules | 89,842 | **89,842** | ✅ 일치 |
| enterprise_leads | 0 | **1** | ⚠️ 문서 0 vs 실제 1 |
| sanctions_entries | 21,301 | **21,301** | ✅ 일치 |
| sanctions_aliases | - | **22,328** | 문서 미기록 |
| sanctions_addresses | - | **24,176** | 문서 미기록 |
| sanctions_ids | - | **8,000** | 문서 미기록 |
| divergence_map | - | **61,258** | 문서 미기록 (신규) |
| hs_description_keywords | - | **25,484** | 문서 미기록 (신규) |
| hs_price_break_rules | - | **18** | 문서 미기록 (신규) |
| precomputed_landed_costs | - | **117,600** | 문서 미기록 (신규) |
| precomputed_hs10_candidates | - | **1,090** | 문서 미기록 (신규) |
| regulation_vectors | - | **0** | 빈 테이블 (RAG 미구현) |

**참고**: MIN/AGR은 pg_class reltuples 기준 근사값. 정확한 count는 타임아웃 발생.

## 6. 외장하드 데이터

**위치**: /Volumes/soulmaten/POTAL/

| 폴더 | 내용 | 용량 | 파일 수 |
|------|------|------|---------|
| regulations/ | 7개국 관세법/규정 원본 | ~504MB | ~150+ |
| - us/ | USITC, CBP CROSS, eCFR, OFAC SDN | 405MB | |
| - eu/ | UCC, CN 2025, VAT Directive | 32MB | |
| - jp/ | Japan Customs Tariff 96챕터 | 45MB | |
| - uk/ | UK Trade Tariff API + 법률 | 14MB | |
| - ca/ | Customs Act + CBSA Tariff | 5MB | |
| - au/ | Customs Act + Tariff Act | 1MB | |
| - kr/ | Tariff + Customs Law | 1MB | |
| - international/ | MacMap, WCO, WITS, WTO | 640KB | |
| - regional/ | ASEAN, GCC, AfCFTA, CPTPP, Mercosur, RCEP | 896KB | |
| hs-bulk/ | 7개국 HS 벌크 다운로드 + merged CSV | ~112MB | |
| wdc-products/ | WDC 상품 데이터 (raw + extracted) | **842GB** | ~1,900 |
| macmap/ | MacMap 원본 데이터 | - | |

**COLLECTION_LOG.md**: Phase 1 (7개국) 수집 완료 기록 확인

## 7. Vercel 배포 상태

- **빌드**: ✅ 성공 (npm run build 통과)
- **Cron 설정**: 14개 (vercel.json 확인)
  - 매 30분: division-monitor, enterprise-lead-match
  - 매 6시간: health-check, uptime-check
  - 매 12시간: gov-api-health, plugin-health
  - 매일: update-tariffs(04:00), spot-check(04:00), exchange-rate-sync(00:30), sdn-sync(05:00), subscription-cleanup(03:00)
  - 매주 월: trade-remedy-sync(06:30), competitor-scan(08:00)
  - 매월 1일: billing-overage(07:00)
- **환경변수**: Vercel API 토큰으로 확인 시도 → 별도 확인 필요

## 8. 문서 vs 실제 불일치 목록

### 숫자 불일치 (교정 필요)
| 항목 | CLAUDE.md 값 | 실제 값 | 교정 |
|------|-------------|---------|------|
| hs_classification_vectors | 1,104 | **3,431** | ❌ 교정 필요 |
| product_hs_mappings | 1,055 | **8,389** | ❌ 교정 필요 |
| macmap_min_rates | ~113M | **~105M** | ⚠️ 근사값 차이 (pg_class 기준) |
| macmap_agr_rates | ~144M | **~129M** | ⚠️ 근사값 차이 (pg_class 기준) |
| enterprise_leads | 0 | **1** | ⚠️ 교정 필요 |
| MCP Server 도구 수 | "7개 도구" (CLAUDE.md) | **9개 도구** (실제 코드) | ❌ 교정 필요 |
| 제재 스크리닝 건수 | "21,301건 (OFAC SDN 14,600 + CSL 6,701)" | **21,301 entries + 22,328 aliases + 24,176 addresses + 8,000 ids** | ⚠️ 세부 불일치 |
| API 엔드포인트 | "10+ 엔드포인트" | **103개** (v1 101 + cron 2) | ❌ 교정 필요 |
| precomputed_landed_costs | 미기록 | **117,600건** | 추가 필요 |
| divergence_map | 미기록 | **61,258건** | 추가 필요 |
| hs_description_keywords | 미기록 | **25,484건** | 추가 필요 |
| regulation_vectors | 미기록 | **0건** (빈 테이블) | 추가 필요 |

### SDN 테이블명 불일치
- CLAUDE.md: `sdn_entries`, `sdn_aliases`, `sdn_addresses`, `sdn_ids`, `csl_entries` (5개)
- 실제 DB: `sanctions_entries`, `sanctions_aliases`, `sanctions_addresses`, `sanctions_ids`, `sanctions_load_meta` (5개, 이름 다름 + csl_entries 없음)

### 문서 미반영 신규 테이블 (HS10 파이프라인)
- `divergence_map` (61,258)
- `hs_description_keywords` (25,484)
- `hs_price_break_rules` (18)
- `precomputed_landed_costs` (117,600)
- `precomputed_hs10_candidates` (1,090)

## 9. 발견된 문제점

### 심각도 높음
1. **regulation_vectors 테이블 비어있음** (0행) — RAG 기능 미구현 상태. 240개국 규정 RAG 전략 문서화되어 있으나 실제 데이터 없음
2. **SUPABASE_SERVICE_ROLE_KEY 비어있음** (.env.local) — 서비스 키 미설정. 스크립트 실행 시 anon key로 폴백되어 RLS 제한 가능

### 심각도 중간
3. **문서 숫자 불일치 7건** — product_hs_mappings (1,055→8,389), vectors (1,104→3,431), MCP 도구 수 (7→9), API 수 (10+→103) 등
4. **MIN/AGR 행수 근사값 차이** — 문서 113M/144M vs pg_class ~105M/~129M (VACUUM 이후 정확도 차이 가능)
5. **SDN 테이블명 문서 오류** — CLAUDE.md에 `sdn_entries` 등으로 기록, 실제는 `sanctions_entries`

### 심각도 낮음
6. **scripts/ 임시 파일들** — task6-verify.ts (삭제됨), task7-hs10-tests.ts, precompute_*.json 등 정리 필요
7. **build-hs10-pipeline.ts에 하드코딩된 API 토큰** — Management API token이 스크립트에 하드코딩
8. **expand-taxonomy-hs.ts에 하드코딩된 API 토큰** — 동일 이슈

## 10. 추천 액션

| 우선순위 | 항목 | 액션 |
|---------|------|------|
| P0 | 문서 숫자 교정 | CLAUDE.md + session-context.md에서 7건 불일치 숫자 교정 |
| P0 | SDN 테이블명 교정 | 문서의 sdn_* → sanctions_* 교정 |
| P1 | 신규 테이블 문서화 | divergence_map, hs_description_keywords 등 5개 테이블 추가 |
| P1 | SUPABASE_SERVICE_ROLE_KEY | .env.local에 서비스 키 설정 (Vercel에는 있을 수 있음) |
| P2 | 스크립트 토큰 하드코딩 | 환경변수로 교체 |
| P2 | 임시 스크립트 정리 | precompute_*.json, wdc_phase3_*.py 등 archive/ 이동 |
| P3 | regulation_vectors | RAG 파이프라인 구현 (외장하드 데이터 → 벡터 DB) |
