# 세션 32 변경사항 교차검증 + 인증정보 정리
> 2026-03-07

---

## 1. 수정된 파일 목록 + 각 파일 변경사항

### 이 세션에서 수정한 기존 파일 (3개)

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | **session-context.md** | 세션 32 내용 추가: Phase 5.7 상태 업데이트, 섹션 4 세션 32 스프린트 추가, 섹션 5 세션 32 완료 항목 추가, Supabase 테이블 현황 테이블 추가, 핵심 파일 경로에 새 파일 6개 추가, 작업 로그 세션 32 항목 추가, 인증정보 12개 추가 |
| 2 | **.cursorrules** | 마지막 업데이트 세션 32로 변경, Anti-Amnesia 섹션에 마이그레이션/MFN/MIN/AGR/Management API/인증정보 12개 항목 추가, 파일 매핑에 016 마이그레이션+스크립트 2개 추가, Supabase 테이블 섹션에 관세 데이터 테이블 추가 |
| 3 | **POTAL_B2B_Checklist.xlsx** | 5-25 상태→✅ Done (NTLC 임포트 완료), 6-17 상태→✅ Done (Supabase Pro), 신규 7개 태스크 추가 (5-26~5-32: 마이그레이션, DDL, M49 매핑, MIN/AGR 임포트, 파이프라인, 검증) |

### 이 세션에서 수정한 기존 파일 (Supabase)

| # | 파일 | 변경 내용 |
|---|------|----------|
| 4 | **supabase/migrations/010_country_metadata.sql** | iso_code_3 빈값 6개 수정: BQ→BES, CW→CUW, XK→XKX, BL→BLM, MF→MAF, SX→SXM |

### 이 세션에서 새로 생성한 파일 (8개)

| # | 파일 | 위치 | 설명 |
|---|------|------|------|
| 1 | **CLAUDE.md** | portal/ | Claude Code 프로젝트 지침 (기술스택, 수치, 규칙, 연결방법, 테이블 현황, 인증정보) |
| 2 | **016_macmap_bulk_tables.sql** | supabase/migrations/ | MacMap 벌크 테이블 3개 DDL + lookup_duty_rate_v2() + 1,319 무역협정 INSERT (1,462줄) |
| 3 | **import_macmap_bulk.py** | scripts/ | psycopg2 COPY 기반 벌크 임포터 (EC2/Mac 직접 연결용, 854줄) |
| 4 | **import_min_agr_data.py** | scripts/ | Mac용 자체 완결 임포터 (temp table + COPY, 885줄) |
| 5 | **m49_to_iso2_full.py** | (세션 작업 디렉토리) | M49→ISO2 완전 매핑 237+개국 |
| 6 | **execute_migrations.py** | (세션 작업 디렉토리) | Management API로 마이그레이션 SQL 실행 |
| 7 | **import_min_via_api.py** | (세션 작업 디렉토리) | Management API 기반 MIN 벌크 임포터 (현재 실행중) |
| 8 | **SESSION_32_SUMMARY.md** | portal/ | 이 파일 (변경사항 교차검증 + 인증정보) |

### 문서 파일 (스크립트 디렉토리에 생성)

| # | 파일 | 설명 |
|---|------|------|
| 9 | scripts/QUICK_START.md | 임포트 스크립트 빠른 시작 가이드 |
| 10 | scripts/README_MIN_AGR_IMPORT.md | MIN/AGR 임포트 상세 문서 |
| 11 | scripts/TECHNICAL_DETAILS.md | 기술 상세 문서 |
| 12 | scripts/EXAMPLES.md | 사용 예시 |
| 13 | scripts/FILE_MANIFEST.md | 파일 목록 |

---

## 2. 교차검증 — 데이터 정합성 확인

### Supabase 테이블 행 수 (Management API로 확인한 값)

| 테이블 | 기대값 | 실제값 | 검증 |
|--------|--------|--------|------|
| countries | 240 | 240 | ✅ |
| vat_gst_rates | 240 | 240 | ✅ |
| de_minimis_thresholds | 240 | 240 | ✅ |
| customs_fees | 240 | 240 | ✅ |
| macmap_trade_agreements | 1,319 | 1,319 | ✅ |
| macmap_ntlc_rates | 537,894 | 537,894 | ✅ (53개국 MFN) |
| macmap_min_rates | ~4.3M (진행중) | ~4.3M | 🔄 (51개국 남음) |

### 파일 간 숫자 일관성

| 항목 | session-context.md | .cursorrules | CLAUDE.md | Checklist | 일치 |
|------|-------------------|-------------|-----------|-----------|------|
| countries 행 수 | 240 | 240 | 240 | - | ✅ |
| MFN NTLC 행 수 | 537,894 | 537,894 | 537,894 | 537,894 | ✅ |
| 무역협정 수 | 1,319 | 1,319 | 1,319 | 1,319 | ✅ |
| MIN 진행 상태 | ~4.3M/130M | ~4.3M/130M | ~4.3M/130M | ~4.3M/130M | ✅ |
| 완료 국가 | ARE+ARG (2개) | 기술 | ARE+ARG | 기술 | ✅ |
| Management API URL | ✅ 기재 | ✅ 기재 | ✅ 기재 | - | ✅ |

---

## 3. 사이트별 ID / Key / 비밀번호 전체 정리

### Supabase

| 항목 | 값 |
|------|-----|
| Project Name | potal |
| Project ID (ref) | `zyurflkhiregundhisky` |
| Org | soulmaten7's Org (PRO) |
| URL | `https://zyurflkhiregundhisky.supabase.co` |
| DB Password | `PotalReview2026!` |
| Direct Connection | `postgresql://postgres:[PASSWORD]@db.zyurflkhiregundhisky.supabase.co:5432/postgres` |
| Pooler (Session) | `postgresql://postgres.zyurflkhiregundhisky:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres` |
| Publishable Key | `sb_publishable_9Sv0rlirIrkqt05-gMMgNg_nsU3x...` (일부 잘림) |
| Secret Key | `sb_secret_***REDACTED***` |
| Management API Token | `sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a` |
| Management API URL | `https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query` |

### AWS

| 항목 | 값 |
|------|-----|
| Account ID | `920263653804` |
| Region | us-east-1 |
| EC2 Instance ID | `i-0c114c6176439b9cb` (m7i-flex.large) |
| S3 Bucket | `potal-wdc-920263653804` |
| IAM Role | potal-ec2-role |
| Free Tier | $100 크레딧 |

### API Keys (외부 서비스)

| 서비스 | Key |
|--------|-----|
| WTO Timeseries API | `e6b00ecdb5b34e09aabe15e68ab71d1d` |
| Groq (Llama AI) | `gsk_***REDACTED***` |

### Shopify

| 항목 | 값 |
|------|-----|
| Client ID | `2fa34ed65342ffb7fac08dd916f470b8` |
| Partner Dashboard | `https://dev.shopify.com/dashboard/208854133/apps` |
| Test Store | `potal-test-store.myshopify.com` |

### LemonSqueezy

| 항목 | 값 |
|------|-----|
| Store URL | `potalapp.lemonsqueezy.com` |
| Store ID | #308025 |
| 상태 | 신원 확인 승인 대기 중 |

### Vercel

| 항목 | 값 |
|------|-----|
| 프로덕션 URL | `https://www.potal.app` |
| 배포 | `main` push → 자동 배포 |
| 환경변수 | Project Settings + All Settings 둘 다 설정 필요 |

### Product Hunt

| 항목 | 값 |
|------|-----|
| URL | `potalapp.producthunt.com` |
| 런치 날짜 | 2026-03-07 (토) |
| 프로모 코드 | `PRODUCTHUNT` (3개월 Starter 무료, 2026-06-06 만료) |

### 이메일

| 용도 | 주소 |
|------|------|
| Founder | soulmaten7@gmail.com |
| 공개 | contact@potal.app |
| 지원 | support@potal.app |

---

## 4. 다음 세션 우선순위

1. **MIN 임포트 완료 확인** — 백그라운드 PID 77035, ~5시간 예상
2. **AGR 임포트 시작** — MIN 완료 후 import_min_via_api.py 수정하여 AGR 테이블 임포트
3. **lookup_duty_rate_v2() 검증** — MIN+AGR 데이터로 4단계 폴백 함수 테스트
4. **WDC EC2 다운로드 확인** — S3에 파일 있는지, 얼마나 진행됐는지
5. **33개 기능 구현 계속** — 이미지 기반 HS 분류, 다국어 분류 확대 등
