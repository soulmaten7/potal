# CW34-S5: China Customs Advance Rulings Evaluation
**작성일**: 2026-04-14 KST
**상태**: 조사 완료, CEO 결정 대기

## 1. 공식 소스

| 소스 | URL | 공개 | 검색 | 다운로드 |
|------|-----|------|------|---------|
| 海关总署 (GACC) 공식 | customs.gov.cn | ⚠️ 부분 공개 | ❌ 공개 검색 DB 미확인 | ❌ |
| 海关政务服务 | online.customs.gov.cn | ⚠️ 서비스 포탈 | ⚠️ 로그인 필요 추정 | ❌ |
| english.customs.gov.cn | 영문 포탈 | ✅ | ⚠️ 법규 공보만 | ❌ |
| 공보 (Gazette) | GACC Announcements | ✅ | ✅ 공보번호로 검색 | PDF |

### 중국 사전 분류 (预归类/预裁定) 특성
- **预归类决定书** (Advance Classification Ruling): 2007년 5월 시행
- **법적 구속력** 있음 (수출입 시 해당 분류 존중)
- 공개 검색 DB가 EBTI/CROSS 수준으로 체계화되어 있지 않음
- 개별 ruling은 GACC Announcement (公告) 형태로 발표되나 일괄 다운로드 불가

## 2. robots.txt
- `customs.gov.cn/robots.txt` → **응답 없음** (타임아웃 또는 차단)
- 중국 정부 사이트는 해외 IP에서 접근 제한 가능

## 3. 법적/기술적 위험

| 위험 | 수준 | 상세 |
|------|------|------|
| IP 차단 | **높음** | 중국 정부 사이트는 VPN/해외 IP 접근 불안정 |
| robots.txt 미확인 | **높음** | 응답 없음 → 스크레이핑 합법성 불확실 |
| 인코딩 | 중간 | GB2312/GB18030 (Silver layer에 이미 대비) |
| 데이터 양 | **낮음** | 공개된 ruling 수가 미확인 — EBTI 231K/CROSS 39K 대비 소규모 추정 |
| 번역 | 중간 | 中文 전용, 기계번역 필요 (분류 오류 위험) |
| 저작권 | ⚠️ | 중국 정부 공문서 — 자국내 재사용 가능하나 해외 SaaS 사용은 불확실 |

## 4. 대체 상용 소스

| 소스 | 형식 | 가격 | 비고 |
|------|------|------|------|
| Findlaw.cn (法律门户) | 웹검색 | 무료 검색, 유료 상세 | 중국 법률 DB, ruling 포함 가능 |
| 中国电子口岸 (chinaport.gov.cn) | 전자통관 포탈 | 기업 계정 필요 | 실무 데이터, 해외 접근 제한 |
| WCO Trade Tools Origin | €250/년 | EU/US 위주, CN 커버리지 제한 |

## 5. 예상 row 수
- 공개된 ruling 수: **미확정** (연간 수천건 추정이나 일괄 다운로드 경로 없음)
- customs_rulings 현재 CN 데이터: **0 rows**
- 실질적 수집 가능: **매우 낮음** (공개 DB 없음 + 해외 접근 제한)

## 6. 권장 결정

| 옵션 | 추천도 | 이유 |
|------|--------|------|
| **(c) CN 데이터 없이 진행 + warning** | **★★★** | 공개 DB 미존재, 해외 접근 제한, 법적 위험. engine에 "CN classification data not available" warning 표시 |
| (b) 상용 DB 구매 | ★ | Findlaw.cn 등 검토 가능하나 ROI 불확실 |
| (a) 스크레이핑 | ❌ | robots.txt 미확인 + IP 차단 + 법적 위험 → 실행 불가 |

**CEO 결정 요청**: 옵션 (c) 확인. CN 향 쿼리에 "Classification based on general tariff schedule. No advance rulings available for China." warning 추가.
