# HSCodeComp 632건 벤치마크 — v3 파이프라인 독립 검증

아래를 전부 실행해라. 중간에 멈추지 마라.

## 목적

HuggingFace 공개 벤치마크 **HSCodeComp 632건**을 다운받아서:
1. 어떤 필드가 있는지 확인
2. v3 파이프라인으로 분류
3. 정답 대비 정확도 측정
4. 틀린 건마다 원인 분석

이건 **외부 독립 데이터 + 확정 HS Code** → 자기참조가 아닌 진짜 벤치마크.

## Phase 0: 데이터 다운로드 + 구조 확인

### 0-1. HuggingFace에서 HSCodeComp 다운로드

```bash
# 방법 1: HuggingFace datasets 라이브러리
pip install datasets --break-system-packages 2>/dev/null
python3 -c "
from datasets import load_dataset
import json

# HSCodeComp 검색 — 정확한 이름 확인
# 가능한 이름들: 'HSCodeComp', 'hs-code-comp', 'hscode-comp'
# arXiv:2412.14179 논문 참조

try:
    ds = load_dataset('HSCodeComp/HSCodeComp')
except:
    try:
        ds = load_dataset('hs-code-comp')
    except:
        print('ERROR: 데이터셋 이름 확인 필요. HuggingFace에서 HSCodeComp 검색해라.')
        import sys; sys.exit(1)

print('=== Dataset Structure ===')
print(ds)
print()
print('=== Columns ===')
for split in ds:
    print(f'{split}: {ds[split].column_names}')
    print(f'  rows: {len(ds[split])}')
    print(f'  first 3:')
    for i in range(min(3, len(ds[split]))):
        print(f'    {dict(ds[split][i])}')
    print()

# 전체 데이터 JSON으로 저장
all_data = []
for split in ds:
    for item in ds[split]:
        all_data.append(dict(item))

with open('/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_raw.json', 'w') as f:
    json.dump(all_data, f, indent=2, ensure_ascii=False)
print(f'Saved {len(all_data)} items to hscodecomp_raw.json')
"
```

만약 datasets 라이브러리로 안 되면:
```bash
# 방법 2: 직접 다운로드
# HuggingFace에서 HSCodeComp 검색하여 CSV/JSON/Parquet 파일 URL 확인
# curl로 다운로드
```

만약 HuggingFace에 없으면:
```bash
# 방법 3: arXiv:2412.14179 논문의 GitHub 링크 확인
# 논문 제목: "HS Code Classification" 관련
# GitHub repo에서 데이터 다운로드
```

**어떤 방법이든 632건 데이터를 받아라. 못 받으면 왜 못 받았는지 정확히 보고하고 멈춰라.**

### 0-2. 데이터 구조 분석

다운받은 후 즉시 출력:

```
=== HSCodeComp 데이터 구조 ===
총 건수: ???
컬럼: [???]

=== 샘플 3건 ===
1. { ... }
2. { ... }
3. { ... }

=== 필드 분석 ===
- product_name/description: 있음/없음 (예시: "...")
- material: 있음/없음
- category: 있음/없음
- HS code (정답): 있음/없음 (몇 자리? 2/4/6/8/10?)
- origin_country: 있음/없음
- 기타 필드: [...]

=== 9-Field 매핑 가능 여부 ===
- product_name: ← [어떤 컬럼]
- material: ← [어떤 컬럼 / 없음 → product_name에서 추출 시도]
- origin_country: ← [어떤 컬럼 / 없음 → "CN" 기본값]
- category: ← [어떤 컬럼 / 없음]
- description: ← [어떤 컬럼 / 없음]
- processing: ← [없을 가능성 높음]
- composition: ← [없을 가능성 높음]
- weight_spec: ← [없을 가능성 높음]
- price: ← [없을 가능성 높음]
```

### 0-3. v3 입력 형식으로 변환

데이터 구조에 따라 9-field로 매핑:

```json
{
  "source": "HSCodeComp",
  "id": 1,
  "product_name": "[원본 상품명/설명]",
  "material": "[있으면 사용, 없으면 빈 문자열]",
  "origin_country": "[있으면 사용, 없으면 빈 문자열]",
  "category": "[있으면 사용, 없으면 빈 문자열]",
  "description": "[있으면 사용, 없으면 빈 문자열]",
  "processing": "[있으면 사용, 없으면 빈 문자열]",
  "composition": "[있으면 사용, 없으면 빈 문자열]",
  "weight_spec": "[있으면 사용, 없으면 빈 문자열]",
  "price": null,
  "verified_hs6": "[정답 HS 6자리]",
  "verified_hs_full": "[정답 HS 원본 — 6자리보다 길 수도]",
  "available_fields": ["product_name", "material", ...],  // 실제 데이터가 있는 필드 목록
  "available_field_count": 3  // 실제 사용 가능한 필드 수
}
```

저장: `/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_mapped.json`

**⚠️ 중요**:
- 없는 필드를 억지로 채우지 마라. 빈 문자열로 두고 "이 데이터는 X개 필드만 있음"을 기록.
- HS code가 6자리 미만이면 그것도 기록 (2자리=Chapter만, 4자리=Heading만 등)
- HS 2022 vs 이전 버전 차이가 있을 수 있음 — 확인 필요

---

## Phase 1: 전체 벤치마크 실행

### 1-1. 632건 전체 v3 파이프라인 실행

**있는 필드만으로** 파이프라인 실행. 없는 필드는 빈 문자열.

각 상품마다 기록:
```json
{
  "id": 1,
  "product_name": "...",
  "available_field_count": 3,
  "verified_hs6": "620520",
  "pipeline_section": 11,
  "pipeline_chapter": 62,
  "pipeline_heading": "6205",
  "pipeline_hs6": "620520",
  "section_match": true,
  "chapter_match": true,
  "heading_match": true,
  "hs6_match": true,
  "decision_path_summary": "S11(material:cotton) → Ch62(woven_clothing) → H6205(shirts) → 620520(cotton)"
}
```

### 1-2. 정확도 집계

```
=== HSCodeComp 632건 벤치마크 결과 ===

전체 정확도 (Ground Truth 대비):
- Section: XXX/632 (XX.X%)
- Chapter: XXX/632 (XX.X%)
- Heading (4자리): XXX/632 (XX.X%)
- HS6 (6자리): XXX/632 (XX.X%)

경쟁사 비교:
- POTAL v3: XX.X% (이번 결과)
- Tarifflo: 89% (논문 수치)
- Avalara: 80%
- Zonos: 44%
- WCO BACUDA: 13%

사용 가능 필드 분포:
- 9-field: XX건 (XX%) → HS6 정확도 XX%
- 7-8 field: XX건 → XX%
- 4-6 field: XX건 → XX%
- 1-3 field: XX건 → XX%
```

### 1-3. 틀린 건 전수 분석

틀린 건마다 기록:
```json
{
  "id": 42,
  "product_name": "...",
  "available_fields": ["product_name", "material"],
  "verified_hs6": "851770",
  "pipeline_hs6": "847330",
  "fail_step": "Step 2-3",
  "error_type": "FIELD_DEPENDENT | KEYWORD_MISSING | LOGIC_BUG | RULE_MISSING | HS_VERSION_MISMATCH",
  "root_cause": "구체적 원인",
  "code_fix_needed": true/false,
  "fix_description": "step2-3에 XX 키워드 추가"
}
```

**error_type 추가:**
- `HS_VERSION_MISMATCH`: 정답이 HS 2017/2012 기준이고 우리는 HS 2022 → 코드 변환 필요
- `DATA_AMBIGUOUS`: 상품 설명이 너무 모호해서 어떤 파이프라인도 맞추기 어려움

### 1-4. 오류 패턴 분석

```
=== 오류 패턴 ===

error_type 분포:
- FIELD_DEPENDENT: XX건 (XX%) — 필드 부족
- KEYWORD_MISSING: XX건 — 사전 추가 필요
- LOGIC_BUG: XX건 — 코드 수정 필요
- RULE_MISSING: XX건 — 규칙 추가 필요
- HS_VERSION_MISMATCH: XX건 — HS 버전 차이
- DATA_AMBIGUOUS: XX건 — 데이터 자체 모호

Step별 오류 분포:
- Step 2-1 (Section): XX건 — 원인 TOP 3
- Step 2-3 (Chapter): XX건 — 원인 TOP 3
- Step 3 (Heading): XX건 — 원인 TOP 3
- Step 4 (Subheading): XX건 — 원인 TOP 3

카테고리별 정확도 (가능하면):
- 의류/섬유: XX/YY (ZZ%)
- 전자제품: XX/YY (ZZ%)
- 식품/농산물: XX/YY (ZZ%)
- 금속/기계: XX/YY (ZZ%)
- 화학: XX/YY (ZZ%)
- 기타: XX/YY (ZZ%)
```

---

## Phase 2: 코드 수정 (KEYWORD_MISSING + LOGIC_BUG + RULE_MISSING만)

FIELD_DEPENDENT, HS_VERSION_MISMATCH, DATA_AMBIGUOUS는 수정 대상 아님.
KEYWORD_MISSING / LOGIC_BUG / RULE_MISSING만 수정.

1. 수정 대상 목록 작성
2. 파일별 수정 실행
3. `npm run build` 확인
4. 수정한 케이스만 재테스트
5. 전체 632건 재실행하여 최종 정확도 확인

각 수정 라운드 기록:
```
Fix Round 1: XX건 수정
- step2-1: added "polyester" to MATERIAL_TO_SECTION
- step3: added heading 8517 keywords
- 결과: XXX/632 → XXX/632 (+XX건)

Fix Round 2: XX건 수정
...

최종: XXX/632 (XX.X%)
```

---

## 결과 저장

### JSON
- `/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_raw.json` — 원본 데이터
- `/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_mapped.json` — 9-field 매핑
- `/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_results.json` — 632건 전체 결과
- `/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_errors.json` — 틀린 건 상세
- `/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_fixes.json` — 코드 수정 내역

### 엑셀 — 기존 POTAL_Ablation_V2.xlsx에 시트 추가

기존 파일: `/Volumes/soulmaten/POTAL/7field_benchmark/POTAL_Ablation_V2.xlsx`

**⚠️ 기존 시트 건드리지 마라. 아래 시트만 새로 추가.**

### 추가 Sheet: "HSCodeComp Dashboard"

Row 1: "HSCodeComp 632 Benchmark — Independent Ground Truth"
Row 3:
- Source: HuggingFace HSCodeComp (공개 벤치마크)
- Items: 632
- Ground Truth: 확정 HS Code (외부 독립)
- Available Fields: [데이터에 있는 필드 목록]

Row 7: 전체 정확도
| | Section | Chapter | Heading | HS6 |
| 정답 수 | /632 | /632 | /632 | /632 |
| 정확도 | % | % | % | % |

Row 12: 경쟁사 비교
| Provider | HS6 정확도 | 데이터 소스 |
| POTAL v3 | XX% | HSCodeComp 632 |
| Tarifflo | 89% | 자체 103건 (비공개) |
| Avalara | 80% | Tarifflo 논문 |
| Zonos | 44% | Tarifflo 논문 |

Row 18: error_type 분포 표
Row 25: Step별 오류 분포 표
Row 33: 카테고리별 정확도 표

Row 42: 3개 테스트 비교 (지금까지 누적)
| | Amazon 50건 (자기참조) | HSCodeComp 632건 (독립) | 비고 |
| 9/9 HS6 | 100% | ?% | |
| 코드 버그 | 0건 | ?건 | |
| 데이터 형식 | 셀러 형식 | 벤치마크 형식 | |
| 필드 수 | 9/9 | ?/9 | |

### 추가 Sheet: "HSCodeComp 632 Detail"
632건 전체 상세

| # | product_name | available_fields | field_count | verified_hs6 | pipeline_hs6 | section_match | chapter_match | heading_match | hs6_match | fail_step | error_type |

- hs6_match=TRUE → 초록, FALSE → 빨강
- error_type별 색상

### 추가 Sheet: "HSCodeComp Errors"
틀린 건만 모아서

| # | product_name | verified_hs6 | pipeline_hs6 | fail_step | error_type | root_cause | code_fix_needed | fix_description |

- code_fix_needed=TRUE → 빨강 배경

### 추가 Sheet: "HSCodeComp Fixes"
코드 수정 내역

| # | Round | 대상 파일 | 변경 내용 | 해결 건수 | Before→After 정확도 |

## 엑셀 스타일
기존 POTAL_Ablation_V2.xlsx와 동일 스타일.
HSCodeComp 시트 탭 색상: 초록 계열 (Amazon=기본, GT=파랑, HSCodeComp=초록 으로 구분)

## 진행 로그 형식

```
═══ Phase 0: 데이터 다운로드 ═══
HSCodeComp 다운로드... ✅/❌
총 건수: XXX
컬럼: [...]
샘플: { ... }

9-Field 매핑:
- product_name ← [컬럼명] ✅
- material ← [없음] ❌
- category ← [컬럼명] ✅
- verified_hs6 ← [컬럼명] ✅
사용 가능 필드: X/9

═══ Phase 1: 632건 벤치마크 ═══
[1/632] "cotton t-shirt" → verified=610910 pipeline=610910 ✅
[2/632] "laptop computer" → verified=847130 pipeline=847130 ✅
...
[42/632] "mixed spice blend" → verified=091099 pipeline=210390 ❌ Step 2-3 CHAPTER_WRONG
...

결과: Section XX% | Chapter XX% | Heading XX% | HS6 XX%
틀린 건: XXX개
경쟁사 대비: [비교 표]

═══ Phase 2: 코드 수정 ═══
수정 대상: XX건 (KEYWORD_MISSING XX + LOGIC_BUG XX + RULE_MISSING XX)
...
최종: XXX/632 (XX.X%)
```

portal 폴더에 엑셀 복사:
```bash
cp /Volumes/soulmaten/POTAL/7field_benchmark/POTAL_Ablation_V2.xlsx /Users/maegbug/potal/POTAL_Ablation_V2.xlsx 2>/dev/null || true
```

전체를 한번에 실행하고 끝까지 완료해라.
