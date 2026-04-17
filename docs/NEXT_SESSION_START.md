# 다음 세션 시작점
> 마지막 업데이트: 2026-04-17 20:00 KST

## 이전 세션 (CW38 Ticker Redesign — 홈페이지 상단 marquee 티커 제거)
- 권위자 리뷰: 데이터 인프라 SaaS 카테고리(Stripe/Plaid/Zonos/Avalara/Descartes/Segment)에서 홈 상단 티커 쓰는 곳 없음
- REMOVE: `<LiveTicker />` `app/page.tsx` 에서 제거 (컴포넌트는 `components/ticker/LiveTicker.tsx` 재사용 위해 보존)
- REPLACE: 기존 4-stat 바 → 6-카테고리 `<CategoryStatBar />` + 실제 DB freshness timestamp
- ADD: Hero 아래 `<DataSourcesSection />` — 6개 카테고리 상세 카드 → /data-sources 링크
- 6개 카테고리: Tariff(10)/Tax(6)/Sanctions(3)/Trade Remedies(1)/FTA(1)/Rulings(3) = master-data-registry 32개 소스 그루핑
- 신규 파일 3개: `lib/home/category-stats.ts` + `components/home/CategoryStatBar.tsx` + `components/home/DataSourcesSection.tsx`
- TS 타입체크 통과. 빌드 검증은 Mac에서 필요 (샌드박스 Linux ARM64 SWC 바이너리 미설치)

## 이전 세션 (CW38 — Phase 1~7 완료, 데이터 인프라 완성)
- Phase 1: DB 전환 + Ghost Table Fix (b3d905d)
- Phase 2: Auto-Update Pipeline — VAT/de minimis/US tax cron 3개 (cf705a1)
- Phase 3: DB 진단 — 핵심 테이블 OK, cron 5개 green, MacMap DB 실사용 확인 (0ce9ee7)
- Phase 4-5: 27개국 데이터 수집 + source-registry.json (104.9KB) + CLAUDE.md Rule 16
- Phase 6: 하드코딩↔DB 동기화 실행 — IN de minimis 불일치 2건 수정 (8e66bd1)
- Phase 7: Data Master List 170개 + Scheduled Task 3개 프롬프트 전면 재작성
- **수동/미연결 0개 달성** — 모든 데이터 소스에 갱신 경로 연결됨

## 데이터 인프라 최종 현황
- **Supabase 107 테이블** + Static Files 41 + Hardcoded Constants 15 + External APIs 14 = 총 170개
- **자동 갱신 체인**: Scheduled Task → auto-commands/ .md → launchd → Claude Code → DB 비교 → 코드 수정 → build → push
- **하드코딩 15개 전부 DB와 중복** → Scheduled Task가 불일치 시 코드 직접 수정 + 빌드 + 푸시
- 마스터 리스트: `docs/POTAL_DATA_MASTER_LIST.md`

## 다음 작업: 홈페이지 LiveTicker
- CW38 원래 목표였던 티커 디자인/구현
- 데이터 인프라가 완성되었으므로 실제 데이터로 티커 표시 가능

## Auto Command Runner 구조
```
Scheduled task (Cowork) → ~/potal/docs/auto-commands/ 에 .md 파일 생성
→ Mac launchd 10분마다 체크 → Claude Code 자동 실행
→ 완료된 파일 done/ 폴더로 이동
```
- 설치 가이드: docs/AUTO_COMMAND_RUNNER_SETUP.md
- Mac launchd 이미 등록됨 (com.potal.auto-command-runner)

## 확인 예정 일정
- 4/18 10:00 KST: duty_rates_live 테이블 검증 (potal-duty-rates-live-verify)
- 4/21 10:00 KST: Phase 2 cron 첫 실행 확인 (potal-phase2-cron-first-run)
- 5/1 19:00 KST: VAT + US tax monitor 확인 (potal-phase2-vat-ustax-verify)

## 잔여 작업
- vat-rate-monitor: EU redirect follow + AU User-Agent fix 필요
- de-minimis-monitor: 4/5 URL 404 — Scheduled task 리마인더로 대체 검토
- 3단계 (미래): 기존 모든 Scheduled task를 Auto Command Runner 패턴으로 마이그레이션

## 기존 백로그
- CW23 Sprint 1: 홈페이지 리디자인
- Product Hunt 재런칭
- CW36-S1 다국어 material 40%+ 개선

## 참고 문서
- docs/CW38_GHOST_TABLE_FIX.md
- docs/CW38_DATA_INFRASTRUCTURE_COMMANDS.md
- docs/CW38_AUTO_UPDATE_PIPELINE_COMMANDS.md
- docs/CW38_DB_REALITY_CHECK_COMMANDS.md
- docs/CW38_PHASE2_CRON_VERIFY_COMMANDS.md
- docs/AUTO_COMMAND_RUNNER_SETUP.md

---
## [Auto-saved] Compaction at 2026-04-17 17:43 KST
컨텍스트 압축 발생. 이전 대화가 요약됨.
압축 전 마지막 작업 내용은 session-context.md 및 엑셀 로그 참조.
