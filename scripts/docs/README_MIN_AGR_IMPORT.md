# MacMap MIN/AGR 대량 임포트 스크립트

이 스크립트는 ITC MacMap의 MIN(MFN 다국간 협상) 및 AGR(협정) 데이터를 Supabase PostgreSQL 데이터베이스에 고속으로 대량 임포트합니다.

## 개요

- **언어**: Python 3
- **플랫폼**: macOS, Linux, Windows
- **데이터 형식**: 탭 구분값 (TSV)
- **데이터 원본**: ITC MacMap by_country 폴더
- **성능**: 배치 COPY 사용으로 초당 수십만 행 처리 가능

## 설치

### 1. Python 3 확인

```bash
python3 --version  # 3.8 이상 필요
```

### 2. psycopg2 설치

```bash
pip3 install psycopg2-binary
```

또는 Homebrew (macOS):

```bash
brew install libpq
pip3 install psycopg2-binary
```

## 사용 방법

### 기본 사용법

```bash
python3 import_min_agr_data.py \
  --db-url "postgresql://user:password@host:port/database" \
  --data-dir "/path/to/itc_macmap/by_country"
```

### 전체 옵션

```bash
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres.PROJECT_ID:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres" \
  --data-dir "/path/to/data/itc_macmap/by_country" \
  --type both \
  --country KOR
```

### 옵션 설명

| 옵션 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `--db-url` | ✓ | PostgreSQL 연결 URL | `postgresql://user:pass@host:5432/db` |
| `--data-dir` | ✓ | MacMap by_country 폴더 경로 | `/data/itc_macmap/by_country` |
| `--type` | × | 임포트 타입 (기본값: both) | `min`, `agr`, `both` |
| `--country` | × | 특정 국가만 처리 (ISO3) | `KOR`, `USA`, `CHN` |

## 데이터 형식

### MIN 파일 형식

파일명: `*_mfn.txt` (설명 파일 제외)

탭 구분 컬럼:
- `Revision`: 버전
- `ReportingCountry`: 보고국 M49 코드
- `Year`: 연도
- `ProductCode`: HS 코드
- `PartnerCountry`: 파트너국 M49 코드
- `AvDuty`: 협상된 관세율 (%)
- `Source`: 출처

### AGR 파일 형식

파일명: `*_agr.txt` (설명 파일 제외)

탭 구분 컬럼:
- `Revision`: 버전
- `ReportingCountry`: 보고국 M49 코드
- `Year`: 연도
- `ProductCode`: HS 코드
- `Agreement_id`: 협정 ID
- `PartnerCountry`: 파트너국 M49 코드
- `Nav_flag`: 비다가형 관세 플래그
- `AvDuty`: 협상된 관세율 (%)
- `NavDuty`: 비다가형 관세 설명
- `Source`: 출처

## 데이터베이스 테이블

스크립트가 자동으로 생성합니다.

### macmap_min_rates

```sql
CREATE TABLE macmap_min_rates (
  id BIGSERIAL PRIMARY KEY,
  reporter_iso2 TEXT NOT NULL,           -- ISO 2-letter 코드
  product_code TEXT NOT NULL,             -- HS 코드
  partner_iso2 TEXT NOT NULL,             -- 파트너 ISO 2-letter 코드
  av_duty NUMERIC(8,6) DEFAULT 0,        -- 협상 관세율
  data_year INTEGER NOT NULL,             -- 데이터 연도
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reporter_iso2, product_code, partner_iso2, data_year)
);

CREATE INDEX idx_min_rates_reporter ON macmap_min_rates(reporter_iso2);
CREATE INDEX idx_min_rates_partner ON macmap_min_rates(partner_iso2);
```

### macmap_agr_rates

```sql
CREATE TABLE macmap_agr_rates (
  id BIGSERIAL PRIMARY KEY,
  reporter_iso2 TEXT NOT NULL,           -- ISO 2-letter 코드
  product_code TEXT NOT NULL,             -- HS 코드
  agreement_id TEXT NOT NULL,             -- 협정 ID
  partner_iso2 TEXT NOT NULL,             -- 파트너 ISO 2-letter 코드
  nav_flag INTEGER DEFAULT 0,             -- 비다가형 관세 플래그
  av_duty NUMERIC(8,6) DEFAULT 0,        -- 협상 관세율
  nav_duty TEXT,                          -- 비다가형 관세 설명
  data_year INTEGER NOT NULL,             -- 데이터 연도
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reporter_iso2, product_code, agreement_id, partner_iso2, data_year)
);

CREATE INDEX idx_agr_rates_reporter ON macmap_agr_rates(reporter_iso2);
CREATE INDEX idx_agr_rates_partner ON macmap_agr_rates(partner_iso2);
```

## 기술 상세

### 성능 최적화

1. **COPY 명령**: `psycopg2.copy_from()` 사용으로 일반 INSERT보다 10-100배 빠름
2. **배치 처리**: 50,000행씩 배치로 메모리 효율적으로 처리
3. **임시 테이블**: 각 배치마다 임시 테이블을 생성하여 중복 처리 안전성 확보
4. **ON CONFLICT DO NOTHING**: 중복 데이터 안전하게 스킵

### 데이터 변환

- **M49 코드 변환**: 237+ 국가의 M49 코드를 ISO 2-letter 코드로 변환
- **인코딩 감지**: UTF-8, Latin-1, CP1252 자동 감지
- **데이터 검증**: 필수 필드 없으면 행 스킵

### 에러 처리

- 파일 읽기 실패 시 경고 메시지 출력하고 계속 진행
- M49 코드 매핑 실패 시 기본값 'XX' 사용
- 데이터 타입 변환 실패 시 기본값 0 또는 NULL 사용

## 예시

### Supabase PostgreSQL에 임포트

```bash
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres.abcdefg:mypassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  --data-dir "/Users/myuser/Downloads/itc_macmap/by_country"
```

### 한국(KOR)만 임포트

```bash
python3 import_min_agr_data.py \
  --db-url "postgresql://postgres.abcdefg:mypassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  --data-dir "/Users/myuser/Downloads/itc_macmap/by_country" \
  --country KOR
```

### MIN만 임포트

```bash
python3 import_min_agr_data.py \
  --db-url "postgresql://user:pass@localhost:5432/mydb" \
  --data-dir "/data/macmap/by_country" \
  --type min
```

## 출력 예시

```
[2026-03-07 18:00:00] 데이터베이스 연결 성공: aws-0-us-east-1.pooler.supabase.com:5432/postgres
[2026-03-07 18:00:01] 테이블 생성: macmap_min_rates (또는 이미 존재)
[2026-03-07 18:00:01] 테이블 생성: macmap_agr_rates (또는 이미 존재)
[2026-03-07 18:00:01] 인덱스 생성 완료
[2026-03-07 18:00:01] 처리할 국가: 53개

[2026-03-07 18:00:02] [1/53] ARG 처리 중...
[2026-03-07 18:00:02]   MIN 파일: MAcMap-ARG_2023_Tariff_NTLC_mfn.txt
[2026-03-07 18:00:02]   MIN ARG: 5,000 행 처리 중...
[2026-03-07 18:00:03]     MIN 임포트 완료: 5,000 행
[2026-03-07 18:00:03]   AGR 파일: MAcMap-ARG_2023_Tariff_NTLC_agr.txt
[2026-03-07 18:00:04]   AGR ARG: 8,000 행 처리 중...
[2026-03-07 18:00:05]     AGR 임포트 완료: 8,000 행
[2026-03-07 18:00:05]   ARG 완료: 13,000 행, 3.2초
[2026-03-07 18:00:05]     속도: 4,063 행/초

... (다른 국가들) ...

======================================================================
임포트 완료 요약
======================================================================
  ARG:    MIN      5,000 | AGR      8,000
  AUS:    MIN     10,000 | AGR     15,000
  BRA:    MIN      8,000 | AGR     12,000
  ... (다른 국가들) ...
----------------------------------------------------------------------
  합계:    MIN    500,000 | AGR    750,000

총 시간: 125.3초
총 행 수: 1,250,000
평균 속도: 9,977 행/초
======================================================================

데이터베이스 연결 종료
```

## 트러블슈팅

### 연결 오류

```
오류: 데이터베이스 연결 실패 - could not translate host name "host" to address
```

**해결**: `--db-url`의 호스트명과 포트를 확인하세요.

### 테이블 생성 오류

```
오류: 테이블 생성 실패 - permission denied for schema public
```

**해결**: PostgreSQL 사용자에게 CREATE TABLE 권한이 필요합니다.

### 파일을 찾을 수 없음

```
경고: /path/to/data/KOR의 M49 코드 '410'를 ISO2로 변환할 수 없음
```

**해결**: M49_TO_ISO2 사전에 국가 코드를 추가하거나, 데이터 파일의 ReportingCountry 값을 확인하세요.

### 인코딩 오류

```
경고: /path/file.txt의 인코딩을 감지할 수 없음. utf-8 사용
```

**해결**: 데이터 파일이 지원되는 인코딩(UTF-8, Latin-1, CP1252)이 아닐 수 있습니다.

## M49 대 ISO2 매핑

스크립트는 237개 이상의 M49 코드를 지원합니다. 주요 국가:

| ISO3 | ISO2 | M49 | 국가명 |
|------|------|-----|--------|
| KOR | KR | 410 | 한국 |
| USA | US | 842 | 미국 |
| CHN | CN | 156 | 중국 |
| JPN | JP | 392 | 일본 |
| EUR | EU | 918 | 유럽연합 |

전체 매핑은 스크립트의 `M49_TO_ISO2` 사전을 참조하세요.

## 라이선스

Internal Use Only

## 지원

질문이나 문제가 있으면 개발팀에 문의하세요.
