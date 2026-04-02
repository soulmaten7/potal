# WDC Phase 4 v2 — 결과 업로드 명령어 (Claude Code용)

## 배경
- v2 매칭 완료: 16/16 청크, 1.8B줄 처리, 중복 제거 후 **49,265,581건** (~4,927만)
- 메인 결과 파일: `/Volumes/soulmaten/POTAL/wdc-products/v2_results/merged_results.jsonl` (**11GB, JSONL 형식**)
- 워커 파일: `worker_00~31.jsonl` (각 ~500MB, 32개) — 업로드에는 merged만 사용
- `--no-upload`으로 실행했으므로 DB에 아직 없음
- 기존 product_hs_mappings: ~1.36M건 (v1에서 삽입된 것)

## ⚠️ 핵심 제약 (v1 교훈)
- **v1은 Management API curl per-row INSERT (500/s)로 Supabase 과부하 → www.potal.app 504 다운**
- 따라서: **절대 빠르게 쏟아붓지 마라. 느리고 안전하게.**
- 사이트 영향 없도록 rate-limiting 필수

## 실행 명령어

아래 내용을 Claude Code에 복사-붙여넣기:

```
WDC Phase 4 v2 결과를 Supabase product_hs_mappings 테이블에 업로드해라.

## 상황
- 메인 결과 파일: /Volumes/soulmaten/POTAL/wdc-products/v2_results/merged_results.jsonl (11GB, JSONL, 49,265,581건)
- JSONL 형식: 각 줄이 JSON 객체 (product_name, hs6_code, category, source 등)
- 기존 product_hs_mappings에 ~1.36M건 있음 (v1 결과)
- Management API Token: sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a
- Supabase Project ID: zyurflkhiregundhisky

## 업로드 전략 (반드시 지켜라)

### 1단계: 결과 파일 확인
- head -5 /Volumes/soulmaten/POTAL/wdc-products/v2_results/merged_results.jsonl (JSONL 구조 확인)
- wc -l /Volumes/soulmaten/POTAL/wdc-products/v2_results/merged_results.jsonl (총 건수)
- 기존 DB 건수 확인: SELECT count(*) FROM product_hs_mappings;

### 2단계: 업로드 스크립트 작성 (Python)
scripts/wdc_phase4_v2_upload.py 생성:

핵심 설계:
- merged_results.jsonl을 한 줄씩 읽기 (11GB 전체 메모리 로드 금지)
- **배치 크기: 500건씩** INSERT (Management API curl)
- **배치 간 대기: 2초** (초당 250건 = 분당 15,000건 = 시간당 90만건)
- **4,927만건 ÷ 90만/시간 ≈ 55시간** (약 2.3일)
- UPSERT 사용: INSERT ... ON CONFLICT (product_name) DO UPDATE SET hs6_code = EXCLUDED.hs6_code, category = EXCLUDED.category, updated_at = now()
- JSONL 각 줄 파싱 → SQL VALUES 생성 (product_name, hs6_code, category, source, country_code 등 컬럼 맞추기)
- product_name의 작은따옴표(') → '' 이스케이프 필수
- 진행 상황 로그: 1,000배치(50만건)마다 요약 출력 + 초당 속도 + 남은 시간 표시
- 중단/재개 지원: progress 파일에 마지막 처리한 줄 번호 기록 → --resume 시 해당 줄부터 재개
- 에러 시 3회 재시도 + 5초 대기 (backoff)

### 3단계: 업로드 실행
- nohup + nice -n 15 (백그라운드, 낮은 CPU 우선순위)
- 로그: /Volumes/soulmaten/POTAL/wdc-products/v2_results/upload.log

### 4단계: 모니터링 안내
모니터링 명령어 출력:
- tail -f [로그파일]
- 진행도 확인 명령어
- 중지/재개 방법

## 절대 규칙
1. **배치 간 2초 대기 필수** — 이걸 줄이면 사이트 다운됨 (v1 교훈)
2. **curl만 사용** (urllib은 Cloudflare 차단됨)
3. **에러 발생 시 대기 시간 10초로 늘려** (backoff)
4. **nohup으로 실행** — 터미널 닫아도 계속
5. **nice -n 15** — Mac 정상 사용 가능하도록
6. **11GB 파일 전체를 메모리에 올리지 마라** — 한 줄씩 읽어야 함
7. 업로드 중 www.potal.app 접속 테스트 — 느려지면 대기 시간 5초로 늘려
```

## 예상 소요 시간
| 배치 간 대기 | 시간당 건수 | 총 소요 시간 |
|------------|-----------|------------|
| 1초 | 180만 | ~27시간 |
| **2초 (권장)** | **90만** | **~55시간 (~2.3일)** |
| 3초 | 60만 | ~82시간 (~3.4일) |

## 모니터링
```bash
# 실시간 로그
tail -f /Volumes/soulmaten/POTAL/wdc-products/v2_results/upload.log

# DB 현재 건수
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT count(*) FROM product_hs_mappings;"}'

# 중지
kill [PID]

# 재개
python3 scripts/wdc_phase4_v2_upload.py --resume
```
