# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-10 (Cowork 세션 3 후반/세션 37 — Overage 빌링, Paddle Live 전환, B2C 완전 정리)

---

## ⚠️ 이번 세션(Cowork 3 후반)에서 완료된 사항

### 1. Overage 빌링 구현 (Paddle One-time Charge API)
- `app/lib/billing/overage.ts` (NEW) — 초과 사용량 계산 + Paddle 과금
- `app/api/v1/admin/billing-overage/route.ts` (NEW) — Cron 엔드포인트 (매월 1일 07:00 UTC)
- `app/lib/api-auth/plan-checker.ts` — 유료 플랜 overage 허용 (Free만 hard-block)
- `app/lib/api-auth/middleware.ts` — X-Plan-Usage/Limit/Overage 헤더 추가
- `app/api/v1/sellers/usage/route.ts` — 구버전 요금제 숫자 수정 + overage 정보 추가
- `vercel.json` — billing-overage cron 추가

### 2. Paddle 결제 버그 3건 수정 + Live 전환
- `app/api/billing/portal/route.ts` — `url` 필드 추가
- `app/api/billing/checkout/route.ts` — billing_customer_id 재사용 + billingCycle
- `app/dashboard/DashboardContent.tsx` — Monthly/Annual 토글 UI
- **Live 전환 완료**: Live API Key + 6개 Live Price + Webhook 56 events

### 3. 빌드 수정 + B2C 잔재 완전 정리
- `app/lib/native-auth.ts` — @capacitor/core → stub 함수
- LemonSqueezy 완전 삭제 (lemonsqueezy.ts + npm uninstall)
- Capacitor 패키지 7개 npm uninstall
- Vercel B2C 환경변수 15개 삭제 (36→21개)
- i18n 6개 언어 키 전면 교체 (starter→free, growth→basic+pro 등)

### 4. Git Push (3회 완료)
- 1차: Capacitor stub + lemonsqueezy 삭제 + i18n (10 files)
- 2차 (8a6b0a0): Paddle 버그 픽스 + Annual 토글 + 문서 + .gitignore
- 3차 (a80737e): Overage 빌링 + plan-checker + middleware + vercel.json

---

## 다음 세션 우선순위

### 🔴 즉시 (Push 필요)
1. **4차 Git Push** (Mac) — 문서 업데이트 (CLAUDE.md, CHANGELOG, NEXT_SESSION, session-context, .cursorrules, Checklist)
   ```bash
   cd ~/portal && npm run build
   git add CLAUDE.md session-context.md .cursorrules docs/CHANGELOG.md \
     docs/NEXT_SESSION_START.md checklists/POTAL_B2B_Checklist.xlsx
   git commit -m "docs: session 37 documentation update"
   git push
   ```

### 🟡 기능/비즈니스
2. **Shopify 임베디드 앱 확인** — Partner Dashboard에서 앱 심사 상태 확인. 통과 시 "검토를 위해 제출"
3. **Paddle Customer Portal E2E 확인** — portal URL 플로우, management_urls API 테스트
4. **Paddle Invoice 확인** — MoR 자동 인보이스 생성 확인

### 🟢 데이터 (백그라운드)
5. **WDC 다운로드 완료 확인** — ~97% (1,852/1,899), Mac 외장하드
   ```bash
   tail -5 ~/wdc_download.log
   ls /Volumes/soulmaten/POTAL/wdc-products/*.gz | wc -l
   ```
6. **MIN 임포트 재개** — ⚠️ WDC 완료 후, **Mac에서** 실행 (VM 아님!)
   - 남은 9개국: SGP, THA, TUN, TUR, TWN, UKR, URY, USA, VNM (~26.8M행)
   ```bash
   cd ~/portal
   nohup python3 import_min_remaining.py > min_import.log 2>&1 &
   # 또는 자동 재시작 래퍼:
   nohup bash run_min_loop.sh > min_import.log 2>&1 &
   ```
7. **AGR 임포트** — 148M행, MIN 완료 후

### 🔵 개발
8. **lookup_duty_rate_v2() 검증** — MIN+AGR 완료 후 4단계 폴백 통합 테스트
9. **반덤핑/상계관세/세이프가드 5단계 폴백** — lookup_duty_rate에 AD/CVD/SG 추가
10. **WDC 상품명→HS 매핑 파이프라인** — 5.95억 상품 데이터 처리

---

## ⚠️ 주의사항
- **요금제**: ✅ 코드+Vercel+i18n+Paddle 모두 반영 완료. Free 100/Basic $20(2K)/Pro $80(10K)/Enterprise $300(50K)
- **결제**: ✅ Paddle **Live 전환 완료** + Overage 빌링 구현 완료
- **B2C 잔재**: ✅ 완전 정리 (lemonsqueezy 삭제, Capacitor 삭제, Vercel B2C 환경변수 삭제, i18n 키 교체)
- **MIN 임포트**: WDC 완료 후 Mac에서 실행 (VM에서는 프로세스 계속 죽음)
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

## Checklist 진행 상태 (세션 37 기준)
- ✅ Done: 107 | TODO: 38 | 🔄 In Progress: 2 | ⏸ Deferred: 5 | ❌ Failed: 2
