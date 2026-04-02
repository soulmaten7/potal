# CW15 Cowork 후반 — Claude Code 업데이트 명령어
# 2026-03-16 14:30 KST
# Cowork에서 B2B Channel Strategy 엑셀 업데이트 완료 후 실행

---

## 1. 5개 문서 동기화 (CW15 Cowork 후반 추가 작업)

CLAUDE.md, session-context.md, .cursorrules, CHANGELOG.md, NEXT_SESSION_START.md에 아래 내용 추가:

**CW15 Cowork 후반 추가 성과:**
- B2B Channel Strategy 엑셀 전체 업데이트 (POTAL_B2B_Channel_Strategy.xlsx, 13시트)
  - 10개 채널 포스트 CW15 수치 반영 (50M+ mappings, ~148 endpoints, 21 crons, MCP registry, 60+ sources, UCP)
  - Core Messaging 업데이트 (경쟁사 비교표 포함)
  - Channel Overview 업데이트
  - Update Log 시트 신규 추가
  - X Twitter 단독 트윗 3개 신규 추가
  - LinkedIn POST 4 (UCP/AI Commerce) 신규 추가

---

## 2. 불필요 파일 정리 (archive/ 폴더로 이동)

아래 파일들은 이미 최신 파일로 대체되었거나 1회성 명령어로 더 이상 사용하지 않음. `archive/` 폴더로 이동:

### 루트 레벨 — 대체된 엑셀:
```bash
# 구버전 경쟁사 분석 (→ 최신: analysis/POTAL_Final_Feature_Analysis_v2.xlsx + POTAL_142_S_Grade_Complete_Plan.xlsx)
mv Competitor_Feature_Matrix.xlsx archive/
mv Enterprise_Pricing_Comparison.xlsx archive/

# 구버전 47기능 (→ 최신: POTAL_142_S_Grade_Complete_Plan.xlsx가 142기능 전부 커버)
mv POTAL_47_Victory_Strategy.xlsx archive/
```

### 루트 레벨 — 1회성 실행 명령어 (이미 실행 완료):
```bash
mv ALL_SPRINT_COMMANDS.md archive/
mv CLAUDE_CODE_3HR_SPRINT.md archive/
mv CLAUDE_CODE_ENTERPRISE_IMPLEMENTATION.md archive/
mv CLAUDE_CODE_FULL_SPRINT.md archive/
mv SPRINT1_COMMANDS.md archive/
mv SPRINT2_MERGED.md archive/
mv SPRINT3_MERGED.md archive/
mv SPRINT4_MERGED.md archive/
mv S_GRADE_CORE_TRADE_37_COMMAND.md archive/
mv PDF_LIBRARY_COMMAND.md archive/
mv HOMEPAGE_UX_SYNC_COMMAND.md archive/
mv HOMEPAGE_AUDIT_COMMAND.md archive/
```

### analysis/ — 대체된 구버전:
```bash
# 구버전 경쟁사/기능 분석 (→ 최신: POTAL_Final_Feature_Analysis_v2.xlsx + POTAL_142_S_Grade_Complete_Plan.xlsx)
mv analysis/Competitor_Feature_Matrix.xlsx archive/
mv analysis/Competitor_Pricing_Analysis.xlsx archive/
mv analysis/Enterprise_Pricing_Comparison.xlsx archive/
mv analysis/POTAL_33Features_Status.xlsx archive/
mv analysis/POTAL_44_MUST_Priority.xlsx archive/
mv analysis/POTAL_Complete_Feature_Analysis.xlsx archive/
mv analysis/POTAL_Revised_Feature_Analysis.xlsx archive/
mv analysis/POTAL_vs_Competitors_v2.xlsx archive/
mv analysis/POTAL_Cost_Analysis_45Features.xlsx archive/
mv analysis/POTAL_Competitor_Clients_Analysis.xlsx archive/
mv analysis/POTAL_S_Grade_Master_Plan.xlsx archive/  # 루트에도 있고 analysis에도 있음
```

### analysis/ — 유지:
```
analysis/POTAL_Final_Feature_Analysis_v2.xlsx  ← 142기능 최종 분석
analysis/POTAL_142_S_Grade_Complete_Plan.xlsx  ← S+ 업그레이드 마스터 플랜 (최신)
analysis/POTAL_142_Feature_Verification_CW14.xlsx  ← CW14 검증 결과
analysis/POTAL_Target_Analysis.xlsx  ← B2B 타겟 분석
analysis/HS_Code_Global_Data_Survey.xlsx  ← HS 데이터 서베이
analysis/POTAL_Operations_Structure.xlsx  ← 운영 구조
```

### docs/ — 1회성 명령어 (이미 실행 완료):
```bash
mv docs/CLAUDE_CODE_V4_UPDATE_COMMAND.md archive/
mv docs/ULTRA_VERIFY_PHASE1_COMMAND.md archive/
mv docs/ULTRA_VERIFY_PHASE2_COMMAND.md archive/
mv docs/ULTRA_VERIFY_PHASE3_COMMAND.md archive/
mv docs/ULTRA_VERIFY_PHASE4_COMMAND.md archive/
mv docs/ULTRA_VERIFY_PHASE2_3_4_COMBINED.md archive/
```

### docs/ — 유지:
```
docs/CHANGELOG.md  ← 변경 이력 (핵심)
docs/NEXT_SESSION_START.md  ← 다음 세션 가이드 (핵심)
docs/FULL_PROJECT_AUDIT.md  ← 감사 결과
docs/REGULATION_SOURCE_CATALOG.md  ← 규정 소스 카탈로그 (핵심)
docs/S_GRADE_VERIFICATION_REPORT.md  ← S+ 검증 보고서
docs/POTAL_결제_솔루션_조사.md  ← 결제 조사
docs/POTAL_ULTRA_VERIFICATION.md  ← 검증 결과
```

### 루트 레벨 — 유지:
```
CLAUDE.md  ← 핵심 지침
session-context.md  ← 프로젝트 맥락
.cursorrules  ← 코딩 표준
README.md  ← 프로젝트 설명
POTAL_B2B_Channel_Strategy.xlsx  ← B2B 채널 전략 (방금 업데이트 완료)
POTAL_D14_Finance_Tracker.xlsx  ← 재무 추적
POTAL_Pricing_Strategy_Analysis.xlsx  ← 가격 전략
POTAL_MVP_Launch_Checklist.xlsx  ← MVP 체크리스트
POTAL_UX_AUDIT_CW13.md  ← UX 감사
PRIVATE_BETA_LAUNCH_CHECKLIST.md  ← 베타 런칭
POTAL_SESSION_BOOT_SEQUENCE.md  ← 부트 시퀀스
FULL_PROJECT_AUDIT_COMMAND.md  ← 감사 명령어 (재사용)
REGULATION_DATA_COLLECTION_COMMAND.md  ← 규정 수집 (재사용)
WDC_PHASE4_V2_COMMAND.md  ← WDC v2 (진행중)
WDC_PHASE4_V2_UPLOAD_COMMAND.md  ← WDC 업로드 (진행중)
```

### marketing/ — 정리:
```bash
# Facebook 포스트는 B2B 전략 엑셀에 통합 가능하지만, 별도 채널이므로 유지
# Product Hunt 플랜은 엑셀 Sheet 4와 겹치지만, 이미지 에셋 연결되어 있으므로 유지
```

### .~lock 파일 정리:
```bash
rm -f analysis/.~lock.POTAL_142_S_Grade_Complete_Plan.xlsx#
rm -f analysis/.~lock.POTAL_Complete_Feature_Analysis.xlsx#
rm -f ~$POTAL_142_S_Grade_Complete_Plan.xlsx
rm -f .~lock.POTAL_B2B_Channel_Strategy.xlsx#
```

---

## 3. 루트 엑셀 중복 정리

루트에 있는 엑셀 중 analysis/에도 같은 파일이 있는 것들:
```bash
# 루트 Competitor_Feature_Matrix.xlsx = analysis/Competitor_Feature_Matrix.xlsx (둘 다 archive로)
# 루트 Enterprise_Pricing_Comparison.xlsx = analysis/Enterprise_Pricing_Comparison.xlsx (둘 다 archive로)
# 루트 POTAL_142_Feature_Verification_CW14.xlsx = analysis/ 것과 동일 → 루트 것 archive
mv POTAL_142_Feature_Verification_CW14.xlsx archive/
# 루트 POTAL_S_Grade_Master_Plan.xlsx = analysis/ 것의 구버전 → 루트 것 archive
mv POTAL_S_Grade_Master_Plan.xlsx archive/
```

---

## 4. git add + commit + push

```bash
git add -A
git commit -m "chore: CW15 B2B channel strategy update + file cleanup

- Update all 10 channel posts with CW15 data (50M+ mappings, ~148 endpoints, 21 crons, MCP registry, UCP)
- Add Update Log sheet to B2B Channel Strategy Excel
- Add LinkedIn POST 4 (AI Commerce/UCP) and X Twitter standalone tweets
- Move 20+ obsolete files to archive/ (old sprint commands, superseded analysis files)
- Clean up .~lock files

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

git push origin main
```

---

## 요약

| 작업 | 수량 |
|------|------|
| archive로 이동 | ~25개 파일 |
| 유지 (루트) | ~15개 |
| 유지 (analysis/) | 6개 |
| 유지 (docs/) | 7개 |
| .~lock 삭제 | 4개 |
| 5개 문서 업데이트 | 5개 |
