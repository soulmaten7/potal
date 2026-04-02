# CLAUDE_CODE_CUSTOMS_FIELD_MAPPING.md
# 240개국 세관 필드 명칭 매핑 조사 — Claude Code 실행 명령어
# 생성: 2026-03-20 KST (CW18 Cowork)

## 배경

POTAL v3 파이프라인은 9개 필드를 사용:
- product_name, material, category, description, processing, composition, weight_spec, price, origin_country

**문제 3가지**:

### 문제 1: 국가마다 세관 신고서(Customs Declaration)에서 이 필드들을 **다른 이름으로** 부름.
- 미국: "Product Description", "Material Composition"
- 중국: "品名" (Product Name), "材质" (Material), "成分" (Composition)
- EU: "Goods Description", "Commodity Code"
- 일본: "品名" (Hinmei), "材質" (Zaishitsu)

### 문제 2: **국가 기준이 먼저, 국제 기준이 나중** — 번역 시 불일치 발생
- 각 나라는 수백 년간 자국 세관 시스템을 먼저 만들었음
- WCO 국제 표준은 1952년 이후 — 이미 각국 시스템이 굳어진 뒤
- 따라서 **많은 나라가 국제 표준을 완전히 따르지 않음** (자국 양식 유지)
- 자국어 → 영어 번역 과정에서 **POTAL 영어 필드명과 다르게 매핑되는 케이스** 존재:
  - 중국 "材质" → 영어로 "Texture"로 번역 vs POTAL "material"
  - 일본 "材質" → 영어로 "Quality"로 번역 vs POTAL "material"
  - EU "Nature of goods" → POTAL에서는 "description"인지 "material"인지 애매
  - 한국 "품명+규격" → 하나의 필드에 product_name + weight_spec 합쳐져 있음
  - 같은 "Description"이 미국에서는 "상품 설명 전체", EU에서는 "HS 코드 설명"

### 문제 3: 국가 기준도 안 따르는 로컬 관행 존재
- 소규모 셀러, 개발도상국, 오래된 시스템 → 국가 기준조차 통일 안 됨
- 이커머스 플랫폼이 해당 국가 세관 용어를 따르면 POTAL 9-Field와 매핑 불가
- HSCodeComp 632건(AliExpress)에서 description=0%, material=57%인 이유 = 중국 세관 용어로 저장되어 있는데 영어 필드명으로 못 읽은 것
- **⚠️ 핵심**: 단순 번역이 아니라, "자국어 → 영어 번역 시 POTAL 영어 필드와 달라지는 불일치"를 특별히 잡아야 함

이 때문에:
1. 각 이커머스 플랫폼이 해당 국가 세관 용어를 따르면, POTAL의 9-Field와 **이름이 안 맞아서** 매핑이 안 됨
2. HSCodeComp 632건(AliExpress)에서 description=0%, material=57%인 이유도 **중국 세관 용어로 저장**되어 있어서 우리가 못 읽은 것일 수 있음
3. 240개국 고객 지원하려면, 각국 세관 필드 → POTAL 9-Field 자동 매핑 테이블이 필수
4. **자국어 → 영어 번역 시 불일치 케이스를 반드시 식별**해야 함 (단순 1:1 번역이 아닌 의미 차이)

## 실행 명령어 (Claude Code에 복사-붙여넣기)

```
아래 작업을 순서대로 실행해줘. 한 번에 하나씩, 정확하게.

## Phase 1: 주요 7개국 세관 신고서 필드 조사

7개국(US, EU, UK, CN, JP, KR, AU)의 **공식 세관 수입신고서(Import Declaration)** 양식에서
상품을 설명하는 모든 필드명을 조사해줘.

조사 대상 (각 나라의 공식 세관 신고서 양식):
1. **US** — CBP Form 7501 (Entry Summary) + ABI/ACE 전자신고 필드
2. **EU** — SAD (Single Administrative Document, CN23/CN22) + ICS2 전자신고 필드
3. **CN** — 中国海关进口报关单 (수입통관신고서) + 跨境电商 (크로스보더 이커머스 신고) 필드
4. **JP** — 輸入申告書 (수입신고서) + NACCS 전자신고 필드
5. **KR** — 수입신고서 (관세청 UNI-PASS) 전자신고 필드
6. **UK** — CHIEF/CDS Import Declaration 필드
7. **AU** — ABF Import Declaration (N10) 필드

각 나라별로 아래 9개 POTAL 필드에 해당하는 세관 필드명을 찾아줘:

| POTAL 필드 | 설명 | 각 나라 세관에서 뭐라고 부르는지 |
|------------|------|--------------------------------|
| product_name | 상품명 | ? |
| material | 소재/재질 | ? |
| category | 상품 분류/카테고리 | ? |
| description | 상품 상세 설명 | ? |
| processing | 가공 방법 (knitted, woven 등) | ? |
| composition | 성분 비율 (100% cotton 등) | ? |
| weight_spec | 중량/규격 | ? |
| price | 가격/신고가격 | ? |
| origin_country | 원산지 | ? |

**⚠️ 핵심 조사 항목 (반드시 포함)**:

1. **번역 불일치 (Translation Mismatch)**: 자국어 필드를 영어로 번역했을 때 POTAL 영어 필드명과 다르게 되는 케이스를 전부 찾아라.
   - 예: 중국 "材质" → 영어 "Texture" (≠ POTAL "material")
   - 예: 일본 "材質" → 영어 "Quality" (≠ POTAL "material")
   - 예: 한국 "품명+규격" = product_name + weight_spec이 하나의 필드에 합쳐짐
   - 각 불일치에 대해: `"translation_mismatch": { "local_english": "Texture", "potal_field": "material", "risk": "high" }` 형태로 기록

2. **필드 경계 불일치 (Field Boundary Mismatch)**: POTAL은 9개 필드를 분리하지만, 해당 나라에서는 여러 필드를 하나로 합치거나, 하나를 여러 개로 쪼개는 경우를 찾아라.
   - 예: EU "Nature of goods" = material + description 합쳐진 것?
   - 예: 한국 "품명+규격" = product_name + weight_spec 합쳐진 것

3. **국제 표준과 실제 사용의 차이**: WCO가 정한 표준 필드명과 실제 해당 국가 세관이 사용하는 필드명이 다른 경우를 기록.
   - `"wco_standard": "Goods.description"` vs `"actual_local": "品名"` vs `"actual_english_used": "Article Name"`

4. **해당 나라 이커머스 플랫폼의 용어**: 그 나라 주요 이커머스가 세관 용어 대신 자체 용어를 쓰는 경우.
   - 예: AliExpress "product_attributes.Material" vs 중국 세관 "材质"

**출력 형식**: JSON 파일로 저장

```json
{
  "US": {
    "official_form": "CBP Form 7501 + ACE",
    "fields": {
      "product_name": {
        "local_name": "Description of Merchandise",
        "form_field_number": "Box 28",
        "common_english_translations": ["Description of Merchandise", "Product Description", "Goods Description"],
        "translation_mismatch": null,
        "field_boundary": "단독 필드 — POTAL product_name과 1:1 대응",
        "notes": "세관 신고서에서 가장 중요한 필드"
      },
      "material": {
        "local_name": "Material Composition",
        "form_field_number": "Box 28 내 서브필드",
        "common_english_translations": ["Material", "Material Composition", "Fabric"],
        "translation_mismatch": null,
        "field_boundary": "⚠️ description 안에 포함되는 경우 있음",
        "notes": "미국은 material을 description 내 서술로 요구"
      }
    },
    "field_boundary_issues": [
      "US CBP는 material/composition을 별도 필드가 아닌 description 내 서술로 요구"
    ]
  },
  "CN": {
    "official_form": "海关进口报关单",
    "language": "zh-CN",
    "fields": {
      "product_name": {
        "local_name": "品名",
        "local_name_pinyin": "Pin Ming",
        "form_field_number": "...",
        "common_english_translations": ["Article Name", "Product Name", "Commodity Name"],
        "translation_mismatch": {
          "local_english": "Article Name",
          "potal_field": "product_name",
          "risk": "low",
          "explanation": "번역은 다르지만 의미는 동일"
        },
        "notes": "중국 세관에서 가장 기본 필드"
      },
      "material": {
        "local_name": "材质",
        "local_name_pinyin": "Cai Zhi",
        "form_field_number": "...",
        "common_english_translations": ["Texture", "Material", "Fabric"],
        "translation_mismatch": {
          "local_english": "Texture",
          "potal_field": "material",
          "risk": "high",
          "explanation": "⚠️ '材质'를 영어로 'Texture'로 번역하면 POTAL의 'material'과 매칭 실패"
        },
        "notes": "AliExpress에서 product_attributes.Material 또는 product_attributes.材质 로 저장"
      }
    },
    "field_boundary_issues": [
      "중국 跨境电商(크로스보더) 신고는 일반 수입신고와 필드 구조가 다름",
      "品名+规格 (품명+규격)이 하나의 필드로 합쳐지는 경우 있음"
    ]
  }
}
```

저장 위치: `/Volumes/soulmaten/POTAL/customs_field_mapping/phase1_7countries.json`

## Phase 2: 이커머스 플랫폼 필드 → POTAL 매핑

주요 이커머스 플랫폼 10개의 상품 데이터 필드를 조사하고 POTAL 9-Field에 매핑해줘.

대상 플랫폼:
1. **Shopify** — Product API (REST + GraphQL)
2. **Amazon** — SP-API (Catalog Items API)
3. **eBay** — Inventory API / Trading API
4. **WooCommerce** — REST API v3
5. **Etsy** — Listings API
6. **BigCommerce** — Catalog API
7. **AliExpress** — Product data structure (product_attributes JSON)
8. **Temu** — 상품 데이터 구조 (공개된 정보 기준)
9. **Walmart** — Marketplace API
10. **Magento** — REST API v2

각 플랫폼별로:
- API에서 반환하는 상품 관련 **모든** 필드명 나열
- 각 필드가 POTAL 9-Field 중 어디에 매핑되는지 표시
- 매핑 불가능한 경우 "UNMAPPED" + 이유
- 특이사항 (예: AliExpress는 material이 product_attributes.Material에 있음)

```json
{
  "Shopify": {
    "api_version": "2024-10",
    "api_type": "REST + GraphQL",
    "field_mapping": {
      "title": {
        "maps_to": "product_name",
        "confidence": "exact",
        "notes": "항상 존재, 필수 필드"
      },
      "body_html": {
        "maps_to": "description",
        "confidence": "exact",
        "notes": "HTML 형식, 텍스트 추출 필요"
      },
      "product_type": {
        "maps_to": "category",
        "confidence": "high",
        "notes": "자유 텍스트, 셀러가 직접 입력"
      },
      "options[].name='Material'": {
        "maps_to": "material",
        "confidence": "medium",
        "notes": "options 배열에서 'Material' 이름의 옵션을 찾아야 함. 셀러마다 다를 수 있음"
      },
      "variants[].weight": {
        "maps_to": "weight_spec",
        "confidence": "high",
        "notes": "그램 단위. weight_unit 필드 참조"
      },
      "variants[].price": {
        "maps_to": "price",
        "confidence": "exact",
        "notes": ""
      },
      "tags": {
        "maps_to": ["material", "processing", "category"],
        "confidence": "low",
        "notes": "태그에 소재/가공 정보가 있을 수 있지만 비구조화"
      }
    },
    "unmapped_potal_fields": {
      "processing": "별도 필드 없음. description이나 tags에서 추출 필요",
      "composition": "별도 필드 없음. material option 값에 포함될 수 있음",
      "origin_country": "variants[].country_of_origin 또는 별도 커스텀 필드"
    },
    "coverage": {
      "product_name": "100%",
      "material": "~70% (option으로 있는 경우)",
      "category": "~95% (product_type)",
      "description": "~90% (body_html)",
      "processing": "~10%",
      "composition": "~30%",
      "weight_spec": "~80%",
      "price": "100%",
      "origin_country": "~60%"
    }
  },
  "AliExpress": {
    "api_version": "N/A (data export)",
    "api_type": "Product data JSON",
    "field_mapping": {
      "product_title": {
        "maps_to": "product_name",
        ...
      },
      "product_attributes.Material": {
        "maps_to": "material",
        "confidence": "exact",
        "notes": "JSON attributes 안에 'Material' 키로 존재"
      },
      "product_attributes.材质": {
        "maps_to": "material",
        "confidence": "exact",
        "notes": "중국어 버전. 영어 'Material'과 동일 필드"
      },
      "cate_lv1_desc ~ cate_lv5_desc": {
        "maps_to": "category",
        "confidence": "exact",
        "notes": "5단계 카테고리 계층"
      }
    }
  }
}
```

저장 위치: `/Volumes/soulmaten/POTAL/customs_field_mapping/phase2_10platforms.json`

## Phase 3: WCO + 국제 표준 필드명 조사

국제 표준 기구에서 정한 공식 필드명을 조사해줘:

1. **WCO (World Customs Organization)**:
   - WCO Data Model v3.x — 상품 설명 관련 필드
   - WCO SAFE Framework — 전자 신고 데이터 요소
   - Kyoto Convention — 표준 신고서 양식

2. **UN/CEFACT**:
   - UN/EDIFACT CUSDEC (Customs Declaration) 메시지 — 세그먼트/필드
   - WCO-UN/CEFACT Single Window 표준

3. **WTO**:
   - TFA (Trade Facilitation Agreement) — 신고서 단순화 조항
   - 표준 신고 데이터 요소

각 표준에서 POTAL 9-Field에 해당하는 공식 데이터 요소명(Data Element Name)과 코드를 찾아줘.

```json
{
  "WCO_Data_Model": {
    "version": "3.x",
    "mappings": {
      "product_name": {
        "element_name": "Goods.description",
        "element_id": "WCO-xxx",
        "definition": "...",
        "notes": "..."
      },
      "material": {
        "element_name": "...",
        ...
      }
    }
  },
  "UN_EDIFACT_CUSDEC": {
    "mappings": {
      "product_name": {
        "segment": "IMD",
        "element": "C273.7008",
        ...
      }
    }
  }
}
```

저장 위치: `/Volumes/soulmaten/POTAL/customs_field_mapping/phase3_international_standards.json`

## Phase 4: 나머지 233개국 세관 필드 매핑 (Top 50개국)

무역 규모 Top 50개국의 세관 신고서 필드를 조사해줘.
(Phase 1의 7개국 제외, 나머지 43개국)

우선순위: 무역량 상위 순서대로
- **Tier 1** (즉시): CA, NZ, SG, HK, TW, IN, BR, MX, DE, FR, IT, NL, ES
- **Tier 2** (다음): TH, VN, MY, ID, PH, TR, SA, AE, ZA, NG, EG, IL, CL, CO, AR, PE
- **Tier 3** (나중): 나머지

각 나라별로 Phase 1과 동일 형식으로:
- 공식 수입신고서 양식명
- 9개 필드 매핑 (현지 이름 + 영어 번역 + 해당 양식 필드 번호)

저장 위치: `/Volumes/soulmaten/POTAL/customs_field_mapping/phase4_50countries.json`

## Phase 5: 통합 매핑 테이블 생성

Phase 1~4 결과를 통합해서:

1. **customs_field_universal_mapping.json** — 240개국 세관 필드 → POTAL 9-Field 매핑
   - 각 나라의 세관 필드명(현지어 + 영어) → POTAL 필드
   - 동의어 사전 (예: "品名" = "品目" = "product_name")

2. **platform_field_mapping.json** — 10개 플랫폼 필드 → POTAL 9-Field 매핑
   - 각 플랫폼의 API 필드명 → POTAL 필드
   - 자동 매핑 규칙 (exact/fuzzy/derived)

3. **field_synonym_dictionary.json** — 전체 동의어 사전
   - product_name의 모든 동의어: Description of Merchandise, 品名, 品目, Goods Description, 商品名称, Warenbezeichnung, Description des marchandises, ...
   - material의 모든 동의어: Material Composition, 材质, 材質, 素材, Materiale, Matériau, ...
   - 240개국 × 9필드 = 약 2,160개 동의어 그룹

저장 위치: `/Volumes/soulmaten/POTAL/customs_field_mapping/`

## Phase 6: HSCodeComp 632건 재분석

통합 매핑 테이블로 HSCodeComp 632건 원본 데이터를 다시 파싱해봐:

1. HSCodeComp 원본에서 `product_attributes` JSON을 열어서
2. 중국어/영어 필드명을 POTAL 9-Field에 매핑
3. 실제로 material/description 에 해당하는 데이터가 있는지 확인
4. 있다면 → 올바르게 매핑해서 v3 파이프라인 재실행
5. 결과를 POTAL_Ablation_V2.xlsx에 "HSCodeComp_Remapped" 시트로 추가

## 최종 산출물 요약

| 파일 | 내용 |
|------|------|
| phase1_7countries.json | 7개국 세관 필드 상세 (US/EU/UK/CN/JP/KR/AU) |
| phase2_10platforms.json | 10개 이커머스 플랫폼 필드 매핑 |
| phase3_international_standards.json | WCO/UN/WTO 국제 표준 필드 |
| phase4_50countries.json | Top 50개국 세관 필드 |
| customs_field_universal_mapping.json | 통합 세관 매핑 (240개국) |
| platform_field_mapping.json | 통합 플랫폼 매핑 (10개) |
| field_synonym_dictionary.json | 전체 동의어 사전 (~2,160 그룹) |
| POTAL_Ablation_V2.xlsx (업데이트) | HSCodeComp 재매핑 시트 추가 |

모든 파일은 `/Volumes/soulmaten/POTAL/customs_field_mapping/` 에 저장.
Phase 1부터 순서대로, 한 Phase 끝나면 다음 Phase 실행.
각 Phase 완료 시 DONE_PHASE_N.txt 파일 생성.
```

## 이 작업의 전략적 의미

1. **즉시 효과**: HSCodeComp 632건 재매핑 → 실제 accuracy 재측정 (6.3%보다 높을 것)
2. **제품 기능**: POTAL API에 "자동 필드 매핑" 기능 추가 가능
   - 고객이 자기 플랫폼 데이터 그대로 보내면 → POTAL이 자동으로 9-Field에 매핑
   - 매핑 신뢰도(confidence) 표시 → 낮으면 추가 정보 요청
3. **B2B 가치**: "어떤 플랫폼/나라 데이터든 보내면 자동 매핑" = 경쟁사에 없는 기능
4. **240개국 커버리지**: 세관 필드 동의어 사전 = 어떤 나라 셀러든 자기 용어로 데이터 전송 가능
