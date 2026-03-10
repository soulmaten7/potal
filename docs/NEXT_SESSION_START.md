# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-09 (Cowork 세션 2/세션 36 — Paddle 전환 완료)

---

## ⚠️ 이 세션(Cowork 2, 세션 36)에서 변경된 사항

### 1. B2C 잔재 삭제 (8개 파일/폴더)
- `ios/` 폴더 전체, `capacitor.config.ts`, `POTAL_Distribution.mobileprovision`
- `marketing/app-store-metadata.md` (Apple App Store)
- `docs/architecture/` B2C 문서 4개 (SEARCH_LOGIC_ANALYSIS, SPECS, POTAL_MASTER_ARCHITECTURE, POTAL_AI_EVOLUTION_ROADMAP.docx)
- **B2C 백업**: `potal-b2c-snapshot` 브랜치에 보존 (remote push 완료)
- **⚠️ package.json에 Capacitor 패키지 7개 남아있음** → Mac에서 `npm uninstall @capacitor/app @capacitor/browser @capacitor/cli @capacitor/core @capacitor/ios @capacitor/splash-screen @capacitor/status-bar` 실행 필요

### 2. 중복/대체 파일 삭제 (5개)
- `analysis/POTAL_vs_Competitors_Analysis.md` → v2.xlsx로 대체
- `analysis/COMPETITOR-ANALYSIS.md` → v2.xlsx에 최신 내용
- `checklists/POTAL_Checklist_20260309.xlsx` → B2B_Checklist.xlsx가 마스터
- `checklists/MORNING-TODO.md` → 세션 30 아침 TODO, 완료됨
- `docs/architecture/INDEX.md` → README.md와 중복

### 3. 파일 이동/정리
- `data/south_africa_tariff_schedule_*.pdf` 2개 → `data/tariff-research/`
- `data/` 루트 파일 14개 → `data/tariff-research/` (수집 스크립트, 메타데이터, 원본 데이터)
- 3개 → `archive/` (SESSION_TEMPLATES.md, POTAL_Agent_Dashboard.html, POTAL_API_Strategy_Analysis.xlsx)
- `.DS_Store` 7개, `data/collection.log` 삭제

### 4. 요금제 구/신 불일치 검증 + 코드 반영 완료
- 세션 트랜스크립트 전수 분석하여 세션 28 요금제 변경 확인
- **신 요금제 (현재 유효)**: Free $0/100건, Basic $20/2K, Pro $80/10K, Enterprise $300+/50K+
- ✅ 코드 전면 업데이트 완료 (plan-checker, pricing page, dashboard, docs, register 등 12개 파일)

### 5. LemonSqueezy → Paddle 코드 전환 완료 ✅
- `app/lib/billing/paddle.ts` 신규 생성 (PLAN_CONFIG, API 헬퍼)
- `app/lib/billing/subscription.ts` → Paddle 상태 매핑 + cancel/pause/resume
- `app/api/billing/checkout/route.ts` → Paddle Transaction API
- `app/api/billing/webhook/route.ts` → Paddle Signature 검증 (ts;h1), 6개 이벤트
- `app/api/billing/portal/route.ts` → Paddle management_urls
- `app/pricing/page.tsx` → 신 요금제 4개 플랜 + 비교표
- `app/dashboard/DashboardContent.tsx` → 플랜명/가격 변경
- `app/partners/page.tsx` → LemonSqueezy → Paddle

### 6. 문서 업데이트
- CLAUDE.md, .cursorrules, session-context.md, CHANGELOG.md, NEXT_SESSION_START.md, POTAL_B2B_Checklist.xlsx 전부 반영

---

## 다음 세션 우선순위

### 🔴 즉시 (Paddle 설정 — 코드 준비 완료, 대시보드 작업 필요)
1. **Paddle Sandbox 제품 재생성** — 구 요금제(Starter $9) 삭제 → 신 요금제로 3개 생성:
   - Basic $20/mo (14일 trial)
   - Pro $80/mo (14일 trial)
   - Enterprise $300/mo (placeholder)
2. **Paddle API Key + Webhook 설정** — Sandbox에서 API key 발급 → `.env`에 추가:
   ```
   PADDLE_API_KEY=...
   PADDLE_WEBHOOK_SECRET=...
   PADDLE_ENVIRONMENT=sandbox
   PADDLE_PRICE_BASIC=pri_...
   PADDLE_PRICE_PRO=pri_...
   PADDLE_PRICE_ENTERPRISE=pri_...
   ```
3. **Mac에서 `npm run build`** — Paddle 전환 코드 빌드 확인

### 🟡 정리 (미완료 잔존 항목)
4. **`app/lib/billing/lemonsqueezy.ts` 삭제** — 새 코드는 paddle.ts 사용. 참조 완료 후 삭제
5. **`@lemonsqueezy/lemonsqueezy.js` npm uninstall** — Mac에서 실행
6. **i18n translations 업데이트** — `pricing.starter.*` → `pricing.free.*`, `pricing.growth.*` → `pricing.basic.*` 등 (현재 tsx에서 미참조, 우선순위 낮음)
7. **Capacitor 패키지 7개 npm uninstall** — Mac에서 실행
8. **경쟁사 비교 파일 업데이트** — POTAL_vs_Competitors_v2.xlsx 신 요금제 반영

### 🟢 데이터 (백그라운드)
9. **MIN 임포트 완료** — 9개국 남음 (SGP~VNM), Cowork VM에서 `import_min_remaining.py`
10. **WDC 다운로드 진행** — Mac 외장하드, ~668/1899 파일
11. **AGR 임포트** — 148M행, MIN 완료 후

### 🔵 기능/비즈니스
12. **Shopify 임베디드 앱 확인** → 통과 시 "검토를 위해 제출"

---

## ⚠️ 주의사항
- **요금제**: ✅ 코드 반영 완료. 구버전 잔재: lemonsqueezy.ts(보존중), i18n translations
- **결제**: ✅ Paddle 코드 전환 완료. 환경변수(API Key, Price IDs) 아직 미설정
- **MIN 임포트**: Cowork VM에서만 실행 가능 (5K행/배치, 스트리밍 방식)
- **WDC 다운로드**: Mac 터미널 nohup. 멈추면 재시작 (자동 이어받기)
- **Git push**: Mac 터미널에서만 가능

---

## 현재 폴더 구조
```
portal/
├── [루트 코어] CLAUDE.md, session-context.md, .cursorrules, README.md, 설정파일
│
├── docs/
│   ├── sessions/            # 세션별 리포트 (SESSION_30~36)
│   ├── architecture/        # DESIGN_AGR_IMPORT, DESIGN_WDC_HS_MAPPING, README
│   ├── CHANGELOG.md
│   ├── NEXT_SESSION_START.md
│   └── POTAL_결제_솔루션_조사.md
│
├── analysis/                # 경쟁사/비용/전략 분석 (9개 파일)
├── marketing/               # 피치덱, PH, 페이스북 (4개 파일 + product-hunt-assets/)
├── checklists/              # POTAL_B2B_Checklist.xlsx + POTAL_NEXT_CHECKLIST.md
├── ai-agents/               # custom-gpt/, gemini-gem/, meta-ai/
├── archive/                 # 보관 (10개 파일)
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
