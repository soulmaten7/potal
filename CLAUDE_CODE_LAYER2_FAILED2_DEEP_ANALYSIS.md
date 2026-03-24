# Claude Code 명령어: 실패 2건 상품정보 키워드화 + 정답 단서 위치 분석

> **날짜**: 2026-03-22 KST
> **목표**: Category→Chapter 매핑 테스트에서 실패한 2건(#3 Enamel Pin, #4 Carbon Brush)의 상품 데이터 전체를 키워드화해서, 정답 Chapter를 맞출 수 있는 단서가 데이터 어디에 있는지(또는 없는지) 확인
> **핵심 질문**: 셀러가 등록한 category가 WCO Chapter와 다를 때, 상품 데이터 안에 정답을 알려주는 정보가 있나?

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

---

## Phase 1: 실패 2건 상품 데이터 전체 추출

HSCodeComp 632건 데이터에서 아래 2건을 찾아서 **모든 필드를 빠짐없이** 출력:

```
#3: Enamel Pin (LLM=Ch.96, 정답=Ch.71)
#4: Carbon Brush (LLM=Ch.82, 정답=Ch.85)
```

각 상품에 대해:
- product_name (전체, 잘리지 않게)
- product_attributes (JSON 전체 파싱, 키-값 전부)
- cate_lv1 ~ cate_lv5 (5단계 전부)
- price + currency_code
- verified_hs_full (정답 HS Code 전체)
- 기타 존재하는 모든 필드

---

## Phase 2: 키워드화

각 상품의 모든 필드에서 키워드를 추출하고, 출처별로 정리:

```
상품 #3 (Enamel Pin):
  product_name에서: [키워드1, 키워드2, ...]
  attributes에서: {Material: "...", Origin: "...", ...}
  category에서: [lv1, lv2, lv3, lv4, lv5]
  price: $XX
  기타: ...
```

---

## Phase 3: 정답 Chapter 단서 위치 확인

정답 HS Code 앞 2자리 = 정답 Chapter. 이 Chapter를 맞추려면 어떤 정보가 필요했는지 분석:

### #3 Enamel Pin (정답: Ch.71 보석류)

```
질문 1: product_name에 Ch.71을 알려주는 단서가 있나?
  → "enamel pin"이라는 단어가 Ch.71과 연결되는지?
  → Ch.71 WCO 정의: "Natural, cultured pearls; precious, semi-precious stones; precious metals... imitation jewellery; coin"
  → "pin"이 "imitation jewellery"에 해당하는지?

질문 2: product_attributes에 단서가 있나?
  → Material 필드에 뭐가 적혀있나?
  → 다른 attributes에 Ch.71 힌트가 있나?

질문 3: category에 단서가 있나?
  → "Home & Garden > Party Supplies"는 Ch.71과 무관
  → category가 오히려 오답 방향으로 유도

질문 4: 다른 필드에 단서가 있나?

결론: 정답(Ch.71)을 맞추려면 [어떤 필드의 어떤 정보]가 필요했다
```

### #4 Carbon Brush (정답: Ch.85 전기기계)

```
동일 질문 1~4 반복

결론: 정답(Ch.85)을 맞추려면 [어떤 필드의 어떤 정보]가 필요했다
```

---

## Phase 4: 핵심 판단

```
Case A: 정답 단서가 데이터 어딘가에 있었다 → 기존 데이터를 제대로 활용하면 맞출 수 있음
Case B: 정답 단서가 데이터 어디에도 없다 → 외부 지식(LLM)이 필요
Case C: 정답 단서가 있지만 category와 충돌 → category를 무시하고 다른 필드를 우선해야 함
```

각 상품이 A/B/C 중 어디에 해당하는지 판정.

---

## 결과 보고

```
| # | 상품 | 정답 Chapter | 단서 위치 | Case | 설명 |
|---|------|------------|---------|------|------|
| 3 | Enamel Pin | Ch.71 | ??? | A/B/C | ... |
| 4 | Carbon Brush | Ch.85 | ??? | A/B/C | ... |
```

---

## ⚠️ 주의
- 데이터의 모든 필드를 빠짐없이 확인 (숨겨진 단서가 있을 수 있음)
- product_attributes JSON은 반드시 파싱해서 키-값 전부 출력
- WCO Chapter 정의와 대조 (chapter-descriptions.ts 참조)
- 엑셀 로깅 필수
