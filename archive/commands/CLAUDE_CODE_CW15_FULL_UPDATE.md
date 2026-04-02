# CW15 Cowork — 전체 업데이트 명령어
# 2026-03-16 16:00 KST

---

## 이 명령어가 하는 것:
1. 5개 핵심 문서 업데이트 (CW15 Cowork 전체 성과 반영)
2. 규정 소스 카탈로그에 HS 분류 데이터 소스 추가
3. 새 데이터 소스 자동화 Cron 설계
4. 불필요 파일 archive/ 이동
5. .~lock 파일 정리

---

## 1. 5개 문서 동기화

CLAUDE.md, session-context.md, .cursorrules, CHANGELOG.md, NEXT_SESSION_START.md에 아래 내용 추가:

### CW15 Cowork 전체 성과 (2026-03-16 09:30~16:00+ KST):

**B2B Channel Strategy 엑셀 전체 업데이트 (POTAL_B2B_Channel_Strategy.xlsx, 13시트):**
- 10개 채널 포스트 CW15 수치 반영 (50M+ mappings, ~148 endpoints, 21 crons, MCP registry, 60+ sources, UCP)
- Core Messaging 업데이트 (경쟁사 비교표)
- Channel Overview 업데이트
- Update Log 시트 신규 추가
- X Twitter 단독 트윗 3개 + LinkedIn POST 4 (UCP/AI Commerce) 신규

**CBP Benchmark Test 준비:**
- arXiv:2412.14179 논문 방법론 재현 — CBP CROSS rulings 100건 무작위 테스트 데이터 준비
- /Volumes/soulmaten/POTAL/benchmark_test_data.json (100건, 95 HS 챕터, 39.4KB)
- 경쟁사 벤치마크: Tarifflo 89%, Avalara 80%, Zonos 44%, WCO BACUDA 13%
- DB 정상화 후 POTAL API 벤치마크 실행 예정
- CBP_BENCHMARK_TEST_COMMAND.md 생성

**CBP CROSS HS Mappings 추출 완료:**
- CBP CROSS rulings 220,114건에서 product_hs_mappings 형식으로 변환
- cbp_cross_combined_mappings.csv: **142,251건** (중복 제거, DB 로딩용)
  - 산업용 53,540건 (38%) — Ch.84 기계, Ch.85 전기, Ch.29 유기화학, Ch.39 플라스틱, Ch.73 철강, Ch.90 정밀기기
  - 소비재 88,711건 (62%) — 의류, 완구, 가구 등
- cbp_cross_hs_mappings.csv: 23,611건 (full text, description 포함)
- cbp_cross_search_mappings.csv: 120,571건 (subject만, description 없음)
- 스크립트: scripts/extract_cbp_cross_mappings.py
- 저장: /Volumes/soulmaten/POTAL/
- **\copy로 DB 적재 예정** (product_hs_mappings에 추가)

**HS 분류 데이터 소스 마스터 목록 (docs/HS_CLASSIFICATION_DATA_SOURCES.md):**
- Claude Code 1번에서 조사 진행 중
- 5개 카테고리: 국가별 분류 결정문, 신상품/신기술, 농산물/식품, 군수/이중용도, B2B 산업 데이터
- 각 소스별 URL, 형식, 건수, 접근방법, 자동화 가능 여부

**product_hs_mappings 벌크 업로드 진행 중:**
- Claude Code 2번에서 chunk별 \copy 진행 중
- part_01: 11개 chunk (각 50만줄, 71-79MB)
- part_02~10: 아직 미분할

**포스트 톤 전략 변경:**
- 기존: "The most accurate landed cost API on the planet" (근거 없는 주장)
- 변경: "CBP benchmark XX% 정확도" + 약점 공개 + 개선 과정 투명 공유 (스타트업다운 톤)
- 벤치마크 결과 공개 자체가 마케팅 콘텐츠 (DEV.to, HN 소재)

### CLAUDE.md 핵심 수치 업데이트:
- product_hs_mappings: **~1.36M** → **~1.36M + CBP 142K = ~1.5M** (v2 \copy 완료 시 ~50M+)
- CBP CROSS HS 매핑: **142,251건** 추출 완료 (산업용 38%, 소비재 62%)
- 벤치마크: CBP 100건 테스트 데이터 준비 완료

---

## 2. 불필요 파일 archive/ 이동

```bash
cd /Users/maegbug/potal

# 루트 — 대체된 엑셀
mv Competitor_Feature_Matrix.xlsx archive/ 2>/dev/null
mv Enterprise_Pricing_Comparison.xlsx archive/ 2>/dev/null
mv POTAL_47_Victory_Strategy.xlsx archive/ 2>/dev/null
mv POTAL_142_Feature_Verification_CW14.xlsx archive/ 2>/dev/null
mv POTAL_S_Grade_Master_Plan.xlsx archive/ 2>/dev/null

# 루트 — 1회성 실행 명령어
mv ALL_SPRINT_COMMANDS.md archive/ 2>/dev/null
mv CLAUDE_CODE_3HR_SPRINT.md archive/ 2>/dev/null
mv CLAUDE_CODE_ENTERPRISE_IMPLEMENTATION.md archive/ 2>/dev/null
mv CLAUDE_CODE_FULL_SPRINT.md archive/ 2>/dev/null
mv SPRINT1_COMMANDS.md archive/ 2>/dev/null
mv SPRINT2_MERGED.md archive/ 2>/dev/null
mv SPRINT3_MERGED.md archive/ 2>/dev/null
mv SPRINT4_MERGED.md archive/ 2>/dev/null
mv S_GRADE_CORE_TRADE_37_COMMAND.md archive/ 2>/dev/null
mv PDF_LIBRARY_COMMAND.md archive/ 2>/dev/null
mv HOMEPAGE_UX_SYNC_COMMAND.md archive/ 2>/dev/null
mv HOMEPAGE_AUDIT_COMMAND.md archive/ 2>/dev/null

# analysis/ — 대체된 구버전
mv analysis/Competitor_Feature_Matrix.xlsx archive/ 2>/dev/null
mv analysis/Competitor_Pricing_Analysis.xlsx archive/ 2>/dev/null
mv analysis/Enterprise_Pricing_Comparison.xlsx archive/ 2>/dev/null
mv analysis/POTAL_33Features_Status.xlsx archive/ 2>/dev/null
mv analysis/POTAL_44_MUST_Priority.xlsx archive/ 2>/dev/null
mv analysis/POTAL_Complete_Feature_Analysis.xlsx archive/ 2>/dev/null
mv analysis/POTAL_Revised_Feature_Analysis.xlsx archive/ 2>/dev/null
mv analysis/POTAL_vs_Competitors_v2.xlsx archive/ 2>/dev/null
mv analysis/POTAL_Cost_Analysis_45Features.xlsx archive/ 2>/dev/null
mv analysis/POTAL_Competitor_Clients_Analysis.xlsx archive/ 2>/dev/null
mv analysis/POTAL_S_Grade_Master_Plan.xlsx archive/ 2>/dev/null

# docs/ — 1회성 명령어
mv docs/CLAUDE_CODE_V4_UPDATE_COMMAND.md archive/ 2>/dev/null
mv docs/ULTRA_VERIFY_PHASE1_COMMAND.md archive/ 2>/dev/null
mv docs/ULTRA_VERIFY_PHASE2_COMMAND.md archive/ 2>/dev/null
mv docs/ULTRA_VERIFY_PHASE3_COMMAND.md archive/ 2>/dev/null
mv docs/ULTRA_VERIFY_PHASE4_COMMAND.md archive/ 2>/dev/null
mv docs/ULTRA_VERIFY_PHASE2_3_4_COMBINED.md archive/ 2>/dev/null

# .~lock 파일 정리
rm -f analysis/.~lock.POTAL_142_S_Grade_Complete_Plan.xlsx#
rm -f analysis/.~lock.POTAL_Complete_Feature_Analysis.xlsx#
rm -f .~lock.POTAL_B2B_Channel_Strategy.xlsx#
rm -f analysis/~\$POTAL_142_S_Grade_Complete_Plan.xlsx
```

---

## 3. 새 HS 분류 데이터 소스 자동화 설계

docs/HS_CLASSIFICATION_DATA_SOURCES.md 완성 후, 각 소스에 대해 자동 수집 Cron 설계:

### 신규 Cron 후보 (기존 21개에 추가):
- `ebti-ruling-monitor` — EU EBTI 분류 결정문 변경 감지 (매주)
- `uk-atar-monitor` — UK ATaR 새 결정문 감지 (매주)
- `cbp-cross-update` — CBP CROSS 신규 rulings 수집 (매주)
- `wco-classification-monitor` — WCO 분류 의견서 업데이트 (매월)
- `usda-agricultural-monitor` — USDA 농산물 분류 변경 (매월)

패턴: 기존 Cron과 동일 (CRON_SECRET 인증 + health_check_logs + Resend 이메일 알림)

### 데이터 파이프라인 (수집 → DB):
1. Cron이 소스 변경 감지
2. 새 ruling/결정문 다운로드
3. product_name + hs_code 추출 (GPT-4o or 스크립트)
4. product_hs_mappings에 INSERT
5. hs_classification_vectors 업데이트 (필요 시)

---

## 4. git commit (파일 정리 + 문서 업데이트 후)

```bash
git add -A
git commit -m "chore: CW15 full update — B2B posts, CBP benchmark, file cleanup

- Update B2B Channel Strategy (13 sheets, CW15 data)
- Add CBP benchmark test data (100 items, 95 chapters)
- Extract CBP CROSS HS mappings (142,251 items)
- HS Classification Data Sources master list
- Move 25+ obsolete files to archive/
- Update 5 core documents with CW15 progress
- Clean up .~lock files

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 주의사항
- git push는 은태님이 Mac 터미널에서 직접 실행
- \copy 진행 중인 Claude Code 2번과 충돌하지 않도록 DB 쿼리 최소화
- 숫자는 session-context.md 기준으로만 사용 (추정치 금지)
