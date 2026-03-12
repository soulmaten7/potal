#!/bin/bash
# KOR (KR) AGR 배치 삭제 — 최종 버전
# Management API + 100K id 범위 + 에러 복구 + curl 타임아웃 감지

PROJECT_ID="zyurflkhiregundhisky"
TOKEN="sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"
RANGE=100000
BATCH=0
ERRORS=0
MAX_ERRORS=10

echo "=== KOR (KR) AGR 삭제 최종 시작 $(date) ==="

while true; do
    # 남은 행 확인
    FOUND=false
    for retry in 1 2 3 4 5; do
        CHECK=$(curl -s --max-time 45 -X POST \
            "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"query": "SELECT id FROM macmap_agr_rates WHERE reporter_iso2 = '\''KR'\'' LIMIT 1;"}' 2>/dev/null)

        if [ "$CHECK" = "[]" ]; then
            echo "=== 삭제 완료! 총 배치: $BATCH 에러: $ERRORS ==="
            echo "완료 시간: $(date)"
            exit 0
        fi

        ID=$(echo "$CHECK" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
        if [ -n "$ID" ]; then
            FOUND=true
            break
        fi
        echo "  체크 실패 (시도 $retry/5), $(($retry * 10))초 대기"
        sleep $(($retry * 10))
    done

    if [ "$FOUND" = false ]; then
        ERRORS=$((ERRORS + 1))
        if [ $ERRORS -ge $MAX_ERRORS ]; then
            echo "=== 에러 $MAX_ERRORS회 초과, 중단 ==="
            exit 1
        fi
        echo "체크 5회 실패, 120초 대기 후 재시도"
        sleep 120
        continue
    fi

    END_ID=$((ID + RANGE))
    BATCH=$((BATCH + 1))

    # 삭제 실행
    RESULT=$(curl -s --max-time 85 -X POST \
        "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"DELETE FROM macmap_agr_rates WHERE reporter_iso2 = 'KR' AND id BETWEEN $ID AND $END_ID;\"}" 2>/dev/null)

    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 28 ]; then
        # curl 타임아웃 — DB에서는 아직 실행 중일 수 있음
        echo "[$(date '+%H:%M:%S')] 배치 #$BATCH: id $ID~$END_ID — curl 타임아웃, 30초 대기"
        sleep 30
    elif echo "$RESULT" | grep -qi '"message"'; then
        echo "[$(date '+%H:%M:%S')] 배치 #$BATCH: id $ID~$END_ID — DB 에러, 30초 대기"
        sleep 30
    else
        echo "[$(date '+%H:%M:%S')] 배치 #$BATCH: id $ID~$END_ID — 완료"
        sleep 2
    fi
done
