# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-11 (Cowork 세션 7 — Chief Orchestrator 운영 체계 확정, 15 Division + 3 Layer 구조)

---

## ⚠️ 이번 세션(Cowork 7)에서 완료된 사항

### 1. AI Agent Organization v3 전면 재설계
- `POTAL_AI_Agent_Org.html` v2→v3 전면 재작성
- 10개 Division → **15개 Division** 확장
  - D5 Product & Web (신설) — potal.app UI/UX 전담
  - D8 QA & Accuracy (신설) — 품질 문지기
  - D9 Customer Success (신설) — 고객 유지
  - 기존 Business Operations → Revenue & Billing + Customer Success으로 분리
- 40 Agent 개념 → **3 Layer 모델** 전환
  - Layer 1: Automation (Vercel Cron, Paddle Webhook, 앱 내장 로직) — 토큰 $0
  - Layer 2: Monitor (Sonnet 팀장 체크리스트) — 최소 토큰
  - Layer 3: Active (Agent Teams 3~5명 프로젝트 실행) — 작업 시만
- Opus 최소화: v1 11개 → v3 4+에스컬5 = **70%+ 토큰 절약**

### 2. CLAUDE.md Chief Orchestrator 운영 프로토콜 반영
- **Claude Code = Chief Orchestrator (COO/Chief of Staff)** 역할 정의
- 15개 Division 테이블 (담당 범위 + 핵심 파일)
- Morning Brief 포맷 (🟢/🟡/🔴 시스템)
- 3 Layer 모델, Opus 사용 맵, Escalation Flow
- 일일/주간/월간 운영 사이클
- Division 세팅 현황 (✅4 / ⚠️5 / ❌6)
- 확장 패턴 문서화

### 3. 일일 운영 플로우 v3 상세화
- Phase 0~4 타임라인: 새벽 자동 → 아침 5분 Morning Brief → 오전/오후 프로젝트 → 마감
- 주간 루틴 (매주 월: 관세 업데이트, KPI, 경쟁사 스캔)
- 월간 루틴 (매월 1일: Overage 정산, 정확도 리포트, 인프라 비용)

### 4. 문서 업데이트 (6개 파일)
- `POTAL_AI_Agent_Org.html` — v3 전면 재작성 + 일일 운영 플로우 상세
- `CLAUDE.md` — Chief Orchestrator 섹션 추가, 수치 업데이트
- `session-context.md` — CW7 헤더, 스프린트, 작업 로그
- `.cursorrules` — CW7 헤더, Anti-Amnesia
- `docs/CHANGELOG.md` — CW7 엔트리
- `docs/NEXT_SESSION_START.md` — 전면 재작성

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

## 다음 세션 우선순위

### 🔴 즉시 — Division Layer 1 자동화 구현
**15개 Division 중 ❌ 6개, ⚠️ 5개가 Layer 1 미완성. 우선순위 순:**

1. **D11 Infrastructure** — 에러 모니터링/알림 구현 (Vercel Analytics → Make.com 알림)
2. **D8 QA & Accuracy** — 자동 스팟체크 구현 (알려진 정답 vs API 결과 비교)
3. **D5 Product & Web** — potal.app uptime/CWV 자동 체크
4. **D1 Tariff** — TTBD 자동수집 + 관세 변동 알림
5. **D4 Data Pipeline** — 정부 API 7개 헬스체크 자동화
6. **D6 Platform** — 플러그인 상태 모니터링

### 🔴 즉시 — AGR 완료 후
7. **AGR 임포트 완료 확인** → Supabase macmap_agr_rates 행 수 확인
8. **WDC 상품명 추출 실행**:
   ```bash
   cd ~/portal && nohup python3 scripts/extract_with_categories.py /Volumes/soulmaten/POTAL/wdc-products > wdc_extract.log 2>&1 &
   ```
9. **상품명→HS 코드 매핑 파이프라인** — WDC 5.95억 상품 데이터

### 🟡 비즈니스/운영
10. **Shopify 앱 심사 상태 확인** — Partner Dashboard
11. **Morning Brief 시스템 실제 구현** — Layer 2 체크리스트 정의 + 실행 시스템
12. **lookup_duty_rate_v2() 검증** — MIN+AGR 4단계 폴백 통합 테스트

### 🟢 장기
13. **D9 Customer Success** — AI 챗봇, 온보딩 자동화
14. **D12 Marketing** — Make.com 포스팅/이메일 워크플로우
15. **D13~D15** — 캘린더 알림, 비용 수집, 뉴스 RSS

---

## ⚠️ 주의사항
- **결제**: ✅ Paddle Live 완료 + Overage 빌링 + DDP Quote-only
- **요금제**: ✅ 전체 코드베이스 정리 완료 (Free/Basic/Pro/Enterprise)
- **33개 기능**: ✅ 전부 구현 완료
- **AI Agent Org v3**: ✅ 15 Division, 3 Layer, Chief Orchestrator
- **CLAUDE.md**: ✅ 운영 프로토콜 반영 — Claude Code가 Chief 역할로 동작
- **Git push**: Mac 터미널에서만 가능
- **터미널 작업**: 한 번에 하나만 (AGR 실행 중)

---

## 파일 변경 목록 (Cowork 7)

### 수정된 파일 (6개)
1. `POTAL_AI_Agent_Org.html` — v3 전면 재작성 (15 Division + 3 Layer + 일일 운영 플로우 상세)
2. `CLAUDE.md` — Chief Orchestrator 섹션 추가, AI Agent Org v3 수치, AGR 진행상황
3. `session-context.md` — CW7 헤더, 스프린트 상태, 작업 로그
4. `.cursorrules` — CW7 헤더, Anti-Amnesia 업데이트
5. `docs/CHANGELOG.md` — CW7 엔트리 추가
6. `docs/NEXT_SESSION_START.md` — 전면 재작성

---

## Division 세팅 현황 참조 (Layer 1 자동화 기준)

| Division | 상태 | 비고 |
|----------|------|------|
| D1 Tariff | ⚠️ | Cron 관세 동기화만. TTBD 자동수집 미구현 |
| D2 Tax Engine | ✅ | 앱 내장 로직 자동 실행 |
| D3 HS Classification | ✅ | 앱 내장 로직 자동 실행 |
| D4 Data Pipeline | ⚠️ | 환율 Cron ✅, API 헬스체크 없음 |
| D5 Product & Web | ⚠️ | Vercel 배포 ✅, CWV/uptime 없음 |
| D6 Platform | ⚠️ | Shopify Webhook ✅, 모니터링 없음 |
| D7 API & Developer | ✅ | plan-checker, rate-limiter 내장 |
| D8 QA | ❌ | CI 테스트만. 자동 스팟체크 없음 |
| D9 Customer Success | ❌ | 챗봇/온보딩 없음 |
| D10 Billing | ✅ | Paddle Webhook + Overage Cron |
| D11 Infrastructure | ⚠️ | CI/CD ✅, 에러 모니터링 없음 |
| D12 Marketing | ❌ | Make.com 미설정 |
| D13 Legal | ❌ | 캘린더 알림 없음 |
| D14 Finance | ❌ | 비용 자동 수집 없음 |
| D15 Intelligence | ❌ | RSS/뉴스 수집 없음 |
