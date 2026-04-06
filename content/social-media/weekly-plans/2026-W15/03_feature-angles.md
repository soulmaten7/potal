# W15 기능 딥다이브 소재
> 생성일: 2026-04-05 (sunday-content-prep 자동 생성)
> 업데이트: 2026-04-06 16:45 KST — CW22-S3: 10-field 파이프라인 + Dashboard CountrySelect 반영
> 데이터 소스: app/features/features-guides.ts (140개 기능)

---

## 이번 주 메인 기능: HS Code Classification (F001)

### 앵글
"경쟁사는 AI GPU 클라우드에 투자한다. POTAL은 595개 GRI 규칙으로 $0에 분류한다. 정확도는 더 높다."

### 상세 데이터
- **방식**: v3.3 GRI Pipeline — 595개 codified rules, 21 Sections
- **비용**: $0/건 (AI 호출 없음, DB 조회 + 룰 매칭)
- **경쟁사**: Avalara AI 분류 건당 $0.02~0.05, Zonos CoreWeave GPU 클라우드 투자
- **입력 필드**: 10-field (productName, description, material, category, processing, composition, weightSpec, price, origin, destination) — Homepage + Dashboard 동일 (CW22-S3 업데이트)
- **정확도**: 필드 추가 시 단계적 향상 — productName만(+18%) → +material(+45%) → +category(+33%) → +description(+4%) = ~100%. Dashboard에서 Confidence N/10 카운터 표시 (8+: 초록, 5+: 노랑, <5: 회색)
- **Dashboard UI**: 240국 CountrySelect 드롭다운 (검색 + Popular 20국 + Show All), 인증 체크, 에러 핸들링 개선 (CW22-S3)

### API 예시
```bash
curl -X POST https://potal.app/api/v1/classify \
  -H "X-API-Key: pk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{"productName": "Men'\''s cotton t-shirt", "material": "cotton", "category": "apparel"}'
```

### 응답 예시
```json
{
  "hsCode": "6109.10",
  "description": "T-shirts, singlets and other vests, of cotton, knitted or crocheted",
  "confidence": 0.95,
  "alternatives": [{"hsCode": "6109.90", "confidence": 0.82}]
}
```

---

## 보조 기능 1: Total Landed Cost Calculator (F002)

### 앵글
"$59.99 이어버드가 미국 도착하면 $88.75. 그 차이 $28.76이 정확히 어디서 오는지 0.01달러까지 분해한다."

### 상세 데이터
- Section 301 List 1: +25% (CN origin)
- CBP MPF: $2.00 (informal entry)
- Insurance: 1.5% of CIF
- Sales Tax: 7.0%
- 중국 CBEC tax, 멕시코 IEPS, 브라질 cascading tax, 인도 IGST 등 12개국 특수 세금 지원

---

## 보조 기능 2: Import Restriction Check (F005)

### 앵글
"HS Code 분류만으로 끝이 아니다. 그 상품이 목적지 국가에서 금지/제한인지까지 한 번에."

### 상세 데이터
- 금지 품목, 필수 허가, 주의 품목, 운송사 제한 4가지 체크
- 240개국 지원
- API 1회 호출로 compliance 전체 확인

---

## 보조 기능 3: FTA Lookup (F004)

### 앵글
"FTA 적용하면 관세가 0%가 되기도 한다. 문제는 어떤 FTA가 적용되는지 아는 것. POTAL이 자동으로 찾아준다."

### 상세 데이터
- 원산지-목적지 조합에 따른 FTA 자동 매칭
- 절감액 계산 + 대안 FTA 목록 제공
- 한-미 FTA, EU-일본 EPA, RCEP 등 주요 협정 커버

---

## 아직 콘텐츠로 안 다룬 기능 후보 (향후 주간용)

| 기능 | slug | 콘텐츠 포텐셜 |
|------|------|-------------|
| Image Classification (F006) | image-classification | "상품 사진만 올리면 HS Code 자동 분류" |
| Batch Classification (F007) | batch-classification | "CSV 업로드 → 수백 개 상품 일괄 분류" |
| Multi-Currency Support (F010) | multi-currency-support | "51개 통화 실시간 환율 자동 적용" |
| Denied Party Screening (F013) | denied-party-screening | "거래 상대방이 제재 대상인지 1초 확인" |
| Trade Remedy Database (F015) | trade-remedy-database | "반덤핑/상계관세 자동 반영" |
| Confidence Score (F003) | confidence-score | "AI가 '확실하지 않다'고 말해주는 시스템" |
