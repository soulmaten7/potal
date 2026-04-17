# 다음 세션 시작점
> 마지막 업데이트: 2026-04-17 KST

## 이전 세션 (CW38 — Phase 1~5 완료)
- Phase 1: DB 전환 + Ghost Table Fix (b3d905d)
- Phase 2: Auto-Update Pipeline — VAT/de minimis/US tax cron 3개 (cf705a1)
- Phase 3: DB 진단 — 핵심 테이블 OK, cron 5개 green, MacMap DB 실사용 확인 (0ce9ee7)
- Phase 4: us-tax-monitor URL 수정 (48dcdac)
- Phase 5: Auto Command Runner 브릿지 + Scheduled Tasks 6개 연결 (8fa6c76)
- **전체 자동화 체인 검증 완료**: Scheduled task → Mac .md 파일 생성 → launchd 10분 감지 → Claude Code 자동 실행

## 자동화 현황 (팩트 기반)
- **검증 완료 자동 업데이트 (5개)**: 환율, SDN, Federal Register, TARIC RSS, update-tariffs
- **구축 완료 미검증 (3개)**: VAT, de minimis, US tax — 스케줄 첫 실행 대기
- **Scheduled task 연동 (6개)**: annual/quarterly/semiannual + 일회성 3개 → auto-commands 패턴
- **하드코딩 전용 (4개)**: restrictions, shipping-rates, IOSS, section301
- **정적 분류 데이터 (7개+)**: codified JSON, HS descriptions 등

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
