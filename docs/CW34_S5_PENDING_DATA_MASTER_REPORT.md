# CW34-S5: Pending Data Acquisition — Master Report
**작성일**: 2026-04-14 KST
**상태**: 조사 완료, **CEO 결정 대기**

---

## Executive Summary

3개 데이터 소스의 획득 가능성을 조사했습니다. 코드 수정 0건, 스크레이핑 0건.

| # | 소스 | 획득 가능성 | 비용 | 정확도 향상 | 권장 |
|---|------|-----------|------|-----------|------|
| 1 | WCO Explanatory Notes | ⚠️ 가능하지만 법적 불확실 | €450/년 (디지털) | +5-10pp | **(b) 공개 소스로 대체** |
| 2 | China 海关总署 Advance Rulings | ❌ 접근 불가 | N/A | 측정 불가 | **(c) 보류 + warning** |
| 3 | Japan 税関 事前教示 | ✅ 법적 안전 | $0 (시간만) | +1-2pp | **(c) CW36+ 보류** |

---

## 1. WCO Explanatory Notes

**조사 결과**: 디지털 구독 €450/년 (WCO Trade Tools). API 없음, derivative work 허용 미확인.

**권장**: **(b) 공개 소스 (US CBP + EU CN) 로 decision tree 자동 생성**
- US CBP Informed Compliance Publications: heading별 분류 가이드, public domain
- EU CN Explanatory Notes: EUR-Lex 경유, re-use 허용
- 비용 $0, 법적 위험 0
- 예상 정확도 향상: +3-5pp (WCO EN의 80% 커버리지)

**상세**: `docs/CW34_S5_WCO_EN_EVALUATION.md`

---

## 2. China 海关总署

**조사 결과**: 공개 검색 DB 미존재, robots.txt 무응답, 해외 IP 접근 제한.

**권장**: **(c) CN 데이터 없이 진행**
- engine에 `"Classification based on general tariff schedule. No advance rulings available for China."` warning 추가
- 향후 중국 현지 파트너 확보 시 재평가

**상세**: `docs/CW34_S5_CN_RULINGS_EVALUATION.md`

---

## 3. Japan 税関 事前教示

**조사 결과**: robots.txt 완전 공개, CC-BY 4.0, PDF only (연도별). 기존 customs_rulings에 JP 0건.

**권장**: **(c) CW36+ 보류**
- JP 향 트래픽 현재 ~5%. OCR 작업 대비 ROI 낮음
- 관세율 자체는 gov_tariff_schedules 16K rows로 이미 커버
- 법적으로 안전하므로 트래픽 증가 시 언제든 수집 가능

**상세**: `docs/CW34_S5_JP_RULINGS_EVALUATION.md`

---

## CEO 결정 요청

### 결정 1: WCO EN 대체 전략
- [ ] (a) WCO EN 디지털 구독 €450/년 구매
- [x] (b) **공개 소스 (US CBP + EU CN) 로 decision tree 자동 생성** ← 권장
- [ ] (c) 보류

### 결정 2: China 데이터
- [ ] (a) 상용 DB 구매 (Findlaw.cn 등)
- [ ] (b) 중국 현지 파트너 경유 수집
- [x] (c) **보류 + engine warning** ← 권장

### 결정 3: Japan 데이터
- [ ] (a) CW36에서 PDF 수집 + OCR
- [x] (c) **보류 (트래픽 증가 시 재평가)** ← 권장

---

## CW35 Sprint 구성 (결정 반영)

결정 (b)+(c)+(c) 기준:

| Sprint | 내용 | 예상 소요 |
|--------|------|---------|
| CW35-S2 | US CBP Informed Compliance PDF 파싱 → heading별 decision tree 자동 생성 | 8-12시간 |
| CW35-S3 | EU CN Explanatory Notes 파싱 → EU heading decision tree | 6-8시간 |
| CW35-S4 | Decision tree → v3 classifier 통합 (heading 4202 패턴 일반화) | 4-6시간 |

---

## 저작권 체크리스트

**상세**: `docs/DATA_COPYRIGHT_CHECKLIST.md`

| 소스 | 저작권 | POTAL 사용 |
|------|--------|-----------|
| US CBP (CROSS + Informed Compliance) | Public domain | ✅ |
| EU EBTI + CN Explanatory Notes | EU re-use | ✅ |
| WCO EN | © WCO, derivative 미확인 | ⚠️ |
| China GACC | 접근 불가 | ❌ |
| Japan 税関 | CC-BY 4.0 | ✅ (보류) |

---

**CW34-S5 Pending Data Acquisition Sprint 완료.**
코드 수정 0건, 스크레이핑 0건, 5개 조사 문서 산출.
