# CW34-S5: Japan Customs Advance Rulings Evaluation
**작성일**: 2026-04-14 KST
**상태**: 조사 완료, CEO 결정 대기

## 1. 공식 소스

| 소스 | URL | 공개 | 형식 | 비고 |
|------|-----|------|------|------|
| 事前教示回答 (品目分類) | customs.go.jp/english/advance/classification.htm | ✅ | PDF | 영문 설명 페이지 |
| 事前教示回答 (関税評価) | customs.go.jp/zeikan/seido/kanzeihyouka/kaitoujirei.htm | ✅ | PDF | 연도별 PDF 목록 (2012~2024) |
| 事前教示制度 안내 | customs.go.jp/zeikan/seido/ | ✅ | HTML | 제도 안내 |

### 데이터 특성
- **형식**: PDF only (일괄 다운로드 불가, 연도별 PDF 링크 목록)
- **언어**: 일본어 (日本語) 전용
- **검색**: HS 코드 검색 불가 — 연도별/카테고리별 브라우징만
- **API**: 없음
- **유효기간**: 발행일로부터 3년

## 2. robots.txt
```
User-agent: *
Disallow:
Sitemap: https://www.customs.go.jp/sitemap_00.xml
```
**완전 공개** — `Disallow:` 비어있으므로 전체 사이트 크롤링 허용.

## 3. 기존 customs_rulings의 JP 데이터

CW34-S2.5 실측 + CW34-S3 파이프라인 결과:
- **unified_rulings.jsonl**: JP ruling **0건** (EBTI=EU only, CROSS=US only)
- **customs_rulings (Supabase)**: jurisdiction='JP' **0 rows**
- **gov_tariff_schedules**: JP 9-digit HS 16,076 rows (관세율 스케줄, ruling 아님)

## 4. 수집 가능성

| 항목 | 평가 |
|------|------|
| **법적** | ✅ robots.txt 완전 공개, 일본 정부 저작물 CC-BY 4.0 원칙 |
| **기술적** | ⚠️ PDF only → OCR + 일본어 파싱 필요 (Tesseract + JP 모델) |
| **데이터 양** | ⚠️ 연간 수백건 추정, 2012~2024 = ~3,000-5,000건 |
| **비용** | 중간 — OCR 처리 시간 + JP 키워드 사전 확장 |
| **정확도 향상** | 낮음 — JP 향 수입만 해당, 전체 쿼리의 ~5% |

## 5. 구현 계획 초안 (조사만)

```
Phase A: PDF 크롤링 → Bronze
  - customs.go.jp/zeikan/seido/kanzeihyouka/ 연도별 PDF URL 수집
  - wget + rate limit (1 req/2 sec)
  - ~50-100 PDF files

Phase B: OCR → Silver
  - Tesseract + jpn_vert.traineddata
  - PDF → text extraction (대부분 디지털 PDF, OCR 불필요 가능)
  - 일본어 → HS 코드 + 상품명 + 분류 근거 추출

Phase C: 10 Field + JP keyword dict → Gold
  - JP.yaml country_standards (이미 생성됨)
  - 일본어 키워드 사전 (MULTILANG_MATERIALS 에 이미 일부 포함)
  - HS 9자리 정규화

Phase D: Platinum swap
  - 기존 645K + JP ~3K-5K 추가
```

**예상 소요**: 8-16시간 (PDF 파싱 자동화 포함)
**예상 증분**: ~3,000-5,000 rows

## 6. 권장 결정

| 옵션 | 추천도 | 이유 |
|------|--------|------|
| **(c) 보류 (CW36+)** | **★★★** | JP 향 쿼리 비율 낮음 (~5%), OCR 작업 대비 ROI 낮음. 현재 gov_tariff_schedules 16K rows로 관세율은 이미 커버 |
| (a) 추가 수집 | ★★ | 법적으로 안전하지만 ROI 대비 시간 투자 큼 |
| (b) 현재 충분 | ★ | JP ruling 0건은 정확도 갭이지만, 관세율 자체는 이미 있음 |

**CEO 결정 요청**: 옵션 (c) 보류. JP 향 트래픽 증가 시 CW36+에서 수집.
