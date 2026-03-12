#!/bin/bash
# KOR (KR) AGR 데이터 배치 삭제 — 큰 배치 버전
# id 범위 500K씩 삭제 (약 50K 행/배치)

PROJECT_ID="zyurflkhiregundhisky"
TOKEN="sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"
RANGE=500000
DELETED_TOTAL=0

echo "=== KOR (KR) AGR 데이터 삭제 시작 (fast) ==="

while true; do
    # 남은 KR 행 확인
    CHECK=$(curl -s --max-time 30 -X POST \
        "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"query": "SELECT id FROM macmap_agr_rates WHERE reporter_iso2 = '\''KR'\'' LIMIT 1;"}')

    if [ "$CHECK" = "[]" ]; then
        echo "=== 삭제 완료! ==="
        break
    fi

    if echo "$CHECK" | grep -q '"message"'; then
        echo "API 에러, 15초 대기: $(echo $CHECK | head -c 100)"
        sleep 15
        continue
    fi

    ID=$(echo "$CHECK" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
    if [ -z "$ID" ]; then
        echo "ID 파싱 실패, 15초 대기"
        sleep 15
        continue
    fi

    END_ID=$((ID + RANGE))
    echo -n "[$(date '+%H:%M:%S')] 삭제 중 id $ID ~ $END_ID ... "

    RESULT=$(curl -s --max-time 90 -X POST \
        "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"DELETE FROM macmap_agr_rates WHERE reporter_iso2 = 'KR' AND id BETWEEN $ID AND $END_ID;\"}")

    if echo "$RESULT" | grep -q '"message"'; then
        echo "에러! 줄여서 재시도"
        # 에러나면 범위를 반으로 줄여서 재시도
        HALF=$((RANGE / 2))
        END_ID=$((ID + HALF))
        RESULT=$(curl -s --max-time 90 -X POST \
            "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"DELETE FROM macmap_agr_rates WHERE reporter_iso2 = 'KR' AND id BETWEEN $ID AND $END_ID;\"}")
        if echo "$RESULT" | grep -q '"message"'; then
            echo "  반으로 줄여도 실패, 20초 대기"
            sleep 20
            continue
        fi
    fi

    DELETED_TOTAL=$((DELETED_TOTAL + 1))
    echo "완료 (배치 #$DELETED_TOTAL)"
    sleep 2
done
