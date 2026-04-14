# Data Copyright Checklist
**작성일**: 2026-04-14 KST
**스프린트**: CW34-S5

## 소스별 저작권/라이선스 체크리스트

| # | Source | Jurisdiction | License | Derivative OK | Commercial OK | Attribution | POTAL 사용 가능 | 비고 |
|---|--------|-------------|---------|-------------|-------------|-------------|---------------|------|
| 1 | **WCO Explanatory Notes** | International (WCO) | © WCO, 유료 구독 | ❌ 미확인 | ❌ 미확인 | 필요 | ⚠️ 법적 확인 필요 | €450/년 디지털, derivative work 불확실 |
| 2 | **US CBP CROSS Rulings** | USA | Public domain (US gov work) | ✅ | ✅ | 불필요 | ✅ 이미 사용중 | 645K 중 343K rows |
| 3 | **US CBP Informed Compliance** | USA | Public domain | ✅ | ✅ | 불필요 | ✅ | heading별 분류 가이드 PDF |
| 4 | **EU EBTI Rulings** | EU | EU re-use policy | ✅ | ✅ | 출처 표기 권장 | ✅ 이미 사용중 | 645K 중 231K rows |
| 5 | **EU CN Explanatory Notes** | EU | EU public access | ✅ | ✅ | 출처 표기 | ✅ | EUR-Lex 경유 |
| 6 | **China GACC 预归类** | China | 정부 공문서 | ⚠️ | ⚠️ | 미명시 | ❌ 접근 불가 | robots.txt 미응답, IP 차단 가능 |
| 7 | **Japan 事前教示** | Japan | CC-BY 4.0 원칙 | ✅ | ✅ | 출처 표기 필수 | ✅ (CW36+ 보류) | robots.txt 완전 공개 |
| 8 | **KR 관세청 품목분류사례** | Korea | 공공데이터 | ✅ | ✅ | 출처 표기 | ✅ (미수집) | customs.go.kr |
| 9 | **MacMap MFN Rates** | ITC/UNCTAD | Public access | ✅ | ✅ | 출처 표기 | ✅ 이미 사용중 | macmap.org |
| 10 | **OFAC SDN List** | USA | Public domain | ✅ | ✅ | 불필요 | ✅ 이미 사용중 | 47,926 rows |

## robots.txt 확인 결과

| 도메인 | robots.txt | 크롤링 허용 |
|--------|-----------|------------|
| customs.gov.cn | **응답 없음** (타임아웃) | ❌ 불확실 |
| customs.go.jp | `Disallow:` (비어있음) | ✅ 전체 허용 |
| wcoomdpublications.org | 미확인 (유료 상품이라 무관) | N/A |
| cbp.gov | Public domain | ✅ |
| ec.europa.eu | EU re-use | ✅ |

## 크롤링 에티켓 기준

POTAL이 외부 사이트 크롤링 시 준수 사항:
- User-Agent: `POTAL-research-bot/1.0 (+https://www.potal.app; contact@potal.app)`
- Rate: 1 request / 2 seconds
- Cache: 동일 URL 재요청 금지 (local cache)
- 429/503: Exponential backoff
- 대용량: 야간 시간대 (UTC 00:00-06:00) 선호
