# POTAL AGR 임포트 스크립트 설계

> 작성일: 2026-03-08 (세션 35)
> 상태: 설계 문서 (실행 전)
> 참고: MIN 임포트 완료 후 진행 예정

---

## 1. AGR 임포트 개요

### 1.1 목표
MacMap **AGR (Agreed) rates** 약 148M행을 Supabase `macmap_agr_rates` 테이블에 효율적으로 임포트.

### 1.2 현재 상황

#### MIN 임포트 (완료 예정)
- **상태**: 44개국 완료, 9개국 남음 (세션 34 기준)
- **속도**: ~2,800 rows/sec (스트리밍 + curl)
- **방식**: Batch 5000행, ON CONFLICT DO NOTHING
- **파일**: `/sessions/quirky-bold-thompson/import_min_remaining.py`

#### AGR 데이터
- **예상 규모**: ~148M행
- **파일 위치**: `/sessions/quirky-bold-thompson/mnt/portal/data/itc_macmap/by_country/*/MAcMap-*agr.txt`
- **파일 수**: 약 50+ 개국
- **단일 파일 크기**: 5M~276M (예: USA 191M, TUR 276M)
- **파일 형식**: TSV (TAB-DELIMITED), 헤더 포함
- **컬럼**: Revision, ReportingCountry, Year, ProductCode, Agreement_id, PartnerCountry, Nav_flag, AvDuty, NavDuty, Source

### 1.3 주요 과제
1. **파일 크기**: 최대 276M (TUR) → 메모리 효율적 처리 필수
2. **배치 처리**: 148M행을 스트리밍 방식으로 처리
3. **중복 제거**: UNIQUE(reporter_iso2, product_code, agreement_id, partner_iso2)
4. **프로세스 복구력**: 네트워크 오류 시 자동 재시작
5. **진행 추적**: 국가별 진행도 저장

---

## 2. MIN 임포트 스크립트 분석

### 2.1 import_min_remaining.py 구조

```
┌─ 프로세스 시작
│
├─ 진행도 로드 (progress.json)
│   ├─ completed_countries: [ISO3, ...]
│   └─ total_rows: int
│
├─ 국가별 반복
│   ├─ 파일 찾기 (glob)
│   ├─ CSV DictReader로 스트리밍
│   ├─ Batch 생성 (5000행 per batch)
│   ├─ curl + 임시파일로 SQL 실행
│   ├─ ON CONFLICT DO NOTHING
│   ├─ 진행도 저장
│   └─ 속도 로그 (rows/sec)
│
└─ 완료
```

### 2.2 핵심 특징

| 항목 | 값 | 장점 |
|------|-----|-------|
| 스트리밍 | CSV DictReader | 메모리 효율 (row-by-row) |
| 배치 크기 | 5000 rows | 네트워크 오버헤드 vs 메모리 balance |
| SQL 실행 | curl + 임시파일 | Cloudflare 우회, 인자 길이 제한 없음 |
| 중복 처리 | ON CONFLICT DO NOTHING | 빠른 재시작 (idempotent) |
| 진행 추적 | JSON 파일 | 프로세스 죽으면 재개 가능 |
| 속도 로깅 | 50배치마다 | 진행 가시화 |

### 2.3 코드 스니펫 (MIN에서 발췌)

```python
def import_country_min(iso3, reporter_iso2, filepath, progress):
    """스트리밍 방식으로 MIN 데이터 임포트"""
    total_inserted = 0
    batch = []
    batch_num = 0

    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            product_code = row.get('ProductCode', '').strip()
            partner_m49 = row.get('PartnerCountry', '').strip()
            partner_iso2 = M49_TO_ISO2.get(partner_m49, 'XX')
            av_duty = row.get('AvDuty', '0').strip()

            # 데이터 유효성 검사
            if not product_code or not av_duty.replace('.', '').replace('-', '').isdigit():
                continue

            batch.append(
                f"('{escape_sql(reporter_iso2)}','{escape_sql(product_code)}',...)"
            )

            if len(batch) >= BATCH_SIZE:
                # SQL 실행
                sql = f"INSERT INTO macmap_min_rates (...) VALUES {values_str} ON CONFLICT DO NOTHING;"
                run_sql(sql)
                batch = []
                batch_num += 1
```

---

## 3. AGR 데이터 구조 분석

### 3.1 AGR 파일 형식 (TAB-DELIMITED)

```
# 헤더
Revision  ReportingCountry  Year  ProductCode  Agreement_id  PartnerCountry  Nav_flag  AvDuty  NavDuty  Source

# 예시 데이터 (AUS 2023)
H6  036  2023  01012100  14  004  0  0    Market Access Map
H6  036  2023  01012100  14  008  0  0    Market Access Map
```

| 컬럼 | 타입 | 설명 | MIN과 차이 |
|------|------|------|-----------|
| Revision | str | HS 버전 (H6) | 동일 |
| ReportingCountry | M49 | 국가 코드 (M49 형식, 3자리 수) | 동일 |
| Year | int | 관세 연도 | 동일 |
| ProductCode | str | HS Code (8-12자리) | 동일 |
| Agreement_id | int | 무역협정 ID | **AGR만 있음** |
| PartnerCountry | M49 | 파트너 국가 (M49) | 동일 |
| Nav_flag | int | 비선택형 관세 플래그 (0=아니오, 1=예) | **AGR만 있음** |
| AvDuty | float | Ad-valorem 관세율 (%) | 동일 |
| NavDuty | str | 비선택형 관세 설명 (예: "1.5 cents/kg") | **AGR만 있음** |
| Source | str | 데이터 소스 | 동일 |

### 3.2 AGR 테이블 스키마 (이미 정의됨)

```sql
CREATE TABLE macmap_agr_rates (
  id BIGSERIAL PRIMARY KEY,
  reporter_iso2 CHAR(2) NOT NULL,              -- Reporting 국가
  product_code VARCHAR(12) NOT NULL,           -- HS Code (8-12자)
  agreement_id INTEGER NOT NULL,               -- 무역협정 ID
  partner_iso2 CHAR(2) NOT NULL,               -- 파트너 국가
  nav_flag SMALLINT DEFAULT 0,                 -- 비선택형 관세 플래그
  av_duty NUMERIC(8,4),                        -- 관세율
  nav_duty TEXT,                               -- 비선택형 관세 설명
  data_year SMALLINT NOT NULL,
  hs6 VARCHAR(6) GENERATED ALWAYS AS (LEFT(product_code, 6)) STORED,
  UNIQUE(reporter_iso2, product_code, agreement_id, partner_iso2)
);
```

### 3.3 주요 차이점 (MIN vs AGR)

```
MIN:
- UNIQUE(reporter_iso2, product_code, partner_iso2)
- 최저관세 (MFN 기반)
- 컬럼 수: 5개 (파일에서), 테이블에 6개

AGR:
- UNIQUE(reporter_iso2, product_code, agreement_id, partner_iso2)  ← agreement_id 추가!
- 특혜관세 (협정별)
- 컬럼 수: 10개 (파일에서), 테이블에 9개
- nav_flag + nav_duty (비선택형 관세)
```

**큰 차이**: Agreement_id가 추가되어 **같은 상품-파트너 조합이 여러 협정에서 나타날 수 있음**.

예:
```
Product 610910, Partner US, Agreement 1001 (USMCA): 0%
Product 610910, Partner US, Agreement 1005 (BilAgreement): 2%
→ 두 행 모두 저장되어야 함
```

---

## 4. AGR 임포트 스크립트 초안

### 4.1 파일: `import_agr_rates.py`

```python
#!/usr/bin/env python3
"""
AGR (Agreed) Duty Rates 임포트 스크립트
- MacMap 약 148M행 처리
- MIN 스크립트와 거의 동일 구조
- 주요 차이: agreement_id + nav_flag + nav_duty 컬럼
"""

import csv
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
import glob

# Supabase Configuration
PROJECT_ID = "zyurflkhiregundhisky"
API_TOKEN = "sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

# AGR 데이터 디렉토리
DATA_DIR = "/sessions/quirky-bold-thompson/mnt/portal/data/itc_macmap/by_country"
BATCH_SIZE = 5000  # rows per INSERT
PROGRESS_FILE = "/sessions/quirky-bold-thompson/agr_import_progress.json"

# M49 to ISO2 매핑 (MIN과 동일)
M49_TO_ISO2 = {
    '004': 'AF', '008': 'AL', '012': 'DZ', '016': 'AS', '020': 'AD',
    # ... (생략, MIN 스크립트의 M49_TO_ISO2와 동일)
    '842': 'US', '850': 'VI', '854': 'BF', '858': 'UY', '860': 'UZ',
    '862': 'VE', '876': 'WF', '882': 'WS', '887': 'YE', '894': 'ZM',
}

# 모든 AGR 파일이 있는 국가 (ISO3)
AGR_COUNTRIES = [
    'ARG', 'AUS', 'BHR', 'BRA', 'CAN', 'CHL', 'CHN', 'CRI', 'DOM',
    'DZA', 'ECU', 'GHA', 'HKG', 'IDN', 'ISR', 'JOR', 'JPN', 'KAZ',
    'KEN', 'KWT', 'LKA', 'MAR', 'MEX', 'MYS', 'NGA', 'NOR', 'NZL',
    'OMN', 'PAK', 'PER', 'PHL', 'PRY', 'QAT', 'RUS', 'SAU', 'SGP',
    'THA', 'TUN', 'TUR', 'TWN', 'UKR', 'URY', 'USA', 'VNM',
]


def log(msg):
    """타임스탬프와 함께 로그 출력"""
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def run_sql(query):
    """
    Supabase Management API를 통해 SQL 실행 (curl 사용)
    - 임시파일 사용 (인자 길이 제한 우회)
    """
    import tempfile
    body = json.dumps({"query": query})

    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tf:
        tf.write(body)
        tf_path = tf.name

    try:
        result = subprocess.run(
            [
                'curl', '-s', '--max-time', '120',
                '-X', 'POST', API_URL,
                '-H', f'Authorization: Bearer {API_TOKEN}',
                '-H', 'Content-Type: application/json',
                '-d', f'@{tf_path}'
            ],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            return None, result.stderr

        try:
            data = json.loads(result.stdout)
            if isinstance(data, dict) and 'error' in data:
                return None, data.get('message', data.get('error', str(data)))
            return data, None
        except json.JSONDecodeError:
            return None, result.stdout[:200]
    finally:
        import os
        os.unlink(tf_path)


def load_progress():
    """진행도 파일 로드"""
    try:
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {
            "completed_countries": [],
            "failed_countries": [],
            "total_rows": 0,
            "start_time": datetime.now().isoformat()
        }


def save_progress(progress):
    """진행도 파일 저장"""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)


def escape_sql(s):
    """SQL 문자열 이스케이프 (단일 따옴표)"""
    if s is None:
        return ''
    return s.replace("'", "''")


def import_country_agr(iso3, reporter_iso2, filepath, progress):
    """
    AGR 데이터 임포트 (스트리밍 방식)

    Args:
        iso3: 국가 ISO3 코드 (예: 'USA')
        reporter_iso2: ISO2 코드 (예: 'US')
        filepath: AGR 파일 경로
        progress: 진행도 딕셔너리

    Returns:
        임포트된 행 수
    """
    log(f"  Streaming {filepath}...")

    total_inserted = 0
    failed_batches = 0
    batch = []
    batch_num = 0
    line_count = 0

    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f, delimiter='\t')

            for row in reader:
                product_code = row.get('ProductCode', '').strip()
                agreement_id = row.get('Agreement_id', '').strip()
                partner_m49 = row.get('PartnerCountry', '').strip()
                nav_flag = row.get('Nav_flag', '0').strip()
                av_duty = row.get('AvDuty', '0').strip()
                nav_duty = row.get('NavDuty', '').strip()
                data_year = row.get('Year', '0').strip()

                # 데이터 유효성 검사
                if not product_code or not agreement_id or not data_year.isdigit():
                    continue

                partner_iso2 = M49_TO_ISO2.get(partner_m49, 'XX')

                # 숫자 변환
                try:
                    agreement_id_int = int(agreement_id)
                    av_duty_num = float(av_duty) if av_duty else 0.0
                    nav_flag_int = int(nav_flag) if nav_flag.isdigit() else 0
                except ValueError:
                    continue

                line_count += 1

                # AGR: reporter_iso2, product_code, agreement_id, partner_iso2이 Key
                batch.append(
                    f"('{escape_sql(reporter_iso2)}','{escape_sql(product_code)}',"
                    f"{agreement_id_int},'{escape_sql(partner_iso2)}',"
                    f"{nav_flag_int},{av_duty_num},'{escape_sql(nav_duty)}',"
                    f"{int(data_year)})"
                )

                # 배치 크기 도달하면 SQL 실행
                if len(batch) >= BATCH_SIZE:
                    values_str = ','.join(batch)
                    sql = f"""INSERT INTO macmap_agr_rates
                              (reporter_iso2, product_code, agreement_id, partner_iso2,
                               nav_flag, av_duty, nav_duty, data_year)
                           VALUES {values_str}
                           ON CONFLICT DO NOTHING;"""

                    data, err = run_sql(sql)
                    if err:
                        failed_batches += 1
                        if failed_batches <= 3:
                            log(f"    WARN batch {batch_num}: {str(err)[:100]}")
                        if failed_batches > 10:
                            log(f"    Too many failures, stopping {iso3}")
                            break
                        time.sleep(2)
                        # 재시도
                        data, err = run_sql(sql)
                        if err:
                            batch = []
                            batch_num += 1
                            continue
                    else:
                        total_inserted += len(batch)

                    batch = []
                    batch_num += 1

                    if batch_num % 50 == 0:
                        log(f"    {iso3}: {total_inserted:,} rows inserted ({batch_num} batches)")

        # 남은 행 처리
        if batch and failed_batches <= 10:
            values_str = ','.join(batch)
            sql = f"""INSERT INTO macmap_agr_rates
                      (reporter_iso2, product_code, agreement_id, partner_iso2,
                       nav_flag, av_duty, nav_duty, data_year)
                   VALUES {values_str}
                   ON CONFLICT DO NOTHING;"""
            data, err = run_sql(sql)
            if not err:
                total_inserted += len(batch)

        log(f"  {iso3} done: {total_inserted:,} rows inserted (from {line_count:,} parsed)")

    except Exception as e:
        log(f"  ERROR {iso3}: {str(e)[:100]}")
        progress["failed_countries"].append(iso3)
        save_progress(progress)
        return 0

    # 진행도 업데이트
    progress["total_rows"] += total_inserted
    progress["completed_countries"].append(iso3)
    save_progress(progress)

    return total_inserted


def main():
    """메인 함수"""
    log("=" * 60)
    log("AGR (Agreed Rates) Import - All Countries")
    log("=" * 60)

    progress = load_progress()
    completed = set(progress.get("completed_countries", []))
    failed = set(progress.get("failed_countries", []))

    total_start = time.time()
    grand_total = 0
    skipped = 0

    for iso3 in sorted(AGR_COUNTRIES):
        if iso3 in completed:
            log(f"SKIP {iso3} (already done)")
            skipped += 1
            continue

        if iso3 in failed:
            log(f"RETRY {iso3} (previously failed)")
            # failed에서 제거하고 재시도
            progress["failed_countries"].remove(iso3)

        # AGR 파일 찾기
        pattern = f"{DATA_DIR}/{iso3}/*agr.txt"
        files = [f for f in glob.glob(pattern) if '_desc' not in f and '_tr' not in f]

        if not files:
            log(f"SKIP {iso3}: no AGR file found")
            progress["failed_countries"].append(iso3)
            save_progress(progress)
            continue

        # 최신 파일 사용 (여러 버전이 있을 수 있음)
        filepath = sorted(files)[-1]

        # M49 → ISO2 매핑 (ISO3에서)
        # 예: 'USA' → 'US', 'AUS' → 'AU'
        iso2_map = {
            'ARG': 'AR', 'AUS': 'AU', 'BHR': 'BH', 'BRA': 'BR', 'CAN': 'CA',
            'CHL': 'CL', 'CHN': 'CN', 'CRI': 'CR', 'DOM': 'DO', 'DZA': 'DZ',
            'ECU': 'EC', 'GHA': 'GH', 'HKG': 'HK', 'IDN': 'ID', 'ISR': 'IL',
            'JOR': 'JO', 'JPN': 'JP', 'KAZ': 'KZ', 'KEN': 'KE', 'KWT': 'KW',
            'LKA': 'LK', 'MAR': 'MA', 'MEX': 'MX', 'MYS': 'MY', 'NGA': 'NG',
            'NOR': 'NO', 'NZL': 'NZ', 'OMN': 'OM', 'PAK': 'PK', 'PER': 'PE',
            'PHL': 'PH', 'PRY': 'PY', 'QAT': 'QA', 'RUS': 'RU', 'SAU': 'SA',
            'SGP': 'SG', 'THA': 'TH', 'TUN': 'TN', 'TUR': 'TR', 'TWN': 'TW',
            'UKR': 'UA', 'URY': 'UY', 'USA': 'US', 'VNM': 'VN',
        }

        reporter_iso2 = iso2_map.get(iso3, 'XX')

        log(f"\n[{iso3}] {reporter_iso2} - {filepath}")

        start = time.time()
        rows = import_country_agr(iso3, reporter_iso2, filepath, progress)
        elapsed = time.time() - start
        grand_total += rows

        if elapsed > 0 and rows > 0:
            rate = rows / elapsed
            log(f"  Speed: {rate:.0f} rows/sec, Time: {elapsed:.1f}s")

    total_elapsed = time.time() - total_start
    log(f"\n{'=' * 60}")
    log(f"COMPLETE: {grand_total:,} total rows, {total_elapsed:.1f}s")
    log(f"Completed: {len(completed)} countries")
    log(f"Failed: {len(progress.get('failed_countries', []))} countries")
    log(f"Skipped: {skipped} countries")
    log(f"{'=' * 60}")


if __name__ == '__main__':
    main()
```

### 4.2 스크립트 사용법

```bash
# 1. 파일 생성
cp /sessions/quirky-bold-thompson/import_min_remaining.py \
   /sessions/quirky-bold-thompson/import_agr_rates.py

# 2. 코드 수정 (위 초안 참고)

# 3. 실행 (배경 프로세스)
cd /sessions/quirky-bold-thompson
nohup python3 import_agr_rates.py > agr_import.log 2>&1 &

# 4. 진행 확인
tail -50 agr_import.log
cat agr_import_progress.json

# 5. 완료 후 테이블 검증
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) FROM macmap_agr_rates;"}'
```

---

## 5. 성능 추정

### 5.1 처리 시간

```
총 행: 148M
배치 크기: 5000
배치 수: 148,000,000 / 5000 = 29,600 배치

속도: MIN과 동일 ~2,800 rows/sec (스트리밍 + 네트워크 오버헤드)

예상 시간:
- 순차 처리: 148M / 2,800 = 52,857초 ≈ 14.7 시간
- 병렬 처리 (5 processes): ~3 시간

파일 수: 43개국
평균 파일당: 148M / 43 ≈ 3.4M행
평균 시간: 3.4M / 2,800 = 1,214초≈ 20분/국가
```

### 5.2 스토리지 영향

```
테이블 크기:
- 행 크기: ~100 bytes (컬럼 9개, 문자 짧음)
- 인덱스 3개: ~70% 추가
- 예상 총: 148M × 100B × 1.7 = ~25GB

기존 MIN: ~12GB
따라서 전체 관세율: ~40GB
```

---

## 6. 스크립트 개선 사항 (MIN 대비)

### 6.1 AGR 특화 처리

```python
# 1. Agreement_id 처리 (정수 변환 필수)
agreement_id_int = int(agreement_id)

# 2. Nav_flag 처리 (비선택형 관세 플래그)
nav_flag_int = int(nav_flag) if nav_flag.isdigit() else 0

# 3. Nav_duty 처리 (선택형 관세 설명, 예: "1.5 cents/kg")
nav_duty = row.get('NavDuty', '').strip()  # 큰따옴표 제거 필수!

# 4. 테이블 자동 생성 (GENERATED ALWAYS 열)
# hs6은 자동으로 LEFT(product_code, 6) 계산됨
```

### 6.2 ISO2 매핑 최적화

```python
# ISO3 → ISO2 매핑 (MIN은 M49 필터링했으나, AGR도 동일)
iso2_map = {
    'ARG': 'AR', 'AUS': 'AU', ..., 'USA': 'US'
}
reporter_iso2 = iso2_map.get(iso3, 'XX')
```

---

## 7. 실행 순서 및 체크리스트

### Phase 1: 준비 (1일)
- [ ] `macmap_agr_rates` 테이블 생성 확인 (이미 생성됨)
- [ ] `macmap_trade_agreements` 테이블 확인 (Agreement_id 참조용)
- [ ] AGR 파일 43개국 모두 확인
- [ ] M49 → ISO2 매핑 완성도 확인

### Phase 2: MIN 완료 후 AGR 시작 (예상 2-3주 후)
- [ ] `import_agr_rates.py` 스크립트 작성
- [ ] 로컬 테스트 (1-2개국, 샘플)
- [ ] Cowork VM에서 실행

### Phase 3: 실행 (1일 ~ 1주)
- [ ] 배경 프로세스 시작 (`nohup ... &`)
- [ ] 진행도 모니터링 (1시간마다)
- [ ] 실패 국가 재시도
- [ ] 최종 검증

### Phase 4: 검증 (1일)
- [ ] 행 수 검증 (`SELECT COUNT(*)`)
- [ ] 무작위 샘플 검증 (100행)
- [ ] 관세율 조인 테스트
- [ ] API 엔드포인트 테스트

---

## 8. MIN과 AGR의 비교 SQL

### MIN (이미 구현됨)

```sql
SELECT
  reporter_iso2,
  product_code,
  partner_iso2,
  av_duty,
  data_year
FROM macmap_min_rates
WHERE reporter_iso2 = 'US' AND hs6 = '610910'
LIMIT 10;

-- 결과: 최저관세만 저장 (파트너 국가별 1행)
```

### AGR (새로 추가될)

```sql
SELECT
  reporter_iso2,
  product_code,
  agreement_id,
  partner_iso2,
  av_duty,
  data_year
FROM macmap_agr_rates
WHERE reporter_iso2 = 'US' AND hs6 = '610910'
LIMIT 10;

-- 결과: 협정별로 여러 행 (같은 파트너도 협정마다 다른 관세)
```

### 조인 쿼리 (AGR 우선)

```sql
-- 우선순위: AGR (협정) > MIN (최저) > MFN (fallback)
SELECT
  wp.product_name,
  wp.hs6_code,
  mar.agreement_id,
  mta.tariff_regime,
  COALESCE(mar.av_duty, mmr.av_duty) AS final_duty,
  CASE
    WHEN mar.av_duty IS NOT NULL THEN 'AGR'
    WHEN mmr.av_duty IS NOT NULL THEN 'MIN'
    ELSE 'MFN'
  END AS duty_type
FROM wdc_products_mapped wp
LEFT JOIN macmap_agr_rates mar ON wp.hs6_code = mar.hs6
LEFT JOIN macmap_trade_agreements mta ON mar.agreement_id = mta.agreement_id
LEFT JOIN macmap_min_rates mmr ON wp.hs6_code = mmr.hs6;
```

---

## 9. 문제 해결 가이드

### 9.1 스크립트 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `FileNotFoundError` | AGR 파일 경로 잘못됨 | `find /path -name "*agr.txt"` 확인 |
| `json.JSONDecodeError` | curl 응답 파싱 오류 | API 토큰 확인, 네트워크 지연 |
| `UnicodeDecodeError` | 파일 인코딩 문제 | `errors='replace'` 사용 중 |
| `KeyError: 'Agreement_id'` | CSV 헤더 문제 | 파일의 실제 헤더 확인 |

### 9.2 성능 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| 느린 속도 (<1000 rows/sec) | 네트워크 지연, 서버 부하 | 배치 크기 감소 (3000), 시간대 변경 |
| 메모리 부족 | 배치 크기 너무 큼 | BATCH_SIZE = 2000으로 감소 |
| 중복 오류 | ON CONFLICT 작동 안 함 | `UNIQUE` 제약 확인 |

### 9.3 복구 전략

```bash
# 1. 진행도 확인
cat agr_import_progress.json

# 2. 실패한 국가만 재실행
# progress.json에서 "failed_countries" 확인
# 스크립트가 자동으로 재시도 로직 포함

# 3. 전체 초기화 (시작부터 다시)
rm agr_import_progress.json
nohup python3 import_agr_rates.py > agr_import.log 2>&1 &
```

---

## 10. 다음 단계

1. **MIN 완료** (진행 중): 9개국 남음
2. **AGR 스크립트 최종 작성**: 이 문서 기반
3. **테스트 실행**: 2-3개국 샘플 처리 (1일)
4. **전체 실행**: 43개국, 148M행 (1주)
5. **검증 & 최적화**: 조인 뷰 성능 테스트

---

**관련 파일**:
- `/sessions/quirky-bold-thompson/import_min_remaining.py` - MIN 스크립트 (참고)
- `/sessions/quirky-bold-thompson/mnt/portal/supabase/migrations/016_macmap_bulk_tables.sql` - 테이블 정의
- `/sessions/quirky-bold-thompson/agr_import_progress.json` - 진행도 파일 (생성 예정)
