# MacMap MIN/AGR 임포트 스크립트 - 기술 상세 문서

## 아키텍처 개요

```
┌─────────────────────────────────┐
│     ITC MacMap TSV 파일         │
│  (by_country/국가/파일명.txt)  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   데이터 읽기 및 검증            │
│  - 인코딩 감지 (UTF-8, Latin-1)│
│  - 필수 필드 검증               │
│  - M49 → ISO2 변환              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│    배치 처리 (50,000행)         │
│  - StringIO 버퍼링              │
│  - COPY 명령 준비               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   임시 테이블 생성 및 COPY      │
│  - CREATE TEMP TABLE            │
│  - COPY FROM (고속)             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   메인 테이블에 INSERT          │
│  - INSERT ... SELECT            │
│  - ON CONFLICT DO NOTHING       │
│  - DROP TEMP TABLE              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Supabase PostgreSQL           │
│  (macmap_min_rates, agr_rates) │
└─────────────────────────────────┘
```

## 핵심 모듈

### 1. 매핑 및 설정 (M49_TO_ISO2, ISO3_TO_M49)

- **M49_TO_ISO2**: 237개 국가의 UN M49 코드 → ISO 2-letter 매핑
- **ISO3_TO_M49**: 폴더명 검증용 역매핑 (53개 MacMap 국가)

```python
M49_TO_ISO2 = {
    '410': 'KR',   # South Korea
    '842': 'US',   # United States
    '156': 'CN',   # China
    '918': 'EU',   # European Union (custom ITC code)
    ...
}
```

특수 코드:
- '918': 'EU' (ITC 커스텀 코드)
- '842': 'US' (ITC 변형)
- '699': 'IN' (ITC 코드, 표준 356도 지원)
- '490': 'TW' (대만, ITC 코드)
- '757': 'CH' (스위스, ITC 코드)

### 2. 데이터 읽기 및 변환

#### detect_encoding()
```python
def detect_encoding(filepath):
    """UTF-8 → Latin-1 → CP1252 순서로 시도"""
```

- UTF-8 먼저 시도 (대부분의 경우)
- 실패 시 Latin-1 (Windows 인코딩)
- 마지막 수단: CP1252 (확장된 Windows)

#### read_data_file()
```python
def read_data_file(filepath, expected_columns):
    """
    탭 구분 CSV 파일 읽기
    - 인코딩 자동 감지
    - 열 검증
    - 헤더 파싱
    """
    rows, columns = read_data_file(path, ['Col1', 'Col2', ...])
```

### 3. M49 → ISO2 변환

```python
def process_min_data(rows, country_iso3, conn):
    # 보고국 M49 추출
    m49_code = rows[0].get('ReportingCountry', '').strip()
    reporter_iso2 = M49_TO_ISO2.get(m49_code)  # '410' → 'KR'

    # 파트너국 변환 (각 행마다)
    partner_m49 = row.get('PartnerCountry', '').strip()
    partner_iso2 = M49_TO_ISO2.get(partner_m49, 'XX')  # 기본값: 'XX'
```

에러 처리:
- M49 코드 미존재: 'XX' (Areas NES) 기본값 사용
- 데이터 품질: 잠시 경고 메시지만 출력하고 계속

### 4. 배치 처리 및 COPY

#### 배치 크기 선택 이유 (50,000행)

```python
BATCH_SIZE = 50,000

# 메모리 사용: ~100MB per batch (합리적)
# 각 배치: ~0.3-0.5초 (초당 ~200,000행)
# 전체 1.2M행: ~6초 COPY 시간
```

#### COPY 기반 아키텍처

```python
# 1. StringIO 버퍼에 탭 구분 데이터 작성
buffer = StringIO()
writer = csv.writer(buffer, delimiter='\t')
for row in batch:
    writer.writerow([col1, col2, col3, ...])

# 2. 버퍼를 임시 테이블에 COPY
buffer.seek(0)
cur.copy_from(buffer, temp_table_name, columns=[...])

# 3. 임시 테이블에서 메인 테이블에 INSERT
cur.execute("""
    INSERT INTO macmap_min_rates SELECT * FROM temp_table
    ON CONFLICT DO NOTHING
""")
```

**왜 임시 테이블을 사용하나?**
- PostgreSQL COPY는 ON CONFLICT를 직접 지원하지 않음
- 임시 테이블 사용으로 안전하게 충돌 처리 가능
- 세션 종료 시 자동 정리

### 5. 데이터베이스 연결 및 테이블 생성

#### URL 파싱

```python
def parse_db_url(db_url):
    """postgresql://user:password@host:port/database 형식 파싱"""
    # 반환: {'host': 'host', 'port': 5432, 'user': 'user', ...}
```

#### 테이블 생성 (자동)

```python
def create_tables_if_needed(conn):
    # macmap_min_rates 테이블 생성
    # macmap_agr_rates 테이블 생성
    # 인덱스 4개 생성
    # IF NOT EXISTS로 멱등성 보장
```

MIN 테이블:
```sql
CREATE TABLE macmap_min_rates (
    id BIGSERIAL PRIMARY KEY,
    reporter_iso2 TEXT NOT NULL,        -- ISO2: 'KR', 'US', ...
    product_code TEXT NOT NULL,         -- HS코드: '010110', ...
    partner_iso2 TEXT NOT NULL,         -- ISO2: 'CN', 'JP', ...
    av_duty NUMERIC(8,6) DEFAULT 0,    -- 관세율: 0.05 (5%), ...
    data_year INTEGER NOT NULL,         -- 연도: 2023, 2022, ...
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reporter_iso2, product_code, partner_iso2, data_year)
);
```

AGR 테이블 (추가 컬럼):
```sql
CREATE TABLE macmap_agr_rates (
    ...
    agreement_id TEXT NOT NULL,         -- 협정 ID
    nav_flag INTEGER DEFAULT 0,         -- 비다가형 관세 플래그
    nav_duty TEXT,                      -- 비다가형 관세 설명
    ...
);
```

### 6. 에러 처리

| 시나리오 | 처리 방식 |
|---------|---------|
| 파일 읽기 실패 | 경고 출력, 다음 파일 진행 |
| M49 → ISO2 변환 실패 | 'XX' 기본값, 경고 출력 |
| 인코딩 감지 불가 | UTF-8 기본값, 경고 출력 |
| 필드 타입 변환 실패 | 0 또는 NULL 기본값 |
| DB 연결 실패 | 프로그램 종료 |
| 테이블 생성 실패 | 프로그램 종료 |
| INSERT 실패 | 트랜잭션 롤백, 계속 진행 |

## 데이터 흐름 예시

### 입력 (MIN 파일)

```
Revision	ReportingCountry	Year	ProductCode	PartnerCountry	AvDuty	Source
H6	        410	             2023	010110	      156	            5.5	    MFN
H6	        410	             2023	010120	      392	            3.2	    MFN
H6	        410	             2023	010130	      000	            0.0	    MFN
```

### 변환 과정

```python
# 1. M49 변환
ReportingCountry: 410 → reporter_iso2: 'KR'
PartnerCountry: 156 → partner_iso2: 'CN'
PartnerCountry: 392 → partner_iso2: 'JP'
PartnerCountry: 000 → partner_iso2: 'XX'

# 2. 숫자 변환
AvDuty: '5.5' → NUMERIC: 5.5
Year: '2023' → INTEGER: 2023

# 3. 검증
ProductCode 없으면 행 스킵
Year 숫자 아니면 행 스킵
```

### 출력 (DB 테이블)

```
| id | reporter_iso2 | product_code | partner_iso2 | av_duty | data_year | created_at          |
|----+---------------+--------------+--------------+---------+-----------+---------------------|
| 1  | KR            | 010110       | CN           | 5.5     | 2023      | 2026-03-07 18:00:03 |
| 2  | KR            | 010120       | JP           | 3.2     | 2023      | 2026-03-07 18:00:03 |
| 3  | KR            | 010130       | XX           | 0.0     | 2023      | 2026-03-07 18:00:03 |
```

## 성능 분석

### 성능 지표

```
배치 크기: 50,000행
COPY 시간: ~0.3초 (배치당)
INSERT 시간: ~0.2초 (배치당)
총 처리: ~0.5초 (배치당)

처리량: 50,000행 / 0.5초 = 100,000행/초 (COPY)
메모리: ~100MB (배치당)
```

### 병목 분석

1. **파일 읽기**: 20% (네트워크 I/O)
2. **데이터 변환**: 30% (M49 → ISO2 매핑)
3. **COPY**: 40% (DB I/O)
4. **INSERT**: 10% (DB 처리)

### 최적화 기법

| 기법 | 효과 | 구현 |
|------|------|------|
| COPY 사용 | 10-100배 빠름 | psycopg2.copy_from() |
| 배치 처리 | 메모리 절약 | 50,000행 배치 |
| 임시 테이블 | 안정성 | ON CONFLICT 지원 |
| 인덱스 | 조회 빠름 | 4개 인덱스 생성 |

## 국가 데이터 예시

### 파일 구조

```
by_country/
├── KOR/
│   ├── MAcMap-KOR_2023_Tariff_NTLC_mfn.txt       (MIN)
│   ├── MAcMap-KOR_2023_Tariff_NTLC_mfn_desc.txt  (제외)
│   ├── MAcMap-KOR_2023_Tariff_NTLC_agr.txt       (AGR)
│   └── MAcMap-KOR_2023_Tariff_NTLC_agr_desc.txt  (제외)
├── USA/
│   ├── MAcMap-USA_2023_Tariff_NTLC_mfn.txt
│   ├── MAcMap-USA_2023_Tariff_NTLC_agr.txt
│   └── ...
└── CHN/
    ├── MAcMap-CHN_2023_Tariff_NTLC_mfn.txt
    ├── MAcMap-CHN_2023_Tariff_NTLC_agr.txt
    └── ...
```

### 지원하는 국가 (53개)

| 그룹 | 국가 |
|------|------|
| 아시아 | KOR, CHN, JPN, IND, IDN, MYS, THA, PHL, VNM, SGP, PAK, BGD, LKA, KAZ, OMN, QAT, AE, KWT, JOR, ISR, TN, EG, SA |
| 아메리카 | USA, BRA, MEX, CAN, ARG, CHL, CRI, DOM, PER, URY, ECU, COL, PRY |
| 유럽 | EUR, GB, DE, FR, IT, ES, CH, NO, RU, UA, TR, TUN |
| 오세아니아 | AUS, NZL |
| 아프리카 | ZA, NG, GH, KE, DZA |

## 확장성 고려사항

### 메모리 사용량

```
1,000만행 임포트 시:
- 배치당 메모리: 100MB
- 최대 메모리: 200MB (배치 처리중)
- 총 시간: ~25분
```

### 동시성

- **트랜잭션**: 배치마다 커밋 (안정성)
- **락**: COPY 시 행 락 없음 (고속)
- **충돌**: ON CONFLICT DO NOTHING (안전)

### 확장 옵션

1. **병렬 처리**: 국가별 스레드 분리 (미구현)
2. **네트워크 최적화**: 로컬 임시 파일 (미구현)
3. **압축**: gzip 파일 직접 처리 (미구현)

## 보안 고려사항

1. **SQL 인젝션**: `psycopg2.sql.Identifier` 사용
2. **특수 문자**: CSV 기본 escape 사용
3. **연결 문자열**: URL 매개변수 안전 파싱
4. **임시 테이블**: 세션 종료 시 자동 삭제

## 모니터링

### 로그 출력

```python
def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")
```

### 진행률 추적

```
[18:00:02] [1/53] ARG 처리 중...
[18:00:03]   MIN ARG: 5,000 행 처리 중...
[18:00:04]   AGR ARG: 8,000 행 처리 중...
[18:00:05]   ARG 완료: 13,000 행, 3.2초
[18:00:05]     속도: 4,063 행/초
```

국가별로 진행 상황, 행 수, 처리 시간, 초당 처리량을 표시합니다.

## 향후 개선 사항

1. ✓ 현재: 순차 처리
2. ▢ 계획: 국가별 병렬 처리
3. ▢ 계획: 데이터 검증 리포트
4. ▢ 계획: 중복 데이터 충돌 분석
5. ▢ 계획: 불완전한 행 로깅
6. ▢ 계획: 증분 업데이트 (변경사항만 처리)
