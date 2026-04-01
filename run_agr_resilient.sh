#!/bin/bash
# AGR 임포트 — 죽어도 자동 재시작, 53개국 완료까지 반복
# 사용법: cd ~/potal && nohup bash run_agr_resilient.sh > agr_import.log 2>&1 &

PROGRESS_FILE="$HOME/portal/agr_import_progress.json"
LOG_FILE="$HOME/portal/agr_import.log"
MAX_RETRIES=100
RETRY_DELAY=10

echo "=========================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] AGR Resilient 임포트 시작"
echo "=========================================="

# progress.json에서 실제 완료된 국가 수 확인
check_progress() {
    if [ -f "$PROGRESS_FILE" ]; then
        # "done" 상태인 국가 수 카운트
        done_count=$(python3 -c "
import json
with open('$PROGRESS_FILE') as f:
    p = json.load(f)
countries = p.get('countries', {})
done = sum(1 for v in countries.values() if v.get('status') == 'done')
total = len(countries)
print(f'{done}/{total}')
" 2>/dev/null || echo "?/?")
        echo "$done_count"
    else
        echo "0/0"
    fi
}

# 실제 DB에서 국가별 행 수 확인하고, 너무 적은 국가는 progress에서 리셋
reset_incomplete_countries() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 불완전한 국가 확인 중..."
    python3 -c "
import json, subprocess, os

progress_file = os.path.expanduser('~/potal/agr_import_progress.json')
if not os.path.exists(progress_file):
    print('progress 파일 없음')
    exit(0)

with open(progress_file) as f:
    progress = json.load(f)

# 알려진 최소 행 수 (대략적 기준 — 이보다 적으면 불완전)
min_expected = {
    'KOR': 1800000,  # 한국은 ~1.8M 예상인데 15,798만 들어감
}

countries = progress.get('countries', {})
reset_count = 0

for iso3, info in countries.items():
    if info.get('status') == 'done':
        # KOR은 확실히 불완전
        if iso3 in min_expected and info.get('rows_inserted', 0) < min_expected[iso3]:
            print(f'  리셋: {iso3} (rows: {info.get(\"rows_inserted\", 0)}, 예상: {min_expected[iso3]}+)')
            info['status'] = 'pending'
            info['rows_inserted'] = 0
            reset_count += 1

if reset_count > 0:
    with open(progress_file, 'w') as f:
        json.dump(progress, f, indent=2)
    print(f'{reset_count}개 국가 리셋 완료')
else:
    print('리셋 필요 없음')
" 2>&1
}

# 메인 루프
retry=0
while [ $retry -lt $MAX_RETRIES ]; do
    progress=$(check_progress)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 현재 진행: $progress (시도 $((retry+1))/$MAX_RETRIES)"

    # 53/53이면 완료
    done_num=$(echo "$progress" | cut -d'/' -f1)
    total_num=$(echo "$progress" | cut -d'/' -f2)

    if [ "$done_num" = "$total_num" ] && [ "$total_num" = "53" ]; then
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ AGR 53/53 전체 완료!"
        echo "=========================================="

        # KOR 재확인
        reset_incomplete_countries
        new_progress=$(check_progress)
        new_done=$(echo "$new_progress" | cut -d'/' -f1)

        if [ "$new_done" = "53" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 진짜 완료! 종료합니다."
            break
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 불완전 국가 발견, 재실행..."
        fi
    fi

    # import 실행
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] import_agr_all.py 실행..."
    cd ~/potal
    python3 import_agr_all.py 2>&1
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 정상 완료 (exit 0)"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ 에러 발생 (exit $exit_code), ${RETRY_DELAY}초 후 재시작..."
        sleep $RETRY_DELAY
    fi

    retry=$((retry+1))
done

echo "=========================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] AGR Resilient 임포트 종료"
echo "=========================================="
