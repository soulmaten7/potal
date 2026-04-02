# CLAUDE_CODE_PLATFORM_FIELD_INVESTIGATION.md
# 이커머스 플랫폼별 상품 정보 필드 전수 조사
# 생성: 2026-03-20 KST (CW18 Cowork)

## 목적

**주요 이커머스 플랫폼이 상품 정보를 어떤 필드로 저장하는지 전수 조사.**

세관 조사(CUSTOMS_FIELD_INVESTIGATION)는 "정부가 뭘 요구하는지"였다면,
이번 조사는 "플랫폼이 실제로 뭘 갖고 있는지"를 알아보는 것.

같은 나라라도 플랫폼마다 상품 필드 구조가 다르다:
- 중국 세관(申报要素): 18개 필드 (材质, 成分含量, 加工方式 별도)
- AliExpress: 상품명 + 몇 개 속성
- Taobao: 또 다른 구조
→ 국가 기준과 플랫폼 기준을 둘 다 알아야 완전한 그림이 나온다.

⚠️ **이번 작업도 조사만 한다. POTAL 9-field 매핑은 하지 않는다.**
⚠️ 각 플랫폼이 상품에 대해 어떤 필드를 실제로 저장하는지 있는 그대로 수집.
⚠️ 매핑은 세관 조사 결과 + 플랫폼 조사 결과를 합친 후 별도로 진행.

---

## Phase 1: 글로벌 이커머스 플랫폼 (10개)

각 플랫폼의 **상품 데이터 구조(Product Data Schema)**를 조사.
API 문서, 개발자 문서, 상품 등록 양식 기준.

### 조사할 플랫폼:

| # | 플랫폼 | 본사 국가 | 주요 시장 | 조사 소스 |
|---|--------|---------|---------|---------|
| 1 | Shopify | CA | 글로벌 | Product API, Admin API docs |
| 2 | Amazon | US | 글로벌 | SP-API Product Listing docs, Flat File templates |
| 3 | AliExpress | CN | 글로벌 (중국 셀러) | AliExpress Open Platform API docs |
| 4 | eBay | US | 글로벌 | Inventory API, Trading API docs |
| 5 | WooCommerce | US | 글로벌 (셀프호스팅) | REST API Product docs |
| 6 | Etsy | US | 글로벌 (핸드메이드) | Open API v3 docs |
| 7 | Taobao/Tmall | CN | 중국 내수 | 淘宝开放平台 API docs |
| 8 | Rakuten | JP | 일본 | RMS API docs |
| 9 | Coupang | KR | 한국 | Coupang Wing API / 로켓배송 상품 등록 |
| 10 | BigCommerce | US | 글로벌 | Catalog API docs |

### 각 플랫폼별 조사 포맷:

```
[플랫폼명] — 상품 데이터 필드 구조
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

본사 국가: [국가]
주요 셀러 국가: [어느 나라 셀러가 주로 쓰는지]
조사 소스: [API docs URL 등]

상품 관련 필드 전체 목록 (API/DB 기준):
| 필드명 (API) | 표시명 (UI) | 데이터 타입 | 필드 설명 (뭘 넣는 칸인지) | 필수여부 | 예시값 |
|-------------|-----------|-----------|----------------------|---------|-------|
| title | Product Title | string | 상품 제목 | 필수 | "Women's Cotton T-Shirt" |
| body_html | Description | HTML/text | 상품 상세 설명 | 선택 | "<p>100% cotton, machine washable...</p>" |
| product_type | Product Type | string | 상품 카테고리/유형 | 선택 | "T-Shirts" |
| vendor | Vendor | string | 브랜드/제조사 | 선택 | "Nike" |
| variants[].weight | Weight | number | 무게 (그램) | 선택 | 250 |
| variants[].price | Price | decimal | 가격 | 필수 | "29.99" |
| ... | ... | ... | ... | ... | ... |

속성/옵션 시스템:
- [플랫폼이 material/composition 등을 어떤 방식으로 저장하는지]
- [고정 필드인지, 커스텀 속성인지, 태그인지]
- [카테고리별로 요구하는 속성이 다른지]

특이사항:
- [이 플랫폼만의 독특한 필드]
- [material이 별도 필드인지 description에 포함인지]
- [카테고리 선택 시 추가 필드가 나타나는지]
```

---

## Phase 2: 지역 이커머스 플랫폼 (15개)

글로벌 플랫폼 외에, 각 지역에서 큰 플랫폼들:

| # | 플랫폼 | 국가 | 조사 소스 |
|---|--------|------|---------|
| 11 | Mercado Libre | AR/MX/BR | API docs (라틴아메리카 최대) |
| 12 | Flipkart | IN | 인도 최대, Seller API |
| 13 | Shopee | SG | 동남아 + 대만 + 브라질, Open Platform API |
| 14 | Lazada | SG | 동남아, Open Platform API (Alibaba 계열) |
| 15 | Temu | CN | 글로벌 진출, 셀러 등록 양식 |
| 16 | SHEIN | CN | 글로벌, 셀러 등록 양식 |
| 17 | Ozon | RU | 러시아 최대, Seller API |
| 18 | Wildberries | RU | 러시아, Seller API |
| 19 | Noon | AE | 중동 최대, Seller API |
| 20 | Jumia | NG | 아프리카 최대, Seller Center |
| 21 | Tokopedia | ID | 인도네시아, Seller API |
| 22 | Zalando | DE | 유럽 패션, Partner API |
| 23 | Otto | DE | 독일, Partner Portal |
| 24 | Naver Shopping | KR | 한국, 스마트스토어 API |
| 25 | Yahoo! Shopping Japan | JP | 일본, Store Creator API |

### 각 플랫폼 Phase 1과 동일 포맷으로 조사.

---

## Phase 3: B2B / 도매 플랫폼 (5개)

크로스보더 B2B 거래에서 사용하는 플랫폼:

| # | 플랫폼 | 국가 | 특징 |
|---|--------|------|------|
| 26 | Alibaba.com | CN | B2B 도매, Trade Assurance |
| 27 | Global Sources | HK | B2B 도매 |
| 28 | Made-in-China.com | CN | B2B 도매 |
| 29 | IndiaMART | IN | 인도 B2B |
| 30 | TradeIndia | IN | 인도 B2B |

B2B 플랫폼은 material/composition/specification을 더 세분화해서 받을 가능성이 높음.
이것도 Phase 1과 동일 포맷으로 조사.

---

## Phase 4: 플랫폼 데이터 내보내기 구조 (Export/Feed)

셀러가 상품 데이터를 **대량 등록/내보내기**할 때 사용하는 파일 구조도 조사.
실제로 POTAL API에 데이터를 보낼 때 이 구조에서 올 가능성이 높음.

| 플랫폼 | 내보내기 형식 | 조사할 것 |
|--------|------------|---------|
| Shopify | CSV Export | 어떤 열이 있는지 |
| Amazon | Flat File (Excel/TSV) | 카테고리별 필수/선택 열 |
| eBay | File Exchange CSV | 열 구조 |
| WooCommerce | CSV Import/Export | 열 구조 |
| AliExpress | 상품 일괄 등록 템플릿 | 열 구조 |

각 내보내기 파일의 **열(column) 전체 목록** 기록.

---

## Phase 5: 엑셀 생성 — 최종 산출물

### 파일명: POTAL_Platform_Product_Fields_Raw.xlsx

⚠️ **POTAL 매핑 하지 말 것. 있는 그대로만 기록.**

### Sheet 1: Global Platforms (10개)
플랫폼별 각 행에 상품 필드를 하나씩 기록:

| Platform | HQ Country | Main Sellers | Source (API/docs URL) | Field Name (API) | Field Name (UI) | Data Type | Description (뭘 넣는 칸인지) | Mandatory | Category-Specific | Example Value |
|----------|-----------|-------------|----------------------|-----------------|----------------|-----------|--------------------------|-----------|------------------|--------------|

### Sheet 2: Regional Platforms (15개)
Sheet 1과 동일 포맷.

### Sheet 3: B2B Platforms (5개)
Sheet 1과 동일 포맷.

### Sheet 4: Export/Feed Formats
내보내기 파일의 열 구조:

| Platform | Export Format | Column Name | Column Description | Mandatory | Example Value |
|----------|-------------|-------------|-------------------|-----------|--------------|

### Sheet 5: All 30 Platforms — Summary (플랫폼별 1행 요약)
| Platform | HQ Country | Total Product Fields | Has Material Field? | Has Composition Field? | Has Processing Field? | Has Category Field? | Has Weight Field? | Material Location (별도필드/속성/설명에포함) | Key Fields (쉼표 구분) |
|----------|-----------|---------------------|--------------------|-----------------------|----------------------|--------------------|------------------|--------------------------------------|---------------------|

### Sheet 6: 국가 × 플랫폼 교차표
같은 나라의 세관 vs 플랫폼 필드 구조 비교:

| Country | Customs Fields (세관 조사 결과에서) | Platform 1 Fields | Platform 2 Fields | 차이점 |
|---------|-------------------------------|------------------|------------------|-------|
| CN | 18개 (申报要素) | AliExpress: ? | Taobao: ? | |
| US | 9개 (CBP 7501) | Amazon: ? | eBay: ? | |
| KR | 10개 (UNI-PASS) | Coupang: ? | Naver: ? | |
| JP | 8개 (輸入申告書) | Rakuten: ? | Yahoo: ? | |

---

## Phase 6: 조사 결과 요약 통계

매핑 없이 통계만:

1. **30개 플랫폼이 상품에 대해 저장하는 평균 필드 수는?**
   - 가장 많은 플랫폼 vs 가장 적은 플랫폼

2. **material을 별도 필드로 갖고 있는 플랫폼은 몇 개?**
   - 별도 필드 vs 커스텀 속성 vs description에 포함

3. **composition을 별도 필드로 갖고 있는 플랫폼은?**

4. **processing을 별도 필드로 갖고 있는 플랫폼은?**

5. **category 구조는?**
   - 고정 카테고리 트리 vs 자유 텍스트 vs taxonomy 기반

6. **같은 나라인데 세관과 플랫폼의 필드 구조가 다른 경우?**
   - 예: 중국 세관 18필드 vs AliExpress ?필드

7. **B2B vs B2C 플랫폼의 필드 세분화 차이?**
   - B2B가 material/spec을 더 세분화하는지

---

## 실행 명령

```
위 Phase 1~6을 순서대로 실행하세요.

⚠️ 중요: POTAL 9-field 매핑은 절대 하지 마세요.
각 플랫폼이 실제로 어떤 필드를 저장하는지 있는 그대로만 수집합니다.
매핑은 세관 조사 결과 + 이 플랫폼 조사 결과를 합친 후 별도로 진행합니다.

조사 방법:
- 각 플랫폼의 공식 API 문서 / 개발자 문서 확인
- 상품 등록 화면(Seller Center) 구조 확인
- 대량 등록 템플릿(CSV/Excel) 열 구조 확인
- 카테고리별 추가 속성이 있으면 대표 카테고리 3~5개 조사 (의류, 전자, 식품, 가구, 화장품)

산출물:
1. phase1_global_platforms.json — 10개 글로벌 플랫폼 필드
2. phase2_regional_platforms.json — 15개 지역 플랫폼 필드
3. phase3_b2b_platforms.json — 5개 B2B 플랫폼 필드
4. phase4_export_formats.json — 내보내기 파일 열 구조
5. POTAL_Platform_Product_Fields_Raw.xlsx — 최종 엑셀 (6시트, 매핑 없이 순수 조사 결과만)

저장 위치:
- JSON: /Volumes/soulmaten/POTAL/platform_field_mapping/
- Excel: /Volumes/soulmaten/POTAL/platform_field_mapping/ + portal 복사

핵심 원칙:
1. "각 플랫폼이 상품에 대해 어떤 필드를 실제로 저장하는지" 조사
2. API 문서 / 개발자 문서 / 셀러 센터 기준 (실제 구조)
3. POTAL 매핑 하지 말 것 — 있는 그대로만 기록
4. 카테고리별 추가 속성이 있으면 반드시 기록
5. material이 별도 필드인지, 커스텀 속성인지, description에 포함인지 반드시 구분
```
