# Phase 4 초정밀 검증 — 프로덕션 안정성 & 보안
> Phase 3 완료 후 Claude Code 터미널에 복붙

```
CLAUDE.md 읽고 POTAL 초정밀 검증 Phase 4를 시작해줘. 프로덕션 환경에서 실제 트래픽을 받을 준비가 되었는지, 보안에 구멍은 없는지 최종 검증이야.

=== 검증 4-1: 부하 테스트 (Performance) ===
potal.app 프로덕션 API에 점진적으로 부하를 올려서 한계를 확인해.
(실제 서비스에 영향 없도록 주의 — 너무 공격적으로 하지 말 것)

■ /api/v1/calculate 부하 테스트:
- 연속 10회 호출 → 평균 응답시간, 최대 응답시간
- 연속 50회 호출 (1초 간격) → 에러율, 평균 응답시간
- 연속 100회 호출 (0.5초 간격) → Rate limiting 동작? 429 응답 시점?

■ /api/v1/classify 부하 테스트:
- 연속 10회 호출 → 평균 응답시간
- 연속 50회 호출 → LLM 폴백 시 응답시간 변화?

■ /api/v1/countries 부하 테스트:
- 연속 100회 호출 → 캐시 동작 확인 (응답시간 일정?)

결과 정리:
| 엔드포인트 | 10회 avg | 50회 avg | 100회 avg | 에러율 | Rate Limit 시점 |
기준: 평균 < 500ms, P99 < 2s, 에러율 < 1%

■ 동시성 테스트:
- 같은 요청 5개 동시 발사 → 전부 정상 응답?
- 서로 다른 요청 5개 동시 발사 → 전부 정상 응답?
- DB 커넥션 풀 문제 없는지 확인

=== 검증 4-2: 보안 테스트 (Security) ===

■ 인증 & 인가:
- API key 없이 /calculate → 401 Unauthorized 확인
- 만료된 API key → 적절한 에러?
- 다른 사용자의 API key로 데이터 접근 시도 → 차단?
- Admin 엔드포인트 (/admin/*) CRON_SECRET 없이 접근 → 401?

■ SQL Injection:
- productName: "t-shirt'; DROP TABLE countries;--" → 에러 처리? DB 영향 없음?
- origin: "US' OR '1'='1" → 필터링?
- hsCode: "6109.10; SELECT * FROM auth.users" → 차단?

■ XSS (Cross-Site Scripting):
- productName: "<script>alert('xss')</script>" → HTML 이스케이프?
- productName: "<img src=x onerror=alert(1)>" → 필터링?
- API 응답에 입력값이 그대로 반환되는지 확인 → sanitization

■ CORS 정책:
- 허용된 도메인에서 API 호출 → Access-Control-Allow-Origin 확인
- 허용되지 않은 도메인에서 → 차단?

■ Rate Limiting:
- Free 플랜 (100건/월) 한도 초과 시 → 적절한 에러 메시지?
- Basic 플랜 (2,000건/월) 한도 → overage 로직 동작?
- X-RateLimit-* 헤더 존재?

■ 환경변수 보안:
- SUPABASE_SERVICE_ROLE_KEY가 프론트엔드에 노출되지 않는지
- API 응답에 민감 정보(API key, DB password 등) 포함되지 않는지
- .env 파일이 git에 포함되지 않았는지 (.gitignore 확인)

■ RLS (Row Level Security):
- Supabase RLS 정책이 활성화되어 있는지 확인
- 일반 사용자가 다른 사용자 데이터에 접근 불가한지

=== 검증 4-3: Edge Case 테스트 ===

■ 입력 데이터 극한값:
- 가격: $0, $0.001, $0.01, $999,999, $-1, $NaN
- 상품명: "" (빈값), " " (공백만), null, undefined
- 국가코드: "us" (소문자), "USA" (3글자), "U" (1글자), "123" (숫자)
- HS코드: "0000.00", "9999.99", "610910" (점 없이), "6109.10.0000" (10자리)
- 수량: 0, -1, 0.5, 999999, NaN
- 무게: 0kg, -1kg, 999999kg

■ 특수 국가/경로:
- 존재하지 않는 국가 "ZZ" → "XX"
- 같은 국가 CN→CN (국내 배송)
- 제재국가 KP(북한), IR(이란), SY(시리아) → 적절한 경고?
- 미승인 지역 TW(대만)→CN(중국) → 민감한 경우 처리?
- 소국가 VA(바티칸), MC(모나코), SM(산마리노) → EU 규정 적용?

■ 동일 요청 캐시:
- 같은 요청 10번 연속 → 응답시간이 줄어드는지 (캐시 동작)
- 같은 상품 분류 10번 → DB 캐시에서 즉시 반환?
- 캐시된 결과의 정확도 (첫 응답과 동일?)

■ 동시 동일 요청:
- 같은 요청 5개 동시 발사 → race condition 없는지
- DB에 중복 기록 생기지 않는지

■ 타임아웃:
- LLM 분류가 느릴 때 타임아웃 설정 있는지
- 정부 API 다운 시 폴백 동작하는지
- Supabase 느릴 때 적절한 에러 응답?

=== 검증 4-4: 프론트엔드 & UI 테스트 ===
potal.app 프로덕션 사이트 접속해서 확인:

■ 핵심 페이지 접근성:
- https://www.potal.app → 200 OK? 로딩 시간?
- /pricing → 4개 플랜 표시? Monthly/Annual 전환?
- /dashboard → 로그인 리다이렉트?
- /docs/api → API 문서 로딩?
- /login → 로그인 폼?
- /legal/terms → ToS 페이지?
- /legal/privacy → Privacy 페이지?
- /faq → FAQ 13개 항목?

■ 보안 헤더:
- X-Frame-Options (clickjacking 방지)
- X-Content-Type-Options (MIME 스니핑 방지)
- Strict-Transport-Security (HTTPS 강제)
- Content-Security-Policy

■ SSL/HTTPS:
- HTTP → HTTPS 리다이렉트 작동?
- SSL 인증서 유효기간?

■ robots.txt & sitemap:
- /robots.txt 존재?
- /sitemap.xml 존재? 주요 페이지 포함?

=== 검증 4-5: 최종 통합 시나리오 테스트 ===
실제 고객이 POTAL을 사용하는 전체 플로우를 시뮬레이션:

■ 시나리오 1: 이커머스 셀러
"나는 US Shopify 셀러. CN에서 cotton t-shirt를 수입해서 US 고객에게 팔려고 해."
1. /classify로 HS Code 분류 → 6109.10 확인
2. /calculate로 총 비용 계산 → duty + tax + fees
3. 같은 상품 VN에서 수입하면? → FTA 절약액 비교
4. /validate로 HS Code 검증
5. /screen으로 제재 스크리닝
→ 전체 플로우가 매끄럽게 연결되는지?

■ 시나리오 2: 글로벌 배송
"나는 DE 셀러. 같은 상품을 US/UK/JP/KR/AU 5개국에 동시 발송."
1. /calculate를 5번 호출 (같은 상품, 다른 destination)
2. 각 국가별 duty + tax + total 비교 표
3. de minimis 적용되는 국가는?
4. IOSS 필요한 국가는?
→ 5개국 결과가 전부 정확하고 일관성 있는지?

■ 시나리오 3: 대량 처리
"나는 Enterprise 고객. 1000개 상품을 한번에 분류하고 싶어."
1. /classify/batch로 100개 상품 분류 (시간 측정)
2. /export로 CSV 내보내기
3. 결과 일관성 확인 (같은 상품이 매번 같은 HS Code?)

=== 최종 보고 형식 ===

## 부하 테스트: [판정]
| 엔드포인트 | 10회 | 50회 | 100회 | 에러율 | 판정 |

## 보안 테스트: [N]/8 PASS
| 테스트 | 결과 | 판정 |
(SQL Injection / XSS / CORS / Auth / RateLimit / 환경변수 / RLS / 헤더)

## Edge Case: [N]/5 카테고리 PASS
| 카테고리 | 테스트수 | 통과 | 판정 |
(극한값 / 특수국가 / 캐시 / 동시성 / 타임아웃)

## 프론트엔드: [N]/4 PASS
| 카테고리 | 결과 | 판정 |
(페이지접근 / 보안헤더 / SSL / SEO)

## 통합 시나리오: [N]/3 PASS
| 시나리오 | 결과 | 판정 |

## Phase 4 총 판정
- 부하: PASS/FAIL
- 보안: __/8
- Edge Case: __/5
- 프론트엔드: __/4
- 통합 시나리오: __/3
- 전체: __/20+

FAIL 항목은 즉시 수정 또는 수정 계획 수립.
보안 FAIL은 P0 긴급 수정.
전체 16/20 이상이면 Phase 4 PASS.

=== Phase 1~4 전체 종합 ===
Phase 1~4 전부 완료 후 최종 종합 리포트 작성:

| Phase | 총점 | 판정 |
|-------|------|------|
| Phase 1 Core Engine | __/65 | |
| Phase 2 API & Data | __/50 | |
| Phase 3 경쟁사 & 기능 | __/41 | |
| Phase 4 프로덕션 | __/20 | |
| **전체** | **__/176** | |

전체 150/176 이상 = Beta 런칭 준비 완료
전체 130~149 = 수정 후 재검증 필요
전체 130 미만 = 핵심 문제 해결 필요

FAIL 항목 전체 리스트 + 수정 우선순위(P0/P1/P2) 제시.
결과를 docs/sessions/SESSION_CW13_ULTRA_VERIFY_REPORT.md로 저장.
5개 문서 업데이트.
```
