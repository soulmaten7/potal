# Claude Code 명령어: v6 결과 데이터 상세 확인

> **날짜**: 2026-03-22 KST
> **목표**: v6 실행 결과 데이터를 전수 확인. 632건 각각의 입력(product_name, category, material 원본)과 v6 출력(product_name, category, material)을 대조해서 정확한 건수 파악.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

---

## 확인할 것

### 1. 원본 데이터 632건 필드별 건수

```
632건 각각에 대해:
- product_name: 있음/없음 건수
- product_attributes에서 "Material" 키: 있음/없음 건수
- product_attributes에서 "Material" 값이 비어있지 않은 건수
- cate_lv1: 있음/없음 건수
- cate_lv2~lv5: 있음/없음 건수
- price: 있음/없음 건수
- verified_hs_full: 있음/없음 건수 (정답)
```

### 2. v6 출력 632건 필드별 건수

v6 LLM 결과 JSON에서:
```
- product_name: 비어있지 않은 건수
- category (Ch.XX): 비어있지 않은 건수 + 유효한 Ch.1~97 범위 건수
- material: 비어있지 않은 건수 + MATERIAL_KEYWORDS 79그룹 유효 건수
```

### 3. material 상세 분석

```
A: 원본에 Material 있고 + v6도 material 출력한 건수
B: 원본에 Material 있고 + v6가 material 못 채운 건수
C: 원본에 Material 없고 + v6가 material 추론해서 채운 건수
D: 원본에 Material 없고 + v6도 material 못 채운 건수

A+B = 원본 Material 있는 360건
C+D = 원본 Material 없는 272건
A+C = v6가 material 채운 총 건수
B+D = v6가 material 못 채운 총 건수 ← 이게 핵심
```

### 4. category 상세 분석

```
정답 Chapter = verified_hs_full 앞 2자리

A: v6 category(Ch.XX) = 정답 Chapter → 건수
B: v6 category(Ch.XX) ≠ 정답 Chapter → 건수
C: v6 category 비어있음/유효하지 않음 → 건수
```

### 5. material 정답 확인

```
material은 정답이 따로 없지만, 정답 HS Code의 Section으로 유추 가능:
- 정답 HS Code 앞 2자리 → Chapter → Section
- v6 material이 해당 Section에 맞는지 확인

예: 정답 Ch.71(Section XIV 보석) + v6 material="alloy" → alloy는 Section XV(비금속)이므로 불일치
예: 정답 Ch.61(Section XI 섬유) + v6 material="cotton" → cotton은 Section XI이므로 일치
```

### 6. 교차 분석: category 맞고 + material 맞은 건 vs 둘 다 틀린 건

```
| | material 맞음 | material 틀림 |
|---|---|---|
| category 맞음 | X건 | X건 |
| category 틀림 | X건 | X건 |
```

### 7. 전수 출력 (샘플이 아닌 전체)

632건 전부를 엑셀에 기록:

엑셀: `POTAL_V6_Detail_Check.xlsx`

**Sheet 1: Dashboard**
```
원본 필드 건수, v6 출력 건수, material A/B/C/D, category 정답률, 교차 분석
```

**Sheet 2: 632건 전체**
```
| # | product_name 원본 | Material 원본(attributes) | cate_lv1 원본 | v6_product_name | v6_category | v6_material | 정답 Ch | Ch 일치 | Material Section 일치 |
```

**Sheet 3: material 못 채운 건 상세**
```
B+D 건 전부: product_name, 원본 attributes, v6 출력, 왜 못 채웠는지
```

**Sheet 4: category 틀린 건 상세**
```
v6 category ≠ 정답 Chapter 건 전부
```

---

## ⚠️ 절대 규칙

1. **632건 전부 확인** — 샘플링 X
2. **v6 결과 JSON 파일을 직접 읽어서 확인** — 이전 벤치마크에서 저장한 결과 파일 사용
3. **원본 데이터도 직접 읽어서 대조** — HSCodeComp 원본
4. **엑셀에 632건 전부 기록**
5. **엑셀 워크로그도 필수** (절대 규칙 11번)
