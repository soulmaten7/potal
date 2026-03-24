# Claude Code 명령어: 7개국 세관 공식 HS Code 전체 관세율표 원본 수집

> **날짜**: 2026-03-21 KST
> **목표**: US, EU, UK, KR, JP, AU, CA 7개국 세관이 공식 발행한 HS Code 관세율표 원본 데이터를 인터넷에서 다운받아 저장. 6자리까지는 국제 공통이니까 7자리부터의 세분화 규칙을 추출할 원본 소스.
> **원칙**: 각 나라 세관이 직접 발행한 공식 데이터만. 요약/해석 금지. 원본 파일을 그대로 다운로드.
> **저장**: /Volumes/soulmaten/POTAL/hs_national_rules/{국가코드}/

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 수집 대상: 각 나라의 공식 관세율표 원본

각 나라 세관이 발행하는 **전체 관세율표** — HS 1자리부터 10자리(또는 8, 9자리)까지 모든 코드 + description + 세율 + Notes가 들어있는 원본 파일.

6자리까지는 WCO 국제 공통이고, 7자리부터가 각 나라 고유. 원본을 가져오면 7자리부터의 세분화 기준을 추출할 수 있다.

---

## US (미국) — USITC HTS

### 공식 소스
- **USITC Harmonized Tariff Schedule**: https://hts.usitc.gov/
- **다운로드**: HTS 전체를 Chapter별 또는 통합 파일로 다운로드 가능

### 수집할 파일
```bash
# 1. HTS 전체 데이터 (XML 또는 JSON 또는 CSV)
# USITC API가 있으면 API로, 없으면 웹에서 직접 다운로드
curl -s "https://hts.usitc.gov/reststop/getChapter?chapter=61" -o /Volumes/soulmaten/POTAL/hs_national_rules/us/chapter_61.json
# ... 97개 Chapter 전부

# 2. General Notes 전문 (7~10자리 구조 설명)
# https://hts.usitc.gov/current → General Notes 섹션

# 3. Additional U.S. Notes (Chapter별, 7-8자리 세분화 규칙)
# 각 Chapter 페이지에 Additional Notes가 붙어있음

# 4. Statistical Notes (9-10자리 기준)
```

### 이미 있는 데이터 먼저 확인
```bash
# 기존 수집 데이터 확인
ls /Volumes/soulmaten/POTAL/regulations/
ls /Volumes/soulmaten/POTAL/hs_classification_rules/
# gov_tariff_schedules에 US 28,718행 이미 있음 — 이것으로 충분한지 확인
```

### 저장 위치
```
/Volumes/soulmaten/POTAL/hs_national_rules/us/
├── hts_full.json (또는 .csv, .xml)    ← 전체 관세율표 원본
├── general_notes.txt                   ← General Notes 전문
├── additional_notes/                   ← Chapter별 Additional U.S. Notes
│   ├── chapter_01.txt
│   ├── chapter_02.txt
│   └── ...
└── statistical_notes.txt               ← Statistical Notes
```

---

## EU (유럽연합) — Combined Nomenclature + TARIC

### 공식 소스
- **EU TARIC**: https://ec.europa.eu/taxation_customs/dds2/taric/
- **EU CN**: https://eur-lex.europa.eu/ (연간 CN 규정)
- **TARIC API**: https://ec.europa.eu/taxation_customs/dds2/taric/measures.js

### 수집할 파일
```bash
# 1. TARIC 전체 데이터 (API로 벌크 수집)
# TARIC API는 HS code별로 조회 가능
# 예: curl "https://ec.europa.eu/taxation_customs/dds2/taric/measures.js?lang=en&GoodsCode=6109100000"

# 2. CN Explanatory Notes (세분화 규칙 설명)
# EUR-Lex에서 다운로드

# 3. TARIC Additional Codes 설명
```

### 저장 위치
```
/Volumes/soulmaten/POTAL/hs_national_rules/eu/
├── taric_full.json (또는 .csv)         ← 전체 관세율표 원본
├── cn_explanatory_notes/               ← CN Explanatory Notes
└── taric_additional_codes.txt
```

---

## UK (영국) — UK Trade Tariff

### 공식 소스
- **UK Trade Tariff**: https://www.trade-tariff.service.gov.uk/
- **UK API**: https://www.trade-tariff.service.gov.uk/api/v2/commodities/{code}

### 수집할 파일
```bash
# 1. UK API로 전체 데이터 벌크 수집
# 예: curl "https://www.trade-tariff.service.gov.uk/api/v2/commodities/6109100000"
# 응답에 measures, duty_expression, conditions 전부 포함

# 2. UK Classification Guidelines
# gov.uk에서 다운로드
```

### 저장 위치
```
/Volumes/soulmaten/POTAL/hs_national_rules/gb/
├── uk_tariff_full.json                 ← 전체 관세율표 원본
└── classification_guidelines/
```

---

## KR (한국) — 관세율표 (HSK)

### 공식 소스
- **관세청 UNI-PASS**: https://unipass.customs.go.kr/
- **관세법령정보포털**: https://www.customs.go.kr/
- **관세율표**: 관세법 시행령 별표

### 수집할 파일
```bash
# 1. HSK 전체 관세율표
# UNI-PASS에서 다운로드 가능한지 확인
# 또는 관세청 포털에서 엑셀/PDF 다운로드

# 2. 품목분류 해설서 (세분화 기준 설명)
# 관세청 발간

# 3. 사전심사 결정 사례집
```

### 저장 위치
```
/Volumes/soulmaten/POTAL/hs_national_rules/kr/
├── hsk_full.xlsx (또는 .csv)           ← 전체 관세율표 원본
├── classification_guide.pdf            ← 품목분류 해설서
└── rulings/                            ← 사전심사 사례
```

---

## JP (일본) — 関税率表 (9자리)

### 공식 소스
- **税関**: https://www.customs.go.jp/tariff/
- **統計品目表**: https://www.customs.go.jp/toukei/sankou/howto/commodity.htm

### 수집할 파일
```bash
# 1. 関税率表 전체 (CSV 또는 Excel)
# customs.go.jp에서 다운로드

# 2. 統計品目表 (통계 품목표)
# 9자리 코드 전체 목록

# 3. 分類例規集 (분류 사례집)
```

### 저장 위치
```
/Volumes/soulmaten/POTAL/hs_national_rules/jp/
├── tariff_full.csv                     ← 전체 관세율표 원본
├── statistical_schedule.csv            ← 통계품목표
└── classification_rulings/
```

---

## AU (호주) — Working Tariff (8자리)

### 공식 소스
- **ABF Working Tariff**: https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff
- **Australian Customs Tariff**: legislation.gov.au

### 수집할 파일
```bash
# 1. Working Tariff 전체 (PDF 또는 데이터)
# ABF 사이트에서 다운로드

# 2. Tariff Classification Guidelines
```

### 저장 위치
```
/Volumes/soulmaten/POTAL/hs_national_rules/au/
├── working_tariff_full.csv             ← 전체 관세율표 원본
└── classification_guidelines.pdf
```

---

## CA (캐나다) — Customs Tariff (10자리)

### 공식 소스
- **CBSA Customs Tariff**: https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/
- **D-Memoranda**: https://www.cbsa-asfc.gc.ca/publications/dm-md/

### 수집할 파일
```bash
# 1. Customs Tariff 전체 (다운로드)
# CBSA 사이트에서 벌크 다운로드

# 2. D10/D11 Memoranda (분류 규칙)
# Classification 관련 D-Memo
```

### 저장 위치
```
/Volumes/soulmaten/POTAL/hs_national_rules/ca/
├── customs_tariff_full.csv             ← 전체 관세율표 원본
└── d_memoranda/
```

---

## 수집 순서

```
1. 기존 데이터 먼저 확인
   → /Volumes/soulmaten/POTAL/regulations/ 에 이미 수집한 것 확인
   → gov_tariff_schedules DB 데이터가 원본에서 온 건지, 요약본인지 확인

2. 각 나라 공식 사이트 접속 → 다운로드 URL 확인
   → curl로 다운로드 가능한지 테스트
   → 다운로드 안 되면 API로 벌크 수집
   → API도 없으면 페이지별 크롤링

3. 다운로드 실행 — 나라별 순서: US → EU → UK → KR → JP → AU → CA
   → 각 나라 파일 저장 후 파일 크기/행 수 확인
   → 엑셀에 기록

4. 수집 못한 파일 목록 기록
   → 접근 불가, 유료, 로그인 필요 등 사유
```

---

## 결과물

### 1. 다운로드된 파일 (위 폴더 구조)

### 2. 엑셀 요약: `POTAL_7Country_Tariff_Collection.xlsx`

**Sheet 1: 수집 현황**
| 국가 | 관세율표 원본 | Notes/해설서 | 분류 가이드 | 파일 크기 | 행 수 |
|------|-------------|------------|-----------|----------|------|
| US | ✅/❌ | ✅/❌ | ✅/❌ | XMB | X행 |
| ... | | | | | |

**Sheet 2: 다운로드 URL + 접근 방법**
| 국가 | 파일 | URL | 방법(curl/API/수동) | 상태 |

**Sheet 3: 미수집 목록 + 사유**

시트 마감: `=== 작업 종료 === | 7개국 중 X국 수집 완료 | 총 파일 X개 | 총 용량 XMB`

---

## ⚠️ 절대 규칙

1. **공식 세관 사이트에서 직접 다운로드** — 제3자 사이트, 블로그, 위키 금지
2. **원본 파일을 그대로 저장** — 요약하거나 가공하지 않는다
3. **7개국 전부 시도** — 일부만 하지 않는다
4. **다운로드 안 되면 API 시도, API도 안 되면 기록** — 포기하지 말고 방법을 바꿔 시도
5. **기존 수집 데이터 먼저 확인** — 중복 수집 금지
6. **파일 저장 후 행 수/크기 확인** — 빈 파일이 아닌지 검증
7. **엑셀에 URL + 접근 방법 + 파일 크기 전부 기록**
