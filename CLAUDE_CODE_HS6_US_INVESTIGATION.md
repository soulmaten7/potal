# Claude Code 명령어: US HS6 문제 조사 + 엑셀 로깅 규칙 적용

---

## 1. 엑셀 로깅 규칙 (이번 세션부터 적용, CLAUDE.md 절대 규칙 11번에 추가됨)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.

- **파일 위치**: portal 루트 폴더 (`POTAL_Claude_Code_Work_Log.xlsx`)
- **시트 규칙**: 새 작업 시작할 때마다 새 시트 생성. 시트 이름 = `YYMMDDHHMM` (예: `2603211315` = 26년03월21일 13시15분). 하나의 명령어 세션 = 하나의 시트
- **열 구조**: A:순번 | B:시간(HH:MM:SS KST) | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **구분 값**: `COMMAND`(실행 명령어) / `RESULT`(실행 결과) / `ANALYSIS`(분석) / `DECISION`(결정 사항+근거) / `ERROR`(에러) / `FIX`(수정)
- **상태 값**: ✅성공 / ❌실패 / ⏳진행중 / 🔄수정
- **기록 디테일 수준 (핵심!)**:
  - COMMAND: 실행한 명령어/코드 **그대로** 기록. 요약 금지
  - RESULT: 결과 **전체** 기록. npm run build 출력, 에러 메시지 전문, 테스트 출력 전체
  - ANALYSIS: DB 쿼리 결과는 쿼리문 + 행 수 + **샘플 5건 이상**
  - ERROR: 에러 메시지 **전문** + 스택트레이스
  - FIX: **변경 전 코드 + 변경 후 코드** 둘 다 기록
- **필수 기록 항목**: (1)DB 쿼리→쿼리문+결과행수+샘플 (2)파일 생성/수정→전체 코드 또는 diff (3)npm run build→전체 출력 (4)테스트→케이스별 입력/출력/PASS여부 (5)수정→변경 전/후
- **시트 마감**: 작업 끝나면 마지막 행에 `=== 작업 종료 === | 총 소요시간 | 빌드 결과 | 테스트 X/N PASS | 생성파일 N개 | 수정파일 N개`
- **Python openpyxl 사용**: `pip install openpyxl --break-system-packages` 후 사용. 엑셀 파일이 없으면 새로 생성, 있으면 기존 파일에 시트 추가

---

## 2. 작업: US HS6-only 문제 조사

### 배경
이전 세션에서 v3 파이프라인 테스트 5개 중 Cotton T-Shirt → US 결과:
```
S11 Ch61 H6109 HS6=610910, Final: 610910 (HS6)
```

US는 지원 국가 (gov_tariff_schedules에 US 28,718행)인데 **Final이 HS6(6자리)로만 나왔다.**
Step 4 (Country Router)가 10자리로 확장하지 못한 것. 원인을 찾아야 한다.

### 조사 순서

**먼저 `POTAL_Claude_Code_Work_Log.xlsx`를 읽어서 이전 테스트 결과의 전체 내용을 확인해라.** 시트 `2603210126`과 `2603211027`에 기록이 있다.

그 다음 아래 순서로 조사:

#### Step 1: DB에 데이터가 있는지 확인
```sql
-- gov_tariff_schedules에서 US + 610910으로 시작하는 코드 검색
SELECT hs_code, description, duty_rate
FROM gov_tariff_schedules
WHERE country = 'US' AND hs_code LIKE '610910%'
ORDER BY hs_code;

-- 결과가 0건이면 → 6109로 확대
SELECT hs_code, description, duty_rate
FROM gov_tariff_schedules
WHERE country = 'US' AND hs_code LIKE '6109%'
ORDER BY hs_code;

-- 전체 US 데이터에서 HS code 형식 샘플 확인 (점 포함 여부)
SELECT hs_code FROM gov_tariff_schedules
WHERE country = 'US'
ORDER BY hs_code
LIMIT 20;
```

#### Step 2: HS code 형식 문제 확인
DB에 `6109.10.00.12` 같은 점 포함 형식으로 저장되어 있을 수 있다.
base-agent.ts Line 41은 `.like('hs_code', '${hs6}%')`로 조회한다.
만약 DB가 `6109.10.00.12`인데 쿼리가 `610910%`이면 LIKE 매칭 안 됨.

```sql
-- 형식 확인: 점(.) 포함 여부
SELECT hs_code FROM gov_tariff_schedules
WHERE country = 'US' AND hs_code LIKE '%6109%'
LIMIT 10;
```

#### Step 3: Country Agent 코드 확인
```
app/lib/cost-engine/gri-classifier/country-agents/base-agent.ts Line 41:
  .like('hs_code', `${hs6}%`)

hs6 = "610910" → 쿼리: hs_code LIKE '610910%'
DB 형식이 "6109.10.00.12" → LIKE '610910%'는 매칭 안 됨
```

이게 원인이면:
- DB 저장 형식 확인 (점 포함 vs 숫자만)
- base-agent.ts의 LIKE 쿼리가 형식에 맞는지 확인
- 불일치면 수정 방안 제시 (base-agent.ts 수정 or DB 형식 통일)

#### Step 4: 다른 가능한 원인들
- Supabase 환경변수 (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 세팅 안 됨 → base-agent가 null 반환
- step5-country-router.ts에서 에러 catch → null 반환 → pipeline이 HS6로 폴백
- country-agents/index.ts에서 "US" 매칭 안 됨 (대소문자?)

### 결과 정리
조사 끝나면 원인을 정확히 특정하고, 다음 중 하나로 결론:

1. **데이터 없음**: gov_tariff_schedules에 610910 관련 US 데이터 0건 → 데이터 추가 필요
2. **형식 불일치**: DB는 점 포함, 쿼리는 숫자만 → base-agent.ts LIKE 쿼리 수정 필요
3. **환경변수 누락**: Supabase 연결 안 됨 → 테스트 환경에서 env 확인
4. **코드 버그**: routeToCountry나 country agent 로직 문제 → 수정 필요
5. **기타**: 위에 없는 원인이면 상세히 기록

**엑셀에 조사 과정 전체를 기록할 것. DB 쿼리 결과는 전체 행 + 샘플 필수.**
