# CW33 Phase A-2 — External Drive Inventory Command

**작성일**: 2026-04-11 KST
**대상 터미널**: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
**선행**: CW33 Phase A Hardcoding Audit 완료 (`docs/HARDCODING_AUDIT.md`, `docs/CW33_SCOPE.md`, 커밋 `f59c18c`)
**목적**: 외장하드(`/Volumes/soulmaten/POTAL/`)에 이미 다운로드된 CW33 관련 데이터 자산을 전수조사해서, "이미 있는 것 vs 새로 구해야 하는 것"을 분리한다. CW33-S1 착수 전 필수 사전 작업.

---

## 🚨 왜 이걸 해야 하는가

CW33 Phase A에서 🔴 19건을 식별했고, 각 항목마다 Supabase 테이블 seed가 필요하다. 그런데 과거 세션에서:
- v3 HS Code 분류 엔진 (7,446개 HS description, 592개 Notes 규칙) 이미 코드화 완료
- CBP 495건, WDC 상품 데이터 302GB 벤치마크 세트 보유
- `POTAL_Ablation_V2.xlsx` 벤치마크 원본
- USITC HTSUS, EU CN, USDA TRQ raw 데이터 **일부** 받아둔 기록 있음 (정확한 위치 불명)
- OFAC SDN, BIS Entity List XML 샘플 다운로드 기록 있을 수도

외장하드 먼저 스캔 안 하고 CW33-S1 착수하면:
1. 이미 있는 HS 데이터 다시 받는 중복 작업
2. POTAL_Ablation_V2.xlsx 같이 벤치마크 기준점 놓침
3. v3 분류 엔진 (Section/Chapter 100%) 자산 활용 못 함

**이번 작업은 읽기 전용 인벤토리**. 파일 복사/이동/수정 금지.

---

## 📂 스캔 대상

**루트**: `/Volumes/soulmaten/POTAL/`
(다른 경로에 마운트됐으면 `ls /Volumes/` 먼저 확인)

외장하드 참고 문서: `docs/EXTERNAL_DRIVE_STATUS.md` (2026-03-19 기준)

---

## 🔍 조사 단계

### Step 1: 마운트 확인 및 기본 구조

```bash
ls /Volumes/ 2>&1
ls /Volumes/soulmaten/ 2>&1
ls /Volumes/soulmaten/POTAL/ 2>&1
du -sh /Volumes/soulmaten/POTAL/* 2>/dev/null | sort -hr | head -30
```

**기대 결과**: `EXTERNAL_DRIVE_STATUS.md`에 언급된 폴더들(v3 엔진 데이터, WDC 상품, 벤치마크 등) 확인

### Step 2: 전체 디렉토리 트리 (2단계 깊이)

```bash
find /Volumes/soulmaten/POTAL -maxdepth 2 -type d 2>/dev/null > /tmp/ext_dirs.txt
wc -l /tmp/ext_dirs.txt
```

### Step 3: CW33 🔴 Critical 19개 각 항목별 관련 파일 검색

**C-01 FTA 데이터**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*fta*" -o -iname "*korus*" -o -iname "*rcep*" -o -iname "*cepa*" -o -iname "*kcfta*" -o -iname "*usmca*" -o -iname "*cptpp*" \) 2>/dev/null
```

**C-03 Country data (240국 VAT/de minimis/관세)**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*country*" -o -iname "*vat*" -o -iname "*de_minimis*" -o -iname "*de-minimis*" \) 2>/dev/null
```

**C-04 제재/금지품 + C-11 OFAC/BIS 제재 리스트**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*sdn*" -o -iname "*ofac*" -o -iname "*bis*" -o -iname "*entity*list*" -o -iname "*sanction*" -o -iname "*denied*party*" -o -iname "*consolidated*" -o -iname "*hmt*" \) 2>/dev/null
```

**C-05 Section 301/232**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*section301*" -o -iname "*section232*" -o -iname "*301*" -o -iname "*232*" -o -iname "*ieepa*" \) 2>/dev/null | grep -iE "\.(csv|xlsx?|json|xml|txt|pdf)$"
```

**C-06 US TRQ**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*trq*" -o -iname "*quota*" -o -iname "*htsus*" -o -iname "*usitc*" -o -iname "*hts*" \) 2>/dev/null
```

**C-07/C-08 EU VAT + 계절관세**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*eu*vat*" -o -iname "*seasonal*" -o -iname "*eu*cn*" -o -iname "*combined*nomenclature*" \) 2>/dev/null
```

**C-10 Brand origins**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*brand*origin*" -o -iname "*origin*" -o -iname "*marketplace*" \) 2>/dev/null | head -50
```

**C-13 HS Database (가장 큰 자산 — v3 엔진)**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*hs*code*" -o -iname "*hs*database*" -o -iname "*wco*" -o -iname "*harmonized*" -o -iname "*hs*2022*" -o -iname "*chapter*" \) 2>/dev/null | head -100
find /Volumes/soulmaten/POTAL -type d -iname "*v3*" 2>/dev/null
find /Volumes/soulmaten/POTAL -type d -iname "*gri*" 2>/dev/null
find /Volumes/soulmaten/POTAL -type f -iname "*notes*rule*" 2>/dev/null
find /Volumes/soulmaten/POTAL -type f -iname "*cbp*" 2>/dev/null
find /Volumes/soulmaten/POTAL -type f -iname "*ebti*" 2>/dev/null
```

**C-14 Exchange rate**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*exchange*rate*" -o -iname "*ecb*" -o -iname "*frankfurter*" -o -iname "*forex*" \) 2>/dev/null
```

**C-17 US State Sales Tax**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*sales*tax*" -o -iname "*nexus*" -o -iname "*state*tax*" \) 2>/dev/null
```

**C-19 Shipping rates**:
```bash
find /Volumes/soulmaten/POTAL -type f \( -iname "*shipping*rate*" -o -iname "*dhl*" -o -iname "*fedex*" -o -iname "*ups*" -o -iname "*carrier*" \) 2>/dev/null | head -30
```

**벤치마크 원본 (POTAL_Ablation_V2.xlsx 외)**:
```bash
find /Volumes/soulmaten/POTAL -type f -iname "*ablation*" 2>/dev/null
find /Volumes/soulmaten/POTAL -type f -iname "*benchmark*" 2>/dev/null
find /Volumes/soulmaten/POTAL -type f -iname "*WDC*" 2>/dev/null | head -20
find /Volumes/soulmaten/POTAL -type f -iname "*potal*" 2>/dev/null | head -30
```

### Step 4: 대용량 파일 (>10MB) 전체 리스트

```bash
find /Volumes/soulmaten/POTAL -type f -size +10M 2>/dev/null -exec du -h {} \; | sort -hr | head -50
```

### Step 5: 파일 유형별 집계

```bash
find /Volumes/soulmaten/POTAL -type f 2>/dev/null | awk -F. '{print tolower($NF)}' | sort | uniq -c | sort -rn | head -30
```

### Step 6: 최근 수정 파일 (2025-01-01 이후)

```bash
find /Volumes/soulmaten/POTAL -type f -newermt "2025-01-01" 2>/dev/null | head -100 > /tmp/ext_recent.txt
wc -l /tmp/ext_recent.txt
```

### Step 7: v3 HS 엔진 데이터 상세 (EXTERNAL_DRIVE_STATUS.md §1 기반)

```bash
# 592개 Notes 규칙, 7,446개 HS description, 6,854개 description 전수 분석 결과
find /Volumes/soulmaten/POTAL -type f -iname "*V3_TEST_LOG*" 2>/dev/null
find /Volumes/soulmaten/POTAL -type f -iname "*codified*" 2>/dev/null
find /Volumes/soulmaten/POTAL -type f -iname "*description*parse*" 2>/dev/null
find /Volumes/soulmaten/POTAL -type d -iname "*wdc*" 2>/dev/null -exec du -sh {} \;
```

---

## 🏷️ 분류 기준 (각 발견 파일마다)

각 발견 자산을 다음 중 하나로 태깅:

### 🟢 Ready — 즉시 사용 가능
- 포맷 정상 (CSV/JSON/XLSX 파싱 가능)
- 최근 버전 (2024 이후)
- CW33 Supabase 테이블에 바로 seed 가능
- **조치**: CW33-S1/S2/S3 에서 import 스크립트 대상

### 🟡 Stale — 업데이트 후 사용 가능
- 포맷은 정상이지만 1년 이상 된 데이터 (FTA/관세율은 매년 바뀜)
- **조치**: 최신 버전 재다운로드 필요, 구조 참고용으로만 사용

### 🔴 Unusable — 재수집 필요
- 포맷 손상, 부분 다운로드, 스키마 불명
- **조치**: CW33 작업 중 새로 구해야 함

### ⚪ Unrelated — CW33 무관
- 다른 프로젝트 자산, 개인 파일
- **조치**: 인벤토리 기록만, 작업에서 제외

---

## 📝 산출물

### 1. `docs/EXTERNAL_DRIVE_CW33_INVENTORY.md`

구조:
```markdown
# External Drive CW33 Asset Inventory
날짜: 2026-04-11 KST
외장하드 경로: /Volumes/soulmaten/POTAL/
총 용량: XX GB (사용: XX GB)

## Executive Summary
- 🟢 Ready: NN items (즉시 사용 가능)
- 🟡 Stale: NN items (업데이트 후 사용)
- 🔴 Unusable: NN items
- ⚪ Unrelated: NN items

## CW33 🔴 Critical 19건 매핑 — 이미 있는 것 vs 새로 구해야 하는 것

| Critical ID | 항목 | 외장하드 자산 | 상태 | CW33 조치 |
|---|---|---|---|---|
| C-01 | FTA 관세율 63개 | /Volumes/.../fta_rates_2023.csv | 🟡 Stale | 2026 버전 재다운로드 |
| C-02 | deterministicOverride | (없음) | — | 신규 작성 |
| C-03 | 240국 VAT/de minimis | /Volumes/.../country_vat.xlsx | 🟢 Ready | S2 seed 사용 |
| ... (C-01 ~ C-19 전부) |

## 🟢 Ready 자산 상세
### v3 HS Code 엔진 데이터
- 경로: `/Volumes/soulmaten/POTAL/v3-engine/`
- 크기: XX MB
- 파일 목록:
  - 592_notes_rules.json (XX KB) — C-13 seed 후보
  - 7446_hs_descriptions.csv (XX MB) — C-13 primary seed
  - V3_TEST_LOG.md
- CW33 활용: P0.11 HS Database 마이그레이션의 **core asset**
- 상태: Section/Chapter 100% 달성한 엔진의 원본 데이터

### POTAL_Ablation_V2.xlsx
- 경로: [정확한 경로]
- 크기: XX KB
- 활용: CW33-S1/S2 regression 벤치마크 기준점

### [다른 Ready 항목들...]

## 🟡 Stale 자산 상세
[동일 포맷]

## 🔴 Unusable 항목
[목록 + 이유]

## ⚪ Unrelated (요약)
- 개인 사진/문서: XX GB
- 다른 프로젝트: [프로젝트명]
- ...

## 대용량 파일 TOP 50
| 순위 | 크기 | 경로 | CW33 관련성 |
|---|---|---|---|
| 1 | XX GB | /Volumes/.../WDC_products.json | C-13 HS 벤치마크 |
| ... |

## 파일 유형 집계
| 확장자 | 개수 |
|---|---|
| csv | NN |
| xlsx | NN |
| json | NN |
| pdf | NN |
| ... |

## 최근 수정 파일 (2025-01-01 이후)
[목록, 경로]

## 권장 CW33-S0 작업 (Phase B 착수 전)
1. 🟡 Stale 자산 중 업데이트 필요한 것: [목록]
2. 🔴 새로 구해야 하는 데이터: [목록 + 소스 URL]
3. 외장하드 → Supabase 마이그레이션 예상 작업량: XX 시간
```

### 2. `docs/EXTERNAL_DRIVE_CW33_INVENTORY_RAW.txt`

위 Step 1~7의 모든 `find` 명령어 원본 출력 (나중에 재검증용)

---

## ✅ 검증 체크리스트

리포트 제출 전 스스로 확인:

- [ ] 외장하드 루트 마운트 확인됨
- [ ] CW33 🔴 19건 전부 매핑 테이블에 들어갔는가 (found/not found 명시)
- [ ] v3 HS 엔진 데이터 (EXTERNAL_DRIVE_STATUS.md §1) 위치 확인됨
- [ ] POTAL_Ablation_V2.xlsx 위치 확인됨 (외장하드 or 프로젝트 내부 `archive/benchmarks/`)
- [ ] 대용량 파일 TOP 50 기록됨
- [ ] Raw 원본 저장됨
- [ ] 🟢/🟡/🔴/⚪ 분류에 근거 (파일 수정일 / 스키마 검증) 명시
- [ ] 파일 복사/이동/수정 **0건** (읽기 전용)

---

## 🚫 절대 금지

1. **파일 복사/이동/수정 금지** — 읽기 전용 인벤토리
2. **외장하드 쓰기 금지** — 은태님 개인 자산 영역
3. **대용량 파일 `cat` 금지** — `head -20` 또는 `file` 명령으로 구조만 확인
4. **외장하드 루트 외 디렉토리 스캔 금지** (예: `/Users/...` 홈 디렉토리)
5. **추측 금지** — 파일명이 "fta"로 시작해도 실제 열어서(head/file) 확인
6. **B2C 코드 무관** — CLAUDE.md 규칙

---

## 📋 문서 업데이트 (인벤토리 완료 시)

1. `CLAUDE.md` 헤더 — "CW33 Phase A-2: External drive inventory 완료"
2. `docs/CHANGELOG.md` — CW33 Phase A-2 섹션 추가
3. `session-context.md` — 현재 TODO에 "CW33-S0: stale 자산 업데이트" 추가 (필요 시)
4. `docs/EXTERNAL_DRIVE_STATUS.md` — 최신 스캔 결과 기준으로 요약 업데이트
5. 커밋: `CW33-A2 docs: external drive inventory — NN ready, NN stale`

---

## 💬 은태님 컨텍스트

Cowork가 샌드박스 격리로 `/Volumes/` 접근 불가. Terminal1 Claude Code는 Mac 파일시스템 직접 접근 가능하므로 이 작업은 Terminal1 전용.

외장하드 스캔이 끝나야 CW33-S1 실제 착수 가능. 이유:
- FTA 데이터가 이미 있으면 → 재다운로드 없이 Supabase 이전만
- v3 HS 엔진 7,446개 description이 살아있으면 → P0.11 (C-13) 난이도 XL → M 으로 감소
- POTAL_Ablation_V2.xlsx가 있으면 → CW33 regression 기준점 확보

**우선순위**: 이 작업 → CW33-S1 → S2 → S3 → S4 → S5 순서.

**예상 소요**: 30분 ~ 1시간 (스캔 + 분류 + 리포트 작성)
