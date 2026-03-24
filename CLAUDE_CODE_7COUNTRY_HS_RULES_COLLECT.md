# Claude Code 명령어: 7개국 HS 7~10자리 세분화 법적 기준 문서 전수 수집

> **날짜**: 2026-03-21 KST
> **목표**: US, EU, UK, KR, JP, AU, CA 7개국이 HS 6자리 이후를 세분화하는 법적 기준, 공식 문서, 규칙을 인터넷에서 찾을 수 있는 만큼 전부 수집
> **원칙**: 각 나라의 세관 공식 문서가 근거. 비공식 블로그/요약 금지. 정부 사이트, 국제기구(WCO/WTO) 공식 문서만.
> **저장**: /Volumes/soulmaten/POTAL/hs_national_rules/ (국가별 폴더)

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 배경

HS Code 구조:
- 1~6자리: WCO HS Convention (국제 조약) — 전 세계 동일, GRI 1~6으로 분류
- 7자리~: **각 나라가 자국 법률에 따라 세분화** — 이 법적 근거를 수집해야 함

7개국이 각각 다른 체계를 가짐:
- US: HTS (Harmonized Tariff Schedule) — USITC 관리, 10자리
- EU: CN (Combined Nomenclature) 8자리 + TARIC 10자리 — EU Commission 관리
- UK: UK Trade Tariff — HMRC 관리, 10자리
- KR: HSK (관세율표) — 관세청 관리, 10자리
- JP: 統計品目表 — 財務省 관리, 9자리
- AU: Working Tariff — ABF 관리, 8자리
- CA: Customs Tariff — CBSA 관리, 10자리

---

## 수집 대상: 국가별로 찾아야 할 문서

각 나라에 대해 아래 7가지를 전부 찾는다:

### 1. 세분화 법적 근거 (Legal Basis)
- 해당 국가의 관세법/관세율표법에서 7자리+ 세분화를 규정하는 조항
- 예: US = Tariff Act of 1930, Section 484(f) + 19 USC 1484
- 예: EU = Council Regulation (EEC) No 2658/87 (Combined Nomenclature)

### 2. 세분화 구조 설명 (Structure Guide)
- 해당 국가 세관이 발행한 "우리나라 관세 코드 구조는 이렇다" 공식 가이드
- 자릿수별 의미 (7번째 = X, 8번째 = Y, 9번째 = Z, 10번째 = W)
- 예: US HTS General Notes, USITC "Understanding the HTS" 가이드

### 3. 세분화 기준 유형 (Subdivision Criteria)
- 각 나라가 7자리+ 를 나눌 때 사용하는 기준 목록
- 가격 (valued over/not over), 소재 세부, 크기/무게, 용도, 성분비, 가공 방식 등
- 공식 문서에서 이 기준들이 어디에 명시되어 있는지

### 4. Additional Notes / Statistical Notes
- US: General Notes + Additional U.S. Notes (각 Chapter에 붙어있음)
- EU: Additional Notes to CN
- 이 Notes가 7~10자리 세분화의 실제 규칙을 정의함
- **이 문서가 Step 4의 "codified_rules"가 되어야 할 핵심 소스**

### 5. Classification Guidelines / Rulings
- 각 나라 세관이 발행한 분류 가이드라인
- US: CBP Informed Compliance Publications
- EU: European Classification (ECICS)
- UK: Classification of goods for import and export
- 7~10자리 선택 시 참고하는 공식 지침

### 6. 전체 관세율표 다운로드 URL
- 벌크 다운로드 가능한 공식 URL
- US: https://hts.usitc.gov/
- EU: https://ec.europa.eu/taxation_customs/dds2/taric/
- UK: https://www.trade-tariff.service.gov.uk/
- KR: https://unipass.customs.go.kr/
- JP: https://www.customs.go.jp/
- AU: https://www.abf.gov.au/
- CA: https://www.cbsa-asfc.gc.ca/

### 7. API 문서 (있으면)
- 7~10자리 분류를 프로그래매틱하게 조회할 수 있는 API
- US: USITC HTS API
- EU: TARIC API
- UK: UK Trade Tariff API

---

## 국가별 수집 실행

### US (미국)

```bash
# USITC HTS — General Notes (세분화 규칙의 근거)
curl -s "https://hts.usitc.gov/current" > /tmp/us_hts_main.html

# USITC "Understanding the HTS" 가이드
# CBP Informed Compliance: "Classification of ..." 시리즈

# 19 USC 1484 — 법적 근거

# US HTS General Notes 텍스트 (Statistical Notes, Additional Notes)
# 이미 수집한 데이터: /Volumes/soulmaten/POTAL/regulations/ 확인
ls /Volumes/soulmaten/POTAL/regulations/
```

**US HTS 세분화 구조:**
- Digits 1-6: International HS (WCO)
- Digits 7-8: US subheading (USITC가 정의, Additional U.S. Notes 기반)
- Digits 9-10: Statistical suffix (Census Bureau가 정의, 통계 목적)
- indent 구조: 0~11단계 계층

**수집할 것:**
1. General Notes 전문 (특히 General Note 1: 구조 설명)
2. 각 Chapter의 Additional U.S. Notes 전문 (7-8자리 구분 규칙)
3. Statistical Notes (9-10자리 구분 규칙)
4. CBP Classification Guide (7~10자리 선택 지침)

### EU (유럽연합)

```bash
# EU Combined Nomenclature — 법적 근거: Regulation (EEC) No 2658/87
# EU CN Explanatory Notes
# TARIC Additional Codes

# EU CN 구조:
# Digits 1-6: International HS
# Digits 7-8: CN subheading (EU Commission이 정의)
# Digits 9-10: TARIC code (무역정책, 반덤핑, 쿼터 등)
```

**수집할 것:**
1. Council Regulation 2658/87 관련 조항 (CN 법적 근거)
2. CN Explanatory Notes (7-8자리 구분 규칙)
3. TARIC measures 설명 (9-10자리 의미)
4. EU Classification Regulations (연간 CN 업데이트)

### UK (영국)

```bash
# UK Trade Tariff — HMRC
# Brexit 이후 독자 체계 (EU CN 기반이지만 분리됨)

# UK 구조:
# Digits 1-6: International HS
# Digits 7-8: UK subheading (HMRC)
# Digits 9-10: Additional codes
```

**수집할 것:**
1. UK Customs (Import of Goods) Regulations 관련 조항
2. UK Trade Tariff 구조 설명 (gov.uk 공식)
3. UK Classification Guidelines

### KR (한국)

```bash
# 관세법 시행령 별표 — 관세율표 (HSK)
# 관세청 품목분류 사전심사 기준

# KR 구조:
# Digits 1-6: International HS
# Digits 7-8: 관세율표 세분류 (관세청)
# Digits 9-10: 통계부호 (관세청)
```

**수집할 것:**
1. 관세법 제50조 (관세율표) + 시행령 별표
2. 관세청 품목분류 기본원칙 (한국어 문서)
3. HSK 품목분류 해설서
4. 관세청 사전심사 사례집

### JP (일본)

```bash
# 関税定率法 別表 — 関税率表
# 税関 統計品目表

# JP 구조:
# Digits 1-6: International HS
# Digits 7-9: 日本 세분류 (9자리 체계)
```

**수집할 것:**
1. 関税定率法 관련 조항
2. 税関 分類例規集 (분류 사례집)
3. 統計品目表 구조 설명

### AU (호주)

```bash
# Customs Tariff Act 1995 — Working Tariff
# Australian Border Force

# AU 구조:
# Digits 1-6: International HS
# Digits 7-8: Australian subdivision (8자리 체계)
```

**수집할 것:**
1. Customs Tariff Act 1995 관련 조항
2. Working Tariff 구조 설명
3. ABF Classification Guidelines

### CA (캐나다)

```bash
# Customs Tariff Act (S.C. 1997, c. 36)
# CBSA Customs Tariff

# CA 구조:
# Digits 1-6: International HS
# Digits 7-8: Canadian subdivision
# Digits 9-10: Statistical suffix
```

**수집할 것:**
1. Customs Tariff Act 관련 조항
2. CBSA Classification Memoranda (D10, D11 시리즈)
3. Canadian Customs Tariff 구조 설명

---

## 공통: WCO 국제 기준

7자리+ 세분화에 대한 WCO 공식 가이드라인도 수집:

```
1. HS Convention Article 3 — 국가별 세분화 규정
2. WCO Recommendation on National Subdivisions
3. WCO HS Compendium of Classification Opinions — 6자리+ 분류 사례
4. Kyoto Convention — 관세 절차 표준화
```

---

## 저장 구조

```
/Volumes/soulmaten/POTAL/hs_national_rules/
├── wco/                    # WCO 국제 기준
│   ├── hs_convention_article3.md
│   ├── recommendation_national_subdivisions.md
│   └── classification_opinions.md
├── us/                     # 미국
│   ├── legal_basis.md      # 19 USC 1484, Tariff Act
│   ├── structure_guide.md  # HTS 자릿수별 의미
│   ├── general_notes.md    # General Notes 전문
│   ├── additional_notes/   # Chapter별 Additional U.S. Notes
│   ├── statistical_notes.md
│   ├── classification_guide.md
│   └── api_docs.md
├── eu/                     # EU
│   ├── legal_basis.md      # Regulation 2658/87
│   ├── structure_guide.md  # CN 구조
│   ├── cn_explanatory_notes/
│   ├── taric_guide.md
│   └── classification_regulations.md
├── gb/                     # UK
├── kr/                     # 한국
├── jp/                     # 일본
├── au/                     # 호주
└── ca/                     # 캐나다
```

---

## 수집 방법

### 방법 1: 공식 웹사이트에서 직접 다운로드
- curl 또는 wget으로 정부 사이트에서 문서 다운로드
- PDF면 다운로드 후 텍스트 추출

### 방법 2: 정부 API 활용
- US USITC API, EU TARIC API, UK Trade Tariff API 등

### 방법 3: 기존 수집 데이터 확인
- /Volumes/soulmaten/POTAL/regulations/ 에 이미 수집한 데이터 있을 수 있음
- /Volumes/soulmaten/POTAL/hs_classification_rules/ 에 GRI 자료 있음
- 기존 데이터와 중복되지 않게 새로 필요한 것만 수집

### 방법 4: WTO/WCO 공식 사이트
- WTO: https://www.wto.org/
- WCO: https://www.wcoomd.org/

---

## 결과물

### 1. 국가별 수집 문서 (위 폴더 구조)

### 2. 엑셀 요약: `POTAL_7Country_HS_Rules_Summary.xlsx`

**Sheet 1: 수집 현황**
| 국가 | 법적 근거 | 구조 설명 | 세분화 기준 | Additional Notes | 분류 가이드 | 관세율표 URL | API |
|------|----------|----------|-----------|-----------------|-----------|-------------|-----|
| US | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| EU | | | | | | | |
| ... | | | | | | | |

**Sheet 2: 자릿수별 구조 비교**
| 자릿수 | US | EU | UK | KR | JP | AU | CA |
|--------|----|----|----|----|----|----|-----|
| 7번째 | ? | ? | ? | ? | ? | ? | ? |
| 8번째 | ? | ? | ? | ? | ? | ? | ? |
| 9번째 | ? | ? | ? | ? | - | - | ? |
| 10번째 | ? | ? | ? | ? | - | - | ? |

**Sheet 3: 세분화 기준 비교**
| 기준 | US | EU | UK | KR | JP | AU | CA |
|------|----|----|----|----|----|----|-----|
| 가격 (valued over) | ✅/❌ | | | | | | |
| 소재 세부 | | | | | | | |
| 크기/무게 | | | | | | | |
| 용도 | | | | | | | |
| 성분비 | | | | | | | |
| 가공 방식 | | | | | | | |

**Sheet 4: 각 나라 핵심 발견**
- 나라별 7~10자리 세분화의 핵심 로직 요약

### 3. 엑셀 로그: `POTAL_Claude_Code_Work_Log.xlsx`

시트 마감: `=== 작업 종료 === | 수집 문서 X개 | 국가 7/7 완료 | 핵심 발견 X개`

---

## ⚠️ 절대 규칙

1. **공식 문서만 수집** — 블로그, 위키, 비공식 요약 금지. 정부/국제기구 사이트만
2. **7개국 전부 수집** — 일부만 하지 않는다
3. **법적 근거를 반드시 찾는다** — "이렇게 되어있다"가 아니라 "이 법/규정 제X조에 의해"
4. **자릿수별로 구분해서 정리** — 7번째, 8번째, 9번째, 10번째 각각 무슨 기준인지
5. **기존 수집 데이터 먼저 확인** — /Volumes/soulmaten/POTAL/regulations/ 에 이미 있는 것 중복 수집 금지
6. **수집 못한 문서는 "미수집 + 이유" 기록** — 접근 불가, 유료, URL 변경 등
7. **한 방법이 실패하면 다른 방법 시도. 포기 금지**
