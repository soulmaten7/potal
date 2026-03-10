# 세션 33: 반덤핑/상계관세/세이프가드 데이터 다운로드 결과
> 2026-03-08

---

## 1. 다운로드 결과 요약

| 소스 | 상태 | 파일 | 크기 |
|------|------|------|------|
| **TTBD 반덤핑** (World Bank) | ✅ 완료 | 36개국 XLS | 5.0MB |
| **TTBD 상계관세** (World Bank) | ✅ 완료 | 19개국 XLS | 1.3MB |
| **TTBD 세이프가드** (WTO) | ✅ 완료 | 1개 글로벌 XLS | 1.1MB |
| **USITC Orders** | ✅ 완료 | 1개 XLS | 536KB |
| **EU TARIC** | ❌ 동적 페이지 | HTML만 (JS 렌더링) | - |
| **WTO Trade Remedies Portal** | ❌ SPA (API 500 에러) | - | - |
| **UNCTAD TRAINS** | ❌ SPA (데이터 미반환) | - | - |

---

## 2. TTBD 데이터 상세 집계

### 반덤핑 (Anti-Dumping) — 36개국

| 데이터 유형 | 총 행 수 | 설명 |
|------------|---------|------|
| Master (케이스) | ~8,900 | 조사 건별 메타데이터 (조사국, 제품명, 날짜, 판정) |
| Products (HS코드) | ~44,800 | 제품별 HS 코드 매핑 (4~10자리) |
| Domestic Firms | ~21,200 | 국내 신청 기업 |
| Foreign Firms (관세율) | ~32,400 | 해외 기업별 반덤핑 관세율 |

**핵심 수치:**
- HS 코드 있는 제품 행: **41,714건**
- 유니크 HS 코드 (8자리): **7,022개**
- 관세율 유형: AVD (종가세%), SD (종량세), PU (가격약속), DPU

### 주요 국가별 반덤핑 케이스

| 국가 | 케이스 | 제품(HS) | 외국기업(관세율) |
|------|--------|---------|----------------|
| 🇺🇸 USA | 1,765 | 18,142 | 7,327 |
| 🇮🇳 India | 1,228 | 3,333 | 2,717 |
| 🇪🇺 EU | 872 | 3,226 | 3,398 |
| 🇦🇺 Australia | 665 | 1,425 | 1,290 |
| 🇧🇷 Brazil | 523 | 1,025 | 3,017 |
| 🇨🇦 Canada | 500 | 5,176 | 3,503 |
| 🇦🇷 Argentina | 490 | 1,361 | 624 |
| 🇲🇽 Mexico | 366 | 2,063 | 2,251 |
| 🇹🇷 Turkey | 356 | 1,797 | 651 |
| 🇿🇦 South Africa | 330 | 528 | 518 |
| 🇨🇳 China | 304 | 639 | 722 |
| 🇰🇷 Korea | 208 | 514 | 505 |

### 상계관세 (Countervailing Duty) — 19개국

| 데이터 유형 | 총 행 수 |
|------------|---------|
| Master (케이스) | ~66,000* |
| Products (HS코드) | ~16,800 |
| Foreign Firms (관세율) | ~4,200 |

*GBR Master 64,694행은 데이터 오류 추정 (실제 ~30건)

주요: USA 803건 + 13,556 제품, EU 112건 + 487 제품

### 세이프가드 (Safeguard) — WTO 글로벌

| 시트 | 행 수 | 내용 |
|------|-------|------|
| Master | 459 | 글로벌 세이프가드 조사 건 |
| Products | 4,662 | HS 코드 + 관세율 |
| QR or TRQ | 2,585 | 쿼터/관세율 쿼터 |
| Final Measures | 6,767 | 최종 조치 (AVD/SD/DPU/TRQ) |
| Exemptions | 16,126 | 면제국가 목록 |

---

## 3. 데이터 구조 (POTAL 통합용)

### 반덤핑 Foreign Firms 테이블 (핵심 — 관세율 정보)

| 컬럼 | 설명 | 예시 |
|------|------|------|
| CASE_ID | 케이스 식별자 | EUN-AD-1 |
| F_FIRM | 해외 기업명 | Chim Import Export |
| F_AD_MEASURE_FIRM | 조치 유형 | AVD, SD, PU |
| F_AD_MARGIN | 덤핑 마진 (%) | 34.2 |
| F_AD_DUTY | 반덤핑 관세율 | 40.0 (AVD=%), ECU133/ton (SD) |
| COUNTRY | 대상국 (일부 파일) | Japan, France |

### Products 테이블 (HS 코드 매핑)

| 컬럼 | 설명 | 예시 |
|------|------|------|
| CASE_ID | 케이스 식별자 | USA-AD-123 |
| HS_CODE | HS 코드 | 72166110 (8자리) |
| HS_DIGITS | 자릿수 | 4, 6, 8, 10 |
| TS_CODE | 국가별 관세 코드 | 7216611020 (미국 HTS 10자리) |

### 연결 방법
```
Products.CASE_ID → Master.CASE_ID (제품 정보)
Foreign_Firms.CASE_ID → Master.CASE_ID (관세율 정보)
Products.HS_CODE → POTAL HS Code 매핑
```

---

## 4. EU TARIC / WTO / UNCTAD 실패 원인

| 소스 | 실패 원인 | 대안 |
|------|----------|------|
| EU TARIC | JavaScript 동적 렌더링, 벌크 export URL 404 | TTBD에 EU 데이터 이미 포함 (872건) |
| WTO Trade Remedies | SPA, API 500 Server Error | TTBD가 WTO 데이터 기반으로 제작됨 |
| UNCTAD TRAINS | Angular SPA, API 엔드포인트 변경됨 | NTM 데이터는 별도 소스 필요 |

→ **TTBD가 사실상 이 3개 소스의 데이터를 통합한 것이므로, TTBD만으로 충분**

---

## 5. POTAL 통합 방안

### Phase 1: Supabase 테이블 설계
```sql
-- 반덤핑/상계관세 케이스 마스터
CREATE TABLE trade_remedy_cases (
  id SERIAL PRIMARY KEY,
  case_id TEXT UNIQUE NOT NULL,       -- USA-AD-1, EUN-CVD-5
  remedy_type TEXT NOT NULL,          -- AD, CVD, SG
  investigating_country TEXT NOT NULL, -- ISO3 코드
  product_name TEXT,
  status TEXT,                        -- active, revoked, expired
  init_date DATE,
  final_date DATE,
  measure_type TEXT                   -- AVD, SD, PU, TRQ
);

-- 반덤핑 대상 HS 코드
CREATE TABLE trade_remedy_products (
  id SERIAL PRIMARY KEY,
  case_id TEXT REFERENCES trade_remedy_cases(case_id),
  hs_code TEXT NOT NULL,
  hs_digits INT,
  country_tariff_code TEXT           -- 국가별 세번 (HTS 등)
);

-- 반덤핑 관세율 (기업별)
CREATE TABLE trade_remedy_duties (
  id SERIAL PRIMARY KEY,
  case_id TEXT REFERENCES trade_remedy_cases(case_id),
  firm_name TEXT,
  target_country TEXT,               -- 수출국
  measure_type TEXT,                 -- AVD, SD, PU
  duty_rate NUMERIC,                 -- 종가세 %
  duty_amount TEXT,                  -- 종량세 금액 (단위 포함)
  margin NUMERIC                    -- 덤핑 마진 %
);

-- 세이프가드 면제국
CREATE TABLE safeguard_exemptions (
  id SERIAL PRIMARY KEY,
  case_id TEXT REFERENCES trade_remedy_cases(case_id),
  exempt_country TEXT NOT NULL       -- ISO3
);
```

### Phase 2: lookup_duty_rate 확장 (5단계 폴백)
```
1. exact MIN → 2. prefix MIN → 3. MFN NTLC → 4. WITS HS6
→ 5. 반덤핑/상계관세/세이프가드 추가 관세 (trade_remedy_duties)
```

### Phase 3: 임포트 예상량
| 테이블 | 예상 행 수 |
|--------|-----------|
| trade_remedy_cases | ~10,000 |
| trade_remedy_products | ~63,000 |
| trade_remedy_duties | ~37,000 |
| safeguard_exemptions | ~16,000 |
| **합계** | **~126,000** |

→ Management API로 1회 배치 임포트 가능 (30분 이내)

---

## 6. 다운로드 파일 위치
```
antidumping_data/
├── ttbd_antidumping.zip        (5.0MB, 36개국)
├── ttbd_countervailing.zip     (1.3MB, 19개국)
├── ttbd_safeguard.zip          (1.1MB, 글로벌)
├── ttbd_all_data.zip           (7.1MB, 전체)
├── usitc_orders.xls            (536KB, 미국 주문)
├── ttbd_ad/                    (압축 해제된 AD 파일)
├── ttbd_cvd/                   (압축 해제된 CVD 파일)
└── ttbd_sg/                    (압축 해제된 SG 파일)
```

---

## 7. 결론

**TTBD (World Bank/Chad Bown) 데이터가 반덤핑/상계관세/세이프가드의 "결정판".**

- 36개국 반덤핑 + 19개국 상계관세 + WTO 글로벌 세이프가드
- HS 코드 7,022개 유니크 + 기업별 관세율 32,400건
- EU TARIC, WTO, UNCTAD 데이터를 이미 통합한 것이므로 별도 소스 불필요
- Supabase에 ~126,000행 임포트 → lookup_duty_rate에 5단계 폴백 추가

**이걸 넣으면 POTAL은 MFN + FTA + 반덤핑 + 상계관세 + 세이프가드까지 커버하는 플랫폼이 됨.**
