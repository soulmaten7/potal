# SESSION 37 REPORT (Cowork 세션 3 — 전반+후반)
> 날짜: 2026-03-10
> 유형: Cowork (Claude Desktop)
> 주제: Enterprise 요금제 확정 → Paddle Live 전환 → Overage 빌링 구현 → B2C 완전 정리

---

## 작업 요약

### 1. Enterprise 요금제 + Annual/Overage 확정
| 플랜 | Monthly | Annual (20% off) | 할당량 | 초과 요금 |
|------|---------|-----------------|--------|----------|
| Free | $0 | $0 | 100건/월 | - |
| Basic | $20 | $16/mo ($192/yr) | 2,000건/월 | $0.015/건 |
| Pro | $80 | $64/mo ($768/yr) | 10,000건/월 | $0.012/건 |
| Enterprise | $300 | $240/mo ($2,880/yr) | 50,000건/월 | $0.01/건 |

- Volume Commit: 100K+/월 → $0.008/건
- Paddle 수수료: 5% + $0.50/건
- 마진 분석: Basic 82.5%, Pro 81.9%, Enterprise 78.2%, Annual Enterprise(worst) 74.1%
- BEP: 4 Basic monthly customers ($51.50 고정비)

### 2. Paddle Billing 프로덕션 배포
- **Sandbox 6개 Price 생성**: Basic/Pro/Enterprise × Monthly/Annual
- **코드 업데이트** (세션 36에서 작성, 세션 37에서 배포):
  - `app/lib/billing/paddle.ts` — PLAN_CONFIG (priceAnnual, overageRate 추가)
  - `app/pricing/page.tsx` — Annual 토글, 초과요금 안내, FAQ
  - `app/api/billing/checkout/route.ts` — billingCycle 파라미터
  - `app/dashboard/DashboardContent.tsx` — 플랜명 수정
- **빌드 + 배포**: npm run build 통과 → git push → Vercel 프로덕션 배포 성공

### 3. Vercel 환경변수 관리 (REST API)
- **Vercel API Token 발급**: Full Account, Never expires
- **Paddle 9개 추가**: API 자동화 (POST /v10/projects/{id}/env)
- **Stripe 3개 삭제**: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_GROWTH
- **AI_CLASSIFIER 확인**: claude-classifier.ts에서 사용중 → KEEP
- **Redeploy 트리거**: API로 자동 재배포
- 최종 환경변수: 30 → 36개

### 4. B2C 잔재 백업
- `archive/vercel_env_backup_2026-03-10.txt` — RapidAPI, Affiliate, Stripe 키 백업

### 5. 문서 전면 업데이트 (5단계)
- session-context.md, .cursorrules, CLAUDE.md, CHANGELOG.md 업데이트
- POTAL_B2B_Checklist.xlsx — 8개 태스크 완료 처리, 6개 신규 추가
- NEXT_SESSION_START.md — 전면 재작성
- 교차검증 통과 (모든 수치 일치)

---

## 변경 파일 목록

### 이번 세션(37)에서 직접 변경
| 파일 | 유형 | 내용 |
|------|------|------|
| Vercel 환경변수 (원격) | 추가/삭제 | Paddle 9개 추가, Stripe 3개 삭제 |
| archive/vercel_env_backup_2026-03-10.txt | 신규 | B2C+Stripe 키 백업 |
| session-context.md | 수정 | 세션 37 전체 반영 |
| .cursorrules | 수정 | Paddle 전환 완료 반영 |
| CLAUDE.md | 수정 | 요금제, 인증정보, WDC 진행률 |
| docs/CHANGELOG.md | 수정 | 세션 37 엔트리 추가 |
| docs/NEXT_SESSION_START.md | 재작성 | 전면 재작성 |
| checklists/POTAL_B2B_Checklist.xlsx | 수정 | 8개 완료, 6개 신규 |
| docs/sessions/SESSION_37_REPORT.md | 신규 | 이 문서 |

### 이전 세션(36)에서 작성, 이번 세션에서 배포
| 파일 | 내용 |
|------|------|
| app/lib/billing/paddle.ts | PLAN_CONFIG + Annual/Overage |
| app/pricing/page.tsx | Annual 토글 UI |
| app/api/billing/checkout/route.ts | billingCycle 파라미터 |
| app/dashboard/DashboardContent.tsx | 플랜명 수정 |
| .env.local | Paddle 환경변수 9개 |
| .gitignore | data/itc_macmap/ 등 추가 |

---

## 교차검증 결과

| 항목 | CLAUDE.md | session-context | .cursorrules | CHANGELOG | NEXT_SESSION | 결과 |
|------|:---------:|:---------------:|:------------:|:---------:|:------------:|:----:|
| 요금제 (Monthly) | ✅ | ✅ | ✅ | ✅ | ✅ | 일치 |
| 요금제 (Annual) | ✅ | ✅ | ✅ | ✅ | ✅ | 일치 |
| Overage 요금 | ✅ | ✅ | ✅ | ✅ | ✅ | 일치 |
| Volume Commit | ✅ | ✅ | ✅ | ✅ | ✅ | 일치 |
| Paddle 상태 | ✅ | ✅ | ✅ | ✅ | ✅ | 일치 |
| WDC 1,778/1,899 | ✅ | ✅ | - | - | ✅ | 일치 |
| MIN 92.3M/130M | ✅ | ✅ | ✅ | - | - | 일치 |
| Vercel Token | ✅ | - | - | - | ✅ | 일치 |

**결과: 불일치 0건. 모든 수치 동기화 완료.**

---

---

# Cowork 세션 3 후반

## 작업 요약 (후반)

### 6. 빌드 수정 + B2C 잔재 완전 정리
- `app/lib/native-auth.ts` — @capacitor/core → stub 함수 (isNativePlatform→false)
- LemonSqueezy 완전 삭제: `lemonsqueezy.ts` + npm uninstall
- Capacitor 패키지 7개 npm uninstall
- Vercel B2C 환경변수 15개 삭제 (36→21개)

### 7. i18n 번역 키 업데이트 (6개 언어)
- en/ko/ja/zh/es/de — starter→free, growth→basic+pro, scale→enterprise
- Annual 키 추가, FAQ Stripe→Paddle 전환
- ja.ts: "Stripe" → "インフラ"

### 8. Paddle 결제 버그 3건 수정
- portal: `url` 필드 추가
- checkout: billing_customer_id 재사용 + billingCycle 전달
- DashboardContent: Monthly/Annual 토글 UI + billingCycle state

### 9. Paddle Live 전환 + E2E 테스트
- Live API Key + 6개 Live Price + Webhook 56 events
- Products/Prices/Webhook/Auth 정상 확인

### 10. Overage 빌링 구현
- `app/lib/billing/overage.ts` (NEW) — Paddle One-time Charge API
- `app/api/v1/admin/billing-overage/route.ts` (NEW) — Cron (매월 1일 07:00 UTC)
- `app/lib/api-auth/plan-checker.ts` — 유료 overage 허용
- `app/lib/api-auth/middleware.ts` — X-Plan-Overage 헤더
- `app/api/v1/sellers/usage/route.ts` — 구버전 숫자 수정 + overage 정보
- `vercel.json` — billing-overage cron 추가

### 11. Git Push (3회)
- 1차 (10 files, +280/-1,260): Capacitor stub + lemonsqueezy + i18n
- 2차 (8a6b0a0): Paddle 버그 픽스 + 문서 + .gitignore (secrets masking)
- 3차 (a80737e): Overage 빌링 + plan-checker + middleware + vercel.json

### 12. 문서 전면 업데이트 (2차)
- session-context.md, .cursorrules, CLAUDE.md, CHANGELOG.md 업데이트
- POTAL_B2B_Checklist.xlsx — 8개 태스크 추가 완료 처리
- NEXT_SESSION_START.md — 전면 재작성
- 교차검증 통과

---

## 후반 변경 파일

### 코드 수정 (13개)
| 파일 | 내용 |
|------|------|
| app/lib/native-auth.ts | Capacitor → stub |
| app/lib/billing/lemonsqueezy.ts | 삭제 |
| app/i18n/translations/{en,ko,ja,zh,es,de}.ts | 요금제 키 교체 (6개) |
| app/api/billing/portal/route.ts | url 필드 추가 |
| app/api/billing/checkout/route.ts | billing_customer_id + billingCycle |
| app/dashboard/DashboardContent.tsx | Annual 토글 |

### 신규 생성 (2개)
| 파일 | 내용 |
|------|------|
| app/lib/billing/overage.ts | Overage 계산 + Paddle charge |
| app/api/v1/admin/billing-overage/route.ts | Cron 엔드포인트 |

### Overage 관련 수정 (4개)
| 파일 | 내용 |
|------|------|
| app/lib/api-auth/plan-checker.ts | 유료 overage 허용 |
| app/lib/api-auth/middleware.ts | X-Plan-Overage 헤더 |
| app/api/v1/sellers/usage/route.ts | 구버전 숫자 수정 |
| vercel.json | billing-overage cron |

### 기타
| 파일 | 내용 |
|------|------|
| .gitignore | vercel_env_backup 추가 |
| Vercel 환경변수 (원격) | B2C 15개 삭제 |

---

## 다음 세션 우선순위
1. 4차 Git Push (Mac) — 문서 업데이트
2. Shopify 임베디드 앱 확인 (Partner Dashboard)
3. Paddle Customer Portal E2E 테스트
4. WDC 다운로드 완료 확인 (~97%)
5. MIN 임포트 재개 — WDC 완료 후 Mac에서 실행
6. AGR 임포트 (148M행)

---

---

# Cowork 세션 4 (세션 37 이후)
> 날짜: 2026-03-10
> 유형: Cowork (Claude Desktop)
> 주제: 구 요금제 잔재 전면 정리 + WDC 추출 스크립트 + MIN 임포트 실행

---

## 작업 요약

### 1. 구 요금제 잔재 전면 정리 (6개 파일)
- developers/docs, terms, help, landing(page.tsx), sellers/me, legal — 모두 Starter/Growth → Free/Basic/Pro/Enterprise 전환
- planLimits 코드 업데이트 (free:500→100, starter:5K→basic:2K, growth:25K→pro:10K, enterprise:-1→50K)
- 전체 코드베이스 grep 확인: 구 요금제(Starter/Growth/$9/$29/500건) 참조 제로

### 2. WDC 상품 데이터 추출 스크립트
- `scripts/extract_with_categories.py` — 진행 상태 저장, 카테고리 통계, 메모리 효율 개선
- 출력: products_detailed.jsonl, products_summary.csv, category_stats.json

### 3. lookup_duty_rate_v2() 테스트 쿼리
- `scripts/test_lookup_duty_rate.sql` — 4단계 폴백 + 주요 무역 시나리오 + 신규 9개국 테스트

### 4. OpenAPI 스펙
- Stripe → Paddle 참조 수정

### 5. AI 에이전트 확인
- Custom GPT: 변경 불필요
- Gemini Gem: 폴더 비어있음

### 6. pricing page 교차검증
- pricing/page.tsx ↔ paddle.ts PLAN_CONFIG: 모든 수치 일치 확인

### 7. MIN 임포트 실행
- WDC 다운로드 완료 확인 (1,895/1,899)
- Mac에서 `import_min_remaining.py` + `run_min_loop.sh` 생성 후 실행 시작
- 9개국: SGP, THA, TUN, TUR, TWN, UKR, URY, USA, VNM

---

## 변경 파일 목록

| 파일 | 유형 | 내용 |
|------|------|------|
| app/developers/docs/page.tsx | 수정 | 요금제 테이블 업데이트 |
| app/terms/page.tsx | 수정 | 요금제 조항 업데이트 |
| app/help/page.tsx | 수정 | FAQ 2건 업데이트 |
| app/page.tsx | 수정 | 랜딩페이지 요금제 카드 업데이트 |
| app/api/v1/sellers/me/route.ts | 수정 | planLimits 코드 업데이트 |
| app/legal/[slug]/page.tsx | 수정 | Terms 요금제 조항 수정 |
| app/api/v1/docs/openapi.ts | 수정 | Stripe→Paddle |
| scripts/extract_with_categories.py | 신규 | WDC 카테고리 포함 추출 |
| scripts/test_lookup_duty_rate.sql | 신규 | lookup 테스트 쿼리 |
| import_min_remaining.py | 신규(Mac) | MIN 9개국 임포트 |
| run_min_loop.sh | 신규(Mac) | MIN 자동 재시작 래퍼 |
| docs/CHANGELOG.md | 수정 | Cowork 4 엔트리 |
| docs/NEXT_SESSION_START.md | 수정 | 전면 재작성 |
| docs/sessions/SESSION_37_REPORT.md | 수정 | Cowork 4 섹션 추가 |

---

## 다음 세션 우선순위
1. 5차 Git Push (Mac) — Cowork 4 변경사항
2. MIN 임포트 완료 확인 (9개국)
3. AGR 임포트 (148M행)
4. Shopify 임베디드 앱 확인
5. lookup_duty_rate_v2() 통합 테스트

---

## 체크리스트 현황
- ✅ Done: 107+ | TODO: 35~ | 🔄 In Progress: 2 | ⏸ Deferred: 5 | ❌ Failed: 2
