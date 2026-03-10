# MacMap MIN/AGR 임포트 - 사용 예시

## 시나리오 1: 로컬 PostgreSQL에 전체 데이터 임포트

**상황**: 로컬 개발 환경에서 테스트

```bash
# 1. 데이터 폴더 확인
ls -la ~/Downloads/itc_macmap/by_country/KOR/

# 2. 로컬 PostgreSQL 연결 확인
psql -U postgres -h localhost -d mydb -c "SELECT version();"

# 3. 스크립트 실행
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:mypassword@localhost:5432/mydb" \
  --data-dir "~/Downloads/itc_macmap/by_country"

# 예상 출력:
# [2026-03-07 18:00:00] 데이터베이스 연결 성공: localhost:5432/mydb
# [2026-03-07 18:00:01] 테이블 생성: macmap_min_rates (또는 이미 존재)
# ... 처리 진행 ...
# [2026-03-07 18:05:30] 합계: MIN 450,000 | AGR 750,000
```

## 시나리오 2: Supabase에 전체 데이터 임포트

**상황**: 프로덕션 환경, Supabase 사용

```bash
# 1. Supabase 대시보드에서 연결 정보 얻기
# Settings → Database → Connection string (psycopg)

# 2. 전체 53개국 임포트 (약 3-5분)
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres.abc123xyz:secure_password@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  --data-dir "/Users/john/Desktop/itc_macmap/by_country"

# 3. 진행 상황 모니터링
# [18:00:02] [1/53] ARE 처리 중...
# [18:00:03] [2/53] ARG 처리 중...
# ...
# [18:04:45] 합계: MIN 450,000 | AGR 750,000
```

## 시나리오 3: 특정 국가만 임포트 (테스트)

**상황**: 한국 데이터만 테스트해보기

```bash
# 한국만 임포트
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:password@localhost:5432/mydb" \
  --data-dir "~/data/itc_macmap/by_country" \
  --country KOR

# 출력:
# [18:00:02] 데이터베이스 연결 성공: localhost:5432/mydb
# [18:00:02] 테이블 생성: macmap_min_rates (또는 이미 존재)
# [18:00:02] 처리할 국가: 1개
#
# [18:00:03] [1/1] KOR 처리 중...
# [18:00:03]   MIN 파일: MAcMap-KOR_2023_Tariff_NTLC_mfn.txt
# [18:00:04]   MIN KOR: 50,000 행 처리 중...
# [18:00:05]     MIN 임포트 완료: 50,000 행
# [18:00:05]   AGR 파일: MAcMap-KOR_2023_Tariff_NTLC_agr.txt
# [18:00:06]   AGR KOR: 100,000 행 처리 중...
# [18:00:08]     AGR 임포트 완료: 100,000 행
# [18:00:08]   KOR 완료: 150,000 행, 5.2초
# [18:00:08]     속도: 28,846 행/초
#
# ======================================================================
# 임포트 완료 요약
# ======================================================================
#   KOR:    MIN      50,000 | AGR     100,000
# ----------------------------------------------------------------------
#   합계:    MIN      50,000 | AGR     100,000
#
# 총 시간: 5.2초
# 총 행 수: 150,000
# 평균 속도: 28,846 행/초
# ======================================================================
```

## 시나리오 4: MIN만 임포트 (협상된 관세만)

**상황**: 다국간 협상 데이터만 필요

```bash
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:password@db.example.com:5432/tariffs" \
  --data-dir "/data/macmap/by_country" \
  --type min

# 출력:
# [18:00:00] 처리할 국가: 53개
# [18:00:01] [1/53] ARE 처리 중...
# [18:00:01]   MIN 파일: MAcMap-ARE_2023_Tariff_NTLC_mfn.txt
# [18:00:02]   MIN ARE: 5,000 행 처리 중...
# [18:00:02]     MIN 임포트 완료: 5,000 행
# ...
# 합계: MIN 450,000 행만 임포트됨 (AGR은 스킵)
```

## 시나리오 5: AGR만 임포트 (협정 기반 관세만)

**상황**: 양자 협정 데이터만 필요

```bash
python3 import_min_agr_data.py \
  --db-url "postgresql://user:pass@host:5432/db" \
  --data-dir "/data/macmap/by_country" \
  --type agr

# 출력: AGR 데이터만 처리됨
# 합계: AGR 750,000 행만 임포트됨 (MIN은 스킵)
```

## 시나리오 6: 오류 복구 및 재실행

**상황**: 네트워크 오류로 중단 후 재시작

```bash
# 첫 시도 (실패)
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:old_password@old_host:5432/db" \
  --data-dir "/data/macmap/by_country"
# 오류: 데이터베이스 연결 실패

# 연결 정보 확인 후 다시 시도
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:new_password@new_host:5432/db" \
  --data-dir "/data/macmap/by_country"

# 주의: 이전에 성공했던 데이터는 UNIQUE 제약으로 스킵됨
# (같은 (reporter_iso2, product_code, partner_iso2, data_year) 조합은 INSERT 안 됨)
```

## 시나리오 7: 여러 데이터 버전 관리

**상황**: 2022, 2023, 2024 데이터 모두 저장

```bash
# 각 연도별 디렉토리에서 임포트
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:password@host:5432/db" \
  --data-dir "/data/itc_macmap_2022/by_country"

python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:password@host:5432/db" \
  --data-dir "/data/itc_macmap_2023/by_country"

python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:password@host:5432/db" \
  --data-dir "/data/itc_macmap_2024/by_country"

# 데이터베이스에는 모든 연도의 데이터가 저장됨
# data_year 필드로 구분 가능
```

## 시나리오 8: 특정 국가 그룹 임포트

**상황**: ASEAN 국가들만 임포트

```bash
# 방법 1: 각각 개별 실행 (권장하지 않음)
for country in KOR JPN CHN IDN MYS THA PHL VNM SGP; do
  echo "Processing $country..."
  python3 import_min_agr_data.py \
    --db-url "postgresql://postgres:password@host:5432/db" \
    --data-dir "/data/macmap/by_country" \
    --country $country
done

# 방법 2: 환경 변수 사용
COUNTRIES="KOR JPN CHN IDN MYS THA PHL VNM SGP"
for country in $COUNTRIES; do
  python3 import_min_agr_data.py \
    --db-url "$DB_URL" \
    --data-dir "$DATA_DIR" \
    --country $country
done
```

## 시나리오 9: 스크립트 결과 로깅

**상황**: 임포트 결과를 파일에 저장

```bash
# 로그 파일에 저장
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:password@host:5432/db" \
  --data-dir "/data/macmap/by_country" \
  2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).txt

# 생성된 파일: import_log_20260307_180000.txt
# 내용: 모든 출력 메시지 포함
```

## 시나리오 10: 배경 프로세스로 실행 (nohup)

**상황**: 터미널을 닫고도 임포트 계속 실행

```bash
# nohup으로 백그라운드 실행
nohup python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:password@host:5432/db" \
  --data-dir "/data/macmap/by_country" \
  > import_output.log 2>&1 &

# 프로세스 ID 확인
jobs -l

# 로그 실시간 확인
tail -f import_output.log

# 프로세스 종료 (필요 시)
kill %1
```

## 시나리오 11: 성능 측정

**상황**: 임포트 성능 테스트

```bash
# 시간 측정
time python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:password@host:5432/db" \
  --data-dir "/data/macmap/by_country" \
  --country KOR

# 출력:
# real    0m5.234s
# user    0m2.145s
# sys     0m0.892s

# 속도 계산: 150,000행 / 5.234초 = 28,646행/초
```

## 시나리오 12: Docker 컨테이너에서 실행

**상황**: Docker 환경에서 자동화

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY import_min_agr_data.py .

RUN pip install psycopg2-binary

ENTRYPOINT ["python3", "import_min_agr_data.py"]
```

```bash
# 빌드
docker build -t macmap-importer .

# 실행
docker run \
  -v /data/macmap:/data \
  macmap-importer \
  --db-url "postgresql://..." \
  --data-dir "/data/by_country"
```

## 시나리오 13: 데이터 검증 쿼리

**상황**: 임포트 후 데이터 검증

```sql
-- 1. 국가별 데이터 수 확인
SELECT reporter_iso2, COUNT(*) as count
FROM macmap_min_rates
GROUP BY reporter_iso2
ORDER BY count DESC;

-- 출력:
-- reporter_iso2 | count
-- ---------------+--------
-- KR            | 50,000
-- US            | 45,000
-- CN            | 52,000
-- ...

-- 2. 연도별 데이터 확인
SELECT data_year, COUNT(*) as count
FROM macmap_min_rates
GROUP BY data_year
ORDER BY data_year DESC;

-- 3. M49 변환 검증 (예: 'XX' 기본값 사용 여부)
SELECT partner_iso2, COUNT(*) as count
FROM macmap_min_rates
WHERE partner_iso2 = 'XX'
GROUP BY partner_iso2;

-- 4. 특정 국가-상품-파트너 조합 조회
SELECT *
FROM macmap_min_rates
WHERE reporter_iso2 = 'KR'
  AND product_code = '010110'
  AND partner_iso2 = 'CN'
ORDER BY data_year DESC;

-- 5. NULL 값 확인
SELECT COUNT(*) as null_duties
FROM macmap_min_rates
WHERE av_duty IS NULL;

-- 6. 중복 확인 (UNIQUE 제약 때문에 없어야 함)
SELECT reporter_iso2, product_code, partner_iso2, data_year, COUNT(*) as cnt
FROM macmap_min_rates
GROUP BY reporter_iso2, product_code, partner_iso2, data_year
HAVING COUNT(*) > 1;
```

## 시나리오 14: 점진적 업데이트

**상황**: 새 연도 데이터 추가

```bash
# 기존 데이터는 유지하고 새 데이터만 추가
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres:password@host:5432/db" \
  --data-dir "/data/itc_macmap_2024/by_country"

# UNIQUE 제약에 의해:
# - 2024 데이터: 신규 삽입
# - 2023 데이터: 스킵 (ON CONFLICT DO NOTHING)
# - 2022 데이터: 그대로 유지
```

## 시나리오 15: 모니터링 및 알림

**상황**: cron 작업으로 자동 실행 및 모니터링

```bash
#!/bin/bash
# /usr/local/bin/run_macmap_import.sh

DB_URL="postgresql://postgres:password@host:5432/db"
DATA_DIR="/data/macmap/by_country"
LOG_FILE="/var/log/macmap_import.log"
ERROR_EMAIL="admin@example.com"

python3 /app/import_min_agr_data.py \
  --db-url "$DB_URL" \
  --data-dir "$DATA_DIR" \
  > "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "SUCCESS: MacMap import completed" | mail -s "MacMap Import Report" "$ERROR_EMAIL"
else
    echo "ERROR: MacMap import failed. Check $LOG_FILE" | mail -s "MacMap Import Failed" "$ERROR_EMAIL"
fi
```

```bash
# crontab 설정 (매일 새벽 2시 실행)
0 2 * * * /usr/local/bin/run_macmap_import.sh
```

## 실행 결과 요약

모든 시나리오에서 최종적으로 다음과 같은 요약이 표시됩니다:

```
======================================================================
임포트 완료 요약
======================================================================
  ARE:    MIN      3,500 | AGR      5,200
  ARG:    MIN      5,000 | AGR      8,000
  AUS:    MIN     10,000 | AGR     15,000
  ... (더 많은 국가들) ...
----------------------------------------------------------------------
  합계:    MIN    450,000 | AGR    750,000

총 시간: 150.5초
총 행 수: 1,200,000
평균 속도: 7,973 행/초
======================================================================
```

이 요약에서:
- **MIN**: 다국간 협상 관세율
- **AGR**: 양자 협정 기반 관세율
- **합계**: 모든 행의 합
- **평균 속도**: 초당 처리한 행의 수 (네트워크 포함)
