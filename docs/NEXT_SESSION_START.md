# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-10 (Cowork 세션 3 후반/세션 37 계속 — 빌드 수정, Paddle 버그 픽스, B2C 잔재 완전 정리)

---

## ⚠️ 이 세션(Cowork 3 후반)에서 변경된 사항

### 1. 빌드 수정 + B2C 잔재 완전 정리
- **Capacitor stub**: `app/lib/native-auth.ts` — @capacitor/core 대신 stub 함수 (isNativePlatform→false)
- **LemonSqueezy 완전 삭제**: `lemonsqueezy.ts` 삭제 + npm uninstall
- **Capacitor 패키지 7개 삭제**: npm uninstall 완료
- **Vercel B2C 환경변수 15개 삭제**: ALIEXPRESS/AMAZON/EBAY/RAPIDAPI/APIFY/TEMU → 36개→21개

### 2. i18n 번역 키 업데이트 (6개 언어)
- en/ko/ja/zh/es/de — starter→free, growth→basic+pro, scale→enterprise
- Annual 키 추가, FAQ Stripe→Paddle 전환

### 3. Paddle 결제 버그 3건 수정
- portal route: `url` 필드 추가 (대시보드 호환)
- checkout route: billing_customer_id 재사용 + billingCycle 전달
- DashboardContent: Monthly/Annual 토글 UI + billingCycle state

### 4. Git Push 상태
- **1차 Push 완료**: Capacitor stub + lemonsqueezy 삭제 + i18n (10 files, +280/-1,260)
- **2차 Push 필요** (Mac): Paddle 버그 픽스 + Annual 토글 (checkout/portal/DashboardContent 3 files)

---

## 다음 세션 우선순위

### 🔴 즉시
1. **3차 Git Push** (Mac) — Overage 빌링 + usage 요금제 수정 + Paddle 버그 픽스
   ```bash
   cd ~/portal && npm run build
   git add app/lib/billing/overage.ts app/api/v1/admin/billing-overage/route.ts \
     app/lib/api-auth/plan-checker.ts app/lib/api-auth/middleware.ts \
     app/api/v1/sellers/usage/route.ts vercel.json \
     app/api/billing/checkout/route.ts app/api/billing/portal/route.ts \
     app/dashboard/DashboardContent.tsx docs/CHANGELOG.md docs/NEXT_SESSION_START.md
   git commit -m "feat: overage billing + Paddle bug fixes + annual toggle"
   git push
   ```
2. ~~Paddle 결제 플로우 E2E 테스트~~ ✅ **완료** (Products/Prices/Webhook/Auth 정상)
3. ~~Overage 빌링 구현~~ ✅ **완료** (overage.ts + billing-overage cron + plan-checker overage 허용)

### 🟢 데이터 (백그라운드)
4. **WDC 다운로드 완료 확인** — ~97% (1,852/1,899), Mac 외장하드
5. **MIN 임포트 재개** — 🔄 진행중 (SGP ~44%, Cowork VM 백그라운드)
6. **AGR 임포트** — 148M행, MIN 완료 후

### 🔵 기능/비즈니스
7. **Shopify 임베디드 앱 확인** → 통과 시 "검토를 위해 제출"
8. **Paddle Customer Portal E2E 확인** — portal URL 플로우 테스트

---

## ⚠️ 주의사항
- **요금제**: ✅ 코드+Vercel+i18n 모두 반영 완료
- **결제**: ✅ Paddle **Live 전환 완료** — 버그 3건 수정됨 (2차 push 후 Vercel 배포 필요)
- **B2C 잔재**: ✅ 완전 정리 (lemonsqueezy 삭제, Capacitor 삭제, Vercel B2C 환경변수 삭제, i18n 키 교체)
- **Stripe/LemonSqueezy**: ❌ 완전 삭제됨
- **MIN 임포트**: Cowork VM에서 실행 (5K행/배치, 스트리밍 방식)
- **WDC 다운로드**: Mac 터미널 nohup. 멈추면 재시작 (자동 이어받기)
- **Git push**: Mac 터미널에서만 가능

---

## 현재 Paddle 환경변수 (Live — 2026-03-10 전환)
```
PADDLE_API_KEY=pdl_live_apikey_***REDACTED***
PADDLE_WEBHOOK_SECRET=ntfset_***REDACTED***
PADDLE_ENVIRONMENT=production
PADDLE_PRICE_BASIC_MONTHLY=pri_01kkaxq0grevdgr3dgrx3fwvpx
PADDLE_PRICE_BASIC_ANNUAL=pri_01kkaxr28wf8bwmkx73myw9fya
PADDLE_PRICE_PRO_MONTHLY=pri_01kkaxrzdgvhn47ryqvjzfajbz
PADDLE_PRICE_PRO_ANNUAL=pri_01kkaxskn730atcdyrahs5t4zp
PADDLE_PRICE_ENTERPRISE_MONTHLY=pri_01kkaxt980j0s0aypv7nk0474k
PADDLE_PRICE_ENTERPRISE_ANNUAL=pri_01kkaxtxp8jjtfhxjwyqfz74rf
```

## 현재 폴더 구조
```
portal/
├── [루트 코어] CLAUDE.md, session-context.md, .cursorrules, README.md, 설정파일
│
├── docs/
│   ├── sessions/            # 세션별 리포트 (SESSION_30~37)
│   ├── architecture/        # DESIGN_AGR_IMPORT, DESIGN_WDC_HS_MAPPING, README
│   ├── CHANGELOG.md
│   ├── NEXT_SESSION_START.md
│   └── POTAL_결제_솔루션_조사.md
│
├── analysis/                # 경쟁사/비용/전략 분석 (9개 파일)
├── marketing/               # 피치덱, PH, 페이스북 (4개 파일 + product-hunt-assets/)
├── checklists/              # POTAL_B2B_Checklist.xlsx + POTAL_NEXT_CHECKLIST.md
├── ai-agents/               # custom-gpt/, gemini-gem/, meta-ai/
├── archive/                 # 보관 (11개 파일 — vercel_env_backup 추가)
│
├── data/
│   ├── itc_macmap/          # MacMap 관세 데이터 (53개국)
│   ├── tariff-research/     # 리서치 findings + 수집 스크립트 + 원본 데이터
│   └── wits_tariffline/     # WITS tariff line 데이터
│
├── scripts/
│   ├── docs/                # 스크립트 사용법 문서
│   └── (실행 스크립트들)
│
├── app/, components/, plugins/, supabase/, mcp-server/ # 소스코드
└── ...
```
