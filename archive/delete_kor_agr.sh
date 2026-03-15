#!/bin/bash
# KOR (KR) AGR 데이터 배치 삭제 스크립트
# Cloudflare 100초 타임아웃 때문에 배치로 나눠서 삭제

PROJECT_ID="zyurflkhiregundhisky"
TOKEN="sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"
BATCH=10000
DELETED_TOTAL=0

echo "=== KOR (KR) AGR 데이터 삭제 시작 ==="

while true; do
    # 존재 확인 (빠른 LIMIT 1 쿼리)
    CHECK=$(curl -s --max-time 30 -X POST \
        "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"query": "SELECT id FROM macmap_agr_rates WHERE reporter_iso2 = '\''KR'\'' LIMIT 1;"}')

    # 빈 배열이면 삭제 완료
    if [ "$CHECK" = "[]" ]; then
        echo "=== 삭제 완료! 총 삭제: ~$DELETED_TOTAL 행 ==="
        break
    fi

    # JSON 파싱 에러 체크
    if echo "$CHECK" | grep -q '"message"'; then
        echo "API 에러, 10초 대기 후 재시도: $CHECK"
        sleep 10
        continue
    fi

    # id 추출
    ID=$(echo "$CHECK" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
    if [ -z "$ID" ]; then
        echo "ID 파싱 실패, 10초 대기: $CHECK"
        sleep 10
        continue
    fi

    # 해당 id부터 BATCH개 삭제
    END_ID=$((ID + BATCH * 10))  # id가 연속이 아닐 수 있으므로 넉넉하게
    RESULT=$(curl -s --max-time 80 -X POST \
        "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"DELETE FROM macmap_agr_rates WHERE reporter_iso2 = 'KR' AND id BETWEEN $ID AND $END_ID;\"}")

    if echo "$RESULT" | grep -q '"message"'; then
        echo "삭제 에러, 5초 대기: $RESULT"
        sleep 5
        continue
    fi

    DELETED_TOTAL=$((DELETED_TOTAL + BATCH))
    echo "[$(date '+%H:%M:%S')] 삭제 진행 중... ~$DELETED_TOTAL 행 (id $ID ~ $END_ID)"
    sleep 1  # API 부하 방지
done
