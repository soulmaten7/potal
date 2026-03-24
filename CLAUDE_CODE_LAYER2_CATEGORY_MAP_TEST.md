# Claude Code 명령어: Category → WCO 97 Chapter 매핑 1건 테스트

> **날짜**: 2026-03-22 KST
> **목표**: AliExpress category 1건을 GPT-4o-mini에게 줘서 WCO 97 Chapter에 정확히 매핑하는지 확인
> **모델**: GPT-4o-mini (이전 v1~v5 실험과 동일 모델)

---

## 테스트 내용

### 1. 테스트 데이터 (HSCodeComp 632건 중 1건)

HSCodeComp 데이터에서 아무 1건 골라서 아래 정보를 추출:
- product_name
- cate_lv1 ~ cate_lv5 (AliExpress 5단계 category)
- product_attributes (material 등)
- 정답 HS Code (verified_hs_full) → 앞 2자리 = 정답 Chapter

### 2. WCO 97 Chapter 목록 준비

`app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts`에서 97개 전체 추출.

### 3. GPT-4o-mini 호출

프롬프트:
```
아래는 WCO가 정한 97개 상품 분류 Chapter다 (국제 규칙):

Ch.1: Animals; live
Ch.2: Meat and edible meat offal
Ch.3: Fish and crustaceans, molluscs and other aquatic invertebrates
...
Ch.97: Works of art; collectors' pieces and antiques

아래 상품의 카테고리 정보를 보고, 위 97개 Chapter 중 가장 맞는 Chapter 번호를 선택해라.

상품 카테고리: {cate_lv1} > {cate_lv2} > {cate_lv3} > {cate_lv4} > {cate_lv5}
상품명: {product_name}

Chapter 번호만 답해라 (예: 71)
```

### 4. 정답 대조

LLM이 답한 Chapter 번호 vs 정답 HS Code 앞 2자리 → 일치 여부 확인

### 5. 추가: 5건 더 테스트

1건 성공하면, 다른 카테고리에서 4건 더 골라서 총 5건 테스트:
- Jewelry & Accessories 1건
- Home & Garden 1건
- Tools 1건
- Electronics 1건
- Clothing 1건

각각 정답 Chapter와 대조.

### 6. 결과 보고

```
| # | product_name | AliExpress category | LLM 답 | 정답 Chapter | 일치 |
|---|-------------|-------------------|--------|------------|------|
| 1 | ... | ... | Ch.XX | Ch.XX | ✅/❌ |
```

---

## ⚠️ 주의

- GPT-4o-mini 사용 (이전 실험과 동일)
- temperature=0
- Layer 1 코드 수정 금지
- 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)
