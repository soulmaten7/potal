# CLAUDE_CODE_CUSTOMS_FIELD_INVESTIGATION.md
# 240개국 세관 수입신고서 — 상품 정보 필드 전수 조사
# 생성: 2026-03-20 KST (CW18 Cowork)
# 수정: 2026-03-20 KST — 매핑 제거, 순수 조사만 수행

## 목적

**각 나라의 세관이 수출입 업체에게 "상품에 대해 뭘 적어내라"고 하는지 전수 조사.**

수입신고서(Import Declaration / Customs Declaration)를 제출할 때,
세관이 요구하는 **상품 관련 정보 필드**가 나라마다 다르다.

⚠️ **이번 작업은 조사만 한다. POTAL 9-field 매핑은 하지 않는다.**
⚠️ 각 나라 세관이 실제로 어떤 필드를 요구하는지 있는 그대로 수집하는 것이 목표.
⚠️ 매핑은 조사 결과를 확인한 후 별도로 진행한다.

---

## Phase 1: 국제 기준 조사

WCO/UN/WTO가 정한 **국제 표준 수입신고서 양식**에서 상품 정보로 어떤 필드를 요구하는지 조사.

### 조사 대상:
1. **WCO (World Customs Organization)**
   - Revised Kyoto Convention — 수입신고서 필수 데이터 요소
   - WCO Data Model v3+ — 상품 관련 데이터 요소 목록

2. **UN/CEFACT**
   - UN Layout Key — 국제 무역 서류 표준 양식
   - UN/EDIFACT CUSDEC — 전자 세관 신고 메시지 표준

3. **WTO**
   - Trade Facilitation Agreement — 신고서 간소화 권고

4. **ASYCUDA (UN 세관 자동화 시스템)**
   - 90개국 이상 사용 — ASYCUDA의 상품 필드 구조 조사

### 산출물:
```json
{
  "standard_name": "WCO Data Model v3.11",
  "product_related_fields": [
    {
      "field_id": "WCO_001",
      "field_name": "Goods Description",
      "definition": "원문 정의 그대로",
      "mandatory": true
    }
  ]
}
```

---

## Phase 2: 주요 7개국 세관 수입신고서 상세 조사

**실제 수입신고서 양식**을 찾아서, 상품에 대해 어떤 칸을 채우게 하는지 조사.
**POTAL 매핑 하지 말 것 — 세관 양식에 있는 그대로 기록.**

### 조사할 나라 + 신고서 양식:

| 나라 | 수입신고서 이름 | 세관 기관 |
|------|--------------|----------|
| 미국 | CBP Form 7501 (Entry Summary) | U.S. Customs and Border Protection |
| EU | SAD (Single Administrative Document) | EU Customs |
| 영국 | CDS (Customs Declaration Service) | HMRC |
| 중국 | 海关进口报关单 (Import Declaration) | 中华人民共和国海关总署 (GACC) |
| 일본 | 輸入申告書 (Import Declaration) | 財務省 税関 |
| 한국 | 수입신고서 (UNI-PASS) | 관세청 |
| 호주 | N10 Import Declaration | Australian Border Force |

### 각 나라별 조사 포맷:

```
[나라명] 수입신고서 — 상품 관련 필드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

신고서 양식명: [정식 양식명]
관할 기관: [세관 기관명]
양식 URL/근거법: [가능하면 URL]

상품 관련 필드 목록 (세관 양식에 적혀 있는 그대로):
| 필드번호 | 현지어 필드명 | 영어 필드명(공식 번역) | 필드 설명 (세관이 적으라는 내용) | 필수여부 |
|---------|------------|-------------------|---------------------------|---------|
| Box XX  | [현지어]    | [영어]             | [무엇을 적어야 하는지]        | 필수/선택 |

특이사항:
- [이 나라만의 독특한 필드]
- [하나의 칸에 여러 정보를 같이 적게 하는 경우]
- [다른 나라에는 없는 필드]
```

### 핵심 주의사항:
- **실제 신고서 양식 기준으로 조사** (이론적 표준이 아니라, 세관에 실제 제출하는 서류)
- 현지어 필드명을 반드시 포함 (중국어, 일본어, 한국어 원문 그대로)
- 공식 영어 번역이 있으면 반드시 포함
- 필수/선택 구분 반드시 표시
- **POTAL 매핑 열 넣지 말 것** — 있는 그대로만 기록

---

## Phase 3: 나머지 43개국 세관 신고서 조사 (Tier 1 + Tier 2)

### Tier 1 — 13개국 (무역량 상위, POTAL 타겟):
캐나다, 인도, 싱가포르, 대만, 태국, 베트남, 인도네시아, 말레이시아, 멕시코, 브라질, UAE, 사우디, 터키

### Tier 2 — 30개국 (지역 대표):
아르헨티나, 칠레, 콜롬비아, 페루, 남아공, 나이지리아, 케냐, 이집트, 모로코, 이스라엘,
뉴질랜드, 필리핀, 방글라데시, 파키스탄, 스리랑카, 미얀마, 캄보디아,
러시아, 우크라이나, 카자흐스탄, 폴란드, 체코, 헝가리, 루마니아,
스위스, 노르웨이, 아이슬란드,
가나, 에티오피아, 탄자니아

### 각 나라별 Phase 2와 동일 포맷으로 조사:
- 수입신고서 양식명
- 세관 기관명
- 상품 관련 필드 전체 목록 (현지어 + 영어)
- 각 필드가 어떤 정보를 적으라는 건지 설명
- 필수/선택 구분
- 특이사항 (독특한 필드, 합쳐진 필드 등)
- **POTAL 매핑 하지 말 것**

---

## Phase 4: 나머지 190개국 그룹 조사

190개국을 개별 조사하기 어려우므로, **지역/세관 시스템 그룹별로 공통 양식 확인**.

### 그룹 분류:
| 그룹 | 공통 양식/시스템 | 해당 국가 수 |
|------|---------------|------------|
| EU 27개국 | SAD (Single Administrative Document) | 27 |
| CIS (구소련) | CIS 관세 양식 | ~10 |
| ASYCUDA 사용국 | UNCTAD ASYCUDA 시스템 | ~90+ |
| GCC 6개국 | GCC 공통 관세법 | 6 |
| ECOWAS | ECOWAS 공통 관세 | 15 |
| EAC (동아프리카) | EAC 공통 관세 | 7 |
| MERCOSUR | MERCOSUR 공통 신고서 | 4 |
| CARICOM | CARICOM 공통 관세 | 15 |
| Pacific Islands | Pacific 지역 양식 | ~14 |
| 기타 개별 | 자체 양식 | 나머지 |

각 그룹별:
- 공통 양식의 상품 관련 필드 전체 목록
- 현지어 + 영어
- 각 필드 설명
- 그룹 내 예외 국가 (독자 양식 사용하는 나라가 있으면 별도 기록)
- **POTAL 매핑 하지 말 것**

---

## Phase 5: 엑셀 생성 — 최종 산출물

### 파일명: POTAL_240_Customs_Fields_Raw.xlsx

⚠️ **이 엑셀은 순수 조사 결과만 담는다. POTAL 매핑 열은 넣지 않는다.**

### Sheet 1: International Standards (국제 기준)
| Standard | Field ID | Field Name | Definition (원문) | Mandatory |
|----------|---------|-----------|-----------------|-----------|
| WCO Data Model | DE 7/2 | Goods Description | ... | Y |
| UN Layout Key | Box 31 | Packages and Description | ... | Y |
| ASYCUDA | ... | ... | ... | ... |

### Sheet 2: 7 Major Countries (7개국 상세)
나라별 각 행에 상품 관련 필드를 하나씩 기록:

| Country | ISO | Declaration Form | Customs Authority | Field # | Local Field Name (현지어) | English Field Name (공식 번역) | Field Description (세관이 적으라는 내용) | Mandatory | Notes |
|---------|-----|-----------------|------------------|---------|-------------------------|------------------------------|--------------------------------------|-----------|-------|
| 미국 | US | CBP Form 7501 | CBP | Box 27 | Description of Merchandise | Description of Merchandise | 상품 설명 (소재, 용도, 특성 포함) | Y | 여러 정보를 한 칸에 |
| 미국 | US | CBP Form 7501 | CBP | Box 34 | Duty Rate | Duty Rate | ... | Y | |
| 중국 | CN | 海关进口报关单 | GACC | 第X栏 | 品名 | Product Name | 상품의 이름 | Y | |
| 중국 | CN | 海关进口报关单 | GACC | 第X栏 | 材质 | Material/Texture | 주요 재질 | Y | 영어로 Texture라고 번역되기도 함 |
| 중국 | CN | 海关进口报关单 | GACC | 第X栏 | 成分 | Composition | 성분 비율 | Y | |
| 한국 | KR | 수입신고서 | 관세청 | 항목XX | 품명 | Product Name | 상품명 | Y | |
| 한국 | KR | 수입신고서 | 관세청 | 항목XX | 규격 | Specification | 규격/사양 | Y | 품명과 합쳐서 쓰기도 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

### Sheet 3: 43 Countries (Tier 1 + Tier 2)
Sheet 2와 동일 포맷.

### Sheet 4: 190 Countries by Group
그룹별로 공통 양식의 필드를 기록:

| Group | System/Form | Countries Using | Field # | Field Name (공통) | English | Field Description | Mandatory | Exception Countries |
|-------|------------|----------------|---------|-----------------|---------|------------------|-----------|-------------------|
| EU 27 | SAD | AT,BE,BG,HR,CY,CZ,DK,... | Box 31 | Description of Goods | ... | ... | Y | |
| ASYCUDA | ASYCUDA World | 90+ countries listed | ... | ... | ... | ... | ... | |
| GCC | GCC Common Form | SA,AE,KW,QA,BH,OM | ... | وصف البضائع | Goods Description | ... | Y | |

### Sheet 5: All 240 Countries — Summary (국가별 1행 요약)
**각 나라가 상품에 대해 몇 개 필드를 받는지, 어떤 시스템을 쓰는지 한눈에 보기:**

| Country | ISO | Region | Customs System | Declaration Form Name | Total Product Fields | Field Names (English, 쉼표 구분) | Source (조사 Phase) |
|---------|-----|--------|---------------|---------------------|---------------------|--------------------------------|-------------------|
| US | US | North America | CBP ACE | CBP Form 7501 | 8 | Description, HTS Code, Quantity, Value, Country of Origin, ... | Phase 2 |
| CN | CN | East Asia | 单一窗口 | 海关进口报关单 | 12 | 品名, 材质, 成分, 数量, 价格, 原产国, ... | Phase 2 |
| KR | KR | East Asia | UNI-PASS | 수입신고서 | 10 | 품명, 규격, 수량, 가격, 원산지, ... | Phase 2 |
| GH | GH | West Africa | ASYCUDA | ASYCUDA Form | 7 | ... | Phase 4 (ASYCUDA) |
| ... (240행) |

### Sheet 6: Extra Fields (세관만의 독특한 필드)
POTAL 9-field에 해당하지 않지만 세관이 별도로 받는 필드들:

| Field Name (English) | 받는 나라 수 | 대표 나라들 | 필드 설명 |
|---------------------|------------|----------|---------|
| HS/Tariff Code | ~240 | 거의 전부 | 관세분류번호 |
| Quantity & Units | ~240 | 거의 전부 | 수량 + 단위 |
| Brand/Trademark | ~50 | ... | 상표 |
| End Use / Purpose | ~30 | ... | 사용 용도 |
| Model Number | ~20 | ... | 모델 번호 |
| ... | ... | ... | ... |

---

## Phase 6: 조사 결과 요약 통계

조사 완료 후, 다음 통계만 정리 (매핑은 하지 않음):

1. **240개국 세관이 상품에 대해 받는 평균 필드 수는?**
   - 가장 많이 받는 나라 vs 가장 적게 받는 나라

2. **거의 모든 나라가 공통으로 받는 필드는?**
   - 240개국 중 90% 이상이 받는 필드 목록

3. **일부 나라만 받는 독특한 필드는?**
   - 특정 나라/지역에서만 요구하는 필드

4. **하나의 칸에 여러 정보를 합쳐서 받는 경우**
   - 나라별 "합쳐진 필드" 목록

5. **ASYCUDA 90개국의 상품 필드 구조**
   - ASYCUDA가 표준화한 필드 목록

6. **언어 그룹별 필드명 패턴**
   - 영어권/중국어권/스페인어권/프랑스어권/아랍어권 등 그룹별 공통 필드명

---

## 실행 명령

```
위 Phase 1~6을 순서대로 실행하세요.

⚠️ 중요: POTAL 9-field 매핑은 절대 하지 마세요.
각 나라 세관이 실제로 어떤 필드를 요구하는지 있는 그대로만 수집합니다.
매핑은 이 조사 결과를 확인한 후 별도로 진행합니다.

조사 방법:
- 웹 검색으로 각 나라 세관의 수입신고서 양식(Import Declaration Form) 조사
- 실제 양식 PDF/이미지를 찾아서 필드명 확인 (이론이 아닌 실제 양식)
- 현지어 원문 필드명 반드시 포함
- 공식 영어 번역이 있으면 반드시 포함
- 각 필드가 "세관이 적으라는 내용이 뭔지" 설명 반드시 포함

산출물:
1. phase1_international_standards.json — 국제 기준 필드 목록
2. phase2_7countries_detail.json — 7개국 상세 (실제 신고서 기준)
3. phase3_43countries.json — 43개국 조사
4. phase4_190countries_groups.json — 190개국 그룹별 조사
5. POTAL_240_Customs_Fields_Raw.xlsx — 최종 엑셀 (6시트, 매핑 없이 순수 조사 결과만)

저장 위치:
- JSON: /Volumes/soulmaten/POTAL/customs_field_mapping/
- Excel: /Volumes/soulmaten/POTAL/customs_field_mapping/ + portal 복사

핵심 원칙:
1. "각 나라 세관이 수출입 업체에게 상품에 대해 뭘 적어내라고 하는지" 조사
2. 실제 세관 양식 기준 (이론이 아닌 실제)
3. POTAL 매핑 하지 말 것 — 있는 그대로만 기록
4. 현지어 원문 + 공식 영어 번역 + 필드 설명 + 필수여부
```
