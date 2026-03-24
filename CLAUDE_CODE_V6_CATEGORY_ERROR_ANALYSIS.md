# Claude Code 명령어: v6 Category 44% 오답 원인 상세 분석

> **날짜**: 2026-03-22 KST
> **목표**: v6에서 category(Chapter)가 틀린 273건(44%)이 왜 틀렸는지 상세 분석. 틀린 패턴을 분류해서 해결 방향을 찾는다.
> **데이터**: v6 실행 결과 JSON + HSCodeComp 632건 원본

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

---

## 분석 내용

### 1. 틀린 273건 전체 추출

v6 category ≠ 정답 Chapter인 건 전부 추출. 각 건에 대해:
```
- product_name (원문 전체)
- seller_category (cate_lv1 > lv2 > lv3 > lv4 > lv5)
- product_attributes (JSON 전체 — 특히 Material)
- v6가 답한 Chapter (Ch.XX) + WCO 설명
- 정답 Chapter (Ch.XX) + WCO 설명
- v6 Chapter와 정답 Chapter의 차이 (같은 Section인지, 아예 다른 Section인지)
```

### 2. 오답 패턴 분류

273건을 아래 패턴으로 분류:

```
패턴 A: "셀러 category 오도"
  → 셀러가 등록한 category가 WCO 기준과 다름
  → LLM이 셀러 category에 끌려서 오답
  → 예: Enamel Pin을 Home&Garden에 등록 → LLM이 Ch.96 선택, 정답은 Ch.71
  → 확인 방법: seller_category의 lv1이 정답 Chapter의 Section과 무관한 경우

패턴 B: "WCO Chapter 경계 모호"
  → 상품이 여러 Chapter에 걸쳐있어서 LLM이 인접 Chapter 선택
  → 예: 플라스틱 장난감 → Ch.95(완구)? Ch.39(플라스틱)? WCO 규칙상 Ch.95가 맞는데 LLM이 Ch.39
  → 확인 방법: v6 답과 정답이 같은 Section이거나 material 관련 Chapter

패턴 C: "product_name 정보 부족"
  → product_name만으로는 상품 유형 파악 불가
  → 예: "2024 New Hot Sale High Quality" 같은 마케팅 문구만 있는 경우
  → 확인 방법: product_name에서 상품 유형 키워드가 없는 경우

패턴 D: "material이 Chapter를 결정하는 경우"
  → 같은 상품이라도 material에 따라 Chapter가 다름
  → 예: 가방 — 가죽이면 Ch.42, 플라스틱이면 Ch.39, 섬유면 Ch.63
  → LLM이 material 정보 없이 Chapter를 잘못 선택
  → 확인 방법: 정답 Chapter가 material 기반 Chapter(Ch.39,42,44,48,63,69,70,73 등)인 경우

패턴 E: "LLM 단순 실수"
  → 정보가 충분한데 LLM이 잘못 판단
  → 확인 방법: product_name + attributes에 정답 단서가 명확히 있는데 틀린 경우
```

### 3. 패턴별 건수 + 대표 사례

각 패턴별:
- 건수 + 비율
- 대표 사례 10건 (product_name, seller_category, v6 답, 정답, 왜 틀렸는지)

### 4. cate_lv1별 오답 분석

```
| cate_lv1 | 전체 건수 | 정답 | 오답 | 정답률 | 주요 오답 패턴 |
```

특히 정답률 낮은 카테고리:
- Hair Wigs (3%), Weddings (0%), Underwear (14%) 등
- 왜 낮은지 구체적 이유

### 5. v6 답 Chapter vs 정답 Chapter 히트맵

```
가장 빈번한 오답 조합:
예: v6=Ch.39(플라스틱) → 정답=Ch.95(완구) : X건
예: v6=Ch.85(전기) → 정답=Ch.67(인조모발) : X건
상위 20개 오답 조합
```

### 6. "material 정보가 있었으면 맞혔을 건" 분석

```
273건 중:
- 원본 attributes에 Material 있는 건: X건
  → Material 정보로 정답 Chapter 유추 가능했던 건: X건
- 원본 attributes에 Material 없는 건: X건
  → material이 있었으면 맞혔을 건: X건 (패턴 D에 해당)
```

---

## 결과물

### 엑셀: `POTAL_V6_Category_Error_Analysis.xlsx`

**Sheet 1: Dashboard**
```
총 오답: 273건 (44%)
패턴별 건수: A(셀러 오도) X건, B(경계 모호) X건, C(정보 부족) X건, D(material 의존) X건, E(LLM 실수) X건
cate_lv1별 정답률 표
상위 20개 오답 조합
```

**Sheet 2: 273건 전체 상세**
```
| # | product_name | seller_category | attributes | v6 Ch | v6 Ch 설명 | 정답 Ch | 정답 Ch 설명 | 오답 패턴 | 같은 Section? | material 있었으면? |
```

**Sheet 3: 패턴별 대표 사례 (각 10건)**

**Sheet 4: cate_lv1별 분석**

**Sheet 5: 오답 조합 히트맵 (v6 Ch → 정답 Ch)**

시트 마감: `=== 작업 종료 === 273건 오답 중 패턴A X% 패턴B X% 패턴C X% 패턴D X% 패턴E X%`

---

## ⚠️ 절대 규칙

1. **273건 전부 분석** — 샘플링 X
2. **패턴 분류는 1건 1패턴** — 가장 주된 원인으로 분류
3. **엑셀에 전부 기록**
4. **엑셀 워크로그도 필수** (절대 규칙 11번)
