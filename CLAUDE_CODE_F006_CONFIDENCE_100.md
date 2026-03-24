# F006 Confidence Score — 95% → 100% 업그레이드
# Claude Code 터미널 2 전용
# 2026-03-24 KST

## 절대 규칙
- **이 기능(F006)만 작업한다.** 다른 기능 절대 건드리지 않는다
- **5번 검수 후 100% 달성을 확인하고 나서만 완료 처리한다**
- **npm run build 통과 필수**
- **엑셀 로그 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## 1단계: 현재 상태 분석

관련 파일 전부 읽고, 각 파일의 현재 구현 상태를 정리해라:

```bash
cat app/lib/classification/confidence-calibration.ts
cat app/lib/cost-engine/ai-classifier/confidence-score.ts
cat app/lib/cost-engine/ai-classifier/explainability.ts
cat app/api/v1/classify/confidence/route.ts
cat app/api/v1/classify/route.ts
cat app/lib/cost-engine/hs-code/types.ts
cat supabase/migrations/037_s_grade_upgrade.sql
cat supabase/migrations/023_classification_audit.sql
```

분석할 것:
- 각 파일이 하는 역할
- 현재 동작하는 부분 vs 동작하지 않는 부분
- 하드코딩된 값 (특히 PLATT_A, PLATT_B, default 0.85 등)
- TODO 주석이 있는 곳

---

## 2단계: GAP 목록 확정

아래 6개 GAP을 검증하고, 추가 GAP이 있으면 발견해라:

| # | GAP | 현재 상태 | 목표 |
|----|-----|----------|------|
| 1 | Platt 파라미터 미보정 | PLATT_A=-1.5, PLATT_B=0.2 임의값 | 벤치마크 기반 실제 보정값 OR 보정 불가능하면 Platt 제거하고 직접 계산 |
| 2 | classification_feedback 데이터 0건 | default 0.85 반환 | 시드 데이터 삽입 OR feedback 없을 때 fallback 로직 명확화 |
| 3 | lookupRulingReference() 미구현 | null 반환 | CBP CROSS 데이터 활용하거나, 없으면 스텁 아닌 실제 fallback |
| 4 | Hard Chapter 하드코딩 | Ch.84,85,90,38,39만 | 실제 벤치마크 기반 어려운 챕터 목록 확장 |
| 5 | data_sources 표시 정확성 | "156 records" 같은 하드코딩? | 실제 DB 쿼리 결과 반영 |
| 6 | confidence 3종 중복 | confidence, confidence_detail, confidenceScore 3개 | 일관성 있는 단일 구조 또는 명확한 계층 구조 |

---

## 3단계: GAP별 수정

**GAP 1: Platt 파라미터**
- 현재 벤치마크 데이터가 충분하지 않으므로 Platt scaling을 제거하고 직접 계산 방식으로 전환
- 또는 Amazon 50건 벤치마크 결과 (100% 정확도)와 HSCodeComp 632건 결과를 기반으로 realistic한 파라미터 설정
- TODO 주석 제거하고 실제 로직으로 교체

**GAP 2: classification_feedback 빈 테이블**
- feedback 0건일 때 default 0.85가 아니라, 실제 파이프라인 성능 기반값 사용
- Layer 1 (9-field 완벽 입력) = 100% → feedback 없어도 confidence 1.0
- Layer 2 (불완전 입력) = field 개수에 따라 차등
- Amazon 50건 ablation 결과 반영:
  - 9/9 field = 100% → confidence 1.0
  - material 빠지면 -45% → confidence 0.55
  - category 빠지면 -33% → confidence 0.67
  - product_name만 = ~6% → confidence 0.06

**GAP 3: lookupRulingReference()**
- CBP CROSS 220K + EU EBTI 270K가 외장하드에 있지만 DB에 아직 안 올라감
- 현재는 null 대신 "ruling_reference: 'not_available'" 같은 명시적 상태 반환
- 스텁이 아니라 "데이터 미로딩" 상태를 정직하게 표현

**GAP 4: Hard Chapter 확장**
- HSCodeComp 632건 벤치마크에서 Chapter 정확도 0%인 챕터:
  - Ch.67 (가발/조화), Ch.82 (공구류), Ch.83 (비금속 잡제품), Ch.49 (인쇄물), Ch.63 (기타 섬유)
- 기존 Ch.84,85,90,38,39에 위 5개 추가
- 각 챕터별 실제 벤치마크 정확도를 기반으로 penalty 설정

**GAP 5: data_sources 정확성**
- "156 records" 같은 하드코딩 제거
- 실제 DB 쿼리: `SELECT COUNT(*) FROM classification_feedback` 결과 사용
- product_hs_mappings: 실제 행 수 (`~1.36M`) 반영
- gov_tariff_schedules: 실제 행 수 (`131,794`) 반영

**GAP 6: confidence 3종 일관성**
- 3가지 confidence 응답이 서로 다른 값을 줄 수 있음
- 하나의 소스(confidence-calibration.ts)에서 계산 → 나머지는 그 값을 참조하는 구조로 통일
- 또는 각각의 역할을 API 문서에 명확히 기술

---

## 4단계: 검수 (5번 반복)

### 검수 1: 단위 테스트
```bash
# confidence 계산 테스트 — 다양한 입력 조합
# 테스트 케이스 최소 10개:
# 1. 9/9 field 완벽 입력 → confidence >= 0.95
# 2. product_name만 → confidence < 0.30
# 3. product_name + material + category → confidence >= 0.80
# 4. cache hit → confidence >= 0.95
# 5. fallback 분류 → confidence < 0.50
# 6. HS Code 9999xx → confidence < 0.20
# 7. Ch.84 제품 → hard chapter penalty 적용 확인
# 8. Ch.67 제품 → 새로 추가한 penalty 적용 확인
# 9. feedback 0건 → default 로직 정상 동작
# 10. data_sources에 하드코딩 값 없는지 확인
```

### 검수 2: API 응답 검증
```bash
# /api/v1/classify 호출 시 confidence 응답 구조 확인
# /api/v1/classify/confidence 호출 시 응답 구조 확인
# 두 엔드포인트의 confidence 값이 일관성 있는지 확인
```

### 검수 3: 엣지 케이스
```bash
# - hs_code가 빈 문자열일 때
# - match_score가 0일 때
# - match_score가 1.0일 때
# - product_name이 1글자일 때
# - alternatives가 10개 이상일 때
# - DB 연결 실패 시 fallback 동작
```

### 검수 4: 빌드 + 타입 체크
```bash
npm run build 2>&1 | tail -30
npx tsc --noEmit 2>&1 | head -20
```

### 검수 5: 코드 리뷰
- TODO 주석 0개 확인
- 하드코딩된 숫자 0개 확인 (상수는 OK, 매직넘버 NO)
- console.log 0개 확인
- 모든 함수에 JSDoc 또는 주석 있는지 확인

---

## 5단계: 완료 조건

아래 전부 충족해야 F006 = 100%:
- [ ] Platt 임의 파라미터 제거 또는 실제 데이터 기반 보정
- [ ] classification_feedback 0건일 때 ablation 기반 confidence 반환
- [ ] lookupRulingReference() 스텁 → 명시적 상태 반환
- [ ] Hard Chapter 목록 벤치마크 기반 확장 (5개→10개+)
- [ ] data_sources 하드코딩 제거, 실제 DB 수치 반환
- [ ] confidence 3종 일관성 확보
- [ ] 단위 테스트 10개 PASS
- [ ] 엣지 케이스 테스트 PASS
- [ ] npm run build 통과
- [ ] TODO 주석 0개, 하드코딩 0개, console.log 0개
- [ ] 엑셀 로그 기록 완료

---

## 6단계: 커밋

```bash
git add -A
git commit -m "$(cat <<'EOF'
F006 Confidence Score: 95% → 100% production upgrade

- Platt scaling 보정 또는 제거
- Ablation 기반 field-count confidence 반영
- Hard chapter 목록 벤치마크 기반 확장
- data_sources 실제 DB 수치 반환
- confidence 3종 일관성 통일
- 단위 테스트 10개 + 엣지 케이스 PASS

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
git push 2>&1
```

**이 기능이 100% 완료되면 보고하고, 다음 기능(F012) 명령어를 기다려라. 절대 다음 기능을 스스로 시작하지 마라.**
