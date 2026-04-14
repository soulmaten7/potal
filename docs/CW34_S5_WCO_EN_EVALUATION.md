# CW34-S5: WCO Explanatory Notes Evaluation
**작성일**: 2026-04-14 KST
**상태**: 조사 완료, CEO 결정 대기

## 1. 가격/라이선스

### WCO 공식 채널 (2가지)

| 채널 | 제품 | 가격 | 형식 | 비고 |
|------|------|------|------|------|
| WCO Bookshop | Explanatory Notes 2022 (5권 바인더) | **€925** | 인쇄본 (5 volumes) | 2022-2027 주기 업데이트 포함 |
| WCO Trade Tools | HS 구독 (디지털) | **€450/년** (1 user) | 온라인 웹앱 | EN + Classification Opinions + 비교 도구 |
| WCO Trade Tools | Business Pack (HS + Origin) | **€600/년** (1 user) | 온라인 | + FTA 원산지 규정 200개+ |
| WCO Trade Tools | Full Pack (HS + Origin + Valuation) | **€650/년** (1 user) | 온라인 | + 관세평가 |

Multi-user: 5/10/15 user 패키지 별도 가격 (확인 필요).

### API / 코드화 라이선스
- **API 없음** — WCO Trade Tools는 웹 인터페이스만 제공
- **Derivative work 허용 여부**: 명시되지 않음. Terms & Conditions 별도 확인 필요
- **LLM 학습**: 미언급 (사실상 금지로 간주)
- **SaaS 재판매**: 미언급 (별도 상용 라이선스 필요 추정)

### 법적 위험
- WCO EN은 **저작물** (copyright WCO). Decision tree로 "코드화"하는 것은 derivative work 가능성
- 공식 문의 또는 국제저작권 변호사 상담 필요 (예상 비용 $200-500)
- US CBP Informed Compliance, EU CN Explanatory Notes는 **public domain / re-use 허용**

## 2. 대체 소스 (무료/공개)

| 소스 | 비용 | 언어 | 커버리지 | 법적 | 비고 |
|------|------|------|---------|------|------|
| US CBP Informed Compliance Publications | 무료 | EN | 미국 수입 기준, heading별 가이드 | Public domain (US gov) | cbp.gov에서 PDF 다운로드 |
| EU CN Explanatory Notes (TARIC) | 무료 | EN/FR/DE | EU 전체, heading별 분류 기준 | EU re-use 정책 허용 | EUR-Lex에서 접근 |
| KR 관세청 품목분류사례 | 무료 | KO | 한국 수입 기준, 사례 중심 | 공공데이터 | customs.go.kr |
| JP 税関 事前教示 | 무료 | JP | 일본 수입, PDF 사례 | CC-BY 4.0 (일본 정부) | customs.go.jp |

## 3. ROI 추정

| 시나리오 | 투자 | 정확도 향상 | 비용/heading |
|---------|------|-----------|-------------|
| WCO EN 구매 (€450/년 디지털) | ~$490/년 | +5-10pp (6자리 분류 정확도) | ~$0.49/heading (97 chapters × 5,000 headings) |
| 공개 소스 decision tree 자동 생성 | $0 (시간 투자) | +3-5pp | 무료 |
| 현 상태 유지 (CW34-S1 수동 decision tree) | $0 | 0 (현재 heading 4202만 구현) | — |

**현재 v3 classifier 정확도**: CW34-S1에서 wallet→420231, handbag→420221 등 heading 4202에서 8/8 정확 분류 달성 (수동 decision tree).

## 4. 권장 결정

| 옵션 | 추천도 | 이유 |
|------|--------|------|
| **(b) 공개 소스로 확장** | **★★★** | US CBP + EU CN 공개 자료로 decision tree 자동 생성 파이프라인 구축. 비용 $0, 법적 위험 0 |
| (a) WCO EN 구매 | ★★ | €450/년은 저렴하지만 API 없어 수동 입력 필요. Derivative work 법적 불확실성 |
| (c) 보류 | ★ | 현재 heading 4202만 decision tree → 다른 heading 미지원 |

**CEO 결정 요청**: 옵션 (b) 진행 여부. CW35에서 US CBP Informed Compliance PDF 50개+ 자동 파싱 → heading별 decision tree 생성 파이프라인 구축.
