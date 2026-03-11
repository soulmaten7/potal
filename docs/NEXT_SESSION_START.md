# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-11 15:13 KST (Cowork 세션 8 — Layer 2 Monitor 구현, 절대 규칙 추가)

---

## ⚠️ 이번 세션(Cowork 7)에서 완료된 사항

### 1. Chief Orchestrator 운영 체계 확정
- AI Agent Organization v2→v3 전면 재설계
- 10→**15개 Division** + **3 Layer 모델** (Automation/Monitor/Active)
- CLAUDE.md에 운영 프로토콜 전면 반영
- Opus 최소화: 4+에스컬5 (70%+ 토큰 절약)

### 2. Layer 1 자동화 — 7개 Division 구현
| Cron 엔드포인트 | Division | 스케줄 | 모니터링 대상 |
|----------------|----------|--------|-------------|
| `health-check` | D11 | 매 6시간 | DB/API/Auth/데이터 무결성 |
| `spot-check` | D8 | 매일 04:00 | 8개 계산 케이스 정확도 |
| `uptime-check` | D5 | 매 6시간 | 6개 핵심 페이지/API |
| `trade-remedy-sync` | D1 | 매주 월 06:30 | 6개 무역구제 테이블 |
| `gov-api-health` | D4 | 매 12시간 | 7개국 정부 API |
| `plugin-health` | D6 | 매 12시간 | 위젯/Shopify/웹훅 |
| `competitor-scan` | D15 | 매주 월 08:00 | 10개 경쟁사 사이트 |

### 3. D9 Customer Success
- FAQ 7→13항목 + "Plugins & Widgets" 카테고리 신설
- Google Rich Snippets 확장
- Crisp 채팅 위젯 삽입 + Vercel env 등록 완료

### 4. 인프라
- Vercel Cron: 2→**9개**
- Supabase `health_check_logs` 테이블 생성
- Vercel env `NEXT_PUBLIC_CRISP_WEBSITE_ID` 3환경 등록
- git push 3회, npm run build 전부 통과

---

## 현재 진행 중인 백그라운드 작업

### AGR 관세율 임포트 (Mac)
```bash
# 진행 확인
tail -5 ~/portal/agr_import.log
cat ~/portal/agr_import_progress.json
```
- ~144M행, 53개국
- **현재**: 28/53 국가 완료, KOR 진행중 (2026-03-11 기준)
- 스크립트: import_agr_all.py + run_agr_loop.sh
- ⚠️ 완료 전까지 다른 대량 작업 금지

---

## Division 세팅 현황 (Layer 1 자동화 기준)

| Division | 상태 | 비고 |
|----------|------|------|
| D1 Tariff | ✅ | Cron 관세 동기화 + trade-remedy-sync 매주 월 |
| D2 Tax Engine | ✅ | 앱 내장 로직 자동 실행 |
| D3 HS Classification | ✅ | 앱 내장 로직 자동 실행 |
| D4 Data Pipeline | ✅ | 환율 Cron + gov-api-health 매 12시간 |
| D5 Product & Web | ✅ | Vercel 배포 + uptime-check 매 6시간 |
| D6 Platform | ✅ | Shopify Webhook + plugin-health 매 12시간 |
| D7 API & Developer | ✅ | plan-checker, rate-limiter 내장 |
| D8 QA | ✅ | CI 테스트 + spot-check 매일 |
| D9 Customer Success | ✅ | FAQ 13항목 + Crisp 채팅 |
| D10 Billing | ✅ | Paddle Webhook + Overage Cron |
| D11 Infrastructure | ✅ | CI/CD + health-check 매 6시간 |
| D12 Marketing | ✅ | Make.com Welcome Email + LinkedIn 소셜공유 |
| D13 Legal | ✅ | Google Calendar 법률 리뷰 3개 반복일정 |
| D14 Finance | ❌ | 비용 자동 수집 미설정 |
| D15 Intelligence | ✅ | competitor-scan 매주 월 |

**✅ 14/15 완료 — 미완: D14 (Finance) 보류**

---

## 다음 세션 우선순위

### 🔴 즉시 — AGR 완료 후
1. **AGR 임포트 완료 확인** → Supabase macmap_agr_rates 행 수 확인
2. **WDC 상품명 추출 실행**:
   ```bash
   cd ~/portal && nohup python3 scripts/extract_with_categories.py /Volumes/soulmaten/POTAL/wdc-products > wdc_extract.log 2>&1 &
   ```
3. **상품명→HS 코드 매핑 파이프라인** — WDC 5.95억 상품 데이터

### 🔴 즉시 — 비즈니스
4. **Shopify 앱 심사 상태 확인** — Partner Dashboard
5. **Morning Brief 시스템 실제 구현** — Layer 2 체크리스트 정의 + health_check_logs 데이터 기반 자동 보고
6. **lookup_duty_rate_v2() 검증** — MIN+AGR 4단계 폴백 통합 테스트

### 🟡 보류 Division
7. **D14 Finance** — Vercel/Supabase 비용 자동 수집 설정 (유일한 보류 Division)

### 🟢 장기
9. **47기능 완전정복 전략 실행** — Phase 1 (크리티컬 갭 6개) 우선
10. **Layer 2 Monitor 구현** — Sonnet 팀장 체크리스트 자동 실행
11. **Layer 3 Agent Teams 시범 운영** — Division 단위 프로젝트 실행

---

## ⚠️ 주의사항
- **결제**: ✅ Paddle Live 완료 + Overage 빌링 + DDP Quote-only
- **요금제**: ✅ 전체 코드베이스 정리 완료 (Free/Basic/Pro/Enterprise)
- **33개 기능**: ✅ 전부 구현 완료
- **AI Agent Org v3**: ✅ 15 Division, 3 Layer, Chief Orchestrator
- **Layer 1 자동화**: ✅ 14/15 Division 완료 (D14 Finance만 보류), Vercel Cron 9개
- **Crisp 채팅**: ✅ 활성화됨 (env 등록 완료)
- **Git push**: Mac 터미널에서만 가능
- **터미널 작업**: 한 번에 하나만 (AGR 실행 중)

---

## Vercel Cron 전체 목록 (9개)

| # | 엔드포인트 | 스케줄 | Division |
|---|-----------|--------|----------|
| 1 | `/admin/update-tariffs` | 매주 월 06:00 UTC | D1 |
| 2 | `/admin/billing-overage` | 매월 1일 07:00 UTC | D10 |
| 3 | `/admin/health-check` | 매 6시간 | D11 |
| 4 | `/admin/spot-check` | 매일 04:00 UTC | D8 |
| 5 | `/admin/uptime-check` | 매 6시간 | D5 |
| 6 | `/admin/trade-remedy-sync` | 매주 월 06:30 UTC | D1 |
| 7 | `/admin/gov-api-health` | 매 12시간 | D4 |
| 8 | `/admin/plugin-health` | 매 12시간 | D6 |
| 9 | `/admin/competitor-scan` | 매주 월 08:00 UTC | D15 |
