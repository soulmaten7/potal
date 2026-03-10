# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-10 (Cowork 세션 4 — 구 요금제 잔재 전면 정리, WDC 추출 스크립트, MIN 임포트 실행)

---

## ⚠️ 이번 세션(Cowork 4)에서 완료된 사항

### 1. 구 요금제 잔재 전면 정리 (6개 파일)
- `app/developers/docs/page.tsx` — Starter $9/Growth $29 → Free/Basic $20/Pro $80/Enterprise $300
- `app/terms/page.tsx` — Free 500→100, Starter→Basic, Growth→Pro, 초과요금 안내 추가
- `app/help/page.tsx` — FAQ 2건 업데이트 (Starter/Growth 삭제, 신 요금제 반영)
- `app/page.tsx` (랜딩) — Free 500→100, Growth $29→Pro $80, Enterprise Custom→$300
- `app/api/v1/sellers/me/route.ts` — planLimits: free 500→100, starter 5K→basic 2K, growth 25K→pro 10K, enterprise -1→50K
- `app/legal/[slug]/page.tsx` — Terms 요금제 조항 전면 수정

### 2. WDC 상품 데이터 추출 스크립트
- `scripts/extract_with_categories.py` (NEW) — 진행 상태 저장(재시작 가능), 카테고리별 통계, 메모리 효율 개선
- Mac 외장하드에서 실행: `nohup python3 scripts/extract_with_categories.py /Volumes/soulmaten/POTAL/wdc-products > wdc_extract.log 2>&1 &`

### 3. lookup_duty_rate_v2() 테스트 쿼리
- `scripts/test_lookup_duty_rate.sql` (NEW) — MIN 상태 확인, 국가별 카운트, 4단계 폴백 테스트, 주요 무역 시나리오

### 4. OpenAPI 스펙 업데이트
- `app/api/v1/docs/openapi.ts` — "Stripe checkout session" → "Paddle checkout session"

### 5. AI 에이전트 확인
- Custom GPT (gpt-instructions.md): 변경 불필요 (Stripe/구 요금제 참조 없음)
- Gemini Gem: 폴더 비어있음 — 건너뜀

### 6. MIN 임포트 진행중 (Mac 백그라운드)
- WDC 다운로드 완료 (1,895/1,899)
- `import_min_remaining.py` + `run_min_loop.sh` Mac에 생성 후 실행 시작
- 남은 9개국: SGP, THA, TUN, TUR, TWN, UKR, URY, USA, VNM

---

## 다음 세션 우선순위

### 🔴 즉시 (Push 필요)
1. **5차 Git Push** (Mac) — Cowork 4 변경사항 (구 요금제 정리 + 스크립트 + 문서)
   ```bash
   cd ~/portal && npm run build
   git add app/developers/docs/page.tsx app/terms/page.tsx app/help/page.tsx \
     app/page.tsx app/api/v1/sellers/me/route.ts app/legal/\[slug\]/page.tsx \
     app/api/v1/docs/openapi.ts scripts/extract_with_categories.py \
     scripts/test_lookup_duty_rate.sql docs/CHANGELOG.md docs/NEXT_SESSION_START.md \
     docs/sessions/SESSION_37_REPORT.md CLAUDE.md
   git commit -m "fix: replace legacy plan names (Starter/Growth) with new plans (Basic/Pro) across all pages + add WDC extract script"
   git push
   ```

### 🟡 기능/비즈니스
2. **Shopify 임베디드 앱 확인** — Partner Dashboard에서 앱 심사 상태 확인
3. **Paddle Customer Portal E2E 확인** — portal URL 플로우, management_urls API 테스트
4. **Paddle Invoice 확인** — MoR 자동 인보이스 생성 확인

### 🟢 데이터 (백그라운드)
5. **MIN 임포트 확인** — Mac에서 실행 중, 진행 확인:
   ```bash
   tail -5 ~/portal/min_import.log
   cat ~/portal/min_import_progress.json
   ```
6. **AGR 임포트** — 148M행, MIN 완료 후
7. **WDC 상품명 추출 실행** — MIN 완료 후, Mac 외장하드에서:
   ```bash
   cd ~/portal
   nohup python3 scripts/extract_with_categories.py /Volumes/soulmaten/POTAL/wdc-products > wdc_extract.log 2>&1 &
   ```

### 🔵 개발
8. **lookup_duty_rate_v2() 검증** — MIN+AGR 완료 후 4단계 폴백 통합 테스트
9. **반덤핑/상계관세/세이프가드 5단계 폴백** — lookup_duty_rate에 AD/CVD/SG 추가
10. **WDC 상품명→HS 매핑 파이프라인** — 5.95억 상품 데이터 처리

---

## ⚠️ 주의사항
- **요금제**: ✅ 전체 코드베이스 정리 완료 (Cowork 4). 구 요금제(Starter/Growth/500건) 참조 제로
- **결제**: ✅ Paddle **Live 전환 완료** + Overage 빌링 구현 완료
- **B2C 잔재**: ✅ 완전 정리 (lemonsqueezy 삭제, Capacitor 삭제, Vercel B2C 환경변수 삭제, i18n 키 교체)
- **MIN 임포트**: Mac에서 실행 중 (WDC 완료 후 시작됨)
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

## Checklist 진행 상태 (세션 37+Cowork 4 기준)
- ✅ Done: 107+ | TODO: 35~ | 🔄 In Progress: 2 | ⏸ Deferred: 5 | ❌ Failed: 2
