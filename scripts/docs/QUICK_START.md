# MacMap MIN/AGR 임포트 - 빠른 시작 가이드

## 1단계: 설치 (한 번만)

```bash
# pip 업데이트
pip3 install --upgrade pip

# psycopg2 설치
pip3 install psycopg2-binary
```

macOS에서 오류가 나면:
```bash
brew install libpq
pip3 install psycopg2-binary --force-reinstall
```

## 2단계: 데이터 준비

1. ITC MacMap 웹사이트에서 데이터 다운로드
2. 폴더 구조: `by_country/KOR/MAcMap-KOR_2023_Tariff_NTLC_mfn.txt` 등
3. 경로 메모: `/path/to/by_country`

## 3단계: Supabase 연결 정보 확인

1. Supabase 대시보드 접속
2. 프로젝트 → Settings → Database
3. Connection string 복사 (psycopg 형식)

예:
```
postgresql://postgres.abcdefg123:mypassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

## 4단계: 전체 임포트 실행

```bash
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres.PROJECTID:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres" \
  --data-dir "/path/to/by_country"
```

**실행 시간**: 50개 국가 기준 약 2-5분

## 5단계: 특정 국가만 테스트 (선택사항)

```bash
# 한국만 임포트해보기
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres.PROJECTID:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres" \
  --data-dir "/path/to/by_country" \
  --country KOR
```

## 6단계: 결과 확인

### Supabase 대시보드에서

```sql
-- MIN 데이터 확인
SELECT COUNT(*) FROM macmap_min_rates;

-- 국가별 행 수
SELECT reporter_iso2, COUNT(*) as count
FROM macmap_min_rates
GROUP BY reporter_iso2
ORDER BY count DESC;

-- 특정 국가의 데이터 보기 (한국 예시)
SELECT * FROM macmap_min_rates
WHERE reporter_iso2 = 'KR'
LIMIT 10;
```

### 임포트 중 출력 확인

```
[2026-03-07 18:00:02] [1/53] ARG 처리 중...
[2026-03-07 18:00:02]   MIN 파일: MAcMap-ARG_2023_Tariff_NTLC_mfn.txt
[2026-03-07 18:00:03]     MIN 임포트 완료: 5,000 행
[2026-03-07 18:00:03]   AGR ARG: 8,000 행 처리 중...
[2026-03-07 18:00:05]     AGR 임포트 완료: 8,000 행
```

각 국가별 처리 시간과 행 수가 표시됩니다.

## 옵션 조합

### MIN만 임포트
```bash
python3 import_min_agr_data.py \
  --db-url "..." --data-dir "..." --type min
```

### AGR만 임포트
```bash
python3 import_min_agr_data.py \
  --db-url "..." --data-dir "..." --type agr
```

### MIN과 AGR 모두 (기본값)
```bash
python3 import_min_agr_data.py \
  --db-url "..." --data-dir "..." --type both
```

## 성능 기대값

| 항목 | 값 |
|------|-----|
| 배치 크기 | 50,000행 |
| 임포트 속도 | 5,000-10,000 행/초 |
| 전체 53개국 | 2-5분 |
| 단일 국가 | 3-30초 |

## 문제 해결

### "ModuleNotFoundError: No module named 'psycopg2'"
```bash
pip3 install psycopg2-binary
```

### "connection refused"
- PostgreSQL 연결 URL 확인
- 인터넷 연결 확인
- Supabase 프로젝트가 활성화되었는지 확인

### "permission denied for schema public"
- Supabase에서 postgres 사용자의 권한 확인
- 다른 사용자로 접속 시도

### 특정 파일이 "인코딩을 감지할 수 없음"
- 데이터 파일이 UTF-8, Latin-1, CP1252 중 하나인지 확인
- 파일이 손상되지 않았는지 확인

## 추가 도움말

전체 설명서: `README_MIN_AGR_IMPORT.md` 참조

## 예상 결과 메시지

```
======================================================================
임포트 완료 요약
======================================================================
  ARE:    MIN      3,500 | AGR      5,200
  ARG:    MIN      5,000 | AGR      8,000
  AUS:    MIN     10,000 | AGR     15,000
  ... (50개국) ...
----------------------------------------------------------------------
  합계:    MIN    450,000 | AGR    750,000

총 시간: 150.5초
총 행 수: 1,200,000
평균 속도: 7,973 행/초
======================================================================
```

이렇게 나오면 성공입니다!
