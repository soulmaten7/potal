#!/bin/bash
# KOR (KR) AGR 데이터 배치 삭제 v3
# 200K id 범위씩, 에러 시 자동 대기

PROJECT_ID="zyurflkhiregundhisky"
TOKEN="sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"
RANGE=200000
BATCH=0

echo "=== KOR (KR) AGR 삭제 v3 시작 ==="

while true; do
    # 남은 행 확인
    for retry in 1 2 3; do
        CHECK=$(curl -s --max-time 45 -X POST \
            "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"query": "SELECT id FROM macmap_agr_rates WHERE reporter_iso2 = '\''KR'\'' LIMIT 1;"}')

        if [ "$CHECK" = "[]" ]; then
            echo "=== 삭제 완료! 총 배치: $BATCH ==="
            exit 0
        fi

        ID=$(echo "$CHECK" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'])" 2>/dev/null)
        if [ -n "$ID" ]; then
            break
        fi
        echo "  체크 실패 (시도 $retry/3), 20초 대기"
        sleep 20
    done

    if [ -z "$ID" ]; then
        echo "3회 시도 실패, 60초 대기 후 재시도"
        sleep 60
        continue
    fi

    END_ID=$((ID + RANGE))
    BATCH=$((BATCH + 1))
    echo -n "[$(date '+%H:%M:%S')] 배치 #$BATCH: id $ID ~ $END_ID ... "

    for retry in 1 2 3; do
        RESULT=$(curl -s --max-time 80 -X POST \
            "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"DELETE FROM macmap_agr_rates WHERE reporter_iso2 = 'KR' AND id BETWEEN $ID AND $END_ID;\"}")

        if echo "$RESULT" | grep -qi '"message"'; then
            echo -n "에러(시도 $retry) "
            sleep $((retry * 15))
        else
            echo "완료"
            break
        fi
    done

    sleep 3
done
